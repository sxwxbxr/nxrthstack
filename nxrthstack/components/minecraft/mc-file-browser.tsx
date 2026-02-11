"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { useMcContext } from "@/components/minecraft/mc-context";
import { McFileEditor } from "@/components/minecraft/mc-file-editor";
import { hasMinRole } from "@/lib/gamehub/minecraft-roles";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size: number;
  modified: string;
  extension: string | null;
}

const FILE_ICONS: Record<string, typeof Icons.FileText> = {
  yml: Icons.FileText,
  yaml: Icons.FileText,
  json: Icons.FileText,
  properties: Icons.Sliders,
  txt: Icons.FileText,
  log: Icons.FileText,
  sh: Icons.Terminal,
  bat: Icons.Terminal,
  jar: Icons.Package,
};

function formatSize(bytes: number): string {
  if (bytes === 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function McFileBrowser() {
  const { serverId, userRole } = useMcContext();
  const [currentPath, setCurrentPath] = useState(".");
  const [editingFile, setEditingFile] = useState<string | null>(null);

  const { data, isLoading, mutate } = useSWR<{
    entries: FileEntry[];
    path: string;
  }>(
    `/api/gamehub/minecraft/server/files?serverId=${serverId}&path=${encodeURIComponent(currentPath)}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const canEdit = hasMinRole(userRole, "operator");
  const canDelete = hasMinRole(userRole, "manager");

  const navigateTo = useCallback((path: string) => {
    setCurrentPath(path);
    setEditingFile(null);
  }, []);

  const navigateUp = useCallback(() => {
    if (currentPath === ".") return;
    const parts = currentPath.split("/");
    parts.pop();
    setCurrentPath(parts.length === 0 ? "." : parts.join("/"));
    setEditingFile(null);
  }, [currentPath]);

  // Breadcrumb segments
  const pathSegments = currentPath === "." ? [] : currentPath.split("/");

  if (editingFile) {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setEditingFile(null)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <Icons.ChevronLeft className="h-4 w-4" />
          Back to files
        </button>
        <McFileEditor
          serverId={serverId}
          filePath={editingFile}
          canSave={canEdit}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm">
        <button
          onClick={() => navigateTo(".")}
          className="text-muted-foreground hover:text-foreground"
        >
          <Icons.FolderOpen className="h-4 w-4" />
        </button>
        {pathSegments.map((segment, i) => {
          const fullPath = pathSegments.slice(0, i + 1).join("/");
          return (
            <div key={fullPath} className="flex items-center gap-1">
              <Icons.ChevronRight className="h-3 w-3 text-muted-foreground/50" />
              <button
                onClick={() => navigateTo(fullPath)}
                className="text-muted-foreground hover:text-foreground"
              >
                {segment}
              </button>
            </div>
          );
        })}
      </div>

      {/* File list */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_100px_140px] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
          <span>Name</span>
          <span className="text-right">Size</span>
          <span className="text-right">Modified</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Icons.Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Up directory */}
            {currentPath !== "." && (
              <button
                onClick={navigateUp}
                className="w-full grid grid-cols-[1fr_100px_140px] gap-4 px-4 py-2.5 text-sm hover:bg-accent/50 transition-colors text-left"
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Icons.FolderOpen className="h-4 w-4" />
                  ..
                </span>
                <span />
                <span />
              </button>
            )}

            {/* Entries */}
            {data?.entries.map((entry) => {
              const FileIcon =
                entry.type === "directory"
                  ? Icons.FolderOpen
                  : FILE_ICONS[entry.extension || ""] || Icons.FileText;

              const isEditable =
                entry.type === "file" &&
                !["jar", "gz", "zip", "tar", "png", "jpg", "dat", "mca", "nbt"].includes(
                  entry.extension || ""
                );

              return (
                <button
                  key={entry.path}
                  onClick={() => {
                    if (entry.type === "directory") {
                      navigateTo(entry.path);
                    } else if (isEditable) {
                      setEditingFile(entry.path);
                    }
                  }}
                  className={cn(
                    "w-full grid grid-cols-[1fr_100px_140px] gap-4 px-4 py-2.5 text-sm transition-colors text-left",
                    entry.type === "directory" || isEditable
                      ? "hover:bg-accent/50 cursor-pointer"
                      : "opacity-60 cursor-default"
                  )}
                >
                  <span className="flex items-center gap-2 text-foreground truncate">
                    <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {entry.name}
                  </span>
                  <span className="text-right text-muted-foreground">
                    {entry.type === "file" ? formatSize(entry.size) : "—"}
                  </span>
                  <span className="text-right text-muted-foreground">
                    {formatDate(entry.modified)}
                  </span>
                </button>
              );
            })}

            {data?.entries.length === 0 && (
              <div className="text-center py-12 text-sm text-muted-foreground">
                Empty directory
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
