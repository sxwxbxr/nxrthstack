import { ALL_UNITS, UNIT_LIST } from "./units";
import { ALL_PRESETS, DEFAULT_PRESET_FOR_CLASS } from "./behaviors";
import type { Squad, SquadUnit, BehaviorRule } from "./types";
import type { Rarity } from "./rarities";
import { RARITY_STAT_MULTIPLIER } from "./rarities";
import type { StatsOverrideMap, StatsOverrideEntry } from "./simulation";

// ============================================================================
// Campaign Mode - PvE Bot Generation & Rewards
// ============================================================================

/** Deterministic seeded random for consistent campaign levels */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

interface CampaignConfig {
  unitCount: number;
  rarity: Rarity;
  minLevel: number;
  maxLevel: number;
}

function getCampaignConfig(level: number): CampaignConfig {
  if (level <= 5)  return { unitCount: 2 + Math.min(level - 1, 1), rarity: "common", minLevel: 1, maxLevel: 5 };
  if (level <= 15) return { unitCount: 3 + (level > 10 ? 1 : 0), rarity: "uncommon", minLevel: 5, maxLevel: 15 };
  if (level <= 30) return { unitCount: 4 + (level > 25 ? 1 : 0), rarity: "rare", minLevel: 10, maxLevel: 25 };
  if (level <= 50) return { unitCount: 5, rarity: "epic", minLevel: 20, maxLevel: 40 };
  if (level <= 75) return { unitCount: 5, rarity: "legendary", minLevel: 30, maxLevel: 50 };
  // Infinite scaling: mythic+ with stat multiplier
  return { unitCount: 5, rarity: "mythic", minLevel: 50, maxLevel: 50 + Math.floor((level - 75) / 2) };
}

/** Generate a deterministic bot squad for a campaign level */
export function generateCampaignSquad(level: number): {
  squad: Squad;
  statsOverride: StatsOverrideMap;
  displayInfo: { templateId: string; rarity: Rarity; level: number }[];
} {
  const config = getCampaignConfig(level);
  const rng = seededRandom(level * 7919 + 31337);

  // Pick units deterministically
  const availableUnits = UNIT_LIST;
  const selectedUnits: typeof availableUnits = [];

  for (let i = 0; i < config.unitCount; i++) {
    const idx = Math.floor(rng() * availableUnits.length);
    selectedUnits.push(availableUnits[idx]);
  }

  const units: SquadUnit[] = [];
  const statsOverride: StatsOverrideMap = {};
  const displayInfo: { templateId: string; rarity: Rarity; level: number }[] = [];

  // Deployment rows for defender (campaign bots are always defenders)
  const deployPositions = [
    { x: 1, y: 0 }, { x: 3, y: 0 }, { x: 5, y: 0 }, { x: 7, y: 0 },
    { x: 2, y: 1 }, { x: 4, y: 1 }, { x: 6, y: 1 }, { x: 0, y: 0 },
    { x: 0, y: 1 }, { x: 7, y: 1 },
  ];

  for (let i = 0; i < selectedUnits.length; i++) {
    const template = selectedUnits[i];
    const instanceId = `campaign_${level}_${i}`;
    const unitLevel = Math.floor(
      config.minLevel + rng() * (config.maxLevel - config.minLevel)
    );

    // Get default behavior preset
    const presetId = DEFAULT_PRESET_FOR_CLASS[template.class] ?? "aggressive";
    const preset = ALL_PRESETS[presetId];
    const rules: BehaviorRule[] = preset
      ? preset.rules.map((r, ri) => ({ ...r, id: `campaign_${level}_${i}_${ri}` }))
      : [{ id: `campaign_${level}_${i}_0`, priority: 1, condition: "ALWAYS" as const, action: "ATTACK_NEAREST" as const }];

    // Apply rarity + level stat multiplier
    const rarityMult = RARITY_STAT_MULTIPLIER[config.rarity];
    // Level bonus: +2% per level above 1
    const levelMult = 1 + (unitLevel - 1) * 0.02;
    // Infinite scaling for levels beyond 75
    const scalingMult = level > 75 ? 1 + (level - 75) * 0.03 : 1;
    const totalMult = rarityMult * levelMult * scalingMult;

    const stats: StatsOverrideEntry = {
      maxHp: Math.round(template.maxHp * totalMult),
      attack: Math.round(template.attack * totalMult),
      defense: Math.round(template.defense * totalMult),
      speed: template.speed,
      attackRange: template.attackRange,
      critChance: Math.min(0.5, template.critChance + unitLevel * 0.001),
      critMultiplier: template.critMultiplier,
      perks: [],
    };

    statsOverride[instanceId] = stats;

    units.push({
      templateId: template.id,
      instanceId,
      behaviorRules: rules,
      position: deployPositions[i] ?? { x: i, y: 0 },
    });

    displayInfo.push({
      templateId: template.id,
      rarity: config.rarity,
      level: unitLevel,
    });
  }

  return {
    squad: { units },
    statsOverride,
    displayInfo,
  };
}

/** Calculate currency reward for a campaign level */
export function getCampaignReward(level: number, won: boolean, stars: number): number {
  if (!won) return Math.floor(level * 2); // Small consolation
  const base = 25 + level * 5;
  const starBonus = stars * level * 2;
  return base + starBonus;
}

/** Calculate stars based on battle performance */
export function calculateStars(durationTicks: number, unitsLost: number, maxTicks: number): number {
  const timeRatio = durationTicks / maxTicks;

  if (unitsLost === 0 && timeRatio < 0.5) return 3; // Fast + flawless
  if (unitsLost <= 1 && timeRatio < 0.75) return 2;  // Quick + minimal losses
  return 1; // Won
}

/** Get difficulty label for campaign level */
export function getCampaignDifficulty(level: number): {
  label: string;
  color: string;
} {
  if (level <= 5)  return { label: "Easy", color: "text-green-400" };
  if (level <= 15) return { label: "Normal", color: "text-blue-400" };
  if (level <= 30) return { label: "Hard", color: "text-purple-400" };
  if (level <= 50) return { label: "Expert", color: "text-orange-400" };
  if (level <= 75) return { label: "Master", color: "text-red-400" };
  return { label: "Infinite", color: "text-pink-400" };
}
