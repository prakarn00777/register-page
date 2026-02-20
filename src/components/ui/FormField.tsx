"use client";

interface FormFieldProps {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}

export default function FormField({ label, required, error, children }: FormFieldProps) {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-text-main">
                {label}
                {required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {children}
            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}
