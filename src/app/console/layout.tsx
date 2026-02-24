"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { session, setSession, isLoading, setLoading } = useSessionStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        async function loadSession() {
            setLoading(true);
            const result = await getConsoleSession();
            if (!result.success) {
                router.replace("/onboard/login");
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
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
