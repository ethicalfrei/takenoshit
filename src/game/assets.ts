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

const V = "v=live4";

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
  walk: [0, 1, 2, 3, 4, 5].map((i) => `/sprites/player-walk-${i}.png?${V}`),
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
      idle: `/sprites/hr-idle.png?${V}`,
      attack: `/sprites/hr-attack.png?${V}`,
      hurt: `/sprites/hr-hurt.png?${V}`,
    },
    gym: {
      idle: "/sprites/gym-idle.png",
      attack: "/sprites/gym-attack.png",
      hurt: "/sprites/gym-hurt.png",
    },
    boss: {
      idle: "/sprites/boss-idle.png",
      attack: "/sprites/boss-attack.png?v=rear1",
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
    hr: "/sprites/bg-hr.jpg?v=pat1",
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
    roommate: "/fatalities/roommate.jpg?v=hero2",
    leaf: "/fatalities/leaf.jpg?v=hero2",
    baker: "/fatalities/baker.jpg?v=hero2",
    barista: "/fatalities/barista.jpg?v=hero2",
    manager: "/fatalities/manager.jpg?v=hero2",
    hr: "/fatalities/hr.jpg?v=file2",
    gym: "/fatalities/gym.jpg?v=hero2",
    boss: "/fatalities/boss.jpg?v=suplex1",
    cops: "/fatalities/cops.jpg?v=hero2",
  },
};

export const FATALITY_VID: Record<string, string> = {
  roommate: asset("/fatalities/roommate.mp4"),
  leaf: asset("/fatalities/leaf.mp4"),
  baker: asset("/fatalities/baker.mp4"),
  barista: asset("/fatalities/barista.mp4"),
  manager: asset("/fatalities/manager.mp4"),
  hr: asset("/fatalities/hr.mp4"),
  gym: asset("/fatalities/gym.mp4"),
  boss: asset("/fatalities/boss.mp4"),
  cops: asset("/fatalities/cops.mp4"),
};

function placeholder() {
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 16;
  const g = c.getContext("2d");
  if (g) {
    g.fillStyle = "#c45c26";
    g.fillRect(0, 0, 16, 16);
  }
  const img = new Image();
  img.src = c.toDataURL();
  return img;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(placeholder());
    img.src = asset(src);
  });
}

async function pool<T, R>(items: T[], n: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, () => worker()));
  return out;
}

async function loadMap(map: Record<string, string>) {
  const entries = Object.entries(map);
  const imgs = await pool(entries, 6, ([, p]) => loadImage(p));
  const out: Record<string, HTMLImageElement> = {};
  entries.forEach(([k], i) => {
    out[k] = imgs[i];
  });
  return out;
}

export async function loadAssets(): Promise<SpriteBook> {
  const playerEntries = await loadMap(PATHS.player);
  const walk = await pool(PATHS.walk, 4, loadImage);
  const bosses: SpriteBook["bosses"] = {};
  const bossIds = Object.entries(PATHS.bosses);
  await pool(bossIds, 3, async ([id, poses]) => {
    bosses[id] = {
      idle: await loadImage(poses.idle),
      attack: await loadImage(poses.attack),
      hurt: await loadImage(poses.hurt),
    };
  });
  return {
    player: playerEntries as SpriteBook["player"],
    walk,
    bosses,
    proj: await loadMap(PATHS.proj),
    impact: await loadImage(PATHS.impact),
    bg: await loadMap(PATHS.bg),
    walkBg: await loadMap(PATHS.walkBg),
    fatality: await loadMap(PATHS.fatality),
  };
}

export const BG_FOR: Record<string, string> = PATHS.bg;

export function fatalitySrc(id: string) {
  const src = FATALITY_VID[id];
  return src ? `${src}?v=file2` : "";
}

export function warmFightVisuals(book: SpriteBook, id: string) {
  const imgs: Array<HTMLImageElement | undefined> = [
    book.bg[id],
    book.bosses[id]?.idle,
    book.bosses[id]?.attack,
    book.bosses[id]?.hurt,
    book.player.idle,
    book.player.punch,
    book.player.dodge,
    book.player.duck,
    book.fatality[id],
  ];
  for (const img of imgs) {
    if (img?.decode) void img.decode().catch(() => {});
  }
}

