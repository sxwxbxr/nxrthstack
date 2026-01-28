"use client";

interface R6StatsConfig {
  player1Name?: string;
  player2Name?: string;
  player1Score?: number;
  player2Score?: number;
  player1Kills?: number;
  player1Deaths?: number;
  player2Kills?: number;
  player2Deaths?: number;
  showKills?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

export function R6StatsOverlay({ config }: { config: R6StatsConfig }) {
  const {
    player1Name = "Player 1",
    player2Name = "Player 2",
    player1Score = 0,
    player2Score = 0,
    player1Kills = 0,
    player1Deaths = 0,
    player2Kills = 0,
    player2Deaths = 0,
    showKills = true,
    backgroundColor = "rgba(0,0,0,0.8)",
    textColor = "#ffffff",
  } = config;

  return (
    <div
      style={{
        background: backgroundColor,
        color: textColor,
        padding: "16px 32px",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        gap: "32px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Player 1 */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "14px", opacity: 0.8, marginBottom: "4px" }}>
          {player1Name}
        </div>
        <div style={{ fontSize: "48px", fontWeight: "bold" }}>{player1Score}</div>
        {showKills && (
          <div style={{ fontSize: "12px", opacity: 0.6 }}>
            {player1Kills}K / {player1Deaths}D
          </div>
        )}
      </div>

      {/* VS */}
      <div style={{ fontSize: "24px", fontWeight: "bold", opacity: 0.5 }}>VS</div>

      {/* Player 2 */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "14px", opacity: 0.8, marginBottom: "4px" }}>
          {player2Name}
        </div>
        <div style={{ fontSize: "48px", fontWeight: "bold" }}>{player2Score}</div>
        {showKills && (
          <div style={{ fontSize: "12px", opacity: 0.6 }}>
            {player2Kills}K / {player2Deaths}D
          </div>
        )}
      </div>
    </div>
  );
}
