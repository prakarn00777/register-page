"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import ProductSelect from "@/components/wizard/ProductSelect";
import { createCustomerSession } from "@/actions/onboarding";
import type { ProductType } from "@/types";

export default function OnboardLandingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleProductSelect = useCallback(async (product: ProductType) => {
        setLoading(true);
        setError("");
        try {
            const result = await createCustomerSession(product);
            if (!result.success) {
                setError(result.error);
                setLoading(false);
                return;
            }
            router.push(`/onboard/${result.data.token}/wizard`);
        } catch {
            setError("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่อีกครั้ง");
            setLoading(false);
        }
    }, [router]);

    const handleEditClick = useCallback(() => {
        router.push("/onboard/edit");
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center animate-fade-up">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: "var(--primary)" }} />
                    <p className="text-sm text-text-muted">กำลังเตรียมข้อมูล...</p>
                </div>
            </div>
        );
    }

    return (
        <ProductSelect
            onSelect={handleProductSelect}
            onEditClick={handleEditClick}
            error={error}
        />
    );
}
