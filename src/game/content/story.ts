export type ScreenCopy = {
  title: string;
  body: string;
  cta: string;
};

export type Interlude = {
  bossId: "roommate" | "leaf" | "baker" | "barista" | "manager" | "hr" | "gym" | "boss" | "cops";
  clock: string;
  place: string;
  from: string;
  to: string;
  walkLine: string;
  narrator: string[];
  question: string;
  answer: string;
  sting: string;
};

export const TITLE: ScreenCopy = {
  title: "TAKE NO SHIT",
  body: "Volume Up Motherfucker!!!",
  cta: "Get up",
};

export const HOW_TO: { title: string; steps: { label: string; detail: string }[] } = {
  title: "How you fight",
  steps: [
    {
      label: "Watch",
      detail: "They telegraph. A shoulder. A smirk. A reply-all. Read it, then move.",
    },
    {
      label: "Swipe",
      detail: "When it says move, swipe. Left, right, or down. Do that and you are clear — you do not have to time the hit.",
    },
    {
      label: "Tap",
      detail: "Left half or right half. That is a punch. Open side lands. Guarded side clangs.",
    },
    {
      label: "Stun",
      detail: "Clean shots fill the stars. Three stars, they wobble. Then you grab.",
    },
    {
      label: "Mash",
      detail: "The fatality is the whole screen. Mash it. Do not stop.",
    },
  ],
};

export const PAUSE: {
  title: string;
  resume: string;
  mute: string;
  unmute: string;
  retry: string;
  quit: string;
} = {
  title: "Hold up",
  resume: "Get back in",
  mute: "Kill the sound",
  unmute: "Bring the sound",
  retry: "Run it back",
  quit: "Clock out",
};

export const INTERLUDES: Interlude[] = [
  {
    bossId: "roommate",
    clock: "6:41 AM",
    place: "The hallway you share",
    from: "The bedroom",
    to: "The hallway",
    walkLine: "Thin wall. Fat snore. Thin patience.",
    narrator: [
      "The rent Venmo is still pending. Same gray button. Him.",
      "He is snoring through the wall. A man with no bills.",
      "You covered March. You covered April. You covered the electric.",
      "His pizza box has been in the sink since Tuesday.",
      "You asked twice. You are not asking a third time.",
      "The kettle clicks off. Yesterday's shirt. No coffee yet.",
      "Bedroom to hallway. Eight steps. He is in there. So is your money.",
    ],
    question: "Did you swallow that shit?",
    answer: "No.",
    sting: "Take no shit.",
  },
  {
    bossId: "leaf",
    clock: "7:12 AM",
    place: "The driveway at dawn",
    from: "The stoop",
    to: "The driveway",
    walkLine: "Dawn. One leaf. A whole engine.",
    narrator: [
      "You made it to the stoop. Dawn still gray.",
      "Ken Decibel is already out there. Orange ear pro. Full volume.",
      "One leaf. A single brown leaf on his driveway.",
      "He is blowing it. Back and forth. The same leaf.",
      "The blower screams like a jet that never leaves.",
      "Your coffee is still in the kitchen. His leaf is not moving.",
      "He sees you. He does not stop. He never stops.",
    ],
    question: "Did you swallow that shit?",
    answer: "No.",
    sting: "Take no shit.",
  },
  {
    bossId: "baker",
    clock: "7:58 AM",
    place: "The shop on the corner",
    from: "The street",
    to: "The bakery window",
    walkLine: "Brake lights. Sesame. The city starts chewing.",
    narrator: [
      "The street still smells like two-stroke. You want bread instead.",
      "Tony Oven is behind the glass. Everything bagel on the board.",
      "You wanted one. Toasted. Not a lecture on sesame.",
      "He wrapped the last one for a regular who is not even here.",
      "Exact change. Same order as always. He looks past you.",
      "Says they just ran out. He is holding it. Warm.",
      "The guy behind you sighs like you are the problem.",
    ],
    question: "Did you swallow that shit?",
    answer: "No.",
    sting: "Take no shit.",
  },
  {
    bossId: "barista",
    clock: "8:14 AM",
    place: "The coffee shop next door",
    from: "The bakery",
    to: "The coffee shop",
    walkLine: "Napkin grease. Next door. Steam already hissing.",
    narrator: [
      "Bagel in a napkin. Next door. Coffee. That was the plan.",
      "River Oat is already talking. Oat milk. The sermon starts before the pour.",
      "You said dairy. They heard a cause.",
      "The cup comes back. Your name is wrong. On purpose.",
      "They spell it like a joke you did not ask for.",
      "Four dollars for the lecture. Two for the drink.",
      "The line behind you pretends this is normal.",
    ],
    question: "Did you swallow that shit?",
    answer: "No.",
    sting: "Take no shit.",
  },
  {
    bossId: "manager",
    clock: "8:59 AM",
    place: "Conference room B",
    from: "The badge reader",
    to: "Conference room B",
    walkLine: "Fluorescents. That hum. The day clocks in too.",
    narrator: [
      "Oat milk on the lid. Badge in your pocket.",
      "The beep sounds like it already knows you.",
      "Valerie Circleback put a huddle on the hour. The hour is now.",
      "TPS in the subject. Reply-all. You are in the CC for nothing.",
      "Your work is slide four. Her name is slide one.",
      "She is going to say let's take this offline.",
      "Fluorescent hum. Conference Room B. You walk in anyway.",
    ],
    question: "Did you swallow that shit?",
    answer: "No.",
    sting: "Take no shit.",
  },
  {
    bossId: "hr",
    clock: "9:41 AM",
    place: "The HR suite",
    from: "Conference room B",
    to: "The HR suite",
    walkLine: "Copier still warm. Hallway carpet. Policy air.",
    narrator: [
      "Valerie is paper. The day is not done with you.",
      "HR already knows. They always know first.",
      "Patricia Handbook has the incident form open. Your name is pre-filled.",
      "Safe space. Open door. Closed mind.",
      "She wants acknowledgment of receipt. She wants your tone adjusted.",
      "The handbook is thicker than the complaint. She is thicker with power.",
      "You walk in. She is already documenting the walk.",
    ],
    question: "Did you swallow that shit?",
    answer: "No.",
    sting: "Take no shit.",
  },
  {
    bossId: "gym",
    clock: "12:17 PM",
    place: "The fluorescent gym",
    from: "The HR suite",
    to: "The fluorescent gym",
    walkLine: "Policy air to iron. The light does not rest.",
    narrator: [
      "Lunch is a lie. The gym is fluorescent and closer.",
      "Brayden Rack is in the squat rack. Curling. Of course he is.",
      "Four machines. A towel on each. He is using none of them.",
      "He looks at you. Asks if you are using this.",
      "He is standing in it. His shaker bottle owns the next one.",
      "The squat rack is not for curls. Everyone knows. He does not.",
      "The playlist is screaming. So is the light.",
    ],
    question: "Did you swallow that shit?",
    answer: "No.",
    sting: "Take no shit.",
  },
  {
    bossId: "boss",
    clock: "4:47 PM",
    place: "The corner office",
    from: "The elevator",
    to: "The glass door",
    walkLine: "Elevator. Four forty-seven. Glass catching the late light.",
    narrator: [
      "The gym is over. The day is not.",
      "Elevator up. Four forty-seven. Late light on the glass door.",
      "Richard Synergy owns your PTO. He owns the smile too.",
      "Your hours live in his spreadsheet. You are a row.",
      "You asked for Friday. He said bring a smile. You saw the sheet.",
      "The PTO cells are red. Yours. Open on his screen.",
      "He will say this is not a good time. It never is.",
      "You are not smiling. You are taking the rest of the day.",
    ],
    question: "Did you swallow that shit?",
    answer: "No.",
    sting: "Take no shit.",
  },
  {
    bossId: "cops",
    clock: "5:19 PM",
    place: "The street outside",
    from: "The lobby",
    to: "The curb",
    walkLine: "Elevator down. Street air. Lights.",
    narrator: [
      "Richard is folded. The day is supposed to be over.",
      "Elevator down. Street air. That's home, in theory.",
      "Then the lights. Then the voices. Then the government.",
      "A cluster of cops. Clubs. The whole apparatus.",
      "They want ID. They want a reason. They want you smaller.",
      "You took no shit all day.",
    ],
    question: "Did you stand in the street and take it?",
    answer: "You don't get a choice.",
    sting: "That's the government.",
  },
];

