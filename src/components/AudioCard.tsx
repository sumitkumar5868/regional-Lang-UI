// ============================================================
// AudioCard — Real AI Voice Output Player
// ------------------------------------------------------------
// Only plays genuine audio data (audio_url or base64 data URI)
// returned by the real backend. Does NOT generate fake synthetic audio.
// ============================================================

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Square, Volume2, VolumeX } from "lucide-react";

interface Props {
  audioUrl: string; // empty string when backend has not returned audio
  active: boolean; // whether AI is processing
}

export default function AudioCard({ audioUrl, active }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onTime = () => {
      setCurrentTime(a.currentTime);
      setProgress(a.duration ? a.currentTime / a.duration : 0);
    };
    const onLoadedMetadata = () => {
      setDuration(a.duration || 0);
    };
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };
    const onError = () => {
      setPlaying(false);
    };

    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onLoadedMetadata);
    a.addEventListener("ended", onEnd);
    a.addEventListener("error", onError);

    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onLoadedMetadata);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("error", onError);
    };
  }, [audioUrl]);

  const play = () => {
    if (!audioRef.current || !audioUrl) return;
    audioRef.current
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  };

  const pause = () => {
    audioRef.current?.pause();
    setPlaying(false);
  };

  const replay = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    play();
  };

  const stop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setProgress(val);
    if (audioRef.current && duration) {
      audioRef.current.currentTime = val * duration;
    }
  };

  const formatTime = (sec: number) => {
    if (!isFinite(sec) || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const hasAudio = Boolean(audioUrl && audioUrl.trim().length > 0);

  return (
    <div id="audio-output-card" className="glass rounded-2xl p-5 border border-white/10 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Volume2 className="h-5 w-5 text-cyan-400" />
          <h3 className="text-xs font-bold tracking-wider uppercase text-slate-300">
            AI Voice Output
          </h3>
        </div>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
            hasAudio
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
              : active
              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse"
              : "bg-slate-800 text-slate-400 border-slate-700"
          }`}
        >
          {hasAudio ? "AUDIO READY" : active ? "ANALYZING…" : "STANDBY"}
        </span>
      </div>

      <audio ref={audioRef} src={hasAudio ? audioUrl : undefined} preload="metadata" />

      {/* Waveform Visualization */}
      <div className="flex items-end justify-center gap-1 h-14 mb-4 bg-slate-900/40 rounded-xl p-2 border border-white/5">
        {Array.from({ length: 26 }).map((_, i) => (
          <span
            key={i}
            className={`w-1 rounded-full transition-all duration-150 ${
              playing
                ? "bg-gradient-to-t from-cyan-500 to-blue-400 animate-pulse"
                : hasAudio
                ? "bg-cyan-900/60"
                : "bg-slate-800/40"
            }`}
            style={{
              height: `${15 + Math.abs(Math.sin((i + 1) * 0.6)) * 75}%`,
              opacity: hasAudio ? (playing ? 1 : 0.6) : 0.25,
            }}
          />
        ))}
      </div>

      {/* Progress slider */}
      <div className="space-y-1 mb-4">
        <div className="relative flex items-center">
          <input
            id="audio-progress-slider"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={progress}
            onChange={handleSeek}
            disabled={!hasAudio}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{duration > 0 ? formatTime(duration) : hasAudio ? "--:--" : "0:00"}</span>
        </div>
      </div>

      {/* Controls & Volume */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-white/5">
        <div className="flex items-center gap-2">
          <button
            id="audio-play-button"
            type="button"
            onClick={playing ? pause : play}
            disabled={!hasAudio}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            aria-label={playing ? "Pause" : "Play Audio"}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>
          <button
            id="audio-replay-button"
            type="button"
            onClick={replay}
            disabled={!hasAudio}
            className="flex h-9 w-9 items-center justify-center rounded-xl glass text-slate-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 transition-all disabled:opacity-30 cursor-pointer"
            aria-label="Replay"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            id="audio-stop-button"
            type="button"
            onClick={stop}
            disabled={!hasAudio}
            className="flex h-9 w-9 items-center justify-center rounded-xl glass text-slate-300 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition-all disabled:opacity-30 cursor-pointer"
            aria-label="Stop"
          >
            <Square className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Volume slider */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            disabled={!hasAudio}
            className="text-slate-400 hover:text-slate-200 transition disabled:opacity-30 cursor-pointer"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4 text-rose-400" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <input
            id="audio-volume-slider"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            disabled={!hasAudio}
            aria-label="Audio volume"
            className="w-20 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {!hasAudio && (
        <div className="mt-3 p-2.5 rounded-lg bg-slate-900/50 border border-white/5 text-center">
          <p className="text-xs text-slate-400">
            Audio output unavailable (Backend did not return voice synthesis for this frame)
          </p>
        </div>
      )}
    </div>
  );
}

