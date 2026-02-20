"use client";

import { useState } from "react";
import { Phone, KeyRound, ArrowLeft, AlertCircle } from "lucide-react";
import ProductSelect from "@/components/wizard/ProductSelect";
import WizardShell from "@/components/wizard/WizardShell";
import IllustrationPanel from "@/components/wizard/IllustrationPanel";
import type { OnboardingSession, ProductType } from "@/types";

// Mock session for new registration
const mockSessionNew: OnboardingSession = {
    id: 1,
    token: "demo-token-123",
    pin: "",
    pin_attempts: 0,
    pin_locked_at: null,
    customer_name: "",
    product: null,
    status: "in_progress",
    current_step: 1,
    sheet_id: "1-LKfHRYeMt0QZQyFnPWRhms8BMdPlgUivljKCP2a2ek",
    sheet_url: "https://docs.google.com/spreadsheets/d/1-LKfHRYeMt0QZQyFnPWRhms8BMdPlgUivljKCP2a2ek/edit",
    customer_id: null,
    created_by: null,
    approved_by: null,
    clinic_data: {},
    branch_data: [],
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    submitted_at: null,
    approved_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
};

// Mock session for returning customer (has PIN + data)
const mockSessionEdit: OnboardingSession = {
    id: 2,
    token: "demo-token-edit",
    pin: "1234",
    pin_attempts: 0,
    pin_locked_at: null,
    customer_name: "คลินิกทดสอบ",
    product: "dr_ease",
    status: "in_progress",
    current_step: 5,
    sheet_id: "1-LKfHRYeMt0QZQyFnPWRhms8BMdPlgUivljKCP2a2ek",
    sheet_url: "https://docs.google.com/spreadsheets/d/1-LKfHRYeMt0QZQyFnPWRhms8BMdPlgUivljKCP2a2ek/edit",
    customer_id: null,
    created_by: null,
    approved_by: null,
    clinic_data: {
        clinicNameTh: "คลินิกทดสอบ",
        clinicNameEn: "Test Clinic",
        ownerPhone: "0891234567",
        businessType: "คลินิกทันตกรรม",
    },
    branch_data: [
        { name: "สำนักงานใหญ่", address: "กรุงเทพ", phone: "021234567", managerName: "", managerPhone: "", isMain: true },
    ],
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    submitted_at: new Date().toISOString(),
    approved_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
};

type DemoMode = "landing" | "new" | "pin_auth" | "edit";

export default function DemoPage() {
    const [mode, setMode] = useState<DemoMode>("landing");
    const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);

    // Landing: product select + edit link
    if (mode === "landing") {
        return (
            <ProductSelect
                onSelect={(product) => {
                    setSelectedProduct(product);
                    setMode("new");
                }}
                onEditClick={() => setMode("pin_auth")}
            />
        );
    }

    // Phone + PIN auth for edit
    if (mode === "pin_auth") {
        return (
            <DemoPinAuth
                onSuccess={() => {
                    setSelectedProduct("dr_ease");
                    setMode("edit");
                }}
                onBack={() => setMode("landing")}
            />
        );
    }

    // New registration wizard
    if (mode === "new" && selectedProduct) {
        return (
            <WizardShell
                session={mockSessionNew}
                product={selectedProduct}
                demoMode
                onBackToProducts={() => {
                    setSelectedProduct(null);
                    setMode("landing");
                }}
            />
        );
    }

    // Edit mode: starts at step 5 with pre-filled data
    if (mode === "edit") {
        return (
            <WizardShell
                session={mockSessionEdit}
                product="dr_ease"
                demoMode
                onBackToProducts={() => {
                    setSelectedProduct(null);
                    setMode("landing");
                }}
            />
        );
    }

    return null;
}

// Mock phone + PIN form for demo
function DemoPinAuth({ onSuccess, onBack }: { onSuccess: () => void; onBack: () => void }) {
    const [phone, setPhone] = useState("");
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = () => {
        if (!phone.trim()) {
            setError("กรุณากรอกเบอร์โทรศัพท์");
            return;
        }
        if (!pin.trim()) {
            setError("กรุณากรอก PIN");
            return;
        }
        // Mock validation: phone=0891234567, pin=1234
        if (phone.trim() === "0891234567" && pin.trim() === "1234") {
            onSuccess();
        } else {
            setError("ไม่พบข้อมูล กรุณาตรวจสอบเบอร์โทรและ PIN (Demo: 0891234567 / 1234)");
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Left Panel */}
            <div className="min-h-screen flex items-center justify-center p-6 lg:p-12 lg:mr-[45%]">
                <div className="w-full max-w-sm animate-fade-up">
                    {/* Back link */}
                    <button
                        onClick={onBack}
                        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main transition-colors mb-10"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        กลับหน้าหลัก
                    </button>

                    {/* Heading */}
                    <h1 className="text-3xl font-bold text-text-main mb-3 leading-tight">
                        แก้ไขข้อมูล
                    </h1>
                    <p className="text-text-muted mb-10 leading-relaxed">
                        กรอกเบอร์โทรศัพท์และ PIN ที่คุณตั้งไว้
                        เพื่อเข้าแก้ไขข้อมูลของคุณ
                    </p>

                    {/* Demo hint */}
                    <div className="bg-blue-50 text-blue-600 text-xs px-4 py-3 rounded-xl mb-6">
                        Demo: ใช้เบอร์ <strong>0891234567</strong> PIN <strong>1234</strong>
                    </div>

                    {/* Form */}
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-text-main">
                                <Phone className="w-4 h-4" style={{ color: "var(--primary)" }} />
                                เบอร์โทรศัพท์
                            </label>
                            <input
                                type="tel"
                                inputMode="tel"
                                className="input-field"
                                placeholder="0xx-xxx-xxxx"
                                value={phone}
                                onChange={(e) => { setPhone(e.target.value); setError(""); }}
                                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-text-main">
                                <KeyRound className="w-4 h-4" style={{ color: "var(--primary)" }} />
                                รหัส PIN
                            </label>
                            <input
                                type="password"
                                inputMode="numeric"
                                maxLength={6}
                                className="input-field"
                                placeholder="กรอก PIN 4-6 หลัก"
                                value={pin}
                                onChange={(e) => {
                                    setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
                                    setError("");
                                }}
                                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            className="btn btn-primary w-full text-base py-3"
                        >
                            เข้าแก้ไขข้อมูล
                        </button>
                    </div>

                    <p className="text-xs text-text-light mt-12">
                        หากจำ PIN ไม่ได้ กรุณาติดต่อทีม CS ของเรา
                    </p>
                </div>
            </div>

            {/* Right Illustration Panel */}
            <div className="hidden lg:block fixed top-0 right-0 bottom-0 w-[45%]">
                <IllustrationPanel step={0} product="dr_ease" />
            </div>
        </div>
    );
}
