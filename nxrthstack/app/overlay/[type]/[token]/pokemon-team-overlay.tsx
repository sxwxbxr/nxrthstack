"use client";

interface PokemonSlot {
  name: string;
  sprite?: string;
  types?: string[];
}

interface PokemonTeamConfig {
  teamName?: string;
  pokemon?: PokemonSlot[];
  showTypes?: boolean;
  layout?: "horizontal" | "vertical";
  backgroundColor?: string;
}

const TYPE_COLORS: Record<string, string> = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  grass: "#78C850",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
};

export function PokemonTeamOverlay({ config }: { config: PokemonTeamConfig }) {
  const {
    teamName = "My Team",
    pokemon = [],
    showTypes = true,
    layout = "horizontal",
    backgroundColor = "rgba(0,0,0,0.8)",
  } = config;

  const emptySlots = 6 - pokemon.length;

  return (
    <div
      style={{
        background: backgroundColor,
        padding: "16px",
        borderRadius: "12px",
        color: "#ffffff",
      }}
    >
      {teamName && (
        <div
          style={{
            fontSize: "14px",
            fontWeight: "bold",
            marginBottom: "12px",
            textAlign: "center",
          }}
        >
          {teamName}
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: layout === "horizontal" ? "row" : "column",
          gap: "8px",
          justifyContent: "center",
        }}
      >
        {pokemon.map((slot, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              padding: "8px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "8px",
              minWidth: "60px",
            }}
          >
            {slot.sprite ? (
              <img
                src={slot.sprite}
                alt={slot.name}
                style={{ width: "48px", height: "48px", imageRendering: "pixelated" }}
              />
            ) : (
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                }}
              >
                ?
              </div>
            )}
            <div style={{ fontSize: "10px", textAlign: "center" }}>{slot.name}</div>
            {showTypes && slot.types && (
              <div style={{ display: "flex", gap: "2px" }}>
                {slot.types.map((type) => (
                  <div
                    key={type}
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: TYPE_COLORS[type.toLowerCase()] || "#888",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <div
            key={`empty-${index}`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "8px",
              minWidth: "60px",
              minHeight: "80px",
              opacity: 0.3,
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                border: "2px dashed rgba(255,255,255,0.3)",
                borderRadius: "50%",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
