"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Building2, GitBranch, Download, Settings, CreditCard, LogOut, Menu, X, ChevronRight, ChevronDown, KeyRound } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { useSessionStore } from "@/stores/useSessionStore";
import { logoutSession } from "@/actions/onboarding";
import type { OnboardingSession, ProductType } from "@/types";
import { getEntityLabel } from "@/types";

interface ConsoleSidebarProps {
    session: OnboardingSession;
    isOpen: boolean;
    onToggle: () => void;
}

const BRAND: Record<ProductType, { name: string; logo: string }> = {
    dr_ease: { name: "Dr.Ease", logo: "/logo-drease.png" },
    easepos: { name: "Ease POS", logo: "/logo-easepos.png" },
};

const NAV_ITEMS = [
    { path: "/console/import", label: "นำเข้าข้อมูล", icon: Download, tourId: "tour-nav-import" },
    { path: "/console/easepay", label: "Ease Pay", icon: CreditCard, tourId: "tour-nav-easepay" },
];

const SETTINGS_SUB_ITEMS = [
    { path: "/console/info", label: "ข้อมูลร้าน", icon: Building2, tourId: "tour-nav-info" },
    { path: "/console/branches", label: "สาขา", icon: GitBranch, tourId: "tour-nav-branches" },
    { path: "/console/settings", label: "บัญชี", icon: KeyRound, tourId: "tour-nav-settings" },
];

const SETTINGS_PATHS = SETTINGS_SUB_ITEMS.map((i) => i.path);

