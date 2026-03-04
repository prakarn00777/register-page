"use server";

import { db } from "@/lib/db";
import { createSuccess, createError } from "@/lib/utils";
import { getSessionFromCookie } from "./onboarding";
import type { EasePayFormData, ApiResponse } from "@/types";

export interface EasePayApplication {
    id: number;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string;
    business_name: string | null;
    service: string;
    status: string;
    created_at: string;
}

export async function getEasePayApplication(): Promise<
    ApiResponse<{ application: EasePayApplication | null }>
> {
    try {
        const sessionResult = await getSessionFromCookie();
        if (!sessionResult.success) return createError("กรุณาเข้าสู่ระบบ");
        const { session } = sessionResult.data;

        const { data, error } = await db
            .from("ep_applications")
            .select("id, first_name, last_name, email, phone, business_name, service, status, created_at")
            .eq("source", "onboarding")
            .like("notes", `%#${session.id} (%`)
            .order("created_at", { ascending: false })
            .limit(1);

        if (error) {
            console.error("getEasePayApplication error:", error);
            return createError("โหลดข้อมูลไม่สำเร็จ");
        }

        return createSuccess({ application: data?.[0] || null });
    } catch (e) {
        console.error("getEasePayApplication error:", e);
        return createError("เกิดข้อผิดพลาด");
    }
}

export async function submitEasePayFromOnboarding(
    data: EasePayFormData
): Promise<ApiResponse<{ submitted: boolean }>> {
    try {
        // Auth
        const sessionResult = await getSessionFromCookie();
        if (!sessionResult.success) return createError("กรุณาเข้าสู่ระบบ");
        const { session } = sessionResult.data;

        // Validate
        if (!data.fullName?.trim()) return createError("กรุณากรอกชื่อ-นามสกุล");
        if (!data.phone?.trim()) return createError("กรุณากรอกเบอร์โทร");
        if (!data.services?.length) return createError("กรุณาเลือกบริการอย่างน้อย 1 รายการ");

        // Split name
        const nameParts = data.fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        // Map services to ep_applications format
        const serviceList: string[] = [];
        if (data.services.includes("online")) serviceList.push("Beam");
        if (data.services.includes("edc")) serviceList.push("NTT เครื่องรูดบัตร");
        const service = serviceList.join(", ");

        // Insert
        const { error } = await db.from("ep_applications").insert({
            person_type: "juristic",
            first_name: firstName,
            last_name: lastName,
            email: data.email?.trim() || null,
            phone: data.phone.trim(),
            business_name: data.businessName?.trim() || null,
            shop_name: session.customer_name || null,
            business_category: data.businessCategory?.trim() || null,
            website: data.websiteUrl?.trim() || null,
            service,
            status: "pending",
            source: "onboarding",
            notes: `จาก Onboarding #${session.id} (${session.code})`,
        });

        if (error) {
            console.error("submitEasePayFromOnboarding insert error:", error);
            return createError("ส่งข้อมูลไม่สำเร็จ");
        }

        // Log activity
        await db.from("onboarding_activity_log").insert({
            session_id: session.id,
            action: "step_completed",
            step: 99,
            actor: "customer",
            metadata: { type: "easepay_registration", service },
        });

        return createSuccess({ submitted: true });
    } catch (e) {
        console.error("submitEasePayFromOnboarding error:", e);
        return createError("เกิดข้อผิดพลาด");
    }
}
