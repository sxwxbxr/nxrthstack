"use client";

import { useEffect, useState } from "react";

interface R6StatsConfig {
  lobbyId?: string;
  tournamentId?: string;
  sourceType?: "lobby" | "tournament";
  backgroundColor?: string;
  textColor?: string;
  showKills?: boolean;
}

interface LobbyStats {
  player1Name: string;
  player2Name: string;
  player1Score: number;
  player2Score: number;
  player1Kills: number;
  player1Deaths: number;
  player2Kills: number;
  player2Deaths: number;
}

export function R6StatsOverlay({ config, token }: { config: R6StatsConfig; token: string }) {
  const {
    lobbyId,
    tournamentId,
    sourceType = "lobby",
    backgroundColor = "rgba(0,0,0,0.8)",
    textColor = "#ffffff",
    showKills = true,
  } = config;

  const [stats, setStats] = useState<LobbyStats>({
    player1Name: "Player 1",
    player2Name: "Player 2",
    player1Score: 0,
    player2Score: 0,
    player1Kills: 0,
    player1Deaths: 0,
    player2Kills: 0,
    player2Deaths: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (sourceType === "lobby" && lobbyId) {
          const response = await fetch(`/api/gamehub/overlays/r6-stats?lobbyId=${lobbyId}&token=${token}`);
          if (!response.ok) throw new Error("Failed to fetch stats");
          const data = await response.json();
          setStats(data);
          setError(null);
        } else if (sourceType === "tournament" && tournamentId) {
          const response = await fetch(`/api/gamehub/overlays/r6-stats?tournamentId=${tournamentId}&token=${token}`);
          if (!response.ok) throw new Error("Failed to fetch stats");
          const data = await response.json();
          setStats(data);
          setError(null);
        }
      } catch (err) {
        console.error("Failed to fetch R6 stats:", err);
        setError("Failed to load stats");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [lobbyId, tournamentId, sourceType, token]);

  if (isLoading) {
    return (
      <div
        style={{
          background: backgroundColor,
          color: textColor,
          padding: "16px 32px",
          borderRadius: "12px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: backgroundColor,
          color: textColor,
          padding: "16px 32px",
          borderRadius: "12px",
          fontFamily: "system-ui, sans-serif",
          opacity: 0.6,
        }}
      >
        {error}
      </div>
    );
  }

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
          {stats.player1Name}
        </div>
        <div style={{ fontSize: "48px", fontWeight: "bold" }}>{stats.player1Score}</div>
        {showKills && (
          <div style={{ fontSize: "12px", opacity: 0.6 }}>
            {stats.player1Kills}K / {stats.player1Deaths}D
          </div>
        )}
      </div>

      {/* VS */}
      <div style={{ fontSize: "24px", fontWeight: "bold", opacity: 0.5 }}>VS</div>

      {/* Player 2 */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "14px", opacity: 0.8, marginBottom: "4px" }}>
          {stats.player2Name}
        </div>
        <div style={{ fontSize: "48px", fontWeight: "bold" }}>{stats.player2Score}</div>
        {showKills && (
          <div style={{ fontSize: "12px", opacity: 0.6 }}>
            {stats.player2Kills}K / {stats.player2Deaths}D
          </div>
        )}
      </div>
    </div>
  );
}
