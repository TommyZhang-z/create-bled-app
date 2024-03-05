import { lucia } from "@/auth";
import { db } from "@/database";
import { users } from "@/database/schema";
import { Elysia, t } from "elysia";
import { generateId } from "lucia";

export const router = new Elysia({ prefix: "/auth" })
  .post(
    "/signup",
    async ({ body, set }) => {
      const { username, password } = body;
      // validate username and password ...

      const hashedPassword = await Bun.password.hash(password);
      const userId = generateId(15);

      // check if username already exists
      const result = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, username),
      });

      // if username already exists, return 409
      if (result) {
        set.status = 409;
        return "Username already exists";
      }

      // insert user into database
      await db
        .insert(users)
        .values({ id: userId, username, password: hashedPassword });

      // create session
      const session = await lucia.createSession(userId, {});

      // set session cookie
      set.status = 200;
      set.headers["Set-Cookie"] = lucia
        .createSessionCookie(session.id)
        .serialize();
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    }
  )
  .post(
    "/login",
    async ({ body, set }) => {
      const { username, password } = body;
      // validate username and password ...

      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, username),
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
        username: t.String(),
        password: t.String(),
      }),
    }
  );
