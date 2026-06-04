import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  limit,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// ─── Admin emails ───────────────────────────────────────────────────────────
const ADMIN_EMAILS = (
  import.meta.env.VITE_ADMIN_EMAILS ||
  "haraikpriya@gmail.com,priyaharaikbuisness@gmail.com,uditsharmas9736@gmail.com"
)
  .split(",")
  .map((e: string) => e.trim().toLowerCase());

// ─── Seed videos (runs once if DB is empty) ─────────────────────────────────
const SEED_VIDEOS = [
  { id: "vid1", title: "Apple Farming Introduction", description: "Learn the basics of modern apple farming techniques.", youtubeId: "rSr185gCqmE", category: "Basics of Apple Farming", categoryColor: "#1B5E20", duration: "18:24", tags: ["basics", "introduction"], order: 1, createdAt: new Date("2025-01-10").toISOString(), isNew: false },
  { id: "vid2", title: "Rootstock Selection Guide", description: "How to choose the right rootstock for your orchard.", youtubeId: "IzlIXUgD5zk", category: "Basics of Apple Farming", categoryColor: "#1B5E20", duration: "22:10", tags: ["rootstock", "basics"], order: 2, createdAt: new Date("2025-02-01").toISOString(), isNew: true },
  { id: "vid3", title: "Scab Disease Control", description: "Effective methods to control apple scab disease.", youtubeId: "EVqTyWMxrdo", category: "Disease Management", categoryColor: "#B71C1C", duration: "25:12", tags: ["disease", "scab"], order: 3, createdAt: new Date("2025-02-15").toISOString(), isNew: false },
  { id: "vid4", title: "Pruning Techniques HDP", description: "High density planting pruning techniques for maximum yield.", youtubeId: "1oy2m4QIWIE", category: "Canopy Management", categoryColor: "#1A237E", duration: "31:20", tags: ["pruning", "HDP"], order: 4, createdAt: new Date("2025-03-01").toISOString(), isNew: true },
  { id: "vid5", title: "Jeevamrit Preparation", description: "Prepare natural bio-stimulant for your orchard.", youtubeId: "FNiap8YelJc", category: "Natural Farming", categoryColor: "#2E7D32", duration: "22:40", tags: ["natural", "jeevamrit"], order: 5, createdAt: new Date("2025-03-20").toISOString(), isNew: true },
];

async function seedVideosIfEmpty() {
  try {
    const snap = await getDocs(query(collection(db, "videos"), limit(1)));
    if (snap.empty) {
      for (const v of SEED_VIDEOS) {
        await setDoc(doc(db, "videos", v.id), v);
      }
    }
  } catch {
    // Seed failure is non-critical
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────
export type AccessStatus = "pending" | "approved" | "blocked";

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  photoURL: string;
  joinDate: string;
  lastActive: string;
  accessStatus: AccessStatus;
  language?: string;
  theme?: string;
}

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  isAdmin: boolean;
  accessStatus: AccessStatus | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.email
    ? ADMIN_EMAILS.includes(user.email.toLowerCase())
    : false;
  const accessStatus = user?.accessStatus || null;

  // Load or create user document in Firestore
  const loadUser = async (fUser: FirebaseUser) => {
    const userRef = doc(db, "users", fUser.uid);
    const userSnap = await getDoc(userRef);
    const now = new Date().toISOString();

    let userData: AppUser;

    if (userSnap.exists()) {
      userData = userSnap.data() as AppUser;
      await updateDoc(userRef, { lastActive: now });
      userData.lastActive = now;
    } else {
      const isAdminUser = ADMIN_EMAILS.includes(
        (fUser.email || "").toLowerCase()
      );
      userData = {
        uid: fUser.uid,
        email: fUser.email || "",
        name: fUser.displayName || "Farmer",
        photoURL: fUser.photoURL || "",
        joinDate: now,
        lastActive: now,
        accessStatus: isAdminUser ? "approved" : "pending",
      };
      await setDoc(userRef, userData);
    }

    setUser(userData);

    if (ADMIN_EMAILS.includes(userData.email.toLowerCase())) {
      seedVideosIfEmpty();
    }
  };

  // ── Auth initialisation ──────────────────────────────────────────────────
  // IMPORTANT: We await getRedirectResult FIRST, then set up onAuthStateChanged.
  // Without this, there is a race condition where onAuthStateChanged fires with
  // null before Firebase has finished processing the OAuth redirect, causing the
  // app to show the login screen even after a successful Google sign-in.
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      // Step 1 – Resolve any pending redirect result
      try {
        await getRedirectResult(auth);
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        // auth/null-user just means no redirect was pending – not an error
        if (e?.code !== "auth/null-user") {
          console.error("[Auth] getRedirectResult error:", e?.code, e?.message);
        }
      }

      // Step 2 – Now listen for auth state (Firebase state is fully settled)
      unsubscribe = onAuthStateChanged(auth, async (fUser) => {
        setFirebaseUser(fUser);

        if (fUser) {
          try {
            await loadUser(fUser);
          } catch (err: unknown) {
            const e = err as { code?: string; message?: string };
            console.error("[Auth] loadUser error:", e?.code, e?.message);
            setUser(null);
          }
        } else {
          setUser(null);
        }

        setLoading(false);
      });
    };

    init();

    return () => {
      unsubscribe?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sign in ──────────────────────────────────────────────────────────────
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      // Try popup first (best UX)
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      console.error("[Auth] signInWithPopup error:", e?.code, e?.message);

      if (e?.code === "auth/popup-blocked") {
        // Popup was blocked by browser → fall back to page redirect
        await signInWithRedirect(auth, provider);
        return; // Page will reload after Google redirects back
      }

      if (
        e?.code === "auth/popup-closed-by-user" ||
        e?.code === "auth/cancelled-popup-request"
      ) {
        // User cancelled – not an error, just return silently
        return;
      }

      // All other errors bubble up to the calling component
      throw err;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      try {
        await loadUser(firebaseUser);
      } catch (err: unknown) {
        const e = err as { code?: string };
        console.error("[Auth] refreshUser error:", e?.code);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAdmin,
        accessStatus,
        loading,
        signInWithGoogle,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
