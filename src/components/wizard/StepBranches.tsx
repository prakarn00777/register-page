"use client";

import { useCallback } from "react";
import { Plus, Trash2, Building2, Crown } from "lucide-react";
import FormField from "@/components/ui/FormField";
import { getEntityLabel } from "@/types";
import type { BranchData, ProductType } from "@/types";

interface StepBranchesProps {
    data: BranchData[];
    onChange: (data: BranchData[]) => void;
    product: ProductType;
}

const emptyBranch: BranchData = {
    name: "",
    address: "",
    phone: "",
    managerName: "",
    managerPhone: "",
    isMain: false,
};

export default function StepBranches({ data, onChange, product }: StepBranchesProps) {
    const branches = data.length === 0
        ? [{ ...emptyBranch, name: "สำนักงานใหญ่", isMain: true }]
        : data;

    const entity = getEntityLabel(product);

    const updateBranch = useCallback((index: number, field: keyof BranchData, value: string | boolean) => {
        const updated = [...branches];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    }, [branches, onChange]);

    const addBranch = useCallback(() => {
        onChange([...branches, { ...emptyBranch }]);
    }, [branches, onChange]);

    const removeBranch = useCallback((index: number) => {
        if (branches[index].isMain) return;
        onChange(branches.filter((_, i) => i !== index));
    }, [branches, onChange]);

    return (
        <div className="space-y-8 animate-fade-up">
            {/* Step Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold mb-2" style={{ color: "var(--primary)" }}>
                        ขั้นตอนที่ 2
                    </p>
                    <h2 className="text-2xl lg:text-3xl font-bold text-text-main leading-tight">
                        {entity}ของคุณมีกี่สาขา?
                    </h2>
                    <p className="text-text-muted mt-3">เพิ่มข้อมูลสาขาทั้งหมดของ{entity} (อย่างน้อย 1 สาขา)</p>
                </div>
                <button
                    onClick={addBranch}
                    className="btn btn-outline shrink-0 mt-6"
                >
                    <Plus className="w-4 h-4" />
                    เพิ่มสาขา
                </button>
            </div>

            {/* Branch Cards */}
            <div className="space-y-4">
                {branches.map((branch, index) => (
                    <div key={index} className="glass-card p-6 space-y-5">
                        {/* Branch header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ background: "var(--primary-soft, rgba(108,92,231,0.06))" }}
                                >
                                    <Building2 className="w-4 h-4" style={{ color: "var(--primary)" }} />
                                </div>
                                <span className="text-sm font-semibold text-text-main">
                                    สาขาที่ {index + 1}
                                </span>
                                {branch.isMain && (
                                    <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full font-medium">
                                        <Crown className="w-3 h-3" /> สาขาหลัก
                                    </span>
                                )}
                            </div>
                            {!branch.isMain && (
                                <button
                                    onClick={() => removeBranch(index)}
                                    className="text-slate-300 hover:text-red-400 transition-colors p-1"
                                    title="ลบสาขา"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="ชื่อสาขา" required>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="เช่น สาขาสยาม"
                                    value={branch.name}
                                    onChange={(e) => updateBranch(index, "name", e.target.value)}
                                />
                            </FormField>
                            <FormField label="เบอร์โทรสาขา">
                                <input
                                    type="tel"
                                    className="input-field"
                                    placeholder="0xx-xxx-xxxx"
                                    value={branch.phone}
                                    onChange={(e) => updateBranch(index, "phone", e.target.value)}
                                />
                            </FormField>
                        </div>

                        <FormField label="ที่อยู่สาขา">
                            <textarea
                                className="input-field !h-16 py-2 resize-none"
                                placeholder="ที่อยู่สาขา"
                                value={branch.address}
                                onChange={(e) => updateBranch(index, "address", e.target.value)}
                            />
                        </FormField>

                    </div>
                ))}
            </div>

        </div>
    );
}
