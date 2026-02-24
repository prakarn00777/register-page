"use server";

import { db } from "@/lib/db";
import { generatePin, signToken, createSuccess, createError } from "@/lib/utils";
import { createCustomerSheet, readProceduresFromSheet, readProductsFromSheet } from "@/lib/google-sheets-onboarding";
import { cookies } from "next/headers";
import type { OnboardingSession, ProductType, ClinicData, BranchData, ApiResponse } from "@/types";

// ============================================
// Get Session Status (public, no auth needed)
// ============================================
export async function getSessionStatus(token: string): Promise<ApiResponse<{
    status: string;
    product: ProductType | null;
    needsPin: boolean;
}>> {
    try {
        const { data: session, error } = await db
            .from("onboarding_sessions")
            .select("status, product, pin")
            .eq("token", token)
            .single();

        if (error || !session) return createError("ไม่พบข้อมูล กรุณาตรวจสอบลิงก์อีกครั้ง");

        return createSuccess({
            status: session.status,
            product: session.product,
            needsPin: session.status !== "pending",
        });
    } catch (e) {
        console.error("getSessionStatus error:", e);
        return createError("เกิดข้อผิดพลาด");
    }
}

// ============================================
// Select Product (first-time entry)
// ============================================
export async function selectProduct(token: string, product: ProductType): Promise<ApiResponse<{ success: boolean }>> {
    try {
        const { data: session, error: fetchError } = await db
            .from("onboarding_sessions")
            .select("id, expires_at")
            .eq("token", token)
            .single();

        if (fetchError || !session) return createError("ไม่พบข้อมูล");

        if (new Date(session.expires_at) < new Date()) {
            return createError("ลิงก์หมดอายุแล้ว กรุณาติดต่อทีม CS");
        }

        const { error } = await db
            .from("onboarding_sessions")
            .update({ product, status: "in_progress" })
            .eq("token", token);

        if (error) return createError("บันทึกข้อมูลไม่สำเร็จ");

        // Set session cookie
        const signature = signToken(token);
        const cookieStore = await cookies();
        cookieStore.set("onboarding_session", `${token}.${signature}`, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30,
            path: "/",
        });

        // Log activity
        await db.from("onboarding_activity_log").insert({
            session_id: session.id,
            action: "created",
            actor: "customer",
            metadata: { product },
        });

        return createSuccess({ success: true });
    } catch (e) {
        console.error("selectProduct error:", e);
        return createError("เกิดข้อผิดพลาด");
    }
}

// ============================================
// PIN Verification
// ============================================
export async function verifyPin(token: string, pin: string): Promise<ApiResponse<{ session: OnboardingSession }>> {
    try {
        // Fetch session by token
        const { data: session, error } = await db
            .from("onboarding_sessions")
            .select("*")
            .eq("token", token)
            .single();

        if (error || !session) return createError("ไม่พบข้อมูล กรุณาตรวจสอบลิงก์อีกครั้ง");

        // Check expiry
        if (new Date(session.expires_at) < new Date()) {
            return createError("ลิงก์หมดอายุแล้ว กรุณาติดต่อทีม CS");
        }

        // Check lock
        if (session.pin_locked_at) {
            const lockExpiry = new Date(session.pin_locked_at);
            lockExpiry.setMinutes(lockExpiry.getMinutes() + 15);
            if (new Date() < lockExpiry) {
                return createError("กรอก PIN ผิดหลายครั้ง กรุณารอ 15 นาที");
            }
            // Lock expired, reset
            await db.from("onboarding_sessions")
                .update({ pin_attempts: 0, pin_locked_at: null })
                .eq("id", session.id);
        }

        // Verify PIN
        if (session.pin !== pin) {
            const attempts = (session.pin_attempts || 0) + 1;
            const updates: Record<string, unknown> = { pin_attempts: attempts };
            if (attempts >= 5) {
                updates.pin_locked_at = new Date().toISOString();
            }
            await db.from("onboarding_sessions").update(updates).eq("id", session.id);
            return createError(`PIN ไม่ถูกต้อง (เหลืออีก ${5 - attempts} ครั้ง)`);
        }

        // Reset attempts on success
        await db.from("onboarding_sessions")
            .update({ pin_attempts: 0, pin_locked_at: null })
            .eq("id", session.id);

        // Set session cookie
        const signature = signToken(token);
        const cookieStore = await cookies();
        cookieStore.set("onboarding_session", `${token}.${signature}`, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: "/",
        });

        // Log activity
        await db.from("onboarding_activity_log").insert({
            session_id: session.id,
            action: "pin_verified",
            actor: "customer",
        });

        return createSuccess({ session });
    } catch (e) {
        console.error("verifyPin error:", e);
        return createError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    }
}

