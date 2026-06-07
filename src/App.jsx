// ================================================================
// KISAN FAMILY ACADEMY - Complete App (Fresh Build)
// One file. All features. No errors.
// ================================================================
//
// SETUP INSTRUCTIONS (read carefully!):
//
// Step 1: Is file ko apne GitHub pe daalo:
//         artifacts/kisan-academy/src/App.tsx
//         (Purani App.tsx ko replace karo - delete karke naya paste karo)
//
// Step 2: Ye 3 files RAKHNI hain (delete mat karna):
//         - artifacts/kisan-academy/src/main.tsx
//         - artifacts/kisan-academy/src/index.css
//         - artifacts/kisan-academy/index.html
//
// Step 3: Ye saari folders DELETE karo src/ ke andar:
//         - pages/ folder
//         - components/ folder
//         - contexts/ folder
//         - hooks/ folder
//         - lib/ folder
//
// Step 4: Cloudflare mein Firebase keys set karo (alag se bataunga)
//
// Step 5: VITE_ADMIN_EMAILS mein apni email daalo (neeche dekho)
// ================================================================

import { useState, useEffect, useRef, createContext, useContext, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth, signInWithPopup, GoogleAuthProvider,
  signOut as fbSignOut, onAuthStateChanged
} from "firebase/auth";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, addDoc,
  collection, getDocs, deleteDoc, query, where, orderBy, limit
} from "firebase/firestore";

// ================================================================
// FIREBASE SETUP
// ================================================================
const app = initializeApp({
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
});
const auth = getAuth(app);
const db   = getFirestore(app);

// ================================================================
// ADMIN EMAILS — yahan apni emails daalo
// ================================================================
const ADMIN_EMAILS = (
  import.meta.env.VITE_ADMIN_EMAILS ||
  "haraikpriya@gmail.com,priyaharaikbuisness@gmail.com,uditsharmas9736@gmail.com"
).split(",").map(e => e.trim());

// ================================================================
// SAMPLE VIDEOS (pehli baar Firestore mein aayenge)
// ================================================================
const SEED_VIDEOS = [
  { id: "v1", title: "Apple Farming Introduction",  description: "Seb ki kheti ke basic tarike seekhein.",              youtubeId: "rSr185gCqmE", category: "Basics",           categoryColor: "#1B5E20", duration: "18:24", tags: ["basics"],        order: 1, createdAt: "2025-01-10", isNew: false },
  { id: "v2", title: "Rootstock Selection Guide",   description: "Sahi rootstock kaise chunein apne baag ke liye.",     youtubeId: "IzlIXUgD5zk", category: "Basics",           categoryColor: "#1B5E20", duration: "22:10", tags: ["rootstock"],     order: 2, createdAt: "2025-02-01", isNew: true  },
  { id: "v3", title: "Scab Disease Control",        description: "Scab bimari ko kaise roke — proven methods.",         youtubeId: "EVqTyWMxrdo", category: "Disease Mgmt",      categoryColor: "#B71C1C", duration: "25:12", tags: ["disease","scab"], order: 3, createdAt: "2025-02-15", isNew: false },
  { id: "v4", title: "Pruning Techniques HDP",      description: "High density planting ke liye pruning techniques.",   youtubeId: "1oy2m4QIWIE", category: "Canopy Mgmt",       categoryColor: "#1A237E", duration: "31:20", tags: ["pruning","HDP"],  order: 4, createdAt: "2025-03-01", isNew: true  },
  { id: "v5", title: "Jeevamrit Preparation",       description: "Apne baag ke liye natural bio-stimulant banayein.",   youtubeId: "FNiap8YelJc", category: "Natural Farming",   categoryColor: "#2E7D32", duration: "22:40", tags: ["natural"],       order: 5, createdAt: "2025-03-20", isNew: true  },
];

async function seedIfEmpty() {
  try {
    const snap = await getDocs(query(collection(db, "videos"), limit(1)));
    if (snap.empty) {
      for (const { id, ...data } of SEED_VIDEOS)
        await setDoc(doc(db, "videos", id), data);
    }
  } catch (_) {}
}

// ================================================================
// AUTH CONTEXT
// ================================================================
const AuthCtx = createContext(null);

function AuthProvider({ children }) {
  const [fbUser,  setFbUser]  = useState(null);
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = ADMIN_EMAILS.includes(user?.email || "");

  const loadUser = useCallback(async (fUser) => {
    try {
      const ref  = doc(db, "users", fUser.uid);
      const snap = await getDoc(ref);
      const now  = new Date().toISOString();
      let data;
      if (snap.exists()) {
        data = snap.data();
        await updateDoc(ref, { lastActive: now });
        data.lastActive = now;
      } else {
        data = {
          uid: fUser.uid, email: fUser.email || "",
          name: fUser.displayName || "Farmer",
          photoURL: fUser.photoURL || "",
          joinDate: now, lastActive: now,
          accessStatus: ADMIN_EMAILS.includes(fUser.email || "") ? "approved" : "pending",
          language: "hi",
        };
        await setDoc(ref, data);
      }
      setUser(data);
      if (ADMIN_EMAILS.includes(data.email)) seedIfEmpty();
    } catch (_) {}
  }, []);

  useEffect(() =>
    onAuthStateChanged(auth, async (fUser) => {
      setFbUser(fUser);
      if (fUser) await loadUser(fUser);
      else setUser(null);
      setLoading(false);
    })
  , [loadUser]);

  return (
    <AuthCtx.Provider value={{
      user, fbUser, isAdmin, loading,
      signInWithGoogle: () => signInWithPopup(auth, new GoogleAuthProvider()),
      signOut: () => fbSignOut(auth),
      refreshUser: () => fbUser && loadUser(fbUser),
    }}>
      {children}
    </AuthCtx.Provider>
  );
}
const useAuth = () => useContext(AuthCtx);

// ================================================================
// THEME CONTEXT
// ================================================================
const ThemeCtx = createContext(null);
function ThemeProvider({ children }) {
  const [theme, _setTheme] = useState(() => localStorage.getItem("kfa-theme") || "dark");
  const setTheme = (t) => { _setTheme(t); localStorage.setItem("kfa-theme", t); };
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  return <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>;
}
const useTheme = () => useContext(ThemeCtx);

// ================================================================
// ROUTER (Hash-based — #/home style — never breaks on Cloudflare)
// ================================================================
const RouterCtx = createContext(null);
function RouterProvider({ children }) {
  const getPath = () => window.location.hash.replace("#", "") || "/";
  const [path, setPathState] = useState(getPath);
  const setPath = (p) => { window.location.hash = p; };
  useEffect(() => {
    const h = () => setPathState(getPath());
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);
  return <RouterCtx.Provider value={{ path, setPath }}>{children}</RouterCtx.Provider>;
}
const useRouter = () => useContext(RouterCtx);

// ================================================================
// UTILITY FUNCTIONS
// ================================================================
const maskEmail = (email = "") => {
  const [l, d] = email.split("@");
  return l ? l.slice(0,2) + "***@" + d : email;
};

const fmtNow = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,"0")}-${d.toLocaleString("default",{month:"short"})}-${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
};

const kfpStatus = (member) => {
  const days = Math.floor((Date.now() - new Date(member.lastRenewed)) / 86400000);
  const limit = member.plan === "yearly" ? 365 : 30;
  const left  = limit - days;
  if (left > 7)  return { label: `${left} din bache`, color: "green",  left };
  if (left > 0)  return { label: `${left} din mein due`, color: "yellow", left };
  return           { label: `${Math.abs(left)} din late`, color: "red",   left };
};

