import { createHmac } from "crypto";

// Generate random 6-digit PIN
export function generatePin(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Sign session token with HMAC
export function signToken(token: string): string {
    const secret = process.env.SESSION_SECRET || "default-secret";
    return createHmac("sha256", secret).update(token).digest("hex");
}

// Verify signed session token
export function verifyToken(token: string, signature: string): boolean {
    const expected = signToken(token);
    return expected === signature;
}

// Format response helpers
export function createSuccess<T>(data: T) {
    return { success: true as const, data };
}

export function createError(message: string) {
    return { success: false as const, error: message };
}
