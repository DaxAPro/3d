"use client";

interface LoadingOverlayProps {
  progress: number;
  statusMessage: string;
}

export default function LoadingOverlay({
  progress,
  statusMessage,
}: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-gray-900/90 border border-gray-700/50 shadow-2xl max-w-sm w-full mx-4">
        {/* Spinning ring */}
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-4 border-gray-700" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-500 animate-spin-slow animate-pulse-glow" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">🧊</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full space-y-2">
          <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full animate-shimmer transition-all duration-700 ease-out"
              style={{ width: `${Math.max(progress, 5)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{statusMessage}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        <p className="text-gray-500 text-xs text-center">
          This can take 1–5 minutes depending on the model complexity.
        </p>
      </div>
    </div>
  );
}
