"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Icons } from "@/components/icons";
import { SaveUploader } from "./save-uploader";
import { TrainerEditor } from "./trainer-editor";
import { PartyEditor } from "./party-editor";
import { InventoryEditor } from "./inventory-editor";
import { SaveDownloadButton } from "./save-download-button";
import { NewSaveCreator } from "./new-save-creator";
import {
  detectSave,
  parseSave,
  GAME_TEMPLATES,
  type SaveInfo,
  type SaveData,
} from "@/lib/pokemon/save-detector";

type TabId = "trainer" | "party" | "boxes" | "inventory" | "pokedex";
type ViewMode = "upload" | "create" | "edit";

export function SaveEditorClient() {
  const [saveData, setSaveData] = useState<Uint8Array | null>(null);
  const [parsedSave, setParsedSave] = useState<SaveData | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("trainer");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("upload");

  const handleSaveLoaded = useCallback((data: Uint8Array, fileName: string) => {
    setError(null);
    setIsProcessing(true);

    try {
      const parsed = parseSave(data);
      if (parsed) {
        setSaveData(data);
        setParsedSave(parsed);
        setHasChanges(false);
        setActiveTab("trainer");
        setViewMode("edit");
      } else {
        setError(
          "Could not parse save file. Make sure you're using a supported Gen 1-3 Pokemon save file."
        );
        setSaveData(null);
        setParsedSave(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process save file"
      );
      setSaveData(null);
      setParsedSave(null);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleNewSaveCreated = useCallback((data: Uint8Array, gameId: string) => {
    setError(null);
    try {
      const parsed = parseSave(data);
      if (parsed) {
        setSaveData(data);
        setParsedSave(parsed);
        setHasChanges(true); // Mark as changed since it's a new file
        setActiveTab("trainer");
        setViewMode("edit");
      } else {
        setError("Failed to parse created save file");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create save file"
      );
    }
  }, []);

  const handleReset = useCallback(() => {
    setSaveData(null);
    setParsedSave(null);
    setError(null);
    setActiveTab("trainer");
    setHasChanges(false);
    setViewMode("upload");
  }, []);

  const handleDataChange = useCallback(
    (newData: Uint8Array) => {
      setSaveData(newData);
      // Re-parse to update UI
      const newParsed = parseSave(newData);
      if (newParsed) {
        setParsedSave(newParsed);
      }
      setHasChanges(true);
    },
    []
  );

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    {
      id: "trainer",
      label: "Trainer",
      icon: <Icons.User className="h-4 w-4" />,
    },
    {
      id: "party",
      label: "Party",
      icon: <Icons.Users className="h-4 w-4" />,
    },
    {
      id: "boxes",
      label: "PC Boxes",
      icon: <Icons.Package className="h-4 w-4" />,
    },
    {
      id: "inventory",
      label: "Inventory",
      icon: <Icons.ShoppingBag className="h-4 w-4" />,
    },
    {
      id: "pokedex",
      label: "Pokedex",
      icon: <Icons.FileText className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Upload/Create Mode */}
      {viewMode === "upload" && (
        <div className="space-y-6">
          {/* Mode Selection */}
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => setViewMode("upload")}
              className="flex-1 min-w-[200px] rounded-xl border-2 border-primary bg-primary/5 p-6 text-left"
            >
              <Icons.Upload className="h-8 w-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold text-foreground">Upload Existing Save</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Load and edit a save file from your computer
              </p>
            </button>
            <button
              onClick={() => setViewMode("create")}
              className="flex-1 min-w-[200px] rounded-xl border border-border bg-card p-6 text-left hover:border-primary/50 transition-colors"
            >
              <Icons.Plus className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold text-foreground">Create New Save</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create a fresh save file from scratch
              </p>
            </button>
          </div>

          <SaveUploader
            onSaveLoaded={handleSaveLoaded}
            isProcessing={isProcessing}
          />
        </div>
      )}

      {/* Create New Save Mode */}
      {viewMode === "create" && (
        <div className="space-y-6">
          {/* Mode Selection */}
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => setViewMode("upload")}
              className="flex-1 min-w-[200px] rounded-xl border border-border bg-card p-6 text-left hover:border-primary/50 transition-colors"
            >
              <Icons.Upload className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold text-foreground">Upload Existing Save</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Load and edit a save file from your computer
              </p>
            </button>
            <button
              onClick={() => setViewMode("create")}
              className="flex-1 min-w-[200px] rounded-xl border-2 border-primary bg-primary/5 p-6 text-left"
            >
              <Icons.Plus className="h-8 w-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold text-foreground">Create New Save</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create a fresh save file from scratch
              </p>
            </button>
          </div>

          <NewSaveCreator
            onSaveCreated={handleNewSaveCreated}
            onCancel={() => setViewMode("upload")}
          />
        </div>
      )}

      {/* Edit Mode - Loaded Save */}
      {viewMode === "edit" && saveData && (
        <>
          {/* Loaded Save Header */}
          <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <Icons.FileText className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {parsedSave?.info.trainerName}&apos;s Save
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {parsedSave?.info.game} • Gen {parsedSave?.info.generation} •{" "}
                    {parsedSave?.info.platform}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {hasChanges && (
                  <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-500">
                    Unsaved Changes
                  </span>
                )}
                <SaveDownloadButton
                  saveData={saveData}
                  saveInfo={parsedSave!.info}
                  hasChanges={hasChanges}
                />
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <Icons.Close className="h-4 w-4" />
                  Close Save
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-lg bg-background/50 p-3">
                <p className="text-xs text-muted-foreground">Trainer ID</p>
                <p className="text-lg font-semibold text-foreground">
                  {parsedSave?.info.trainerId.toString().padStart(5, "0")}
                </p>
              </div>
              <div className="rounded-lg bg-background/50 p-3">
                <p className="text-xs text-muted-foreground">Money</p>
                <p className="text-lg font-semibold text-foreground">
                  ₽{parsedSave?.info.money.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-background/50 p-3">
                <p className="text-xs text-muted-foreground">Badges</p>
                <p className="text-lg font-semibold text-foreground">
                  {parsedSave?.info.badges}/8
                </p>
              </div>
              <div className="rounded-lg bg-background/50 p-3">
                <p className="text-xs text-muted-foreground">Play Time</p>
                <p className="text-lg font-semibold text-foreground">
                  {parsedSave?.info.playTime.hours}:
                  {parsedSave?.info.playTime.minutes
                    .toString()
                    .padStart(2, "0")}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-border pb-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "trainer" && parsedSave && saveData && (
                <TrainerEditor
                  saveData={saveData}
                  parsedSave={parsedSave}
                  onDataChange={handleDataChange}
                />
              )}
              {activeTab === "party" && parsedSave && saveData && (
                <PartyEditor
                  saveData={saveData}
                  parsedSave={parsedSave}
                  onDataChange={handleDataChange}
                />
              )}
              {activeTab === "boxes" && (
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                  <Icons.Package className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium text-foreground">
                    PC Boxes
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    PC Box editing coming soon. View and manage your stored Pokemon.
                  </p>
                </div>
              )}
              {activeTab === "inventory" && parsedSave && saveData && (
                <InventoryEditor
                  saveData={saveData}
                  parsedSave={parsedSave}
                  onDataChange={handleDataChange}
                />
              )}
              {activeTab === "pokedex" && (
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                  <Icons.FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium text-foreground">
                    Pokedex
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    Pokedex editing coming soon. Mark Pokemon as seen or caught.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      {/* Error Display */}
      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6">
          <div className="flex items-start gap-4">
            <Icons.AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Error</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
