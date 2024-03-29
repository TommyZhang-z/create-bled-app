import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// lucid auth
export const users = sqliteTable("users", {
  id: text("id").notNull().primaryKey(),
});

export const sessions = sqliteTable("session", {
  id: text("id").notNull().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: integer("expires_at").notNull(),
});

export interface DatabaseUser {
  id: string;
}
