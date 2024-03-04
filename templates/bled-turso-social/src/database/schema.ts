import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// lucid auth
export const users = sqliteTable("users", {
  id: text("id").notNull().primaryKey(),
  githubId: integer("github_id").notNull().unique(),
  username: text("username").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").notNull().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: integer("expires_at").notNull(),
});

export interface DatabaseUser {
  id: string;
  username: string;
  github_id: number;
}
