import { redirect } from "next/navigation";
import { getSessionFromCookie } from "@/actions/onboarding";
import WizardWrapper from "./WizardWrapper";

export default async function WizardPage() {
    const result = await getSessionFromCookie();

    if (!result.success) {
        redirect("/");
    }

    const { session } = result.data;

    // If already submitted, show status
    if (session.status === "submitted" || session.status === "approved") {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="glass-card p-8 max-w-md w-full text-center animate-fade-up">
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-text-main mb-2">
                        {session.status === "approved" ? "ข้อมูลได้รับการอนุมัติแล้ว" : "ส่งข้อมูลเรียบร้อยแล้ว"}
                    </h1>
                    <p className="text-text-muted text-sm">
                        {session.status === "approved"
                            ? "ข้อมูลของคุณถูกนำเข้าระบบเรียบร้อยแล้ว ขอบคุณค่ะ"
                            : "ทีม CS กำลังตรวจสอบข้อมูลของคุณ หากมีข้อสงสัยจะติดต่อกลับผ่าน LINE ค่ะ"
                        }
                    </p>
                </div>
            </div>
        );
    }

    return <WizardWrapper session={session} />;
}
