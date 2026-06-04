import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Video {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  category: string;
  categoryColor: string;
  duration: string;
  tags: string[];
  order: number;
  createdAt: string;
  isNew?: boolean;
}

export function useVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(collection(db, "videos"), orderBy("order"));
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Video));
        setVideos(data);
      } catch (e) {
        setError("Failed to load videos");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { videos, loading, error };
}

export function useVideo(videoId: string) {
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!videoId) return;
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, "videos", videoId));
        if (snap.exists()) {
          setVideo({ id: snap.id, ...snap.data() } as Video);
        }
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [videoId]);

  return { video, loading };
}
