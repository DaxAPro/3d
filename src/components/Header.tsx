"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSavedSettings } from "@/lib/apiKeyStorage";

export default function Header() {
  const pathname = usePathname();
  const [hasCustomKey, setHasCustomKey] = useState(false);
  const [activeProvider, setActiveProvider] = useState("replicate");

  useEffect(() => {
    const checkKeys = () => {
      const s = getSavedSettings();
      setActiveProvider(s.activeProvider);
      const key =
        s.activeProvider === "replicate"
          ? s.replicateApiKey
          : s.activeProvider === "meshy"
          ? s.meshyApiKey
          : s.tripoApiKey;
      setHasCustomKey(Boolean(key));
    };

    checkKeys();
    window.addEventListener("settings_updated", checkKeys);
    return () => window.removeEventListener("settings_updated", checkKeys);
  }, []);

  return (
    <header className="border-b border-gray-800/60 backdrop-blur-md bg-gray-950/70 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-lg shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
            🧊
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white block leading-none">
              Image to 3D
            </span>
            <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">
              Pro Studio
            </span>
          </div>
        </Link>

        {/* Navigation & Controls */}
        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              pathname === "/"
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                : "text-gray-400 hover:text-white hover:bg-gray-800/40"
            }`}
          >
            Generator
          </Link>

          <Link
            href="/settings"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              pathname === "/settings"
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                : "text-gray-400 hover:text-white hover:bg-gray-800/40"
            }`}
          >
            <span>⚙️ Settings</span>
            {hasCustomKey ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-500/20" />
            ) : (
              <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.2 rounded">
                .env
              </span>
            )}
          </Link>

          <div className="hidden sm:flex items-center pl-3 border-l border-gray-800 text-[11px] text-gray-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
            <span className="capitalize text-gray-300 font-medium">
              {activeProvider} (TRELLIS 2K)
            </span>
          </div>
        </nav>
      </div>
    </header>
  );
}
