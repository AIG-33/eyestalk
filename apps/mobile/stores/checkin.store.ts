import { create } from 'zustand';

interface CheckinState {
  activeCheckinId: string | null;
  activeVenueId: string | null;
  /**
   * Set right after a successful check-in so a global sheet can immediately ask
   * the user for their status + visibility (whether others at the spot can see
   * them). Cleared once they dismiss the sheet.
   */
  postCheckinPromptId: string | null;
  setActiveCheckin: (checkinId: string, venueId: string) => void;
  clearCheckin: () => void;
  promptPostCheckin: (checkinId: string) => void;
  clearPostCheckinPrompt: () => void;
}

export const useCheckinStore = create<CheckinState>((set) => ({
  activeCheckinId: null,
  activeVenueId: null,
  postCheckinPromptId: null,
  setActiveCheckin: (checkinId, venueId) =>
    set({ activeCheckinId: checkinId, activeVenueId: venueId }),
  clearCheckin: () =>
    set({ activeCheckinId: null, activeVenueId: null }),
  promptPostCheckin: (checkinId) => set({ postCheckinPromptId: checkinId }),
  clearPostCheckinPrompt: () => set({ postCheckinPromptId: null }),
}));
