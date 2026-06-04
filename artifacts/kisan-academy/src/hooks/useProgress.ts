import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface VideoProgress {
  videoId: string;
  watched: boolean;
  watchedAt: string;
  progress?: number;
}

export function useProgress(userId: string | undefined) {
  const [progress, setProgress] = useState<Record<string, VideoProgress>>({});
  const [loading, setLoading] = useState(true);

  const loadProgress = async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const snap = await getDocs(collection(db, "progress", userId, "videos"));
      const data: Record<string, VideoProgress> = {};
      snap.docs.forEach((d) => {
        data[d.id] = { videoId: d.id, ...d.data() } as VideoProgress;
      });
      setProgress(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProgress(); }, [userId]);

  const markWatched = async (videoId: string, progressPercent = 100) => {
    if (!userId) return;
    const ref = doc(db, "progress", userId, "videos", videoId);
    const entry: VideoProgress = { videoId, watched: progressPercent >= 80, watchedAt: new Date().toISOString(), progress: progressPercent };
    await setDoc(ref, entry, { merge: true });
    setProgress((prev) => ({ ...prev, [videoId]: entry }));
  };

  return { progress, loading, markWatched, reload: loadProgress };
}
