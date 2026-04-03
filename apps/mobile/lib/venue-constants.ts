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

export const ACTIVITY_EMOJI: Record<string, string> = {
  poll: '🗳️',
  contest: '🏆',
  tournament: '⚔️',
  challenge: '🎯',
  quest: '📜',
  auction: '💰',
  event: '🎉',
};
