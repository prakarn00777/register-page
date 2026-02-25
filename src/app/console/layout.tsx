"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Loader2, Building2, GitBranch, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import ConsoleSidebar from "@/components/console/ConsoleSidebar";
import Toast from "@/components/ui/Toast";
import { getConsoleSession } from "@/actions/onboarding";
import { useSessionStore } from "@/stores/useSessionStore";
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

const BRAND: Record<ProductType, { name: string; logo: string }> = {
    dr_ease: { name: "Dr.Ease", logo: "/logo-drease.png" },
    easepos: { name: "Ease POS", logo: "/logo-easepos.png" },
};

const WIZARD_STEPS = [
    { path: "/console/info", label: "ข้อมูลร้าน", icon: Building2 },
    { path: "/console/branches", label: "สาขา", icon: GitBranch },
    { path: "/console", label: "ตรวจสอบและส่ง", icon: CheckCircle2 },
];

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

    // Wizard mode logic
    const currentStepIndex = WIZARD_STEPS.findIndex((s) => s.path === pathname);
    const isWizardPage = currentStepIndex !== -1;
    const showWizard = wizardMode && isWizardPage;

    const prevStep = currentStepIndex > 0 ? WIZARD_STEPS[currentStepIndex - 1] : null;
    const nextStep = currentStepIndex < WIZARD_STEPS.length - 1 ? WIZARD_STEPS[currentStepIndex + 1] : null;
    const isLastStep = currentStepIndex === WIZARD_STEPS.length - 1;

    // If wizard mode but user navigated to non-wizard page (settings, import), exit wizard
    if (wizardMode && !isWizardPage && pathname !== "/console/settings" && pathname !== "/console/import") {
        // allow settings/import pages in wizard too
    }

    if (showWizard) {
        return (
            <div className="min-h-screen bg-bg-dark" style={themeStyle}>
                {/* Wizard Top Bar */}
                <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-border-light">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6">
                        {/* Brand + skip */}
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center gap-3">
                                <Image src={brand.logo} alt={brand.name} width={32} height={32} className="rounded-full" />
                                <div>
                                    <p className="text-sm font-bold text-text-main">{brand.name} Onboarding</p>
                                    <p className="text-xs text-text-muted">{session.customer_name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setWizardMode(false);
                                    router.push("/console");
                                }}
                                className="text-xs text-text-light hover:text-text-muted transition-colors"
                            >
                                ข้ามขั้นตอน →
                            </button>
                        </div>

                        {/* Step indicator */}
                        <div className="flex items-center gap-2 pb-4">
                            {WIZARD_STEPS.map((step, i) => {
                                const Icon = step.icon;
                                const isActive = i === currentStepIndex;
                                const isDone = i < currentStepIndex;
                                return (
                                    <div key={step.path} className="flex items-center gap-2 flex-1">
                                        <button
                                            onClick={() => router.push(step.path)}
                                            className={`
                                                flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all w-full
                                                ${isActive
                                                    ? "text-white shadow-md"
                                                    : isDone
                                                        ? "text-emerald-600 bg-emerald-50"
                                                        : "text-text-light bg-black/[0.02]"
                                                }
                                            `}
                                            style={isActive ? {
                                                background: `linear-gradient(135deg, var(--primary), var(--primary-hover))`,
                                            } : undefined}
                                        >
                                            <Icon className="w-3.5 h-3.5 shrink-0" />
                                            <span className="hidden sm:inline">{step.label}</span>
                                            <span className="sm:hidden">{i + 1}</span>
                                        </button>
                                        {i < WIZARD_STEPS.length - 1 && (
                                            <div className={`w-4 h-px shrink-0 ${isDone ? "bg-emerald-300" : "bg-border"}`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Wizard Content */}
                <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                    {children}
                </main>

                {/* Wizard Bottom Nav */}
                <div className="sticky bottom-0 z-30 bg-white/80 backdrop-blur-xl border-t border-border-light">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
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
                                onClick={() => setWizardMode(false)}
                                className="btn btn-primary text-sm"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                เสร็จสิ้น
                            </button>
                        ) : null}
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
