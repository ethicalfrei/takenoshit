export type SpriteBook = {
  player: Record<"idle" | "punch" | "punch2" | "punch3" | "slap" | "dodge" | "duck" | "grab", HTMLImageElement>;
  walk: HTMLImageElement[];
  bosses: Record<string, Record<"idle" | "attack" | "hurt", HTMLImageElement>>;
  proj: Record<string, HTMLImageElement>;
  impact: HTMLImageElement;
  bg: Record<string, HTMLImageElement>;
  walkBg: Record<string, HTMLImageElement>;
  fatality: Record<string, HTMLImageElement>;
};

const V = "v=horton-classic1";

function asset(path: string) {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  return `${base}${path}`;
}

const PATHS = {
  player: {
    idle: `/sprites/player-idle.png?${V}`,
    punch: `/sprites/player-punch.png?${V}`,
    punch2: `/sprites/player-punch2.png?${V}`,
    punch3: `/sprites/player-punch3.png?${V}`,
    slap: `/sprites/player-slap.png?${V}`,
    dodge: `/sprites/player-dodge.png?${V}`,
    duck: `/sprites/player-duck.png?${V}`,
    grab: `/sprites/player-grab.png?${V}`,
  },
  walk: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `/sprites/player-walk-${i}.png?${V}`),
  bosses: {
    roommate: {
      idle: "/sprites/roommate-idle.png",
      attack: "/sprites/roommate-attack.png",
      hurt: "/sprites/roommate-hurt.png",
    },
    leaf: {
      idle: "/sprites/leaf-idle.png",
      attack: "/sprites/leaf-attack.png",
      hurt: "/sprites/leaf-hurt.png",
    },
    baker: {
      idle: "/sprites/baker-idle.png",
      attack: "/sprites/baker-attack.png",
      hurt: "/sprites/baker-stun.png",
    },
    barista: {
      idle: "/sprites/barista-idle.png",
      attack: "/sprites/barista-attack.png",
      hurt: "/sprites/barista-hurt.png",
    },
    manager: {
      idle: "/sprites/manager-idle.png",
      attack: "/sprites/manager-attack.png",
      hurt: "/sprites/manager-idle.png",
    },
    hr: {
      idle: "/sprites/manager-idle.png",
      attack: "/sprites/manager-attack.png",
      hurt: "/sprites/manager-idle.png",
    },
    gym: {
      idle: "/sprites/gym-idle.png",
      attack: "/sprites/gym-attack.png",
      hurt: "/sprites/gym-hurt.png",
    },
    boss: {
      idle: "/sprites/boss-idle.png",
      attack: "/sprites/boss-attack.png",
      hurt: "/sprites/boss-stun.png",
    },
    cops: {
      idle: "/sprites/cops-idle.png",
      attack: "/sprites/cops-attack.png",
      hurt: "/sprites/cops-hurt.png",
    },
  },
  proj: {
    pizza: "/sprites/proj-pizza.png",
    beer: "/sprites/proj-beer.png",
    can: "/sprites/proj-beer.png",
    paper: "/sprites/proj-paper.png",
    stapler: "/sprites/proj-stapler.png",
    leaf: "/sprites/proj-leaf.png",
    cup: "/sprites/proj-cup.png",
    plate: "/sprites/proj-plate.png",
  },
  impact: "/sprites/fx-impact.png",
  bg: {
    roommate: "/sprites/bg-apartment.jpg",
    leaf: "/sprites/bg-leaf.jpg",
    baker: "/sprites/bg-bakery.jpg",
    barista: "/sprites/bg-coffee.jpg",
    manager: "/sprites/bg-office.jpg",
    hr: "/sprites/bg-office.jpg",
    gym: "/sprites/bg-gym.jpg",
    boss: "/sprites/bg-corner.jpg",
    cops: "/sprites/bg-street.jpg",
  },
  walkBg: {
    roommate: "/walks/walk-roommate.jpg",
    leaf: "/walks/walk-leaf.jpg",
    baker: "/walks/walk-baker.jpg",
    barista: "/walks/walk-barista.jpg",
    manager: "/walks/walk-manager.jpg",
    hr: "/walks/walk-hr.jpg?v=pat1",
    gym: "/walks/walk-gym.jpg",
    boss: "/walks/walk-boss.jpg?v=rich1",
    cops: "/walks/walk-cops.jpg",
  },
  fatality: {
    roommate: "/sprites/fatality-roommate.png",
    leaf: "/sprites/fatality-leaf.png",
    baker: "/sprites/fatality-baker.png",
    barista: "/sprites/fatality-barista.png",
    manager: "/sprites/fatality-manager.png",
    hr: "/sprites/fatality-hr.png",
    gym: "/sprites/fatality-gym.png",
    boss: "/sprites/fatality-boss.png",
    cops: "/sprites/fatality-cops.png",
  },
};

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = asset(src);
  });
}

async function pool<T>(items: string[], limit: number, fn: (s: string) => Promise<T>): Promise<T[]> {
  const out: T[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

async function loadMap(m: Record<string, string>): Promise<Record<string, HTMLImageElement>> {
  const keys = Object.keys(m);
  const imgs = await pool(keys.map((k) => m[k]), 4, loadImage);
  const r: Record<string, HTMLImageElement> = {};
  keys.forEach((k, i) => (r[k] = imgs[i]));
  return r;
}

export async function loadAssets(): Promise<SpriteBook> {
  const playerKeys = ["idle", "punch", "punch2", "punch3", "slap", "dodge", "duck", "grab"] as const;
  const playerPaths = playerKeys.map((k) => PATHS.player[k]);
  const playerImgs = await pool(playerPaths, 4, loadImage);
  const player: SpriteBook["player"] = {} as any;
  playerKeys.forEach((k, i) => (player[k] = playerImgs[i]));

  const walk = await pool(PATHS.walk, 4, loadImage);

  return {
    player,
    walk,
    bosses: await loadMap(
      Object.fromEntries(
        Object.entries(PATHS.bosses).flatMap(([id, poses]) =>
          Object.entries(poses).map(([pose, path]) => [`${id}:${pose}`, path])
        )
      )
    ).then((flat) => {
      const r: SpriteBook["bosses"] = {} as any;
      for (const [k, img] of Object.entries(flat)) {
        const [id, pose] = k.split(":");
        if (!r[id]) r[id] = {} as any;
        r[id][pose as "idle" | "attack" | "hurt"] = img;
      }
      return r;
    }),
    proj: await loadMap(PATHS.proj),
    impact: await loadImage(PATHS.impact),
    bg: await loadMap(PATHS.bg),
    walkBg: await loadMap(PATHS.walkBg),
    fatality: await loadMap(PATHS.fatality),
  };
}
