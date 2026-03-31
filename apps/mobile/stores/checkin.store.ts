import { create } from 'zustand';

interface CheckinState {
  activeCheckinId: string | null;
  activeVenueId: string | null;
  setActiveCheckin: (checkinId: string, venueId: string) => void;
  clearCheckin: () => void;
}

export const useCheckinStore = create<CheckinState>((set) => ({
  activeCheckinId: null,
  activeVenueId: null,
  setActiveCheckin: (checkinId, venueId) =>
    set({ activeCheckinId: checkinId, activeVenueId: venueId }),
  clearCheckin: () =>
    set({ activeCheckinId: null, activeVenueId: null }),
}));
