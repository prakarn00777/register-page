"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Phone, KeyRound, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import IllustrationPanel from "@/components/wizard/IllustrationPanel";
import { findSessionByPhoneAndPin } from "@/actions/onboarding";

export default function OnboardEditPage() {
    const router = useRouter();
    const [phone, setPhone] = useState("");
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = useCallback(async () => {
        if (!phone.trim()) {
            setError("กรุณากรอกเบอร์โทรศัพท์");
            return;
        }
        if (!pin.trim()) {
            setError("กรุณากรอก PIN");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const result = await findSessionByPhoneAndPin(phone.trim(), pin.trim());
            if (!result.success) {
                setError(result.error);
                setLoading(false);
                return;
            }
            router.push(`/onboard/${result.data.token}/wizard`);
        } catch {
            setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
            setLoading(false);
        }
    }, [phone, pin, router]);

    return (
        <div className="min-h-screen bg-white">
            {/* Left Panel */}
            <div className="min-h-screen flex items-center justify-center p-6 lg:p-12 lg:mr-[45%]">
                <div className="w-full max-w-sm animate-fade-up">
                    {/* Back link */}
                    <button
                        onClick={() => router.push("/onboard")}
                        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main transition-colors mb-10"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        กลับหน้าหลัก
                    </button>

                    {/* Heading */}
                    <h1 className="text-3xl font-bold text-text-main mb-3 leading-tight">
                        แก้ไขข้อมูล
                    </h1>
                    <p className="text-text-muted mb-10 leading-relaxed">
                        กรอกเบอร์โทรศัพท์และ PIN ที่คุณตั้งไว้
                        เพื่อเข้าแก้ไขข้อมูลของคุณ
                    </p>

                    {/* Form */}
                    <div className="space-y-5">
                        {/* Phone */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-text-main">
                                <Phone className="w-4 h-4" style={{ color: "var(--primary)" }} />
                                เบอร์โทรศัพท์
                            </label>
                            <input
                                type="tel"
                                inputMode="tel"
                                className="input-field"
                                placeholder="0xx-xxx-xxxx"
                                value={phone}
                                onChange={(e) => {
                                    setPhone(e.target.value);
                                    setError("");
                                }}
                                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                            />
                        </div>

                        {/* PIN */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-text-main">
                                <KeyRound className="w-4 h-4" style={{ color: "var(--primary)" }} />
                                รหัส PIN
                            </label>
                            <input
                                type="password"
                                inputMode="numeric"
                                maxLength={6}
                                className="input-field"
                                placeholder="กรอก PIN 4-6 หลัก"
                                value={pin}
                                onChange={(e) => {
                                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                                    setPin(v);
                                    setError("");
                                }}
                                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
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
                            disabled={loading}
                            className="btn btn-primary w-full text-base py-3"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "เข้าแก้ไขข้อมูล"
                            )}
                        </button>
                    </div>

                    {/* Footer */}
                    <p className="text-xs text-text-light mt-12">
                        หากจำ PIN ไม่ได้ กรุณาติดต่อทีม CS ของเรา
                    </p>
                </div>
            </div>

            {/* Right Illustration Panel */}
            <div className="hidden lg:block fixed top-0 right-0 bottom-0 w-[45%]">
                <IllustrationPanel step={0} product="dr_ease" />
            </div>
        </div>
    );
}
