import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Check, Ban, Loader2 } from "lucide-react";
import type { AppUser } from "@/contexts/AuthContext";

type AdminUser = AppUser & { id: string };

export default function AdminApprovals() {
  const [pending, setPending] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const q = query(collection(db, "users"), where("accessStatus", "==", "pending"), orderBy("joinDate", "desc"));
      const snap = await getDocs(q);
      setPending(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminUser)));
      setLoading(false);
    };
    load();
  }, []);

  const updateStatus = async (uid: string, status: "approved" | "blocked") => {
    setUpdating(uid);
    try {
      await updateDoc(doc(db, "users", uid), { accessStatus: status });
      setPending((prev) => prev.filter((s) => s.uid !== uid));
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="p-5">
      <h2 className="text-lg font-bold text-foreground font-serif mb-1">Pending Approvals</h2>
      <p className="text-xs text-muted-foreground mb-5">Review and approve student access</p>

      {loading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-card rounded-xl animate-pulse" />)}</div>
      ) : pending.length === 0 ? (
        <div className="text-center py-12">
          <Check className="w-10 h-10 text-primary mx-auto mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">No pending approvals</p>
          <p className="text-xs text-muted-foreground mt-1">All caught up!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pending.map((s) => (
            <div key={s.uid} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-400 flex-shrink-0">
                  {s.name?.slice(0, 2).toUpperCase() || "??"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.email}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Joined {new Date(s.joinDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  data-testid={`button-approve-${s.uid}`}
                  disabled={updating === s.uid}
                  onClick={() => updateStatus(s.uid, "approved")}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium disabled:opacity-60 transition-opacity hover:opacity-90"
                >
                  {updating === s.uid ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Approve
                </button>
                <button
                  data-testid={`button-reject-${s.uid}`}
                  disabled={updating === s.uid}
                  onClick={() => updateStatus(s.uid, "blocked")}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground border border-border rounded-lg py-2.5 text-sm font-medium disabled:opacity-60 transition-opacity hover:opacity-80"
                >
                  <Ban className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
