"use client";

import { useCallback } from "react";
import FormField from "@/components/ui/FormField";
import { getEntityLabel } from "@/types";
import type { ClinicData, ProductType } from "@/types";

interface StepClinicInfoProps {
    data: ClinicData;
    onChange: (data: ClinicData) => void;
    product: ProductType;
}

const BUSINESS_TYPES_CLINIC = [
    "คลินิกทันตกรรม",
    "คลินิกเวชกรรม",
    "คลินิกความงาม",
    "คลินิกกายภาพบำบัด",
    "คลินิกสัตวแพทย์",
    "อื่นๆ",
];

const BUSINESS_TYPES_SHOP = [
    "ร้านกาแฟ",
    "ร้านอาหาร",
    "ร้านค้าปลีก",
    "ร้านเสริมสวย",
    "ร้านสะดวกซื้อ",
    "อื่นๆ",
];

export default function StepClinicInfo({ data, onChange, product }: StepClinicInfoProps) {
    const update = useCallback((field: keyof ClinicData, value: string) => {
        onChange({ ...data, [field]: value });
    }, [data, onChange]);

    const entity = getEntityLabel(product);
    const isShop = product === "easepos";
    const businessTypes = isShop ? BUSINESS_TYPES_SHOP : BUSINESS_TYPES_CLINIC;
    const placeholderTh = isShop ? "เช่น ร้านกาแฟ Brew" : "เช่น คลินิกทันตกรรม สมายล์";
    const placeholderEn = isShop ? "e.g. Brew Coffee Shop" : "e.g. Smile Dental Clinic";

    return (
        <div className="space-y-10 animate-fade-up">
            {/* Step Header */}
            <div>
                <p className="text-sm font-semibold mb-2" style={{ color: "var(--primary)" }}>
                    ขั้นตอนที่ 1
                </p>
                <h2 className="text-2xl lg:text-3xl font-bold text-text-main leading-tight">
                    บอกเราเกี่ยวกับ{entity}ของคุณ
                </h2>
                <p className="text-text-muted mt-3">กรอกข้อมูลทั่วไปของ{entity}</p>
            </div>

            {/* Name */}
            <div className="space-y-5">
                <h3 className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
                    ชื่อ{entity}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label={`ชื่อ${entity} (ภาษาไทย)`} required>
                        <input
                            type="text"
                            className="input-field"
                            placeholder={placeholderTh}
                            value={data.clinicNameTh || ""}
                            onChange={(e) => update("clinicNameTh", e.target.value)}
                        />
                    </FormField>
                    <FormField label={`ชื่อ${entity} (English)`} required>
                        <input
                            type="text"
                            className="input-field"
                            placeholder={placeholderEn}
                            value={data.clinicNameEn || ""}
                            onChange={(e) => update("clinicNameEn", e.target.value)}
                        />
                    </FormField>
                </div>
            </div>

            {/* Contact */}
            <div className="space-y-5">
                <h3 className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
                    ข้อมูลติดต่อ
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="เบอร์โทรติดต่อ" required hint="ใช้สำหรับกลับมาแก้ไขข้อมูลภายหลัง">
                        <input
                            type="tel"
                            className="input-field"
                            placeholder="0xx-xxx-xxxx"
                            value={data.ownerPhone || ""}
                            onChange={(e) => update("ownerPhone", e.target.value)}
                        />
                    </FormField>
                    <FormField label="ประเภทธุรกิจ">
                        <select
                            className="input-field"
                            value={data.businessType || ""}
                            onChange={(e) => update("businessType", e.target.value)}
                        >
                            <option value="">เลือกประเภท</option>
                            {businessTypes.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </FormField>
                </div>
            </div>
        </div>
    );
}
