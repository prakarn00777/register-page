"use client";

import Image from "next/image";
import { Building2, Network, ClipboardList, Package, CheckCircle2, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import type { ProductType } from "@/types";

interface IllustrationPanelProps {
    step?: number;
    product?: ProductType;
}

const GRADIENTS: Record<ProductType, string> = {
    dr_ease: "linear-gradient(135deg, #7053E1 0%, #8B6CF7 40%, #A855F7 100%)",
    easepos: "linear-gradient(135deg, #F76D85 0%, #FF8FA3 40%, #FFB3C1 100%)",
};

function getStepConfig(product: ProductType) {
    const entity = product === "easepos" ? "ร้าน" : "คลินิก";
    return {
        0: {
            icon: <Sparkles className="w-12 h-12" />,
            title: "ยินดีต้อนรับ",
            subtitle: "เริ่มต้นลงทะเบียน\nเลือกผลิตภัณฑ์ที่ต้องการ",
        },
        1: {
            icon: <Building2 className="w-12 h-12" />,
            title: `ข้อมูล${entity}`,
            subtitle: `กรอกข้อมูลพื้นฐาน\nชื่อและประเภทธุรกิจ`,
        },
        2: {
            icon: <Network className="w-12 h-12" />,
            title: "ข้อมูลสาขา",
            subtitle: `เพิ่มสาขาทั้งหมด\nของ${entity}`,
        },
        3: {
            icon: <ClipboardList className="w-12 h-12" />,
            title: "หัตถการ",
            subtitle: `กรอกรายการหัตถการ\nที่ให้บริการ`,
        },
        4: {
            icon: <Package className="w-12 h-12" />,
            title: "สินค้า",
            subtitle: `กรอกรายการสินค้า\nที่ใช้ใน${entity}`,
        },
        5: {
            icon: <CheckCircle2 className="w-12 h-12" />,
            title: "เกือบเสร็จแล้ว!",
            subtitle: "ตั้ง PIN แล้วตรวจสอบข้อมูล\nก่อนยืนยันส่ง",
        },
    } as Record<number, { icon: ReactNode; title: string; subtitle: string }>;
}

export default function IllustrationPanel({ step = 0, product = "dr_ease" }: IllustrationPanelProps) {
    const stepConfig = getStepConfig(product);
    const config = stepConfig[step] || stepConfig[0];
    const gradient = GRADIENTS[product];

    return (
        <div
            className="relative w-full h-full overflow-hidden"
            style={{ background: gradient }}
        >
            {/* Large floating circles */}
            <div className="absolute w-[280px] h-[280px] rounded-full bg-white/[0.07] -top-10 -right-10 animate-float-1" />
            <div className="absolute w-[180px] h-[180px] rounded-full bg-white/[0.05] bottom-[15%] -left-12 animate-float-2" />
            <div className="absolute w-[100px] h-[100px] rounded-full bg-white/[0.04] top-[45%] left-[35%] animate-float-3" />

            {/* Ring shape */}
            <div className="absolute w-[120px] h-[120px] rounded-full border-[12px] border-white/[0.06] top-[20%] left-[10%] animate-spin-slow" />

            {/* Rotated square */}
            <div
                className="absolute w-[70px] h-[70px] rounded-2xl bg-white/[0.05] bottom-[25%] right-[12%] rotate-45 animate-float-2"
                style={{ animationDelay: "2s" }}
            />

            {/* Colored accent shapes */}
            <div
                className="absolute w-[45px] h-[45px] rounded-xl bg-[#FF6B6B]/20 top-[55%] right-[8%] rotate-12 animate-float-1"
                style={{ animationDelay: "1.5s" }}
            />
            <div
                className="absolute w-[35px] h-[35px] rounded-full bg-[#FECA57]/15 bottom-[12%] left-[45%] animate-float-3"
                style={{ animationDelay: "3s" }}
            />
            <div
                className="absolute w-[25px] h-[25px] rounded-lg bg-[#00D2D3]/15 top-[30%] right-[30%] animate-float-2"
                style={{ animationDelay: "4s" }}
            />

            {/* Small dots */}
            <div className="absolute w-2 h-2 rounded-full bg-white/20 top-[28%] left-[55%]" />
            <div className="absolute w-1.5 h-1.5 rounded-full bg-white/15 top-[38%] left-[65%]" />
            <div className="absolute w-2 h-2 rounded-full bg-white/20 bottom-[35%] left-[20%]" />
            <div className="absolute w-1.5 h-1.5 rounded-full bg-white/15 top-[60%] right-[25%]" />
            <div className="absolute w-2.5 h-2.5 rounded-full bg-white/10 top-[75%] left-[60%]" />

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-12">
                <div className="text-white/80 mb-6 animate-fade-up" style={{ animationDelay: "0.2s" }}>
                    {config.icon}
                </div>
                <h2
                    className="text-white text-2xl font-bold mb-3 text-center animate-fade-up"
                    style={{ animationDelay: "0.3s" }}
                >
                    {config.title}
                </h2>
                <p
                    className="text-white/50 text-sm leading-relaxed text-center whitespace-pre-line animate-fade-up"
                    style={{ animationDelay: "0.4s" }}
                >
                    {config.subtitle}
                </p>
            </div>

            {/* Brand logo at bottom */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <Image
                    src={product === "easepos" ? "/logo-easepos.png" : "/logo-drease.png"}
                    alt={product === "easepos" ? "Ease POS" : "Dr.Ease"}
                    width={36}
                    height={36}
                    className="rounded-full opacity-30"
                />
            </div>

            {/* Large step number watermark */}
            {step > 0 && (
                <div className="absolute top-6 right-8 text-white/[0.04] text-[200px] font-extrabold leading-none select-none pointer-events-none">
                    {step}
                </div>
            )}
        </div>
    );
}
