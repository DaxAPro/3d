"use client";

import { useCallback, useState, useRef } from "react";
import Image from "next/image";

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  imagePreview: string | null;
  disabled: boolean;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_SIZE_MB = 10;

export default function ImageUploader({
  onImageSelect,
  imagePreview,
  disabled,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = useCallback(
    (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        alert("Please upload a PNG, JPG, or WebP image.");
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`Image must be under ${MAX_SIZE_MB} MB.`);
        return;
      }
      onImageSelect(file);
    },
    [onImageSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    },
    [disabled, validateAndSelect]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`
        relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300
        ${
          isDragging
            ? "drop-zone-active border-violet-500 bg-violet-500/5"
            : "border-gray-700 hover:border-gray-500"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {imagePreview ? (
        /* ─── Image preview ─── */
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
          <Image
            src={imagePreview}
            alt="Uploaded preview"
            fill
            className="object-contain bg-gray-900/50"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium text-sm bg-gray-900/80 px-4 py-2 rounded-lg">
              Click to change image
            </span>
          </div>
        </div>
      ) : (
        /* ─── Empty state ─── */
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-gray-800 flex items-center justify-center text-3xl">
            📸
          </div>
          <p className="text-gray-300 font-medium mb-1">
            Drop your image here or click to browse
          </p>
          <p className="text-gray-500 text-sm">
            PNG, JPG, or WebP up to {MAX_SIZE_MB} MB
          </p>
        </div>
      )}
    </div>
  );
}