// ============================================
// Get Session (from cookie)
// ============================================
export async function getSessionFromCookie(): Promise<ApiResponse<{ session: OnboardingSession }>> {
    try {
        const cookieStore = await cookies();
        const cookie = cookieStore.get("onboarding_session")?.value;
        if (!cookie) return createError("กรุณาเข้าสู่ระบบด้วย PIN");

        const [token, signature] = cookie.split(".");
        const expectedSig = signToken(token);
        if (signature !== expectedSig) return createError("Session ไม่ถูกต้อง");

        const { data: session, error } = await db
            .from("onboarding_sessions")
            .select("*")
            .eq("token", token)
            .single();

        if (error || !session) return createError("ไม่พบข้อมูล");

        return createSuccess({ session });
    } catch (e) {
        console.error("getSessionFromCookie error:", e);
        return createError("เกิดข้อผิดพลาด");
    }
}

// ============================================
// Save Step Data (auto-save)
// ============================================
export async function saveStepData(
    token: string,
    step: number,
    data: ClinicData | BranchData[]
): Promise<ApiResponse<{ saved: boolean }>> {
    try {
        const updates: Record<string, unknown> = {
            current_step: step,
            status: "in_progress",
        };

        if (step === 1) {
            updates.clinic_data = data;
            const clinicData = data as ClinicData;
            if (clinicData.clinicNameTh) {
                updates.customer_name = clinicData.clinicNameTh;
            }
        } else if (step === 2) {
            updates.branch_data = data;
        }

        const { error } = await db
            .from("onboarding_sessions")
            .update(updates)
            .eq("token", token);

        if (error) return createError("บันทึกข้อมูลไม่สำเร็จ");

        // Log activity
        const { data: session } = await db
            .from("onboarding_sessions")
            .select("id")
            .eq("token", token)
            .single();

        if (session) {
            await db.from("onboarding_activity_log").insert({
                session_id: session.id,
                action: "step_completed",
                step,
                actor: "customer",
            });
        }

        return createSuccess({ saved: true });
    } catch (e) {
        console.error("saveStepData error:", e);
        return createError("เกิดข้อผิดพลาด");
    }
}

// ============================================
// Submit Onboarding
// ============================================
export async function submitOnboarding(token: string, pin?: string): Promise<ApiResponse<{ submitted: boolean }>> {
    try {
        const updates: Record<string, unknown> = {
            status: "submitted",
            submitted_at: new Date().toISOString(),
        };
        if (pin) updates.pin = pin;

        const { error } = await db
            .from("onboarding_sessions")
            .update(updates)
            .eq("token", token);

        if (error) return createError("ส่งข้อมูลไม่สำเร็จ");

        // Log activity
        const { data: session } = await db
            .from("onboarding_sessions")
            .select("id")
            .eq("token", token)
            .single();

        if (session) {
            await db.from("onboarding_activity_log").insert({
                session_id: session.id,
                action: "submitted",
                actor: "customer",
            });
        }

        return createSuccess({ submitted: true });
    } catch (e) {
        console.error("submitOnboarding error:", e);
        return createError("เกิดข้อผิดพลาด");
    }
}

// ============================================
// Customer: Create Session (self-registration via general link)
// ============================================
export async function createCustomerSession(product: ProductType): Promise<ApiResponse<{ token: string }>> {
    try {
        const { data, error } = await db
            .from("onboarding_sessions")
            .insert({
                customer_name: "",
                pin: "",
                product,
                status: "in_progress",
                created_by: null,
            })
            .select("token")
            .single();

        if (error || !data) return createError("สร้างข้อมูลไม่สำเร็จ");

        // Set session cookie
        const signature = signToken(data.token);
        const cookieStore = await cookies();
        cookieStore.set("onboarding_session", `${data.token}.${signature}`, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30,
            path: "/",
        });

        // Log activity
        const { data: session } = await db
            .from("onboarding_sessions")
            .select("id")
            .eq("token", data.token)
            .single();

        if (session) {
            await db.from("onboarding_activity_log").insert({
                session_id: session.id,
                action: "created",
                actor: "customer",
                metadata: { product, method: "self_registration" },
            });
        }

        return createSuccess({ token: data.token });
    } catch (e) {
        console.error("createCustomerSession error:", e);
        return createError("เกิดข้อผิดพลาด");
    }
}

