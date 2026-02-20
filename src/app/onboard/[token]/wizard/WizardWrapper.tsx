"use client";

import { useRouter } from "next/navigation";
import WizardShell from "@/components/wizard/WizardShell";
import type { OnboardingSession } from "@/types";

interface WizardWrapperProps {
    session: OnboardingSession;
}

export default function WizardWrapper({ session }: WizardWrapperProps) {
    const router = useRouter();

    return (
        <WizardShell
            session={session}
            product={session.product || "dr_ease"}
            onBackToProducts={() => router.back()}
        />
    );
}
