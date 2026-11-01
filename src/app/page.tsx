"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import ImageUploader from "@/components/ImageUploader";
import LoadingOverlay from "@/components/LoadingOverlay";
import Header from "@/components/Header";
import { getSavedSettings, AppSettings, DEFAULT_SETTINGS } from "@/lib/apiKeyStorage";
import { downloadAsGlb, downloadAsVrm } from "@/lib/vrmExporter";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[4/3] rounded-2xl border border-gray-800 bg-gray-900/50 flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">Initializing 3D Canvas...</p>
    </div>
  ),
});

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [downloadingType, setDownloadingType] = useState<"glb" | "vrm" | null>(null);

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(getSavedSettings());
    const onSettingsUpdate = () => setSettings(getSavedSettings());
    window.addEventListener("settings_updated", onSettingsUpdate);
    return () => window.removeEventListener("settings_updated", onSettingsUpdate);
  }, []);

  const handleImageSelect = useCallback((file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setModelUrl(null);
    setError(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!imageFile) return;

    setIsLoading(true);
    setError(null);
    setProgress(0);
    setStatusMessage("Preparing high-res texture and geometry payload...");

    try {
      const currentSettings = getSavedSettings();

      // --- Prepare FormData with quality flags ---
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("texture_size", currentSettings.textureResolution.toString());
      formData.append("mesh_quality", currentSettings.meshQuality);
      formData.append("accurate_colors", currentSettings.accurateColors.toString());
      formData.append("enable_pbr", currentSettings.enablePbr.toString());

      // Headers with client API credentials (falls back to server .env if omitted)
      const headers: Record<string, string> = {
        "x-provider": currentSettings.activeProvider,
      };
      if (currentSettings.replicateApiKey) {
        headers["x-replicate-token"] = currentSettings.replicateApiKey;
      }
      if (currentSettings.meshyApiKey) {
        headers["x-meshy-key"] = currentSettings.meshyApiKey;
      }
      if (currentSettings.tripoApiKey) {
        headers["x-tripo-key"] = currentSettings.tripoApiKey;
      }

      setProgress(15);
      setStatusMessage("Dispatching to AI 3D engine with 2K PBR configuration...");

      const startRes = await fetch("/api/generate-3d", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!startRes.ok) {
        const errData = await startRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to start 3D generation");
      }

      const startData = await startRes.json();

      if (startData.status === "succeeded" && startData.modelUrl) {
        setModelUrl(startData.modelUrl);
        setProgress(100);
        setStatusMessage("Complete!");
        setIsLoading(false);
        return;
      }

      const predictionId = startData.predictionId;
      if (!predictionId) {
        throw new Error("No prediction ID returned from API");
      }

      // --- Polling Phase ---
      setProgress(25);
      setStatusMessage("Synthesizing 3D mesh & extracting albedo color maps...");

      let attempts = 0;
      const maxAttempts = 120; // 10 minutes max

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        attempts++;

        const pollProgress = Math.min(25 + (attempts / maxAttempts) * 65, 92);
        setProgress(pollProgress);

        const pollRes = await fetch(
          `/api/generate-3d?predictionId=${predictionId}&provider=${currentSettings.activeProvider}`,
          { headers }
        );

        if (!pollRes.ok) {
          const errData = await pollRes.json().catch(() => ({}));
          throw new Error(errData.error || "Polling failed");
        }

        const pollData = await pollRes.json();

        if (pollData.status === "succeeded") {
          setModelUrl(pollData.modelUrl);
          setProgress(100);
          setStatusMessage("High-quality 3D model generated!");
          break;
        } else if (pollData.status === "failed") {
          throw new Error(pollData.error || "Model generation failed");
        } else {
          setStatusMessage(
            `Generating high-res geometry & 2K textures... (${Math.round(pollProgress)}%)`
          );
        }
      }

      if (attempts >= maxAttempts) {
        throw new Error("Generation timed out. Please try again.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong during generation";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [imageFile]);

  // Download Handlers
  const handleDownloadGlb = async () => {
    if (!modelUrl) return;
    try {
      setDownloadingType("glb");
      await downloadAsGlb(modelUrl, "model.glb");
    } catch (e) {
      alert("Failed to download GLB file: " + (e instanceof Error ? e.message : e));
    } finally {
      setDownloadingType(null);
    }
  };

  const handleDownloadVrm = async () => {
    if (!modelUrl) return;
    try {
      setDownloadingType("vrm");
      await downloadAsVrm(modelUrl, "model.vrm");
    } catch (e) {
      alert("Failed to download VRM file: " + (e instanceof Error ? e.message : e));
    } finally {
      setDownloadingType(null);
    }
  };

  const handleReset = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setModelUrl(null);
    setError(null);
    setProgress(0);
    setStatusMessage("");
  }, []);

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-[#0a0a0f] text-gray-100">
      <Header />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* ─── Uploader View ─── */}
        {!modelUrl && (
          <div className="w-full max-w-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-700/40 text-violet-300 text-xs font-semibold mb-2 shadow-sm">
                <span>✨</span> AI 2D to 3D High-Fidelity Pipeline
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                Transform 2D Images to 3D
              </h1>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                Generate 3D assets with 2048x2048 PBR textures, accurate color matching, and direct .GLB and .VRM exports.
              </p>
            </div>

            {/* Quality Badges */}
            <div className="flex items-center justify-center flex-wrap gap-2 text-[11px] text-gray-400">
              <span className="px-2.5 py-0.5 rounded-md bg-gray-900 border border-gray-800">
                Texture: <strong className="text-violet-400">{settings.textureResolution}px (2K)</strong>
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-gray-900 border border-gray-800">
                Albedo: <strong className="text-emerald-400">{settings.accurateColors ? "Accurate" : "Standard"}</strong>
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-gray-900 border border-gray-800">
                PBR: <strong className="text-blue-400">{settings.enablePbr ? "Enabled" : "Off"}</strong>
              </span>
              <Link
                href="/settings"
                className="text-violet-400 hover:text-violet-300 underline underline-offset-2 ml-1"
              >
                Change in Settings →
              </Link>
            </div>

            <ImageUploader
              onImageSelect={handleImageSelect}
              imagePreview={imagePreview}
              disabled={isLoading}
            />

            {/* Error Message with Settings Action */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-xs sm:text-sm text-center space-y-2">
                <p>⚠️ {error}</p>
                {error.toLowerCase().includes("token") || error.toLowerCase().includes("key") ? (
                  <Link
                    href="/settings"
                    className="inline-block px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Open API Settings to Enter Key →
                  </Link>
                ) : null}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              {imagePreview && (
                <button
                  onClick={handleReset}
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl border border-gray-800 text-gray-300 hover:bg-gray-800/60 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleGenerate}
                disabled={!imageFile || isLoading}
                className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm
                           hover:from-violet-500 hover:to-purple-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed
                           shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
              >
                {isLoading ? "Generating 3D..." : "Generate High-Quality 3D ✨"}
              </button>
            </div>
          </div>
        )}

        {/* ─── Loading Overlay ─── */}
        {isLoading && (
          <LoadingOverlay progress={progress} statusMessage={statusMessage} />
        )}

        {/* ─── 3D Viewer & Exports ─── */}
        {modelUrl && !isLoading && (
          <div className="w-full max-w-4xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-900/60 border border-gray-800/80 p-4 rounded-2xl">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🎉</span> Generated 3D Asset
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Rendered with PBR lighting & calibrated color space. Rotate, zoom, or export below.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleReset}
                  className="px-3.5 py-2 rounded-xl border border-gray-800 text-gray-300 hover:bg-gray-800 text-xs font-medium transition-colors"
                >
                  ← New Image
                </button>

                {/* .GLB Download */}
                <button
                  onClick={handleDownloadGlb}
                  disabled={downloadingType !== null}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-1.5"
                  title="Download binary glTF format (Compatible with Blender, Three.js, Web)"
                >
                  <span>⬇</span>
                  <span>{downloadingType === "glb" ? "Saving..." : "Download .GLB"}</span>
                </button>

                {/* .VRM Download */}
                <button
                  onClick={handleDownloadVrm}
                  disabled={downloadingType !== null}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-1.5"
                  title="Download VRM avatar format (Compatible with Unity, VRChat, VTuber software)"
                >
                  <span>🎭</span>
                  <span>{downloadingType === "vrm" ? "Packing VRM..." : "Download .VRM"}</span>
                </button>
              </div>
            </div>

            {/* Enhanced Three.js / React Three Fiber Viewer */}
            <ModelViewer url={modelUrl} />

            <div className="flex items-center justify-between text-xs text-gray-500 px-1">
              <span>🖱️ Drag: Rotate · Scroll: Zoom · Right-Click Drag: Pan</span>
              <span className="text-[11px] text-gray-400">
                PBR 2K Texture · True Color Albedo
              </span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
