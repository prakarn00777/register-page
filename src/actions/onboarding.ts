"use server";

import { db } from "@/lib/db";
import { signToken, createSuccess, createError } from "@/lib/utils";
import { createCustomerSheet, readProceduresFromSheet, readProductsFromSheet } from "@/lib/google-sheets-onboarding";
import { sendOnboardingCodeEmail } from "@/lib/email";
import { cookies } from "next/headers";
import type { OnboardingSession, ProductType, SalesFormData, ClinicData, BranchData, ApiResponse } from "@/types";

// ============================================
// Code Generation
// ============================================
const CODE_CHARS = "ABCDEFGHJKMNPQRTWXY2345679"; // no 0/O/1/I/L/S/5

function randomChars(len: number): string {
    let result = "";
    for (let i = 0; i < len; i++) {
        result += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return result;
}

export async function generateCode(email: string): Promise<string> {
    // Take first 3 uppercase letters from email (before @)
    const localPart = email.split("@")[0] || "";
    const prefix = localPart
        .replace(/[^a-zA-Z]/g, "")
        .substring(0, 3)
        .toUpperCase()
        .padEnd(3, "X"); // pad if too short

    for (let attempt = 0; attempt < 10; attempt++) {
        const code = `${prefix}-${randomChars(4)}`;

        // Check uniqueness
        const { data } = await db
            .from("onboarding_sessions")
            .select("id")
            .eq("code", code)
            .maybeSingle();

        if (!data) return code;
    }

    // Fallback: fully random
    return `${randomChars(3)}-${randomChars(4)}`;
}

// ============================================
// Sales: Create Session (sales team fills form)
// ============================================
export async function createSalesSession(formData: SalesFormData): Promise<ApiResponse<{
    code: string;
    emailSent: boolean;
}>> {
    try {
        // Validate required fields
        if (!formData.customerNameTh?.trim()) return createError("กรุณากรอกชื่อร้าน/คลินิก (TH)");
        // customerNameEn is optional
        if (!formData.phone?.trim()) return createError("กรุณากรอกเบอร์โทร");
        if (!formData.email?.trim()) return createError("กรุณากรอกอีเมล");
        if (!formData.package?.trim()) return createError("กรุณาเลือก Package");
        if (!formData.product) return createError("กรุณาเลือกผลิตภัณฑ์");
        if (formData.branchCount < 1) return createError("จำนวนสาขาต้องอย่างน้อย 1");

        // Generate unique code from email prefix
        const code = await generateCode(formData.email.trim());

        // Generate default branches from branchCount
        const branches: BranchData[] = [];
        for (let i = 0; i < formData.branchCount; i++) {
            branches.push({
                name: i === 0 ? "สาขาหลัก" : `สาขา ${i + 1}`,
                address: "",
                phone: "",
                managerName: "",
                managerPhone: "",
                isMain: i === 0,
            });
        }

        // Insert session
        const { data, error } = await db
            .from("onboarding_sessions")
            .insert({
                customer_name: formData.customerNameTh.trim(),
                code,
                pin: "", // not used in v2
                product: formData.product,
                email: formData.email.trim(),
                contact_name: formData.contactName?.trim() || null,
                contact_address: formData.contactAddress?.trim() || null,
                package: formData.package?.trim() || null,
                sales_notes: formData.salesNotes?.trim() || null,
                contract_start: formData.contractStart || null,
                status: "pending",
                clinic_data: {
                    clinicNameTh: formData.customerNameTh.trim(),
                    clinicNameEn: formData.customerNameEn?.trim() || "",
                    ownerPhone: formData.phone.trim(),
                    ownerEmail: formData.email.trim(),
                },
                branch_data: branches,
                created_by: "sales",
            })
            .select("id, token")
            .single();

        if (error || !data) {
            console.error("createSalesSession insert error:", error);
            return createError("สร้างข้อมูลไม่สำเร็จ");
        }

        // Auto-create Google Sheet
        try {
            const sheet = await createCustomerSheet(formData.customerNameTh.trim(), formData.product);
            if (sheet) {
                await db
                    .from("onboarding_sessions")
                    .update({ sheet_id: sheet.spreadsheetId, sheet_url: sheet.url })
                    .eq("id", data.id);
            }
        } catch (e) {
            console.warn("Auto-create Google Sheet failed (continuing):", e);
        }

        // Send email with code
        let emailSent = false;
        try {
            emailSent = await sendOnboardingCodeEmail({
                to: formData.email.trim(),
                customerName: formData.customerNameTh.trim(),
                code,
                product: formData.product,
            });
        } catch (e) {
            console.warn("Email send failed (continuing):", e);
        }

        // Log activity
        await db.from("onboarding_activity_log").insert({
            session_id: data.id,
            action: "created",
            actor: "sales",
            metadata: { product: formData.product, code, emailSent },
        });

        return createSuccess({ code, emailSent });
    } catch (e) {
        console.error("createSalesSession error:", e);
        return createError("เกิดข้อผิดพลาด");
    }
}

// ============================================
// Customer: Login with Code
// ============================================
export async function loginWithCode(code: string): Promise<ApiResponse<{ token: string; isFirstTime: boolean }>> {
    try {
        if (!code?.trim()) return createError("กรุณากรอกรหัส");

        // Normalize: uppercase + trim
        const normalizedCode = code.trim().toUpperCase();

        const { data: session, error } = await db
            .from("onboarding_sessions")
            .select("*")
            .eq("code", normalizedCode)
            .single();

        if (error || !session) return createError("รหัสไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");

        // Check expiry
        if (new Date(session.expires_at) < new Date()) {
            return createError("รหัสหมดอายุแล้ว กรุณาติดต่อทีมเซลล์");
        }

        // Track if first time (status is pending)
        const isFirstTime = session.status === "pending";

        // If first time, set status to in_progress
        if (isFirstTime) {
            await db
                .from("onboarding_sessions")
                .update({ status: "in_progress" })
                .eq("id", session.id);
        }

        // Set session cookie
        const signature = signToken(session.token);
        const cookieStore = await cookies();
        cookieStore.set("onboarding_session", `${session.token}.${signature}`, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: "/",
        });

        // Log activity
        await db.from("onboarding_activity_log").insert({
            session_id: session.id,
            action: "pin_verified", // reuse action type for "code_verified"
            actor: "customer",
            metadata: { method: "code_login" },
        });

        return createSuccess({ token: session.token, isFirstTime });
    } catch (e) {
        console.error("loginWithCode error:", e);
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
        if (!cookie) return createError("กรุณาเข้าสู่ระบบด้วยรหัส Onboarding");

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
// Console: Get Session
// ============================================
export async function getConsoleSession(): Promise<ApiResponse<{ session: OnboardingSession }>> {
    return getSessionFromCookie();
}

// ============================================
// Console: Save Step Data (auto-save)
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
// Console: Submit Onboarding (legacy compat)
// ============================================
export async function submitOnboarding(token: string): Promise<ApiResponse<{ submitted: boolean }>> {
    try {
        const { error } = await db
            .from("onboarding_sessions")
            .update({
                status: "submitted",
                submitted_at: new Date().toISOString(),
            })
            .eq("token", token);

        if (error) return createError("ส่งข้อมูลไม่สำเร็จ");

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
        const sheet = await createCustomerSheet(customerName, session.product || undefined);
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
