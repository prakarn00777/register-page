"use client";

import type { OnboardingStatus } from "@/types";

const STATUS_CONFIG: Record<OnboardingStatus, { label: string; color: string; bg: string }> = {
    pending: { label: "รอดำเนินการ", color: "#F4B740", bg: "rgba(244, 183, 64, 0.1)" },
    in_progress: { label: "กำลังดำเนินการ", color: "#7053E1", bg: "rgba(112, 83, 225, 0.1)" },
    submitted: { label: "ส่งข้อมูลแล้ว", color: "#3B82F6", bg: "rgba(59, 130, 246, 0.1)" },
    approved: { label: "อนุมัติแล้ว", color: "#00BA88", bg: "rgba(0, 186, 136, 0.1)" },
    rejected: { label: "ต้องแก้ไข", color: "#ED4F4F", bg: "rgba(237, 79, 79, 0.1)" },
};

export default function StatusBadge({ status }: { status: OnboardingStatus }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

    return (
        <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ color: config.color, background: config.bg }}
        >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: config.color }} />
            {config.label}
        </span>
    );
}
