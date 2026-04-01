import { create } from 'zustand';

interface MatchEvent {
  matchedNickname: string;
  matchedAvatar: string | null;
  chatId: string;
  venueName: string;
}

interface MatchState {
  pending: MatchEvent | null;
  showMatch: (event: MatchEvent) => void;
  dismiss: () => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  pending: null,
  showMatch: (event) => set({ pending: event }),
  dismiss: () => set({ pending: null }),
}));
