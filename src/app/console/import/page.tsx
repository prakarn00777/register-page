"use client";

import { useState, useCallback } from "react";
import { ExternalLink, FileSpreadsheet, Plus, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useSessionStore } from "@/stores/useSessionStore";
import { createSheetForSession } from "@/actions/onboarding";
import { getEntityLabel } from "@/types";

export default function ConsoleImportPage() {
    const { session } = useSessionStore();
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    if (!session) return null;

    const product = session.product || "dr_ease";
    const entity = getEntityLabel(product);
    const sheetId = session.sheet_id;
    const sheetUrl = session.sheet_url;
    const hasSheet = !!sheetId && !!sheetUrl;

    const handleCreateSheet = useCallback(async () => {
        setCreating(true);
        setError("");
        const result = await createSheetForSession();
        if (!result.success) {
            setError(result.error);
            setCreating(false);
            return;
        }
        window.location.reload();
    }, []);

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-text-main">นำเข้าข้อมูล</h1>
                <p className="text-text-muted text-sm mt-1">
                    กรอกรายการหัตถการและสินค้าของ{entity}ผ่าน Google Sheet
                </p>
            </div>

            {hasSheet ? (
                /* Sheet exists — show link card */
                <div className="glass-card p-8 text-center space-y-5">
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                        style={{ background: "rgba(34, 197, 94, 0.08)" }}
                    >
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-text-main mb-2">
                            Google Sheet พร้อมใช้งาน
                        </h2>
                        <p className="text-sm text-text-muted max-w-md mx-auto leading-relaxed">
                            กดปุ่มด้านล่างเพื่อเปิด Google Sheet แล้วกรอกข้อมูลหัตถการและสินค้าของ{entity}
                        </p>
                    </div>

                    <a
                        href={sheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary mx-auto inline-flex"
                    >
                        <ExternalLink className="w-4 h-4" />
                        เปิด Google Sheet
                    </a>

                    <p className="text-xs text-text-light">
                        ข้อมูลจะบันทึกอัตโนมัติใน Google Sheet
                    </p>
                </div>
            ) : (
                /* No sheet yet — offer to create */
                <div className="glass-card p-10 text-center space-y-5">
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                        style={{ background: "var(--primary-soft)" }}
                    >
                        <FileSpreadsheet className="w-8 h-8" style={{ color: "var(--primary)" }} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-text-main mb-2">
                            สร้าง Google Sheet สำหรับกรอกข้อมูล
                        </h2>
                        <p className="text-sm text-text-muted max-w-md mx-auto leading-relaxed">
                            ระบบจะสร้าง Google Sheet ที่มี template หัตถการและสินค้าให้คุณ
                            สามารถกรอกข้อมูลได้ทันทีผ่าน Google Sheet
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-center justify-center gap-2 text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl max-w-sm mx-auto">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleCreateSheet}
                        disabled={creating}
                        className="btn btn-primary mx-auto"
                    >
                        {creating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                สร้าง Google Sheet
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
