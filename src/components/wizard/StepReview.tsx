"use client";

import { useState, useCallback } from "react";
import { CheckCircle2, Building2, FileSpreadsheet, ExternalLink, Send, KeyRound, Eye, EyeOff, Pencil } from "lucide-react";
import { getEntityLabel } from "@/types";
import type { ClinicData, BranchData, ProductType } from "@/types";

interface StepReviewProps {
    clinicData: ClinicData;
    branchData: BranchData[];
    sheetUrl: string | null;
    product: ProductType;
    hasPin?: boolean;
    onSubmit: (pin: string) => Promise<void>;
    onEditStep?: (step: number) => void;
}

export default function StepReview({ clinicData, branchData, sheetUrl, product, hasPin, onSubmit, onEditStep }: StepReviewProps) {
    const entity = getEntityLabel(product);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pin, setPin] = useState("");
    const [pinConfirm, setPinConfirm] = useState("");
    const [showPin, setShowPin] = useState(false);
    const [pinError, setPinError] = useState("");

    const validatePin = useCallback(() => {
        if (hasPin) return true;
        if (pin.length < 4) {
            setPinError("PIN ต้องมีอย่างน้อย 4 หลัก");
            return false;
        }
        if (pin.length > 6) {
            setPinError("PIN ต้องไม่เกิน 6 หลัก");
            return false;
        }
        if (!/^\d+$/.test(pin)) {
            setPinError("PIN ต้องเป็นตัวเลขเท่านั้น");
            return false;
        }
        if (pin !== pinConfirm) {
            setPinError("PIN ไม่ตรงกัน กรุณากรอกใหม่");
            return false;
        }
        setPinError("");
        return true;
    }, [pin, pinConfirm, hasPin]);

    const handleSubmit = async () => {
        if (!validatePin()) return;
        setSubmitting(true);
        try {
            await onSubmit(hasPin ? "" : pin);
            setSubmitted(true);
        } finally {
            setSubmitting(false);
            setShowConfirm(false);
        }
    };

    // Success screen
    if (submitted) {
        return (
            <div className="text-center py-20 animate-fade-up">
                <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-success"
                    style={{ background: "rgba(0, 186, 136, 0.1)" }}
                >
                    <CheckCircle2 className="w-10 h-10" style={{ color: "var(--success)" }} />
                </div>
                <h2 className="text-2xl font-bold text-text-main mb-3">
                    {hasPin ? "อัปเดตข้อมูลเรียบร้อยแล้ว!" : "ส่งข้อมูลเรียบร้อยแล้ว!"}
                </h2>
                <p className="text-text-muted max-w-sm mx-auto leading-relaxed">
                    ทีม CS จะตรวจสอบข้อมูลและดำเนินการต่อให้ค่ะ
                    หากมีข้อมูลเพิ่มเติมจะติดต่อกลับผ่าน LINE
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Step Header */}
            <div>
                <p className="text-sm font-semibold mb-2" style={{ color: "var(--primary)" }}>
                    ขั้นตอนที่ 5
                </p>
                <h2 className="text-2xl lg:text-3xl font-bold text-text-main leading-tight">
                    ตรวจสอบข้อมูลทั้งหมด
                </h2>
                <p className="text-text-muted mt-3">กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนส่ง</p>
            </div>

            {/* Clinic Info Summary */}
            <div className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--primary)" }}>
                        <Building2 className="w-4 h-4" />
                        ข้อมูล{entity}
                    </h3>
                    {onEditStep && (
                        <button
                            onClick={() => onEditStep(1)}
                            className="text-xs flex items-center gap-1 hover:underline transition-colors"
                            style={{ color: "var(--primary)" }}
                        >
                            <Pencil className="w-3 h-3" />
                            แก้ไข
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <InfoRow label={`ชื่อ${entity} (TH)`} value={clinicData.clinicNameTh} />
                    <InfoRow label={`ชื่อ${entity} (EN)`} value={clinicData.clinicNameEn} />
                    <InfoRow label="เบอร์โทรติดต่อ" value={clinicData.ownerPhone} />
                    <InfoRow label="ประเภทธุรกิจ" value={clinicData.businessType} />
                </div>
            </div>

            {/* Branches Summary */}
            <div className="glass-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--primary)" }}>
                        <Building2 className="w-4 h-4" />
                        สาขา ({branchData.length} สาขา)
                    </h3>
                    {onEditStep && (
                        <button
                            onClick={() => onEditStep(2)}
                            className="text-xs flex items-center gap-1 hover:underline transition-colors"
                            style={{ color: "var(--primary)" }}
                        >
                            <Pencil className="w-3 h-3" />
                            แก้ไข
                        </button>
                    )}
                </div>
                <div className="space-y-2">
                    {branchData.map((branch, i) => (
                        <div key={i} className="flex items-center justify-between text-sm py-2.5 border-b border-border-light last:border-0">
                            <div>
                                <span className="font-medium text-text-main">{branch.name || `สาขาที่ ${i + 1}`}</span>
                                {branch.isMain && (
                                    <span className="ml-2 text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">หลัก</span>
                                )}
                            </div>
                            <span className="text-text-muted">{branch.phone || "-"}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Google Sheet Link */}
            {sheetUrl && (
                <div className="glass-card p-6 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--primary)" }}>
                            <FileSpreadsheet className="w-4 h-4" />
                            หัตถการ & สินค้า
                        </h3>
                        {onEditStep && (
                            <button
                                onClick={() => onEditStep(3)}
                                className="text-xs flex items-center gap-1 hover:underline transition-colors"
                                style={{ color: "var(--primary)" }}
                            >
                                <Pencil className="w-3 h-3" />
                                แก้ไข
                            </button>
                        )}
                    </div>
                    <a
                        href={sheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm hover:underline"
                        style={{ color: "var(--primary)" }}
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        ดูข้อมูลใน Google Sheet
                    </a>
                </div>
            )}

            {/* PIN Creation — only show if no PIN set yet */}
            {!hasPin && (
                <div className="glass-card p-6 space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--primary)" }}>
                        <KeyRound className="w-4 h-4" />
                        ตั้ง PIN สำหรับกลับมาแก้ไขข้อมูล
                    </h3>
                    <p className="text-xs text-text-muted">
                        PIN นี้จะใช้ในกรณีที่ต้องการกลับมาอัปเดตข้อมูลภายหลัง
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-text-main">
                                PIN (4-6 หลัก) <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPin ? "text" : "password"}
                                    inputMode="numeric"
                                    maxLength={6}
                                    className="input-field pr-10"
                                    placeholder="เช่น 1234"
                                    value={pin}
                                    onChange={(e) => {
                                        const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                                        setPin(v);
                                        setPinError("");
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPin(!showPin)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-muted transition-colors"
                                >
                                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-text-main">
                                ยืนยัน PIN <span className="text-red-400">*</span>
                            </label>
                            <input
                                type={showPin ? "text" : "password"}
                                inputMode="numeric"
                                maxLength={6}
                                className="input-field"
                                placeholder="กรอก PIN อีกครั้ง"
                                value={pinConfirm}
                                onChange={(e) => {
                                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                                    setPinConfirm(v);
                                    setPinError("");
                                }}
                            />
                        </div>
                    </div>
                    {pinError && (
                        <p className="text-xs text-red-500">{pinError}</p>
                    )}
                </div>
            )}

            {/* Submit Button */}
            {!showConfirm ? (
                <button
                    onClick={() => {
                        if (!validatePin()) return;
                        setShowConfirm(true);
                    }}
                    className="btn btn-primary w-full text-base py-3.5"
                >
                    <Send className="w-4 h-4" />
                    {hasPin ? "อัปเดตและส่งข้อมูล" : "ยืนยันและส่งข้อมูล"}
                </button>
            ) : (
                <div className="glass-card p-6 space-y-4" style={{ borderColor: "var(--warning)", borderWidth: "2px" }}>
                    <p className="text-sm text-text-main font-medium text-center">
                        ยืนยันส่งข้อมูลหรือไม่?
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
                                    <CheckCircle2 className="w-4 h-4" />
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

function InfoRow({ label, value }: { label: string; value?: string }) {
    return (
        <div>
            <span className="text-text-muted">{label}: </span>
            <span className="text-text-main font-medium">{value || "-"}</span>
        </div>
    );
}
