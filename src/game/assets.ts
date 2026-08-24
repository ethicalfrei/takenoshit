export type SpriteBook = {
  player: Record<"idle" | "punch" | "dodge" | "duck" | "grab", HTMLImageElement>;
  walk: HTMLImageElement[];
  bosses: Record<string, Record<"idle" | "attack" | "hurt", HTMLImageElement>>;
  proj: Record<string, HTMLImageElement>;
  impact: HTMLImageElement;
  bg: Record<string, HTMLImageElement>;
  walkBg: Record<string, HTMLImageElement>;
  fatality: Record<string, HTMLImageElement>;
};

const V = "v=fists3";

function asset(path: string) {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  return `${base}${path}`;
}

const PATHS = {
  player: {
    idle: `/sprites/player-idle.png?${V}`,
    punch: `/sprites/player-punch.png?${V}`,
    dodge: `/sprites/player-dodge.png?${V}`,
    duck: `/sprites/player-duck.png?${V}`,
    grab: `/sprites/player-grab.png?${V}`,
  },
  walk: [0, 1, 2, 3].map((i) => `/sprites/player-walk-${i}.png?${V}`),
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
    gym: "/sprites/bg-gym.jpg",
    boss: "/sprites/bg-corner.jpg",
  },
  walkBg: {
    roommate: "/walks/walk-roommate.jpg",
    leaf: "/walks/walk-leaf.jpg",
    baker: "/walks/walk-baker.jpg",
    barista: "/walks/walk-barista.jpg",
    manager: "/walks/walk-manager.jpg",
    gym: "/walks/walk-gym.jpg",
    boss: "/walks/walk-boss.jpg",
  },
  fatality: {
    roommate: "/fatalities/roommate.jpg",
    leaf: "/fatalities/leaf.jpg",
    baker: "/fatalities/baker.jpg",
    barista: "/fatalities/barista.jpg",
    manager: "/fatalities/manager.jpg",
    gym: "/fatalities/gym.jpg",
    boss: "/fatalities/boss.jpg",
  },
};

export const FATALITY_VID: Record<string, string> = {
  roommate: asset("/fatalities/roommate.mp4"),
  leaf: asset("/fatalities/leaf.mp4"),
  baker: asset("/fatalities/baker.mp4"),
  barista: asset("/fatalities/barista.mp4"),
  manager: asset("/fatalities/manager.mp4"),
  gym: asset("/fatalities/gym.mp4"),
  boss: asset("/fatalities/boss.mp4"),
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`asset ${src}`));
    img.src = asset(src);
  });
}

async function loadMap(map: Record<string, string>) {
  const out: Record<string, HTMLImageElement> = {};
  await Promise.all(
    Object.entries(map).map(async ([k, p]) => {
      out[k] = await loadImage(p);
    }),
  );
  return out;
}

export async function loadAssets(): Promise<SpriteBook> {
  const playerEntries = await loadMap(PATHS.player);
  const walk = await Promise.all(PATHS.walk.map(loadImage));
  const bosses: SpriteBook["bosses"] = {};
  await Promise.all(
    Object.entries(PATHS.bosses).map(async ([id, poses]) => {
      bosses[id] = {
        idle: await loadImage(poses.idle),
        attack: await loadImage(poses.attack),
        hurt: await loadImage(poses.hurt),
      };
    }),
  );
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
