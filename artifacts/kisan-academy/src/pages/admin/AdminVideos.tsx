import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Edit2, Trash2, X, Save, Loader2, Play } from "lucide-react";
import type { Video } from "@/hooks/useVideos";

type EditableVideo = Omit<Video, "id"> & { id?: string };

const EMPTY: EditableVideo = { title: "", description: "", youtubeId: "", category: "", categoryColor: "#2E7D32", duration: "", tags: [], order: 99, createdAt: new Date().toISOString(), isNew: false };

export default function AdminVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditableVideo | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState("");

  const load = async () => {
    const snap = await getDocs(query(collection(db, "videos"), orderBy("order")));
    setVideos(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Video)));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing({ ...EMPTY }); setTagsInput(""); };
  const openEdit = (v: Video) => { setEditing({ ...v }); setTagsInput(v.tags?.join(", ") || ""); };
  const closeEdit = () => { setEditing(null); setTagsInput(""); };

  const save = async () => {
    if (!editing || !editing.title || !editing.youtubeId) return;
    setSaving(true);
    try {
      const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
      const data: Omit<Video, "id"> = { ...editing, tags, createdAt: editing.createdAt || new Date().toISOString() };
      if (editing.id) {
        await updateDoc(doc(db, "videos", editing.id), data as Record<string, unknown>);
      } else {
        const id = `vid_${Date.now()}`;
        await setDoc(doc(db, "videos", id), data);
      }
      await load();
      closeEdit();
    } finally {
      setSaving(false);
    }
  };

  const deleteVideo = async (id: string) => {
    if (!confirm("Delete this video?")) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, "videos", id));
      setVideos((prev) => prev.filter((v) => v.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-foreground font-serif">Videos</h2>
        <button
          data-testid="button-add-video"
          onClick={openNew}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Video
        </button>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-foreground">{editing.id ? "Edit Video" : "Add New Video"}</p>
            <button onClick={closeEdit}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
              <input data-testid="input-video-title" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Video title" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">YouTube ID *</label>
              <input data-testid="input-youtube-id" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors font-mono" value={editing.youtubeId} onChange={(e) => setEditing({ ...editing, youtubeId: e.target.value })} placeholder="e.g. rSr185gCqmE" />
              {editing.youtubeId && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={`https://img.youtube.com/vi/${editing.youtubeId}/mqdefault.jpg`} alt="thumb" className="w-20 h-12 object-cover rounded" />
                  <Play className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Preview thumbnail</span>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <input className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} placeholder="e.g. Disease Management" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
                <input className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors" value={editing.duration} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} placeholder="22:10" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Order</label>
                <input type="number" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors" value={editing.order} onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <textarea className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors resize-none" rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Video description..." />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tags (comma-separated)</label>
              <input className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="pruning, apple, HDP" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isNew" checked={!!editing.isNew} onChange={(e) => setEditing({ ...editing, isNew: e.target.checked })} />
              <label htmlFor="isNew" className="text-sm text-foreground">Mark as NEW</label>
            </div>
            <button
              data-testid="button-save-video"
              onClick={save}
              disabled={saving || !editing.title || !editing.youtubeId}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium disabled:opacity-60 transition-opacity hover:opacity-90"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Video"}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-card rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="flex flex-col gap-2">
          {videos.map((v) => (
            <div key={v.id} data-testid={`video-item-${v.id}`} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
              <img src={`https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`} alt={v.title} className="w-16 h-10 object-cover rounded-lg flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{v.title}</p>
                <p className="text-xs text-muted-foreground">{v.category} &bull; {v.duration}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors"><Edit2 className="w-4 h-4 text-muted-foreground" /></button>
                <button data-testid={`button-delete-${v.id}`} disabled={deleting === v.id} onClick={() => deleteVideo(v.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-40">
                  {deleting === v.id ? <Loader2 className="w-4 h-4 animate-spin text-destructive" /> : <Trash2 className="w-4 h-4 text-destructive" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
