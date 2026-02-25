"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut, Copy, Check } from "lucide-react";
import { useSessionStore } from "@/stores/useSessionStore";
import { logoutSession } from "@/actions/onboarding";

export default function ConsoleSettingsPage() {
    const router = useRouter();
    const { session, clearSession } = useSessionStore();
    const [copied, setCopied] = useState(false);

    if (!session) return null;

    const handleCopyCode = useCallback(async () => {
        if (!session.code) return;
        try {
            await navigator.clipboard.writeText(session.code);
        } catch {
            const el = document.createElement("textarea");
            el.value = session.code;
            document.body.appendChild(el);
            el.select();
            document.execCommand("copy");
            document.body.removeChild(el);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [session.code]);

    const handleLogout = useCallback(async () => {
        await logoutSession();
        clearSession();
        router.replace("/onboard");
    }, [clearSession, router]);

    return (
        <div className="space-y-8 animate-fade-up">
            <div>
                <h1 className="text-2xl font-bold text-text-main">ตั้งค่า</h1>
                <p className="text-text-muted text-sm mt-1">ข้อมูลบัญชีและการเข้าสู่ระบบ</p>
            </div>

            {/* Account info */}
            <div className="glass-card p-6 space-y-4">
                <h2 className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
                    ข้อมูลบัญชี
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-text-muted">ชื่อร้าน/คลินิก: </span>
                        <span className="font-medium text-text-main">{session.customer_name || "-"}</span>
                    </div>
                    <div>
                        <span className="text-text-muted">เบอร์โทร: </span>
                        <span className="font-medium text-text-main">{session.clinic_data?.ownerPhone || "-"}</span>
                    </div>
                    {session.email && (
                        <div>
                            <span className="text-text-muted">อีเมล: </span>
                            <span className="font-medium text-text-main">{session.email}</span>
                        </div>
                    )}
                    {session.product && (
                        <div>
                            <span className="text-text-muted">ผลิตภัณฑ์: </span>
                            <span className="font-medium text-text-main">
                                {session.product === "easepos" ? "Ease POS" : "Dr.Ease"}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Onboarding Code */}
            {session.code && (
                <div className="glass-card p-6 space-y-4">
                    <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--primary)" }}>
                        <KeyRound className="w-4 h-4" />
                        รหัส Onboarding
                    </h2>
                    <div className="flex items-center gap-4">
                        <div
                            className="px-6 py-3 rounded-xl font-mono text-2xl font-bold tracking-[4px]"
                            style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
                        >
                            {session.code}
                        </div>
                        <button
                            onClick={handleCopyCode}
                            className="btn btn-ghost text-sm"
                            style={copied ? { color: "var(--success)" } : undefined}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    คัดลอกแล้ว
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    คัดลอก
                                </>
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-text-light">
                        ใช้รหัสนี้สำหรับเข้าสู่ระบบครั้งถัดไปที่ onboarding.atizdesk.com
                    </p>
                </div>
            )}

            {/* Logout */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-text-main">ออกจากระบบ</h2>
                        <p className="text-xs text-text-muted mt-1">ใช้รหัส Onboarding เพื่อเข้าสู่ระบบอีกครั้ง</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="btn btn-ghost !text-red-400 hover:!bg-red-50"
                    >
                        <LogOut className="w-4 h-4" />
                        ออกจากระบบ
                    </button>
                </div>
            </div>
        </div>
    );
}
