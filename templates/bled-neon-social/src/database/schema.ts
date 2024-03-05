// import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// // lucid auth
// export const users = sqliteTable("users", {
//   id: text("id").notNull().primaryKey(),
//   githubId: integer("github_id").notNull().unique(),
//   username: text("username").notNull(),
// });

// export const sessions = sqliteTable("sessions", {
//   id: text("id").notNull().primaryKey(),
//   userId: text("user_id")
//     .notNull()
//     .references(() => users.id),
//   expiresAt: integer("expires_at").notNull(),
// });

import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  githubId: text("github_id").notNull().unique(),
});

export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
});

export interface DatabaseUser {
  id: string;
  username: string;
  github_id: number;
}
