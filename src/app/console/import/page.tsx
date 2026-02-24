"use client";

import { Download, Clock } from "lucide-react";

export default function ConsoleImportPage() {
    return (
        <div className="space-y-6 animate-fade-up">
            <div>
                <h1 className="text-2xl font-bold text-text-main">นำเข้าข้อมูล</h1>
                <p className="text-text-muted text-sm mt-1">นำเข้าข้อมูลหัตถการ สินค้า และอื่นๆ</p>
            </div>

            <div className="glass-card p-12 text-center">
                <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    style={{ background: "var(--primary-soft)" }}
                >
                    <Download className="w-10 h-10" style={{ color: "var(--primary)" }} />
                </div>
                <h2 className="text-xl font-bold text-text-main mb-2">เร็วๆ นี้</h2>
                <p className="text-text-muted text-sm max-w-sm mx-auto leading-relaxed">
                    ฟีเจอร์นำเข้าข้อมูลกำลังอยู่ในระหว่างการพัฒนา
                    คุณจะสามารถอัปโหลดไฟล์ CSV หรือเชื่อมต่อ Google Sheet ได้ในเร็วๆ นี้
                </p>
                <div className="flex items-center justify-center gap-2 mt-6 text-xs text-text-light">
                    <Clock className="w-3.5 h-3.5" />
                    กำลังพัฒนา
                </div>
            </div>
        </div>
    );
}
