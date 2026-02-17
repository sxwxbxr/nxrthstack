import type { RatingChange } from "./types";

// ============================================================================
// Elo / Glicko-1 Simplified Rating System
// ============================================================================

const K_FACTOR = 32;
const ATTACKER_ADVANTAGE = 50; // virtual rating boost for defender in expectation

/**
 * Calculate expected win probability for player A vs player B.
 */
function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate rating changes after a match.
 * Attacker advantage: defender gets a virtual +50 rating boost in the
 * expectation calc, so attackers need to be slightly better to be expected
 * to win. This makes ~55% attacker win rate feel fair in rating terms.
 */
export function calculateRatingChange(
  attackerRating: number,
  defenderRating: number,
  attackerWon: boolean
): RatingChange {
  // Attacker's expected score (defender has virtual advantage)
  const attackerExpected = expectedScore(
    attackerRating,
    defenderRating + ATTACKER_ADVANTAGE
  );

  const attackerActual = attackerWon ? 1 : 0;
  const defenderActual = attackerWon ? 0 : 1;

  // Defender's expected score (symmetric)
  const defenderExpected = 1 - attackerExpected;

  const attackerChange = Math.round(K_FACTOR * (attackerActual - attackerExpected));
  const defenderChange = Math.round(K_FACTOR * (defenderActual - defenderExpected));

  return { attackerChange, defenderChange };
}

/**
 * Currency rewards for match outcome.
 */
export function calculateCurrencyReward(
  attackerWon: boolean,
  isAttacker: boolean
): number {
  if (isAttacker) {
    return attackerWon ? 75 : 20;
  }
  // Defender gets passive rewards for successful defense
  return attackerWon ? 10 : 40;
}