export default function ConsoleSidebar({ session, isOpen, onToggle }: ConsoleSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { clearSession } = useSessionStore();
    const product = session.product || "dr_ease";
    const brand = BRAND[product] || BRAND.dr_ease;
    const entity = getEntityLabel(product);

    // Auto-expand settings if current page is a settings sub-item
    const isSettingsActive = SETTINGS_PATHS.includes(pathname);
    const [settingsOpen, setSettingsOpen] = useState(isSettingsActive);

    const navigate = (path: string) => {
        router.push(path);
        // Close sidebar on mobile after nav
        if (window.innerWidth < 1024) onToggle();
    };

    return (
        <>
            {/* Mobile hamburger */}
            <button
                onClick={onToggle}
                className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm border border-border-light flex items-center justify-center shadow-sm hover:shadow-md transition-all"
            >
                {isOpen ? <X className="w-5 h-5 text-text-main" /> : <Menu className="w-5 h-5 text-text-main" />}
            </button>

            {/* Overlay (mobile) */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 bottom-0 z-40
                    w-72 bg-white/90 backdrop-blur-xl
                    border-r border-border-light
                    flex flex-col
                    transition-transform duration-300 ease-out
                    lg:translate-x-0
                    ${isOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                {/* Brand header */}
                <div className="shrink-0 px-6 pt-7 pb-5" data-tour="tour-brand-header">
                    <div className="flex items-center gap-3">
                        <Image
                            src={brand.logo}
                            alt={brand.name}
                            width={36}
                            height={36}
                            className="rounded-full ring-2 ring-border-light"
                        />
                        <div>
                            <h2 className="text-sm font-bold text-text-main">{brand.name}</h2>
                            <p className="text-xs text-text-muted">Customer Console</p>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="mx-5 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                {/* Navigation */}
                <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <NavButton
                                key={item.path}
                                tourId={item.tourId}
                                icon={Icon}
                                label={item.label}
                                isActive={isActive}
                                onClick={() => navigate(item.path)}
                            />
                        );
                    })}

                    {/* Expandable: ตั้งค่า */}
                    <div data-tour="tour-settings-group">
                        <button
                            onClick={() => setSettingsOpen(!settingsOpen)}
                            className={`
                                w-full flex items-center gap-3 px-4 py-3 rounded-xl
                                text-sm font-medium transition-all duration-200
                                ${isSettingsActive
                                    ? "text-text-main bg-black/[0.03]"
                                    : "text-text-muted hover:text-text-main hover:bg-black/[0.03]"
                                }
                            `}
                        >
                            <Settings className={`w-[18px] h-[18px] ${isSettingsActive ? "opacity-100" : "opacity-60"} transition-opacity`} />
                            <span>ตั้งค่า</span>
                            <ChevronDown
                                className={`w-4 h-4 ml-auto opacity-40 transition-transform duration-200 ${settingsOpen ? "rotate-180" : ""}`}
                            />
                        </button>

                        {/* Sub items */}
                        <div
                            className="overflow-hidden transition-all duration-200"
                            style={{
                                maxHeight: settingsOpen ? `${SETTINGS_SUB_ITEMS.length * 44}px` : "0px",
                                opacity: settingsOpen ? 1 : 0,
                            }}
                        >
                            <div className="pl-4 mt-1 space-y-0.5">
                                {SETTINGS_SUB_ITEMS.map((item) => {
                                    const isActive = pathname === item.path;
                                    const Icon = item.icon;
                                    const label = item.label === "ข้อมูลร้าน" ? `ข้อมูล${entity}` : item.label;

                                    return (
                                        <button
                                            key={item.path}
                                            data-tour={item.tourId}
                                            onClick={() => navigate(item.path)}
                                            className={`
                                                w-full flex items-center gap-3 px-4 py-2.5 rounded-lg
                                                text-[13px] font-medium transition-all duration-200
                                                ${isActive
                                                    ? "text-text-main"
                                                    : "text-text-light hover:text-text-main hover:bg-black/[0.02]"
                                                }
                                            `}
                                            style={isActive ? { color: "var(--primary)" } : undefined}
                                        >
                                            <Icon className={`w-4 h-4 ${isActive ? "" : "opacity-50"} transition-opacity`} />
                                            <span>{label}</span>
                                            {isActive && (
                                                <div className="w-1.5 h-1.5 rounded-full ml-auto" style={{ background: "var(--primary)" }} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Divider */}
                <div className="mx-5 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                {/* User info */}
                <div className="shrink-0 px-5 py-5">
                    <div className="glass-card p-4 space-y-3" data-tour="tour-user-info">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                    style={{ background: `linear-gradient(135deg, var(--primary), var(--primary-hover))` }}
                                >
                                    {(session.customer_name || "?")[0]}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-text-main truncate max-w-[140px]">
                                        {session.customer_name || "ยังไม่ได้ตั้งชื่อ"}
                                    </p>
                                    <p className="text-xs text-text-muted truncate max-w-[140px]">
                                        {session.clinic_data?.ownerPhone || "-"}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <StatusBadge status={session.status} />
                    </div>
                </div>

                {/* Logout */}
                <div className="shrink-0 px-4 pb-5">
                    <button
                        onClick={async () => {
                            await logoutSession();
                            clearSession();
                            router.replace("/onboard");
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-text-light hover:text-red-400 hover:bg-red-50/50 transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        ออกจากระบบ
                    </button>
                </div>
            </aside>
        </>
    );
}

// Shared nav button for top-level items
function NavButton({
    tourId, icon: Icon, label, isActive, onClick,
}: {
    tourId: string; icon: React.ElementType; label: string; isActive: boolean; onClick: () => void;
}) {
    return (
        <button
            data-tour={tourId}
            onClick={onClick}
            className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl
                text-sm font-medium transition-all duration-200
                group relative overflow-hidden
                ${isActive
                    ? "text-white shadow-lg"
                    : "text-text-muted hover:text-text-main hover:bg-black/[0.03]"
                }
            `}
            style={isActive ? {
                background: `linear-gradient(135deg, var(--primary), var(--primary-hover))`,
                boxShadow: `0 4px 15px color-mix(in srgb, var(--primary) 35%, transparent)`,
            } : undefined}
        >
            {isActive && (
                <div
                    className="absolute inset-0 opacity-20"
                    style={{ background: "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.4), transparent 70%)" }}
                />
            )}
            <Icon className={`w-[18px] h-[18px] relative z-10 ${isActive ? "" : "opacity-60 group-hover:opacity-100"} transition-opacity`} />
            <span className="relative z-10">{label}</span>
            {isActive && (
                <ChevronRight className="w-4 h-4 ml-auto relative z-10 opacity-60" />
            )}
        </button>
    );
}
