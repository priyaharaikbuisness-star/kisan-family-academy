import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  signInWithPopup,
  signInWithRedirect,
getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, limit } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "haraikpriya@gmail.com,priyaharaikbuisness@gmail.com,uditsharmas9736@gmail.com").split(",");

const SEED_VIDEOS = [
  { id: "vid1", title: "Apple Farming Introduction", description: "Learn the basics of modern apple farming techniques.", youtubeId: "rSr185gCqmE", category: "Basics of Apple Farming", categoryColor: "#1B5E20", duration: "18:24", tags: ["basics", "introduction"], order: 1, createdAt: new Date("2025-01-10").toISOString(), isNew: false },
  { id: "vid2", title: "Rootstock Selection Guide", description: "How to choose the right rootstock for your orchard.", youtubeId: "IzlIXUgD5zk", category: "Basics of Apple Farming", categoryColor: "#1B5E20", duration: "22:10", tags: ["rootstock", "basics"], order: 2, createdAt: new Date("2025-02-01").toISOString(), isNew: true },
  { id: "vid3", title: "Scab Disease Control", description: "Effective methods to control apple scab disease.", youtubeId: "EVqTyWMxrdo", category: "Disease Management", categoryColor: "#B71C1C", duration: "25:12", tags: ["disease", "scab"], order: 3, createdAt: new Date("2025-02-15").toISOString(), isNew: false },
  { id: "vid4", title: "Pruning Techniques HDP", description: "High density planting pruning techniques for maximum yield.", youtubeId: "1oy2m4QIWIE", category: "Canopy Management", categoryColor: "#1A237E", duration: "31:20", tags: ["pruning", "HDP"], order: 4, createdAt: new Date("2025-03-01").toISOString(), isNew: true },
  { id: "vid5", title: "Jeevamrit Preparation", description: "Prepare natural bio-stimulant for your orchard.", youtubeId: "FNiap8YelJc", category: "Natural Farming", categoryColor: "#2E7D32", duration: "22:40", tags: ["natural", "jeevamrit"], order: 5, createdAt: new Date("2025-03-20").toISOString(), isNew: true },
];

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

async function seedVideosIfEmpty() {
  const videosRef = collection(db, "videos");
  const snap = await getDocs(query(videosRef, limit(1)));
  if (snap.empty) {
    const { doc: docFn, setDoc: setDocFn } = await import("firebase/firestore");
    for (const v of SEED_VIDEOS) {
      await setDocFn(docFn(db, "videos", v.id), v);
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email) : false;
  const accessStatus = user?.accessStatus || null;

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
      const isAdminUser = ADMIN_EMAILS.includes(fUser.email || "");
      userData = {
        uid: fUser.uid,
        email: fUser.email || "",
        name: fUser.displayName || "Farmer",
        photoURL: fUser.photoURL || "",
        joinDate: now,
        lastActive: now,
        accessStatus: isAdminUser ? "approved" : "pending"
      };
      await setDoc(userRef, userData);
    }
    setUser(userData);
    if (ADMIN_EMAILS.includes(userData.email)) {
      seedVideosIfEmpty().catch(() => {});
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        await loadUser(fUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
   await signInWithRedirect(auth, provider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      await loadUser(firebaseUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, isAdmin, accessStatus, loading, signInWithGoogle, signOut, refreshUser }}>
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
