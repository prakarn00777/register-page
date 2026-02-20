"use client";

import { ExternalLink, FileSpreadsheet, ClipboardList } from "lucide-react";
import { getEntityLabel } from "@/types";
import type { ProductType } from "@/types";

interface StepProceduresProps {
    spreadsheetId: string | null;
    sheetUrl: string | null;
    product: ProductType;
}

export default function StepProcedures({ spreadsheetId, sheetUrl, product }: StepProceduresProps) {
    const entity = getEntityLabel(product);

    return (
        <div className="space-y-8 animate-fade-up">
            {/* Step Header */}
            <div>
                <p className="text-sm font-semibold mb-2" style={{ color: "var(--primary)" }}>
                    ขั้นตอนที่ 3
                </p>
                <h2 className="text-2xl lg:text-3xl font-bold text-text-main leading-tight">
                    เพิ่มข้อมูลหัตถการ
                </h2>
                <p className="text-text-muted mt-3">
                    กรอกรายการหัตถการทั้งหมดที่{entity}ให้บริการ ใน Google Sheet
                </p>
            </div>

            {/* Sheet Link Card */}
            <div className="glass-card p-8 text-center space-y-6">
                <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                    style={{ background: "var(--primary-soft)" }}
                >
                    <ClipboardList className="w-8 h-8" style={{ color: "var(--primary)" }} />
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-text-main mb-2">รายการหัตถการ</h3>
                    <p className="text-sm text-text-muted max-w-sm mx-auto leading-relaxed">
                        กดปุ่มด้านล่างเพื่อเปิด Google Sheet แล้วกรอกรายการหัตถการ
                        เช่น ชื่อหัตถการ หมวดหมู่ ราคา ระยะเวลา
                    </p>
                </div>

                {sheetUrl ? (
                    <a
                        href={sheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary inline-flex items-center gap-2 text-base px-8 py-3"
                    >
                        <FileSpreadsheet className="w-5 h-5" />
                        เปิด Google Sheet
                        <ExternalLink className="w-4 h-4" />
                    </a>
                ) : (
                    <div className="text-sm text-text-light">
                        ยังไม่มี Google Sheet — กรุณาติดต่อทีม CS
                    </div>
                )}
            </div>

            <p className="text-xs text-text-muted text-center">
                กรอกข้อมูลเสร็จแล้ว กด &quot;ถัดไป&quot; เพื่อดำเนินการต่อ
            </p>
        </div>
    );
}
