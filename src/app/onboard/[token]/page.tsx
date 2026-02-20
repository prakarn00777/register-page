"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Shield, AlertCircle, Loader2 } from "lucide-react";
import ProductSelect from "@/components/wizard/ProductSelect";
import PinInput from "@/components/ui/PinInput";
import IllustrationPanel from "@/components/wizard/IllustrationPanel";
import { getSessionStatus, selectProduct, verifyPin } from "@/actions/onboarding";
import type { ProductType } from "@/types";

export default function OnboardEntryPage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [mode, setMode] = useState<"loading" | "product_select" | "pin_auth" | "done" | "error">("loading");
    const [sessionProduct, setSessionProduct] = useState<ProductType | null>(null);
    const [error, setError] = useState("");
    const [pinLoading, setPinLoading] = useState(false);

    useEffect(() => {
        getSessionStatus(token).then((result) => {
            if (!result.success) {
                setMode("error");
                setError(result.error);
                return;
            }
            const { status, product, needsPin } = result.data;
            setSessionProduct(product);

            if (status === "submitted" || status === "approved") {
                setMode("done");
            } else if (needsPin) {
                setMode("pin_auth");
            } else {
                setMode("product_select");
            }
        });
    }, [token]);

    const handleProductSelect = useCallback(async (product: ProductType) => {
        const result = await selectProduct(token, product);
        if (!result.success) {
            setError(result.error);
            return;
        }
        router.push(`/onboard/${token}/wizard`);
    }, [token, router]);

    const handlePinComplete = useCallback(async (pin: string) => {
        setPinLoading(true);
        setError("");
        const result = await verifyPin(token, pin);
        if (result.success) {
            router.push(`/onboard/${token}/wizard`);
        } else {
            setError(result.error);
            setPinLoading(false);
        }
    }, [token, router]);

    // Loading
    if (mode === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-text-light" />
            </div>
        );
    }

    // Error
    if (mode === "error") {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="glass-card p-8 max-w-sm w-full text-center animate-fade-up">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-text-main mb-2">ไม่พบข้อมูล</h2>
                    <p className="text-sm text-text-muted">{error || "กรุณาตรวจสอบลิงก์อีกครั้ง"}</p>
                </div>
            </div>
        );
    }

    // Already submitted/approved
    if (mode === "done") {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="glass-card p-8 max-w-sm w-full text-center animate-fade-up">
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-text-main mb-2">ส่งข้อมูลเรียบร้อยแล้ว</h2>
                    <p className="text-sm text-text-muted">ทีม CS กำลังตรวจสอบข้อมูลของคุณ</p>
                </div>
            </div>
        );
    }

    // Product selection (first time)
    if (mode === "product_select") {
        return <ProductSelect onSelect={handleProductSelect} />;
    }

    // PIN auth (returning user)
    const product = sessionProduct || "dr_ease";
    const themeStyle = product === "easepos"
        ? { "--primary": "#F76D85", "--primary-hover": "#E55C74", "--primary-ring": "rgba(247, 109, 133, 0.12)" } as React.CSSProperties
        : { "--primary": "#7053E1", "--primary-hover": "#5F44D0", "--primary-ring": "rgba(112, 83, 225, 0.12)" } as React.CSSProperties;

    return (
        <div className="min-h-screen bg-white" style={themeStyle}>
            {/* Left side - PIN form */}
            <div className="min-h-screen flex items-center justify-center p-6 lg:p-12 lg:mr-[45%]">
                <div className="w-full max-w-sm animate-fade-up">
                    {/* Logo */}
                    <div className="mb-12">
                        <Image
                            src={product === "easepos" ? "/logo-easepos.png" : "/logo-drease.png"}
                            alt={product === "easepos" ? "EasePos" : "Dr.Ease"}
                            width={48}
                            height={48}
                            className="rounded-full"
                        />
                    </div>

                    {/* Heading */}
                    <h1 className="text-3xl font-bold text-text-main mb-3 leading-tight">
                        ยินดีต้อนรับกลับ!
                    </h1>
                    <p className="text-text-muted mb-10 leading-relaxed">
                        กรุณากรอก PIN ที่คุณตั้งไว้
                        เพื่อเข้าแก้ไขข้อมูล
                    </p>

                    {/* PIN Input */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-text-muted text-sm">
                            <Shield className="w-4 h-4" style={{ color: "var(--primary)" }} />
                            <span>รหัส PIN</span>
                        </div>

                        <PinInput
                            length={6}
                            onComplete={handlePinComplete}
                            disabled={pinLoading}
                            error={error}
                        />

                        {pinLoading && (
                            <div className="flex justify-center">
                                <div
                                    className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                                    style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <p className="text-xs text-text-light mt-12">
                        หากจำ PIN ไม่ได้ กรุณาติดต่อทีม CS ของเรา
                    </p>
                </div>
            </div>

            {/* Right side - Illustration */}
            <div className="hidden lg:block fixed top-0 right-0 bottom-0 w-[45%]">
                <IllustrationPanel step={0} product={product} />
            </div>
        </div>
    );
}
