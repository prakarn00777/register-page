"use client";

import { useRef, useState, useCallback } from "react";

interface PinInputProps {
    length?: number;
    onComplete: (pin: string) => void;
    disabled?: boolean;
    error?: string;
}

export default function PinInput({ length = 6, onComplete, disabled, error }: PinInputProps) {
    const [values, setValues] = useState<string[]>(Array(length).fill(""));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = useCallback((index: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // only digits

        const newValues = [...values];
        newValues[index] = value.slice(-1); // take last char
        setValues(newValues);

        // Auto-advance to next input
        if (value && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Check if all filled
        const pin = newValues.join("");
        if (pin.length === length && newValues.every(v => v !== "")) {
            onComplete(pin);
        }
    }, [values, length, onComplete]);

    const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !values[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    }, [values]);

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        e.preventDefault();
        const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
        if (!paste) return;

        const newValues = [...values];
        for (let i = 0; i < paste.length; i++) {
            newValues[i] = paste[i];
        }
        setValues(newValues);

        // Focus last filled or next empty
        const focusIndex = Math.min(paste.length, length - 1);
        inputRefs.current[focusIndex]?.focus();

        if (paste.length === length) {
            onComplete(paste);
        }
    }, [values, length, onComplete]);

    return (
        <div>
            <div className="flex gap-3 justify-center">
                {values.map((value, index) => (
                    <input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={value}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        disabled={disabled}
                        className={`pin-input ${error ? "!border-red-400" : ""} ${disabled ? "opacity-50" : ""}`}
                        autoFocus={index === 0}
                    />
                ))}
            </div>
            {error && (
                <p className="text-red-500 text-sm text-center mt-3 animate-fade-up">{error}</p>
            )}
        </div>
    );
}
