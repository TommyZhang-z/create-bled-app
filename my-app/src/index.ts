import cookie from "@/auth/middleware";
import { Elysia } from "elysia";

const app = new Elysia()
  .use(cookie)
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
