import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OnboardingSession, ClinicData, BranchData, ProductType } from "@/types";

interface SessionState {
    session: OnboardingSession | null;
    isLoading: boolean;

    // Actions
    setSession: (session: OnboardingSession) => void;
    clearSession: () => void;
    setLoading: (loading: boolean) => void;
    updateClinicData: (data: ClinicData) => void;
    updateBranchData: (data: BranchData[]) => void;
    updateStatus: (status: OnboardingSession["status"]) => void;

    // Computed-like helpers
    getProduct: () => ProductType;
    isReadOnly: () => boolean;
}

export const useSessionStore = create<SessionState>()(
    persist(
        (set, get) => ({
            session: null,
            isLoading: true,

            setSession: (session) => set({ session, isLoading: false }),
            clearSession: () => set({ session: null, isLoading: false }),
            setLoading: (isLoading) => set({ isLoading }),

            updateClinicData: (clinicData) => {
                const { session } = get();
                if (!session) return;
                set({ session: { ...session, clinic_data: clinicData } });
            },

            updateBranchData: (branchData) => {
                const { session } = get();
                if (!session) return;
                set({ session: { ...session, branch_data: branchData } });
            },

            updateStatus: (status) => {
                const { session } = get();
                if (!session) return;
                set({ session: { ...session, status } });
            },

            getProduct: () => get().session?.product || "dr_ease",
            isReadOnly: () => {
                const status = get().session?.status;
                return status === "submitted" || status === "approved";
            },
        }),
        {
            name: "onboarding_session",
            partialize: (state) => ({ session: state.session }),
        }
    )
);
