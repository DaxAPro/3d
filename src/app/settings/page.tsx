"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Link from "next/link";
import {
  AppSettings,
  DEFAULT_SETTINGS,
  getSavedSettings,
  saveSettings,
  AIProvider,
} from "@/lib/apiKeyStorage";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [showReplicateKey, setShowReplicateKey] = useState(false);
  const [showMeshyKey, setShowMeshyKey] = useState(false);
  const [showTripoKey, setShowTripoKey] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);

  useEffect(() => {
    setSettings(getSavedSettings());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(settings);
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3500);
  };

  const handleReset = () => {
    if (confirm("Reset all settings and clear custom API keys?")) {
      const reset = saveSettings(DEFAULT_SETTINGS);
      setSettings(reset);
      setSavedNotification(true);
      setTimeout(() => setSavedNotification(false), 3500);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#0a0a0f] text-gray-100">
      <Header />

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Breadcrumb / Title */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <Link href="/" className="hover:text-white transition-colors">
                ← Back to Generator
              </Link>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
              API & Quality Settings
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Manage your personal 3D AI credentials and calibrate high-fidelity texture and PBR options. Keys are stored locally on your device.
            </p>
          </div>

          <button
            onClick={handleReset}
            className="text-xs text-gray-500 hover:text-red-400 border border-gray-800 hover:border-red-900/50 px-3 py-1.5 rounded-lg transition-colors"
          >
            Reset Defaults
          </button>
        </div>

        {/* Success Alert Banner */}
        {savedNotification && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between shadow-lg shadow-emerald-500/10 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span>Settings and API keys saved successfully to your browser!</span>
            </div>
            <Link
              href="/"
              className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold px-3 py-1 rounded-md transition-colors"
            >
              Go generate 3D →
            </Link>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* ─── SECTION 1: Active Provider Selection ─── */}
          <div className="bg-gray-900/50 border border-gray-800/80 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>⚡</span> Active AI Engine
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Choose which 3D model engine will process your 2D images.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Replicate / TRELLIS */}
              <div
                onClick={() => setSettings({ ...settings, activeProvider: "replicate" })}
                className={`cursor-pointer rounded-xl p-4 border transition-all ${
                  settings.activeProvider === "replicate"
                    ? "border-violet-500 bg-violet-950/20 ring-1 ring-violet-500 shadow-md shadow-violet-500/10"
                    : "border-gray-800 bg-gray-900/40 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-white">Replicate (TRELLIS)</span>
                  <span
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      settings.activeProvider === "replicate"
                        ? "border-violet-500 bg-violet-500"
                        : "border-gray-600"
                    }`}
                  >
                    {settings.activeProvider === "replicate" && (
                      <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  State-of-the-art open research model by Microsoft with 2K PBR textures & high geometric fidelity.
                </p>
                <span className="inline-block mt-2 text-[10px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded font-medium">
                  Recommended
                </span>
              </div>

              {/* Meshy AI */}
              <div
                onClick={() => setSettings({ ...settings, activeProvider: "meshy" })}
                className={`cursor-pointer rounded-xl p-4 border transition-all ${
                  settings.activeProvider === "meshy"
                    ? "border-violet-500 bg-violet-950/20 ring-1 ring-violet-500 shadow-md shadow-violet-500/10"
                    : "border-gray-800 bg-gray-900/40 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-white">Meshy AI (v2)</span>
                  <span
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      settings.activeProvider === "meshy"
                        ? "border-violet-500 bg-violet-500"
                        : "border-gray-600"
                    }`}
                  >
                    {settings.activeProvider === "meshy" && (
                      <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Dedicated commercial 3D generation API with auto-re-topology and distinct metallic/roughness channels.
                </p>
              </div>

              {/* Tripo3D */}
              <div
                onClick={() => setSettings({ ...settings, activeProvider: "tripo" })}
                className={`cursor-pointer rounded-xl p-4 border transition-all ${
                  settings.activeProvider === "tripo"
                    ? "border-violet-500 bg-violet-950/20 ring-1 ring-violet-500 shadow-md shadow-violet-500/10"
                    : "border-gray-800 bg-gray-900/40 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-white">Tripo3D</span>
                  <span
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      settings.activeProvider === "tripo"
                        ? "border-violet-500 bg-violet-500"
                        : "border-gray-600"
                    }`}
                  >
                    {settings.activeProvider === "tripo" && (
                      <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Ultra-fast generation engine designed for rapid prototyping and clean lightweight meshes.
                </p>
              </div>
            </div>
          </div>

          {/* ─── SECTION 2: API Keys Management ─── */}
          <div className="bg-gray-900/50 border border-gray-800/80 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🔑</span> Personal API Credentials
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Saved directly in your browser&apos;s encrypted LocalStorage. If left empty, the system will fall back to server <code className="text-violet-400">.env.local</code> variables.
              </p>
            </div>

            {/* Replicate Key */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <span>Replicate API Token</span>
                  {settings.replicateApiKey && (
                    <span className="text-emerald-400 text-[11px] font-normal flex items-center gap-0.5">
                      ✓ Active
                    </span>
                  )}
                </label>
                <a
                  href="https://replicate.com/account/api-tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
                >
                  Get Token ↗
                </a>
              </div>
              <div className="relative">
                <input
                  type={showReplicateKey ? "text" : "password"}
                  placeholder="r8_********************************"
                  value={settings.replicateApiKey}
                  onChange={(e) =>
                    setSettings({ ...settings, replicateApiKey: e.target.value.trim() })
                  }
                  className="w-full bg-gray-950/80 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-violet-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowReplicateKey(!showReplicateKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-300"
                >
                  {showReplicateKey ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Meshy Key */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <span>Meshy API Key</span>
                  {settings.meshyApiKey && (
                    <span className="text-emerald-400 text-[11px] font-normal flex items-center gap-0.5">
                      ✓ Active
                    </span>
                  )}
                </label>
                <a
                  href="https://app.meshy.ai/settings/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
                >
                  Get Key ↗
                </a>
              </div>
              <div className="relative">
                <input
                  type={showMeshyKey ? "text" : "password"}
                  placeholder="msy_********************************"
                  value={settings.meshyApiKey}
                  onChange={(e) =>
                    setSettings({ ...settings, meshyApiKey: e.target.value.trim() })
                  }
                  className="w-full bg-gray-950/80 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-violet-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowMeshyKey(!showMeshyKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-300"
                >
                  {showMeshyKey ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Tripo3D Key */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <span>Tripo3D API Key</span>
                  {settings.tripoApiKey && (
                    <span className="text-emerald-400 text-[11px] font-normal flex items-center gap-0.5">
                      ✓ Active
                    </span>
                  )}
                </label>
                <a
                  href="https://platform.tripo3d.ai/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
                >
                  Get Key ↗
                </a>
              </div>
              <div className="relative">
                <input
                  type={showTripoKey ? "text" : "password"}
                  placeholder="tsk_********************************"
                  value={settings.tripoApiKey}
                  onChange={(e) =>
                    setSettings({ ...settings, tripoApiKey: e.target.value.trim() })
                  }
                  className="w-full bg-gray-950/80 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-violet-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowTripoKey(!showTripoKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-300"
                >
                  {showTripoKey ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </div>

          {/* ─── SECTION 3: High-Quality & Accurate Colors Configuration ─── */}
          <div className="bg-gray-900/50 border border-gray-800/80 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🎨</span> High-Quality & Accurate Colors Configuration
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Strict quality flags injected into the AI generation pipeline to produce studio-grade textures, PBR shading, and original color accuracy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Texture Resolution */}
              <div className="p-4 bg-gray-950/60 border border-gray-800/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Texture Resolution</span>
                  <span className="text-xs text-violet-400 font-mono">
                    {settings.textureResolution} x {settings.textureResolution}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Select 2048 for high-definition 2K texture maps that preserve crisp details and avoid blurry surfaces.
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, textureResolution: 1024 })}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      settings.textureResolution === 1024
                        ? "bg-violet-600 border-violet-500 text-white"
                        : "border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700"
                    }`}
                  >
                    1024 (Standard)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, textureResolution: 2048 })}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      settings.textureResolution === 2048
                        ? "bg-violet-600 border-violet-500 text-white"
                        : "border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700"
                    }`}
                  >
                    2048 (Ultra 2K) ⭐
                  </button>
                </div>
              </div>

              {/* Accurate Colors / Albedo */}
              <div className="p-4 bg-gray-950/60 border border-gray-800/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Original Color Matching</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.accurateColors}
                      onChange={(e) =>
                        setSettings({ ...settings, accurateColors: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>
                <p className="text-xs text-gray-400">
                  Enforces strict image albedo guidance so the 3D model inherits the exact color tones, vibrancy, and shadows of your uploaded 2D image.
                </p>
              </div>

              {/* PBR Materials */}
              <div className="p-4 bg-gray-950/60 border border-gray-800/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">PBR Materials Engine</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.enablePbr}
                      onChange={(e) =>
                        setSettings({ ...settings, enablePbr: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                </div>
                <p className="text-xs text-gray-400">
                  Generates dedicated Normal, Roughness, and Metallic maps so lighting reacts realistically to textures in 3D viewers, Blender, or games.
                </p>
              </div>

              {/* Mesh Complexity */}
              <div className="p-4 bg-gray-950/60 border border-gray-800/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Geometry Fidelity</span>
                  <span className="text-xs text-violet-400 font-mono capitalize">
                    {settings.meshQuality}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Ultra mode minimizes decimation, giving sharp edges, curves, and high surface definition.
                </p>
                <div className="flex gap-2 pt-2">
                  {(["medium", "high", "ultra"] as const).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setSettings({ ...settings, meshQuality: q })}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border capitalize transition-all ${
                        settings.meshQuality === q
                          ? "bg-violet-600 border-violet-500 text-white"
                          : "border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Submit Bar ─── */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl border border-gray-800 hover:bg-gray-800/60 text-gray-300 text-sm font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
            >
              Save Configuration 💾
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
