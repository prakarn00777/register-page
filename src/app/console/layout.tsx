"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import {
    Loader2, Building2, GitBranch, CheckCircle2,
    ArrowRight, ArrowLeft,
    type LucideIcon,
} from "lucide-react";
import ConsoleSidebar from "@/components/console/ConsoleSidebar";
import Toast from "@/components/ui/Toast";
import { getConsoleSession } from "@/actions/onboarding";
import { useSessionStore } from "@/stores/useSessionStore";
import { getEntityLabel } from "@/types";
import type { ProductType } from "@/types";

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

const BRAND: Record<ProductType, { name: string; logo: string; gradient: string }> = {
    dr_ease: {
        name: "Dr.Ease",
        logo: "/logo-drease.png",
        gradient: "linear-gradient(135deg, #7053E1 0%, #8B6CF7 40%, #A855F7 100%)",
    },
    easepos: {
        name: "Ease POS",
        logo: "/logo-easepos.png",
        gradient: "linear-gradient(135deg, #F76D85 0%, #FB8DA0 40%, #FF6B9D 100%)",
    },
};

interface WizardStepConfig {
    path: string;
    label: string;
    icon: LucideIcon;
    illustrationIcon: LucideIcon;
    illustrationTitle: string;
    illustrationSubtitle: string;
}