// ============================================
// Customer: Find Session by Phone + PIN (return to edit)
// ============================================
export async function findSessionByPhoneAndPin(phone: string, pin: string): Promise<ApiResponse<{ token: string }>> {
    try {
        if (!phone || !pin) return createError("กรุณากรอกเบอร์โทรและ PIN");

        const { data: session, error } = await db
            .from("onboarding_sessions")
            .select("*")
            .contains("clinic_data", { ownerPhone: phone })
            .eq("pin", pin)
            .in("status", ["in_progress", "submitted"])
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (error || !session) return createError("ไม่พบข้อมูล กรุณาตรวจสอบเบอร์โทรและ PIN");

        // Reset status to in_progress and jump to review step
        await db
            .from("onboarding_sessions")
            .update({ status: "in_progress", current_step: 5 })
            .eq("id", session.id);

        // Set session cookie
        const signature = signToken(session.token);
        const cookieStore = await cookies();
        cookieStore.set("onboarding_session", `${session.token}.${signature}`, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30,
            path: "/",
        });

        // Log activity
        await db.from("onboarding_activity_log").insert({
            session_id: session.id,
            action: "pin_verified",
            actor: "customer",
            metadata: { method: "phone_pin_lookup" },
        });

        return createSuccess({ token: session.token });
    } catch (e) {
        console.error("findSessionByPhoneAndPin error:", e);
        return createError("เกิดข้อผิดพลาด");
    }
}

// ============================================
// Console: Register Customer (new onboard flow)
// ============================================
export async function registerCustomer(
    product: ProductType,
    clinicData: ClinicData,
    branchData: BranchData[],
    pin: string
): Promise<ApiResponse<{ token: string }>> {
    try {
        if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
            return createError("PIN ต้องเป็นตัวเลข 6 หลัก");
        }
        if (!clinicData.clinicNameTh?.trim()) {
            return createError("กรุณากรอกชื่อร้าน/คลินิก");
        }
        if (!clinicData.ownerPhone?.trim()) {
            return createError("กรุณากรอกเบอร์โทร");
        }

        const { data, error } = await db
            .from("onboarding_sessions")
            .insert({
                customer_name: clinicData.clinicNameTh.trim(),
                pin,
                product,
                status: "in_progress",
                clinic_data: clinicData,
                branch_data: branchData,
                created_by: null,
            })
            .select("token")
            .single();

        if (error || !data) return createError("สร้างข้อมูลไม่สำเร็จ");

        // Set session cookie
        const signature = signToken(data.token);
        const cookieStore = await cookies();
        cookieStore.set("onboarding_session", `${data.token}.${signature}`, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30,
            path: "/",
        });

        // Log activity
        const { data: session } = await db
            .from("onboarding_sessions")
            .select("id")
            .eq("token", data.token)
            .single();

        if (session) {
            await db.from("onboarding_activity_log").insert({
                session_id: session.id,
                action: "created",
                actor: "customer",
                metadata: { product, method: "self_registration_v2" },
            });
        }

        return createSuccess({ token: data.token });
    } catch (e) {
        console.error("registerCustomer error:", e);
        return createError("เกิดข้อผิดพลาด");
    }
}

// ============================================
// Console: Get Session (for console pages)
// ============================================
export async function getConsoleSession(): Promise<ApiResponse<{ session: OnboardingSession }>> {
    return getSessionFromCookie();
}

// ============================================
// Console: Update Clinic Data
// ============================================
export async function updateClinicData(clinicData: ClinicData): Promise<ApiResponse<{ saved: boolean }>> {
    try {
        const sessionResult = await getSessionFromCookie();
        if (!sessionResult.success) return createError(sessionResult.error);
        const { session } = sessionResult.data;

        if (session.status === "submitted" || session.status === "approved") {
            return createError("ไม่สามารถแก้ไขได้ ข้อมูลถูกส่งหรืออนุมัติแล้ว");
        }

        const updates: Record<string, unknown> = { clinic_data: clinicData };
        if (clinicData.clinicNameTh) {
            updates.customer_name = clinicData.clinicNameTh;
        }

        const { error } = await db
            .from("onboarding_sessions")
            .update(updates)
            .eq("id", session.id);

        if (error) return createError("บันทึกข้อมูลไม่สำเร็จ");
        return createSuccess({ saved: true });
    } catch (e) {
        console.error("updateClinicData error:", e);
        return createError("เกิดข้อผิดพลาด");
    }
}

