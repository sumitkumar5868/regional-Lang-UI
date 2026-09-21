// ============================================================
// Sample Gestures for Immediate Testing / Offline Fallback
// ------------------------------------------------------------
// Provides test gesture frames (Namaste, Thumbs Up, Peace, Fist)
// so the user can test regional translation even if their hardware
// camera is blocked by iframe security policies or missing.
// ============================================================

export interface SampleGesture {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export const SAMPLE_GESTURES: SampleGesture[] = [
  {
    id: "namaste",
    name: "Namaste / Hello",
    emoji: "🙏",
    description: "Hands pressed together greeting gesture",
  },
  {
    id: "thumbs_up",
    name: "Thumbs Up",
    emoji: "👍",
    description: "Approval / Good / Affirmative sign",
  },
  {
    id: "victory",
    name: "Peace / Victory",
    emoji: "✌️",
    description: "V-sign peace and triumph gesture",
  },
  {
    id: "open_palm",
    name: "Open Palm / Stop",
    emoji: "✋",
    description: "Open five-finger greeting or attention sign",
  },
];

/**
 * Generates a high-contrast 640x480 JPEG data URL representing the gesture frame.
 */
export function generateSampleGestureFrame(gesture: SampleGesture): string {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Dark studio background with subtle radial gradient
  const grad = ctx.createRadialGradient(320, 240, 50, 320, 240, 350);
  grad.addColorStop(0, "#1e293b");
  grad.addColorStop(0.7, "#0f172a");
  grad.addColorStop(1, "#020617");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 640, 480);

  // Subtle grid lines to simulate camera sensor
  ctx.strokeStyle = "rgba(34, 211, 238, 0.08)";
  ctx.lineWidth = 1;
  for (let x = 40; x < 640; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 480);
    ctx.stroke();
  }
  for (let y = 40; y < 480; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(640, y);
    ctx.stroke();
  }

  // Camera HUD brackets
  ctx.strokeStyle = "rgba(34, 211, 238, 0.4)";
  ctx.lineWidth = 2;
  // top-left
  ctx.beginPath();
  ctx.moveTo(30, 60);
  ctx.lineTo(30, 30);
  ctx.lineTo(60, 30);
  ctx.stroke();
  // top-right
  ctx.beginPath();
  ctx.moveTo(580, 30);
  ctx.lineTo(610, 30);
  ctx.lineTo(610, 60);
  ctx.stroke();
  // bottom-left
  ctx.beginPath();
  ctx.moveTo(30, 420);
  ctx.lineTo(30, 450);
  ctx.lineTo(60, 450);
  ctx.stroke();
  // bottom-right
  ctx.beginPath();
  ctx.moveTo(580, 450);
  ctx.lineTo(610, 450);
  ctx.lineTo(610, 420);
  ctx.stroke();

  // Gesture center target ring
  ctx.strokeStyle = "rgba(34, 211, 238, 0.25)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.arc(320, 220, 110, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Render the Gesture Emoji representation
  ctx.font = "110px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(gesture.emoji, 320, 215);

  // Text label below
  ctx.font = "bold 20px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(gesture.name, 320, 370);

  ctx.font = "13px 'Plus Jakarta Sans', system-ui, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(gesture.description, 320, 400);

  // Timestamp watermark
  ctx.font = "11px monospace";
  ctx.fillStyle = "rgba(34, 211, 238, 0.7)";
  ctx.textAlign = "left";
  ctx.fillText(`FRAME: SIMULATED_GESTURE_INPUT [${gesture.id.toUpperCase()}]`, 40, 455);

  return canvas.toDataURL("image/jpeg", 0.9);
}
