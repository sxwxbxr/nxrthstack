"use client";

import { useState, useCallback } from "react";
import { Icons } from "@/components/icons";
import {
  type SaveData,
  setTrainerName,
  setMoney,
} from "@/lib/pokemon/save-detector";

interface TrainerEditorProps {
  saveData: Uint8Array;
  parsedSave: SaveData;
  onDataChange: (newData: Uint8Array) => void;
}

export function TrainerEditor({
  saveData,
  parsedSave,
  onDataChange,
}: TrainerEditorProps) {
  const [trainerName, setTrainerNameState] = useState(parsedSave.info.trainerName);
  const [money, setMoneyState] = useState(parsedSave.info.money);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveTrainerName = useCallback(() => {
    setIsSaving(true);
    try {
      const newData = new Uint8Array(saveData);
      setTrainerName(newData, trainerName, parsedSave.info.generation);
      onDataChange(newData);
    } finally {
      setIsSaving(false);
    }
  }, [saveData, trainerName, parsedSave.info.generation, onDataChange]);

  const handleSaveMoney = useCallback(() => {
    setIsSaving(true);
    try {
      const newData = new Uint8Array(saveData);
      setMoney(newData, money, parsedSave.info.generation);
      onDataChange(newData);
    } finally {
      setIsSaving(false);
    }
  }, [saveData, money, parsedSave.info.generation, onDataChange]);

  const handleMaxMoney = useCallback(() => {
    const maxMoney = parsedSave.info.generation === 3 ? 999999 : 999999;
    setMoneyState(maxMoney);
  }, [parsedSave.info.generation]);

  return (
    <div className="space-y-6">
      {/* Trainer Info Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Icons.User className="h-5 w-5 text-primary" />
          Trainer Information
        </h3>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Trainer Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Trainer Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={trainerName}
                onChange={(e) => setTrainerNameState(e.target.value)}
                maxLength={parsedSave.info.generation === 3 ? 7 : 10}
                className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={handleSaveTrainerName}
                disabled={isSaving || trainerName === parsedSave.info.trainerName}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving ? (
                  <Icons.Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Apply"
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Max {parsedSave.info.generation === 3 ? 7 : 10} characters
            </p>
          </div>

          {/* Trainer ID */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Trainer ID
            </label>
            <input
              type="text"
              value={parsedSave.info.trainerId.toString().padStart(5, "0")}
              disabled
              className="w-full rounded-lg border border-border bg-muted px-4 py-2 text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Trainer ID cannot be changed
            </p>
          </div>

          {/* Money */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Money
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ₽
                </span>
                <input
                  type="number"
                  value={money}
                  onChange={(e) => setMoneyState(Math.min(999999, Math.max(0, parseInt(e.target.value) || 0)))}
                  min={0}
                  max={999999}
                  className="w-full rounded-lg border border-border bg-background pl-8 pr-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                onClick={handleMaxMoney}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                Max
              </button>
              <button
                onClick={handleSaveMoney}
                disabled={isSaving || money === parsedSave.info.money}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving ? (
                  <Icons.Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Apply"
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Max ₽999,999
            </p>
          </div>

          {/* Play Time */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Play Time
            </label>
            <input
              type="text"
              value={`${parsedSave.info.playTime.hours}:${parsedSave.info.playTime.minutes.toString().padStart(2, "0")}:${parsedSave.info.playTime.seconds.toString().padStart(2, "0")}`}
              disabled
              className="w-full rounded-lg border border-border bg-muted px-4 py-2 text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Play time editing coming soon
            </p>
          </div>
        </div>
      </div>

      {/* Badges Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Icons.CheckCircle className="h-5 w-5 text-primary" />
          Badges
        </h3>

        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 8 }, (_, i) => {
            const hasBadge = (parsedSave.info.badges & (1 << i)) !== 0;
            return (
              <div
                key={i}
                className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 transition-colors ${
                  hasBadge
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted text-muted-foreground"
                }`}
                title={`Badge ${i + 1}`}
              >
                {hasBadge ? (
                  <Icons.Check className="h-6 w-6" />
                ) : (
                  <span className="text-lg font-bold">{i + 1}</span>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Badge editing coming soon
        </p>
      </div>

      {/* Game Info Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Icons.Info className="h-5 w-5 text-primary" />
          Save Information
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Game</p>
            <p className="font-medium text-foreground">{parsedSave.info.game}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Generation</p>
            <p className="font-medium text-foreground">Gen {parsedSave.info.generation}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Platform</p>
            <p className="font-medium text-foreground">{parsedSave.info.platform}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">File Size</p>
            <p className="font-medium text-foreground">
              {(parsedSave.info.fileSize / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
