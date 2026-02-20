"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning";

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose: () => void;
}

export default function Toast({ message, type = "success", duration = 4000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        error: <XCircle className="w-5 h-5 text-red-500" />,
        warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
    };

    const bgColors = {
        success: "bg-emerald-50 border-emerald-200",
        error: "bg-red-50 border-red-200",
        warning: "bg-amber-50 border-amber-200",
    };

    return (
        <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${bgColors[type]}`}>
                {icons[type]}
                <span className="text-sm text-slate-700">{message}</span>
                <button onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }} className="ml-2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
