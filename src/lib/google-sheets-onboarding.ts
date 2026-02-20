import "server-only";
import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import type { Procedure, Product } from "@/types";

// Auth with service account
function getAuth() {
    return new GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        },
        scopes: [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive.file",
        ],
    });
}

// Copy template sheet for a new customer
export async function createCustomerSheet(customerName: string): Promise<{ spreadsheetId: string; url: string }> {
    const auth = getAuth();
    const drive = google.drive({ version: "v3", auth });

    const templateId = process.env.GOOGLE_ONBOARDING_TEMPLATE_SHEET_ID;
    if (!templateId) throw new Error("GOOGLE_ONBOARDING_TEMPLATE_SHEET_ID not set");

    const response = await drive.files.copy({
        fileId: templateId,
        requestBody: {
            name: `Onboarding - ${customerName}`,
        },
    });

    const spreadsheetId = response.data.id!;

    // Share: anyone with link can edit
    await drive.permissions.create({
        fileId: spreadsheetId,
        requestBody: {
            role: "writer",
            type: "anyone",
        },
    });

    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    return { spreadsheetId, url };
}

// Read procedures from sheet (Tab 1: หัตถการ)
export async function readProceduresFromSheet(spreadsheetId: string): Promise<Procedure[]> {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "หัตถการ!A2:H",
    });

    const rows = response.data.values || [];

    return rows
        .filter((row) => row[2]) // must have name
        .map((row, i) => ({
            index: parseInt(row[0]) || i + 1,
            code: row[1] || "",
            name: row[2] || "",
            nameEn: row[3] || "",
            category: row[4] || "",
            price: parseFloat(row[5]?.replace(/,/g, "")) || 0,
            duration: parseInt(row[6]) || 0,
            note: row[7] || "",
        }));
}

// Read products from sheet (Tab 2: สินค้า)
export async function readProductsFromSheet(spreadsheetId: string): Promise<Product[]> {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "สินค้า!A2:H",
    });

    const rows = response.data.values || [];

    return rows
        .filter((row) => row[2]) // must have name
        .map((row, i) => ({
            index: parseInt(row[0]) || i + 1,
            code: row[1] || "",
            name: row[2] || "",
            category: row[3] || "",
            unit: row[4] || "",
            costPrice: parseFloat(row[5]?.replace(/,/g, "")) || 0,
            sellPrice: parseFloat(row[6]?.replace(/,/g, "")) || 0,
            note: row[7] || "",
        }));
}

// Get embed URL for iframe
export function getSheetEmbedUrl(spreadsheetId: string, gid: number = 0): string {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?gid=${gid}&embedded=true`;
}
