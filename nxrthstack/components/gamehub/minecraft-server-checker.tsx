"use client";

import { useState, useEffect, useCallback } from "react";
import { Icons } from "@/components/icons";
import { ShimmerButton } from "@/components/ui/shimmer-button";

interface ServerStatus {
  online: boolean;
  host: string;
  port: number;
  version?: {
    name: string;
    protocol: number;
  };
  players?: {
    online: number;
    max: number;
    list?: string[];
  };
  motd?: {
    clean: string[];
    html: string[];
  };
  icon?: string;
  mods?: {
    type: string;
    list: { name: string; version: string }[];
  };
  software?: string;
  plugins?: { name: string; version: string }[];
  gamemode?: string;
  serverid?: string;
  eula_blocked?: boolean;
  error?: string;
}

interface SavedServer {
  address: string;
  name: string;
  lastChecked?: string;
  lastStatus?: "online" | "offline";
}

const STORAGE_KEY = "minecraft-saved-servers";
const POPULAR_SERVERS = [
  { address: "mc.hypixel.net", name: "Hypixel" },
  { address: "cubecraft.net", name: "CubeCraft" },
  { address: "mineplex.com", name: "Mineplex" },
  { address: "play.hivemc.com", name: "The Hive" },
];

export function MinecraftServerChecker() {
  const [serverAddress, setServerAddress] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedServers, setSavedServers] = useState<SavedServer[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  // Load saved servers from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSavedServers(JSON.parse(saved));
      } catch {
        // Invalid data, ignore
      }
    }
  }, []);

  // Save servers to localStorage
  const saveServers = useCallback((servers: SavedServer[]) => {
    setSavedServers(servers);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(servers));
  }, []);

  // Check server status
  const checkServer = async (address: string) => {
    if (!address.trim()) return;

    setIsChecking(true);
    setError(null);
    setStatus(null);

    try {
      // Parse address for potential port
      let host = address.trim();
      let port = 25565;

      if (host.includes(":")) {
        const parts = host.split(":");
        host = parts[0];
        port = parseInt(parts[1]) || 25565;
      }

      // Use the mcsrvstat.us API (free, no auth required)
      const response = await fetch(
        `https://api.mcsrvstat.us/3/${encodeURIComponent(host)}${port !== 25565 ? `:${port}` : ""}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch server status");
      }

      const data = await response.json();

      setStatus({
        online: data.online || false,
        host: data.hostname || host,
        port: data.port || port,
        version: data.version
          ? { name: data.version, protocol: data.protocol || 0 }
          : undefined,
        players: data.players
          ? {
              online: data.players.online || 0,
              max: data.players.max || 0,
              list: data.players.list || [],
            }
          : undefined,
        motd: data.motd
          ? {
              clean: data.motd.clean || [],
              html: data.motd.html || [],
            }
          : undefined,
        icon: data.icon,
        software: data.software,
        gamemode: data.gamemode,
        eula_blocked: data.eula_blocked,
      });

      // Update saved server status if it exists
      const existingIndex = savedServers.findIndex(
        (s) => s.address.toLowerCase() === address.toLowerCase()
      );
      if (existingIndex >= 0) {
        const updated = [...savedServers];
        updated[existingIndex] = {
          ...updated[existingIndex],
          lastChecked: new Date().toISOString(),
          lastStatus: data.online ? "online" : "offline",
        };
        saveServers(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check server");
      setStatus(null);
    } finally {
      setIsChecking(false);
    }
  };

  // Save current server
  const saveCurrentServer = () => {
    if (!serverAddress.trim()) return;

    const exists = savedServers.some(
      (s) => s.address.toLowerCase() === serverAddress.toLowerCase()
    );
    if (exists) return;

    const newServer: SavedServer = {
      address: serverAddress.trim(),
      name: serverAddress.trim().split(".")[0] || serverAddress.trim(),
      lastChecked: status ? new Date().toISOString() : undefined,
      lastStatus: status?.online ? "online" : undefined,
    };

    saveServers([newServer, ...savedServers]);
  };

  // Remove saved server
  const removeSavedServer = (address: string) => {
    saveServers(savedServers.filter((s) => s.address !== address));
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkServer(serverAddress);
  };

  // Quick check a server
  const quickCheck = (address: string) => {
    setServerAddress(address);
    checkServer(address);
  };

  return (
    <div className="space-y-6">
      {/* Server Input */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Check Server Status
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Server Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={serverAddress}
                onChange={(e) => setServerAddress(e.target.value)}
                placeholder="e.g., mc.hypixel.net or play.example.com:25566"
                className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <ShimmerButton
                type="submit"
                disabled={isChecking || !serverAddress.trim()}
              >
                {isChecking ? (
                  <Icons.Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icons.Search className="h-4 w-4" />
                )}
              </ShimmerButton>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Enter a Minecraft Java Edition server address. Include port if not
              default (25565).
            </p>
          </div>
        </form>
      </div>

      {/* Server Status Result */}
      {status && (
        <div
          className={`rounded-xl border p-6 ${
            status.online
              ? "border-green-500/50 bg-green-500/5"
              : "border-red-500/50 bg-red-500/5"
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* Server Icon */}
              {status.icon ? (
                <img
                  src={status.icon}
                  alt="Server icon"
                  className="h-16 w-16 rounded-lg"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                  <Icons.Server className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-foreground">
                    {status.host}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      status.online
                        ? "bg-green-500/20 text-green-500"
                        : "bg-red-500/20 text-red-500"
                    }`}
                  >
                    {status.online ? (
                      <>
                        <Icons.Wifi className="h-3 w-3" />
                        Online
                      </>
                    ) : (
                      <>
                        <Icons.WifiOff className="h-3 w-3" />
                        Offline
                      </>
                    )}
                  </span>
                </div>
                {status.version && (
                  <p className="text-sm text-muted-foreground">
                    Version: {status.version.name}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={saveCurrentServer}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
              title="Save server"
            >
              <Icons.Star className="h-4 w-4" />
            </button>
          </div>

          {status.online && (
            <>
              {/* MOTD */}
              {status.motd && status.motd.clean.length > 0 && (
                <div className="mb-4 rounded-lg bg-black/20 p-3">
                  {status.motd.clean.map((line, i) => (
                    <p key={i} className="text-sm text-foreground font-mono">
                      {line}
                    </p>
                  ))}
                </div>
              )}

              {/* Players */}
              {status.players && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      Players
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {status.players.online} / {status.players.max}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(100, (status.players.online / status.players.max) * 100)}%`,
                      }}
                    />
                  </div>
                  {status.players.list && status.players.list.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {status.players.list.slice(0, 20).map((player, i) => (
                        <span
                          key={i}
                          className="rounded bg-muted px-2 py-0.5 text-xs text-foreground"
                        >
                          {player}
                        </span>
                      ))}
                      {status.players.list.length > 20 && (
                        <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          +{status.players.list.length - 20} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Server Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {status.software && (
                  <div>
                    <p className="text-muted-foreground">Software</p>
                    <p className="font-medium text-foreground">
                      {status.software}
                    </p>
                  </div>
                )}
                {status.gamemode && (
                  <div>
                    <p className="text-muted-foreground">Gamemode</p>
                    <p className="font-medium text-foreground">
                      {status.gamemode}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Port</p>
                  <p className="font-medium text-foreground">{status.port}</p>
                </div>
                {status.eula_blocked && (
                  <div className="col-span-2">
                    <p className="text-red-500 text-xs">
                      This server has been blocked by Mojang for EULA violations
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="rounded-xl border border-red-500/50 bg-red-500/5 p-4">
          <div className="flex items-center gap-2 text-red-500">
            <Icons.AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Popular Servers */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Popular Servers
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {POPULAR_SERVERS.map((server) => (
            <button
              key={server.address}
              onClick={() => quickCheck(server.address)}
              disabled={isChecking}
              className="rounded-lg border border-border bg-background p-3 text-left hover:border-primary hover:bg-accent transition-colors disabled:opacity-50"
            >
              <p className="font-medium text-foreground text-sm">
                {server.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {server.address}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Saved Servers */}
      {savedServers.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <button
            onClick={() => setShowSaved(!showSaved)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-lg font-semibold text-foreground">
              Saved Servers ({savedServers.length})
            </h3>
            <Icons.ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform ${showSaved ? "rotate-180" : ""}`}
            />
          </button>

          {showSaved && (
            <div className="mt-4 space-y-2">
              {savedServers.map((server) => (
                <div
                  key={server.address}
                  className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">
                        {server.name}
                      </p>
                      {server.lastStatus && (
                        <span
                          className={`h-2 w-2 rounded-full ${
                            server.lastStatus === "online"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {server.address}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => quickCheck(server.address)}
                      disabled={isChecking}
                      className="rounded px-2 py-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
                    >
                      Check
                    </button>
                    <button
                      onClick={() => removeSavedServer(server.address)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Icons.Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info Note */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <Icons.Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p>
              This tool checks Java Edition servers only. Bedrock Edition
              servers use a different protocol and are not currently supported.
            </p>
            <p className="mt-1">
              Server data is provided by{" "}
              <a
                href="https://mcsrvstat.us"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                mcsrvstat.us
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
