// ============================================================
// AICamera — High-Reliability Vision & Gesture Input Component
// ------------------------------------------------------------
// Supports live webcam, progressive device fallback, multi-device selection,
// iframe diagnostic recovery ("Open in New Tab"), custom photo upload,
// and quick test gesture frames for guaranteed functionality.
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CameraOff,
  ChevronDown,
  ExternalLink,
  Eye,
  ImageIcon,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Repeat,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import { useCamera } from "@/lib/useCamera";
import { sendFrameToBackend, type AIResult, type AIStatus } from "@/lib/api";
import { getActiveFrameInterval } from "@/lib/config";
import {
  SAMPLE_GESTURES,
  generateSampleGestureFrame,
  type SampleGesture,
} from "@/lib/sampleGestures";

interface Props {
  language: string;
  realtime: boolean;
  onToggleRealtime?: () => void;
  onResult: (r: AIResult, imageData?: string) => void;
  onStatus: (s: AIStatus) => void;
  onError: (msg: string | null) => void;
  currentStatus: AIStatus;
}

export default function AICamera({
  language,
  realtime,
  onToggleRealtime,
  onResult,
  onStatus,
  onError,
  currentStatus,
}: Props) {
  const {
    videoRef,
    state,
    start,
    stop,
    switchCamera,
    selectDevice,
    captureFrame,
    refreshDevices,
  } = useCamera();

  const [preview, setPreview] = useState<string | null>(null);
  const [previewSource, setPreviewSource] = useState<"camera" | "upload" | "sample">("camera");
  const [analyzing, setAnalyzing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDevicePicker, setShowDevicePicker] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const processingRef = useRef(false);
  const rtTimerRef = useRef<number | null>(null);

  // Sync camera status to parent
  useEffect(() => {
    if (state.starting) {
      onStatus("Camera starting...");
    } else if (state.active && !analyzing && currentStatus === "Camera starting...") {
      onStatus("Camera ready");
    }
  }, [state.starting, state.active, analyzing, currentStatus, onStatus]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Core analysis routine (shared by camera frames, uploads, and test samples)
  const analyze = useCallback(
    async (image: string) => {
      if (processingRef.current) return;
      processingRef.current = true;
      setAnalyzing(true);
      onStatus("Analyzing gesture...");
      onError(null);

      try {
        onStatus("Processing...");
        const result = await sendFrameToBackend(image, language);

        if (!result.text && !result.gesture && !result.emoji) {
          onStatus("No gesture detected");
        } else {
          onStatus("Result detected");
        }

        onResult(result, image);
      } catch (err: unknown) {
        const e = err as { kind?: string; message?: string };
        if (e?.kind === "backend" || e?.kind === "network") {
          onStatus("Backend offline");
        } else {
          onStatus("Error");
        }
        onError(e?.message ?? "An error occurred during AI analysis.");
      } finally {
        setAnalyzing(false);
        processingRef.current = false;
      }
    },
    [language, onResult, onStatus, onError]
  );

  // Manual freeze-frame capture
  const handleCapture = () => {
    const img = captureFrame();
    if (!img) return;
    setPreview(img);
    setPreviewSource("camera");
    stop();
    onStatus("Camera ready");
  };

  const handleRetake = () => {
    setPreview(null);
    start();
  };

  const handleAnalyzeCaptured = () => {
    if (preview) {
      analyze(preview);
    }
  };

  // Direct one-click capture & analyze from active camera stream
  const handleDirectAnalyze = () => {
    const img = captureFrame();
    if (!img) return;
    analyze(img);
  };

  // Real-time AI loop
  useEffect(() => {
    if (!realtime || !state.active) {
      if (rtTimerRef.current) {
        clearInterval(rtTimerRef.current);
        rtTimerRef.current = null;
      }
      return;
    }

    const interval = getActiveFrameInterval();
    rtTimerRef.current = window.setInterval(() => {
      if (!processingRef.current && state.active) {
        const img = captureFrame();
        if (img) {
          analyze(img);
        }
      }
    }, interval);

    return () => {
      if (rtTimerRef.current) {
        clearInterval(rtTimerRef.current);
        rtTimerRef.current = null;
      }
    };
  }, [realtime, state.active, captureFrame, analyze]);

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setPreview(dataUrl);
        setPreviewSource("upload");
        stop();
        analyze(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    // Reset file input value so re-selecting same file triggers event
    e.target.value = "";
  };

  // Handle sample gesture selection
  const handleSelectSampleGesture = (gesture: SampleGesture) => {
    const sampleFrame = generateSampleGestureFrame(gesture);
    if (!sampleFrame) return;
    setPreview(sampleFrame);
    setPreviewSource("sample");
    stop();
    analyze(sampleFrame);
  };

  const handleOpenInNewTab = () => {
    window.open(window.location.href, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      id="ai-camera-container"
      ref={containerRef}
      className={`rounded-3xl glass p-5 border border-white/10 shadow-2xl transition-all ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none bg-slate-950 p-6 flex flex-col justify-center" : ""
      }`}
    >
      {/* Hidden file input for gesture image upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
        aria-label="Upload gesture image"
      />

      {/* Camera Header Bar */}
      <div className="flex items-center justify-between mb-3 w-full">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            AI Vision Camera
          </h3>
          <span className="hidden sm:inline-block text-[11px] text-slate-500 font-mono">
            {state.active
              ? state.facingMode === "user"
                ? "Front (Webcam)"
                : "Rear Camera"
              : preview
              ? previewSource === "upload"
                ? "Uploaded Image"
                : previewSource === "sample"
                ? "Test Sample Gesture"
                : "Frozen Frame"
              : "Standby"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {realtime && (
            <div
              id="ai-analysis-active-badge"
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[11px] font-semibold animate-pulse"
            >
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span>● AI ACTIVE</span>
            </div>
          )}

          {state.active && (
            <div
              id="camera-live-badge"
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-bold tracking-widest"
            >
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              <span>LIVE</span>
            </div>
          )}

          {/* Device switcher if multiple cameras exist */}
          {state.devices.length > 1 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDevicePicker((p) => !p)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs glass border border-white/10 text-slate-300 hover:text-cyan-300"
                title="Switch Camera Device"
              >
                <Camera className="h-3 w-3" />
                <span className="hidden sm:inline">Camera</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {showDevicePicker && (
                <div className="absolute right-0 mt-1 w-48 rounded-xl bg-slate-900 border border-white/15 shadow-xl py-1 z-30">
                  {state.devices.map((device, i) => (
                    <button
                      key={device.deviceId || i}
                      type="button"
                      onClick={() => {
                        selectDevice(device.deviceId);
                        setShowDevicePicker(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs truncate hover:bg-cyan-500/20 hover:text-cyan-200 transition ${
                        state.selectedDeviceId === device.deviceId
                          ? "text-cyan-400 font-bold bg-cyan-500/10"
                          : "text-slate-300"
                      }`}
                    >
                      {device.label || `Camera ${i + 1}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            id="camera-fullscreen-button"
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main Viewport Box */}
      <div
        className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black/80 border transition-all ${
          analyzing
            ? "border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.25)]"
            : "border-cyan-500/20"
        } ${isFullscreen ? "max-w-4xl max-h-[75vh]" : ""}`}
      >
        {/* Live Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            state.active ? "opacity-100" : "opacity-0 pointer-events-none"
          } ${state.facingMode === "user" ? "-scale-x-100" : ""}`}
        />

        {/* Captured/Uploaded preview image */}
        {preview && (
          <img
            src={preview}
            alt="Gesture input frame"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* Idle / Camera Standby State */}
        {!state.active && !preview && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6 bg-slate-950/70 backdrop-blur-xs">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-cyan-950/50 border border-cyan-500/30">
              <Camera className="h-8 w-8 text-cyan-400" />
              {state.starting && (
                <div className="absolute inset-0 rounded-full border border-cyan-400 animate-ping opacity-50" />
              )}
            </div>

            <div className="space-y-1 max-w-sm">
              <p className="text-sm font-semibold text-slate-100">
                {state.starting ? "Requesting Camera Access…" : "AI Vision Camera"}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {state.starting
                  ? "Please click 'Allow' if your browser prompts for camera permissions."
                  : "Start your webcam for real-time recognition, or upload a photo / test sample gesture."}
              </p>
            </div>

            {/* Diagnostic Alert Box when Camera fails */}
            {state.error && (
              <div className="mt-2 p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs max-w-md text-left space-y-2 shadow-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-rose-300">Camera Issue Detected:</span>
                    <p className="mt-1 text-rose-200/90 leading-relaxed">{state.error}</p>
                  </div>
                </div>

                {/* Helpful recovery action if inside iframe or permission denied */}
                {(state.errorType === "permission_denied" ||
                  state.errorType === "security_iframe" ||
                  state.isInIframe) && (
                  <div className="pt-2 border-t border-rose-500/20 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-rose-300">
                      iFrames often restrict webcams:
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenInNewTab}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500 text-slate-950 font-bold text-xs hover:bg-rose-400 transition"
                    >
                      <ExternalLink className="h-3 w-3" /> Open in New Tab
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* HUD corners (static alignment frame when camera is live) */}
        {state.active && !preview && (
          <>
            <div className="hud-corner top-3 left-3 border-l-2 border-t-2 rounded-tl-lg border-cyan-400/50" />
            <div className="hud-corner top-3 right-3 border-r-2 border-t-2 rounded-tr-lg border-cyan-400/50" />
            <div className="hud-corner bottom-3 left-3 border-l-2 border-b-2 rounded-bl-lg border-cyan-400/50" />
            <div className="hud-corner bottom-3 right-3 border-r-2 border-b-2 rounded-br-lg border-cyan-400/50" />
          </>
        )}

        {/* Active Scanning Overlay (ONLY SHOWN DURING IN-FLIGHT PROCESSING) */}
        {analyzing && (
          <>
            <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent scanline shadow-[0_0_16px_rgba(34,211,238,0.9)] z-20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 backdrop-blur-[2px] z-10">
              <div className="relative h-14 w-14">
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 animate-spin" />
                <Loader2 className="absolute inset-0 m-auto h-6 w-6 text-cyan-300 animate-spin" />
              </div>
              <span className="text-xs font-semibold tracking-wider text-cyan-200 bg-slate-950/80 px-3 py-1 rounded-full border border-cyan-500/30">
                Analyzing gesture...
              </span>
            </div>
          </>
        )}
      </div>

      {/* Control Action Buttons */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
        {/* State 1: Camera OFF & No Preview */}
        {!state.active && !preview && (
          <>
            <button
              id="btn-start-camera"
              type="button"
              onClick={() => start()}
              disabled={state.starting}
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:opacity-50 cursor-pointer"
            >
              {state.starting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Connecting Camera...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" /> Start Camera
                </>
              )}
            </button>

            <button
              id="btn-upload-gesture"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-xl glass px-4 py-2.5 text-sm font-medium text-slate-200 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer"
            >
              <Upload className="h-4 w-4" /> Upload Photo
            </button>

            {state.isInIframe && (
              <button
                id="btn-open-new-tab"
                type="button"
                onClick={handleOpenInNewTab}
                className="flex items-center gap-2 rounded-xl glass px-3.5 py-2.5 text-sm text-slate-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer"
                title="Open app directly in a new tab for native camera permissions"
              >
                <ExternalLink className="h-4 w-4" /> Open in Tab
              </button>
            )}
          </>
        )}

        {/* State 2: Camera is LIVE */}
        {state.active && !preview && (
          <>
            <button
              id="btn-analyze-gesture-direct"
              type="button"
              onClick={handleDirectAnalyze}
              disabled={analyzing}
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(34,211,238,0.35)] disabled:opacity-50 cursor-pointer"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" /> Analyze Gesture
                </>
              )}
            </button>

            <button
              id="btn-capture-frame"
              type="button"
              onClick={handleCapture}
              disabled={analyzing}
              className="flex items-center gap-2 rounded-xl glass px-4 py-2.5 text-sm font-medium text-slate-200 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Camera className="h-4 w-4" /> Freeze Frame
            </button>

            {onToggleRealtime && (
              <button
                id="btn-toggle-realtime"
                type="button"
                onClick={onToggleRealtime}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all border cursor-pointer ${
                  realtime
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                    : "glass text-slate-200 hover:text-cyan-300 border-white/10 hover:border-cyan-500/30"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                {realtime ? "Stop Real-Time" : "Start Real-Time"}
              </button>
            )}

            <button
              id="btn-switch-camera"
              type="button"
              onClick={switchCamera}
              className="flex items-center gap-2 rounded-xl glass px-3.5 py-2.5 text-sm text-slate-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer"
              title="Flip camera"
            >
              <Repeat className="h-4 w-4" /> Flip
            </button>

            <button
              id="btn-stop-camera"
              type="button"
              onClick={stop}
              className="flex items-center gap-2 rounded-xl glass px-3.5 py-2.5 text-sm text-slate-300 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition-all cursor-pointer"
            >
              <CameraOff className="h-4 w-4" /> Stop
            </button>
          </>
        )}

        {/* State 3: Frozen Frame or Uploaded/Sample Preview */}
        {preview && (
          <>
            <button
              id="btn-retake-frame"
              type="button"
              onClick={handleRetake}
              className="flex items-center gap-2 rounded-xl glass px-4 py-2.5 text-sm font-medium text-slate-200 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" /> {previewSource === "camera" ? "Live Camera" : "Clear Frame"}
            </button>

            <button
              id="btn-upload-another"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-xl glass px-3.5 py-2.5 text-sm text-slate-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer"
            >
              <Upload className="h-4 w-4" /> Choose Another
            </button>

            <button
              id="btn-analyze-gesture-frozen"
              type="button"
              onClick={handleAnalyzeCaptured}
              disabled={analyzing}
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(34,211,238,0.35)] disabled:opacity-50 cursor-pointer"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" /> Re-Analyze
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Quick Test Gestures Bar (Instant Testing Without Webcam) */}
      <div className="mt-4 pt-3 border-t border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5 text-cyan-400" />
            Quick Test Gestures (No Camera Needed)
          </span>
          <span className="text-[10px] text-slate-500">1-click test</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SAMPLE_GESTURES.map((gesture) => (
            <button
              key={gesture.id}
              type="button"
              onClick={() => handleSelectSampleGesture(gesture)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl glass border border-white/10 hover:border-cyan-400/40 hover:bg-cyan-500/10 text-left transition-all cursor-pointer group"
            >
              <span className="text-xl group-hover:scale-125 transition-transform">
                {gesture.emoji}
              </span>
              <div className="truncate">
                <p className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 truncate">
                  {gesture.name}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {gesture.id}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
