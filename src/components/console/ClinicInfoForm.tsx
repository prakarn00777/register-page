"use client";

import { useCallback } from "react";
import FormField from "@/components/ui/FormField";
import { getEntityLabel } from "@/types";
import type { ClinicData, ProductType } from "@/types";

interface ClinicInfoFormProps {
    data: ClinicData;
    onChange: (data: ClinicData) => void;
    product: ProductType;
    readOnly?: boolean;
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

export default function ClinicInfoForm({ data, onChange, product, readOnly }: ClinicInfoFormProps) {
    const update = useCallback((field: keyof ClinicData, value: string) => {
        if (readOnly) return;
        onChange({ ...data, [field]: value });
    }, [data, onChange, readOnly]);

    const entity = getEntityLabel(product);
    const isShop = product === "easepos";
    const businessTypes = isShop ? BUSINESS_TYPES_SHOP : BUSINESS_TYPES_CLINIC;
    const placeholderTh = isShop ? "เช่น ร้านกาแฟ Brew" : "เช่น คลินิกทันตกรรม สมายล์";
    const placeholderEn = isShop ? "e.g. Brew Coffee Shop" : "e.g. Smile Dental Clinic";

    return (
        <div className="space-y-6">
            {/* Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label={`ชื่อ${entity} (ภาษาไทย)`} required>
                    <input
                        type="text"
                        className="input-field"
                        placeholder={placeholderTh}
                        value={data.clinicNameTh || ""}
                        onChange={(e) => update("clinicNameTh", e.target.value)}
                        disabled={readOnly}
                    />
                </FormField>
                <FormField label={`ชื่อ${entity} (English)`} required>
                    <input
                        type="text"
                        className="input-field"
                        placeholder={placeholderEn}
                        value={data.clinicNameEn || ""}
                        onChange={(e) => update("clinicNameEn", e.target.value)}
                        disabled={readOnly}
                    />
                </FormField>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="เบอร์โทรติดต่อ" required>
                    <input
                        type="tel"
                        className="input-field"
                        placeholder="0xx-xxx-xxxx"
                        value={data.ownerPhone || ""}
                        onChange={(e) => update("ownerPhone", e.target.value)}
                        disabled={readOnly}
                    />
                </FormField>
                <FormField label="ประเภทธุรกิจ">
                    <select
                        className="input-field"
                        value={data.businessType || ""}
                        onChange={(e) => update("businessType", e.target.value)}
                        disabled={readOnly}
                    >
                        <option value="">เลือกประเภท</option>
                        {businessTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </FormField>
            </div>
        </div>
    );
}
