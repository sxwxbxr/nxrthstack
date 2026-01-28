"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

interface Overlay {
  id: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
  accessToken: string;
  isActive: boolean;
  createdAt: string;
}

interface Lobby {
  id: string;
  name: string;
  status: string;
  host: { name: string } | null;
  opponent: { name: string } | null;
}

interface Tournament {
  id: string;
  name: string;
  status: string;
}

const OVERLAY_TYPES = [
  {
    id: "shiny_counter",
    name: "Shiny Counter",
    description: "Display your current shiny hunt progress",
    icon: "Sparkles",
    defaultConfig: {
      pokemonName: "Pikachu",
      encounters: 0,
      method: "random",
      showOdds: true,
      showEncounters: true,
      backgroundColor: "transparent",
      textColor: "#ffffff",
    },
  },
  {
    id: "r6_stats",
    name: "R6 Stats",
    description: "Show your current R6 match score and K/D",
    icon: "Swords",
    defaultConfig: {
      player1Name: "Player 1",
      player2Name: "Player 2",
      player1Score: 0,
      player2Score: 0,
      showKills: true,
      backgroundColor: "transparent",
      textColor: "#ffffff",
    },
  },
  {
    id: "pokemon_team",
    name: "Pokemon Team",
    description: "Display your current Pokemon team",
    icon: "Users",
    defaultConfig: {
      teamName: "My Team",
      pokemon: [],
      showTypes: true,
      layout: "horizontal",
      backgroundColor: "transparent",
    },
  },
];

