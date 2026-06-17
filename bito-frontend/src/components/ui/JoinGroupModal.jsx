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
 *   initialScan — boolean
 */
const JoinGroupModal = ({ isOpen, onClose, onJoin, joining, joinError, joinSuccess, initialScan = false }) => {
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  /* Focus text input when modal opens */
  useEffect(() => {
    if (isOpen && !scanning && !initialScan) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen, scanning, initialScan]);

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

  /* Trigger scanner on open if initialScan is true */
  useEffect(() => {
    if (isOpen && initialScan && hasBarcodeDetector) {
      startScanner();
    }
  }, [isOpen, initialScan, startScanner]);

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
      <div className="grp bg-[var(--surface)] rounded-[16px] border border-[var(--line-2)] p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-[9px] bg-[var(--signal)]/15 flex items-center justify-center">
              <UserPlus size={16} className="text-[var(--signal)]" />
            </span>
            <h2 className="grp-display text-xl font-bold text-[var(--ink)]">
              Join a Group
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-[9px] text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        {scanning ? (
          /* ── Camera scanner view ── */
          <div className="space-y-4">
            <div className="relative rounded-[12px] overflow-hidden bg-black aspect-square">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
              {/* Targeting overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-44 h-44 border-2 border-[var(--signal)]/70 rounded-[12px]" />
              </div>
            </div>
            <p className="grp-mono text-[10px] text-center text-[var(--ink-3)] uppercase tracking-wider">
              Aim the camera at the invite QR code
            </p>
            <button onClick={stopScanner} className="grp-btn w-full">
              Cancel scan
            </button>
          </div>
        ) : (
          /* ── Invite code input view ── */
          <div className="space-y-4">
            <div>
              <label className="grp-kicker block mb-2">Invite code</label>
              <input
                ref={inputRef}
                value={code}
                onChange={handleCodeChange}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="ENTER CODE"
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                className={`grp-input h-12 grp-mono text-lg tracking-[0.3em] text-center font-bold ${
                  joinError ? "border-[var(--rose)] text-[var(--rose)]" : "text-[var(--signal)]"
                }`}
              />
              {joinError && (
                <p className="mt-1.5 grp-mono text-[11px] text-[var(--rose)]">{joinError}</p>
              )}
              {joinSuccess && (
                <p className="mt-1.5 grp-mono text-[11px] text-[var(--signal)]">Valid code! Joining...</p>
              )}
            </div>

            {/* QR scan button — shown only on touch/mobile */}
            {isMobileDevice &&
              (cameraError ? (
                <p className="grp-mono text-[10px] text-[var(--ink-3)] text-center px-2 uppercase tracking-wider">
                  {cameraError}
                </p>
              ) : (
                <button onClick={startScanner} className="grp-btn w-full">
                  <QrCode size={15} weight="bold" />
                  Scan QR Code
                </button>
              ))}

            <button
              onClick={handleSubmit}
              disabled={!code.trim() || joining}
              className="grp-btn grp-btn--signal w-full disabled:opacity-40 disabled:pointer-events-none"
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
