import { useState } from "react";
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Bell, Send, Loader2 } from "lucide-react";
import { useEffect } from "react";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  sentAt: string;
  sentBy: string;
}

const TYPES = ["New Lesson", "Webinar Reminder", "Announcement", "Certificate Approved"];

export default function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState(TYPES[0]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [history, setHistory] = useState<Notification[]>([]);

  useEffect(() => {
    const load = async () => {
      const q = query(collection(db, "notifications"), orderBy("sentAt", "desc"));
      const snap = await getDocs(q);
      setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification)));
    };
    load();
  }, []);

  const send = async () => {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    try {
      const notif = {
        title: title.trim(),
        body: body.trim(),
        type,
        sentAt: new Date().toISOString(),
        sentBy: "admin",
      };
      const docRef = await addDoc(collection(db, "notifications"), notif);
      setHistory((prev) => [{ id: docRef.id, ...notif }, ...prev]);
      setTitle("");
      setBody("");
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-5">
      <h2 className="text-lg font-bold text-foreground font-serif mb-1">Notifications</h2>
      <p className="text-xs text-muted-foreground mb-5">Send announcements to students</p>

      <div className="bg-card border border-border rounded-2xl p-4 mb-5">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Type</label>
            <select
              data-testid="select-notif-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors"
            >
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Title</label>
            <input
              data-testid="input-notif-title"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Message</label>
            <textarea
              data-testid="input-notif-body"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none transition-colors"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Notification message..."
            />
          </div>
          <button
            data-testid="button-send-notification"
            onClick={send}
            disabled={sending || !title.trim() || !body.trim()}
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium disabled:opacity-60 transition-opacity hover:opacity-90"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Sending..." : "Send Notification"}
          </button>
          {sent && <p className="text-xs text-primary text-center">Notification logged successfully!</p>}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-muted-foreground mb-3">NOTIFICATION HISTORY</p>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-30" />
            <p className="text-sm text-muted-foreground">No notifications sent yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((n) => (
              <div key={n.id} className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{n.type}</span>
                    <p className="text-sm font-medium text-foreground mt-1.5">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">{new Date(n.sentAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
