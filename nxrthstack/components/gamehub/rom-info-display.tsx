"use client";

import { Icons } from "@/components/icons";
import type { ROMInfo } from "@/lib/pokemon/rom-detector";

interface ROMInfoDisplayProps {
  romInfo: ROMInfo;
  fileSize: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ROMInfoDisplay({ romInfo, fileSize }: ROMInfoDisplayProps) {
  const platformColors = {
    GB: "text-green-500 bg-green-500/10",
    GBC: "text-yellow-500 bg-yellow-500/10",
    GBA: "text-blue-500 bg-blue-500/10",
  };

  const generationColors: Record<number, string> = {
    1: "text-red-500 bg-red-500/10",
    2: "text-yellow-500 bg-yellow-500/10",
    3: "text-blue-500 bg-blue-500/10",
  };

  const infoItems = [
    {
      label: "Game Code",
      value: romInfo.gameCode,
      icon: <Icons.Code className="h-4 w-4" />,
    },
    {
      label: "Platform",
      value: romInfo.platform,
      icon: <Icons.Monitor className="h-4 w-4" />,
      badge: platformColors[romInfo.platform],
    },
    {
      label: "Generation",
      value: `Gen ${romInfo.generation}`,
      icon: <Icons.Sparkles className="h-4 w-4" />,
      badge: generationColors[romInfo.generation],
    },
    {
      label: "Region",
      value: romInfo.region,
      icon: <Icons.Globe className="h-4 w-4" />,
    },
    {
      label: "Pokemon Count",
      value: romInfo.pokemonCount.toString(),
      icon: <Icons.Users className="h-4 w-4" />,
    },
    {
      label: "File Size",
      value: formatFileSize(fileSize),
      icon: <Icons.HardDrive className="h-4 w-4" />,
    },
    {
      label: "File Name",
      value: romInfo.fileName,
      icon: <Icons.FileText className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ROM Details */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          ROM Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {infoItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">{item.icon}</span>
                <span className="text-sm text-muted-foreground">
                  {item.label}
                </span>
              </div>
              {item.badge ? (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${item.badge}`}
                >
                  {item.value}
                </span>
              ) : (
                <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                  {item.value}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Validation Status */}
      <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
            <Icons.CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">ROM Validated</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This ROM has been detected and is ready for editing. Use the tabs
              above to randomize wild Pokemon encounters or change your starter
              Pokemon.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Quick Tips
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <Icons.Info className="h-5 w-5 text-primary mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Wild Randomizer:</strong>{" "}
              Randomize wild Pokemon encounters. Enable BST matching for
              balanced randomization.
            </p>
          </li>
          <li className="flex items-start gap-3">
            <Icons.Info className="h-5 w-5 text-primary mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Starter Picker:</strong>{" "}
              Choose your own starter Pokemon or randomize them.
            </p>
          </li>
          <li className="flex items-start gap-3">
            <Icons.Info className="h-5 w-5 text-primary mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Download:</strong> After
              making changes, download your modified ROM using the button in the
              header.
            </p>
          </li>
        </ul>
      </div>
    </div>
  );
}
