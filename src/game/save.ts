const KEY = "tns-save-v1";

export type SaveData = {
  version: 1;
  highScore: number;
  bestDay: number;
  muted: boolean;
};

const DEFAULT: SaveData = { version: 1, highScore: 0, bestDay: 0, muted: false };

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      version: 1,
      highScore: Number(parsed.highScore) || 0,
      bestDay: Number(parsed.bestDay) || 0,
      muted: Boolean(parsed.muted),
    };
  } catch {
    return { ...DEFAULT };
  }
}

export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...data, version: 1 }));
  } catch {
    /* ignore quota */
  }
}
