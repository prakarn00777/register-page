"use client";

import { useCallback } from "react";
import { Plus, Trash2, Building2, Crown } from "lucide-react";
import FormField from "@/components/ui/FormField";
import type { BranchData } from "@/types";

interface BranchesFormProps {
    data: BranchData[];
    onChange: (data: BranchData[]) => void;
    readOnly?: boolean;
    compact?: boolean;
}

const emptyBranch: BranchData = {
    name: "",
    address: "",
    phone: "",
    managerName: "",
    managerPhone: "",
    isMain: false,
};

export default function BranchesForm({ data, onChange, readOnly, compact }: BranchesFormProps) {
    const branches = data.length === 0
        ? [{ ...emptyBranch, name: "สำนักงานใหญ่", isMain: true }]
        : data;

    const updateBranch = useCallback((index: number, field: keyof BranchData, value: string | boolean) => {
        if (readOnly) return;
        const updated = [...branches];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    }, [branches, onChange, readOnly]);

    const addBranch = useCallback(() => {
        if (readOnly) return;
        onChange([...branches, { ...emptyBranch }]);
    }, [branches, onChange, readOnly]);

    const removeBranch = useCallback((index: number) => {
        if (readOnly) return;
        if (branches[index].isMain) return;
        onChange(branches.filter((_, i) => i !== index));
    }, [branches, onChange, readOnly]);

    return (
        <div className="space-y-4">
            {/* Add button */}
            {!readOnly && (
                <div className="flex justify-end">
                    <button onClick={addBranch} className="btn btn-outline text-sm !py-2 !px-4">
                        <Plus className="w-4 h-4" />
                        เพิ่มสาขา
                    </button>
                </div>
            )}

            {/* Branch Cards */}
            {branches.map((branch, index) => (
                <div key={index} className={`glass-card ${compact ? "p-4" : "p-6"} space-y-4`}>
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
                        {!readOnly && !branch.isMain && (
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
                                disabled={readOnly}
                            />
                        </FormField>
                        <FormField label="เบอร์โทรสาขา">
                            <input
                                type="tel"
                                className="input-field"
                                placeholder="0xx-xxx-xxxx"
                                value={branch.phone}
                                onChange={(e) => updateBranch(index, "phone", e.target.value)}
                                disabled={readOnly}
                            />
                        </FormField>
                    </div>

                    <FormField label="ที่อยู่สาขา">
                        <textarea
                            className="input-field !h-16 py-2 resize-none"
                            placeholder="ที่อยู่สาขา"
                            value={branch.address}
                            onChange={(e) => updateBranch(index, "address", e.target.value)}
                            disabled={readOnly}
                        />
                    </FormField>
                </div>
            ))}
        </div>
    );
}
