import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useVideo, useVideos } from "@/hooks/useVideos";
import { useProgress } from "@/hooks/useProgress";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Play } from "lucide-react";
import VideoCard from "@/components/VideoCard";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return local.slice(0, 2) + "***@" + domain;
}

function formatDate(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}-${d.toLocaleString("default", { month: "short" })}-${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const WATERMARK_POSITIONS = [
  { top: "8%", left: "5%" },
  { top: "8%", left: "55%" },
  { top: "45%", left: "5%" },
  { top: "45%", left: "55%" },
  { top: "78%", left: "5%" },
  { top: "78%", left: "55%" },
];

export default function VideoPlayerScreen({ videoId }: { videoId: string }) {
  const [, setLocation] = useLocation();
  const { video, loading } = useVideo(videoId);
  const { videos } = useVideos();
  const { user } = useAuth();
  const { progress, markWatched } = useProgress(user?.uid);
  const [watermarkIdx, setWatermarkIdx] = useState(0);
  const [watchProgress, setWatchProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setWatermarkIdx((i) => (i + 1) % WATERMARK_POSITIONS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Simulate watch progress (since YouTube iframe doesn't expose events easily)
  useEffect(() => {
    if (!videoId || !user?.uid) return;
    const existing = progress[videoId]?.progress || 0;
    setWatchProgress(existing);

    // Increment progress over time as proxy for watching
    intervalRef.current = setInterval(() => {
      setWatchProgress((prev) => {
        const next = Math.min(prev + 2, 100);
        if (next > prev) {
          markWatched(videoId, next).catch(() => {});
        }
        return next;
      });
    }, 10000); // every 10s, add 2%

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [videoId, user?.uid]);

  const suggestedVideos = videos.filter((v) => v.id !== videoId && v.category === video?.category).slice(0, 3);

  const maskedEmail = user?.email ? maskEmail(user.email) : "";
  const watermarkPos = WATERMARK_POSITIONS[watermarkIdx];

  if (loading) {
    return (
      <div className="w-full max-w-[900px] mx-auto min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="w-full max-w-[900px] mx-auto min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Video not found</p>
        <button onClick={() => setLocation("/home")} className="text-primary text-sm">Go back</button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[900px] mx-auto min-h-screen bg-background flex flex-col">
      {/* Video Area */}
      <div className="relative bg-black w-full" style={{ paddingTop: "56.25%" }}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0&modestbranding=1`}
          title={video.title}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        {/* Watermark overlay */}
        <div
          className="absolute pointer-events-none select-none"
          style={{
            top: watermarkPos.top,
            left: watermarkPos.left,
            transition: "all 1.5s ease",
            zIndex: 10,
            color: "rgba(255,255,255,0.35)",
            fontFamily: "monospace",
            fontSize: "11px",
            lineHeight: 1.4,
            textShadow: "0 1px 3px rgba(0,0,0,0.8)",
            userSelect: "none",
          }}
        >
          <div>{maskedEmail}</div>
          <div>{formatDate()}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-border">
        <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${watchProgress}%` }} />
      </div>

      {/* Info */}
      <div className="flex-1 overflow-y-auto pb-6">
        <div className="px-5 pt-4">
          <button
            data-testid="button-back"
            onClick={() => setLocation("/home")}
            className="flex items-center gap-1 text-primary text-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h2 className="text-lg font-bold text-foreground font-serif leading-snug">{video.title}</h2>
          <p className="text-xs mt-1" style={{ color: "#6DBF67" }}>{video.category} &bull; {video.duration}</p>
          {video.description && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{video.description}</p>}

          {video.tags && video.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {video.tags.map((tag) => (
                <span key={tag} className="text-[10px] bg-card border border-border text-muted-foreground px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {suggestedVideos.length > 0 && (
          <div className="mt-5 px-5">
            <div className="h-px bg-border mb-4" />
            <p className="text-xs font-bold text-muted-foreground mb-3">UP NEXT</p>
            <div className="flex flex-col gap-3">
              {suggestedVideos.map((v) => <VideoCard key={v.id} video={v} compact />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
