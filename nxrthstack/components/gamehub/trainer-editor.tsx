"use client";

import { useState, useCallback } from "react";
import { Icons } from "@/components/icons";
import {
  type SaveData,
  setTrainerName,
  setMoney,
  setBadges,
  setPlayTime,
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
  const [badges, setBadgesState] = useState(parsedSave.info.badges);
  const [hours, setHours] = useState(parsedSave.info.playTime.hours);
  const [minutes, setMinutes] = useState(parsedSave.info.playTime.minutes);
  const [seconds, setSeconds] = useState(parsedSave.info.playTime.seconds);
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

  const handleToggleBadge = useCallback((badgeIndex: number) => {
    const newBadges = badges ^ (1 << badgeIndex);
    setBadgesState(newBadges);
    const newData = new Uint8Array(saveData);
    setBadges(newData, newBadges, parsedSave.info.generation);
    onDataChange(newData);
  }, [badges, saveData, parsedSave.info.generation, onDataChange]);

  const handleAllBadges = useCallback(() => {
    const allBadges = 0xFF;
    setBadgesState(allBadges);
    const newData = new Uint8Array(saveData);
    setBadges(newData, allBadges, parsedSave.info.generation);
    onDataChange(newData);
  }, [saveData, parsedSave.info.generation, onDataChange]);

  const handleNoBadges = useCallback(() => {
    setBadgesState(0);
    const newData = new Uint8Array(saveData);
    setBadges(newData, 0, parsedSave.info.generation);
    onDataChange(newData);
  }, [saveData, parsedSave.info.generation, onDataChange]);

  const handleSavePlayTime = useCallback(() => {
    setIsSaving(true);
    try {
      const newData = new Uint8Array(saveData);
      setPlayTime(newData, hours, minutes, seconds, parsedSave.info.generation);
      onDataChange(newData);
    } finally {
      setIsSaving(false);
    }
  }, [saveData, hours, minutes, seconds, parsedSave.info.generation, onDataChange]);

  const playTimeChanged =
    hours !== parsedSave.info.playTime.hours ||
    minutes !== parsedSave.info.playTime.minutes ||
    seconds !== parsedSave.info.playTime.seconds;

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
            <div className="flex gap-2">
              <div className="flex-1 flex gap-1 items-center">
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(Math.min(999, Math.max(0, parseInt(e.target.value) || 0)))}
                  min={0}
                  max={999}
                  className="w-16 rounded-lg border border-border bg-background px-2 py-2 text-center text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-muted-foreground">:</span>
                <input
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  min={0}
                  max={59}
                  className="w-14 rounded-lg border border-border bg-background px-2 py-2 text-center text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-muted-foreground">:</span>
                <input
                  type="number"
                  value={seconds}
                  onChange={(e) => setSeconds(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  min={0}
                  max={59}
                  className="w-14 rounded-lg border border-border bg-background px-2 py-2 text-center text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                onClick={handleSavePlayTime}
                disabled={isSaving || !playTimeChanged}
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
              Hours : Minutes : Seconds
            </p>
          </div>
        </div>
      </div>

      {/* Badges Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Icons.CheckCircle className="h-5 w-5 text-primary" />
            Badges
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleAllBadges}
              className="rounded-lg border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              All
            </button>
            <button
              onClick={handleNoBadges}
              className="rounded-lg border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              None
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 8 }, (_, i) => {
            const hasBadge = (badges & (1 << i)) !== 0;
            return (
              <button
                key={i}
                onClick={() => handleToggleBadge(i)}
                className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 transition-colors cursor-pointer hover:scale-105 ${
                  hasBadge
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted text-muted-foreground hover:border-primary/50"
                }`}
                title={`Badge ${i + 1} - Click to toggle`}
              >
                {hasBadge ? (
                  <Icons.Check className="h-6 w-6" />
                ) : (
                  <span className="text-lg font-bold">{i + 1}</span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Click on a badge to toggle it
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
