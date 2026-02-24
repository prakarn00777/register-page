import "server-only";
import type { Procedure, Product } from "@/types";

// ============================================
// Google Sheets integration — DISABLED for v1
// Will be re-enabled when Google Service Account is set up
// ============================================

export async function createCustomerSheet(_customerName: string): Promise<{ spreadsheetId: string; url: string } | null> {
    // v1: skip Google Sheet creation
    return null;
}

export async function readProceduresFromSheet(_spreadsheetId: string): Promise<Procedure[]> {
    return [];
}

export async function readProductsFromSheet(_spreadsheetId: string): Promise<Product[]> {
    return [];
}

export function getSheetEmbedUrl(spreadsheetId: string, gid: number = 0): string {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?gid=${gid}&embedded=true`;
}
