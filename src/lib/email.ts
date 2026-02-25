import "server-only";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const FROM_EMAIL = process.env.EMAIL_FROM || "onboarding@atizdesk.com";

interface SendCodeEmailParams {
    to: string;
    customerName: string;
    code: string;
    product: "dr_ease" | "easepos";
}

export async function sendOnboardingCodeEmail(params: SendCodeEmailParams): Promise<boolean> {
    if (!resend) {
        console.warn("Resend not configured — skipping email");
        return false;
    }

    const productName = params.product === "easepos" ? "Ease POS" : "Dr.Ease";
    const onboardingUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://onboarding.atizdesk.com";

    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: params.to,
            subject: `รหัส Onboarding สำหรับ ${params.customerName} — ${productName}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
                    <h2 style="color: #333; margin-bottom: 8px;">สวัสดีครับ/ค่ะ</h2>
                    <p style="color: #666; line-height: 1.6;">
                        ขอบคุณที่เลือกใช้บริการ <strong>${productName}</strong><br/>
                        รหัส Onboarding ของคุณคือ:
                    </p>
                    <div style="background: #f4f0ff; border: 2px solid #7053E1; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                        <span style="font-size: 32px; font-weight: 700; letter-spacing: 4px; color: #7053E1;">
                            ${params.code}
                        </span>
                    </div>
                    <p style="color: #666; line-height: 1.6;">
                        กรุณาเข้าไปที่<br/>
                        <a href="${onboardingUrl}" style="color: #7053E1; font-weight: 600;">${onboardingUrl}</a><br/>
                        แล้วกรอกรหัสนี้เพื่อเริ่มต้นการตั้งค่าระบบ
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                    <p style="color: #999; font-size: 13px;">
                        ทีม Atiz — Customer Success
                    </p>
                </div>
            `,
        });
        return true;
    } catch (e) {
        console.error("sendOnboardingCodeEmail error:", e);
        return false;
    }
}
