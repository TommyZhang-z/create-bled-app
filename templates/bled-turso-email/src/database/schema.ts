import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// lucid auth
export const users = sqliteTable("users", {
  id: text("id").notNull().primaryKey(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").notNull().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: integer("expires_at").notNull(),
});

export const verificationCodes = sqliteTable("verification_codes", {
  id: integer("id").notNull().primaryKey(),
  code: text("code").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  email: text("email").notNull(),
  expiresAt: integer("expires_at").notNull(),
});

export const passwordResetCodes = sqliteTable("password_reset_codes", {
  id: text("id").notNull().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: integer("expires_at").notNull(),
});

export interface DatabaseUser {
  id: string;
  email: string;
  emailVerified: boolean;
  password: string;
}
