import type { Metadata } from "next";
import { Outfit, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-display",
    weight: ["400", "500", "600", "700", "800"],
});

const notoSansThai = Noto_Sans_Thai({
    subsets: ["thai"],
    variable: "--font-body",
    weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
    title: "Dr.Ease - Customer Onboarding",
    description: "ลงทะเบียนข้อมูลคลินิกสำหรับระบบ Dr.Ease",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="th">
            <body className={`${outfit.variable} ${notoSansThai.variable}`}>{children}</body>
        </html>
    );
}
