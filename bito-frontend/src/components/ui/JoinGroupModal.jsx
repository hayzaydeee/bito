import { useState, useRef, useEffect, useCallback } from "react";
import { X, UserPlus, QrCode } from "@phosphor-icons/react";
import AnimatedModal from "./AnimatedModal";

/* ── capability detection ─────────────────────────────────────── */
const hasBarcodeDetector =
  typeof window !== "undefined" && "BarcodeDetector" in window;

const isMobileDevice =
  typeof window !== "undefined" && window.navigator.maxTouchPoints > 1;

/**
 * Extract a usable invite code from a raw QR scan value.
 * Handles invite URLs (/invite/TOKEN) and bare alphanumeric codes.
 */
function extractCode(raw) {
  const urlMatch = raw.match(/(?:invite\/|token=)([A-Za-z0-9]{4,})/i);
  if (urlMatch) return urlMatch[1].toUpperCase();
  if (/^[A-Z0-9]{4,10}$/i.test(raw.trim())) return raw.trim().toUpperCase();
  return null;
}

/* ── JoinGroupModal ───────────────────────────────────────────── */

/**
 * Props:
 *   isOpen    — boolean
 *   onClose   — () => void
 *   onJoin    — (code: string) => void
 *   joining   — boolean
 *   joinError — string | null
 */
const JoinGroupModal = ({ isOpen, onClose, onJoin, joining, joinError }) => {
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  /* Focus text input when modal opens */
  useEffect(() => {
    if (isOpen && !scanning) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen, scanning]);

  /* Reset on close */
  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setCode("");
      setCameraError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /* ── QR scanner ──────────────────────────────────────────────── */

  const stopScanner = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }, []);

  const scanFrame = useCallback(
    async (detector) => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        rafRef.current = requestAnimationFrame(() => scanFrame(detector));
        return;
      }
      try {
        const codes = await detector.detect(videoRef.current);
        if (codes.length > 0) {
          const extracted = extractCode(codes[0].rawValue);
          if (extracted) {
            stopScanner();
            setCode(extracted.slice(0, 10));
            return;
          }
        }
      } catch {
        /* keep scanning on detection errors */
      }
      rafRef.current = requestAnimationFrame(() => scanFrame(detector));
    },
    [stopScanner]
  );

  const startScanner = useCallback(async () => {
    setCameraError(null);
    if (!hasBarcodeDetector) {
      setCameraError(
        "QR scanning isn't supported in this browser. Enter the code manually."
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      setScanning(true);
      /* Attach stream after state update renders the video element */
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
          rafRef.current = requestAnimationFrame(() => scanFrame(detector));
        }
      }, 60);
    } catch (err) {
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Enter the invite code manually."
          : "Could not access the camera. Enter the invite code manually."
      );
    }
  }, [scanFrame]);

  /* ── handlers ────────────────────────────────────────────────── */

  const handleCodeChange = (e) =>
    setCode(
      e.target.value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 10)
    );

  const handleSubmit = () => {
    const trimmed = code.trim();
    if (!trimmed || joining) return;
    onJoin(trimmed);
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  /* ── render ──────────────────────────────────────────────────── */

  return (
    <AnimatedModal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-sm">
      <div className="bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)]/20 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-[var(--color-brand-600)]/15 flex items-center justify-center">
              <UserPlus size={16} className="text-[var(--color-brand-400)]" />
            </span>
            <h2 className="text-lg font-garamond font-bold text-[var(--color-text-primary)]">
              Join a Group
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        {scanning ? (
          /* ── Camera scanner view ── */
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-square">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
              {/* Targeting overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-44 h-44 border-2 border-white/60 rounded-xl" />
              </div>
            </div>
            <p className="text-xs text-center font-spartan text-[var(--color-text-tertiary)]">
              Aim the camera at the invite QR code
            </p>
            <button
              onClick={stopScanner}
              className="btn btn-ghost btn-sm w-full rounded-xl h-10 font-spartan text-sm"
            >
              Cancel scan
            </button>
          </div>
        ) : (
          /* ── Invite code input view ── */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-spartan text-[var(--color-text-tertiary)] mb-2">
                Invite code
              </label>
              <input
                ref={inputRef}
                value={code}
                onChange={handleCodeChange}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Enter invite code"
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                className={`w-full h-11 px-4 rounded-xl text-base font-spartan tracking-[0.2em] text-center bg-[var(--color-surface-elevated)]/60 border transition-colors focus:outline-none ${
                  joinError
                    ? "border-red-500/50 text-red-400"
                    : "border-[var(--color-border-primary)]/20 focus:border-[var(--color-brand-500)]/50 text-[var(--color-text-primary)]"
                }`}
              />
              {joinError && (
                <p className="mt-1.5 text-xs font-spartan text-red-400">
                  {joinError}
                </p>
              )}
            </div>

            {/* QR scan button — shown only on touch/mobile */}
            {isMobileDevice &&
              (cameraError ? (
                <p className="text-xs font-spartan text-[var(--color-text-tertiary)] text-center px-2">
                  {cameraError}
                </p>
              ) : (
                <button
                  onClick={startScanner}
                  className="w-full h-10 flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border-primary)]/20 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-primary)]/40 text-sm font-spartan transition-colors"
                >
                  <QrCode size={15} />
                  Scan QR Code
                </button>
              ))}

            <button
              onClick={handleSubmit}
              disabled={!code.trim() || joining}
              className="btn btn-primary btn-md w-full rounded-xl h-11 font-spartan text-sm disabled:opacity-40 disabled:pointer-events-none"
            >
              {joining ? "Joining…" : "Join"}
            </button>
          </div>
        )}
      </div>
    </AnimatedModal>
  );
};

export default JoinGroupModal;
