"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    CreditCard, Monitor, CheckCircle2, Clock,
    ArrowRight, Send,
} from "lucide-react";
import FormField from "@/components/ui/FormField";
import { submitEasePayFromOnboarding, type EasePayApplication } from "@/actions/easepay";
import { submitForReview } from "@/actions/onboarding";
import { useSessionStore } from "@/stores/useSessionStore";
import type { OnboardingSession, EasePayService } from "@/types";

type Phase = "form" | "success";

interface EasePayOfferProps {
    session: OnboardingSession;
    existingApplication: EasePayApplication | null;
    onSubmitted: (app: EasePayApplication) => void;
}

const BUSINESS_CATEGORIES = [
    "คลินิก/สุขภาพ",
    "ร้านอาหาร/คาเฟ่",
    "ความงาม/สปา",
    "ค้าปลีก/ค้าส่ง",
    "โรงแรม/ที่พัก",
    "การศึกษา",
    "บริการ/ซ่อมบำรุง",
    "อื่นๆ",
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "รอตรวจสอบ", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.1)" },
    reviewing: { label: "กำลังตรวจสอบ", color: "#6C5CE7", bg: "rgba(108, 92, 231, 0.1)" },
    approved: { label: "อนุมัติแล้ว", color: "#00BA88", bg: "rgba(0, 186, 136, 0.1)" },
    active: { label: "ใช้งานอยู่", color: "#00BA88", bg: "rgba(0, 186, 136, 0.1)" },
    rejected: { label: "ไม่ผ่าน", color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)" },
};

