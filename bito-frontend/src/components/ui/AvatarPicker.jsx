import React, { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  ImageIcon,
  UploadIcon,
  ReloadIcon,
  CheckIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";
import { userAPI } from "../../services/api";

/* ──────────────────────────────────────────
   DiceBear style options
   ────────────────────────────────────────── */
const DICEBEAR_STYLES = [
  { id: "avataaars", label: "Avataaars" },
  { id: "bottts", label: "Bots" },
  { id: "fun-emoji", label: "Emoji" },
  { id: "lorelei", label: "Lorelei" },
  { id: "notionists", label: "Notionists" },
  { id: "thumbs", label: "Thumbs" },
];

const buildDiceBearUrl = (style, seed) =>
  `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=6366f1`;

/* ──────────────────────────────────────────
   AvatarPicker
   Props:
     currentAvatar  – current avatar URL
     userName       – fallback seed for DiceBear
     onAvatarChange – (url: string) => void  — called after save
     size           – "sm" | "md" | "lg"
   ────────────────────────────────────────── */
const AvatarPicker = ({
  currentAvatar,
  userName = "User",
  onAvatarChange,
  size = "md",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState("generate"); // "generate" | "upload"
  const [selectedStyle, setSelectedStyle] = useState("avataaars");
  const [seed, setSeed] = useState(userName);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  // Dimensions based on size  
  const dims = size === "lg" ? "w-20 h-20" : size === "md" ? "w-14 h-14" : "w-10 h-10";

  const handleOpen = () => {
    setIsOpen(true);
    setPreviewUrl("");
    setError("");
    setSeed(userName);
  };

  const handleClose = () => {
    setIsOpen(false);
    setPreviewUrl("");
    setError("");
  };

  /* ── Generate tab ─────────── */
  const handleRandomize = () => {
    const newSeed = `${userName}_${Date.now()}`;
    setSeed(newSeed);
    setPreviewUrl(buildDiceBearUrl(selectedStyle, newSeed));
  };

  const handleStyleChange = (styleId) => {
    setSelectedStyle(styleId);
    setPreviewUrl(buildDiceBearUrl(styleId, seed));
  };

  const handleSaveGenerated = async () => {
    const url = previewUrl || buildDiceBearUrl(selectedStyle, seed);
    setSaving(true);
    setError("");
    try {
      await userAPI.setAvatar(url);
      onAvatarChange?.(url);
      handleClose();
    } catch {
      setError("Failed to save avatar. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Upload tab ─────────── */
  const handleFileSelect = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Client-side validation
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be under 5 MB");
        return;
      }
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
        setError("Only JPEG, PNG, WebP, and GIF are allowed");
        return;
      }

      setUploading(true);
      setError("");
      try {
        const res = await userAPI.uploadAvatar(file);
        const url = res.data.avatar;
        setPreviewUrl(url);
        onAvatarChange?.(url);
        handleClose();
      } catch (err) {
        setError(err.message || "Upload failed");
      } finally {
        setUploading(false);
        // Reset so the same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [onAvatarChange]
  );

  /* ── Current display avatar for the button ── */
  const displayAvatar = currentAvatar || buildDiceBearUrl("avataaars", userName);
  const generatedPreview = previewUrl || buildDiceBearUrl(selectedStyle, seed);

  return (
    <div className="relative" ref={containerRef}>
      {/* ── Trigger: avatar + text link ── */}
      <div className="flex flex-col items-center gap-1.5">
        <button
          type="button"
          onClick={handleOpen}
          className={`${dims} rounded-full overflow-hidden border-2 border-dashed border-[var(--color-border-primary)] hover:border-[var(--color-brand-500)] transition-colors relative group cursor-pointer`}
        >
          <img
            src={displayAvatar}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-white" />
          </div>
        </button>
        <button
          type="button"
          onClick={handleOpen}
          className="text-xs font-spartan font-medium hover:underline transition-colors cursor-pointer"
          style={{ color: "var(--color-brand-500)" }}
        >
          {currentAvatar ? "Change avatar" : "Choose avatar"}
        </button>
      </div>

      {/* ── Picker overlay (portalled to body so fixed positioning works inside transformed parents) ── */}
      {isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998] bg-black/30"
            onClick={handleClose}
          />

          {/* Panel — centred bottom sheet on mobile, dropdown on desktop */}
          <div
            className="fixed inset-x-0 bottom-0 z-[9999] rounded-t-2xl sm:fixed sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:w-80 border shadow-xl"
            style={{
              backgroundColor: "var(--color-surface-elevated)",
              borderColor: "var(--color-border-primary)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3
                className="text-sm font-semibold font-spartan"
                style={{ color: "var(--color-text-primary)" }}
              >
                Change avatar
              </h3>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-md hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                <Cross2Icon className="w-4 h-4" style={{ color: "var(--color-text-tertiary)" }} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--color-border-primary)] mx-4">
              {[
                { key: "generate", label: "Generate" },
                { key: "upload", label: "Upload" },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => { setTab(t.key); setError(""); }}
                  className="flex-1 py-2 text-xs font-spartan font-medium transition-colors relative"
                  style={{
                    color: tab === t.key ? "var(--color-brand-500)" : "var(--color-text-tertiary)",
                  }}
                >
                  {t.label}
                  {tab === t.key && (
                    <span
                      className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full"
                      style={{ backgroundColor: "var(--color-brand-500)" }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-4 max-h-[60vh] sm:max-h-[400px] overflow-y-auto">
              {error && (
                <div
                  className="mb-3 p-2 rounded-lg text-xs font-spartan"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    color: "#f87171",
                  }}
                >
                  {error}
                </div>
              )}

              {/* ──── GENERATE TAB ──── */}
              {tab === "generate" && (
                <div className="space-y-4">
                  {/* Preview */}
                  <div className="flex justify-center">
                    <img
                      src={generatedPreview}
                      alt="Preview"
                      className="w-24 h-24 rounded-full border-2 border-[var(--color-border-primary)]"
                    />
                  </div>

                  {/* Style grid */}
                  <div>
                    <p
                      className="text-xs font-spartan font-medium mb-2"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Style
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {DICEBEAR_STYLES.map((s) => {
                        const active = selectedStyle === s.id;
                        return (
                          <button
                            type="button"
                            key={s.id}
                            onClick={() => handleStyleChange(s.id)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                              active
                                ? "border-[var(--color-brand-500)] bg-[var(--color-brand-500)]/10"
                                : "border-[var(--color-border-primary)] hover:border-[var(--color-brand-400)]"
                            }`}
                          >
                            <img
                              src={buildDiceBearUrl(s.id, seed)}
                              alt={s.label}
                              className="w-10 h-10 rounded-full"
                            />
                            <span
                              className="text-[10px] font-spartan"
                              style={{
                                color: active
                                  ? "var(--color-brand-500)"
                                  : "var(--color-text-tertiary)",
                              }}
                            >
                              {s.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Randomize + Save */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleRandomize}
                      className="flex-1 btn btn-secondary btn-sm justify-center gap-1.5 font-spartan text-xs"
                    >
                      <ReloadIcon className="w-3.5 h-3.5" />
                      Randomize
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveGenerated}
                      disabled={saving}
                      className="flex-1 btn btn-primary btn-sm justify-center gap-1.5 font-spartan text-xs"
                    >
                      {saving ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckIcon className="w-3.5 h-3.5" />
                      )}
                      Save
                    </button>
                  </div>
                </div>
              )}

              {/* ──── UPLOAD TAB ──── */}
              {tab === "upload" && (
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full py-10 rounded-xl border-2 border-dashed border-[var(--color-border-primary)] hover:border-[var(--color-brand-500)] transition-colors flex flex-col items-center gap-2 cursor-pointer"
                    style={{ backgroundColor: "var(--color-surface-secondary, transparent)" }}
                  >
                    {uploading ? (
                      <>
                        <span className="w-6 h-6 border-2 border-[var(--color-brand-500)] border-t-transparent rounded-full animate-spin" />
                        <span
                          className="text-xs font-spartan"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          Uploading…
                        </span>
                      </>
                    ) : (
                      <>
                        <UploadIcon
                          className="w-6 h-6"
                          style={{ color: "var(--color-text-tertiary)" }}
                        />
                        <span
                          className="text-xs font-spartan font-medium"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          Tap to choose a photo
                        </span>
                        <span
                          className="text-[10px] font-spartan"
                          style={{ color: "var(--color-text-tertiary)" }}
                        >
                          JPEG, PNG, WebP, or GIF — max 5 MB
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default AvatarPicker;