// ============================================
// Console: Update Branch Data
// ============================================
export async function updateBranchData(branchData: BranchData[]): Promise<ApiResponse<{ saved: boolean }>> {
    try {
        const sessionResult = await getSessionFromCookie();
        if (!sessionResult.success) return createError(sessionResult.error);
        const { session } = sessionResult.data;

        if (session.status === "submitted" || session.status === "approved") {
            return createError("ไม่สามารถแก้ไขได้ ข้อมูลถูกส่งหรืออนุมัติแล้ว");
        }

        const { error } = await db
            .from("onboarding_sessions")
            .update({ branch_data: branchData })
            .eq("id", session.id);

        if (error) return createError("บันทึกข้อมูลไม่สำเร็จ");
        return createSuccess({ saved: true });
    } catch (e) {
        console.error("updateBranchData error:", e);
        return createError("เกิดข้อผิดพลาด");
    }
}

// ============================================
// Console: Change PIN
// ============================================
export async function changePin(
    oldPin: string,
    newPin: string
): Promise<ApiResponse<{ changed: boolean }>> {
    try {
        const sessionResult = await getSessionFromCookie();
        if (!sessionResult.success) return createError(sessionResult.error);
        const { session } = sessionResult.data;

        if (session.pin !== oldPin) return createError("PIN เดิมไม่ถูกต้อง");
        if (!newPin || newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
            return createError("PIN ใหม่ต้องเป็นตัวเลข 6 หลัก");
        }

        const { error } = await db
            .from("onboarding_sessions")
            .update({ pin: newPin })
            .eq("id", session.id);

        if (error) return createError("เปลี่ยน PIN ไม่สำเร็จ");
        return createSuccess({ changed: true });
    } catch (e) {
        console.error("changePin error:", e);
        return createError("เกิดข้อผิดพลาด");
    }
}

// ============================================
// Console: Submit for Review
// ============================================
export async function submitForReview(): Promise<ApiResponse<{ submitted: boolean }>> {
    try {
        const sessionResult = await getSessionFromCookie();
        if (!sessionResult.success) return createError(sessionResult.error);
        const { session } = sessionResult.data;

        if (session.status === "submitted") return createError("ข้อมูลถูกส่งแล้ว");
        if (session.status === "approved") return createError("ข้อมูลได้รับการอนุมัติแล้ว");

        const { error } = await db
            .from("onboarding_sessions")
            .update({ status: "submitted", submitted_at: new Date().toISOString() })
            .eq("id", session.id);

        if (error) return createError("ส่งข้อมูลไม่สำเร็จ");

        await db.from("onboarding_activity_log").insert({
            session_id: session.id,
            action: "submitted",
            actor: "customer",
        });

        return createSuccess({ submitted: true });
    } catch (e) {
        console.error("submitForReview error:", e);
        return createError("เกิดข้อผิดพลาด");
    }
}

// ============================================
// Console: Create Google Sheet (on-demand)
// ============================================
export async function createSheetForSession(): Promise<ApiResponse<{ sheetUrl: string }>> {
    try {
        const sessionResult = await getSessionFromCookie();
        if (!sessionResult.success) return createError(sessionResult.error);
        const { session } = sessionResult.data;

        if (session.sheet_id) {
            return createSuccess({ sheetUrl: session.sheet_url || "" });
        }

        const customerName = session.customer_name || "Customer";
        const sheet = await createCustomerSheet(customerName);
        if (!sheet) {
            return createError("ไม่สามารถสร้าง Google Sheet ได้ กรุณาตรวจสอบการตั้งค่า");
        }

        await db
            .from("onboarding_sessions")
            .update({ sheet_id: sheet.spreadsheetId, sheet_url: sheet.url })
            .eq("id", session.id);

        return createSuccess({ sheetUrl: sheet.url });
    } catch (e) {
        console.error("createSheetForSession error:", e);
        return createError("เกิดข้อผิดพลาด");
    }
}

