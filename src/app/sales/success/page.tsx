"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useCallback, Suspense } from "react";
import Image from "next/image";
import { Copy, Check, Mail, MailX, Plus, Loader2 } from "lucide-react";
import type { ProductType } from "@/types";

const BRAND: Record<ProductType, { name: string; logo: string; gradient: string }> = {
    dr_ease: {
        name: "Dr.Ease",
        logo: "/logo-drease.png",
        gradient: "linear-gradient(135deg, #7053E1 0%, #8B6CF7 40%, #A855F7 100%)",
    },
    easepos: {
        name: "Ease POS",
        logo: "/logo-easepos.png",
        gradient: "linear-gradient(135deg, #F76D85 0%, #FF8FA3 40%, #FFB3C1 100%)",
    },
};

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const code = searchParams.get("code") || "---";
    const email = searchParams.get("email") || "";
    const name = searchParams.get("name") || "";
    const emailSent = searchParams.get("emailSent") === "1";
    const product = (searchParams.get("product") as ProductType) || "dr_ease";

    const brand = BRAND[product] || BRAND.dr_ease;
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for browsers that don't support clipboard API
            const el = document.createElement("textarea");
            el.value = code;
            document.body.appendChild(el);
            el.select();
            document.execCommand("copy");
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [code]);

    return (
        <div className="min-h-screen bg-bg-dark flex items-center justify-center p-6" style={{
            "--primary": product === "easepos" ? "#F76D85" : "#7053E1",
            "--primary-hover": product === "easepos" ? "#E55C74" : "#5F44D0",
            "--primary-soft": product === "easepos" ? "rgba(247, 109, 133, 0.06)" : "rgba(112, 83, 225, 0.06)",
            "--primary-ring": product === "easepos" ? "rgba(247, 109, 133, 0.12)" : "rgba(112, 83, 225, 0.12)",
        } as React.CSSProperties}>
            <div className="w-full max-w-md">
                <div className="glass-card p-8 text-center animate-fade-up">
                    {/* Success icon */}
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 animate-success"
                        style={{ background: "var(--primary-soft)" }}
                    >
                        <Check className="w-8 h-8" style={{ color: "var(--primary)" }} />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Image src={brand.logo} alt={brand.name} width={24} height={24} className="rounded-full" />
                        <span className="text-sm font-medium text-text-muted">{brand.name}</span>
                    </div>

                    <h1 className="text-xl font-bold text-text-main mb-1">
                        สร้างรหัสสำเร็จ!
                    </h1>
                    {name && (
                        <p className="text-text-muted text-sm mb-6">{name}</p>
                    )}

                    {/* Code Display */}
                    <div
                        className="rounded-2xl p-6 mb-4"
                        style={{ background: "var(--primary-soft)", border: "2px solid var(--primary)" }}
                    >
                        <p className="text-xs font-medium text-text-muted mb-2">รหัส Onboarding</p>
                        <p
                            className="text-4xl font-extrabold tracking-[6px] mb-3"
                            style={{ color: "var(--primary)" }}
                        >
                            {code}
                        </p>
                        <button
                            onClick={handleCopy}
                            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-all"
                            style={{
                                color: copied ? "var(--success)" : "var(--primary)",
                                background: copied ? "rgba(0, 186, 136, 0.1)" : "white",
                            }}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    คัดลอกแล้ว!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    คัดลอกรหัส
                                </>
                            )}
                        </button>
                    </div>

                    {/* Email Status */}
                    {emailSent ? (
                        <div className="flex items-center gap-2 justify-center text-sm text-green-600 bg-green-50 px-4 py-3 rounded-xl mb-6">
                            <Mail className="w-4 h-4" />
                            ส่งรหัสไปที่ {email} เรียบร้อย
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 justify-center text-sm text-amber-600 bg-amber-50 px-4 py-3 rounded-xl mb-6">
                            <MailX className="w-4 h-4" />
                            ส่งอีเมลไม่สำเร็จ — กรุณาส่งรหัสให้ลูกค้าเอง
                        </div>
                    )}

                    {/* Customer URL info */}
                    <div className="text-xs text-text-light bg-bg-dark rounded-xl p-4 mb-6 text-left space-y-1">
                        <p>ลูกค้าเข้าที่:</p>
                        <p className="font-mono font-medium text-text-muted">onboarding.atizdesk.com</p>
                        <p>แล้วกรอกรหัส <span className="font-mono font-bold" style={{ color: "var(--primary)" }}>{code}</span> เพื่อเริ่มกรอกข้อมูล</p>
                    </div>

                    {/* Actions */}
                    <button
                        onClick={() => router.push("/sales")}
                        className="btn btn-primary w-full"
                    >
                        <Plus className="w-4 h-4" />
                        กรอกลูกค้าใหม่
                    </button>
                </div>

                {/* Footer */}
                <p className="text-xs text-text-light text-center mt-6">
                    Atiz — Customer Success Team
                </p>
            </div>
        </div>
    );
}

export default function SalesSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--primary)" }} />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
