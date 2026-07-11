export const VENUE_EMOJI: Record<string, string> = {
  karaoke: '🎤',
  nightclub: '🪩',
  sports_bar: '⚽',
  bowling: '🎳',
  billiards: '🎱',
  hookah: '💨',
  board_games: '🎲',
  arcade: '🕹️',
  standup: '🎭',
  live_music: '🎵',
  other: '📍',
};

export const VENUE_TYPE_KEYS = [
  'karaoke',
  'nightclub',
  'sports_bar',
  'bowling',
  'billiards',
  'hookah',
  'board_games',
  'arcade',
  'standup',
  'live_music',
  'other',
] as const;

// ─── Pop-up events ──────────────────────────────────────────
// Pop-ups are user-created temporary events, stored as venues with
// venue_kind='popup' and an expires_at. They get a distinct amber/party look
// on the map so they stand out from permanent venues.
export const POPUP_EMOJI = '🎉';
export const POPUP_COLOR = '#FFB020';
export const POPUP_AMBIENT = 'rgba(255,176,32,0.22)';

/** A pop-up event is a venue with venue_kind === 'popup'. */
export function isPopupVenue(v: { venue_kind?: string | null } | null | undefined): boolean {
  return v?.venue_kind === 'popup';
}

export const ACTIVITY_EMOJI: Record<string, string> = {
  poll: '🗳️',
  contest: '🏆',
  tournament: '⚔️',
  challenge: '🎯',
  quest: '📜',
  auction: '💰',
  event: '🎉',
};
