import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useVideos } from "@/hooks/useVideos";
import { useProgress } from "@/hooks/useProgress";
import BottomNav from "@/components/BottomNav";
import VideoCard from "@/components/VideoCard";
import { useLocation } from "wouter";
import { Search, X, Play, Clock } from "lucide-react";
import kisanLogo from "@assets/Green_Leaf_Aesthetic_Organic_Skincare_Logo_20260604_180821_000_1780580817882.png";
import type { Video } from "@/hooks/useVideos";

export default function HomeScreen() {
  const { user } = useAuth();
  const { videos, loading } = useVideos();
  const { progress } = useProgress(user?.uid);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const firstName = user?.name?.split(" ")[0] || "Farmer";

  const continueWatching = videos.filter(
    (v) => progress[v.id] && !progress[v.id].watched && (progress[v.id].progress || 0) > 0
  );

  const recentlyAdded = [...videos]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const categories = Array.from(new Set(videos.map((v) => v.category)));
  const videosByCategory: Record<string, Video[]> = {};
  categories.forEach((cat) => {
    videosByCategory[cat] = videos.filter((v) => v.category === cat);
  });

  const searchResults = searchQuery.trim().length >= 2
    ? videos.filter((v) =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const showSearch = searchQuery.trim().length >= 2;

  return (
    <div className="w-full max-w-[900px] mx-auto min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-10 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <img src={user.photoURL} alt={user.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-[#1B5E20] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.name?.slice(0, 2).toUpperCase() || "KA"}
            </div>
          )}
          <div>
            <p className="text-base font-bold text-foreground font-serif">Namaste, {firstName}</p>
            <p className="text-xs italic" style={{ color: "#6DBF67" }}>Aapka orchard, aapka gyan</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-1.5 border border-border flex-shrink-0">
          <img src={kisanLogo} alt="Kisan Academy" className="h-8 w-auto object-contain" />
        </div>
      </div>

      {/* Search */}
      <div className="px-5 py-3">
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            data-testid="input-search"
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {showSearch ? (
          <div className="px-5">
            <p className="text-xs font-semibold text-primary mb-3">{searchResults.length} results for "{searchQuery}"</p>
            {searchResults.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">No videos found</p>
                <p className="text-xs text-muted-foreground mt-1">Try a different keyword</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {searchResults.map((v) => <VideoCard key={v.id} video={v} compact />)}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Continue Watching */}
            {continueWatching.length > 0 && (
              <section className="mb-2">
                <p className="px-5 pt-4 pb-2 text-xs font-bold text-primary">CONTINUE WATCHING</p>
                <div className="flex gap-3 overflow-x-auto px-5 pb-3 no-scrollbar">
                  {continueWatching.map((v) => (
                    <div
                      key={v.id}
                      data-testid={`card-continue-${v.id}`}
                      onClick={() => setLocation(`/player/${v.id}`)}
                      className="min-w-[280px] flex-shrink-0 bg-card border border-border rounded-xl p-3 flex gap-3 cursor-pointer"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 relative">
                        <img src={`https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`} alt={v.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="w-5 h-5 text-white" fill="white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{v.title}</p>
                        <p className="text-xs mt-1" style={{ color: "#6DBF67" }}>{v.category}</p>
                        <div className="mt-2 h-1 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${progress[v.id]?.progress || 0}%` }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{progress[v.id]?.progress || 0}% watched</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recently Added */}
            <section className="mb-2">
              <p className="px-5 pt-4 pb-2 text-xs font-bold text-primary">RECENTLY ADDED</p>
              <div className="flex gap-3 overflow-x-auto px-5 pb-3 no-scrollbar">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="min-w-[160px] flex-shrink-0">
                      <div className="w-40 h-24 rounded-xl bg-card animate-pulse mb-2" />
                      <div className="h-3 bg-card rounded animate-pulse w-28" />
                    </div>
                  ))
                ) : (
                  recentlyAdded.map((v) => <VideoCard key={v.id} video={v} />)
                )}
              </div>
            </section>

            {/* By Category */}
            {loading ? null : categories.map((cat) => {
              const catVideos = videosByCategory[cat];
              const color = catVideos[0]?.categoryColor || "#2E7D32";
              return (
                <section key={cat} className="mb-2">
                  <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                    <div className="w-1.5 h-4 rounded-full" style={{ background: color }} />
                    <p className="text-xs font-bold text-primary">{cat.toUpperCase()}</p>
                  </div>
                  <div className="flex gap-3 overflow-x-auto px-5 pb-3 no-scrollbar">
                    {catVideos.map((v) => <VideoCard key={v.id} video={v} />)}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
