import { useVideos } from "@/hooks/useVideos";
import BottomNav from "@/components/BottomNav";
import VideoCard from "@/components/VideoCard";
import { BookOpen } from "lucide-react";
import type { Video } from "@/hooks/useVideos";

export default function CoursesScreen() {
  const { videos, loading } = useVideos();

  const categories = Array.from(new Set(videos.map((v) => v.category)));
  const videosByCategory: Record<string, Video[]> = {};
  categories.forEach((cat) => {
    videosByCategory[cat] = videos.filter((v) => v.category === cat);
  });

  return (
    <div className="w-full max-w-[900px] mx-auto min-h-screen bg-background flex flex-col">
      <div className="px-5 pt-10 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground font-serif">Kisan Family Pro</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Complete course playlist</p>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {loading ? (
          <div className="flex flex-col gap-3 px-5 pt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-card rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          categories.map((cat) => {
            const catVideos = videosByCategory[cat];
            const color = catVideos[0]?.categoryColor || "#2E7D32";
            return (
              <section key={cat} className="mb-2">
                <div className="px-5 pt-5 pb-2 flex items-center gap-2">
                  <div className="w-1.5 h-4 rounded-full" style={{ background: color }} />
                  <p className="text-xs font-bold text-foreground">{cat}</p>
                  <span className="text-[10px] text-muted-foreground ml-auto">{catVideos.length} videos</span>
                </div>
                <div className="flex flex-col gap-2 px-5">
                  {catVideos.map((v) => <VideoCard key={v.id} video={v} compact />)}
                </div>
              </section>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}
