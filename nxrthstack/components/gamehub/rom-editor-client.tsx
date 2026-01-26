"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Icons } from "@/components/icons";
import { ROMUploader } from "./rom-uploader";
import { ROMInfoDisplay } from "./rom-info-display";
import { WildRandomizer } from "./wild-randomizer";
import { StarterRandomizer } from "./starter-randomizer";
import { ROMDownloadButton } from "./rom-download-button";
import { ROMSaveButton } from "./rom-save-button";
import { detectROM, type ROMInfo } from "@/lib/pokemon/rom-detector";
import type { RomConfig, PokemonSpecies } from "@/lib/db";

interface StoredRomInfo {
  id: string;
  displayName: string;
  gameCode: string;
  gameName: string;
  platform: string;
  generation: number;
  fileSizeBytes: number;
}

interface ROMEditorClientProps {
  romConfigs: RomConfig[];
  pokemonSpecies: PokemonSpecies[];
  storedRoms: StoredRomInfo[];
}

type TabId = "info" | "wild" | "starters";
type SourceMode = "upload" | "preset";

interface Modifications {
  wildEncounters: boolean;
  starters: number[] | null;
  encounterCount: number;
}

export function ROMEditorClient({
  romConfigs,
  pokemonSpecies,
  storedRoms,
}: ROMEditorClientProps) {
  const [romData, setRomData] = useState<Uint8Array | null>(null);
  const [romInfo, setRomInfo] = useState<ROMInfo | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("info");
  const [sourceMode, setSourceMode] = useState<SourceMode>("upload");
  const [modifications, setModifications] = useState<Modifications>({
    wildEncounters: false,
    starters: null,
    encounterCount: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingPreset, setIsLoadingPreset] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleROMLoaded = useCallback(
    (data: Uint8Array, fileName: string) => {
      setError(null);
      setIsProcessing(true);

      try {
        const info = detectROM(data, romConfigs, fileName);
        if (info) {
          setRomData(data);
          setRomInfo(info);
          setModifications({
            wildEncounters: false,
            starters: null,
            encounterCount: 0,
          });
          setActiveTab("info");
        } else {
          setError(
            "Could not detect ROM. Make sure you're using a supported Gen 1-3 Pokemon game."
          );
          setRomData(null);
          setRomInfo(null);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to process ROM"
        );
        setRomData(null);
        setRomInfo(null);
      } finally {
        setIsProcessing(false);
      }
    },
    [romConfigs]
  );

  const handleLoadPreset = useCallback(
    async (preset: StoredRomInfo) => {
      setError(null);
      setIsLoadingPreset(true);

      try {
        const response = await fetch(`/api/gamehub/pokemon/roms/${preset.id}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to load ROM");
        }

        const { data: base64Data, gameName } = await response.json();

        // Convert base64 to Uint8Array
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Detect and load the ROM
        handleROMLoaded(bytes, `${gameName}.${preset.platform.toLowerCase()}`);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load preset ROM"
        );
      } finally {
        setIsLoadingPreset(false);
      }
    },
    [handleROMLoaded]
  );

  const handleReset = useCallback(() => {
    setRomData(null);
    setRomInfo(null);
    setModifications({
      wildEncounters: false,
      starters: null,
      encounterCount: 0,
    });
    setError(null);
    setActiveTab("info");
  }, []);

  const handleWildRandomized = useCallback(
    (modifiedData: Uint8Array, encounterCount: number) => {
      setRomData(modifiedData);
      setModifications((prev) => ({
        ...prev,
        wildEncounters: true,
        encounterCount,
      }));
    },
    []
  );

  const handleStartersChanged = useCallback(
    (modifiedData: Uint8Array, starterIds: number[]) => {
      setRomData(modifiedData);
      setModifications((prev) => ({
        ...prev,
        starters: starterIds,
      }));
    },
    []
  );

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "info", label: "ROM Info", icon: <Icons.Info className="h-4 w-4" /> },
    {
      id: "wild",
      label: "Wild Pokemon",
      icon: <Icons.Shuffle className="h-4 w-4" />,
    },
    {
      id: "starters",
      label: "Starters",
      icon: <Icons.Sparkles className="h-4 w-4" />,
    },
  ];

  const hasModifications =
    modifications.wildEncounters || modifications.starters !== null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* ROM Uploader or Loaded State */}
      {!romData ? (
        <div className="space-y-6">
          {/* Source Mode Tabs */}
          <div className="flex gap-2 border-b border-border pb-4">
            <button
              onClick={() => setSourceMode("upload")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                sourceMode === "upload"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icons.FileUp className="h-4 w-4" />
              Upload ROM
            </button>
            <button
              onClick={() => setSourceMode("preset")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                sourceMode === "preset"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icons.HardDrive className="h-4 w-4" />
              Saved ROMs {storedRoms.length > 0 && `(${storedRoms.length})`}
            </button>
          </div>

          {/* Upload Mode */}
          {sourceMode === "upload" && (
            <ROMUploader
              onROMLoaded={handleROMLoaded}
              isProcessing={isProcessing}
              romConfigs={romConfigs}
            />
          )}

          {/* Preset Mode */}
          {sourceMode === "preset" && (
            <div className="space-y-4">
              {storedRoms.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-12 text-center">
                  <Icons.HardDrive className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium text-foreground">
                    No saved ROMs
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    Upload a ROM and save it to create a preset for easy access.
                  </p>
                  <button
                    onClick={() => setSourceMode("upload")}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Icons.FileUp className="h-4 w-4" />
                    Upload ROM
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {storedRoms.map((preset) => (
                    <motion.button
                      key={preset.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleLoadPreset(preset)}
                      disabled={isLoadingPreset}
                      className="flex flex-col rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/50 disabled:opacity-50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Icons.HardDrive className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {preset.displayName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {preset.gameName}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {preset.platform}
                        </span>
                        <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          Gen {preset.generation}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {formatFileSize(preset.fileSizeBytes)}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              {isLoadingPreset && (
                <div className="flex items-center justify-center gap-3 py-8">
                  <Icons.Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading ROM...</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Loaded ROM Header */}
          <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <Icons.HardDrive className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {romInfo?.gameName}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Generation {romInfo?.generation} • {romInfo?.platform} •{" "}
                    {romInfo?.region}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <ROMSaveButton
                  romData={romData}
                  romInfo={romInfo!}
                  romConfigs={romConfigs}
                />
                {hasModifications && (
                  <ROMDownloadButton
                    romData={romData}
                    romInfo={romInfo!}
                  />
                )}
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <Icons.Close className="h-4 w-4" />
                  Close ROM
                </button>
              </div>
            </div>

            {/* Modification Summary */}
            {hasModifications && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">
                  Modifications:
                </p>
                <div className="flex flex-wrap gap-2">
                  {modifications.wildEncounters && (
                    <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
                      Wild Pokemon ({modifications.encounterCount} slots)
                    </span>
                  )}
                  {modifications.starters && (
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500">
                      Starters Modified
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-border pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
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
              {activeTab === "info" && romInfo && (
                <ROMInfoDisplay romInfo={romInfo} fileSize={romData.length} />
              )}
              {activeTab === "wild" && romInfo && romData && (
                <WildRandomizer
                  romData={romData}
                  romInfo={romInfo}
                  pokemonSpecies={pokemonSpecies}
                  onRandomized={handleWildRandomized}
                />
              )}
              {activeTab === "starters" && romInfo && romData && (
                <StarterRandomizer
                  romData={romData}
                  romInfo={romInfo}
                  pokemonSpecies={pokemonSpecies}
                  onStartersChanged={handleStartersChanged}
                />
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
