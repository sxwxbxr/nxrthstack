export interface Strategy {
  id: string;
  name: string;
  description: string;
  side: "attack" | "defense" | "both";
  difficulty: "easy" | "medium" | "hard" | "extreme";
  category: "fun" | "challenge" | "teamwork" | "meme" | "tactical";
  restrictions?: string[];
  tips?: string[];
}

export const strategies: Strategy[] = [
  // Attack Strategies
  {
    id: "rush-b",
    name: "Rush B",
    description: "No droning, no planning. Pick a random entry point and rush in as fast as possible. First 30 seconds only.",
    side: "attack",
    difficulty: "medium",
    category: "fun",
    restrictions: ["No droning allowed", "Must enter within 30 seconds"],
    tips: ["Coordinate with your team", "Bring flashbangs"],
  },
  {
    id: "silent-but-deadly",
    name: "Silent But Deadly",
    description: "Use only suppressed weapons. No callouts allowed - use pings only.",
    side: "attack",
    difficulty: "hard",
    category: "challenge",
    restrictions: ["Suppressed weapons only", "No voice comms - pings only"],
  },
  {
    id: "drone-army",
    name: "Drone Army",
    description: "Everyone must keep their drone alive. If your drone dies, you cannot enter the building until the last 30 seconds.",
    side: "attack",
    difficulty: "hard",
    category: "tactical",
    restrictions: ["Keep drone alive", "No entry if drone destroyed (until last 30s)"],
  },
  {
    id: "pistol-only",
    name: "Pistol Pete",
    description: "Secondary weapons only for the entire round. Show off your aim!",
    side: "both",
    difficulty: "hard",
    category: "challenge",
    restrictions: ["Pistols/secondaries only", "No gadget kills"],
  },
  {
    id: "no-kill-plant",
    name: "Pacifist Plant",
    description: "Plant the defuser without killing anyone. Injures are allowed but no confirms.",
    side: "attack",
    difficulty: "extreme",
    category: "challenge",
    restrictions: ["No kills allowed", "Injures OK but no confirms"],
    tips: ["Use smokes and flashes", "Coordinate distractions"],
  },
  {
    id: "shield-wall",
    name: "Shield Wall",
    description: "At least 2 players must bring shield operators. They lead every push.",
    side: "attack",
    difficulty: "medium",
    category: "teamwork",
    restrictions: ["Minimum 2 shield operators", "Shields must lead pushes"],
  },
  {
    id: "vertical-only",
    name: "Floor Is Lava",
    description: "Attack only from above or below. No same-floor gunfights until plant.",
    side: "attack",
    difficulty: "hard",
    category: "tactical",
    restrictions: ["Vertical play only", "No same-floor fights until plant"],
    tips: ["Bring Buck, Sledge, or Ash", "Learn floor layouts"],
  },
  {
    id: "one-drone-wonder",
    name: "One Drone Wonder",
    description: "The entire team shares ONE drone. Pass control between players.",
    side: "attack",
    difficulty: "hard",
    category: "teamwork",
    restrictions: ["Only 1 drone for the whole team", "Must share drone control"],
  },
  {
    id: "recruit-rush",
    name: "Recruit Rush",
    description: "Everyone plays Recruit. Pick M870 shotguns and rush site.",
    side: "attack",
    difficulty: "medium",
    category: "meme",
    restrictions: ["Recruit only", "M870 shotgun recommended"],
  },
  {
    id: "delayed-entry",
    name: "Fashionably Late",
    description: "Cannot enter the building until 1:30 remains on the clock.",
    side: "attack",
    difficulty: "hard",
    category: "challenge",
    restrictions: ["No building entry until 1:30 left"],
    tips: ["Use drones extensively", "Plan your entry route"],
  },

  // Defense Strategies
  {
    id: "roam-or-die",
    name: "Roam or Die",
    description: "Everyone must roam. No one can be in the objective room until attackers plant.",
    side: "defense",
    difficulty: "hard",
    category: "challenge",
    restrictions: ["No anchoring", "Must roam until plant"],
  },
  {
    id: "fortress",
    name: "Fortress",
    description: "Everyone stays on site. Maximum reinforcements and utility in objective.",
    side: "defense",
    difficulty: "easy",
    category: "tactical",
    restrictions: ["No roaming", "Everyone on site"],
    tips: ["Stack utility on chokepoints", "Crossfire setups"],
  },
  {
    id: "no-cams",
    name: "Blind Justice",
    description: "Cannot use any cameras (default or operator gadgets). Rely on sound only.",
    side: "defense",
    difficulty: "hard",
    category: "challenge",
    restrictions: ["No camera usage", "Sound only"],
  },
  {
    id: "shotgun-troop",
    name: "Shotgun Troop",
    description: "Primary shotguns only. Create maximum rotation holes.",
    side: "defense",
    difficulty: "medium",
    category: "fun",
    restrictions: ["Shotgun primaries only"],
    tips: ["Create rotations and murder holes", "Hold tight angles"],
  },
  {
    id: "impact-artist",
    name: "Impact Artist",
    description: "Everyone brings impact grenades. Create a maze of rotation holes.",
    side: "defense",
    difficulty: "easy",
    category: "fun",
    restrictions: ["Impact grenades required"],
  },
  {
    id: "spawn-peek-squad",
    name: "Spawn Peek Squad",
    description: "At least 3 players must attempt spawn peeks at round start.",
    side: "defense",
    difficulty: "medium",
    category: "meme",
    restrictions: ["Minimum 3 spawn peekers"],
    tips: ["Know common spawn peek spots", "Have backup plan if it fails"],
  },
  {
    id: "basement-boys",
    name: "Basement Boys",
    description: "Set up your defense in the basement regardless of actual objective location.",
    side: "defense",
    difficulty: "extreme",
    category: "meme",
    restrictions: ["Defend from basement only"],
  },
  {
    id: "trap-house",
    name: "Trap House",
    description: "Maximum trap operators. Every doorway must have a trap.",
    side: "defense",
    difficulty: "medium",
    category: "tactical",
    restrictions: ["Trap operators only", "Cover all entrances"],
    tips: ["Kapkan, Frost, Lesion, Ela recommended"],
  },
  {
    id: "eco-round",
    name: "Eco Round",
    description: "Cannot use any utility or gadgets. Gun skill only.",
    side: "both",
    difficulty: "hard",
    category: "challenge",
    restrictions: ["No gadgets", "No utility", "Guns only"],
  },
  {
    id: "musical-chairs",
    name: "Musical Chairs",
    description: "Every 30 seconds, all defenders must rotate to a new position.",
    side: "defense",
    difficulty: "extreme",
    category: "fun",
    restrictions: ["Rotate positions every 30 seconds"],
  },

  // Both Sides
  {
    id: "knife-fight",
    name: "Knife Fight",
    description: "First kill must be with melee. After that, guns are allowed.",
    side: "both",
    difficulty: "extreme",
    category: "meme",
    restrictions: ["First kill must be melee"],
  },
  {
    id: "hip-fire-heroes",
    name: "Hip Fire Heroes",
    description: "No aiming down sights allowed. Hip fire only.",
    side: "both",
    difficulty: "hard",
    category: "challenge",
    restrictions: ["No ADS", "Hip fire only"],
    tips: ["Use laser sights", "Get close to enemies"],
  },
  {
    id: "flash-dance",
    name: "Flash Dance",
    description: "Must throw a flash/stun before every engagement.",
    side: "both",
    difficulty: "medium",
    category: "fun",
    restrictions: ["Flash before every fight"],
  },
  {
    id: "follow-the-leader",
    name: "Follow the Leader",
    description: "One player is the leader. Everyone else must follow within 5 meters at all times.",
    side: "both",
    difficulty: "medium",
    category: "teamwork",
    restrictions: ["Stay within 5m of leader", "Leader makes all calls"],
  },
  {
    id: "no-reinforcements",
    name: "Open House",
    description: "No reinforcements allowed. Soft walls only.",
    side: "defense",
    difficulty: "hard",
    category: "challenge",
    restrictions: ["No reinforcing walls"],
  },
  {
    id: "role-reverse",
    name: "Role Reversal",
    description: "Attackers play slow and methodical. Defenders play aggressive and push out.",
    side: "both",
    difficulty: "medium",
    category: "fun",
    restrictions: ["Swap typical playstyles"],
  },
  {
    id: "callout-chaos",
    name: "Callout Chaos",
    description: "All callouts must be made using only colors and shapes. No room names.",
    side: "both",
    difficulty: "hard",
    category: "fun",
    restrictions: ["No proper callouts", "Colors and shapes only"],
  },
  {
    id: "headshots-only",
    name: "Headhunter",
    description: "Only headshot kills count. Body shot kills don't count toward your score.",
    side: "both",
    difficulty: "hard",
    category: "challenge",
    restrictions: ["Headshots only count"],
  },
  {
    id: "grenade-spam",
    name: "Explosive Personality",
    description: "Must use all grenades/C4/impacts before firing your weapon.",
    side: "both",
    difficulty: "medium",
    category: "fun",
    restrictions: ["Use all explosives first"],
  },
  {
    id: "360-kills",
    name: "360 No Scope",
    description: "Before each kill, you must do a 360 spin. Recorded kills only.",
    side: "both",
    difficulty: "extreme",
    category: "meme",
    restrictions: ["360 spin before every kill"],
  },
];

export function getRandomStrategy(side?: "attack" | "defense" | "both"): Strategy {
  let filtered = strategies;

  if (side && side !== "both") {
    filtered = strategies.filter(s => s.side === side || s.side === "both");
  }

  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function getStrategiesBySide(side: "attack" | "defense" | "both"): Strategy[] {
  if (side === "both") return strategies;
  return strategies.filter(s => s.side === side || s.side === "both");
}

export function getStrategiesByDifficulty(difficulty: Strategy["difficulty"]): Strategy[] {
  return strategies.filter(s => s.difficulty === difficulty);
}

export function getStrategiesByCategory(category: Strategy["category"]): Strategy[] {
  return strategies.filter(s => s.category === category);
}
