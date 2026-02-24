"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { useSessionStore } from "@/stores/useSessionStore";
import { changePin, logoutSession } from "@/actions/onboarding";

export default function ConsoleSettingsPage() {
    const router = useRouter();
    const { session, clearSession } = useSessionStore();
    const [oldPin, setOldPin] = useState("");
    const [newPin, setNewPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [showPin, setShowPin] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    if (!session) return null;

    const handleChangePin = useCallback(async () => {
        setError("");
        setSuccess("");

        if (!oldPin || oldPin.length !== 6) {
            setError("กรุณากรอก PIN เดิม 6 หลัก");
            return;
        }
        if (!newPin || newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
            setError("PIN ใหม่ต้องเป็นตัวเลข 6 หลัก");
            return;
        }
        if (newPin !== confirmPin) {
            setError("PIN ใหม่ไม่ตรงกัน");
            return;
        }

        setSaving(true);
        const result = await changePin(oldPin, newPin);
        setSaving(false);

        if (!result.success) {
            setError(result.error);
            return;
        }

        setSuccess("เปลี่ยน PIN สำเร็จ");
        setOldPin("");
        setNewPin("");
        setConfirmPin("");
    }, [oldPin, newPin, confirmPin]);

    const handleLogout = useCallback(async () => {
        await logoutSession();
        clearSession();
        router.replace("/onboard");
    }, [clearSession, router]);

    return (
        <div className="space-y-8 animate-fade-up">
            <div>
                <h1 className="text-2xl font-bold text-text-main">ตั้งค่า</h1>
                <p className="text-text-muted text-sm mt-1">จัดการบัญชีและความปลอดภัย</p>
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
                </div>
            </div>

            {/* Change PIN */}
            <div className="glass-card p-6 space-y-5">
                <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--primary)" }}>
                    <KeyRound className="w-4 h-4" />
                    เปลี่ยน PIN
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-main">
                            PIN เดิม
                        </label>
                        <div className="relative">
                            <input
                                type={showPin ? "text" : "password"}
                                inputMode="numeric"
                                maxLength={6}
                                className="input-field pr-10"
                                placeholder="6 หลัก"
                                value={oldPin}
                                onChange={(e) => {
                                    setOldPin(e.target.value.replace(/\D/g, "").slice(0, 6));
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
                            PIN ใหม่
                        </label>
                        <input
                            type={showPin ? "text" : "password"}
                            inputMode="numeric"
                            maxLength={6}
                            className="input-field"
                            placeholder="6 หลัก"
                            value={newPin}
                            onChange={(e) => {
                                setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6));
                                setError("");
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-main">
                            ยืนยัน PIN ใหม่
                        </label>
                        <input
                            type={showPin ? "text" : "password"}
                            inputMode="numeric"
                            maxLength={6}
                            className="input-field"
                            placeholder="6 หลัก"
                            value={confirmPin}
                            onChange={(e) => {
                                setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6));
                                setError("");
                            }}
                        />
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}
                {success && (
                    <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        {success}
                    </div>
                )}

                <button
                    onClick={handleChangePin}
                    disabled={saving}
                    className="btn btn-primary"
                >
                    {saving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        "เปลี่ยน PIN"
                    )}
                </button>
            </div>

            {/* Logout */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-text-main">ออกจากระบบ</h2>
                        <p className="text-xs text-text-muted mt-1">ใช้เบอร์โทร + PIN เพื่อเข้าสู่ระบบอีกครั้ง</p>
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