export default function EasePayOffer({ session, existingApplication, onSubmitted }: EasePayOfferProps) {
    const router = useRouter();
    const { setWizardMode } = useSessionStore();
    const [phase, setPhase] = useState<Phase>("form");
    const exitToConsole = () => {
        setWizardMode(false);
        router.push("/console/info");
    };

    // Pre-fill from onboarding session
    const clinic = session.clinic_data || {};
    const [fullName, setFullName] = useState(clinic.ownerName || "");
    const [email, setEmail] = useState(clinic.ownerEmail || session.email || "");
    const [phone, setPhone] = useState(clinic.ownerPhone || "");
    const [businessName, setBusinessName] = useState(clinic.clinicNameTh || session.customer_name || "");
    const [businessCategory, setBusinessCategory] = useState(clinic.businessType || "");
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [services, setServices] = useState<EasePayService[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const toggleService = (svc: EasePayService) => {
        setServices((prev) =>
            prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]
        );
        if (errors.services) setErrors((prev) => ({ ...prev, services: "" }));
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!fullName.trim()) e.fullName = "กรุณากรอกชื่อ-นามสกุล";
        if (!phone.trim()) e.phone = "กรุณากรอกเบอร์โทร";
        if (!businessName.trim()) e.businessName = "กรุณากรอกชื่อธุรกิจ";
        if (!services.length) e.services = "กรุณาเลือกบริการอย่างน้อย 1 รายการ";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = useCallback(async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            const result = await submitEasePayFromOnboarding({
                fullName: fullName.trim(),
                email: email.trim(),
                phone: phone.trim(),
                businessName: businessName.trim(),
                businessCategory: businessCategory.trim(),
                websiteUrl: websiteUrl.trim(),
                services,
            });
            if (result.success) {
                // Also submit onboarding data for CS review
                await submitForReview();
                setPhase("success");
                // Update parent with a synthetic application object
                onSubmitted({
                    id: 0,
                    first_name: fullName.split(/\s+/)[0] || "",
                    last_name: fullName.split(/\s+/).slice(1).join(" ") || "",
                    email: email.trim() || null,
                    phone: phone.trim(),
                    business_name: businessName.trim(),
                    service: services.map(s => s === "online" ? "Beam" : "NTT เครื่องรูดบัตร").join(", "),
                    status: "pending",
                    created_at: new Date().toISOString(),
                });
            } else {
                setErrors({ form: result.error });
            }
        } catch {
            setErrors({ form: "เกิดข้อผิดพลาด กรุณาลองใหม่" });
        } finally {
            setSubmitting(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fullName, email, phone, businessName, businessCategory, websiteUrl, services, onSubmitted]);

    // ==========================================
    // Page Header (always shown)
    // ==========================================
    const pageHeader = (
        <div className="mb-6">
            <h1 className="text-xl font-bold text-text-main">Ease Pay</h1>
            <p className="text-sm text-text-muted mt-1">ระบบรับชำระเงินออนไลน์</p>
        </div>
    );

    // ==========================================
    // Already registered — show status
    // ==========================================
    if (existingApplication && phase !== "success") {
        const statusInfo = STATUS_MAP[existingApplication.status] || STATUS_MAP.pending;
        return (
            <div>
                {pageHeader}

                {/* Status card */}
                <div className="glass-card p-6 mb-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-sm font-semibold text-text-main">สถานะการสมัคร</h2>
                        <span
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ color: statusInfo.color, background: statusInfo.bg }}
                        >
                            {existingApplication.status === "pending" ? (
                                <Clock className="w-3 h-3" />
                            ) : (
                                <CheckCircle2 className="w-3 h-3" />
                            )}
                            {statusInfo.label}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoItem label="ชื่อ-นามสกุล" value={`${existingApplication.first_name} ${existingApplication.last_name}`.trim()} />
                        <InfoItem label="เบอร์โทร" value={existingApplication.phone} />
                        <InfoItem label="อีเมล" value={existingApplication.email || "-"} />
                        <InfoItem label="ชื่อธุรกิจ" value={existingApplication.business_name || "-"} />
                        <InfoItem label="บริการ" value={existingApplication.service} />
                        <InfoItem label="วันที่สมัคร" value={new Date(existingApplication.created_at).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })} />
                    </div>
                </div>

                {/* Timeline */}
                <div className="glass-card p-6">
                    <p className="text-sm font-semibold text-text-main mb-4">ขั้นตอนดำเนินการ</p>
                    <div className="space-y-4">
                        {[
                            { step: 1, text: "ส่งข้อมูลเรียบร้อย", done: true },
                            { step: 2, text: "ทีมงานตรวจสอบและรวบรวมเอกสาร", done: existingApplication.status !== "pending" },
                            { step: 3, text: "เปิดใช้งานระบบชำระเงิน", done: existingApplication.status === "active" },
                        ].map(({ step, text, done }) => (
                            <div key={step} className="flex items-center gap-3">
                                <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${done ? "text-white" : "text-text-light"}`}
                                    style={{ background: done ? "linear-gradient(135deg, #00BA88, #00D4A0)" : "var(--input-bg)" }}
                                >
                                    {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : step}
                                </div>
                                <span className={`text-sm ${done ? "text-text-main font-medium" : "text-text-muted"}`}>{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // Phase: Success (just submitted)
    // ==========================================
    if (phase === "success") {
        return (
            <div>
                {pageHeader}
                <div className="glass-card p-8 text-center animate-fade-up">
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 animate-success"
                        style={{ background: "rgba(0, 186, 136, 0.1)" }}
                    >
                        <CheckCircle2 className="w-8 h-8" style={{ color: "var(--success)" }} />
                    </div>
                    <h2 className="text-lg font-bold text-text-main mb-2">สมัคร Ease Pay เรียบร้อย!</h2>
                    <p className="text-sm text-text-muted mb-6">ทีมงานจะตรวจสอบข้อมูลและติดต่อกลับเร็วๆ นี้</p>

                    <div className="text-left glass-card p-5 mb-6">
                        <p className="text-sm font-semibold text-text-main mb-3">ขั้นตอนถัดไป</p>
                        <div className="space-y-3">
                            {[
                                { step: 1, text: "ส่งข้อมูลเรียบร้อย", done: true },
                                { step: 2, text: "ทีมงานตรวจสอบและรวบรวมเอกสาร", done: false },
                                { step: 3, text: "เปิดใช้งานระบบชำระเงิน", done: false },
                            ].map(({ step, text, done }) => (
                                <div key={step} className="flex items-center gap-3">
                                    <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${done ? "text-white" : "text-text-light"}`}
                                        style={{ background: done ? "linear-gradient(135deg, #00BA88, #00D4A0)" : "var(--input-bg)" }}
                                    >
                                        {done ? <CheckCircle2 className="w-3 h-3" /> : step}
                                    </div>
                                    <span className={`text-sm ${done ? "text-text-main font-medium" : "text-text-muted"}`}>{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Exit to console */}
                    <button
                        onClick={exitToConsole}
                        className="btn btn-primary text-sm mx-auto"
                    >
                        เข้าสู่หน้าจัดการ
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    // ==========================================
    // Phase: Form
    // ==========================================
    if (phase === "form") {
        return (
            <div>
                {pageHeader}
                <div className="animate-fade-up">
                    {/* Sub header */}
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(108, 92, 231, 0.1)" }}>
                            <CreditCard className="w-3.5 h-3.5" style={{ color: "#6C5CE7" }} />
                        </div>
                        <h2 className="text-sm font-bold text-text-main">กรอกข้อมูลสมัคร</h2>
                    </div>
                    <p className="text-xs text-text-muted mb-5 ml-9">ข้อมูลส่วนใหญ่กรอกให้แล้ว ตรวจสอบและเลือกบริการได้เลย</p>

                    <div className="glass-card p-6 space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="ชื่อ-นามสกุล" required error={errors.fullName}>
                                <input className="input-field" placeholder="ชื่อ นามสกุล" value={fullName}
                                    onChange={(e) => { setFullName(e.target.value); if (errors.fullName) setErrors((p) => ({ ...p, fullName: "" })); }} />
                            </FormField>
                            <FormField label="เบอร์โทร" required error={errors.phone}>
                                <input className="input-field" placeholder="0XX-XXX-XXXX" value={phone}
                                    onChange={(e) => { setPhone(e.target.value); if (errors.phone) setErrors((p) => ({ ...p, phone: "" })); }} />
                            </FormField>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="อีเมล">
                                <input type="email" className="input-field" placeholder="example@email.com" value={email}
                                    onChange={(e) => setEmail(e.target.value)} />
                            </FormField>
                            <FormField label="ชื่อธุรกิจ" required error={errors.businessName}>
                                <input className="input-field" placeholder="ชื่อบริษัท/ร้านค้า" value={businessName}
                                    onChange={(e) => { setBusinessName(e.target.value); if (errors.businessName) setErrors((p) => ({ ...p, businessName: "" })); }} />
                            </FormField>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="ประเภทธุรกิจ">
                                <select className="input-field" value={businessCategory} onChange={(e) => setBusinessCategory(e.target.value)}>
                                    <option value="">เลือกประเภท</option>
                                    {BUSINESS_CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                                </select>
                            </FormField>
                            <FormField label="เว็บไซต์ / Social Media">
                                <input className="input-field" placeholder="https:// หรือ @page" value={websiteUrl}
                                    onChange={(e) => setWebsiteUrl(e.target.value)} />
                            </FormField>
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                        <div>
                            <p className="text-sm font-semibold text-text-main mb-3">
                                บริการที่สนใจ <span className="text-red-400">*</span>
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <ServiceCard icon={Monitor} title="ชำระเงินออนไลน์" description="Payment Link, QR Code, เว็บไซต์"
                                    selected={services.includes("online")} onClick={() => toggleService("online")} />
                                <ServiceCard icon={CreditCard} title="เครื่องรูดบัตร EDC" description="รูดบัตร, ผ่อนชำระ, QR ในเครื่อง"
                                    selected={services.includes("edc")} onClick={() => toggleService("edc")} />
                            </div>
                            {errors.services && <p className="text-xs text-red-500 mt-2">{errors.services}</p>}
                        </div>

                        {errors.form && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                                <p className="text-sm text-red-600">{errors.form}</p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-5">
                        <button onClick={exitToConsole} className="btn btn-ghost text-sm">
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="btn btn-primary text-sm"
                            style={{ background: "linear-gradient(135deg, #6C5CE7, #A855F7)", boxShadow: "0 4px 14px rgba(108, 92, 231, 0.3)" }}
                        >
                            {submitting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <><Send className="w-4 h-4" />ส่งข้อมูล</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Default: show form (no more info phase — modal in layout handles invitation)
    return null;
}

// ==========================================
// Sub-components
// ==========================================
function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-text-muted mb-0.5">{label}</p>
            <p className="text-sm font-medium text-text-main">{value}</p>
        </div>
    );
}

function ServiceCard({
    icon: Icon, title, description, selected, onClick,
}: {
    icon: React.ElementType; title: string; description: string; selected: boolean; onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200
                ${selected ? "border-[#6C5CE7] bg-[#6C5CE7]/[0.04]" : "border-transparent hover:border-border"}`}
            style={{ background: selected ? "rgba(108, 92, 231, 0.04)" : "var(--input-bg)" }}
        >
            {selected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#6C5CE7" }}>
                    <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
            )}
            <Icon className="w-5 h-5 mb-2" style={{ color: selected ? "#6C5CE7" : "var(--text-light)" }} />
            <p className="text-sm font-semibold text-text-main">{title}</p>
            <p className="text-xs text-text-muted mt-0.5">{description}</p>
        </button>
    );
}
