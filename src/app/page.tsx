import { Building2 } from "lucide-react";

export default function Home() {
    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #faf5ff 50%, #f0f9ff 100%)" }}
        >
            <div className="glass-card p-8 max-w-md w-full text-center">
                <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: "rgba(108, 92, 231, 0.08)" }}
                >
                    <Building2 className="w-8 h-8" style={{ color: "var(--primary)" }} />
                </div>
                <h1 className="text-2xl font-bold text-text-main mb-2">
                    Dr.Ease Onboarding
                </h1>
                <p className="text-text-muted text-sm">
                    ระบบลงทะเบียนข้อมูลคลินิกสำหรับลูกค้า Dr.Ease
                </p>
                <p className="text-text-light text-xs mt-4">
                    กรุณาใช้ลิงก์ที่ได้รับจากทีม CS เพื่อเข้าสู่ระบบ
                </p>
            </div>
        </div>
    );
}
