import type { UnitClass, StatType } from "./types";

// ============================================================================
// Unit Level Milestones — Stat bonuses & combat perks at key levels
// ============================================================================

export interface MilestoneBonus {
  stat: StatType;
  value: number;
}

export interface MilestoneEntry {
  level: number;
  title: string;
  bonuses: MilestoneBonus[];
  perk?: string;
  perkDescription?: string;
}

const MILESTONES: Record<UnitClass, MilestoneEntry[]> = {
  Tank: [
    {
      level: 10,
      title: "Trained",
      bonuses: [
        { stat: "hp", value: 10 },
        { stat: "defense", value: 2 },
      ],
    },
    {
      level: 25,
      title: "Veteran",
      bonuses: [
        { stat: "hp", value: 20 },
        { stat: "defense", value: 5 },
      ],
      perk: "thorns",
      perkDescription: "Reflect 15% of melee damage back to attacker",
    },
    {
      level: 50,
      title: "Elite",
      bonuses: [
        { stat: "hp", value: 30 },
        { stat: "defense", value: 8 },
      ],
      perk: "fortify",
      perkDescription: "Take 20% less damage when below 50% HP",
    },
  ],
  Ranger: [
    {
      level: 10,
      title: "Trained",
      bonuses: [
        { stat: "attack", value: 3 },
        { stat: "critChance", value: 2 },
      ],
    },
    {
      level: 25,
      title: "Veteran",
      bonuses: [
        { stat: "attack", value: 5 },
        { stat: "critChance", value: 5 },
      ],
      perk: "piercing",
      perkDescription: "Attacks ignore 25% of target's defense",
    },
    {
      level: 50,
      title: "Elite",
      bonuses: [
        { stat: "attack", value: 8 },
        { stat: "critChance", value: 8 },
      ],
      perk: "headshot",
      perkDescription: "Critical hits deal +50% bonus damage",
    },
  ],
  Healer: [
    {
      level: 10,
      title: "Trained",
      bonuses: [
        { stat: "hp", value: 8 },
        { stat: "speed", value: 1 },
      ],
    },
    {
      level: 25,
      title: "Veteran",
      bonuses: [
        { stat: "hp", value: 15 },
        { stat: "speed", value: 2 },
      ],
      perk: "overheal",
      perkDescription: "Healing can exceed max HP by 10%",
    },
    {
      level: 50,
      title: "Elite",
      bonuses: [
        { stat: "hp", value: 20 },
        { stat: "speed", value: 3 },
      ],
      perk: "aura",
      perkDescription: "Nearby allies (2 tiles) regenerate 2 HP per tick",
    },
  ],
  Assassin: [
    {
      level: 10,
      title: "Trained",
      bonuses: [
        { stat: "attack", value: 3 },
        { stat: "speed", value: 1 },
      ],
    },
    {
      level: 25,
      title: "Veteran",
      bonuses: [
        { stat: "attack", value: 5 },
        { stat: "speed", value: 2 },
      ],
      perk: "first_strike",
      perkDescription: "First attack deals 1.5x damage",
    },
    {
      level: 50,
      title: "Elite",
      bonuses: [
        { stat: "attack", value: 8 },
        { stat: "speed", value: 3 },
      ],
      perk: "shadow_step",
      perkDescription: "First move teleports directly to target",
    },
  ],
  Mage: [
    {
      level: 10,
      title: "Trained",
      bonuses: [
        { stat: "attack", value: 3 },
        { stat: "critDamage", value: 3 },
      ],
    },
    {
      level: 25,
      title: "Veteran",
      bonuses: [
        { stat: "attack", value: 6 },
        { stat: "critDamage", value: 5 },
      ],
      perk: "spell_pierce",
      perkDescription: "Attacks ignore 50% of target's defense",
    },
    {
      level: 50,
      title: "Elite",
      bonuses: [
        { stat: "attack", value: 10 },
        { stat: "critDamage", value: 8 },
      ],
      perk: "arcane_mastery",
      perkDescription: "Abilities deal 25% more damage",
    },
  ],
  Paladin: [
    {
      level: 10,
      title: "Trained",
      bonuses: [
        { stat: "hp", value: 10 },
        { stat: "defense", value: 2 },
      ],
    },
    {
      level: 25,
      title: "Veteran",
      bonuses: [
        { stat: "hp", value: 15 },
        { stat: "defense", value: 4 },
      ],
      perk: "divine_shield",
      perkDescription: "Absorb the first hit in each battle (negate all damage)",
    },
    {
      level: 50,
      title: "Elite",
      bonuses: [
        { stat: "hp", value: 25 },
        { stat: "defense", value: 6 },
      ],
      perk: "blessed_aura",
      perkDescription: "Nearby allies (2 tiles) take 10% less damage",
    },
  ],
  Berserker: [
    {
      level: 10,
      title: "Trained",
      bonuses: [
        { stat: "attack", value: 3 },
        { stat: "hp", value: 5 },
      ],
    },
    {
      level: 25,
      title: "Veteran",
      bonuses: [
        { stat: "attack", value: 6 },
        { stat: "hp", value: 10 },
      ],
      perk: "blood_rage",
      perkDescription: "Deal 30% more damage when below 30% HP",
    },
    {
      level: 50,
      title: "Elite",
      bonuses: [
        { stat: "attack", value: 10 },
        { stat: "hp", value: 15 },
      ],
      perk: "last_stand",
      perkDescription: "Survive one lethal hit with 1 HP (once per battle)",
    },
  ],
};

/** Get cumulative flat stat bonuses for a unit at a given level */
export function getMilestoneStats(
  unitClass: UnitClass,
  level: number
): Record<StatType, number> {
  const result: Record<string, number> = {
    hp: 0,
    attack: 0,
    defense: 0,
    speed: 0,
    critChance: 0,
    critDamage: 0,
  };

  const milestones = MILESTONES[unitClass] ?? [];
  for (const m of milestones) {
    if (level >= m.level) {
      for (const b of m.bonuses) {
        result[b.stat] = (result[b.stat] ?? 0) + b.value;
      }
    }
  }

  return result as Record<StatType, number>;
}

/** Get active combat perks for a unit at a given level */
export function getMilestonePerks(
  unitClass: UnitClass,
  level: number
): string[] {
  const perks: string[] = [];
  const milestones = MILESTONES[unitClass] ?? [];
  for (const m of milestones) {
    if (level >= m.level && m.perk) {
      perks.push(m.perk);
    }
  }
  return perks;
}

/** Get all milestone entries for a class (for UI display) */
export function getMilestoneEntries(unitClass: UnitClass): MilestoneEntry[] {
  return MILESTONES[unitClass] ?? [];
}