export function OverlayConfigurator() {
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [newOverlayName, setNewOverlayName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // R6 Stats specific state
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedLobbyId, setSelectedLobbyId] = useState<string>("");
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  const [r6SourceType, setR6SourceType] = useState<"lobby" | "tournament">("lobby");

  const fetchOverlays = async () => {
    try {
      const response = await fetch("/api/gamehub/overlays");
      const data = await response.json();
      if (data.overlays) {
        setOverlays(data.overlays);
      }
    } catch (error) {
      console.error("Failed to fetch overlays:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLobbies = async () => {
    try {
      const response = await fetch("/api/gamehub/r6/lobbies");
      const data = await response.json();
      if (data.lobbies) {
        setLobbies(data.lobbies);
      }
    } catch (error) {
      console.error("Failed to fetch lobbies:", error);
    }
  };

  const fetchTournaments = async () => {
    try {
      const response = await fetch("/api/gamehub/r6/tournaments");
      const data = await response.json();
      if (data.tournaments) {
        setTournaments(data.tournaments);
      }
    } catch (error) {
      console.error("Failed to fetch tournaments:", error);
    }
  };

  useEffect(() => {
    fetchOverlays();
  }, []);

  // Fetch lobbies/tournaments when R6 Stats is selected
  useEffect(() => {
    if (selectedType === "r6_stats") {
      fetchLobbies();
      fetchTournaments();
    }
  }, [selectedType]);

  const createOverlay = async () => {
    if (!selectedType || !newOverlayName.trim()) return;

    // Validate R6 Stats requires a lobby or tournament selection
    if (selectedType === "r6_stats") {
      if (r6SourceType === "lobby" && !selectedLobbyId) {
        alert("Please select a lobby for the overlay");
        return;
      }
      if (r6SourceType === "tournament" && !selectedTournamentId) {
        alert("Please select a tournament for the overlay");
        return;
      }
    }

    setIsCreating(true);
    try {
      const typeConfig = OVERLAY_TYPES.find((t) => t.id === selectedType);
      let config: Record<string, unknown> = typeConfig?.defaultConfig ? { ...typeConfig.defaultConfig } : {};

      // Add lobby/tournament ID to R6 Stats config
      if (selectedType === "r6_stats") {
        if (r6SourceType === "lobby") {
          config = { ...config, lobbyId: selectedLobbyId, sourceType: "lobby" };
        } else {
          config = { ...config, tournamentId: selectedTournamentId, sourceType: "tournament" };
        }
      }

      const response = await fetch("/api/gamehub/overlays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          name: newOverlayName,
          config,
        }),
      });

      const data = await response.json();
      if (data.overlay) {
        setOverlays([...overlays, data.overlay]);
        setSelectedType(null);
        setNewOverlayName("");
        setSelectedLobbyId("");
        setSelectedTournamentId("");
        setR6SourceType("lobby");
      }
    } catch (error) {
      console.error("Failed to create overlay:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteOverlay = async (id: string) => {
    if (!confirm("Are you sure you want to delete this overlay?")) return;

    try {
      await fetch(`/api/gamehub/overlays?id=${id}`, { method: "DELETE" });
      setOverlays(overlays.filter((o) => o.id !== id));
    } catch (error) {
      console.error("Failed to delete overlay:", error);
    }
  };

  const toggleOverlay = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch("/api/gamehub/overlays", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !isActive }),
      });

      const data = await response.json();
      if (data.overlay) {
        setOverlays(overlays.map((o) => (o.id === id ? data.overlay : o)));
      }
    } catch (error) {
      console.error("Failed to toggle overlay:", error);
    }
  };

  const copyOverlayUrl = (overlay: Overlay) => {
    const url = `${window.location.origin}/overlay/${overlay.type}/${overlay.accessToken}`;
    navigator.clipboard.writeText(url);
    setCopiedId(overlay.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getOverlayType = (typeId: string) => {
    return OVERLAY_TYPES.find((t) => t.id === typeId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Icons.Loader2 className="h-8 w-8 animate-spin text-foreground/60" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create New Overlay */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold mb-4">Create New Overlay</h3>

        {!selectedType ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {OVERLAY_TYPES.map((type) => {
              const IconComponent = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[type.icon] || Icons.Tv;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-all text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <IconComponent className="h-5 w-5 text-primary" />
                    <span className="font-medium text-foreground">{type.name}</span>
                  </div>
                  <p className="text-sm text-foreground/60">{type.description}</p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedType(null)}
                className="p-1 rounded hover:bg-muted"
              >
                <Icons.ChevronLeft className="h-5 w-5" />
              </button>
              <span className="font-medium">
                {getOverlayType(selectedType)?.name}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Overlay Name
              </label>
              <input
                type="text"
                value={newOverlayName}
                onChange={(e) => setNewOverlayName(e.target.value)}
                placeholder="My Stream Overlay"
                className="w-full px-3 py-2 rounded-lg bg-muted border-0 text-foreground placeholder:text-foreground/40"
              />
            </div>

            {/* R6 Stats Source Selection */}
            {selectedType === "r6_stats" && (
              <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Stats Source
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setR6SourceType("lobby")}
                      className={cn(
                        "flex-1 px-3 py-2 text-sm rounded-lg transition-colors",
                        r6SourceType === "lobby"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      )}
                    >
                      1v1 Lobby
                    </button>
                    <button
                      type="button"
                      onClick={() => setR6SourceType("tournament")}
                      className={cn(
                        "flex-1 px-3 py-2 text-sm rounded-lg transition-colors",
                        r6SourceType === "tournament"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      )}
                    >
                      Tournament
                    </button>
                  </div>
                </div>

                {r6SourceType === "lobby" && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      Select Lobby
                    </label>
                    {lobbies.length === 0 ? (
                      <p className="text-sm text-foreground/60">
                        No lobbies found. Create a lobby first in the R6 1v1 Tracker.
                      </p>
                    ) : (
                      <select
                        value={selectedLobbyId}
                        onChange={(e) => setSelectedLobbyId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-muted border-0 text-foreground"
                      >
                        <option value="">Select a lobby...</option>
                        {lobbies.map((lobby) => (
                          <option key={lobby.id} value={lobby.id}>
                            {lobby.name} ({lobby.host?.name || "Unknown"} vs {lobby.opponent?.name || "Waiting..."})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {r6SourceType === "tournament" && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      Select Tournament
                    </label>
                    {tournaments.length === 0 ? (
                      <p className="text-sm text-foreground/60">
                        No tournaments found. Join or create a tournament first.
                      </p>
                    ) : (
                      <select
                        value={selectedTournamentId}
                        onChange={(e) => setSelectedTournamentId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-muted border-0 text-foreground"
                      >
                        <option value="">Select a tournament...</option>
                        {tournaments.map((tournament) => (
                          <option key={tournament.id} value={tournament.id}>
                            {tournament.name} ({tournament.status})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                <p className="text-xs text-foreground/60">
                  The overlay will automatically update with live stats from the selected {r6SourceType}.
                </p>
              </div>
            )}

            <button
              onClick={createOverlay}
              disabled={!newOverlayName.trim() || isCreating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isCreating ? (
                <Icons.Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icons.Plus className="h-4 w-4" />
              )}
              Create Overlay
            </button>
          </div>
        )}
      </div>

      {/* Existing Overlays */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold mb-4">Your Overlays</h3>

        {overlays.length === 0 ? (
          <div className="text-center py-8 text-foreground/60">
            <Icons.Tv className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No overlays created yet</p>
            <p className="text-sm">Create one above to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {overlays.map((overlay) => {
              const type = getOverlayType(overlay.type);
              const IconComponent = type
                ? (Icons as Record<string, React.ComponentType<{ className?: string }>>)[type.icon] || Icons.Tv
                : Icons.Tv;

              return (
                <div
                  key={overlay.id}
                  className={cn(
                    "p-4 rounded-lg border transition-all",
                    overlay.isActive
                      ? "border-border bg-muted/30"
                      : "border-border/50 bg-muted/10 opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-medium text-foreground">{overlay.name}</h4>
                        <p className="text-sm text-foreground/60">
                          {type?.name || overlay.type}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleOverlay(overlay.id, overlay.isActive)}
                        className={cn(
                          "px-3 py-1 text-xs rounded-full transition-colors",
                          overlay.isActive
                            ? "bg-green-500/10 text-green-500"
                            : "bg-muted text-foreground/60"
                        )}
                      >
                        {overlay.isActive ? "Active" : "Disabled"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/overlay/${overlay.type}/${overlay.accessToken}`}
                      className="flex-1 px-3 py-2 text-sm rounded-lg bg-muted/50 border-0 text-foreground/60"
                    />
                    <button
                      onClick={() => copyOverlayUrl(overlay)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      {copiedId === overlay.id ? (
                        <>
                          <Icons.Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Icons.Copy className="h-4 w-4" />
                          Copy URL
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => deleteOverlay(overlay.id)}
                      className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Icons.Trash className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-foreground/60">
                    Add this URL as a Browser Source in OBS (recommended: 400x200)
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Icons.HelpCircle className="h-5 w-5 text-primary" />
          How to Use
        </h3>
        <ol className="space-y-3 text-sm text-foreground/60">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
              1
            </span>
            <span>Create an overlay above and copy the URL</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
              2
            </span>
            <span>In OBS, add a new Browser Source</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
              3
            </span>
            <span>Paste the overlay URL and set dimensions (400x200 recommended)</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
              4
            </span>
            <span>The overlay will update automatically when you make changes in GameHub</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
