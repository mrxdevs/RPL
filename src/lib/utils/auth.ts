import { cookies } from "next/headers";
import { User, SessionData, UserRole } from "../types";

const SESSION_COOKIE_NAME = "rpl_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "rpl_raptee_secret_key_2026";

/**
 * Sign session data into a secure tamper-proof token using Web Crypto API.
 */
export async function createSessionToken(user: User): Promise<string> {
  const sessionData: SessionData = {
    userId: user.id,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    teamId: user.teamId,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const payload = Buffer.from(JSON.stringify(sessionData)).toString("base64url");
  const signature = await generateSignature(payload, SESSION_SECRET);
  return `${payload}.${signature}`;
}

/**
 * Verify and decode a session token.
 */
export async function verifySessionToken(token: string): Promise<SessionData | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payload, signature] = parts;
    const expectedSignature = await generateSignature(payload, SESSION_SECRET);

    if (signature !== expectedSignature) return null;

    const decodedStr = Buffer.from(payload, "base64url").toString("utf-8");
    const session = JSON.parse(decodedStr) as SessionData;

    if (Date.now() > session.expiresAt) return null;

    return session;
  } catch {
    return null;
  }
}

/**
 * Read current session from cookies in Server Components or API routes.
 */
export async function getCurrentSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Check if the current session has one of the allowed roles.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<SessionData | null> {
  const session = await getCurrentSession();
  if (!session) return null;
  if (!allowedRoles.includes(session.role)) return null;
  return session;
}

export { SESSION_COOKIE_NAME };

async function generateSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(data)
  );

  return Buffer.from(signatureBuffer).toString("base64url");
}