// ============================================
// Console: Logout
// ============================================
export async function logoutSession(): Promise<ApiResponse<{ loggedOut: boolean }>> {
    try {
        const cookieStore = await cookies();
        cookieStore.delete("onboarding_session");
        return createSuccess({ loggedOut: true });
    } catch (e) {
        console.error("logoutSession error:", e);
        return createError("เกิดข้อผิดพลาด");
    }
}

// ============================================
// Console: Login (phone + PIN) — replaces findSessionByPhoneAndPin for console
// ============================================
export async function loginWithPhoneAndPin(phone: string, pin: string): Promise<ApiResponse<{ token: string }>> {
    try {
        if (!phone?.trim() || !pin?.trim()) return createError("กรุณากรอกเบอร์โทรและ PIN");

        const { data: session, error } = await db
            .from("onboarding_sessions")
            .select("*")
            .contains("clinic_data", { ownerPhone: phone.trim() })
            .eq("pin", pin.trim())
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (error || !session) return createError("ไม่พบข้อมูล กรุณาตรวจสอบเบอร์โทรและ PIN");

        // Set session cookie
        const signature = signToken(session.token);
        const cookieStore = await cookies();
        cookieStore.set("onboarding_session", `${session.token}.${signature}`, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30,
            path: "/",
        });

        // Log activity
        await db.from("onboarding_activity_log").insert({
            session_id: session.id,
            action: "pin_verified",
            actor: "customer",
            metadata: { method: "console_login" },
        });

        return createSuccess({ token: session.token });
    } catch (e) {
        console.error("loginWithPhoneAndPin error:", e);
        return createError("เกิดข้อผิดพลาด");
    }
}

// ============================================
// Admin: Create Onboarding Session
// ============================================
export async function createOnboardingSession(
    customerName: string,
    createdBy: string
): Promise<ApiResponse<{ token: string; pin: string; url: string; sheetUrl: string }>> {
    try {
        const pin = generatePin();

        // Create Google Sheet from template (disabled in v1)
        let sheetId = null;
        let sheetUrl = null;
        try {
            const sheet = await createCustomerSheet(customerName);
            if (sheet) {
                sheetId = sheet.spreadsheetId;
                sheetUrl = sheet.url;
            }
        } catch (e) {
            console.warn("Google Sheet creation failed (continuing without):", e);
        }

        const { data, error } = await db
            .from("onboarding_sessions")
            .insert({
                customer_name: customerName,
                pin,
                created_by: createdBy,
                sheet_id: sheetId,
                sheet_url: sheetUrl,
            })
            .select("token")
            .single();

        if (error || !data) return createError("สร้าง onboarding ไม่สำเร็จ");

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
        const url = `${baseUrl}/onboard/${data.token}`;

        return createSuccess({ token: data.token, pin, url, sheetUrl: sheetUrl || "" });
    } catch (e) {
        console.error("createOnboardingSession error:", e);
        return createError("เกิดข้อผิดพลาด");
    }
}

// ============================================
// Admin: List Sessions
// ============================================
export async function getOnboardingSessions(): Promise<OnboardingSession[]> {
    const { data, error } = await db
        .from("onboarding_sessions")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("getOnboardingSessions error:", error);
        return [];
    }

    return data || [];
}

// ============================================
// Admin: Get Detail with Sheet Data
// ============================================
export async function getOnboardingDetail(id: number): Promise<ApiResponse<{
    session: OnboardingSession;
    procedures: { index: number; code: string; name: string; nameEn: string; category: string; price: number; duration: number; note: string }[];
    products: { index: number; code: string; name: string; category: string; unit: string; costPrice: number; sellPrice: number; note: string }[];
}>> {
    try {
        const { data: session, error } = await db
            .from("onboarding_sessions")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !session) return createError("ไม่พบข้อมูล");

        let procedures: { index: number; code: string; name: string; nameEn: string; category: string; price: number; duration: number; note: string }[] = [];
        let products: { index: number; code: string; name: string; category: string; unit: string; costPrice: number; sellPrice: number; note: string }[] = [];

        if (session.sheet_id) {
            try {
                procedures = await readProceduresFromSheet(session.sheet_id);
                products = await readProductsFromSheet(session.sheet_id);
            } catch (e) {
                console.warn("Failed to read sheet data:", e);
            }
        }

        return createSuccess({ session, procedures, products });
    } catch (e) {
        console.error("getOnboardingDetail error:", e);
        return createError("เกิดข้อผิดพลาด");
    }
}
