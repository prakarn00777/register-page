"use client";

import { useState, useCallback, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import BranchesForm from "@/components/console/BranchesForm";
import { useSessionStore } from "@/stores/useSessionStore";
import { updateBranchData } from "@/actions/onboarding";
import { getEntityLabel } from "@/types";
import type { BranchData } from "@/types";

export default function ConsoleBranchesPage() {
    const { session, updateBranchData: updateStore } = useSessionStore();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    if (!session) return null;

    const product = session.product || "dr_ease";
    const entity = getEntityLabel(product);
    const isReadOnly = session.status === "submitted" || session.status === "approved";

    const handleChange = useCallback((data: BranchData[]) => {
        updateStore(data);
        setSaved(false);

        // Auto-save debounce 1s
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            setSaving(true);
            await updateBranchData(data);
            setSaving(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }, 1000);
    }, [updateStore]);

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">จัดการสาขา</h1>
                    <p className="text-text-muted text-sm mt-1">
                        {isReadOnly
                            ? "ข้อมูลถูกส่งแล้ว ไม่สามารถแก้ไขได้"
                            : `กรอกรายละเอียดสาขาของ${entity}`}
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    {saving && (
                        <span className="flex items-center gap-1.5 text-text-muted">
                            <div
                                className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
                                style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
                            />
                            กำลังบันทึก...
                        </span>
                    )}
                    {saved && (
                        <span className="flex items-center gap-1.5 text-emerald-500">
                            <CheckCircle2 className="w-4 h-4" />
                            บันทึกแล้ว
                        </span>
                    )}
                </div>
            </div>

            {/* Branch list */}
            <BranchesForm
                data={session.branch_data || []}
                onChange={handleChange}
                readOnly={isReadOnly}
                lockCount
            />
        </div>
    );
}
