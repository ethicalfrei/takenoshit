export type Lane = "left" | "center" | "right" | "high";
export type Guard = "left" | "right" | "none";
export type AttackKind = "melee" | "projectile" | "slam";
export type BossId = "roommate" | "leaf" | "baker" | "barista" | "manager" | "gym" | "boss" | "cops";
export type ProjKind = "beer" | "pizza" | "paper" | "stapler" | "can" | "leaf" | "cup" | "plate";

export type AttackPattern = {
  id: string;
  telegraphMs: number;
  activeMs: number;
  recoverMs: number;
  lane: Lane;
  kind: AttackKind;
  damage: number;
  projectile?: ProjKind;
  telegraphCue: string;
};

export type FinisherSpec = {
  prompt: string;
  mashGoal: number;
  windowMs: number;
  successLine: string;
  flavor: string;
};

export type BossDef = {
  id: BossId;
  name: string;
  subtitle: string;
  clock: string;
  place: string;
  introLine: string;
  tauntLines: string[];
  hurtLines: string[];
  koLine: string;
  hp: number;
  stunThreshold: number;
  guardCycleMs: number;
  patterns: AttackPattern[];
  finisher: FinisherSpec;
  music: "dawn" | "morning" | "midday" | "finale";
  palette: { ring: string; glow: string };
  bg: string;
};

export const PLAYER_MAX_HP = 100;
export const STAR_HITS_FOR_STUN = 3;

