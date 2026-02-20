// ============================================
// Product
// ============================================
export type ProductType = "dr_ease" | "easepos";

// ============================================
// Onboarding Session
// ============================================
export type OnboardingStatus = "pending" | "in_progress" | "submitted" | "approved" | "rejected";

export interface OnboardingSession {
    id: number;
    token: string;
    pin: string;
    pin_attempts: number;
    pin_locked_at: string | null;
    customer_name: string;
    product: ProductType | null;
    status: OnboardingStatus;
    current_step: number;
    sheet_id: string | null;
    sheet_url: string | null;
    customer_id: number | null;
    created_by: string | null;
    approved_by: string | null;
    clinic_data: ClinicData;
    branch_data: BranchData[];
    expires_at: string;
    submitted_at: string | null;
    approved_at: string | null;
    created_at: string;
    updated_at: string;
}

// ============================================
// Clinic Data (Step 1)
// ============================================
export interface ClinicData {
    clinicNameTh?: string;
    clinicNameEn?: string;
    clinicSearchName?: string;
    ownerName?: string;
    ownerPhone?: string;
    ownerEmail?: string;
    ownerLineId?: string;
    taxId?: string;
    businessType?: string;
    address?: string;
    province?: string;
    district?: string;
    subDistrict?: string;
    zipCode?: string;
}

// ============================================
// Branch Data (Step 2)
// ============================================
export interface BranchData {
    name: string;
    address: string;
    phone: string;
    managerName: string;
    managerPhone: string;
    isMain: boolean;
}

// ============================================
// Google Sheet Data (Step 3-4)
// ============================================
export interface Procedure {
    index: number;
    code: string;
    name: string;
    nameEn: string;
    category: string;
    price: number;
    duration: number;
    note: string;
}

export interface Product {
    index: number;
    code: string;
    name: string;
    category: string;
    unit: string;
    costPrice: number;
    sellPrice: number;
    note: string;
}

// ============================================
// Activity Log
// ============================================
export type OnboardingAction = "created" | "pin_verified" | "step_completed" | "submitted" | "approved" | "rejected";

export interface OnboardingActivityLog {
    id: number;
    session_id: number;
    action: OnboardingAction;
    step: number | null;
    actor: string;
    metadata: Record<string, unknown>;
    created_at: string;
}

// ============================================
// API Response
// ============================================
export type ApiResponse<T> =
    | { success: true; data: T }
    | { success: false; error: string };

// ============================================
// Wizard
// ============================================
export interface WizardStep {
    id: number;
    label: string;
    description: string;
}

export const WIZARD_STEPS: WizardStep[] = [
    { id: 1, label: "ข้อมูลคลินิก", description: "ข้อมูลทั่วไปของคลินิก" },
    { id: 2, label: "สาขา", description: "ข้อมูลสาขาของคลินิก" },
    { id: 3, label: "หัตถการ", description: "รายการหัตถการ" },
    { id: 4, label: "สินค้า", description: "รายการสินค้า" },
    { id: 5, label: "ตรวจสอบ & ส่ง", description: "ตรวจสอบข้อมูลและส่ง" },
];

// Product-aware entity label
export function getEntityLabel(product: ProductType): string {
    return product === "easepos" ? "ร้าน" : "คลินิก";
}

export function getWizardSteps(product: ProductType): WizardStep[] {
    const e = getEntityLabel(product);
    return [
        { id: 1, label: `ข้อมูล${e}`, description: `ข้อมูลทั่วไปของ${e}` },
        { id: 2, label: "สาขา", description: `ข้อมูลสาขาของ${e}` },
        { id: 3, label: "หัตถการ", description: "รายการหัตถการ" },
        { id: 4, label: "สินค้า", description: "รายการสินค้า" },
        { id: 5, label: "ตรวจสอบ & ส่ง", description: "ตรวจสอบข้อมูลและส่ง" },
    ];
}
