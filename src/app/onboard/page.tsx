"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, AlertCircle, KeyRound, ArrowRight } from "lucide-react";
import { loginWithCode } from "@/actions/onboarding";

export default function OnboardLandingPage() {
    const router = useRouter();
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const formatCode = useCallback((raw: string) => {
        // Allow letters, numbers, and hyphen
        const clean = raw.toUpperCase().replace(/[^A-Z0-9-]/g, "");
        // Auto-insert hyphen after 3 chars if not present
        if (clean.length === 3 && !clean.includes("-")) {
            return clean + "-";
        }
        // Limit to format XXX-XXXX (8 chars)
        return clean.slice(0, 8);
    }, []);

    const handleSubmit = useCallback(async () => {
        const trimmed = code.trim();
        if (!trimmed) {
            setError("กรุณากรอกรหัส Onboarding");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const result = await loginWithCode(trimmed);
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
    }, [code, router]);

    return (
        <div className="min-h-screen bg-white">
            {/* Left Panel */}
            <div className="min-h-screen flex items-center justify-center p-6 lg:p-12 lg:mr-[45%]">
                <div className="w-full max-w-sm animate-fade-up">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-12">
                        <Image src="/logo-drease.png" alt="Atiz" width={40} height={40} className="rounded-full" />
                        <span className="text-lg font-bold text-text-main">Onboarding</span>
                    </div>

                    {/* Heading */}
                    <h1 className="text-3xl font-bold text-text-main mb-3 leading-tight">
                        กรอกรหัส Onboarding
                    </h1>
                    <p className="text-text-muted mb-10 leading-relaxed">
                        ใช้รหัสที่ได้รับจากทีมเซลล์ หรือจากอีเมล
                        เพื่อเข้าจัดการข้อมูลของคุณ
                    </p>

                    {/* Code Input */}
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-text-main">
                                <KeyRound className="w-4 h-4" style={{ color: "var(--primary)" }} />
                                รหัส Onboarding
                            </label>
                            <input
                                type="text"
                                className="input-field text-center text-lg font-mono font-bold tracking-widest !h-14"
                                placeholder="ABC-1234"
                                maxLength={8}
                                value={code}
                                onChange={(e) => {
                                    setCode(formatCode(e.target.value));
                                    setError("");
                                }}
                                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                autoFocus
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
                            disabled={loading || !code.trim()}
                            className="btn btn-primary w-full text-base py-3"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    เข้าสู่ระบบ
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>

                    {/* Help text */}
                    <p className="text-xs text-text-light mt-12">
                        หากไม่ได้รับรหัส กรุณาติดต่อทีม CS ของเรา
                    </p>
                </div>
            </div>

            {/* Right Illustration Panel */}
            <div className="hidden lg:block fixed top-0 right-0 bottom-0 w-[45%]">
                <div
                    className="relative w-full h-full overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #7053E1 0%, #8B6CF7 40%, #A855F7 100%)" }}
                >
                    {/* Decorative elements */}
                    <div className="absolute w-[280px] h-[280px] rounded-full bg-white/[0.07] -top-10 -right-10 animate-float-1" />
                    <div className="absolute w-[180px] h-[180px] rounded-full bg-white/[0.05] bottom-[15%] -left-12 animate-float-2" />
                    <div className="absolute w-[100px] h-[100px] rounded-full bg-white/[0.04] top-[45%] left-[35%] animate-float-3" />
                    <div className="absolute w-[120px] h-[120px] rounded-full border-[12px] border-white/[0.06] top-[20%] left-[10%] animate-spin-slow" />

                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-12">
                        <KeyRound className="w-12 h-12 text-white/80 mb-6" />
                        <h2 className="text-white text-2xl font-bold mb-3 text-center">
                            ยินดีต้อนรับ
                        </h2>
                        <p className="text-white/50 text-sm leading-relaxed text-center">
                            กรอกรหัสที่ได้รับ{"\n"}เพื่อเริ่มตั้งค่าระบบของคุณ
                        </p>
                    </div>

                    {/* Brand logo at bottom */}
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                        <Image
                            src="/logo-drease.png"
                            alt="Atiz"
                            width={36}
                            height={36}
                            className="rounded-full opacity-30"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
