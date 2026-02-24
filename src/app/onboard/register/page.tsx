"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2, AlertCircle, KeyRound, Eye, EyeOff } from "lucide-react";
import IllustrationPanel from "@/components/wizard/IllustrationPanel";
import ClinicInfoForm from "@/components/console/ClinicInfoForm";
import BranchesForm from "@/components/console/BranchesForm";
import { registerCustomer } from "@/actions/onboarding";
import type { ProductType, ClinicData, BranchData } from "@/types";
import { getEntityLabel } from "@/types";
import { Suspense } from "react";

const BRAND: Record<ProductType, { name: string; logo: string }> = {
    dr_ease: { name: "Dr.Ease", logo: "/logo-drease.png" },
    easepos: { name: "Ease POS", logo: "/logo-easepos.png" },
};

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const product = (searchParams.get("product") as ProductType) || "dr_ease";
    const brand = BRAND[product] || BRAND.dr_ease;
    const entity = getEntityLabel(product);

    const [clinicData, setClinicData] = useState<ClinicData>({});
    const [branchData, setBranchData] = useState<BranchData[]>([
        { name: "สำนักงานใหญ่", address: "", phone: "", managerName: "", managerPhone: "", isMain: true },
    ]);
    const [pin, setPin] = useState("");
    const [pinConfirm, setPinConfirm] = useState("");
    const [showPin, setShowPin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = useCallback(async () => {
        // Validate
        if (!clinicData.clinicNameTh?.trim()) {
            setError(`กรุณากรอกชื่อ${entity}`);
            return;
        }
        if (!clinicData.ownerPhone?.trim()) {
            setError("กรุณากรอกเบอร์โทร");
            return;
        }
        if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
            setError("PIN ต้องเป็นตัวเลข 6 หลัก");
            return;
        }
        if (pin !== pinConfirm) {
            setError("PIN ไม่ตรงกัน กรุณากรอกใหม่");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const result = await registerCustomer(product, clinicData, branchData, pin);
            if (!result.success) {
                setError(result.error);
                setLoading(false);
                return;
            }
            router.push("/console");
        } catch {
            setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
            setLoading(false);
        }
    }, [clinicData, branchData, pin, pinConfirm, product, entity, router]);

    return (
        <div className="min-h-screen bg-white" style={{
            "--primary": product === "easepos" ? "#F76D85" : "#7053E1",
            "--primary-hover": product === "easepos" ? "#E55C74" : "#5F44D0",
            "--primary-soft": product === "easepos" ? "rgba(247, 109, 133, 0.06)" : "rgba(112, 83, 225, 0.06)",
            "--primary-ring": product === "easepos" ? "rgba(247, 109, 133, 0.12)" : "rgba(112, 83, 225, 0.12)",
        } as React.CSSProperties}>
            {/* Left Panel */}
            <div className="min-h-screen flex flex-col lg:mr-[45%]">
                {/* Header */}
                <div className="shrink-0 px-6 lg:px-12 xl:px-16 pt-8">
                    <Image src={brand.logo} alt={brand.name} width={40} height={40} className="rounded-full" />
                </div>

                {/* Content */}
                <div className="flex-1 px-6 lg:px-12 xl:px-16 pt-8 pb-12">
                    <div className="max-w-2xl animate-fade-up">
                        {/* Heading */}
                        <h1 className="text-2xl lg:text-3xl font-bold text-text-main mb-2 leading-tight">
                            ลงทะเบียน{entity}ของคุณ
                        </h1>
                        <p className="text-text-muted mb-10">
                            กรอกข้อมูลเบื้องต้น แล้วเข้าจัดการข้อมูลทั้งหมดใน Console ได้เลย
                        </p>

                        <div className="space-y-10">
                            {/* Section 1: Clinic Info */}
                            <section>
                                <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--primary)" }}>
                                    ข้อมูล{entity}
                                </h2>
                                <ClinicInfoForm data={clinicData} onChange={setClinicData} product={product} />
                            </section>

                            {/* Section 2: Branches */}
                            <section>
                                <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--primary)" }}>
                                    สาขา
                                </h2>
                                <BranchesForm data={branchData} onChange={setBranchData} compact />
                            </section>

                            {/* Section 3: PIN */}
                            <section>
                                <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--primary)" }}>
                                    <KeyRound className="w-4 h-4 inline mr-1.5" />
                                    ตั้ง PIN สำหรับเข้าสู่ระบบ
                                </h2>
                                <p className="text-xs text-text-muted mb-4">
                                    ใช้เบอร์โทร + PIN ในการเข้าสู่ระบบครั้งถัดไป
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-text-main">
                                            PIN (6 หลัก) <span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPin ? "text" : "password"}
                                                inputMode="numeric"
                                                maxLength={6}
                                                className="input-field pr-10"
                                                placeholder="กรอกตัวเลข 6 หลัก"
                                                value={pin}
                                                onChange={(e) => {
                                                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                                                    setPin(v);
                                                    setError("");
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
                                                setError("");
                                            }}
                                        />
                                    </div>
                                </div>
                            </section>

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
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    "บันทึกและเข้าสู่ระบบ"
                                )}
                            </button>

                            {/* Login link */}
                            <p className="text-center text-sm text-text-muted">
                                เคยลงทะเบียนแล้ว?{" "}
                                <button
                                    onClick={() => router.push("/onboard/login")}
                                    className="font-medium hover:underline"
                                    style={{ color: "var(--primary)" }}
                                >
                                    เข้าสู่ระบบ
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Illustration Panel */}
            <div className="hidden lg:block fixed top-0 right-0 bottom-0 w-[45%]">
                <IllustrationPanel step={0} product={product} />
            </div>
        </div>
    );
}

export default function OnboardRegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--primary)" }} />
            </div>
        }>
            <RegisterContent />
        </Suspense>
    );
}
