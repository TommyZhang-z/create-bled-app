import { lucia } from "@/auth";
import cookie from "@/auth/middleware";
import { db } from "@/database";
import { Elysia } from "elysia";

export const context = new Elysia({
  name: "@app/context",
})
  .use(cookie)
  .decorate("db", db)
  .decorate("lucia", lucia);

export default context;