function getWizardSteps(product: ProductType): WizardStepConfig[] {
    const entity = getEntityLabel(product);
    return [
        {
            path: "/console/info",
            label: `ข้อมูล${entity}`,
            icon: Building2,
            illustrationIcon: Building2,
            illustrationTitle: `ข้อมูล${entity}`,
            illustrationSubtitle: `กรอกข้อมูลทั่วไปของ${entity}\nเพื่อให้ทีมงานเตรียมระบบให้`,
        },
        {
            path: "/console/branches",
            label: "สาขา",
            icon: GitBranch,
            illustrationIcon: GitBranch,
            illustrationTitle: "ข้อมูลสาขา",
            illustrationSubtitle: `กรอกรายละเอียดสาขาของ${entity}\nแต่ละสาขาที่ต้องการใช้งาน`,
        },
{
            path: "/console",
            label: "ตรวจสอบ & ส่ง",
            icon: CheckCircle2,
            illustrationIcon: CheckCircle2,
            illustrationTitle: "เกือบเสร็จแล้ว!",
            illustrationSubtitle: "ตรวจสอบข้อมูลทั้งหมด\nก่อนส่งให้ทีมงาน",
        },
    ];
}

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { session, setSession, isLoading, setLoading, wizardMode, setWizardMode } = useSessionStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        async function loadSession() {
            setLoading(true);
            const result = await getConsoleSession();
            if (!result.success) {
                router.replace("/onboard");
                return;
            }
            setSession(result.data.session);
        }
        loadSession();
    }, [router, setSession, setLoading]);

    if (isLoading || !session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-dark">
                <div className="text-center animate-fade-up">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: "var(--primary)" }} />
                    <p className="text-sm text-text-muted">กำลังโหลดข้อมูล...</p>
                </div>
            </div>
        );
    }

    const product = session.product || "dr_ease";
    const themeStyle = THEME[product] as CSSProperties;
    const brand = BRAND[product] || BRAND.dr_ease;
    const WIZARD_STEPS = getWizardSteps(product);

    // Wizard mode logic
    const currentStepIndex = WIZARD_STEPS.findIndex((s) => s.path === pathname);
    const isWizardPage = currentStepIndex !== -1;
    const showWizard = wizardMode && isWizardPage;

    const prevStep = currentStepIndex > 0 ? WIZARD_STEPS[currentStepIndex - 1] : null;
    const nextStep = currentStepIndex < WIZARD_STEPS.length - 1 ? WIZARD_STEPS[currentStepIndex + 1] : null;
    const isLastStep = currentStepIndex === WIZARD_STEPS.length - 1;

    if (showWizard) {
        const currentStep = WIZARD_STEPS[currentStepIndex];
        const IllustrationIcon = currentStep.illustrationIcon;

        return (
            <div className="min-h-screen bg-white" style={themeStyle}>
                <div className="flex min-h-screen">
                    {/* ===== Left Panel — Content ===== */}
                    <div className="flex-1 flex flex-col min-h-screen lg:mr-[42%]">
                        {/* Top: Brand + progress dots */}
                        <div className="px-6 sm:px-10 pt-8 pb-4">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <Image src={brand.logo} alt={brand.name} width={36} height={36} className="rounded-full" />
                                    <div>
                                        <p className="text-sm font-bold text-text-main">{brand.name}</p>
                                        <p className="text-xs text-text-muted">{session.customer_name}</p>
                                    </div>
                                </div>
                                {!isLastStep && (
                                    <button
                                        onClick={() => {
                                            setWizardMode(false);
                                            router.push("/console/info");
                                        }}
                                        className="text-xs text-text-light hover:text-text-muted transition-colors"
                                    >
                                        ข้ามขั้นตอน
                                    </button>
                                )}
                            </div>

                            {/* Progress dots */}
                            <div className="flex items-center gap-2 mb-6">
                                {WIZARD_STEPS.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => router.push(WIZARD_STEPS[i].path)}
                                        className={`
                                            h-2 rounded-full transition-all duration-300
                                            ${i === currentStepIndex
                                                ? "w-8"
                                                : i < currentStepIndex
                                                    ? "w-2 bg-emerald-400"
                                                    : "w-2 bg-slate-200"
                                            }
                                        `}
                                        style={i === currentStepIndex ? { background: "var(--primary)" } : undefined}
                                    />
                                ))}
                            </div>

                            {/* Step label */}
                            <p className="text-xs text-text-light font-medium tracking-wide uppercase mb-1">
                                ขั้นตอนที่ {currentStepIndex + 1}/{WIZARD_STEPS.length}
                            </p>
                        </div>

                        {/* Middle: Page content (scrollable) */}
                        <main className="flex-1 px-6 sm:px-10 pb-6 overflow-y-auto">
                            {children}
                        </main>

                        {/* Bottom: Navigation */}
                        <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t border-border-light">
                            <div className="px-6 sm:px-10 py-4 flex items-center justify-between">
                                {prevStep ? (
                                    <button
                                        onClick={() => router.push(prevStep.path)}
                                        className="btn btn-ghost text-sm"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        ย้อนกลับ
                                    </button>
                                ) : (
                                    <div />
                                )}

                                {nextStep ? (
                                    <button
                                        onClick={() => router.push(nextStep.path)}
                                        className="btn btn-primary text-sm"
                                    >
                                        ถัดไป
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                ) : isLastStep ? (
                                    <button
                                        onClick={() => {
                                            router.push("/console/easepay");
                                            // Delay wizardMode off to prevent /console redirect race
                                            setTimeout(() => setWizardMode(false), 200);
                                        }}
                                        className="btn btn-primary text-sm"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        เสร็จสิ้น
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {/* ===== Right Panel — Illustration ===== */}
                    <div className="hidden lg:block fixed top-0 right-0 bottom-0 w-[42%]">
                        <div
                            className="relative w-full h-full overflow-hidden"
                            style={{ background: brand.gradient }}
                        >
                            {/* Decorative floating circles */}
                            <div className="absolute w-[280px] h-[280px] rounded-full bg-white/[0.07] -top-10 -right-10 animate-float-1" />
                            <div className="absolute w-[180px] h-[180px] rounded-full bg-white/[0.05] bottom-[15%] -left-12 animate-float-2" />
                            <div className="absolute w-[100px] h-[100px] rounded-full bg-white/[0.04] top-[45%] left-[35%] animate-float-3" />
                            <div className="absolute w-[120px] h-[120px] rounded-full border-[12px] border-white/[0.06] top-[20%] left-[10%] animate-spin-slow" />
                            <div className="absolute w-[60px] h-[60px] rounded-full bg-white/[0.03] bottom-[35%] right-[15%] animate-float-1" />

                            {/* Center content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center px-12">
                                <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-6">
                                    <IllustrationIcon className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-white text-2xl font-bold mb-3 text-center">
                                    {currentStep.illustrationTitle}
                                </h2>
                                <p className="text-white/50 text-sm leading-relaxed text-center whitespace-pre-line">
                                    {currentStep.illustrationSubtitle}
                                </p>
                            </div>

                            {/* Step counter at bottom */}
                            <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-4">
                                {/* Mini dots */}
                                <div className="flex items-center gap-2">
                                    {WIZARD_STEPS.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`rounded-full transition-all duration-300 ${
                                                i === currentStepIndex
                                                    ? "w-6 h-2 bg-white/60"
                                                    : i < currentStepIndex
                                                        ? "w-2 h-2 bg-white/40"
                                                        : "w-2 h-2 bg-white/20"
                                            }`}
                                        />
                                    ))}
                                </div>
                                <Image
                                    src={brand.logo}
                                    alt={brand.name}
                                    width={32}
                                    height={32}
                                    className="rounded-full opacity-30"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toast */}
                {toast && (
                    <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
                )}
            </div>
        );
    }

    // Normal console layout
    return (
        <div className="min-h-screen bg-bg-dark" style={themeStyle}>
            <ConsoleSidebar
                session={session}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
            />

            {/* Main content */}
            <main className="lg:ml-72 min-h-screen">
                <div className="px-6 lg:px-10 py-8 max-w-5xl">
                    {children}
                </div>
            </main>

            {/* Toast */}
            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}
        </div>
    );
}
