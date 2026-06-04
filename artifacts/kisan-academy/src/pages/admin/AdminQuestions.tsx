import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MessageSquare, Send, Loader2 } from "lucide-react";

interface Question {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  question: string;
  answer?: string;
  status: "pending" | "answered";
  createdAt: string;
}

export default function AdminQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "answered">("pending");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      const q = query(collection(db, "questions"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Question)));
      setLoading(false);
    };
    load();
  }, []);

  const sendReply = async (id: string) => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await updateDoc(doc(db, "questions", id), { answer: replyText.trim(), status: "answered" });
      setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, answer: replyText.trim(), status: "answered" } : q));
      setReplyingTo(null);
      setReplyText("");
    } finally {
      setSending(false);
    }
  };

  const filtered = questions.filter((q) => q.status === tab);

  return (
    <div className="p-5">
      <h2 className="text-lg font-bold text-foreground font-serif mb-4">Questions</h2>

      <div className="flex gap-2 mb-4">
        {(["pending", "answered"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs px-4 py-1.5 rounded-lg capitalize transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
          >
            {t} ({questions.filter((q) => q.status === t).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 bg-card rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-sm text-muted-foreground">No {tab} questions</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((q) => (
            <div key={q.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-xs font-semibold text-foreground">{q.userName}</p>
                  <p className="text-[10px] text-muted-foreground">{q.userEmail}</p>
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{new Date(q.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-foreground mb-3 leading-relaxed">{q.question}</p>

              {q.answer && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-3">
                  <p className="text-[10px] text-primary font-semibold mb-1">Your Reply:</p>
                  <p className="text-sm text-foreground">{q.answer}</p>
                </div>
              )}

              {q.status === "pending" && (
                replyingTo === q.id ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      data-testid={`input-reply-${q.id}`}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none transition-colors"
                      rows={3}
                      placeholder="Type your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        data-testid={`button-send-reply-${q.id}`}
                        onClick={() => sendReply(q.id)}
                        disabled={sending || !replyText.trim()}
                        className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-xs font-medium disabled:opacity-60"
                      >
                        {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        Send Reply
                      </button>
                      <button onClick={() => { setReplyingTo(null); setReplyText(""); }} className="text-xs text-muted-foreground px-3 py-2">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    data-testid={`button-reply-${q.id}`}
                    onClick={() => { setReplyingTo(q.id); setReplyText(""); }}
                    className="flex items-center gap-1.5 text-xs text-primary border border-primary/20 rounded-lg px-3 py-1.5"
                  >
                    <MessageSquare className="w-3 h-3" /> Reply
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
