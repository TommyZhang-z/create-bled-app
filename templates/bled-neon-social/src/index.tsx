import cookie from "@/auth/middleware";
import { router as GoogleRouter } from "@/routes/social/github";
import { html } from "@elysiajs/html";
import { Elysia } from "elysia";

const app = new Elysia()
  .use(html())
  .use(cookie)
  .use(GoogleRouter)
  .get("/", (context) => (
    <html lang="en">
      <head>
        <title>Hello World</title>
      </head>
      <body>
        <h1>Sign in</h1>
        <a href="/login/github">Sign in with GitHub</a>
        {context.user && <p>{context.user.username}</p>}
      </body>
    </html>
  ))
  .get("/protected", async (context) => {
    if (!context.user) {
      context.set.status = 401;
      return "Unauthorized";
    }
    return "Protected route" + JSON.stringify(context.user);
  })
  .post("/protected", async (context) => {
    if (!context.user) {
      context.set.status = 401;
      return "Unauthorized";
    }
    console.log(context.user);
    return "Protected route";
  })
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