const kfpWhatsApp = (member) => {
  const plan     = member.plan === "yearly" ? "Yearly — ₹499" : "Monthly — ₹99";
  const dueDate  = new Date(new Date(member.lastRenewed).getTime() + (member.plan === "yearly" ? 365 : 30) * 86400000);
  const dueFmt   = `${String(dueDate.getDate()).padStart(2,"0")}/${String(dueDate.getMonth()+1).padStart(2,"0")}/${dueDate.getFullYear()}`;
  const msg = `Namaste ${member.name} ji! 🌿\n\nAapki *Kisan Family Pro* membership renewal ka time aa gaya hai.\n\n📋 Plan: ${plan}\n📅 Due Date: ${dueFmt}\n\nRenewal ke liye payment karein:\n💳 UPI: priyaharaikbuisness@okaxis\n\nPayment ke baad screenshot zaroor bhejein. 🙏\n\n— Priya Haraik Ventures`;
  return `https://wa.me/91${member.phone}?text=${encodeURIComponent(msg)}`;
};

// ================================================================
// BASE COMPONENTS
// ================================================================
function Spinner() {
  return <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
}

function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="14" fill="#1B5E20"/>
      <ellipse cx="32" cy="26" rx="12" ry="15" fill="#4CAF50"/>
      <ellipse cx="32" cy="26" rx="8" ry="11" fill="#81C784"/>
      <rect x="29" y="38" width="6" height="10" rx="3" fill="#2E7D32"/>
      <path d="M20 30 Q16 22 20 16" stroke="#A5D6A7" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M44 30 Q48 22 44 16" stroke="#A5D6A7" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <circle cx="32" cy="24" r="4" fill="#FFF9C4"/>
      <circle cx="30" cy="22" r="1.5" fill="#F9A825"/>
    </svg>
  );
}

function VideoCard({ video, compact = false }) {
  const { setPath } = useRouter();
  const thumb = `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`;

  if (compact) return (
    <div onClick={() => setPath(`/player/${video.id}`)}
      className="flex gap-3 items-center p-3 bg-card border border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 relative">
        <img src={thumb} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display="none"} />
        <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{video.title}</p>
        <p className="text-xs mt-0.5 font-medium" style={{color:video.categoryColor}}>{video.category}</p>
        <p className="text-xs text-muted-foreground mt-0.5">⏱ {video.duration}</p>
      </div>
      {video.isNew && <span className="text-[9px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded flex-shrink-0">NEW</span>}
    </div>
  );

  return (
    <div onClick={() => setPath(`/player/${video.id}`)} className="min-w-[160px] flex-shrink-0 cursor-pointer group">
      <div className="relative w-40 h-24 rounded-xl overflow-hidden mb-2">
        <img src={thumb} alt="" className="w-full h-full object-cover" onError={e=>{e.target.style.display="none"; e.target.parentElement.style.background=video.categoryColor+"44";}} />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors flex items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-primary/80 flex items-center justify-center">
            <svg className="w-4 h-4 text-white ml-0.5" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        {video.isNew && <span className="absolute top-2 left-2 text-[9px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded">NEW</span>}
        <span className="absolute bottom-2 right-2 text-[10px] bg-black/70 text-white px-1 py-0.5 rounded">{video.duration}</span>
      </div>
      <p className="text-xs text-foreground line-clamp-2 leading-snug">{video.title}</p>
    </div>
  );
}

