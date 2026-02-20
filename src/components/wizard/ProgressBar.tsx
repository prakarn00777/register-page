"use client";

import { WIZARD_STEPS, getWizardSteps } from "@/types";
import type { ProductType } from "@/types";

interface ProgressBarProps {
    currentStep: number;
    product?: ProductType;
}

export default function ProgressBar({ currentStep, product = "dr_ease" }: ProgressBarProps) {
    const steps = getWizardSteps(product);

    return (
        <div className="w-full">
            {/* Desktop: minimal dots */}
            <div className="hidden sm:flex items-center gap-2">
                {WIZARD_STEPS.map((step) => {
                    const isCompleted = step.id < currentStep;
                    const isActive = step.id === currentStep;

                    return (
                        <div
                            key={step.id}
                            className={`rounded-full transition-all duration-300 ${
                                isActive
                                    ? "w-8 h-2.5"
                                    : isCompleted
                                    ? "w-2.5 h-2.5"
                                    : "w-2.5 h-2.5 bg-slate-200"
                            }`}
                            style={isActive || isCompleted ? { background: "var(--primary)" } : undefined}
                        />
                    );
                })}
                <span className="ml-3 text-xs text-text-muted font-medium">
                    {currentStep} / {WIZARD_STEPS.length}
                </span>
            </div>

            {/* Mobile: compact bar */}
            <div className="sm:hidden">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
                        ขั้นตอนที่ {currentStep}/{WIZARD_STEPS.length}
                    </span>
                    <span className="text-sm text-text-muted">
                        {steps[currentStep - 1]?.label}
                    </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${(currentStep / WIZARD_STEPS.length) * 100}%`,
                            background: "var(--primary)",
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
