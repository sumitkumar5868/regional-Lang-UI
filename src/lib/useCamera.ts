// ============================================================
// useCamera — High-Reliability Camera Lifecycle Hook
// ------------------------------------------------------------
// Manages media streams, device enumeration, progressive constraint
// fallback ladder, safe video binding with timeouts, and diagnostic error classification.
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";

export type CameraErrorType =
  | "permission_denied"
  | "not_found"
  | "in_use"
  | "security_iframe"
  | "overconstrained"
  | "unsupported"
  | "unknown";

export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
}

export interface CameraState {
  active: boolean;
  starting: boolean;
  error: string | null;
  errorType: CameraErrorType | null;
  facingMode: "user" | "environment";
  supported: boolean;
  isInIframe: boolean;
  devices: CameraDeviceInfo[];
  selectedDeviceId: string | null;
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isInIframe = typeof window !== "undefined" && window.self !== window.top;

  const [state, setState] = useState<CameraState>({
    active: false,
    starting: false,
    error: null,
    errorType: null,
    facingMode: "user",
    supported:
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function",
    isInIframe,
    devices: [],
    selectedDeviceId: null,
  });

  // Enumerate cameras if permitted
  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices
        .filter((d) => d.kind === "videoinput")
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1}`,
        }));
      setState((s) => ({ ...s, devices: videoInputs }));
      return videoInputs;
    } catch {
      return [];
    }
  }, []);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          // ignore track stop errors
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState((s) => ({ ...s, active: false, starting: false }));
  }, []);

  const start = useCallback(
    async (
      facing: "user" | "environment" = state.facingMode,
      targetDeviceId?: string | null
    ) => {
      setState((s) => ({
        ...s,
        starting: true,
        error: null,
        errorType: null,
        facingMode: facing,
      }));

      // Release any prior stream cleanly
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {}
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== "function"
      ) {
        setState((s) => ({
          ...s,
          active: false,
          starting: false,
          supported: false,
          errorType: "unsupported",
          error:
            "Camera API is not supported in this browser. Please ensure you are using a modern browser over HTTPS.",
        }));
        return;
      }

      // Progressive Constraint Fallback Ladder:
      // Try best resolution -> generic facing -> simple video:true -> specific deviceId
      const constraintPlans: MediaStreamConstraints[] = [];

      if (targetDeviceId) {
        constraintPlans.push({
          audio: false,
          video: { deviceId: { exact: targetDeviceId } },
        });
      }

      // Plan 1: Ideal facingMode with HD resolution
      constraintPlans.push({
        audio: false,
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      // Plan 2: Ideal facingMode without resolution restrictions
      constraintPlans.push({
        audio: false,
        video: {
          facingMode: { ideal: facing },
        },
      });

      // Plan 3: Simplest constraint possible (any video device available)
      constraintPlans.push({
        audio: false,
        video: true,
      });

      let stream: MediaStream | null = null;
      let lastError: unknown = null;

      for (const constraints of constraintPlans) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream && stream.getVideoTracks().length > 0) {
            break;
          }
        } catch (planErr) {
          lastError = planErr;
          // Continue to next fallback plan
        }
      }

      if (!stream) {
        const e = lastError as DOMException | Error;
        let msg = "Camera access could not be established.";
        let errType: CameraErrorType = "unknown";

        if (e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError") {
          errType = "permission_denied";
          msg = isInIframe
            ? "Camera permission was blocked or denied in this preview window. Open the app in a new tab or click 'Open in New Tab' below to grant browser permission."
            : "Camera permission denied. Please click the camera icon in your browser address bar to allow camera access.";
        } else if (e?.name === "NotFoundError" || e?.name === "DevicesNotFoundError") {
          errType = "not_found";
          msg = "No webcam or camera device was found on this computer/phone. Connect a camera or upload a gesture image below.";
        } else if (e?.name === "NotReadableError" || e?.name === "TrackStartError") {
          errType = "in_use";
          msg = "Camera is currently in use by another application (e.g. Zoom, Teams, Meet) or the operating system.";
        } else if (e?.name === "SecurityError") {
          errType = "security_iframe";
          msg = "Camera access is restricted by iframe security policy. Please click 'Open in New Tab' to use your webcam directly.";
        } else if (e?.name === "OverconstrainedError") {
          errType = "overconstrained";
          msg = "Camera does not support the requested video format. Trying default settings.";
        } else if (e?.message) {
          msg = e.message;
        }

        setState((s) => ({
          ...s,
          active: false,
          starting: false,
          error: msg,
          errorType: errType,
        }));
        return;
      }

      streamRef.current = stream;

      // Update active device list now that permission is granted
      refreshDevices();

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        video.setAttribute("webkit-playsinline", "true");
        video.muted = true;

        // Guaranteed resolve with timeout to avoid hanging indefinitely
        await new Promise<void>((resolve) => {
          if (video.readyState >= 2) {
            resolve();
            return;
          }
          const onMetadata = () => {
            clearTimeout(timeoutId);
            resolve();
          };
          const timeoutId = setTimeout(onMetadata, 1000);
          video.addEventListener("loadedmetadata", onMetadata, { once: true });
          video.addEventListener("canplay", onMetadata, { once: true });
        });

        try {
          await video.play();
        } catch (playErr) {
          console.warn("video.play() notification:", playErr);
        }
      }

      setState((s) => ({
        ...s,
        active: true,
        starting: false,
        error: null,
        errorType: null,
        facingMode: facing,
        selectedDeviceId: targetDeviceId ?? s.selectedDeviceId,
      }));
    },
    [state.facingMode, isInIframe, refreshDevices]
  );

  const switchCamera = useCallback(() => {
    const next = state.facingMode === "user" ? "environment" : "user";
    if (state.active) {
      start(next);
    } else {
      setState((s) => ({ ...s, facingMode: next }));
    }
  }, [state.facingMode, state.active, start]);

  const selectDevice = useCallback(
    (deviceId: string) => {
      start(state.facingMode, deviceId);
    },
    [state.facingMode, start]
  );

  // Stop tracks on component unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {}
        });
        streamRef.current = null;
      }
    };
  }, []);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      return null;
    }
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // Handle front camera mirroring on capture so preview matches video
      if (state.facingMode === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.85);
    } catch (err) {
      console.error("Frame capture error:", err);
      return null;
    }
  }, [state.facingMode]);

  return {
    videoRef,
    state,
    start,
    stop,
    switchCamera,
    selectDevice,
    captureFrame,
    refreshDevices,
  };
}