function BottomNav() {
  const { path, setPath } = useRouter();
  const tabs = [
    { label:"Home",    route:"/home",    icon:(a) => <svg className={`w-5 h-5 ${a?"text-primary":"text-muted-foreground"}`} fill={a?"currentColor":"none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a?0:1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg> },
    { label:"Courses", route:"/courses", icon:(a) => <svg className={`w-5 h-5 ${a?"text-primary":"text-muted-foreground"}`} fill={a?"currentColor":"none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a?0:1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg> },
    { label:"Profile", route:"/profile", icon:(a) => <svg className={`w-5 h-5 ${a?"text-primary":"text-muted-foreground"}`} fill={a?"currentColor":"none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a?0:1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> },
  ];
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] bg-card border-t border-border flex z-40">
      {tabs.map(t => {
        const active = path === t.route;
        return (
          <button key={t.route} onClick={() => setPath(t.route)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 transition-colors ${active?"text-primary":"text-muted-foreground"}`}>
            {t.icon(active)}
            <span className="text-[10px] font-medium">{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ================================================================
// SPLASH SCREEN
// ================================================================
function SplashScreen() {
  const [count, setCount] = useState(3);
  const { user, loading, isAdmin } = useAuth();
  const { setPath } = useRouter();

  useEffect(() => {
    if (loading) return;
    const t = setInterval(() => {
      setCount(p => {
        if (p <= 1) {
          clearInterval(t);
          setTimeout(() => {
            if (!user) setPath("/login");
            else if (isAdmin || user.accessStatus === "approved") setPath("/home");
            else setPath("/access-pending");
          }, 400);
          return 0;
        }
        return p - 1;
      });
    }, 800);
    return () => clearInterval(t);
  }, [loading, user, isAdmin]);

  const c = 2 * Math.PI * 24;
  return (
    <div className="w-full max-w-[420px] mx-auto h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-green-50 dark:bg-green-950/20 pointer-events-none" />
      <div className="mb-8 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm"><Logo size={96} /></div>
      <h1 className="text-2xl font-bold text-green-800 dark:text-green-400 mb-2 text-center">Kisan Family Academy</h1>
      <p className="text-sm text-gray-500 italic mb-12 text-center">Apple Farming Knowledge Hub</p>
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <svg viewBox="0 0 56 56" className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="28" cy="28" r="24" fill="none" stroke="#E8F5E9" strokeWidth="3"/>
            <circle cx="28" cy="28" r="24" fill="none" stroke="#2E7D32" strokeWidth="3"
              strokeDasharray={c} strokeDashoffset={c - (count/3)*c} strokeLinecap="round"
              style={{transition:"stroke-dashoffset 0.7s ease"}}/>
          </svg>
          <span className="text-xl font-bold text-green-800 dark:text-green-400 relative z-10">{count}</span>
        </div>
        <p className="text-xs text-gray-400">{loading?"Loading...":"Logging you in..."}</p>
      </div>
      <div className="absolute bottom-7 left-0 right-0 flex items-center justify-center">
        <span className="text-xs text-gray-400 italic">A product by Priya Haraik Ventures</span>
      </div>
    </div>
  );
}

// ================================================================
// LOGIN SCREEN
// ================================================================
function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState("");

  const login = async () => {
    setBusy(true); setErr("");
    try { await signInWithGoogle(); }
    catch (e) {
      setErr(e?.code === "auth/popup-closed-by-user" ? "Sign in cancel ho gaya." : "Sign in fail hua. Dobara try karein.");
    }
    finally { setBusy(false); }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-border"><Logo size={80}/></div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary">Kisan Family Academy</h1>
            <p className="text-sm text-muted-foreground mt-1">Apple Farming Knowledge Hub</p>
          </div>
        </div>
        <div className="w-full flex flex-col gap-4">
          <p className="text-center text-sm text-muted-foreground">Apne Google account se sign in karein</p>
          <button onClick={login} disabled={busy}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 border border-gray-200 rounded-xl py-3 px-4 font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-60">
            {busy ? <Spinner/> : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {busy ? "Sign in ho raha hai..." : "Google se Continue karein"}
          </button>
          {err && <p className="text-sm text-red-500 text-center">{err}</p>}
        </div>
        <div className="w-full bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            <span className="text-primary font-medium">Kisan Family Pro</span> ka access admin dwara manually approve hota hai payment confirm hone ke baad.
          </p>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// ACCESS PENDING SCREEN
// ================================================================
function AccessPendingScreen() {
  const { user, signOut, refreshUser } = useAuth();
  const { setPath } = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const blocked = user?.accessStatus === "blocked";

  const doRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
    if (user?.accessStatus === "approved") setPath("/home");
  };

  return (
    <div className="w-full max-w-[420px] mx-auto min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-7">
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-border"><Logo size={52}/></div>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${blocked?"bg-red-100 dark:bg-red-950":"bg-primary/10"}`}>
          {blocked
            ? <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
            : <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          }
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">{blocked?"Access Blocked":"Access Pending"}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {blocked
              ? "Aapka account block ho gaya hai. Admin se contact karein."
              : "Aapka account admin approval ka wait kar raha hai. Payment confirm hone ke baad access milega."}
          </p>
        </div>
        {user && (
          <div className="w-full bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Signed in as</p>
            <p className="text-sm font-medium text-foreground">{user.email}</p>
          </div>
        )}
        <div className="w-full flex flex-col gap-3">
          {!blocked && (
            <button onClick={doRefresh} disabled={refreshing}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-3 font-medium disabled:opacity-60">
              {refreshing ? <Spinner/> : null}
              {refreshing ? "Check ho raha hai..." : "Status Check Karein"}
            </button>
          )}
          <button onClick={async () => { await signOut(); setPath("/login"); }}
            className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground border border-border rounded-xl py-3 font-medium">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// HOME SCREEN
// ================================================================
function HomeScreen() {
  const { user }    = useAuth();
  const { setPath } = useRouter();
  const [videos,   setVideos]   = useState([]);
  const [progress, setProgress] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");

  useEffect(() => {
    getDocs(query(collection(db,"videos"), orderBy("order")))
      .then(s => setVideos(s.docs.map(d => ({id:d.id,...d.data()}))))
      .catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    getDocs(collection(db,"progress",user.uid,"videos"))
      .then(s => { const p={}; s.docs.forEach(d=>{p[d.id]={videoId:d.id,...d.data()};}); setProgress(p); })
      .catch(()=>{});
  }, [user?.uid]);

  const name    = user?.name?.split(" ")[0] || "Farmer";
  const q       = search.trim();
  const results = q.length >= 2 ? videos.filter(v =>
    v.title.toLowerCase().includes(q.toLowerCase()) ||
    v.category.toLowerCase().includes(q.toLowerCase()) ||
    (v.tags||[]).some(t=>t.toLowerCase().includes(q.toLowerCase()))
  ) : [];

  const continueW  = videos.filter(v => progress[v.id] && !progress[v.id].watched && (progress[v.id].progress||0) > 0);
  const recent     = [...videos].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5);
  const cats       = [...new Set(videos.map(v=>v.category))];
  const byCat      = Object.fromEntries(cats.map(c=>[c, videos.filter(v=>v.category===c)]));

  return (
    <div className="w-full max-w-[900px] mx-auto min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-10 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          {user?.photoURL
            ? <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0"/>
            : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-green-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{user?.name?.slice(0,2).toUpperCase()||"KA"}</div>
          }
          <div>
            <p className="text-base font-bold text-foreground">Namaste, {name} 🙏</p>
            <p className="text-xs italic text-green-500">Aapka orchard, aapka gyan</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-1.5 border border-border"><Logo size={34}/></div>
      </div>

      {/* Search */}
      <div className="px-5 py-3">
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5">
          <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
          <input className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Video search karein..." value={search} onChange={e=>setSearch(e.target.value)}/>
          {search && <button onClick={()=>setSearch("")}><svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {q.length >= 2 ? (
          <div className="px-5">
            <p className="text-xs font-semibold text-primary mb-3">{results.length} results — "{q}"</p>
            {results.length === 0
              ? <div className="text-center py-12"><p className="text-muted-foreground text-sm">Koi video nahi mili</p></div>
              : <div className="flex flex-col gap-3">{results.map(v=><VideoCard key={v.id} video={v} compact/>)}</div>
            }
          </div>
        ) : (
          <>
            {continueW.length > 0 && (
              <section className="mb-2">
                <p className="px-5 pt-4 pb-2 text-xs font-bold text-primary">CONTINUE WATCHING</p>
                <div className="flex gap-3 overflow-x-auto px-5 pb-3" style={{scrollbarWidth:"none"}}>
                  {continueW.map(v=>(
                    <div key={v.id} onClick={()=>setPath(`/player/${v.id}`)}
                      className="min-w-[280px] flex-shrink-0 bg-card border border-border rounded-xl p-3 flex gap-3 cursor-pointer">
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 relative">
                        <img src={`https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`} alt="" className="w-full h-full object-cover"/>
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-2">{v.title}</p>
                        <p className="text-xs text-green-500 mt-0.5">{v.category}</p>
                        <div className="mt-2 h-1 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{width:`${progress[v.id]?.progress||0}%`}}/>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{progress[v.id]?.progress||0}% dekha</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="mb-2">
              <p className="px-5 pt-4 pb-2 text-xs font-bold text-primary">RECENTLY ADDED</p>
              <div className="flex gap-3 overflow-x-auto px-5 pb-3" style={{scrollbarWidth:"none"}}>
                {loading
                  ? [1,2,3].map(i=><div key={i} className="min-w-[160px] flex-shrink-0"><div className="w-40 h-24 rounded-xl bg-card animate-pulse mb-2"/><div className="h-3 bg-card rounded animate-pulse w-28"/></div>)
                  : recent.map(v=><VideoCard key={v.id} video={v}/>)
                }
              </div>
            </section>

            {!loading && cats.map(cat => {
              const vs = byCat[cat];
              return (
                <section key={cat} className="mb-2">
                  <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                    <div className="w-1.5 h-4 rounded-full" style={{background:vs[0]?.categoryColor||"#2E7D32"}}/>
                    <p className="text-xs font-bold text-primary">{cat.toUpperCase()}</p>
                  </div>
                  <div className="flex gap-3 overflow-x-auto px-5 pb-3" style={{scrollbarWidth:"none"}}>
                    {vs.map(v=><VideoCard key={v.id} video={v}/>)}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </div>
      <BottomNav/>
    </div>
  );
}

// ================================================================
// COURSES SCREEN
// ================================================================
function CoursesScreen() {
  const [videos, setVideos]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(query(collection(db,"videos"),orderBy("order")))
      .then(s=>setVideos(s.docs.map(d=>({id:d.id,...d.data()}))))
      .catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const cats   = [...new Set(videos.map(v=>v.category))];
  const byCat  = Object.fromEntries(cats.map(c=>[c, videos.filter(v=>v.category===c)]));

  return (
    <div className="w-full max-w-[900px] mx-auto min-h-screen bg-background flex flex-col">
      <div className="px-5 pt-10 pb-4 border-b border-border">
        <h1 className="text-lg font-bold text-foreground">Kisan Family Pro</h1>
        <p className="text-xs text-muted-foreground mt-1">Poora course playlist</p>
      </div>
      <div className="flex-1 overflow-y-auto pb-24">
        {loading
          ? <div className="flex flex-col gap-3 px-5 pt-4">{[1,2,3,4,5].map(i=><div key={i} className="h-20 bg-card rounded-xl animate-pulse"/>)}</div>
          : cats.map(cat => {
              const vs = byCat[cat];
              return (
                <section key={cat} className="mb-2">
                  <div className="px-5 pt-5 pb-2 flex items-center gap-2">
                    <div className="w-1.5 h-4 rounded-full" style={{background:vs[0]?.categoryColor||"#2E7D32"}}/>
                    <p className="text-xs font-bold text-foreground">{cat}</p>
                    <span className="text-[10px] text-muted-foreground ml-auto">{vs.length} videos</span>
                  </div>
                  <div className="flex flex-col gap-2 px-5">{vs.map(v=><VideoCard key={v.id} video={v} compact/>)}</div>
                </section>
              );
            })
        }
      </div>
      <BottomNav/>
    </div>
  );
}

// ================================================================
// VIDEO PLAYER SCREEN
// ================================================================
const WM_POSITIONS = [
  {top:"8%",left:"5%"},{top:"8%",left:"55%"},
  {top:"45%",left:"5%"},{top:"45%",left:"55%"},
  {top:"78%",left:"5%"},{top:"78%",left:"55%"},
];

function VideoPlayerScreen({ videoId }) {
  const { user }    = useAuth();
  const { setPath } = useRouter();
  const [video,    setVideo]    = useState(null);
  const [videos,   setVideos]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [watchPct, setWatchPct] = useState(0);
  const [wmIdx,    setWmIdx]    = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    Promise.all([
      getDoc(doc(db,"videos",videoId)),
      getDocs(query(collection(db,"videos"),orderBy("order"))),
    ]).then(([vs, all]) => {
      if (vs.exists()) setVideo({id:vs.id,...vs.data()});
      setVideos(all.docs.map(d=>({id:d.id,...d.data()})));
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, [videoId]);

  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(db,"progress",user.uid,"videos",videoId))
      .then(s => { if(s.exists()) setWatchPct(s.data().progress||0); })
      .catch(()=>{});
  }, [user?.uid, videoId]);

  useEffect(() => {
    const t = setInterval(()=>setWmIdx(i=>(i+1)%WM_POSITIONS.length), 4000);
    return ()=>clearInterval(t);
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    timerRef.current = setInterval(() => {
      setWatchPct(prev => {
        const next = Math.min(prev+2, 100);
        if (next > prev) {
          const entry = {videoId, watched:next>=80, watchedAt:new Date().toISOString(), progress:next};
          setDoc(doc(db,"progress",user.uid,"videos",videoId), entry, {merge:true}).catch(()=>{});
        }
        return next;
      });
    }, 10000);
    return () => clearInterval(timerRef.current);
  }, [user?.uid, videoId]);

  const suggested = videos.filter(v=>v.id!==videoId && v.category===video?.category).slice(0,3);
  const wm = WM_POSITIONS[wmIdx];

  if (loading) return (
    <div className="w-full max-w-[900px] mx-auto min-h-screen bg-background flex items-center justify-center"><Spinner/></div>
  );

  if (!video) return (
    <div className="w-full max-w-[900px] mx-auto min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">Video nahi mili</p>
      <button onClick={()=>setPath("/home")} className="text-primary text-sm">Home par jao</button>
    </div>
  );

  return (
    <div className="w-full max-w-[900px] mx-auto min-h-screen bg-background flex flex-col">
      <div className="relative bg-black w-full" style={{paddingTop:"56.25%"}}>
        <iframe src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0&modestbranding=1`}
          title={video.title} className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen/>
        <div className="absolute pointer-events-none select-none" style={{
          top:wm.top, left:wm.left, transition:"all 1.5s ease", zIndex:10,
          color:"rgba(255,255,255,0.35)", fontFamily:"monospace", fontSize:"11px",
          lineHeight:1.4, textShadow:"0 1px 3px rgba(0,0,0,0.8)", userSelect:"none",
        }}>
          <div>{maskEmail(user?.email)}</div>
          <div>{fmtNow()}</div>
        </div>
      </div>

      <div className="h-1 bg-border">
        <div className="h-full bg-primary transition-all duration-1000" style={{width:`${watchPct}%`}}/>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        <div className="px-5 pt-4">
          <button onClick={()=>setPath("/home")} className="flex items-center gap-1 text-primary text-sm mb-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            Wapas jao
          </button>
          <h2 className="text-lg font-bold text-foreground leading-snug">{video.title}</h2>
          <p className="text-xs mt-1 font-medium" style={{color:video.categoryColor}}>{video.category} · {video.duration}</p>
          {video.description && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{video.description}</p>}
          {video.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {video.tags.map(t=><span key={t} className="text-[10px] bg-card border border-border text-muted-foreground px-2 py-0.5 rounded-full">{t}</span>)}
            </div>
          )}
        </div>
        {suggested.length > 0 && (
          <div className="mt-5 px-5">
            <div className="h-px bg-border mb-4"/>
            <p className="text-xs font-bold text-muted-foreground mb-3">AAGE KE VIDEOS</p>
            <div className="flex flex-col gap-3">{suggested.map(v=><VideoCard key={v.id} video={v} compact/>)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ================================================================
// PROFILE SCREEN
// ================================================================
function ProfileScreen() {
  const { user, isAdmin, signOut } = useAuth();
  const { theme, setTheme }        = useTheme();
  const { setPath }                = useRouter();

  const [videos,   setVideos]   = useState([]);
  const [progress, setProgress] = useState({});
  const [language, setLanguage] = useState(user?.language||"hi");
  const [questions,setQuestions]= useState([]);
  const [newQ,     setNewQ]     = useState("");
  const [cert,     setCert]     = useState(null);
  const [submQ,    setSubmQ]    = useState(false);
  const [reqCert,  setReqCert]  = useState(false);
  const [certMsg,  setCertMsg]  = useState("");

  useEffect(() => {
    getDocs(query(collection(db,"videos"),orderBy("order"))).then(s=>setVideos(s.docs.map(d=>({id:d.id,...d.data()})))).catch(()=>{});
  },[]);

  useEffect(() => {
    if (!user?.uid) return;
    getDocs(collection(db,"progress",user.uid,"videos")).then(s=>{const p={};s.docs.forEach(d=>{p[d.id]={videoId:d.id,...d.data()};}); setProgress(p);}).catch(()=>{});
    getDocs(query(collection(db,"questions"),where("userId","==",user.uid),orderBy("createdAt","desc"))).then(s=>setQuestions(s.docs.map(d=>({id:d.id,...d.data()})))).catch(()=>{});
    getDocs(query(collection(db,"certificates"),where("userId","==",user.uid))).then(s=>{if(!s.empty)setCert({id:s.docs[0].id,...s.docs[0].data()});}).catch(()=>{});
  },[user?.uid]);

  const watched    = Object.values(progress).filter(p=>p.watched).length;
  const total      = videos.length;
  const completion = total > 0 ? Math.round((watched/total)*100) : 0;

  const submitQuestion = async () => {
    if (!newQ.trim()||!user) return;
    setSubmQ(true);
    try {
      const ref = await addDoc(collection(db,"questions"),{userId:user.uid,userEmail:user.email,userName:user.name,question:newQ.trim(),status:"pending",createdAt:new Date().toISOString()});
      setQuestions(p=>[{id:ref.id,question:newQ.trim(),status:"pending",createdAt:new Date().toISOString()},...p]);
      setNewQ("");
    } catch(_){} finally{setSubmQ(false);}
  };

  const requestCert = async () => {
    if (!user||completion<80) return;
    setReqCert(true);
    try {
      const ref = await addDoc(collection(db,"certificates"),{userId:user.uid,userEmail:user.email,userName:user.name,status:"pending",requestedAt:new Date().toISOString(),completion});
      setCert({id:ref.id,status:"pending"});
      setCertMsg("Request bhej di! Admin review karega.");
    } catch(_){setCertMsg("Error aaya, dobara try karein.");} finally{setReqCert(false);}
  };

  const updateLang = async (lang) => {
    setLanguage(lang);
    if (user?.uid) updateDoc(doc(db,"users",user.uid),{language:lang}).catch(()=>{});
  };

  return (
    <div className="w-full max-w-[900px] mx-auto min-h-screen bg-background flex flex-col">
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Header */}
        <div className="px-5 pt-10 pb-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user?.photoURL
              ? <img src={user.photoURL} alt="" className="w-12 h-12 rounded-full object-cover"/>
              : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-green-800 flex items-center justify-center text-white font-bold">{user?.name?.slice(0,2).toUpperCase()||"KA"}</div>
            }
            <div>
              <p className="font-bold text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="bg-white p-1.5 rounded-lg border border-border"><Logo size={30}/></div>
        </div>

        {/* Progress */}
        <div className="px-5 mt-4">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs font-bold text-muted-foreground mb-3">PROGRESS</p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[["Dekha",watched,"text-primary"],["Total",total,"text-foreground"],["Complete",`${completion}%`,"text-foreground"]].map(([l,v,c])=>(
                <div key={l} className="text-center">
                  <p className={`text-2xl font-bold ${c}`}>{v}</p>
                  <p className="text-[10px] text-muted-foreground">{l}</p>
                </div>
              ))}
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{width:`${completion}%`}}/>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="px-5 mt-4">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
              <span className="text-sm text-foreground">Theme</span>
              <div className="flex gap-1">
                {["light","dark"].map(t=>(
                  <button key={t} onClick={()=>setTheme(t)} className={`text-xs px-3 py-1 rounded-lg transition-colors ${theme===t?"bg-primary text-white":"bg-secondary text-secondary-foreground"}`}>
                    {t==="light"?"Light ☀️":"Dark 🌙"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm text-foreground">Language</span>
              <div className="flex gap-1">
                {[["en","English"],["hi","हिंदी"]].map(([code,label])=>(
                  <button key={code} onClick={()=>updateLang(code)} className={`text-xs px-3 py-1 rounded-lg transition-colors ${language===code?"bg-primary text-white":"bg-secondary text-secondary-foreground"}`}>{label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Certificate */}
        <div className="px-5 mt-4">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-sm font-semibold text-foreground mb-3">🏆 Certificate</p>
            {cert ? (
              <div className={`text-xs rounded-lg px-3 py-2 ${cert.status==="approved"?"bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400":cert.status==="rejected"?"bg-red-100 dark:bg-red-950 text-red-600":"bg-secondary text-secondary-foreground"}`}>
                {cert.status==="approved"?"✅ Certificate approve ho gaya! Admin bhejenge.":cert.status==="rejected"?"❌ Reject ho gaya. Admin se contact karein.":"⏳ Admin review kar raha hai."}
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>{completion}% complete</span><span>80% chahiye</span></div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{width:`${Math.min(completion,100)}%`}}/></div>
                </div>
                <button onClick={requestCert} disabled={reqCert||completion<80}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50">
                  {reqCert?<Spinner/>:null} Certificate Request Karein
                </button>
                {certMsg && <p className="text-xs text-muted-foreground text-center mt-2">{certMsg}</p>}
              </>
            )}
          </div>
        </div>

        {/* Ask Question */}
        <div className="px-5 mt-4">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-sm font-semibold text-foreground mb-3">💬 Sawaal Poochho</p>
            <textarea className="w-full bg-background border border-border rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary transition-colors"
              rows={3} placeholder="Apna farming sawaal yahan likho..." value={newQ} onChange={e=>setNewQ(e.target.value)}/>
            <button onClick={submitQuestion} disabled={submQ||!newQ.trim()}
              className="mt-2 flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50">
              {submQ?<Spinner/>:null} Bhejein
            </button>
            {questions.length > 0 && (
              <div className="mt-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-muted-foreground">AAPKE SAWAAL</p>
                {questions.map(q=>(
                  <div key={q.id} className="bg-background border border-border rounded-xl p-3">
                    <p className="text-sm text-foreground mb-1">{q.question}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${q.status==="answered"?"bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400":"bg-secondary text-muted-foreground"}`}>
                      {q.status==="answered"?"✅ Jawab aa gaya":"⏳ Pending"}
                    </span>
                    {q.answer && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-[10px] text-primary font-semibold mb-1">Admin ka jawab:</p>
                        <p className="text-sm text-foreground">{q.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Admin link */}
        {isAdmin && (
          <div className="px-5 mt-4">
            <button onClick={()=>setPath("/admin")}
              className="w-full flex items-center justify-between bg-primary/10 border border-primary/20 text-primary rounded-xl px-4 py-3">
              <span className="text-sm font-medium">🛡️ Admin Panel</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        )}

        {/* Sign out */}
        <div className="px-5 mt-4 mb-4">
          <button onClick={async()=>{await signOut();setPath("/login");}}
            className="w-full flex items-center justify-center gap-2 border border-red-300 dark:border-red-800 text-red-500 rounded-xl py-3 text-sm font-medium">
            Sign Out
          </button>
        </div>
      </div>
      <BottomNav/>
    </div>
  );
}

// ================================================================
// ADMIN LAYOUT
// ================================================================
const ADMIN_NAV = [
  {path:"/admin/dashboard",     label:"Dashboard"},
  {path:"/admin/students",      label:"Students"},
  {path:"/admin/approvals",     label:"Approvals"},
  {path:"/admin/videos",        label:"Videos"},
  {path:"/admin/questions",     label:"Questions"},
  {path:"/admin/notifications", label:"Notifications"},
  {path:"/admin/certificates",  label:"Certificates"},
  {path:"/admin/kfp",           label:"KFP WhatsApp 💬"},
];

function AdminLayout({ children }) {
  const { signOut }         = useAuth();
  const { path, setPath }   = useRouter();
  const [menu, setMenu]     = useState(false);

  return (
    <div className="w-full max-w-[900px] mx-auto min-h-screen bg-background flex flex-col">
      {/* Topbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <button onClick={()=>setMenu(v=>!v)} className="p-1.5 rounded-lg hover:bg-secondary">
            {menu
              ? <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              : <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
            }
          </button>
          <div className="bg-white rounded p-0.5 border border-border"><Logo size={26}/></div>
          <span className="text-sm font-bold text-foreground">Admin Panel</span>
        </div>
        <button onClick={()=>setPath("/home")} className="p-1.5 rounded-lg hover:bg-secondary">
          <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        </button>
      </div>

      {/* Drawer */}
      {menu && (
        <div className="fixed inset-0 z-40 flex" onClick={()=>setMenu(false)}>
          <div className="w-64 bg-card border-r border-border h-full flex flex-col shadow-xl" onClick={e=>e.stopPropagation()}>
            <div className="px-4 py-4 border-b border-border"><p className="text-xs font-bold text-muted-foreground">ADMIN NAVIGATION</p></div>
            <nav className="flex-1 overflow-y-auto py-2">
              {ADMIN_NAV.map(item=>{
                const active = path===item.path;
                return (
                  <button key={item.path} onClick={()=>{setPath(item.path);setMenu(false);}}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${active?"bg-primary/10 text-primary":"text-foreground hover:bg-secondary"}`}>
                    {item.label}
                  </button>
                );
              })}
            </nav>
            <div className="px-4 py-3 border-t border-border">
              <button onClick={async()=>{await signOut();setPath("/login");}} className="text-sm text-red-500">Sign Out</button>
            </div>
          </div>
          <div className="flex-1 bg-black/40"/>
        </div>
      )}

      {/* Tab bar - desktop */}
      <div className="hidden sm:flex overflow-x-auto border-b border-border bg-card">
        {ADMIN_NAV.map(item=>{
          const active = path===item.path;
          return (
            <button key={item.path} onClick={()=>setPath(item.path)}
              className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 ${active?"border-primary text-primary":"border-transparent text-muted-foreground hover:text-foreground"}`}>
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

// ================================================================
// ADMIN DASHBOARD
// ================================================================
function AdminDashboard() {
  const [stats,   setStats]   = useState({s:0,p:0,a:0,v:0,q:0,c:0});
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    Promise.all([
      getDocs(collection(db,"users")),
      getDocs(query(collection(db,"users"),where("accessStatus","==","pending"))),
      getDocs(query(collection(db,"users"),where("accessStatus","==","approved"))),
      getDocs(collection(db,"videos")),
      getDocs(query(collection(db,"questions"),where("status","==","pending"))),
      getDocs(query(collection(db,"certificates"),where("status","==","pending"))),
    ]).then(([s,p,a,v,q,c])=>setStats({s:s.size,p:p.size,a:a.size,v:v.size,q:q.size,c:c.size}))
    .catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const cards = [
    {label:"Total Students",    val:stats.s, color:"text-blue-400"},
    {label:"Pending Approvals", val:stats.p, color:"text-orange-400"},
    {label:"Active Students",   val:stats.a, color:"text-primary"},
    {label:"Total Videos",      val:stats.v, color:"text-purple-400"},
    {label:"Pending Questions", val:stats.q, color:"text-yellow-400"},
    {label:"Cert. Requests",    val:stats.c, color:"text-pink-400"},
  ];

  return (
    <div className="p-5">
      <h2 className="text-lg font-bold text-foreground mb-5">Dashboard</h2>
      {loading
        ? <div className="grid grid-cols-2 gap-3">{[1,2,3,4,5,6].map(i=><div key={i} className="h-24 bg-card border border-border rounded-xl animate-pulse"/>)}</div>
        : <div className="grid grid-cols-2 gap-3">{cards.map(c=>(
            <div key={c.label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-2">{c.label}</p>
              <p className={`text-3xl font-bold ${c.color}`}>{c.val}</p>
            </div>
          ))}</div>
      }
    </div>
  );
}

// ================================================================
// ADMIN STUDENTS
// ================================================================
function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(()=>{
    getDocs(query(collection(db,"users"),orderBy("joinDate","desc")))
      .then(s=>setStudents(s.docs.map(d=>({id:d.id,...d.data()}))))
      .catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const toggle = async (uid, cur) => {
    const next = cur==="approved"?"blocked":cur==="blocked"?"pending":"approved";
    setUpdating(uid);
    try {
      await updateDoc(doc(db,"users",uid),{accessStatus:next});
      setStudents(p=>p.map(s=>s.uid===uid?{...s,accessStatus:next}:s));
    } catch(_){} finally{setUpdating(null);}
  };

  const badge = s => s==="approved"?"bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400":s==="blocked"?"bg-red-100 dark:bg-red-950 text-red-600":"bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400";

  return (
    <div className="p-5">
      <h2 className="text-lg font-bold text-foreground mb-1">Students</h2>
      <p className="text-xs text-muted-foreground mb-5">Sab registered users</p>
      {loading ? <div className="flex flex-col gap-3">{[1,2,3,4].map(i=><div key={i} className="h-20 bg-card rounded-xl animate-pulse"/>)}</div>
      : students.length===0 ? <p className="text-sm text-muted-foreground text-center py-12">Abhi koi student nahi</p>
      : <div className="flex flex-col gap-3">
          {students.map(s=>(
            <div key={s.uid} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">{s.name?.slice(0,2).toUpperCase()||"??"}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${badge(s.accessStatus)}`}>{s.accessStatus}</span>
              </div>
              <button disabled={updating===s.uid} onClick={()=>toggle(s.uid,s.accessStatus)}
                className="text-xs bg-secondary text-secondary-foreground border border-border rounded-lg px-3 py-1.5 disabled:opacity-60">
                {updating===s.uid?"...":s.accessStatus==="approved"?"Block":s.accessStatus==="blocked"?"Reset":"Approve"}
              </button>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

// ================================================================
// ADMIN APPROVALS
// ================================================================
function AdminApprovals() {
  const [pending,  setPending]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(()=>{
    getDocs(query(collection(db,"users"),where("accessStatus","==","pending"),orderBy("joinDate","desc")))
      .then(s=>setPending(s.docs.map(d=>({id:d.id,...d.data()}))))
      .catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const update = async (uid, status) => {
    setUpdating(uid);
    try {
      await updateDoc(doc(db,"users",uid),{accessStatus:status});
      setPending(p=>p.filter(s=>s.uid!==uid));
    } catch(_){} finally{setUpdating(null);}
  };

  return (
    <div className="p-5">
      <h2 className="text-lg font-bold text-foreground mb-1">Pending Approvals</h2>
      <p className="text-xs text-muted-foreground mb-5">Students ka access approve karein</p>
      {loading ? <div className="flex flex-col gap-3">{[1,2,3].map(i=><div key={i} className="h-24 bg-card rounded-xl animate-pulse"/>)}</div>
      : pending.length===0 ? <div className="text-center py-12"><p className="text-sm text-muted-foreground">Sab clear hai! 🎉</p></div>
      : <div className="flex flex-col gap-3">
          {pending.map(s=>(
            <div key={s.uid} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-400 flex-shrink-0">{s.name?.slice(0,2).toUpperCase()||"??"}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.email}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Joined: {new Date(s.joinDate).toLocaleDateString("hi-IN")}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button disabled={updating===s.uid} onClick={()=>update(s.uid,"approved")}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-60">
                  {updating===s.uid?<Spinner/>:null} ✓ Approve
                </button>
                <button disabled={updating===s.uid} onClick={()=>update(s.uid,"blocked")}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground border border-border rounded-lg py-2.5 text-sm font-medium disabled:opacity-60">
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

// ================================================================
// ADMIN VIDEOS
// ================================================================
const EMPTY_V = {title:"",description:"",youtubeId:"",category:"",categoryColor:"#2E7D32",duration:"",tags:[],order:99,isNew:false};

function AdminVideos() {
  const [videos,  setVideos]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [deleting,setDeleting]= useState(null);
  const [tags,    setTags]    = useState("");

  const load = () => getDocs(query(collection(db,"videos"),orderBy("order"))).then(s=>setVideos(s.docs.map(d=>({id:d.id,...d.data()})))).catch(()=>{}).finally(()=>setLoading(false));
  useEffect(()=>{load();},[]);

  const save = async () => {
    if (!editing?.title||!editing?.youtubeId) return;
    setSaving(true);
    try {
      const {id,...data} = {...editing, tags:tags.split(",").map(t=>t.trim()).filter(Boolean), createdAt:editing.createdAt||new Date().toISOString()};
      if (editing.id) await updateDoc(doc(db,"videos",editing.id),data);
      else await setDoc(doc(db,"videos",`vid_${Date.now()}`),data);
      await load(); setEditing(null); setTags("");
    } catch(_){} finally{setSaving(false);}
  };

  const del = async (id) => {
    if (!confirm("Ye video delete karein?")) return;
    setDeleting(id);
    try { await deleteDoc(doc(db,"videos",id)); setVideos(p=>p.filter(v=>v.id!==id)); }
    catch(_){} finally{setDeleting(null);}
  };

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-foreground">Videos</h2>
        <button onClick={()=>{setEditing({...EMPTY_V});setTags("");}} className="flex items-center gap-1.5 bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium">+ Video Add Karein</button>
      </div>

      {editing && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-foreground">{editing.id?"Edit Video":"Naya Video"}</p>
            <button onClick={()=>{setEditing(null);setTags("");}}>✕</button>
          </div>
          <div className="flex flex-col gap-3">
            {[["Title *","title"],["YouTube ID *","youtubeId"],["Category","category"],["Duration","duration"]].map(([label,key])=>(
              <div key={key}>
                <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                <input className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  value={editing[key]||""} onChange={e=>setEditing(p=>({...p,[key]:e.target.value}))}/>
              </div>
            ))}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Description</label>
              <textarea className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none" rows={2}
                value={editing.description||""} onChange={e=>setEditing(p=>({...p,description:e.target.value}))}/>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Tags (comma se alag karein)</label>
              <input className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                value={tags} onChange={e=>setTags(e.target.value)}/>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Order</label>
                <input type="number" className="w-20 bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  value={editing.order||99} onChange={e=>setEditing(p=>({...p,order:Number(e.target.value)}))}/>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Color</label>
                <input type="color" value={editing.categoryColor||"#2E7D32"} onChange={e=>setEditing(p=>({...p,categoryColor:e.target.value}))}
                  className="w-10 h-8 rounded border border-border cursor-pointer"/>
              </div>
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer mt-3">
                <input type="checkbox" checked={editing.isNew||false} onChange={e=>setEditing(p=>({...p,isNew:e.target.checked}))} className="w-4 h-4"/>
                NEW badge
              </label>
            </div>
          </div>
          <button onClick={save} disabled={saving||!editing.title||!editing.youtubeId}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-60">
            {saving?<Spinner/>:null} {editing.id?"Changes Save Karein":"Video Add Karein"}
          </button>
        </div>
      )}

      {loading ? <div className="flex flex-col gap-3">{[1,2,3].map(i=><div key={i} className="h-20 bg-card rounded-xl animate-pulse"/>)}</div>
      : videos.length===0 ? <p className="text-sm text-muted-foreground text-center py-12">Abhi koi video nahi. Pehla video add karein!</p>
      : <div className="flex flex-col gap-3">
          {videos.map(v=>(
            <div key={v.id} className="bg-card border border-border rounded-xl p-3 flex gap-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                <img src={`https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`} alt="" className="w-full h-full object-cover"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-1">{v.title}</p>
                <p className="text-xs text-muted-foreground">{v.category} · {v.duration}</p>
                <p className="text-[10px] text-muted-foreground">Order: {v.order}</p>
              </div>
              <div className="flex gap-2 items-start flex-shrink-0">
                <button onClick={()=>{setEditing({...v});setTags((v.tags||[]).join(", "));}} className="p-1.5 rounded-lg bg-secondary text-xs">✏️</button>
                <button onClick={()=>del(v.id)} disabled={deleting===v.id} className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950 text-xs disabled:opacity-60">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

// ================================================================
// ADMIN QUESTIONS
// ================================================================
function AdminQuestions() {
  const [qs,      setQs]      = useState([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [saving,  setSaving]  = useState(null);

  useEffect(()=>{
    getDocs(query(collection(db,"questions"),orderBy("createdAt","desc")))
      .then(s=>setQs(s.docs.map(d=>({id:d.id,...d.data()}))))
      .catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const reply = async (id) => {
    const ans = (answers[id]||"").trim();
    if (!ans) return;
    setSaving(id);
    try {
      await updateDoc(doc(db,"questions",id),{answer:ans,status:"answered"});
      setQs(p=>p.map(q=>q.id===id?{...q,answer:ans,status:"answered"}:q));
      setAnswers(p=>({...p,[id]:""}));
    } catch(_){} finally{setSaving(null);}
  };

  return (
    <div className="p-5">
      <h2 className="text-lg font-bold text-foreground mb-1">Students ke Sawaal</h2>
      <p className="text-xs text-muted-foreground mb-5">Farming ke sawaalon ka jawab dein</p>
      {loading ? <div className="flex flex-col gap-3">{[1,2,3].map(i=><div key={i} className="h-28 bg-card rounded-xl animate-pulse"/>)}</div>
      : qs.length===0 ? <p className="text-sm text-muted-foreground text-center py-12">Abhi koi sawaal nahi</p>
      : <div className="flex flex-col gap-4">
          {qs.map(q=>(
            <div key={q.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div><p className="text-xs font-semibold text-foreground">{q.userName}</p><p className="text-[10px] text-muted-foreground">{q.userEmail}</p></div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${q.status==="answered"?"bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400":"bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400"}`}>{q.status==="answered"?"Answered":"Pending"}</span>
              </div>
              <p className="text-sm text-foreground mb-3 font-medium">"{q.question}"</p>
              {q.answer && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 mb-3">
                  <p className="text-[10px] text-primary font-semibold mb-1">Aapka jawab:</p>
                  <p className="text-sm text-foreground">{q.answer}</p>
                </div>
              )}
              <textarea className="w-full bg-background border border-border rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary" rows={2}
                placeholder={q.status==="answered"?"Jawab update karein...":"Jawab likho..."} value={answers[q.id]||""} onChange={e=>setAnswers(p=>({...p,[q.id]:e.target.value}))}/>
              <button onClick={()=>reply(q.id)} disabled={saving===q.id||!(answers[q.id]||"").trim()}
                className="mt-2 flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50">
                {saving===q.id?<Spinner/>:null} {q.status==="answered"?"Update Karein":"Bhejein"}
              </button>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

// ================================================================
// ADMIN NOTIFICATIONS
// ================================================================
function AdminNotifications() {
  const [title,   setTitle]   = useState("");
  const [msg,     setMsg]     = useState("");
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(()=>{
    getDocs(query(collection(db,"notifications"),orderBy("createdAt","desc")))
      .then(s=>setHistory(s.docs.map(d=>({id:d.id,...d.data()}))))
      .catch(()=>{});
  },[]);

  const send = async () => {
    if (!title.trim()||!msg.trim()) return;
    setSending(true);
    try {
      const n = {title:title.trim(),message:msg.trim(),createdAt:new Date().toISOString()};
      const ref = await addDoc(collection(db,"notifications"),n);
      setHistory(p=>[{id:ref.id,...n},...p]);
      setTitle(""); setMsg(""); setSent(true);
      setTimeout(()=>setSent(false),3000);
    } catch(_){} finally{setSending(false);}
  };

  return (
    <div className="p-5">
      <h2 className="text-lg font-bold text-foreground mb-5">Notification Bhejein</h2>
      <div className="bg-card border border-border rounded-2xl p-4 mb-5">
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Title</label>
            <input className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary" placeholder="Notification ka title" value={title} onChange={e=>setTitle(e.target.value)}/>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Message</label>
            <textarea className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary" rows={3}
              placeholder="Sab students ko message..." value={msg} onChange={e=>setMsg(e.target.value)}/>
          </div>
          <button onClick={send} disabled={sending||!title.trim()||!msg.trim()}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50">
            {sending?<Spinner/>:null} {sent?"✓ Bhej diya!":"Sab Students ko Bhejein"}
          </button>
        </div>
      </div>
      {history.length>0 && (
        <>
          <p className="text-xs font-bold text-muted-foreground mb-3">HISTORY</p>
          <div className="flex flex-col gap-3">
            {history.map(n=>(
              <div key={n.id} className="bg-card border border-border rounded-xl p-3">
                <p className="text-sm font-semibold text-foreground">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 mb-1">{n.message}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleString("hi-IN")}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ================================================================
// ADMIN CERTIFICATES
// ================================================================
function AdminCertificates() {
  const [certs,   setCerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating,setUpdating]= useState(null);

  useEffect(()=>{
    getDocs(query(collection(db,"certificates"),orderBy("requestedAt","desc")))
      .then(s=>setCerts(s.docs.map(d=>({id:d.id,...d.data()}))))
      .catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const update = async (id, status) => {
    setUpdating(id);
    try { await updateDoc(doc(db,"certificates",id),{status}); setCerts(p=>p.map(c=>c.id===id?{...c,status}:c)); }
    catch(_){} finally{setUpdating(null);}
  };

  return (
    <div className="p-5">
      <h2 className="text-lg font-bold text-foreground mb-1">Certificate Requests</h2>
      <p className="text-xs text-muted-foreground mb-5">Students ke certificate approve karein</p>
      {loading ? <div className="flex flex-col gap-3">{[1,2,3].map(i=><div key={i} className="h-24 bg-card rounded-xl animate-pulse"/>)}</div>
      : certs.length===0 ? <p className="text-sm text-muted-foreground text-center py-12">Abhi koi request nahi</p>
      : <div className="flex flex-col gap-3">
          {certs.map(c=>(
            <div key={c.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{c.userName}</p>
                  <p className="text-xs text-muted-foreground">{c.userEmail}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Completion: {c.completion}% · {new Date(c.requestedAt).toLocaleDateString("hi-IN")}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${c.status==="approved"?"bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400":c.status==="rejected"?"bg-red-100 dark:bg-red-950 text-red-600":"bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400"}`}>{c.status}</span>
              </div>
              {c.status==="pending" && (
                <div className="flex gap-2">
                  <button disabled={updating===c.id} onClick={()=>update(c.id,"approved")} className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60">{updating===c.id?"...":"✓ Approve"}</button>
                  <button disabled={updating===c.id} onClick={()=>update(c.id,"rejected")} className="flex-1 bg-secondary text-secondary-foreground border border-border rounded-lg py-2 text-sm font-medium disabled:opacity-60">✕ Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      }
    </div>
  );
}

// ================================================================
// ADMIN KFP WHATSAPP RENEWAL TOOL 🌿
// ================================================================
const EMPTY_M = {name:"",phone:"",plan:"monthly",lastRenewed:new Date().toISOString().split("T")[0],notes:""};

function AdminKFP() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [deleting,setDeleting]= useState(null);
  const [filter,  setFilter]  = useState("all");

  const load = () => getDocs(query(collection(db,"kfp_members"),orderBy("name"))).then(s=>setMembers(s.docs.map(d=>({id:d.id,...d.data()})))).catch(()=>{}).finally(()=>setLoading(false));
  useEffect(()=>{load();},[]);

  const save = async () => {
    if (!form?.name||!form?.phone) return;
    setSaving(true);
    try {
      const {id,...data} = form;
      if (form.id) await updateDoc(doc(db,"kfp_members",form.id),data);
      else await addDoc(collection(db,"kfp_members"),data);
      await load(); setForm(null);
    } catch(_){} finally{setSaving(false);}
  };

  const del = async (id) => {
    if (!confirm("Ye member delete karein?")) return;
    setDeleting(id);
    try { await deleteDoc(doc(db,"kfp_members",id)); setMembers(p=>p.filter(m=>m.id!==id)); }
    catch(_){} finally{setDeleting(null);}
  };

  const getColor = (m) => {
    const s = kfpStatus(m);
    if (s.color==="green")  return "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30";
    if (s.color==="yellow") return "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30";
    return                         "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30";
  };
  const getBadge = (m) => {
    const s = kfpStatus(m);
    if (s.color==="green")  return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400";
    if (s.color==="yellow") return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-400";
    return                         "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400";
  };

  const filtered = filter==="all"?members:filter==="due"?members.filter(m=>kfpStatus(m).left<=7&&kfpStatus(m).left>0):filter==="overdue"?members.filter(m=>kfpStatus(m).left<=0):members.filter(m=>kfpStatus(m).left>7);
  const dueCount      = members.filter(m=>{const s=kfpStatus(m);return s.left<=7&&s.left>0;}).length;
  const overdueCount  = members.filter(m=>kfpStatus(m).left<=0).length;

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-bold text-foreground">KFP Members 🌿</h2>
          <p className="text-xs text-muted-foreground">WhatsApp renewal reminder tool</p>
        </div>
        <button onClick={()=>setForm({...EMPTY_M})} className="flex items-center gap-1.5 bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium">+ Add</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4 mt-3">
        {[["Total",members.length,"text-foreground"],["Due Soon",dueCount,"text-yellow-600 dark:text-yellow-400"],["Overdue",overdueCount,"text-red-600 dark:text-red-400"]].map(([l,v,c])=>(
          <div key={l} className="bg-card border border-border rounded-xl p-3 text-center">
            <p className={`text-2xl font-bold ${c}`}>{v}</p>
            <p className="text-[10px] text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto" style={{scrollbarWidth:"none"}}>
        {[["all","Sab"],["active","Active ✅"],["due","Due Soon ⚠️"],["overdue","Overdue 🔴"]].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${filter===k?"bg-primary text-white":"bg-secondary text-secondary-foreground"}`}>{l}</button>
        ))}
      </div>

      {/* Add/Edit Form */}
      {form && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-foreground">{form.id?"Member Edit Karein":"Naya Member Add Karein"}</p>
            <button onClick={()=>setForm(null)}>✕</button>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Naam *</label>
              <input className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                placeholder="Ramesh Kumar" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">WhatsApp Number * (10 digits, without 91)</label>
              <input type="tel" maxLength={10} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                placeholder="9876543210" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value.replace(/\D/,"")}))}/>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Plan</label>
              <div className="flex gap-2">
                {[["monthly","Monthly ₹99"],["yearly","Yearly ₹499"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setForm(p=>({...p,plan:k}))}
                    className={`flex-1 text-sm py-2 rounded-xl border transition-colors ${form.plan===k?"bg-primary text-white border-primary":"bg-secondary text-secondary-foreground border-border"}`}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Pichli Renewal Date</label>
              <input type="date" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                value={form.lastRenewed} onChange={e=>setForm(p=>({...p,lastRenewed:e.target.value}))}/>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Notes (optional)</label>
              <input className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                placeholder="Koi note..." value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
            </div>
          </div>
          <button onClick={save} disabled={saving||!form.name||!form.phone}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-60">
            {saving?<Spinner/>:null} {form.id?"Save Karein":"Member Add Karein"}
          </button>
        </div>
      )}

      {/* Members List */}
      {loading ? <div className="flex flex-col gap-3">{[1,2,3].map(i=><div key={i} className="h-28 bg-card rounded-xl animate-pulse"/>)}</div>
      : filtered.length===0 ? <div className="text-center py-12"><p className="text-sm text-muted-foreground">Is filter mein koi member nahi</p></div>
      : <div className="flex flex-col gap-3">
          {filtered.map(m=>{
            const status = kfpStatus(m);
            return (
              <div key={m.id} className={`border rounded-xl p-4 ${getColor(m)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">📱 +91 {m.phone}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{m.plan==="yearly"?"Yearly ₹499":"Monthly ₹99"}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getBadge(m)}`}>{status.label}</span>
                    </div>
                    {m.notes && <p className="text-[10px] text-muted-foreground mt-1">📝 {m.notes}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={()=>setForm({...m})} className="p-1.5 rounded-lg bg-white/70 dark:bg-white/10 text-xs">✏️</button>
                    <button onClick={()=>del(m.id)} disabled={deleting===m.id} className="p-1.5 rounded-lg bg-white/70 dark:bg-white/10 text-xs disabled:opacity-60">🗑️</button>
                  </div>
                </div>

                {/* WhatsApp Button */}
                <a href={kfpWhatsApp(m)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#25D366] text-white rounded-xl py-2.5 text-sm font-medium mt-2 w-full">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp Reminder Bhejein
                </a>
              </div>
            );
          })}
        </div>
      }
    </div>
  );
}

// ================================================================
// MAIN APP ROUTER
// ================================================================
function AppRouter() {
  const { user, loading, isAdmin } = useAuth();
  const { path, setPath }          = useRouter();

  useEffect(() => {
    if (loading) return;
    const isApp    = ["/home","/courses","/profile"].some(r=>path.startsWith(r)) || path.startsWith("/player");
    const isAdmin_ = path.startsWith("/admin");
    if (!user && (isApp||isAdmin_)) { setPath("/login"); return; }
  if (user && (path==="/login"||path===""||path==="/")) {
    if (isAdmin||user.accessStatus==="approved") { setPath("/home"); return; }
    else { setPath("/access-pending"); return; }
  }
    if (user) {
      const canAccess = isAdmin || user.accessStatus==="approved";
      if (!canAccess && (isApp||isAdmin_)) { setPath("/access-pending"); return; }
      if (isAdmin_ && !isAdmin) { setPath("/home"); return; }
    }
  }, [path, user, loading, isAdmin]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Spinner/></div>;

  if (path==="/"||path==="")                          return <SplashScreen/>;
  if (path==="/login")                                return <LoginScreen/>;
  if (path==="/access-pending")                       return <AccessPendingScreen/>;
  if (path==="/home")                                 return <HomeScreen/>;
  if (path==="/courses")                              return <CoursesScreen/>;
  if (path==="/profile")                              return <ProfileScreen/>;

  const pm = path.match(/^\/player\/(.+)$/);
  if (pm) return <VideoPlayerScreen videoId={pm[1]}/>;

  if (path==="/admin"||path==="/admin/dashboard")     return <AdminLayout><AdminDashboard/></AdminLayout>;
  if (path==="/admin/students")                       return <AdminLayout><AdminStudents/></AdminLayout>;
  if (path==="/admin/approvals")                      return <AdminLayout><AdminApprovals/></AdminLayout>;
  if (path==="/admin/videos")                         return <AdminLayout><AdminVideos/></AdminLayout>;
  if (path==="/admin/questions")                      return <AdminLayout><AdminQuestions/></AdminLayout>;
  if (path==="/admin/notifications")                  return <AdminLayout><AdminNotifications/></AdminLayout>;
  if (path==="/admin/certificates")                   return <AdminLayout><AdminCertificates/></AdminLayout>;
  if (path==="/admin/kfp")                            return <AdminLayout><AdminKFP/></AdminLayout>;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <p className="text-3xl font-bold text-foreground">404</p>
      <p className="text-muted-foreground">Page nahi mila</p>
      <button onClick={()=>setPath("/home")} className="text-primary text-sm">Home par jao</button>
    </div>
  );
}

// ================================================================
// ROOT COMPONENT
// ================================================================
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider>
          <AppRouter/>
        </RouterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
