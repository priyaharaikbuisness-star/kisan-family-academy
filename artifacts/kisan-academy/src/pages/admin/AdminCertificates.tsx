import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Award, Check, X, Loader2 } from "lucide-react";

interface Certificate {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
}

export default function AdminCertificates() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");

  useEffect(() => {
    const load = async () => {
      const q = query(collection(db, "certificates"), orderBy("requestedAt", "desc"));
      const snap = await getDocs(q);
      setCerts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Certificate)));
      setLoading(false);
    };
    load();
  }, []);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    setUpdating(id);
    try {
      await updateDoc(doc(db, "certificates", id), { status });
      setCerts((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
    } finally {
      setUpdating(null);
    }
  };

  const filtered = certs.filter((c) => c.status === tab);

  return (
    <div className="p-5">
      <h2 className="text-lg font-bold text-foreground font-serif mb-1">Certificate Requests</h2>
      <p className="text-xs text-muted-foreground mb-4">Certificates are sent manually by admin after approval</p>

      <div className="flex gap-2 mb-4">
        {(["pending", "approved", "rejected"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
          >
            {t} ({certs.filter((c) => c.status === t).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-card rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Award className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-sm text-muted-foreground">No {tab} requests</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((c) => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{c.userName}</p>
                  <p className="text-xs text-muted-foreground">{c.userEmail}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Requested {new Date(c.requestedAt).toLocaleDateString()}</p>
                </div>
                {c.status !== "pending" && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.status === "approved" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                    {c.status}
                  </span>
                )}
              </div>
              {c.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    data-testid={`button-approve-cert-${c.id}`}
                    disabled={updating === c.id}
                    onClick={() => updateStatus(c.id, "approved")}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium disabled:opacity-60"
                  >
                    {updating === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Approve
                  </button>
                  <button
                    data-testid={`button-reject-cert-${c.id}`}
                    disabled={updating === c.id}
                    onClick={() => updateStatus(c.id, "rejected")}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground border border-border rounded-lg py-2.5 text-sm font-medium disabled:opacity-60"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
