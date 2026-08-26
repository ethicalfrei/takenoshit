export type BossMusicId =
  | "roommate"
  | "leaf"
  | "baker"
  | "barista"
  | "manager"
  | "hr"
  | "gym"
  | "boss"
  | "cops";

/** Measured durations of the shipped beds, in seconds. */
export const MUSIC_SEC: Record<
  BossMusicId,
  { verse: number; chorus: number; fatality: number }
> = {
  roommate: { verse: 22.05, chorus: 20.06, fatality: 6.25 },
  leaf: { verse: 22.05, chorus: 20.01, fatality: 6.25 },
  baker: { verse: 22.05, chorus: 20.01, fatality: 6.25 },
  barista: { verse: 22.05, chorus: 20.01, fatality: 6.25 },
  manager: { verse: 22.05, chorus: 20.01, fatality: 6.25 },
  hr: { verse: 22.05, chorus: 20.01, fatality: 6.25 },
  gym: { verse: 22.05, chorus: 20.01, fatality: 6.25 },
  boss: { verse: 23.01, chorus: 22.05, fatality: 6.25 },
  cops: { verse: 22.05, chorus: 14.03, fatality: 6.25 },
};

export const FATALITY_VIDEO_SEC = 6.04;
export const FATALITY_HOLD_SEC = 6.35;

export function verseDuration(id: string) {
  return MUSIC_SEC[id as BossMusicId]?.verse ?? 22.05;
}

export function introAt(id: string) {
  return verseDuration(id) * 0.62;
}

export function introHold(id: string) {
  return introAt(id) + 2.8;
}

export function fatalityHold(_id?: string) {
  return FATALITY_HOLD_SEC;
}
