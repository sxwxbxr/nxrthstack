"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useMcContext } from "@/components/minecraft/mc-context";
import { hasMinRole } from "@/lib/gamehub/minecraft-roles";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface JvmArgs {
  minMemory: string;
  maxMemory: string;
  gcType: string;
  extraFlags: string[];
  rawLine: string;
}

const GC_OPTIONS = [
  { value: "G1GC", label: "G1GC (Recommended)" },
  { value: "ZGC", label: "ZGC (Low latency)" },
  { value: "ShenandoahGC", label: "Shenandoah (Low pause)" },
];

function parseMemoryGB(mem: string): number {
  const match = mem.match(/^(\d+)([GMgm])$/);
  if (!match) return 4;
  const val = parseInt(match[1]);
  return match[2].toUpperCase() === "M" ? val / 1024 : val;
}

function toMemoryString(gb: number): string {
  return `${gb}G`;
}

export function McJvmEditor() {
  const { serverId, userRole } = useMcContext();
  const canEdit = hasMinRole(userRole, "manager");

  const { data, isLoading, error, mutate } = useSWR<{
    found: boolean;
    args: JvmArgs | null;
    scriptName: string | null;
    raw: string | null;
  }>(
    `/api/gamehub/minecraft/server/config/java?serverId=${serverId}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const [minMem, setMinMem] = useState(2);
  const [maxMem, setMaxMem] = useState(4);
  const [gcType, setGcType] = useState("G1GC");
  const [modified, setModified] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.args) {
      setMinMem(parseMemoryGB(data.args.minMemory));
      setMaxMem(parseMemoryGB(data.args.maxMemory));
      setGcType(data.args.gcType);
    }
  }, [data?.args]);

  const handleSave = async () => {
    if (!canEdit || !data?.scriptName || !data?.args) return;
    setSaving(true);

    try {
      await fetch("/api/gamehub/minecraft/server/config/java", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serverId,
          scriptName: data.scriptName,
          args: {
            ...data.args,
            minMemory: toMemoryString(minMem),
            maxMemory: toMemoryString(maxMem),
            gcType,
          },
        }),
      });

      setModified(false);
      mutate();
    } catch {
      // error
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icons.Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.found || !data.args) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Icons.AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          No start script found (start.sh, run.sh, or start.bat).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Memory */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Memory</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Min Memory (Xms)</span>
              <span className="font-medium text-foreground">{minMem} GB</span>
            </div>
            <input
              type="range"
              min={1}
              max={maxMem}
              value={minMem}
              onChange={(e) => {
                setMinMem(Number(e.target.value));
                setModified(true);
              }}
              disabled={!canEdit}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Max Memory (Xmx)</span>
              <span className="font-medium text-foreground">{maxMem} GB</span>
            </div>
            <input
              type="range"
              min={minMem}
              max={24}
              value={maxMem}
              onChange={(e) => {
                setMaxMem(Number(e.target.value));
                setModified(true);
              }}
              disabled={!canEdit}
              className="w-full accent-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Server has 32GB RAM. Recommended max: 12GB for Minecraft.
            </p>
          </div>
        </div>
      </div>

      {/* Garbage Collector */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Garbage Collector
        </h3>
        <div className="space-y-2">
          {GC_OPTIONS.map((gc) => (
            <label
              key={gc.value}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors",
                gcType === gc.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              )}
            >
              <input
                type="radio"
                name="gc"
                value={gc.value}
                checked={gcType === gc.value}
                onChange={() => {
                  setGcType(gc.value);
                  setModified(true);
                }}
                disabled={!canEdit}
                className="accent-primary"
              />
              <span className="text-sm text-foreground">{gc.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Save */}
      {canEdit && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={!modified || saving}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {saving ? (
              <Icons.Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Icons.Save className="h-3.5 w-3.5" />
            )}
            Save JVM Settings
          </button>
        </div>
      )}
    </div>
  );
}
