"use client";

import { useState, useCallback, useEffect, useRef, type CSSProperties } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProgressBar from "./ProgressBar";
import IllustrationPanel from "./IllustrationPanel";
import StepClinicInfo from "./StepClinicInfo";
import StepBranches from "./StepBranches";
import StepProcedures from "./StepProcedures";
import StepProducts from "./StepProducts";
import StepReview from "./StepReview";
import Toast from "@/components/ui/Toast";
import { saveStepData, submitOnboarding } from "@/actions/onboarding";
import { WIZARD_STEPS } from "@/types";
import type { OnboardingSession, ClinicData, BranchData, ProductType } from "@/types";

interface WizardShellProps {
    session: OnboardingSession;
    product: ProductType;
    demoMode?: boolean;
    onBackToProducts?: () => void;
}

const THEME: Record<ProductType, Record<string, string>> = {
    dr_ease: {
        "--primary": "#7053E1",
        "--primary-hover": "#5F44D0",
        "--primary-soft": "rgba(112, 83, 225, 0.06)",
        "--primary-ring": "rgba(112, 83, 225, 0.12)",
    },
    easepos: {
        "--primary": "#F76D85",
        "--primary-hover": "#E55C74",
        "--primary-soft": "rgba(247, 109, 133, 0.06)",
        "--primary-ring": "rgba(247, 109, 133, 0.12)",
    },
};

const BRAND_LOGO: Record<ProductType, string> = {
    dr_ease: "/logo-drease.png",
    easepos: "/logo-easepos.png",
};

export default function WizardShell({ session, product, demoMode, onBackToProducts }: WizardShellProps) {
    const [currentStep, setCurrentStep] = useState(session.current_step || 1);
    const [clinicData, setClinicData] = useState<ClinicData>(session.clinic_data || {});
    const [branchData, setBranchData] = useState<BranchData[]>(
        session.branch_data?.length > 0
            ? session.branch_data
            : [{ name: "สำนักงานใหญ่", address: "", phone: "", managerName: "", managerPhone: "", isMain: true }]
    );
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const isLastStep = currentStep === WIZARD_STEPS.length;
    const themeStyle = THEME[product] as CSSProperties;
    const hasPin = !!session.pin && session.pin !== "";

    // Auto-save with debounce
    const autoSave = useCallback(async (step: number, data: ClinicData | BranchData[]) => {
        if (demoMode) return;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(async () => {
            setSaving(true);
            try {
                await saveStepData(session.token, step, data);
            } catch {
                console.error("Auto-save failed");
            } finally {
                setSaving(false);
            }
        }, 1000);
    }, [session.token, demoMode]);

    useEffect(() => {
        if (currentStep === 1 && Object.keys(clinicData).length > 0) {
            autoSave(1, clinicData);
        }
    }, [clinicData, currentStep, autoSave]);

    useEffect(() => {
        if (currentStep === 2 && branchData.length > 0) {
            autoSave(2, branchData);
        }
    }, [branchData, currentStep, autoSave]);

    const goNext = useCallback(async () => {
        if (!demoMode) {
            setSaving(true);
            try {
                if (currentStep === 1) {
                    await saveStepData(session.token, 1, clinicData);
                } else if (currentStep === 2) {
                    await saveStepData(session.token, 2, branchData);
                }
            } catch {
                setToast({ message: "บันทึกข้อมูลไม่สำเร็จ", type: "error" });
                setSaving(false);
                return;
            }
            setSaving(false);
        }

        if (currentStep < WIZARD_STEPS.length) {
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [currentStep, clinicData, branchData, session.token, demoMode]);

    const goBack = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [currentStep]);

    const jumpToStep = useCallback((step: number) => {
        setCurrentStep(step);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const handleSubmit = useCallback(async (pin: string) => {
        if (demoMode) {
            setToast({ message: "ส่งข้อมูลเรียบร้อยแล้ว! (Demo)", type: "success" });
            return;
        }
        const result = await submitOnboarding(session.token, pin);
        if (!result.success) {
            setToast({ message: result.error, type: "error" });
            throw new Error(result.error);
        }
        setToast({ message: "ส่งข้อมูลเรียบร้อยแล้ว!", type: "success" });
    }, [session.token, demoMode]);

    return (
        <div className="min-h-screen bg-white" style={themeStyle}>
            {/* Left Panel */}
            <div className={`min-h-screen flex flex-col ${"lg:mr-[45%]"}`}>
                {/* Header */}
                <div className="shrink-0 px-6 lg:px-12 xl:px-16 pt-8 pb-2">
                    <div className="flex items-center justify-between mb-8">
                        <Image
                            src={BRAND_LOGO[product]}
                            alt={product === "easepos" ? "EasePos" : "Dr.Ease"}
                            width={40}
                            height={40}
                            className="rounded-full"
                        />
                        {saving && (
                            <span className="text-xs text-text-muted flex items-center gap-1.5">
                                <div
                                    className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
                                    style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
                                />
                                กำลังบันทึก...
                            </span>
                        )}
                    </div>
                    <ProgressBar currentStep={currentStep} product={product} />
                </div>

                {/* Step Content */}
                <div className={`flex-1 px-6 lg:px-12 xl:px-16 pt-8 ${isLastStep ? "pb-8" : "pb-28"}`}>
                    <div className={"max-w-2xl"}>
                        {currentStep === 1 && (
                            <StepClinicInfo data={clinicData} onChange={setClinicData} product={product} />
                        )}
                        {currentStep === 2 && (
                            <StepBranches data={branchData} onChange={setBranchData} product={product} />
                        )}
                        {currentStep === 3 && (
                            <StepProcedures
                                spreadsheetId={session.sheet_id}
                                sheetUrl={session.sheet_url}
                                product={product}
                            />
                        )}
                        {currentStep === 4 && (
                            <StepProducts
                                spreadsheetId={session.sheet_id}
                                sheetUrl={session.sheet_url}
                                product={product}
                            />
                        )}
                        {currentStep === 5 && (
                            <StepReview
                                clinicData={clinicData}
                                branchData={branchData}
                                sheetUrl={session.sheet_url}
                                product={product}
                                hasPin={hasPin}
                                onSubmit={handleSubmit}
                                onEditStep={jumpToStep}
                            />
                        )}

                        {/* Step 5: Back button below content */}
                        {isLastStep && (
                            <button onClick={goBack} className="btn btn-ghost mt-6">
                                <ChevronLeft className="w-4 h-4" />
                                ย้อนกลับแก้ไข
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Fixed Navigation Bar (steps 1-4) */}
            {!isLastStep && (
                <div
                    className={`fixed bottom-0 left-0 z-20 bg-white/95 backdrop-blur-sm border-t border-border-light px-6 lg:px-12 xl:px-16 py-4 ${
                        "right-0 lg:right-[45%]"
                    }`}
                >
                    <div className={`flex items-center justify-between ${"max-w-2xl"}`}>
                        <button
                            onClick={currentStep === 1 ? onBackToProducts : goBack}
                            className="btn btn-ghost"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            {currentStep === 1 ? "เลือกผลิตภัณฑ์" : "ย้อนกลับ"}
                        </button>
                        <button
                            onClick={goNext}
                            disabled={saving}
                            className="btn btn-primary min-w-[160px]"
                        >
                            ถัดไป
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Right Illustration Panel */}
            <div className="hidden lg:block fixed top-0 right-0 bottom-0 w-[45%]">
                <IllustrationPanel step={currentStep} product={product} />
            </div>

            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
