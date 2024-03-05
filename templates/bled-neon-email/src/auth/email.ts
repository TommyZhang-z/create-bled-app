import { db } from "@/database";
import { passwordResetCodes, verificationCodes } from "@/database/schema";
import { transporter } from "@/utils/email";
import { eq } from "drizzle-orm";
import { generateId } from "lucia";
import { TimeSpan, createDate } from "oslo";
import { alphabet, generateRandomString } from "oslo/crypto";

export async function sendVerificationCode(
  email: string,
  code: string
): Promise<void> {
  await transporter.sendMail({
    from: process.env.EMAIL!,
    to: email,
    subject: "Email Verification",
    text: `Your email verification code is: ${code}`,
  });
}

export async function generateEmailVerificationCode(
  userId: string,
  email: string
): Promise<string> {
  await db
    .delete(verificationCodes)
    .where(eq(verificationCodes.userId, userId));
  const code = generateRandomString(8, alphabet("0-9"));
  await db.insert(verificationCodes).values({
    code,
    userId,
    email,
    expiresAt: createDate(new TimeSpan(5, "m")),
  });
  return code;
}

export async function sendPasswordResetToken(
  email: string,
  verificationLink: string
): Promise<void> {
  await transporter.sendMail({
    from: process.env.EMAIL!,
    to: email,
    subject: "Password Reset",
    text: `Click the link to reset your password: ${verificationLink}`,
  });
}

export async function createPasswordResetToken(
  userId: string
): Promise<string> {
  await db
    .delete(passwordResetCodes)
    .where(eq(passwordResetCodes.userId, userId));
  const tokenId = generateId(40);
  await db.insert(passwordResetCodes).values({
    id: tokenId,
    userId,
    expiresAt: createDate(new TimeSpan(2, "h")),
  });
  console.log({ tokenId });

  return tokenId;
}