export const VICTORY: ScreenCopy = {
  title: "You took no shit",
  body: "You took no shit today. Eight fights. Inbox closed. You are going home.",
  cta: "Go home",
};

export const DEFEAT: ScreenCopy = {
  title: "They took some",
  body: "The day is still standing. Get off the mat.",
  cta: "Get up",
};

export const ENDING: ScreenCopy = {
  title: "That's the government",
  body: "You took no shit all day. Then they had clubs. You don't get a fatality. That's the end.",
  cta: "Start the day over",
};

export const CREDITS_TAG = "Inbox closed. Head ringing. You took none of it. They took you.";

export const DAY_SONG_CAPTIONS: { scene: string; line: string }[] = [
  { scene: "dawn", line: "Grey light. The alarm already lost." },
  { scene: "kettle", line: "Water boils. So do you." },
  { scene: "hallway", line: "Thin wall. Fat snore. Thin patience." },
  { scene: "leaf", line: "One leaf. One blower. No peace." },
  { scene: "commute", line: "The commute does not care who you are." },
  { scene: "shop", line: "Everything bagel. Everything else can wait." },
  { scene: "coffee", line: "Oat milk. Wrong name. Hot enough." },
  { scene: "clock-in", line: "Badge in. The beep knows you." },
  { scene: "inbox", line: "Reply-all. You did not need this." },
  { scene: "fluorescent-noon", line: "Fluorescent noon. The gym is the anthem." },
  { scene: "five-pm", line: "The 5pm fight. Glass door. No more sir." },
  { scene: "elevator", line: "Down button. Held like a punch." },
  { scene: "night-bus", line: "Night bus home. Window seat. Nobody talks." },
  { scene: "stoop", line: "Key in the lock. Day over. You took none of it." },
];

export const ANNOUNCER: {
  fight: string;
  ko: string;
  dodge: string;
  blocked: string;
  stun: string;
  grab: string;
} = {
  fight: "In this corner: you. Out of patience.",
  ko: "DOWN. That one is done.",
  dodge: "WHIFF. They hit the place you used to be.",
  blocked: "DENIED. That one stays on their side.",
  stun: "WOBBLING. Grab them.",
  grab: "THE CLINCH. Mash them down.",
};

export const CONTROLS_HINT: { swipe: string; punch: string; mash: string } = {
  swipe: "Swipe off the hit.",
  punch: "Tap a half to punch.",
  mash: "Mash for the fatality.",
};