export const ROSTER: BossDef[] = [
  {
    id: "roommate",
    name: "Drew Late",
    subtitle: "The Deadbeat",
    clock: "6:41 AM",
    place: "The hallway you share",
    introLine: "Bro I swear I'll Venmo you next month.",
    tauntLines: [
      "It's just rent, man. Chill.",
      "My paycheck didn't hit.",
      "You eat my cereal anyway.",
      "Can you cover me one more time?",
      "The couch is basically yours.",
    ],
    hurtLines: ["Okay wait—", "Dude, the TV—", "I said I'll pay you!"],
    koLine: "Fine. I'll sell the amp.",
    hp: 86,
    stunThreshold: 36,
    guardCycleMs: 1800,
    music: "morning",
    palette: { ring: "#6b4a32", glow: "#d4a574" },
    bg: "/sprites/bg-apartment.jpg",
    patterns: [
      { id: "beer-l", telegraphMs: 760, activeMs: 320, recoverMs: 640, lane: "left", kind: "projectile", damage: 8, projectile: "beer", telegraphCue: "can winds back" },
      { id: "beer-r", telegraphMs: 760, activeMs: 320, recoverMs: 640, lane: "right", kind: "projectile", damage: 8, projectile: "beer", telegraphCue: "other hand, other can" },
      { id: "box-l", telegraphMs: 720, activeMs: 280, recoverMs: 580, lane: "left", kind: "melee", damage: 10, telegraphCue: "pizza box swings left" },
      { id: "box-r", telegraphMs: 720, activeMs: 280, recoverMs: 580, lane: "right", kind: "melee", damage: 10, telegraphCue: "pizza box swings right" },
      { id: "laundry", telegraphMs: 800, activeMs: 360, recoverMs: 700, lane: "high", kind: "projectile", damage: 9, projectile: "can", telegraphCue: "dirty hoodie flies high" },
      { id: "shrug", telegraphMs: 680, activeMs: 300, recoverMs: 540, lane: "center", kind: "slam", damage: 11, telegraphCue: "both arms, the 'what?' shrug" },
    ],
    finisher: {
      prompt: "SLAM HIM INTO THE COUCH",
      mashGoal: 8,
      windowMs: 4500,
      successLine: "Rent is due. So is he.",
      flavor: "You grab the collar and drive his skull into the unpaid-bills cushion until the Venmo pings.",
    },
  },
  {
    id: "leaf",
    name: "Ken Decibel",
    subtitle: "One Leaf",
    clock: "7:12 AM",
    place: "The driveway at dawn",
    introLine: "Gotta get this leaf. HOA's watching.",
    tauntLines: [
      "It's my property, pal.",
      "Sunrise is prime blow time.",
      "You should thank me. It's quieter than a mower.",
      "One more pass. Then one more.",
      "The leaf moved. I saw it.",
    ],
    hurtLines: ["My ear pro—", "The bag!", "HOA's gonna hear about this."],
    koLine: "Fine. I'll use a rake. Once.",
    hp: 94,
    stunThreshold: 40,
    guardCycleMs: 1680,
    music: "dawn",
    palette: { ring: "#4a6b32", glow: "#c4d474" },
    bg: "/sprites/bg-leaf.jpg",
    patterns: [
      { id: "blow-l", telegraphMs: 700, activeMs: 340, recoverMs: 600, lane: "left", kind: "projectile", damage: 9, projectile: "leaf", telegraphCue: "blower cocks left" },
      { id: "blow-r", telegraphMs: 700, activeMs: 340, recoverMs: 600, lane: "right", kind: "projectile", damage: 9, projectile: "leaf", telegraphCue: "blower cocks right" },
      { id: "leaf-high", telegraphMs: 640, activeMs: 360, recoverMs: 560, lane: "high", kind: "projectile", damage: 10, projectile: "leaf", telegraphCue: "leaf tornado, duck" },
      { id: "pipe-l", telegraphMs: 680, activeMs: 260, recoverMs: 540, lane: "left", kind: "melee", damage: 11, telegraphCue: "blower pipe swings left" },
      { id: "pipe-r", telegraphMs: 680, activeMs: 260, recoverMs: 540, lane: "right", kind: "melee", damage: 11, telegraphCue: "blower pipe swings right" },
      { id: "dawn", telegraphMs: 620, activeMs: 320, recoverMs: 500, lane: "center", kind: "slam", damage: 12, telegraphCue: "full-volume dawn blast" },
    ],
    finisher: {
      prompt: "STUFF HIM IN THE BAG",
      mashGoal: 8,
      windowMs: 4500,
      successLine: "Collected. One Ken. Tuesday trash.",
      flavor: "You cinch the canvas bag with him in it. The blower keeps running. Peace, finally.",
    },
  },
  {
    id: "baker",
    name: "Tony Oven",
    subtitle: "Wrong Order",
    clock: "7:58 AM",
    place: "The shop on the corner",
    introLine: "You said everything bagel. This is everything bagel.",
    tauntLines: [
      "Sesame is a personality, pal.",
      "The oven doesn't wait.",
      "You want it toasted? It's toasted.",
      "Number 47, that's not you.",
      "We don't do 'just a bagel.'",
    ],
    hurtLines: ["My crust—", "The peel!", "Mama mia that's a jab."],
    koLine: "Take the bagel. Take two. Get out.",
    hp: 104,
    stunThreshold: 44,
    guardCycleMs: 1500,
    music: "morning",
    palette: { ring: "#a34a2c", glow: "#e8c07a" },
    bg: "/sprites/bg-bakery.jpg",
    patterns: [
      { id: "pizza-high", telegraphMs: 640, activeMs: 380, recoverMs: 560, lane: "high", kind: "projectile", damage: 12, projectile: "pizza", telegraphCue: "oven glows — pizza incoming" },
      { id: "spat-l", telegraphMs: 600, activeMs: 260, recoverMs: 500, lane: "left", kind: "melee", damage: 13, telegraphCue: "spatula cocks left" },
      { id: "spat-r", telegraphMs: 600, activeMs: 260, recoverMs: 500, lane: "right", kind: "melee", damage: 13, telegraphCue: "spatula cocks right" },
      { id: "flour", telegraphMs: 580, activeMs: 300, recoverMs: 480, lane: "center", kind: "slam", damage: 11, telegraphCue: "flour cloud in your face" },
      { id: "pizza-l", telegraphMs: 620, activeMs: 340, recoverMs: 520, lane: "left", kind: "projectile", damage: 12, projectile: "pizza", telegraphCue: "pie slides off the left rack" },
      { id: "double-high", telegraphMs: 560, activeMs: 400, recoverMs: 540, lane: "high", kind: "projectile", damage: 14, projectile: "pizza", telegraphCue: "two pies, one sky" },
    ],
    finisher: {
      prompt: "SMASH HIS HEAD INTO THE COUNTER",
      mashGoal: 8,
      windowMs: 4800,
      successLine: "Toasted. Extra crispy.",
      flavor: "You grab both ears and drum his forehead on the marble until the ticket printer screams.",
    },
  },
  {
    id: "barista",
    name: "River Oat",
    subtitle: "The Sermon",
    clock: "8:14 AM",
    place: "The coffee shop next door",
    introLine: "It's actually a cortado. And that's not how you spell you.",
    tauntLines: [
      "Dairy is a choice you can unlearn.",
      "I spelled it phonetically. For you.",
      "The oat milk is the point.",
      "Name's on the cup. That's the art.",
      "Have you considered oat?",
    ],
    hurtLines: ["The wand—", "My beanie!", "That's not ethically sourced."],
    koLine: "Fine. Whole milk. I hope you're happy.",
    hp: 112,
    stunThreshold: 48,
    guardCycleMs: 1400,
    music: "morning",
    palette: { ring: "#5c3d2e", glow: "#e8c9a0" },
    bg: "/sprites/bg-coffee.jpg",
    patterns: [
      { id: "cup-l", telegraphMs: 580, activeMs: 300, recoverMs: 500, lane: "left", kind: "projectile", damage: 12, projectile: "cup", telegraphCue: "scalding cup, left" },
      { id: "cup-r", telegraphMs: 580, activeMs: 300, recoverMs: 500, lane: "right", kind: "projectile", damage: 12, projectile: "cup", telegraphCue: "scalding cup, right" },
      { id: "oat-high", telegraphMs: 540, activeMs: 340, recoverMs: 480, lane: "high", kind: "projectile", damage: 13, projectile: "cup", telegraphCue: "oat carton, duck" },
      { id: "wand-l", telegraphMs: 560, activeMs: 240, recoverMs: 440, lane: "left", kind: "melee", damage: 13, telegraphCue: "steam wand left" },
      { id: "wand-r", telegraphMs: 560, activeMs: 240, recoverMs: 440, lane: "right", kind: "melee", damage: 13, telegraphCue: "steam wand right" },
      { id: "sermon", telegraphMs: 520, activeMs: 300, recoverMs: 420, lane: "center", kind: "slam", damage: 14, telegraphCue: "the lecture, point-blank" },
    ],
    finisher: {
      prompt: "BAPTIZE THEM IN OAT MILK",
      mashGoal: 8,
      windowMs: 4800,
      successLine: "Whole milk. On the house. Shut up.",
      flavor: "You empty the carton and finish with the steam wand. The cup finally has your name.",
    },
  },
  {
    id: "manager",
    name: "Valerie Circleback",
    subtitle: "Reply-All",
    clock: "8:59 AM",
    place: "Conference room B",
    introLine: "Let's take this offline. Meaning: now.",
    tauntLines: [
      "I put it on your calendar.",
      "Per my last email.",
      "We're going to circle back.",
      "That's not a blocker, that's a you problem.",
      "I need this by EOD. Yesterday.",
      "Can you jump on a quick huddle?",
    ],
    hurtLines: ["You're muted—", "That's not constructive.", "HR is watching."],
    koLine: "Fine. Move the standup to never.",
    hp: 122,
    stunThreshold: 52,
    guardCycleMs: 1280,
    music: "midday",
    palette: { ring: "#3d4a5c", glow: "#9bb0c9" },
    bg: "/sprites/bg-office.jpg",
    patterns: [
      { id: "paper-l", telegraphMs: 540, activeMs: 300, recoverMs: 460, lane: "left", kind: "projectile", damage: 12, projectile: "paper", telegraphCue: "TPS stack, left lane" },
      { id: "paper-r", telegraphMs: 540, activeMs: 300, recoverMs: 460, lane: "right", kind: "projectile", damage: 12, projectile: "paper", telegraphCue: "reply-all, right lane" },
      { id: "staple-high", telegraphMs: 500, activeMs: 280, recoverMs: 440, lane: "high", kind: "projectile", damage: 14, projectile: "stapler", telegraphCue: "stapler hatchet, duck" },
      { id: "clip-l", telegraphMs: 520, activeMs: 240, recoverMs: 420, lane: "left", kind: "melee", damage: 14, telegraphCue: "clipboard spear left" },
      { id: "clip-r", telegraphMs: 520, activeMs: 240, recoverMs: 420, lane: "right", kind: "melee", damage: 14, telegraphCue: "clipboard spear right" },
      { id: "huddle", telegraphMs: 480, activeMs: 320, recoverMs: 400, lane: "center", kind: "slam", damage: 15, telegraphCue: "mandatory huddle shockwave" },
      { id: "eod", telegraphMs: 460, activeMs: 260, recoverMs: 380, lane: "high", kind: "melee", damage: 13, telegraphCue: "EOD coming in high" },
    ],
    finisher: {
      prompt: "FEED HER TO THE COPIER",
      mashGoal: 8,
      windowMs: 5200,
      successLine: "Copies of her. Collated. You're muted.",
      flavor: "You slide her into the Xerox. Four hundred TPS cover sheets of her face later, the huddle is over.",
    },
  },
  {
    id: "gym",
    name: "Brayden Rack",
    subtitle: "You Using This?",
    clock: "12:17 PM",
    place: "The fluorescent gym",
    introLine: "You using this? Because I am. All of it.",
    tauntLines: [
      "It's a public gym, bro.",
      "Curls are a compound. Look it up.",
      "PR day. Don't kill my vibe.",
      "Towel means it's taken.",
      "Do you even lift. Rhetorical.",
    ],
    hurtLines: ["My AirPod—", "The plate!", "Spot me— wait."],
    koLine: "Okay. You can have the rack. I was done. Basically.",
    hp: 138,
    stunThreshold: 56,
    guardCycleMs: 1160,
    music: "midday",
    palette: { ring: "#7a2e2e", glow: "#e07a4a" },
    bg: "/sprites/bg-gym.jpg",
    patterns: [
      { id: "plate-l", telegraphMs: 500, activeMs: 280, recoverMs: 420, lane: "left", kind: "projectile", damage: 14, projectile: "plate", telegraphCue: "45 plate, left" },
      { id: "plate-r", telegraphMs: 500, activeMs: 280, recoverMs: 420, lane: "right", kind: "projectile", damage: 14, projectile: "plate", telegraphCue: "45 plate, right" },
      { id: "shake-high", telegraphMs: 480, activeMs: 300, recoverMs: 400, lane: "high", kind: "projectile", damage: 13, projectile: "plate", telegraphCue: "shaker bottle, duck" },
      { id: "curl-l", telegraphMs: 520, activeMs: 240, recoverMs: 400, lane: "left", kind: "melee", damage: 15, telegraphCue: "curl in YOUR rack, left" },
      { id: "curl-r", telegraphMs: 520, activeMs: 240, recoverMs: 400, lane: "right", kind: "melee", damage: 15, telegraphCue: "curl in YOUR rack, right" },
      { id: "drop", telegraphMs: 460, activeMs: 300, recoverMs: 380, lane: "center", kind: "slam", damage: 16, telegraphCue: "he drops the stack. On purpose." },
    ],
    finisher: {
      prompt: "DROP HIM LIKE A BARBELL",
      mashGoal: 9,
      windowMs: 5000,
      successLine: "Rack's free. Towel’s in the hamper.",
      flavor: "You clean-and-jerk Brayden and drop him. Plates bounce. The squat rack is a squat rack again.",
    },
  },
  {
    id: "boss",
    name: "Richard Synergy",
    subtitle: "The Employer",
    clock: "4:47 PM",
    place: "The corner office",
    introLine: "My office. Now. Bring a smile.",
    tauntLines: [
      "Let's leverage your bandwidth.",
      "PTO is a privilege.",
      "I need a hero here.",
      "That's not in the spirit of ownership.",
      "We wear a lot of hats. Wear this one.",
      "Your review is... developing.",
    ],
    hurtLines: ["HR—", "That's insubordination.", "My driver is waiting."],
    koLine: "You... you can't do this. I have a tee time.",
    hp: 158,
    stunThreshold: 62,
    guardCycleMs: 1040,
    music: "finale",
    palette: { ring: "#5c1f1a", glow: "#c44536" },
    bg: "/sprites/bg-corner.jpg",
    patterns: [
      { id: "review-high", telegraphMs: 480, activeMs: 260, recoverMs: 380, lane: "high", kind: "melee", damage: 16, telegraphCue: "performance review overhead" },
      { id: "point-l", telegraphMs: 500, activeMs: 240, recoverMs: 360, lane: "left", kind: "melee", damage: 15, telegraphCue: "the finger, left" },
      { id: "point-r", telegraphMs: 500, activeMs: 240, recoverMs: 360, lane: "right", kind: "melee", damage: 15, telegraphCue: "the finger, right" },
      { id: "synergy", telegraphMs: 460, activeMs: 320, recoverMs: 400, lane: "center", kind: "slam", damage: 17, telegraphCue: "SYNERGY shockwave" },
      { id: "fake", telegraphMs: 280, activeMs: 220, recoverMs: 340, lane: "left", kind: "melee", damage: 16, telegraphCue: "fake-out — too fast" },
      { id: "staple", telegraphMs: 440, activeMs: 280, recoverMs: 360, lane: "high", kind: "projectile", damage: 15, projectile: "stapler", telegraphCue: "gold stapler, duck" },
      { id: "paper-r", telegraphMs: 420, activeMs: 300, recoverMs: 340, lane: "right", kind: "projectile", damage: 14, projectile: "paper", telegraphCue: "PIP papers, right" },
      { id: "hat", telegraphMs: 400, activeMs: 240, recoverMs: 320, lane: "right", kind: "melee", damage: 16, telegraphCue: "wear this hat, now" },
    ],
    finisher: {
      prompt: "SHOVE HIS HEAD UP HIS ASS",
      mashGoal: 10,
      windowMs: 5500,
      successLine: "Ownership. He wore it.",
      flavor: "You fold him like a bad quarterly and park his head where the sun does not synergy.",
    },
  },
  {
    id: "cops",
    name: "The Government",
    subtitle: "Nightstick Crew",
    clock: "5:19 PM",
    place: "The street outside",
    introLine: "On the ground. Now.",
    tauntLines: [
      "ID.",
      "Don't resist.",
      "We asked you a question.",
      "Hands.",
      "That's a club.",
    ],
    hurtLines: ["—"],
    koLine: "That's the end.",
    hp: 999,
    stunThreshold: 999,
    guardCycleMs: 9999,
    music: "finale",
    palette: { ring: "#1a2744", glow: "#3d6bb3" },
    bg: "/sprites/bg-street.jpg",
    patterns: [
      { id: "club", telegraphMs: 180, activeMs: 220, recoverMs: 80, lane: "center", kind: "melee", damage: 28, telegraphCue: "club" },
    ],
    finisher: {
      prompt: "",
      mashGoal: 99,
      windowMs: 1000,
      successLine: "That's the end.",
      flavor: "They had clubs. You had a day.",
    },
  },
];
