import { useLocation } from "wouter";
import { Play, Clock } from "lucide-react";
import type { Video } from "@/hooks/useVideos";

interface VideoCardProps {
  video: Video;
  compact?: boolean;
}

export default function VideoCard({ video, compact = false }: VideoCardProps) {
  const [, setLocation] = useLocation();

  if (compact) {
    return (
      <div
        data-testid={`card-video-${video.id}`}
        onClick={() => setLocation(`/player/${video.id}`)}
        className="flex gap-3 items-center p-3 bg-card border border-border rounded-xl cursor-pointer hover:border-primary/40 transition-colors"
      >
        <div
          className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden"
          style={{ background: `${video.categoryColor}22` }}
        >
          <img
            src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
            alt={video.title}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <Play className="absolute w-6 h-6 text-white drop-shadow-md" fill="white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{video.title}</p>
          <p className="text-xs text-muted-foreground mt-1" style={{ color: video.categoryColor }}>{video.category}</p>
          <div className="flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{video.duration}</span>
          </div>
        </div>
        {video.isNew && <span className="text-[9px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded flex-shrink-0">NEW</span>}
      </div>
    );
  }

  return (
    <div
      data-testid={`card-video-${video.id}`}
      onClick={() => setLocation(`/player/${video.id}`)}
      className="min-w-[160px] flex-shrink-0 cursor-pointer group"
    >
      <div className="relative w-40 h-24 rounded-xl overflow-hidden mb-2">
        <img
          src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
          alt={video.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const el = e.target as HTMLImageElement;
            el.style.display = "none";
            el.parentElement!.style.background = video.categoryColor + "44";
          }}
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center">
            <Play className="w-4 h-4 text-white" fill="white" />
          </div>
        </div>
        {video.isNew && <span className="absolute top-2 left-2 text-[9px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded">NEW</span>}
        <span className="absolute bottom-2 right-2 text-[10px] bg-black/70 text-white px-1 py-0.5 rounded">{video.duration}</span>
      </div>
      <p className="text-xs text-foreground line-clamp-2 leading-snug">{video.title}</p>
    </div>
  );
}
