"use client";

export type AIProvider = "replicate" | "meshy" | "tripo";

export interface AppSettings {
  activeProvider: AIProvider;
  replicateApiKey: string;
  meshyApiKey: string;
  tripoApiKey: string;
  // High quality parameters
  textureResolution: 1024 | 2048;
  enablePbr: boolean;
  meshQuality: "ultra" | "high" | "medium";
  accurateColors: boolean;
}

const STORAGE_KEY = "image_to_3d_user_settings_v1";

export const DEFAULT_SETTINGS: AppSettings = {
  activeProvider: "replicate",
  replicateApiKey: "",
  meshyApiKey: "",
  tripoApiKey: "",
  textureResolution: 2048,
  enablePbr: true,
  meshQuality: "ultra",
  accurateColors: true,
};

/**
 * Retrieve saved settings from localStorage (safe with SSR)
 */
export function getSavedSettings(): AppSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    console.error("Failed to read settings from localStorage", e);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }
  try {
    const current = getSavedSettings();
    const updated: AppSettings = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Trigger custom event so other components update reactively
    window.dispatchEvent(new Event("settings_updated"));
    return updated;
  } catch (e) {
    console.error("Failed to save settings to localStorage", e);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Returns the currently active API key based on selected provider
 */
export function getActiveApiKey(settings: AppSettings): string {
  switch (settings.activeProvider) {
    case "replicate":
      return settings.replicateApiKey;
    case "meshy":
      return settings.meshyApiKey;
    case "tripo":
      return settings.tripoApiKey;
    default:
      return "";
  }
}
