"use client";

import { ExternalLink, FileSpreadsheet } from "lucide-react";

interface SheetEmbedProps {
    spreadsheetId: string;
    sheetUrl: string;
    gid?: number;
    title: string;
    description: string;
}

export default function SheetEmbed({ spreadsheetId, sheetUrl, gid = 0, title, description }: SheetEmbedProps) {
    const embedUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?gid=${gid}&embedded=true`;

    return (
        <div className="space-y-4 animate-fade-up">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-xl font-bold text-text-main mb-1">{title}</h2>
                    <p className="text-sm text-text-muted">{description}</p>
                </div>
                <a
                    href={sheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline text-xs shrink-0"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                    เปิดใน Google Sheet
                </a>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border" style={{ background: "var(--bg-dark)" }}>
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-text-muted">Google Sheets</span>
                </div>
                <iframe
                    src={embedUrl}
                    className="w-full border-0"
                    style={{ height: "500px" }}
                    allow="fullscreen"
                    title={title}
                />
            </div>

            <p className="text-xs text-text-muted text-center">
                กรอกข้อมูลใน Google Sheet ด้านบน จากนั้นกด &quot;ถัดไป&quot; เพื่อดำเนินการต่อ
            </p>
        </div>
    );
}
