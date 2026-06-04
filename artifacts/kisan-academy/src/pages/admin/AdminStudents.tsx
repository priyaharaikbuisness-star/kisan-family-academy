import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Check, Ban, UserX, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import type { AppUser } from "@/contexts/AuthContext";

type AdminUser = AppUser & { id: string };

export default function AdminStudents() {
  const [students, setStudents] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "approved" | "pending" | "blocked">("all");

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(query(collection(db, "users"), orderBy("joinDate", "desc")));
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminUser)));
      setLoading(false);
    };
    load();
  }, []);

  const updateStatus = async (uid: string, status: "approved" | "blocked" | "pending") => {
    setUpdating(uid);
    try {
      await updateDoc(doc(db, "users", uid), { accessStatus: status });
      setStudents((prev) => prev.map((s) => s.uid === uid ? { ...s, accessStatus: status } : s));
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === "all" ? students : students.filter((s) => s.accessStatus === filter);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      approved: "bg-primary/10 text-primary",
      pending: "bg-orange-500/10 text-orange-400",
      blocked: "bg-destructive/10 text-destructive",
    };
    return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${styles[status] || ""}`}>{status}</span>;
  };

  return (
    <div className="p-5">
      <h2 className="text-lg font-bold text-foreground font-serif mb-4">Students</h2>

      {/* Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(["all", "approved", "pending", "blocked"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors capitalize ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-card rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No students found</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((s) => (
            <div key={s.uid} className="bg-card border border-border rounded-xl overflow-hidden">
              <div
                className="flex items-center gap-3 p-3 cursor-pointer"
                onClick={() => setExpanded(expanded === s.uid ? null : s.uid)}
              >
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {s.name?.slice(0, 2).toUpperCase() || "??"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {statusBadge(s.accessStatus)}
                  {expanded === s.uid ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {expanded === s.uid && (
                <div className="px-3 pb-3 border-t border-border pt-3">
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                    <div><span className="text-foreground">Joined:</span> {new Date(s.joinDate).toLocaleDateString()}</div>
                    <div><span className="text-foreground">Last active:</span> {new Date(s.lastActive).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      data-testid={`button-approve-${s.uid}`}
                      disabled={s.accessStatus === "approved" || updating === s.uid}
                      onClick={() => updateStatus(s.uid, "approved")}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg py-2 text-xs font-medium disabled:opacity-40 transition-opacity hover:opacity-80"
                    >
                      {updating === s.uid ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Approve
                    </button>
                    <button
                      data-testid={`button-block-${s.uid}`}
                      disabled={s.accessStatus === "blocked" || updating === s.uid}
                      onClick={() => updateStatus(s.uid, "blocked")}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg py-2 text-xs font-medium disabled:opacity-40 transition-opacity hover:opacity-80"
                    >
                      <Ban className="w-3 h-3" /> Block
                    </button>
                    <button
                      data-testid={`button-remove-${s.uid}`}
                      disabled={s.accessStatus === "pending" || updating === s.uid}
                      onClick={() => updateStatus(s.uid, "pending")}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground border border-border rounded-lg py-2 text-xs font-medium disabled:opacity-40 transition-opacity hover:opacity-80"
                    >
                      <UserX className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
