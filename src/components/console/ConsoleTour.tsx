"use client";

import { useState, useEffect, useCallback } from "react";
import Joyride, { type CallBackProps, type Step, STATUS, ACTIONS } from "react-joyride";
import type { TooltipRenderProps } from "react-joyride";
import { X } from "lucide-react";
import { useSessionStore } from "@/stores/useSessionStore";
import { getEntityLabel } from "@/types";

interface ConsoleTourProps {
    onForceOpenSidebar?: () => void;
    onCloseSidebar?: () => void;
}

export default function ConsoleTour({ onForceOpenSidebar, onCloseSidebar }: ConsoleTourProps) {
    const { session, tutorialDone, setTutorialDone } = useSessionStore();
    const [run, setRun] = useState(false);

    const product = session?.product || "dr_ease";
    const entity = getEntityLabel(product);

    const steps: Step[] = [
        {
            target: '[data-tour="tour-brand-header"]',
            content: `ยินดีต้อนรับสู่หน้าจัดการ! มาดูกันว่าแต่ละเมนูทำอะไรได้บ้าง`,
            title: "สวัสดี!",
            placement: "right",
            disableBeacon: true,
        },
        {
            target: '[data-tour="tour-nav-info"]',
            content: `ดูและแก้ไขข้อมูลทั่วไปของ${entity}ได้ที่นี่ เช่น ชื่อ ที่อยู่ เบอร์โทร`,
            title: `ข้อมูล${entity}`,
            placement: "right",
            disableBeacon: true,
        },
        {
            target: '[data-tour="tour-nav-branches"]',
            content: `จัดการสาขาทั้งหมดของ${entity} เพิ่ม แก้ไข หรือลบสาขาได้`,
            title: "สาขา",
            placement: "right",
            disableBeacon: true,
        },
        {
            target: '[data-tour="tour-nav-easepay"]',
            content: "สมัครใช้งาน Ease Pay เพื่อรับชำระเงินออนไลน์ได้ทุกช่องทาง ฟรี!",
            title: "Ease Pay",
            placement: "right",
            disableBeacon: true,
        },
        {
            target: '[data-tour="tour-nav-settings"]',
            content: "ดูรหัส Onboarding สำหรับเข้าสู่ระบบครั้งถัดไป และจัดการบัญชี",
            title: "ตั้งค่า",
            placement: "right",
            disableBeacon: true,
        },
        {
            target: '[data-tour="tour-user-info"]',
            content: "ดูสถานะบัญชีของคุณได้ที่นี่ เมื่อทีม CS ตรวจสอบเสร็จจะอัปเดตสถานะให้",
            title: "สถานะบัญชี",
            placement: "right",
            disableBeacon: true,
        },
    ];

    // Auto-start tour after mount
    useEffect(() => {
        if (!session || tutorialDone) return;

        // Delay to let sidebar render + animate in
        const timer = setTimeout(() => {
            if (window.innerWidth < 1024) {
                onForceOpenSidebar?.();
            }
            setRun(true);
        }, 800);

        return () => clearTimeout(timer);
    }, [session, tutorialDone, onForceOpenSidebar]);

    const handleCallback = useCallback((data: CallBackProps) => {
        const { status, action } = data;
        const finished = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finished.includes(status as typeof STATUS.FINISHED) || action === ACTIONS.CLOSE) {
            setRun(false);
            setTutorialDone(true);
            if (window.innerWidth < 1024) {
                onCloseSidebar?.();
            }
        }
    }, [setTutorialDone, onCloseSidebar]);

    if (tutorialDone || !session) return null;

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            showSkipButton
            disableOverlayClose
            spotlightPadding={8}
            callback={handleCallback}
            tooltipComponent={TourTooltip}
            locale={{
                back: "ย้อนกลับ",
                close: "ปิด",
                last: "เสร็จสิ้น",
                next: "ถัดไป",
                skip: "ข้ามทั้งหมด",
            }}
            styles={{
                options: {
                    zIndex: 10000,
                    overlayColor: "rgba(0, 0, 0, 0.4)",
                },
            }}
        />
    );
}

// ==========================================
// Custom Tooltip — matches app design system
// ==========================================
function TourTooltip({
    backProps,
    closeProps,
    continuous,
    index,
    primaryProps,
    skipProps,
    step,
    tooltipProps,
    size,
}: TooltipRenderProps) {
    return (
        <div
            {...tooltipProps}
            style={{
                padding: "24px",
                maxWidth: "340px",
                borderRadius: "16px",
                background: "var(--modal-bg)",
                border: "1px solid var(--border)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                position: "relative",
            }}
        >
            {/* Close button */}
            <button
                {...closeProps}
                style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    lineHeight: 0,
                }}
            >
                <X style={{ width: 16, height: 16, color: "var(--text-light)" }} />
            </button>

            {/* Title */}
            {step.title && (
                <h3 style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "var(--text-main)",
                    marginBottom: "8px",
                    paddingRight: "24px",
                }}>
                    {String(step.title)}
                </h3>
            )}

            {/* Content */}
            <div style={{
                fontSize: "14px",
                lineHeight: 1.6,
                color: "var(--text-muted)",
                marginBottom: "20px",
            }}>
                {step.content}
            </div>

            {/* Progress dots */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
                {Array.from({ length: size }, (_, i) => (
                    <div
                        key={i}
                        style={{
                            width: i === index ? "20px" : "6px",
                            height: "6px",
                            borderRadius: "3px",
                            background: i === index
                                ? "var(--primary)"
                                : i < index
                                    ? "var(--success)"
                                    : "var(--border)",
                            transition: "all 0.3s",
                        }}
                    />
                ))}
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button
                    {...skipProps}
                    style={{
                        background: "none",
                        border: "none",
                        fontSize: "13px",
                        color: "var(--text-light)",
                        cursor: "pointer",
                        padding: "6px 0",
                    }}
                >
                    {skipProps.title}
                </button>

                <div style={{ display: "flex", gap: "8px" }}>
                    {index > 0 && (
                        <button
                            {...backProps}
                            style={{
                                background: "transparent",
                                border: "1px solid var(--border)",
                                borderRadius: "10px",
                                padding: "8px 16px",
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "var(--text-muted)",
                                cursor: "pointer",
                            }}
                        >
                            {backProps.title}
                        </button>
                    )}
                    {continuous && (
                        <button
                            {...primaryProps}
                            style={{
                                background: "var(--primary)",
                                border: "none",
                                borderRadius: "10px",
                                padding: "8px 20px",
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "#fff",
                                cursor: "pointer",
                            }}
                        >
                            {primaryProps.title}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
