"use client";

import Image from "next/image";
import type { ProductType } from "@/types";

interface ProductSelectProps {
    onSelect: (product: ProductType) => void;
    onEditClick?: () => void;
    error?: string;
}

const products = [
    {
        id: "dr_ease" as ProductType,
        name: "Dr.Ease",
        subtitle: "ระบบจัดการคลินิก",
        description: "สำหรับคลินิกทันตกรรม คลินิกเวชกรรม และคลินิกความงาม",
        logo: "/logo-drease.png",
        color: "#7053E1",
        gradient: "linear-gradient(135deg, #7053E1 0%, #8B6CF7 100%)",
    },
    {
        id: "easepos" as ProductType,
        name: "EasePos",
        subtitle: "ระบบขายหน้าร้าน",
        description: "สำหรับร้านค้า ร้านกาแฟ ร้านอาหาร และธุรกิจค้าปลีก",
        logo: "/logo-easepos.png",
        color: "#F76D85",
        gradient: "linear-gradient(135deg, #F76D85 0%, #FF8FA3 100%)",
    },
];

export default function ProductSelect({ onSelect, onEditClick, error }: ProductSelectProps) {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
            <div className="w-full max-w-xl animate-fade-up">
                {/* Heading */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl lg:text-4xl font-bold text-text-main mb-3 leading-tight">
                        เลือกผลิตภัณฑ์ของคุณ
                    </h1>
                    <p className="text-text-muted leading-relaxed">
                        เลือกระบบที่คุณต้องการลงทะเบียน
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-center justify-center gap-2 text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl mb-8">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                {/* Product Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {products.map((product) => (
                        <button
                            key={product.id}
                            onClick={() => onSelect(product.id)}
                            className="group relative glass-card p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] cursor-pointer"
                            style={{
                                borderColor: "transparent",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = product.color;
                                e.currentTarget.style.boxShadow = `0 8px 30px ${product.color}20`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "transparent";
                                e.currentTarget.style.boxShadow = "";
                            }}
                        >
                            {/* Logo */}
                            <Image
                                src={product.logo}
                                alt={product.name}
                                width={56}
                                height={56}
                                className="rounded-full mb-5"
                            />

                            {/* Text */}
                            <h3 className="text-xl font-bold text-text-main mb-1">
                                {product.name}
                            </h3>
                            <p className="text-sm font-medium mb-3" style={{ color: product.color }}>
                                {product.subtitle}
                            </p>
                            <p className="text-sm text-text-muted leading-relaxed">
                                {product.description}
                            </p>

                            {/* Hover arrow */}
                            <div
                                className="absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0"
                                style={{ background: `${product.color}10` }}
                            >
                                <svg className="w-4 h-4" style={{ color: product.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>

                            {/* Bottom gradient line */}
                            <div
                                className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{ background: product.gradient }}
                            />
                        </button>
                    ))}
                </div>

                {/* Edit link */}
                {onEditClick && (
                    <div className="mt-10 text-center">
                        <p className="text-sm text-text-muted mb-1">เคยลงทะเบียนแล้ว?</p>
                        <button
                            onClick={onEditClick}
                            className="text-sm font-medium hover:underline transition-colors"
                            style={{ color: "var(--primary)" }}
                        >
                            กลับมาแก้ไขข้อมูล →
                        </button>
                    </div>
                )}

                {/* Footer */}
                <p className="text-xs text-text-light mt-6 text-center">
                    ไม่แน่ใจ? ติดต่อทีม CS ของเราได้เลย
                </p>
            </div>
        </div>
    );
}
