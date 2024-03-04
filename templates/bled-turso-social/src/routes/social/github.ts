import { github, lucia } from "@/auth";
import { db } from "@/database";
import { OAuth2RequestError, generateState } from "arctic";
import { generateId } from "lucia";
import { serializeCookie } from "oslo/cookie";

import { DatabaseUser, users } from "@/database/schema";
import { Elysia, t } from "elysia";

export const router = new Elysia({ prefix: "/login/github" })
  .get("/", async ({ set }) => {
    const state = generateState();
    const url = await github.createAuthorizationURL(state);
    set.headers["Set-Cookie"] = serializeCookie("github_oauth_state", state, {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 60 * 10,
      sameSite: "lax",
    });
    set.redirect = url.toString();
  })
  .get(
    "/callback",
    async ({ query, cookie, set }) => {
      const code = query.code;
      const state = query.state;
      const storedState = cookie.github_oauth_state.toString();

      if (!code || !state || !storedState || state !== storedState) {
        console.log(code, state, storedState);
        set.status = 400;
        return;
      }

      try {
        const tokens = await github.validateAuthorizationCode(code);
        const githubUserResponse = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        const githubUser: GitHubUser = await githubUserResponse.json();
        const existingUser = (await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.githubId, parseInt(githubUser.id)),
        })) as DatabaseUser | undefined;

        if (existingUser) {
          const session = await lucia.createSession(existingUser.id, {});
          set.headers["Set-Cookie"] = lucia
            .createSessionCookie(session.id)
            .serialize();
          set.redirect = "/";
          return;
        }

        const userId = generateId(15);
        await db.insert(users).values({
          id: userId,
          username: githubUser.login,
          githubId: parseInt(githubUser.id),
        });

        const session = await lucia.createSession(userId, {});
        set.headers["Set-Cookie"] = lucia
          .createSessionCookie(session.id)
          .serialize();
        set.redirect = "/";
      } catch (e) {
        if (
          e instanceof OAuth2RequestError &&
          e.message === "bad_verification_code"
        ) {
          set.status = 400;
          return;
        }
        console.log(e);

        set.status = 500;
        return;
      }
    },
    {
      query: t.Object({
        code: t.String(),
        state: t.String(),
      }),
      cookies: t.Object({
        github_oauth_state: t.String(),
      }),
    }
  );

interface GitHubUser {
  id: string;
  login: string;
}
