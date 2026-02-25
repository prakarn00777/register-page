"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, AlertCircle, Send, Building2, Phone, Mail, User, FileText, CalendarDays, Package } from "lucide-react";
import { createSalesSession } from "@/actions/onboarding";
import type { ProductType, SalesFormData } from "@/types";

const BRAND: Record<ProductType, { name: string; logo: string; gradient: string }> = {
    dr_ease: {
        name: "Dr.Ease",
        logo: "/logo-drease.png",
        gradient: "linear-gradient(135deg, #7053E1 0%, #8B6CF7 40%, #A855F7 100%)",
    },
    easepos: {
        name: "Ease POS",
        logo: "/logo-easepos.png",
        gradient: "linear-gradient(135deg, #F76D85 0%, #FF8FA3 40%, #FFB3C1 100%)",
    },
};

export default function SalesPage() {
    const router = useRouter();

    const [form, setForm] = useState<SalesFormData>({
        customerNameTh: "",
        customerNameEn: "",
        branchCount: 1,
        phone: "",
        email: "",
        contactName: "",
        contactAddress: "",
        product: "dr_ease",
        package: "",
        contractStart: "",
        salesNotes: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const update = useCallback((field: keyof SalesFormData, value: string | number) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setError("");
    }, []);

    const handleSubmit = useCallback(async () => {
        // Client-side validation
        if (!form.customerNameTh.trim()) { setError("กรุณากรอกชื่อร้าน/คลินิก (TH)"); return; }
        if (!form.customerNameEn.trim()) { setError("กรุณากรอกชื่อร้าน (EN)"); return; }
        if (!form.phone.trim()) { setError("กรุณากรอกเบอร์โทร"); return; }
        if (!form.email.trim()) { setError("กรุณากรอกอีเมล"); return; }
        if (form.branchCount < 1) { setError("จำนวนสาขาต้องอย่างน้อย 1"); return; }

        setLoading(true);
        setError("");

        try {
            const result = await createSalesSession(form);
            if (!result.success) {
                setError(result.error);
                setLoading(false);
                return;
            }

            const params = new URLSearchParams({
                code: result.data.code,
                email: form.email,
                name: form.customerNameTh,
                emailSent: result.data.emailSent ? "1" : "0",
                product: form.product,
            });
            router.push(`/sales/success?${params.toString()}`);
        } catch {
            setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
            setLoading(false);
        }
    }, [form, router]);

    const brand = BRAND[form.product];

    return (
        <div className="min-h-screen bg-bg-dark" style={{
            "--primary": form.product === "easepos" ? "#F76D85" : "#7053E1",
            "--primary-hover": form.product === "easepos" ? "#E55C74" : "#5F44D0",
            "--primary-soft": form.product === "easepos" ? "rgba(247, 109, 133, 0.06)" : "rgba(112, 83, 225, 0.06)",
            "--primary-ring": form.product === "easepos" ? "rgba(247, 109, 133, 0.12)" : "rgba(112, 83, 225, 0.12)",
        } as React.CSSProperties}>
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-2xl font-bold text-text-main mb-2">Sales Registration</h1>
                    <p className="text-text-muted">
                        กรอกข้อมูลลูกค้าเพื่อสร้างรหัส Onboarding
                    </p>
                </div>

                {/* Form Card */}
                <div className="glass-card p-6 sm:p-8 space-y-6">
                    {/* Product Selection */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-text-main mb-3">
                            <Package className="w-4 h-4" style={{ color: "var(--primary)" }} />
                            ผลิตภัณฑ์ <span className="text-red-400">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {(["dr_ease", "easepos"] as ProductType[]).map((p) => {
                                const b = BRAND[p];
                                const selected = form.product === p;
                                return (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => update("product", p)}
                                        className="flex items-center gap-3 p-4 rounded-xl border-2 transition-all"
                                        style={{
                                            borderColor: selected ? "var(--primary)" : "var(--input-border)",
                                            background: selected ? "var(--primary-soft)" : "var(--input-bg)",
                                        }}
                                    >
                                        <Image src={b.logo} alt={b.name} width={32} height={32} className="rounded-full" />
                                        <span className={`text-sm font-semibold ${selected ? "" : "text-text-muted"}`}
                                            style={selected ? { color: "var(--primary)" } : undefined}
                                        >
                                            {b.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Divider */}
                    <hr className="border-border" />

                    {/* Customer Name TH + EN */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-text-main">
                                <Building2 className="w-4 h-4" style={{ color: "var(--primary)" }} />
                                ชื่อร้าน/คลินิก (TH) <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="เช่น คลินิกสวยใส"
                                value={form.customerNameTh}
                                onChange={(e) => update("customerNameTh", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-text-main">
                                <Building2 className="w-4 h-4" style={{ color: "var(--primary)" }} />
                                ชื่อร้าน (EN) <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="e.g. Suay Sai Clinic"
                                value={form.customerNameEn}
                                onChange={(e) => update("customerNameEn", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Branch Count + Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-main">
                                จำนวนสาขา <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={100}
                                className="input-field"
                                value={form.branchCount}
                                onChange={(e) => update("branchCount", Math.max(1, parseInt(e.target.value) || 1))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-text-main">
                                <Phone className="w-4 h-4" style={{ color: "var(--primary)" }} />
                                เบอร์โทร <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="tel"
                                className="input-field"
                                placeholder="0xx-xxx-xxxx"
                                value={form.phone}
                                onChange={(e) => update("phone", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-text-main">
                            <Mail className="w-4 h-4" style={{ color: "var(--primary)" }} />
                            อีเมลลูกค้า <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="customer@example.com"
                            value={form.email}
                            onChange={(e) => update("email", e.target.value)}
                        />
                        <p className="text-xs text-text-light">ระบบจะส่งรหัส Onboarding ไปที่อีเมลนี้</p>
                    </div>

                    {/* Divider */}
                    <hr className="border-border" />

                    {/* Contact Name + Address */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-text-main">
                                <User className="w-4 h-4 text-text-light" />
                                ชื่อผู้ติดต่อ
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="ชื่อ-นามสกุล"
                                value={form.contactName}
                                onChange={(e) => update("contactName", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-text-main">
                                <FileText className="w-4 h-4 text-text-light" />
                                Package
                            </label>
                            <select
                                className="input-field"
                                value={form.package}
                                onChange={(e) => update("package", e.target.value)}
                            >
                                <option value="">-- เลือก Package --</option>
                                <option value="Starter">Starter</option>
                                <option value="Standard">Standard</option>
                                <option value="Elite">Elite</option>
                            </select>
                        </div>
                    </div>

                    {/* Contract Start */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-text-main">
                                <CalendarDays className="w-4 h-4 text-text-light" />
                                วันเริ่มสัญญา
                            </label>
                            <input
                                type="date"
                                className="input-field"
                                value={form.contractStart}
                                onChange={(e) => update("contractStart", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-main">ที่อยู่ผู้ติดต่อ</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="ที่อยู่สำหรับติดต่อ"
                                value={form.contactAddress}
                                onChange={(e) => update("contactAddress", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-main">หมายเหตุจากเซลล์</label>
                        <textarea
                            className="input-field !h-auto py-3"
                            rows={3}
                            placeholder="ข้อมูลเพิ่มเติม ความต้องการพิเศษ etc."
                            value={form.salesNotes}
                            onChange={(e) => update("salesNotes", e.target.value)}
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn btn-primary w-full text-base py-3.5"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                กำลังสร้างรหัส...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                สร้างรหัส Onboarding
                            </>
                        )}
                    </button>
                </div>

                {/* Footer */}
                <p className="text-xs text-text-light text-center mt-6">
                    Atiz — Customer Success Team
                </p>
            </div>
        </div>
    );
}
