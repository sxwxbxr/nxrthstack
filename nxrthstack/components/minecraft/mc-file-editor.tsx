"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[500px] rounded-lg border border-border bg-background">
      <Icons.Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  ),
});

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const EXTENSION_LANGUAGE: Record<string, string> = {
  yml: "yaml",
  yaml: "yaml",
  json: "json",
  properties: "ini",
  txt: "plaintext",
  log: "plaintext",
  sh: "shell",
  bat: "bat",
  cfg: "ini",
  conf: "ini",
  toml: "ini",
  xml: "xml",
  md: "markdown",
};

interface McFileEditorProps {
  serverId: string;
  filePath: string;
  canSave: boolean;
}

export function McFileEditor({ serverId, filePath, canSave }: McFileEditorProps) {
  const [modified, setModified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentContent, setCurrentContent] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, isLoading, error } = useSWR<{ content: string; path: string }>(
    `/api/gamehub/minecraft/server/files/read?serverId=${serverId}&path=${encodeURIComponent(filePath)}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const fileName = filePath.split("/").pop() || filePath;
  const ext = fileName.includes(".")
    ? fileName.split(".").pop()?.toLowerCase() || ""
    : "";
  const language = EXTENSION_LANGUAGE[ext] || "plaintext";

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      setCurrentContent(value ?? "");
      setModified(value !== data?.content);
      setSaveError(null);
    },
    [data?.content]
  );

  const handleSave = async () => {
    if (!canSave || currentContent === null) return;
    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch("/api/gamehub/minecraft/server/files/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serverId,
          path: filePath,
          content: currentContent,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error || "Failed to save");
        return;
      }

      setModified(false);
    } catch {
      setSaveError("Failed to save file");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Icons.Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-[500px] text-sm text-red-400">
        Failed to load file
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icons.FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {fileName}
          </span>
          {modified && (
            <span className="text-xs text-amber-400">(unsaved)</span>
          )}
        </div>
        {canSave && (
          <button
            onClick={handleSave}
            disabled={!modified || saving}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {saving ? (
              <Icons.Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Icons.Save className="h-3.5 w-3.5" />
            )}
            Save
          </button>
        )}
      </div>

      {saveError && (
        <p className="text-xs text-red-400">{saveError}</p>
      )}

      {/* Monaco editor */}
      <div className="rounded-lg border border-border overflow-hidden">
        <MonacoEditor
          height="500px"
          language={language}
          value={data.content}
          theme="vs-dark"
          onChange={handleEditorChange}
          options={{
            readOnly: !canSave,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            wordWrap: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
}
