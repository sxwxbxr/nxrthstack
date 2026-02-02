"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

const games = [
  { value: "r6", label: "Rainbow Six Siege" },
  { value: "minecraft", label: "Minecraft" },
  { value: "pokemon", label: "Pokemon" },
  { value: "valorant", label: "Valorant" },
  { value: "other", label: "Other" },
];

const categories = [
  { value: "highlight", label: "Highlight" },
  { value: "clutch", label: "Clutch" },
  { value: "funny", label: "Funny" },
  { value: "fail", label: "Fail" },
  { value: "tutorial", label: "Tutorial" },
];

export function ClipUploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    game: "r6",
    category: "highlight",
    isPublic: true,
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-matroska",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a valid video file (MP4, WebM, MOV, AVI, MKV)");
      return;
    }

    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      setError("Video must be less than 100MB");
      return;
    }

    setError("");
    setVideoFile(file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(previewUrl);

    // Get video duration
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      setVideoDuration(Math.round(video.duration));
      URL.revokeObjectURL(video.src);
    };
    video.src = previewUrl;

    // Start upload
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const timestamp = Date.now();
      const filename = `clips/${timestamp}-${file.name}`;

      const blob = await upload(filename, file, {
        access: "public",
        handleUploadUrl: "/api/clips/upload/token",
        onUploadProgress: (progress) => {
          setUploadProgress(Math.round(progress.percentage));
        },
      });

      setBlobUrl(blob.url);
    } catch (err) {
      console.error("Failed to upload video:", err);
      setError("Failed to upload video. Please try again.");
      setVideoFile(null);
      setVideoPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setBlobUrl("");
    setVideoDuration(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!blobUrl) {
      setError("Please upload a video first");
      return;
    }

    if (!formData.title.trim()) {
      setError("Please enter a title");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          blobUrl,
          durationSeconds: videoDuration,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create clip");
        return;
      }

      router.push(`/dashboard/gamehub/clips/${data.clip.id}`);
    } catch {
      setError("Failed to create clip");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Video Upload */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Video File</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your gaming clip (MP4, WebM, MOV - max 100MB)
        </p>

        <div className="mt-4">
          {videoPreviewUrl ? (
            <div className="space-y-4">
              {/* Video Preview */}
              <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                <video
                  src={videoPreviewUrl}
                  controls
                  className="h-full w-full"
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/75">
                    <div className="text-center">
                      <Icons.Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                      <p className="mt-2 text-white font-medium">
                        Uploading... {uploadProgress}%
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="absolute left-0 top-0 h-full bg-primary transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              {/* File Info */}
              <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {videoFile?.name}
                  </span>
                  {" - "}
                  {((videoFile?.size || 0) / (1024 * 1024)).toFixed(1)} MB
                  {videoDuration && ` - ${Math.floor(videoDuration / 60)}:${(videoDuration % 60).toString().padStart(2, "0")}`}
                </div>
                <button
                  type="button"
                  onClick={handleRemoveVideo}
                  disabled={isUploading}
                  className="text-destructive hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </div>

              {blobUrl && !isUploading && (
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <Icons.CheckCircle className="h-4 w-4" />
                  Upload complete
                </div>
              )}
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 transition-colors hover:border-primary hover:bg-muted/50">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Icons.Upload className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 font-medium text-foreground">
                Click to upload a video
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                MP4, WebM, MOV, AVI, MKV (max 100MB)
              </p>
            </label>
          )}
        </div>
      </div>

      {/* Clip Details */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Clip Details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a title and description for your clip
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              maxLength={100}
              required
              className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Give your clip a catchy title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              maxLength={500}
              rows={3}
              className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Describe what happens in this clip..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Game
              </label>
              <select
                value={formData.game}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, game: e.target.value }))
                }
                className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {games.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, category: e.target.value }))
                }
                className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isPublic: e.target.checked }))
                }
                className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-primary/20"
              />
              <span className="text-sm text-foreground">
                Make this clip public
              </span>
            </label>
            <p className="mt-1 ml-7 text-xs text-muted-foreground">
              Public clips can be viewed by anyone in the gallery
            </p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!blobUrl || isUploading || isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Icons.Loader2 className="h-4 w-4 animate-spin" />}
          Publish Clip
        </button>
      </div>
    </form>
  );
}
