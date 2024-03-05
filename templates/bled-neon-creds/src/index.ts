import cookie from "@/auth/middleware";
import { Elysia } from "elysia";
import { router as auth } from "./routes/auth";

const app = new Elysia()
  .use(auth)
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
