import { boolean, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// lucid auth
export const users = pgTable("users", {
  id: text("id").notNull().primaryKey(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").notNull().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
});

export const verificationCodes = pgTable("verification_codes", {
  id: serial("id").notNull().primaryKey(),
  code: text("code").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const passwordResetCodes = pgTable("password_reset_codes", {
  id: text("id").notNull().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
});

export interface DatabaseUser {
  id: string;
  email: string;
  emailVerified: boolean;
  password: string;
}
