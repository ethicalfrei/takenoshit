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

const V = "v=live6";

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
  // 0, 1, 5 face left / turn around. 2–4 walk toward the camera, same direction.
  walk: [2, 3, 4].map((i) => `/sprites/player-walk-${i}.png?${V}`),
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

function makeImg() {
  const img = new Image();
  img.src = placeholder().src;
  return img;
}

function loadInto(img: HTMLImageElement, src: string) {
  return new Promise<HTMLImageElement>((resolve) => {
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
    img.src = asset(src);
  });
}

async function pool<T>(items: T[], n: number, fn: (item: T) => Promise<unknown>): Promise<void> {
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, () => worker()));
}

export function createSpriteBook(): SpriteBook {
  const player = {
    idle: makeImg(),
    punch: makeImg(),
    punch2: makeImg(),
    punch3: makeImg(),
    slap: makeImg(),
    dodge: makeImg(),
    duck: makeImg(),
    grab: makeImg(),
  };
  const bosses: SpriteBook["bosses"] = {};
  for (const id of Object.keys(PATHS.bosses)) {
    bosses[id] = { idle: makeImg(), attack: makeImg(), hurt: makeImg() };
  }
  const from = (map: Record<string, string>) => {
    const out: Record<string, HTMLImageElement> = {};
    for (const k of Object.keys(map)) out[k] = makeImg();
    return out;
  };
  return {
    player,
    walk: PATHS.walk.map(() => makeImg()),
    bosses,
    proj: from(PATHS.proj),
    impact: makeImg(),
    bg: from(PATHS.bg),
    walkBg: from(PATHS.walkBg),
    fatality: from(PATHS.fatality),
  };
}

/** First walk + title. ~5 images so Get up is not blocked on 60MB of sprites. */
export async function loadBoot(book: SpriteBook) {
  await Promise.all([
    ...PATHS.walk.map((src, i) => loadInto(book.walk[i], src)),
    loadInto(book.player.idle, PATHS.player.idle),
    loadInto(book.walkBg.roommate, PATHS.walkBg.roommate),
  ]);
}

export async function loadRest(book: SpriteBook) {
  await Promise.all([
    loadInto(book.player.punch2, PATHS.player.punch2),
    loadInto(book.player.punch3, PATHS.player.punch3),
    loadInto(book.player.dodge, PATHS.player.dodge),
    loadInto(book.player.duck, PATHS.player.duck),
    loadInto(book.player.grab, PATHS.player.grab),
    loadInto(book.player.slap, PATHS.player.slap),
    loadInto(book.bosses.roommate.idle, PATHS.bosses.roommate.idle),
    loadInto(book.bosses.roommate.attack, PATHS.bosses.roommate.attack),
    loadInto(book.bosses.roommate.hurt, PATHS.bosses.roommate.hurt),
    loadInto(book.bg.roommate, PATHS.bg.roommate),
    loadInto(book.impact, PATHS.impact),
  ]);
  const jobs: Array<() => Promise<unknown>> = [];
  for (const [k, src] of Object.entries(PATHS.player)) {
    jobs.push(() => loadInto(book.player[k as keyof SpriteBook["player"]], src));
  }
  for (const [id, poses] of Object.entries(PATHS.bosses)) {
    if (id === "roommate") continue;
    jobs.push(() => loadInto(book.bosses[id].idle, poses.idle));
    jobs.push(() => loadInto(book.bosses[id].attack, poses.attack));
    jobs.push(() => loadInto(book.bosses[id].hurt, poses.hurt));
  }
  for (const [k, src] of Object.entries(PATHS.proj)) {
    jobs.push(() => loadInto(book.proj[k], src));
  }
  for (const [k, src] of Object.entries(PATHS.bg)) {
    if (k === "roommate") continue;
    jobs.push(() => loadInto(book.bg[k], src));
  }
  for (const [k, src] of Object.entries(PATHS.walkBg)) {
    if (k === "roommate") continue;
    jobs.push(() => loadInto(book.walkBg[k], src));
  }
  for (const [k, src] of Object.entries(PATHS.fatality)) {
    jobs.push(() => loadInto(book.fatality[k], src));
  }
  await pool(jobs, 8, (fn) => fn());
}

export async function loadAssets(onBoot?: (book: SpriteBook) => void): Promise<SpriteBook> {
  const book = createSpriteBook();
  await loadBoot(book);
  onBoot?.(book);
  void loadRest(book);
  return book;
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
