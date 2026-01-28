"use client";

interface ShinyCounterConfig {
  pokemonName?: string;
  encounters?: number;
  method?: string;
  showOdds?: boolean;
  showEncounters?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

const SHINY_ODDS: Record<string, number> = {
  random: 4096,
  masuda: 683,
  sos: 315,
  chain: 99,
  radar: 99,
  friend_safari: 585,
  horde: 4096,
};

export function ShinyCounterOverlay({ config }: { config: ShinyCounterConfig }) {
  const {
    pokemonName = "Pokemon",
    encounters = 0,
    method = "random",
    showOdds = true,
    showEncounters = true,
    backgroundColor = "transparent",
    textColor = "#ffffff",
  } = config;

  const odds = SHINY_ODDS[method] || 4096;
  const probability = encounters > 0 ? (1 - Math.pow(1 - 1/odds, encounters)) * 100 : 0;

  return (
    <div
      style={{
        background: backgroundColor,
        color: textColor,
        padding: "16px 24px",
        borderRadius: "12px",
        display: "inline-flex",
        flexDirection: "column",
        gap: "8px",
        minWidth: "200px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "24px" }}>✨</span>
        <span style={{ fontSize: "18px", fontWeight: "bold" }}>
          Shiny Hunt: {pokemonName}
        </span>
      </div>

      {showEncounters && (
        <div style={{ fontSize: "32px", fontWeight: "bold", textAlign: "center" }}>
          {encounters.toLocaleString()} encounters
        </div>
      )}

      {showOdds && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", opacity: 0.8 }}>
          <span>Odds: 1/{odds}</span>
          <span>{probability.toFixed(1)}% chance</span>
        </div>
      )}
    </div>
  );
}
