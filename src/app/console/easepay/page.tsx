"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import EasePayOffer from "@/components/console/EasePayOffer";
import { useSessionStore } from "@/stores/useSessionStore";
import { getEasePayApplication, type EasePayApplication } from "@/actions/easepay";

export default function EasePayPage() {
    const { session } = useSessionStore();
    const searchParams = useSearchParams();
    const [existing, setExisting] = useState<EasePayApplication | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const result = await getEasePayApplication();
            if (result.success) setExisting(result.data.application);
            setLoading(false);
        }
        load();
    }, []);

    if (!session) return null;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--primary)" }} />
            </div>
        );
    }

    return (
        <EasePayOffer
            session={session}
            existingApplication={existing}
            onSubmitted={setExisting}
            isWizardFlow={searchParams.get("from") === "wizard"}
        />
    );
}
