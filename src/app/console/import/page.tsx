"use client";

import { useState, useCallback } from "react";
import { ClipboardList, Package, ExternalLink, FileSpreadsheet, Plus, Loader2, AlertCircle } from "lucide-react";
import { useSessionStore } from "@/stores/useSessionStore";
import { createSheetForSession } from "@/actions/onboarding";
import { getEntityLabel } from "@/types";

type Tab = "procedures" | "products";

export default function ConsoleImportPage() {
    const { session, setSession } = useSessionStore();
    const [activeTab, setActiveTab] = useState<Tab>("procedures");
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    if (!session) return null;

    const product = session.product || "dr_ease";
    const entity = getEntityLabel(product);
    const sheetId = session.sheet_id;
    const sheetUrl = session.sheet_url;
    const hasSheet = !!sheetId && !!sheetUrl;

    const tabs: { id: Tab; label: string; icon: React.ElementType; gid: number }[] = [
        { id: "procedures", label: "หัตถการ", icon: ClipboardList, gid: 0 },
        { id: "products", label: "สินค้า", icon: Package, gid: 1 },
    ];

    const handleCreateSheet = useCallback(async () => {
        setCreating(true);
        setError("");
        const result = await createSheetForSession();
        if (!result.success) {
            setError(result.error);
            setCreating(false);
            return;
        }
        // Reload session to get sheet_id/sheet_url
        window.location.reload();
    }, []);

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">นำเข้าข้อมูล</h1>
                    <p className="text-text-muted text-sm mt-1">
                        กรอกรายการหัตถการและสินค้าของ{entity}ผ่าน Google Sheet
                    </p>
                </div>
                {hasSheet && (
                    <a
                        href={sheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline shrink-0 text-sm"
                    >
                        <ExternalLink className="w-4 h-4" />
                        เปิดใน Google Sheet
                    </a>
                )}
            </div>

            {hasSheet ? (
                <>
                    {/* Tab switcher */}
                    <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--input-bg)" }}>
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium
                                        transition-all duration-200
                                        ${isActive
                                            ? "bg-white text-text-main shadow-sm"
                                            : "text-text-muted hover:text-text-main"
                                        }
                                    `}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Sheet embed */}
                    <div className="glass-card overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border" style={{ background: "var(--bg-dark)" }}>
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-medium text-text-muted">
                                Google Sheets — {tabs.find(t => t.id === activeTab)?.label}
                            </span>
                        </div>
                        <iframe
                            key={activeTab}
                            src={`https://docs.google.com/spreadsheets/d/${sheetId}/edit?gid=${tabs.find(t => t.id === activeTab)?.gid || 0}&embedded=true`}
                            className="w-full border-0"
                            style={{ height: "500px" }}
                            allow="fullscreen"
                            title={`${tabs.find(t => t.id === activeTab)?.label} Sheet`}
                        />
                    </div>

                    <p className="text-xs text-text-muted text-center">
                        กรอกข้อมูลใน Google Sheet ด้านบน ข้อมูลจะบันทึกอัตโนมัติ
                    </p>
                </>
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
