"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2, AlertCircle, KeyRound, Eye, EyeOff, ChevronLeft, ChevronRight, Check } from "lucide-react";
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

const STEPS = [
    { id: 1, label: "ข้อมูลร้าน" },
    { id: 2, label: "สาขา" },
    { id: 3, label: "ตั้ง PIN" },
];

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const product = (searchParams.get("product") as ProductType) || "dr_ease";
    const brand = BRAND[product] || BRAND.dr_ease;
    const entity = getEntityLabel(product);

    const [step, setStep] = useState(1);
    const [clinicData, setClinicData] = useState<ClinicData>({});
    const [branchData, setBranchData] = useState<BranchData[]>([
        { name: "สำนักงานใหญ่", address: "", phone: "", managerName: "", managerPhone: "", isMain: true },
    ]);
    const [pin, setPin] = useState("");
    const [pinConfirm, setPinConfirm] = useState("");
    const [showPin, setShowPin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const validateStep = useCallback((s: number): boolean => {
        setError("");
        if (s === 1) {
            if (!clinicData.clinicNameTh?.trim()) {
                setError(`กรุณากรอกชื่อ${entity}`);
                return false;
            }
            if (!clinicData.ownerPhone?.trim()) {
                setError("กรุณากรอกเบอร์โทร");
                return false;
            }
        }
        if (s === 3) {
            if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
                setError("PIN ต้องเป็นตัวเลข 6 หลัก");
                return false;
            }
            if (pin !== pinConfirm) {
                setError("PIN ไม่ตรงกัน กรุณากรอกใหม่");
                return false;
            }
        }
        return true;
    }, [clinicData, pin, pinConfirm, entity]);

    const goNext = useCallback(() => {
        if (!validateStep(step)) return;
        if (step < 3) {
            setStep(step + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [step, validateStep]);

    const goBack = useCallback(() => {
        if (step > 1) {
            setStep(step - 1);
            setError("");
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            router.push("/onboard");
        }
    }, [step, router]);

    const handleSubmit = useCallback(async () => {
        if (!validateStep(3)) return;

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
    }, [clinicData, branchData, pin, product, router, validateStep]);

    // Step titles
    const stepTitles: Record<number, { title: string; desc: string }> = {
        1: { title: `บอกเราเกี่ยวกับ${entity}ของคุณ`, desc: `กรอกข้อมูลทั่วไปของ${entity}` },
        2: { title: `${entity}ของคุณมีกี่สาขา?`, desc: `เพิ่มข้อมูลสาขาทั้งหมดของ${entity}` },
        3: { title: "ตั้ง PIN สำหรับเข้าสู่ระบบ", desc: "ใช้เบอร์โทร + PIN ในการเข้าสู่ระบบครั้งถัดไป" },
    };

    return (
        <div className="min-h-screen bg-white" style={{
            "--primary": product === "easepos" ? "#F76D85" : "#7053E1",
            "--primary-hover": product === "easepos" ? "#E55C74" : "#5F44D0",
            "--primary-soft": product === "easepos" ? "rgba(247, 109, 133, 0.06)" : "rgba(112, 83, 225, 0.06)",
            "--primary-ring": product === "easepos" ? "rgba(247, 109, 133, 0.12)" : "rgba(112, 83, 225, 0.12)",
        } as React.CSSProperties}>
            {/* Left Panel */}
            <div className="min-h-screen flex flex-col lg:mr-[45%]">
                {/* Header + Progress */}
                <div className="shrink-0 px-6 lg:px-12 xl:px-16 pt-8 pb-2">
                    <div className="flex items-center justify-between mb-8">
                        <Image src={brand.logo} alt={brand.name} width={40} height={40} className="rounded-full" />
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center gap-2 mb-2">
                        {STEPS.map((s, i) => (
                            <div key={s.id} className="flex items-center gap-2 flex-1">
                                <div className="flex items-center gap-2 flex-1">
                                    <div
                                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300"
                                        style={
                                            step > s.id
                                                ? { background: "var(--primary)", color: "#fff" }
                                                : step === s.id
                                                ? { background: "var(--primary)", color: "#fff", boxShadow: `0 0 0 4px var(--primary-ring)` }
                                                : { background: "var(--input-bg)", color: "var(--text-light)" }
                                        }
                                    >
                                        {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
                                    </div>
                                    <span className={`text-xs font-medium hidden sm:inline ${step >= s.id ? "text-text-main" : "text-text-light"}`}>
                                        {s.label}
                                    </span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div
                                        className="h-0.5 flex-1 rounded-full transition-all duration-500"
                                        style={{ background: step > s.id ? "var(--primary)" : "var(--border)" }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 px-6 lg:px-12 xl:px-16 pt-8 pb-28">
                    <div className="max-w-2xl animate-fade-up" key={step}>
                        {/* Step Header */}
                        <p className="text-sm font-semibold mb-2" style={{ color: "var(--primary)" }}>
                            ขั้นตอนที่ {step} จาก {STEPS.length}
                        </p>
                        <h1 className="text-2xl lg:text-3xl font-bold text-text-main mb-2 leading-tight">
                            {stepTitles[step].title}
                        </h1>
                        <p className="text-text-muted mb-8">
                            {stepTitles[step].desc}
                        </p>

                        {/* Step 1: Clinic Info */}
                        {step === 1 && (
                            <ClinicInfoForm data={clinicData} onChange={setClinicData} product={product} />
                        )}

                        {/* Step 2: Branches */}
                        {step === 2 && (
                            <BranchesForm data={branchData} onChange={setBranchData} />
                        )}

                        {/* Step 3: PIN */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <div className="glass-card p-6 space-y-4">
                                    <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--primary)" }}>
                                        <KeyRound className="w-4 h-4" />
                                        PIN 6 หลัก
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-text-main">
                                                PIN <span className="text-red-400">*</span>
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
                                </div>

                                <p className="text-xs text-text-light">
                                    จำ PIN ไว้ให้ดี! ใช้เบอร์โทร + PIN ในการเข้าสู่ระบบครั้งถัดไป
                                </p>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl mt-6">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Fixed Navigation Bar */}
            <div className="fixed bottom-0 left-0 right-0 lg:right-[45%] z-20 bg-white/95 backdrop-blur-sm border-t border-border-light px-6 lg:px-12 xl:px-16 py-4">
                <div className="flex items-center justify-between max-w-2xl">
                    <button onClick={goBack} className="btn btn-ghost">
                        <ChevronLeft className="w-4 h-4" />
                        {step === 1 ? "เลือกผลิตภัณฑ์" : "ย้อนกลับ"}
                    </button>

                    {step < 3 ? (
                        <button onClick={goNext} className="btn btn-primary min-w-[160px]">
                            ถัดไป
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="btn btn-primary min-w-[160px]"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "บันทึกและเข้าสู่ระบบ"
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Login link (show on step 1 only) */}
            {step === 1 && (
                <div className="fixed bottom-20 left-0 right-0 lg:right-[45%] text-center pb-2">
                    <p className="text-sm text-text-muted">
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
            )}

            {/* Right Illustration Panel */}
            <div className="hidden lg:block fixed top-0 right-0 bottom-0 w-[45%]">
                <IllustrationPanel step={step} product={product} />
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
