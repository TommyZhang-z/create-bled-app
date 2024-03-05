import {
  createPasswordResetToken,
  generateEmailVerificationCode,
  sendPasswordResetToken,
  sendVerificationCode,
} from "@/auth/email";
import ctx from "@/context";
import {
  passwordResetCodes,
  users,
  verificationCodes,
} from "@/database/schema";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { generateId } from "lucia";
import { isWithinExpirationDate } from "oslo";

export const router = new Elysia({ prefix: "/auth" })
  .use(ctx)
  .post(
    "/signup",
    async ({ body, set, lucia, db }) => {
      const { email, password } = body;
      // validate username and password ...

      const hashedPassword = await Bun.password.hash(password);
      const userId = generateId(15);

      // check if username already exists
      const result = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, email),
      });

      // if username already exists, return 409
      if (result) {
        set.status = 409;
        return "Username already exists";
      }

      // insert user into database
      await db.insert(users).values({
        id: userId,
        email,
        emailVerified: false,
        password: hashedPassword,
      });

      const verificationCode = await generateEmailVerificationCode(
        userId,
        email
      );

      // send verification email ...
      await sendVerificationCode(email, verificationCode);

      // create session
      const session = await lucia.createSession(userId, {});

      set.status = 302;
      set.headers["Set-Cookie"] = lucia
        .createSessionCookie(session.id)
        .serialize();
      set.headers["Location"] = "/";
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .post(
    "/login",
    async ({ body, set, lucia, db }) => {
      const { email, password } = body;
      // validate username and password ...

      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, email),
      });

      // if user does not exist, return 401
      if (!existingUser) {
        // NOTE:
        // Returning immediately allows malicious actors to figure out valid usernames from response times,
        // allowing them to only focus on guessing passwords in brute-force attacks.
        // As a preventive measure, you may want to hash passwords even for invalid usernames.
        // However, valid usernames can be already be revealed with the signup page among other methods.
        // It will also be much more resource intensive.
        // Since protecting against this is none-trivial,
        // it is crucial your implementation is protected against brute-force attacks with login throttling etc.
        // If usernames are public, you may outright tell the user that the username is invalid.
        set.status = 401;
        return "Incorrect username or password";
      }

      // check if password is correct
      const validPassword = await Bun.password.verify(
        password,
        existingUser.password
      );

      // if password is incorrect, return 401
      if (!validPassword) {
        set.status = 401;
        return "Incorrect username or password";
      }

      // create session
      const session = await lucia.createSession(existingUser.id, {});

      // set session cookie
      set.status = 200;
      set.headers["Set-Cookie"] = lucia
        .createSessionCookie(session.id)
        .serialize();
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .post(
    "/email-verification",
    async ({ set, user, db, body, lucia }) => {
      if (!user) {
        set.status = 401;
        return "Unauthorized";
      }

      const { code } = body;
      const databaseCode = await db.query.verificationCodes.findFirst({
        where: (tokens, { eq }) => eq(tokens.userId, user.id),
      });

      if (!databaseCode || databaseCode.code !== code) {
        set.status = 400;
        return "Invalid code";
      }

      await db
        .delete(verificationCodes)
        .where(eq(verificationCodes.id, databaseCode.id));

      // convert databaseCode.expiresAt to Date
      if (
        !isWithinExpirationDate(new Date(databaseCode.expiresAt)) ||
        databaseCode.email !== user.email
      ) {
        set.status = 400;
        return "Invalid code";
      }

      await lucia.invalidateUserSessions(user.id);

      await db
        .update(users)
        .set({ emailVerified: true })
        .where(eq(users.id, user.id));

      const session = await lucia.createSession(user.id, {});

      set.status = 302;
      set.headers["Set-Cookie"] = lucia
        .createSessionCookie(session.id)
        .serialize();
      set.headers["Location"] = "/";
    },
    {
      body: t.Object({
        code: t.String(),
      }),
    }
  )
  .post(
    "/reset-password",
    async ({ set, db, body }) => {
      const { email } = body;

      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, email),
      });

      if (!user || !user.emailVerified) {
        set.status = 400;
        return "Invalid email";
      }

      const passwordResetToken = await createPasswordResetToken(user.id);
      const resetLink = `${process.env.APP_URL}/reset-password/${passwordResetToken}`;
      console.log({ resetLink });

      await sendPasswordResetToken(email, resetLink);

      set.status = 200;
    },
    {
      body: t.Object({
        email: t.String(),
      }),
    }
  )
  .post(
    "/reset-password/:token",
    async ({ set, db, body, lucia, params: { token } }) => {
      const { password } = body;

      const databaseToken = await db.query.passwordResetCodes.findFirst({
        where: (tokens, { eq }) => eq(tokens.id, token),
      });

      console.log({ databaseToken });

      if (token) {
        await db
          .delete(passwordResetCodes)
          .where(eq(passwordResetCodes.id, token));
      }

      if (
        !databaseToken ||
        !isWithinExpirationDate(new Date(databaseToken.expiresAt))
      ) {
        set.status = 400;
        return "Invalid token";
      }

      await lucia.invalidateUserSessions(databaseToken.userId);
      const hashedPassword = await Bun.password.hash(password);
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, databaseToken.userId));

      const session = await lucia.createSession(databaseToken.userId, {});
      set.status = 302;
      set.headers["Set-Cookie"] = lucia
        .createSessionCookie(session.id)
        .serialize();
      set.headers["Location"] = "/";
    },
    {
      body: t.Object({
        password: t.String(),
      }),
      params: t.Object({
        token: t.String(),
      }),
    }
  );
