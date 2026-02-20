import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Lazy init to avoid build-time errors when env vars are not set
let _supabase: SupabaseClient | null = null;
let _dbAdmin: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
    if (!_supabase) {
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error("Supabase URL and Anon Key are required. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
        }
        _supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
    return _supabase;
}

function getDbAdmin(): SupabaseClient {
    if (!_dbAdmin) {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (serviceRoleKey) {
            _dbAdmin = createClient(supabaseUrl, serviceRoleKey, {
                auth: { autoRefreshToken: false, persistSession: false },
            });
        } else {
            _dbAdmin = getSupabase();
        }
    }
    return _dbAdmin;
}

// Use these getters in server actions
export const supabase = new Proxy({} as SupabaseClient, {
    get(_, prop) {
        return (getSupabase() as Record<string, unknown>)[prop as string];
    },
});

export const db = new Proxy({} as SupabaseClient, {
    get(_, prop) {
        return (getDbAdmin() as Record<string, unknown>)[prop as string];
    },
});

export const dbAdmin = db;
