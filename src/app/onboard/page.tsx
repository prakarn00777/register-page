"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import ProductSelect from "@/components/wizard/ProductSelect";
import type { ProductType } from "@/types";

export default function OnboardLandingPage() {
    const router = useRouter();

    const handleProductSelect = useCallback((product: ProductType) => {
        router.push(`/onboard/register?product=${product}`);
    }, [router]);

    const handleLoginClick = useCallback(() => {
        router.push("/onboard/login");
    }, [router]);

    return (
        <ProductSelect
            onSelect={handleProductSelect}
            onEditClick={handleLoginClick}
        />
    );
}
