"use client";

import { useRouter } from "next/navigation";
import {
    Building2, GitBranch, Send, CheckCircle2, AlertTriangle,
    ArrowRight, Sparkles, Crown, Pencil, Phone, MapPin, Briefcase,
} from "lucide-react";
import StatusBadge from "@/components/console/StatusBadge";
import { useSessionStore } from "@/stores/useSessionStore";
import { submitForReview } from "@/actions/onboarding";
import { useState, useCallback } from "react";
import { getEntityLabel } from "@/types";

export default function ConsoleDashboardPage() {
    const router = useRouter();
    const { session, updateStatus, wizardMode } = useSessionStore();
    const [submitting, setSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    if (!session) return null;

    const product = session.product || "dr_ease";
    const entity = getEntityLabel(product);

    // Wizard mode → show review summary
    if (wizardMode) {
        return <WizardReview />;
    }

    // Calculate data completeness
    const checks = [
        !!session.clinic_data?.clinicNameTh,
        !!session.clinic_data?.clinicNameEn,
        !!session.clinic_data?.ownerPhone,
        !!session.clinic_data?.businessType,
        session.branch_data?.length > 0,
        session.branch_data?.some(b => !!b.name),
    ];
    const filled = checks.filter(Boolean).length;
    const total = checks.length;
    const percentage = Math.round((filled / total) * 100);

    const isReadOnly = session.status === "submitted" || session.status === "approved";
    const isRejected = session.status === "rejected";

    const handleSubmit = useCallback(async () => {
        setSubmitting(true);
        const result = await submitForReview();
        if (result.success) {
            updateStatus("submitted");
        }
        setSubmitting(false);
        setShowConfirm(false);
    }, [updateStatus]);

    return (
        <div className="space-y-8 animate-fade-up">
            {/* Page header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-text-main">ภาพรวม</h1>
                <p className="text-text-muted mt-1">จัดการข้อมูล{entity}ของคุณ</p>
            </div>

            {/* Status card */}
            <div className="glass-card p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <h2 className="text-lg font-bold text-text-main">
                            {session.customer_name || "ยังไม่ได้ตั้งชื่อ"}
                        </h2>
                        <StatusBadge status={session.status} />
                    </div>

                    {/* Progress ring */}
                    <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16">
                            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                                <circle cx="32" cy="32" r="28" fill="none" stroke="var(--border)" strokeWidth="4" />
                                <circle
                                    cx="32" cy="32" r="28" fill="none"
                                    stroke="var(--primary)"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(percentage / 100) * 175.9} 175.9`}
                                    className="transition-all duration-700"
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-text-main">
                                {percentage}%
                            </span>
                        </div>
                        <div className="text-sm text-text-muted">
                            กรอกข้อมูลแล้ว
                        </div>
                    </div>
                </div>

                {/* Rejected notice */}
                {isRejected && (
                    <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-red-600">ข้อมูลต้องแก้ไข</p>
                            <p className="text-xs text-red-500 mt-1">
                                ทีม CS ตรวจสอบแล้ว กรุณาแก้ไขข้อมูลและส่งอีกครั้ง
                            </p>
                        </div>
                    </div>
                )}

                {/* Submitted success */}
                {session.status === "submitted" && (
                    <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-blue-600">ส่งข้อมูลเรียบร้อยแล้ว</p>
                            <p className="text-xs text-blue-500 mt-1">
                                ทีม CS กำลังตรวจสอบข้อมูลของคุณ จะติดต่อกลับเร็วๆ นี้
                            </p>
                        </div>
                    </div>
                )}

                {session.status === "approved" && (
                    <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-emerald-600">อนุมัติแล้ว!</p>
                            <p className="text-xs text-emerald-500 mt-1">
                                ข้อมูลของคุณได้รับการอนุมัติเรียบร้อยแล้ว
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <QuickCard
                    icon={Building2}
                    title={`ข้อมูล${entity}`}
                    description={session.clinic_data?.clinicNameTh ? "แก้ไขข้อมูลร้าน" : "เริ่มกรอกข้อมูลร้าน"}
                    done={!!session.clinic_data?.clinicNameTh}
                    onClick={() => router.push("/console/info")}
                />
                <QuickCard
                    icon={GitBranch}
                    title="จัดการสาขา"
                    description={`${session.branch_data?.length || 0} สาขา`}
                    done={(session.branch_data?.length || 0) > 0}
                    onClick={() => router.push("/console/branches")}
                />
                {!isReadOnly && (
                    <QuickCard
                        icon={Send}
                        title="ส่งข้อมูลให้ CS"
                        description="ส่งให้ทีม CS ตรวจสอบ"
                        done={false}
                        highlight
                        onClick={() => setShowConfirm(true)}
                    />
                )}
            </div>

            {/* Submit confirmation */}
            {showConfirm && (
                <div className="glass-card p-6 space-y-4" style={{ borderColor: "var(--warning)", borderWidth: "2px" }}>
                    <p className="text-sm text-text-main font-medium text-center">
                        ยืนยันส่งข้อมูลให้ทีม CS ตรวจสอบ?
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowConfirm(false)}
                            className="btn btn-ghost flex-1"
                            disabled={submitting}
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="btn btn-primary flex-1"
                        >
                            {submitting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    ยืนยัน
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
// Wizard Review — Summary of all filled data
// ==========================================
function WizardReview() {
    const router = useRouter();
    const { session } = useSessionStore();

    if (!session) return null;

    const product = session.product || "dr_ease";
    const entity = getEntityLabel(product);
    const clinic = session.clinic_data || {};
    const branches = session.branch_data || [];
    const empty = "—";

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-text-main">ตรวจสอบข้อมูล</h1>
                <p className="text-text-muted text-sm mt-1">
                    ตรวจสอบข้อมูลที่กรอกไว้ก่อนดำเนินการต่อ
                </p>
            </div>

            {/* Section: Clinic/Shop Info */}
            <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: "var(--primary-soft)" }}
                        >
                            <Building2 className="w-4 h-4" style={{ color: "var(--primary)" }} />
                        </div>
                        <h2 className="text-sm font-semibold text-text-main">ข้อมูล{entity}</h2>
                    </div>
                    <button
                        onClick={() => router.push("/console/info")}
                        className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80"
                        style={{ color: "var(--primary)" }}
                    >
                        <Pencil className="w-3.5 h-3.5" />
                        แก้ไข
                    </button>
                </div>

                <div className="space-y-3">
                    <ReviewRow
                        icon={Building2}
                        label={`ชื่อ${entity} (ไทย)`}
                        value={clinic.clinicNameTh}
                    />
                    <ReviewRow
                        icon={Building2}
                        label={`ชื่อ${entity} (EN)`}
                        value={clinic.clinicNameEn}
                    />
                    <ReviewRow
                        icon={Phone}
                        label="เบอร์โทร"
                        value={clinic.ownerPhone}
                    />
                    <ReviewRow
                        icon={Briefcase}
                        label="ประเภทธุรกิจ"
                        value={clinic.businessType}
                    />
                    {clinic.address && (
                        <ReviewRow
                            icon={MapPin}
                            label="ที่อยู่"
                            value={clinic.address}
                        />
                    )}
                </div>
            </div>

            {/* Section: Branches */}
            <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: "var(--primary-soft)" }}
                        >
                            <GitBranch className="w-4 h-4" style={{ color: "var(--primary)" }} />
                        </div>
                        <h2 className="text-sm font-semibold text-text-main">
                            สาขา ({branches.length})
                        </h2>
                    </div>
                    <button
                        onClick={() => router.push("/console/branches")}
                        className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80"
                        style={{ color: "var(--primary)" }}
                    >
                        <Pencil className="w-3.5 h-3.5" />
                        แก้ไข
                    </button>
                </div>

                {branches.length > 0 ? (
                    <div className="space-y-2.5">
                        {branches.map((branch, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
                                style={{ background: "var(--input-bg)" }}
                            >
                                <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                                    style={{
                                        background: branch.isMain ? "rgba(245, 158, 11, 0.1)" : "var(--primary-soft)",
                                        color: branch.isMain ? "#D97706" : "var(--primary)",
                                    }}
                                >
                                    {branch.isMain ? <Crown className="w-3.5 h-3.5" /> : i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-text-main truncate">
                                        {branch.name || empty}
                                    </p>
                                    {branch.phone && (
                                        <p className="text-xs text-text-muted">{branch.phone}</p>
                                    )}
                                </div>
                                {branch.isMain && (
                                    <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                                        สาขาหลัก
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-text-light text-center py-4">ยังไม่มีข้อมูลสาขา</p>
                )}
            </div>
        </div>
    );
}

// ==========================================
// Shared Components
// ==========================================
function ReviewRow({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value?: string;
}) {
    return (
        <div className="flex items-start gap-3 px-3.5 py-2.5 rounded-xl" style={{ background: "var(--input-bg)" }}>
            <Icon className="w-4 h-4 text-text-light shrink-0 mt-0.5" />
            <div className="min-w-0">
                <p className="text-[11px] text-text-light uppercase tracking-wide">{label}</p>
                <p className="text-sm text-text-main font-medium mt-0.5 break-words">
                    {value || "—"}
                </p>
            </div>
        </div>
    );
}

function QuickCard({
    icon: Icon,
    title,
    description,
    done,
    highlight,
    onClick,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    done: boolean;
    highlight?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`
                glass-card p-5 text-left transition-all duration-200
                hover:shadow-md hover:scale-[1.01] active:scale-[0.99]
                group
                ${highlight ? "ring-1" : ""}
            `}
            style={highlight ? { borderColor: "var(--primary)", ringColor: "var(--primary-ring)" } : undefined}
        >
            <div className="flex items-start justify-between mb-3">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: highlight ? "var(--primary-soft)" : done ? "rgba(0, 186, 136, 0.08)" : "var(--primary-soft)" }}
                >
                    <Icon
                        className="w-5 h-5"
                        style={{ color: highlight ? "var(--primary)" : done ? "var(--success)" : "var(--primary)" }}
                    />
                </div>
                <ArrowRight className="w-4 h-4 text-text-light group-hover:text-text-muted transition-colors group-hover:translate-x-0.5 transition-transform" />
            </div>
            <h3 className="text-sm font-semibold text-text-main">{title}</h3>
            <p className="text-xs text-text-muted mt-1">{description}</p>
        </button>
    );
}
