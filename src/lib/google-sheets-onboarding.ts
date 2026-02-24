import "server-only";
import { google } from "googleapis";
import type { Procedure, Product } from "@/types";

// ============================================
// Google Sheets API — Service Account Auth
// ============================================

function getAuth() {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!email || !key) {
        console.warn("Google Sheets API: missing credentials");
        return null;
    }

    return new google.auth.JWT(email, undefined, key, [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
    ]);
}

function getSheets() {
    const auth = getAuth();
    if (!auth) return null;
    return google.sheets({ version: "v4", auth });
}

function getDrive() {
    const auth = getAuth();
    if (!auth) return null;
    return google.drive({ version: "v3", auth });
}

// ============================================
// Create customer sheet from template
// ============================================
export async function createCustomerSheet(customerName: string): Promise<{ spreadsheetId: string; url: string } | null> {
    try {
        const drive = getDrive();
        if (!drive) return null;

        const templateId = process.env.GOOGLE_ONBOARDING_TEMPLATE_SHEET_ID;
        if (!templateId) {
            console.warn("Google Sheets: no template sheet ID");
            return null;
        }

        // Copy template
        const copy = await drive.files.copy({
            fileId: templateId,
            requestBody: {
                name: `[Onboarding] ${customerName}`,
            },
        });

        const spreadsheetId = copy.data.id;
        if (!spreadsheetId) return null;

        // Make it accessible to anyone with link (editor)
        await drive.permissions.create({
            fileId: spreadsheetId,
            requestBody: {
                role: "writer",
                type: "anyone",
            },
        });

        const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
        return { spreadsheetId, url };
    } catch (e) {
        console.error("createCustomerSheet error:", e);
        return null;
    }
}

// ============================================
// Read procedures from sheet (tab: หัตถการ, gid=0)
// ============================================
export async function readProceduresFromSheet(spreadsheetId: string): Promise<Procedure[]> {
    try {
        const sheets = getSheets();
        if (!sheets) return [];

        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "หัตถการ!A2:G",
        });

        const rows = res.data.values || [];
        return rows.map((row, i) => ({
            index: i + 1,
            code: row[0] || "",
            name: row[1] || "",
            nameEn: row[2] || "",
            category: row[3] || "",
            price: parseFloat(row[4]) || 0,
            duration: parseInt(row[5]) || 0,
            note: row[6] || "",
        }));
    } catch (e) {
        console.error("readProceduresFromSheet error:", e);
        return [];
    }
}

// ============================================
// Read products from sheet (tab: สินค้า, gid=1)
// ============================================
export async function readProductsFromSheet(spreadsheetId: string): Promise<Product[]> {
    try {
        const sheets = getSheets();
        if (!sheets) return [];

        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "สินค้า!A2:G",
        });

        const rows = res.data.values || [];
        return rows.map((row, i) => ({
            index: i + 1,
            code: row[0] || "",
            name: row[1] || "",
            category: row[2] || "",
            unit: row[3] || "",
            costPrice: parseFloat(row[4]) || 0,
            sellPrice: parseFloat(row[5]) || 0,
            note: row[6] || "",
        }));
    } catch (e) {
        console.error("readProductsFromSheet error:", e);
        return [];
    }
}

// ============================================
// Helper: embed URL
// ============================================
export function getSheetEmbedUrl(spreadsheetId: string, gid: number = 0): string {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?gid=${gid}&embedded=true`;
}
