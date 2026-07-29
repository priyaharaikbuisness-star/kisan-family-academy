// ================================================================
// KISAN FAMILY ACADEMY - App.jsx v2.0
// All 14 requirements implemented
// ================================================================

import { useState, useEffect, useRef, createContext, useContext, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth, signInWithPopup, GoogleAuthProvider,
  signOut as fbSignOut, onAuthStateChanged
} from "firebase/auth";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, addDoc,
  collection, getDocs, deleteDoc, query, where, orderBy,
  limit, onSnapshot, serverTimestamp
} from "firebase/firestore";

// ── Firebase ──────────────────────────────────────────────────────
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

// ── Admin Emails ──────────────────────────────────────────────────
const ADMIN_EMAILS = (
  import.meta.env.VITE_ADMIN_EMAILS ||
  "haraikpriya@gmail.com,priyaharaikbuisness@gmail.com,uditsharmas9736@gmail.com"
).split(",").map(e => e.trim());

// ── LOGO ──────────────────────────────────────────────────────────
// INSTRUCTION: Run this ONE command in your project root to embed logo:
//   node -e "const fs=require('fs');const b64=fs.readFileSync('src/assets/logo.png').toString('base64');const content=fs.readFileSync('src/App.jsx','utf8').replace('LOGO_BASE64_PLACEHOLDER',b64);fs.writeFileSync('src/App.jsx',content);"
// OR just replace LOGO_BASE64_PLACEHOLDER below with your actual base64 string.
const PRIYA_HARAIK_LOGO = "data:image/png;base64,LOGO_BASE64_PLACEHOLDER";

// ── Seed Videos ───────────────────────────────────────────────────
const SEED_VIDEOS = [
  { id:"v1", title:"Apple Farming Introduction",  description:"Seb ki kheti ke basic tarike seekhein. Rootstock, spacing aur soil preparation ke baare mein jaankari.",              youtubeId:"rSr185gCqmE", category:"Basics",           categoryColor:"#1B5E20", duration:"18:24", tags:["basics"],        order:1, createdAt:"2025-01-10", isNew:false },
  { id:"v2", title:"Rootstock Selection Guide",   description:"Sahi rootstock kaise chunein apne baag ke liye. MM106, M9, M111 ke fayde aur nuqsaan.",                              youtubeId:"IzlIXUgD5zk", category:"Basics",           categoryColor:"#1B5E20", duration:"22:10", tags:["rootstock"],     order:2, createdAt:"2025-02-01", isNew:true  },
  { id:"v3", title:"Scab Disease Control",        description:"Scab bimari ko kaise roke. Fungicide spray schedule aur organic treatment ke tarike.",                              youtubeId:"EVqTyWMxrdo", category:"Disease Mgmt",      categoryColor:"#B71C1C", duration:"25:12", tags:["disease","scab"], order:3, createdAt:"2025-02-15", isNew:false },
  { id:"v4", title:"Pruning Techniques HDP",      description:"High density planting ke liye pruning techniques. Branch angle, spur management aur renewal pruning.",             youtubeId:"1oy2m4QIWIE", category:"Canopy Mgmt",       categoryColor:"#1A237E", duration:"31:20", tags:["pruning","HDP"],  order:4, createdAt:"2025-03-01", isNew:true  },
  { id:"v5", title:"Jeevamrit Preparation",       description:"Apne baag ke liye natural bio-stimulant banayein. Cow dung, cow urine, jaggery aur soil mix karke taiyaar karein.", youtubeId:"FNiap8YelJc", category:"Natural Farming",   categoryColor:"#2E7D32", duration:"22:40", tags:["natural"],       order:5, createdAt:"2025-03-20", isNew:true  },
];
async function seedIfEmpty() {
  try {
    const s = await getDocs(query(collection(db,"videos"),limit(1)));
    if (s.empty) for (const {id,...d} of SEED_VIDEOS) await setDoc(doc(db,"videos",id),d);
  } catch(_) {}
}

// ── UPDATED Terms & Conditions Text ───────────────────────────────
const FULL_TERMS = `Last Updated: 2026

Welcome to this learning platform. By using this application, you agree to the following Terms & Conditions.

1. Course Access
• Access to the course is provided only to registered and authorized users.
• Course access is intended for personal learning purposes only.
• Users must not share their login credentials with others.

2. Intellectual Property
• All videos, images, documents, presentations, notes, and other content available in the app are protected by copyright.
• Users may not copy, record, download, reproduce, distribute, sell, or republish any content without written permission.

3. Account Usage
• Users are responsible for maintaining the security of their accounts.
• Any unauthorized use of an account must be reported immediately.
• We reserve the right to suspend or terminate accounts involved in misuse or unauthorized sharing.

4. Payments
• Course fees are non-refundable unless otherwise stated by us.
• Access will be granted only after successful payment verification.

5. Educational Purpose
• The information provided in this app is for educational purposes only.
• Results may vary depending on individual circumstances, farming practices, environmental conditions, and other factors.
• We do not guarantee specific outcomes, yields, profits, or business success.

6. Prohibited Activities
Users agree NOT to:
• Share course content publicly.
• Record, copy, or redistribute videos.
• Attempt to bypass app security features.
• Use the platform for illegal or harmful activities.
• Share purchased access with other individuals.

7. Modifications
• We reserve the right to update course content, app features, and these Terms & Conditions at any time.
• Continued use of the application after updates constitutes acceptance of the revised terms.

8. Limitation of Liability
• We shall not be liable for any direct or indirect losses arising from the use of the app or course content.
• Users are responsible for applying the information at their own discretion and risk.

9. Termination
• We reserve the right to suspend or permanently terminate access for violations of these terms without prior notice.

10. Contact Information
Name: Priya Haraik
Email: priyaharaikbuisness@gmail.com
Phone/WhatsApp: +91 8580443542

11. Acceptance
By creating an account, purchasing a course, or using this application, you acknowledge that you have read, understood, and agreed to these Terms & Conditions.`;

// ── Translations ───────────────────────────────────────────────────
const T = {
  en: {
    home:"Home", courses:"Courses", profile:"Profile",
    namaste:"Namaste", tagline:"Aapka orchard, aapka gyan",
    search:"Search videos...", continueWatching:"CONTINUE WATCHING",
    recentlyAdded:"RECENTLY ADDED", backBtn:"Back",
    signIn:"Continue with Google", signingIn:"Signing in...",
    signOut:"Sign Out", checkStatus:"Check Status",
    accessPending:"Access Pending", accessBlocked:"Access Blocked",
    pendingMsg:"Your account is awaiting admin approval after payment confirmation.",
    blockedMsg:"Your account has been blocked. Contact admin.",
    watched:"Watched", total:"Total", complete:"Complete",
    theme:"Theme", language:"Language", light:"Light", dark:"Dark",
    certificate:"Certificate", requestCert:"Request Certificate",
    askQuestion:"Ask a Question", submitQ:"Submit", yourQuestions:"YOUR QUESTIONS",
    answered:"Answered", pending:"Pending", adminReply:"Admin Reply:",
    adminPanel:"Admin Panel", seeContent:"See Content", comingSoon:"Coming Soon",
    openCourse:"Open Course", videoDetails:"Topic", category:"Category",
    duration:"Duration", uploadDate:"Upload Date", readDesc:"▼ Click Now to Read Description",
    hideDesc:"▲ Hide Description", upNext:"RECOMMENDED FOR YOU",
    piracyWarning:"⚠️ WARNING: You are strictly prohibited from recording, capturing, or sharing this webinar. If you are caught sharing or distributing this content, you will be subject to severe legal action according to our Terms & Conditions. You will be legally held liable to compensate for all damages, including paying back all projected future revenues, and face a formal legal lawsuit.",
    termsTitle:"Terms & Conditions", termsAccept:"I have read and agree to all Terms & Conditions",
    termsContinue:"Continue to Login",
    termsWarning:"CRITICAL WARNING: Any attempt to copy, record, pirate, leak, or share the proprietary course materials hosted within this academy will result in immediate termination of your account and the initiation of strict civil and criminal lawsuits. You will be legally compelled to forfeit and pay back all projected future financial damages and revenues directly to Kisan Family Academy.",
    viewed:"viewed", supportChat:"Support Chat", typeMessage:"Type your message...",
    send:"Send", chatHistory:"Chat History", noMessages:"No messages yet. Send your first message!",
    exitMsg:"Press back again to exit",
  },
  hi: {
    home:"होम", courses:"कोर्स", profile:"प्रोफाइल",
    namaste:"नमस्ते", tagline:"आपका बाग, आपका ज्ञान",
    search:"वीडियो खोजें...", continueWatching:"देखते रहें",
    recentlyAdded:"हाल में जोड़े गए", backBtn:"वापस",
    signIn:"Google से जारी रखें", signingIn:"साइन इन हो रहा है...",
    signOut:"साइन आउट", checkStatus:"स्थिति जांचें",
    accessPending:"अनुमोदन प्रतीक्षित", accessBlocked:"पहुंच अवरुद्ध",
    pendingMsg:"भुगतान पुष्टि के बाद एडमिन आपका अनुरोध स्वीकार करेंगे।",
    blockedMsg:"आपका खाता ब्लॉक कर दिया गया है। एडमिन से संपर्क करें।",
    watched:"देखे", total:"कुल", complete:"पूर्ण",
    theme:"थीम", language:"भाषा", light:"लाइट", dark:"डार्क",
    certificate:"प्रमाणपत्र", requestCert:"प्रमाणपत्र मांगें",
    askQuestion:"प्रश्न पूछें", submitQ:"भेजें", yourQuestions:"आपके प्रश्न",
    answered:"उत्तर दिया", pending:"प्रतीक्षित", adminReply:"एडमिन का जवाब:",
    adminPanel:"एडमिन पैनल", seeContent:"सामग्री देखें", comingSoon:"जल्द आ रहा है",
    openCourse:"कोर्स खोलें", videoDetails:"विषय", category:"श्रेणी",
    duration:"अवधि", uploadDate:"अपलोड तिथि", readDesc:"▼ विवरण पढ़ने के लिए क्लिक करें",
    hideDesc:"▲ विवरण छुपाएं", upNext:"आपके लिए सुझाव",
    piracyWarning:"⚠️ चेतावनी: इस वेबिनार को रिकॉर्ड, कैप्चर या शेयर करना सख्त मना है। उल्लंघन पर नियमानुसार सख्त कानूनी कार्रवाई होगी।",
    termsTitle:"नियम और शर्तें", termsAccept:"मैंने सभी नियम और शर्तें पढ़ और स्वीकार कर ली हैं",
    termsContinue:"लॉगिन पर जाएं",
    termsWarning:"गंभीर चेतावनी: कोर्स सामग्री की कॉपी, रिकॉर्डिंग, या शेयरिंग पर तुरंत खाता बंद और कानूनी कार्रवाई होगी। सभी वित्तीय नुकसान की भरपाई करनी होगी।",
    viewed:"देखा", supportChat:"सहायता चैट", typeMessage:"संदेश लिखें...",
    send:"भेजें", chatHistory:"चैट इतिहास", noMessages:"अभी कोई संदेश नहीं। पहला संदेश भेजें!",
    exitMsg:"बाहर निकलने के लिए दोबारा दबाएं",
  }
};

// ── Language Context ───────────────────────────────────────────────
const LangCtx = createContext(null);
function LangProvider({ children }) {
  const [lang, _setLang] = useState(() => localStorage.getItem("kfa-lang") || "en");
  const setLang = (l) => { _setLang(l); localStorage.setItem("kfa-lang", l); };
  const t = (key) => T[lang]?.[key] || T.en[key] || key;
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}
const useLang = () => useContext(LangCtx);

// ── Auth Context ───────────────────────────────────────────────────
const AuthCtx = createContext(null);
function AuthProvider({ children }) {
  const [fbUser,  setFbUser]  = useState(null);
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = ADMIN_EMAILS.includes(user?.email || "");

  const loadUser = useCallback(async (fUser) => {
    console.log("LOADUSER: start for", fUser.uid, fUser.email);
    try {
      const ref  = doc(db,"users",fUser.uid);
      const snap = await getDoc(ref);
      const now  = new Date().toISOString();
      let data;
      if (snap.exists()) {
        data = snap.data();
        await updateDoc(ref,{lastActive:now});
        data.lastActive = now;
      } else {
        data = {
          uid:fUser.uid, email:fUser.email||"", name:fUser.displayName||"Farmer",
          photoURL:fUser.photoURL||"", joinDate:now, lastActive:now,
          accessStatus: ADMIN_EMAILS.includes(fUser.email||"") ? "approved" : "pending",
          language:"en",
        };
        await setDoc(ref,data);
      }
      setUser(data);
      console.log("LOADUSER: success, accessStatus =", data.accessStatus);
      if (ADMIN_EMAILS.includes(data.email)) seedIfEmpty();
    } catch(e) { console.error("LOADUSER ERROR:", e?.code, e?.message); }
  },[]);

useEffect(() =>
  {
    const unsub = onAuthStateChanged(auth, async (fUser) => {
      console.log("AUTH STATE CHANGED:", fUser ? fUser.email : "no user");
      setFbUser(fUser);
      if (fUser) await loadUser(fUser);
      else setUser(null);
      setLoading(false);
    });
    return unsub;
  },[loadUser]);

  return (
    <AuthCtx.Provider value={{
      user, fbUser, isAdmin, loading,
      signInWithGoogle: () => {
        console.log("LOGIN: opening Google popup...");
        return Promise.race([
          signInWithPopup(auth, new GoogleAuthProvider()).then(r => {
            console.log("LOGIN: popup resolved for", r?.user?.email);
            return r;
          }),
          new Promise((_, reject) => setTimeout(
            () => reject({ code: "auth/timeout", message: "Sign-in popup took too long to respond." }),
            15000
          )),
        ]);
      },
      signOut: () => fbSignOut(auth),
      refreshUser: () => fbUser && loadUser(fbUser),
    }}>
      {children}
    </AuthCtx.Provider>
  );
}
const useAuth = () => useContext(AuthCtx);

// ── Theme Context ──────────────────────────────────────────────────
const ThemeCtx = createContext(null);
function ThemeProvider({ children }) {
  const [theme, _set] = useState(() => localStorage.getItem("kfa-theme") || "dark");
  const setTheme = (t) => { _set(t); localStorage.setItem("kfa-theme",t); };
  useEffect(() => { document.documentElement.classList.toggle("dark",theme==="dark"); },[theme]);
  return <ThemeCtx.Provider value={{theme,setTheme}}>{children}</ThemeCtx.Provider>;
}
const useTheme = () => useContext(ThemeCtx);

// ── Router Context ─────────────────────────────────────────────────
const RouterCtx = createContext(null);
function RouterProvider({ children }) {
  const get = () => window.location.hash.replace("#","") || "/";
  const [path, setState] = useState(get);
  const setPath = (p) => { window.location.hash = p; };
  useEffect(() => {
    const h = () => setState(get());
    window.addEventListener("hashchange",h);
    return () => window.removeEventListener("hashchange",h);
  },[]);
  return <RouterCtx.Provider value={{path,setPath}}>{children}</RouterCtx.Provider>;
}
const useRouter = () => useContext(RouterCtx);

// ── Utilities ──────────────────────────────────────────────────────
const maskEmail = (e="") => { const [l,d]=e.split("@"); return l?l.slice(0,2)+"***@"+d:e; };
const fmtNow = () => { const d=new Date(); return `${String(d.getDate()).padStart(2,"0")}-${d.toLocaleString("default",{month:"short"})}-${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };
const fmtDate = (iso) => { try { const d=new Date(iso); return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`; } catch(_) { return iso||""; } };
const kfpStatus = (m) => { const days=Math.floor((Date.now()-new Date(m.lastRenewed))/86400000); const limit=m.plan==="yearly"?365:30; const left=limit-days; if(left>7)return{label:`${left} din bache`,color:"green",left}; if(left>0)return{label:`${left} din mein due`,color:"yellow",left}; return{label:`${Math.abs(left)} din late`,color:"red",left}; };
const kfpWA = (m) => { const plan=m.plan==="yearly"?"Yearly — ₹499":"Monthly — ₹99"; const due=new Date(new Date(m.lastRenewed).getTime()+(m.plan==="yearly"?365:30)*86400000); const df=`${String(due.getDate()).padStart(2,"0")}/${String(due.getMonth()+1).padStart(2,"0")}/${due.getFullYear()}`; const msg=`Namaste ${m.name} ji! 🌿\n\nAapki *Kisan Family Pro* membership renewal ka time aa gaya hai.\n\n📋 Plan: ${plan}\n📅 Due Date: ${df}\n\nRenewal ke liye payment karein:\n💳 UPI: priyaharaikbuisness@okaxis\n\nPayment ke baad screenshot zaroor bhejein. 🙏\n\n— Priya Haraik Ventures`; return `https://wa.me/91${m.phone}?text=${encodeURIComponent(msg)}`; };

// ── Base Components ────────────────────────────────────────────────
function Spinner() { return <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"/>; }

function PHLogo({ size=40 }) {
  const hasRealLogo = !PRIYA_HARAIK_LOGO.includes("LOGO_BASE64_PLACEHOLDER");
  if (!hasRealLogo) {
    return (
      <div style={{width:size,height:size*0.5,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontWeight:700,color:"#1B5E20",fontSize:size*0.22}}>Priya Haraik</span>
      </div>
    );
  }
  return <img src={PRIYA_HARAIK_LOGO} alt="Priya Haraik" style={{width:size,height:"auto",objectFit:"contain"}}/>;
}

const WM_POS = [
  {top:"8%",left:"5%"},{top:"8%",left:"55%"},
  {top:"45%",left:"5%"},{top:"45%",left:"55%"},
  {top:"78%",left:"5%"},{top:"78%",left:"55%"},
];

// ── Bottom Nav ─────────────────────────────────────────────────────
function BottomNav() {
  const { path, setPath } = useRouter();
  const { t } = useLang();
  const tabs = [
    { label:t("home"),    route:"/home",    icon:(a)=><svg className={`w-5 h-5 ${a?"text-primary":"text-muted-foreground"}`} fill={a?"currentColor":"none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a?0:1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg> },
    { label:t("courses"), route:"/courses", icon:(a)=><svg className={`w-5 h-5 ${a?"text-primary":"text-muted-foreground"}`} fill={a?"currentColor":"none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a?0:1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg> },
    { label:t("profile"), route:"/profile", icon:(a)=><svg className={`w-5 h-5 ${a?"text-primary":"text-muted-foreground"}`} fill={a?"currentColor":"none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a?0:1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> },
  ];
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] bg-card border-t border-border flex z-40">
      {tabs.map(tab => {
        const active = path===tab.route;
        return (
          <button key={tab.route} onClick={()=>setPath(tab.route)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 ${active?"text-primary":"text-muted-foreground"}`}>
            {tab.icon(active)}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ── Video Card ─────────────────────────────────────────────────────
function VideoCard({ video, compact=false, progress=null }) {
  const { setPath } = useRouter();
  const thumb = `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`;
  const pct = progress?.progress || 0;

  if (compact) return (
    <div onClick={()=>setPath(`/player/${video.id}`)}
      className="flex gap-3 items-center p-3 bg-card border border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 relative">
        <img src={thumb} alt="" className="w-full h-full object-cover" onError={e=>e.target.style.display="none"}/>
        <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
        </div>
        {pct > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
            <div className="h-full bg-red-500" style={{width:`${pct}%`}}/>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{video.title}</p>
        <p className="text-xs mt-0.5 font-medium" style={{color:video.categoryColor}}>{video.category}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground">⏱ {video.duration}</p>
          {pct > 0 && <span className="text-[10px] text-red-400 font-medium">{pct}% viewed</span>}
        </div>
      </div>
      {video.isNew && <span className="text-[9px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded flex-shrink-0">NEW</span>}
    </div>
  );

  return (
    <div onClick={()=>setPath(`/player/${video.id}`)} className="min-w-[160px] flex-shrink-0 cursor-pointer group">
      <div className="relative w-40 h-24 rounded-xl overflow-hidden mb-2">
        <img src={thumb} alt="" className="w-full h-full object-cover"
          onError={e=>{e.target.style.display="none"; e.target.parentElement.style.background=video.categoryColor+"44";}}/>
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 flex items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-primary/80 flex items-center justify-center">
            <svg className="w-4 h-4 text-white ml-0.5" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        {video.isNew && <span className="absolute top-2 left-2 text-[9px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded">NEW</span>}
        <span className="absolute bottom-2 right-2 text-[10px] bg-black/70 text-white px-1 py-0.5 rounded">{video.duration}</span>
        {pct > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
            <div className="h-full bg-red-500" style={{width:`${pct}%`}}/>
          </div>
        )}
      </div>
      <p className="text-xs text-foreground line-clamp-2 leading-snug">{video.title}</p>
      {pct > 0 && <p className="text-[10px] text-red-400 mt-0.5">{pct}% viewed</p>}
    </div>
  );
}

// ================================================================
// SPLASH SCREEN (Requirement #12)
// ================================================================
function SplashScreen() {
  const [pct, setPct] = useState(0);
  const { user, loading, isAdmin } = useAuth();
  const { setPath } = useRouter();

  useEffect(() => {
    const t = setInterval(()=>setPct(p=>Math.min(p+5,100)),40);
    return ()=>clearInterval(t);
  },[]);

  useEffect(() => {
    if (loading || pct < 100) return;
    setTimeout(()=>{
      const termsAccepted = localStorage.getItem("kfa-terms-accepted");
      if (!user) setPath(termsAccepted ? "/login" : "/terms");
      else if (isAdmin||user.accessStatus==="approved") setPath("/home");
      else setPath("/access-pending");
    },300);
  },[loading,pct,user,isAdmin]);

  return (
    <div className="w-full max-w-[420px] mx-auto h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-red-50 pointer-events-none"/>
      <div className="mb-8 flex items-center justify-center">
        <PHLogo size={200}/>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">Kisan Family Academy</h1>
      <p className="text-sm text-gray-500 italic mb-12 text-center">Apple Farming Knowledge Hub</p>
      {/* White + Red animated progress bar */}
      <div className="w-64 flex flex-col items-center gap-2">
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-75"
            style={{width:`${pct}%`, background:"linear-gradient(90deg,#ef4444,#ffffff,#ef4444)", backgroundSize:"200% 100%"}}/>
        </div>
        <p className="text-xs text-gray-400">{loading?"Loading...":"Welcome to Kisan Family Academy"}</p>
      </div>
      <div className="absolute bottom-7 left-0 right-0 flex items-center justify-center">
        <span className="text-xs text-gray-400 italic">A product by Priya Haraik Ventures</span>
      </div>
    </div>
  );
}

// ================================================================
// TERMS & CONDITIONS SCREEN (Requirement #13)
// ================================================================
function TermsScreen() {
  const [accepted, setAccepted] = useState(false);
  const { setPath } = useRouter();
  const { t } = useLang();

  const proceed = () => {
    if (!accepted) return;
    localStorage.setItem("kfa-terms-accepted","true");
    setPath("/login");
  };

  return (
    <div className="w-full max-w-[420px] mx-auto min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-5 pt-10 pb-4 border-b border-border flex items-center gap-3">
        <PHLogo size={36}/>
        <h1 className="text-lg font-bold text-foreground">{t("termsTitle")}</h1>
      </div>

      {/* Critical Warning in Bold Red - UNAVOIDABLE at top (Requirement #13) */}
      <div className="mx-5 mt-4 p-4 bg-red-50 dark:bg-red-950/50 border-2 border-red-600 rounded-xl">
        <p className="text-xs font-extrabold text-red-700 dark:text-red-400 leading-relaxed">
          🚨 {t("termsWarning")}
        </p>
      </div>

      {/* Terms Text */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <pre className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans">{FULL_TERMS}</pre>
        </div>
      </div>

      {/* Accept + Button */}
      <div className="px-5 py-4 border-t border-border bg-background">
        <label className="flex items-start gap-3 cursor-pointer mb-4">
          <input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}
            className="w-5 h-5 mt-0.5 flex-shrink-0 accent-red-500"/>
          <span className="text-sm text-foreground leading-relaxed">{t("termsAccept")}</span>
        </label>
        <button onClick={proceed} disabled={!accepted}
          className="w-full bg-primary text-white rounded-xl py-3 font-medium disabled:opacity-40 transition-opacity">
          {t("termsContinue")} →
        </button>
      </div>
    </div>
  );
}

// ================================================================
// LOGIN SCREEN
// ================================================================
function LoginScreen() {
  const { signInWithGoogle, user, isAdmin } = useAuth();
  const { setPath } = useRouter();
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState("");

  useEffect(()=>{
    if (!user) return;
    if (isAdmin||user.accessStatus==="approved") setPath("/home");
    else setPath("/access-pending");
  },[user,isAdmin]);

  const login = async () => {
    setBusy(true); setErr("");
    try { await signInWithGoogle(); }
    catch(e) {
      console.error("LOGIN ERROR:", e?.code, e?.message);
      if (e?.code==="auth/popup-closed-by-user") setErr("Sign in cancel ho gaya.");
      else if (e?.code==="auth/timeout") setErr("Sign in mein bahut time lag raha hai. Apna internet check karke dobara try karein.");
      else setErr("Sign in fail hua. Dobara try karein.");
    }
    finally { setBusy(false); }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4">
          <PHLogo size={160}/>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary">Kisan Family Academy</h1>
            <p className="text-sm text-muted-foreground mt-1">Apple Farming Knowledge Hub</p>
          </div>
        </div>
        <div className="w-full flex flex-col gap-4">
          <p className="text-center text-sm text-muted-foreground">Apne Google account se sign in karein</p>
          <button onClick={login} disabled={busy}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 border border-gray-200 rounded-xl py-3 px-4 font-medium shadow-sm hover:shadow-md disabled:opacity-60 transition-all">
            {busy ? <Spinner/> : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {busy ? t("signingIn") : t("signIn")}
          </button>
          {err && <p className="text-sm text-red-500 text-center">{err}</p>}
        </div>
        <div className="w-full bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            <span className="text-primary font-medium">Kisan Family Pro</span> ka access admin dwara manually approve hota hai.
          </p>
        </div>
        <button onClick={()=>setPath("/terms")} className="text-xs text-muted-foreground underline">
          Terms & Conditions padhein
        </button>
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
  const { t } = useLang();
  const [refreshing, setRefreshing] = useState(false);
  const blocked = user?.accessStatus==="blocked";

  const doRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
    if (user?.accessStatus==="approved") setPath("/home");
  };

  return (
    <div className="w-full max-w-[420px] mx-auto min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-7">
        <PHLogo size={80}/>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${blocked?"bg-red-100 dark:bg-red-950":"bg-primary/10"}`}>
          {blocked
            ? <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
            : <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          }
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">{blocked?t("accessBlocked"):t("accessPending")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{blocked?t("blockedMsg"):t("pendingMsg")}</p>
        </div>
        {user && <div className="w-full bg-card border border-border rounded-xl p-4 text-center"><p className="text-xs text-muted-foreground mb-1">Signed in as</p><p className="text-sm font-medium text-foreground">{user.email}</p></div>}
        <div className="w-full flex flex-col gap-3">
          {!blocked && (
            <button onClick={doRefresh} disabled={refreshing}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-3 font-medium disabled:opacity-60">
              {refreshing?<Spinner/>:null} {refreshing?"Checking...":t("checkStatus")}
            </button>
          )}
          <button onClick={async()=>{await signOut();setPath("/login");}}
            className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground border border-border rounded-xl py-3 font-medium">
            {t("signOut")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// HOME SCREEN (Requirement #6: Continue Watching sorted by lastViewedAt)
// ================================================================
function HomeScreen() {
  const { user }    = useAuth();
  const { setPath } = useRouter();
  const { t }       = useLang();
  const [videos,   setVideos]   = useState([]);
  const [progress, setProgress] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");

  // ── Back button double-tap to exit (Requirement #11) ────────────
  const lastBackRef = useRef(0);
  const [showExitToast, setShowExitToast] = useState(false);
  useEffect(()=>{
    const handlePop = (e) => {
      const now = Date.now();
      if (now - lastBackRef.current < 2000) {
        window.close();
        // For PWA/Android fallback:
        if (window.Android?.finish) window.Android.finish();
      } else {
        lastBackRef.current = now;
        setShowExitToast(true);
        setTimeout(()=>setShowExitToast(false), 2000);
        window.history.pushState(null, "", window.location.href);
      }
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  },[]);

  useEffect(()=>{
    getDocs(query(collection(db,"videos"),orderBy("order")))
      .then(s=>setVideos(s.docs.map(d=>({id:d.id,...d.data()}))))
      .catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    if (!user?.uid) return;
    getDocs(collection(db,"progress",user.uid,"videos"))
      .then(s=>{const p={};s.docs.forEach(d=>{p[d.id]={videoId:d.id,...d.data()};});setProgress(p);})
      .catch(()=>{});
  },[user?.uid]);

  const name = user?.name?.split(" ")[0]||"Farmer";
  const q    = search.trim();
  const results = q.length>=2 ? videos.filter(v=>
    v.title.toLowerCase().includes(q.toLowerCase())||
    v.category.toLowerCase().includes(q.toLowerCase())||
    (v.tags||[]).some(tag=>tag.toLowerCase().includes(q.toLowerCase()))
  ) : [];

  // Requirement #6: Sort by last_viewed_timestamp DESCENDING (most recent first)
  const continueW = videos
    .filter(v=>progress[v.id]&&!progress[v.id].watched&&(progress[v.id].progress||0)>0)
    .sort((a,b)=>new Date(progress[b.id]?.lastViewedAt||0)-new Date(progress[a.id]?.lastViewedAt||0));

  const recent = [...videos].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5);
  const cats   = [...new Set(videos.map(v=>v.category))];
  const byCat  = Object.fromEntries(cats.map(c=>[c,videos.filter(v=>v.category===c)]));

  // ── Scroll-arrow support: each row registers its own scroll element here,
  // keyed by section name, so the arrow button can scroll the right row ──
  const rowRefs = useRef({});
  const setRowRef = (key) => (el) => { if (el) rowRefs.current[key] = el; };
  const scrollRow = (key) => {
    const el = rowRefs.current[key];
    if (el) el.scrollBy({ left: 220, behavior: "smooth" });
  };
  function RightArrowBtn({ rowKey }) {
    return (
      <button onClick={()=>scrollRow(rowKey)} aria-label="Scroll right"
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center shadow-lg active:scale-90 transition-transform">
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    );
  }

  // ── Feed-scroll effect: as the page is scrolled vertically, nudge each
  // horizontal row a little to the left so more content peeks into view ──
  const contentRef = useRef(null);
  const lastScrollTop = useRef(0);
  useEffect(()=>{
    const container = contentRef.current;
    if (!container) return;
    lastScrollTop.current = container.scrollTop;
    const onScroll = () => {
      const delta = container.scrollTop - lastScrollTop.current;
      lastScrollTop.current = container.scrollTop;
      Object.values(rowRefs.current).forEach(el=>{
        if (!el) return;
        const max = el.scrollWidth - el.clientWidth;
        if (max <= 0) return;
        el.scrollLeft = Math.min(max, Math.max(0, el.scrollLeft + delta*0.25));
      });
    };
    container.addEventListener("scroll", onScroll, { passive:true });
    return ()=>container.removeEventListener("scroll", onScroll);
  },[]);

  return (
    <div className="w-full max-w-[900px] mx-auto min-h-screen bg-background flex flex-col">
      {/* Double-tap exit toast */}
      {showExitToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-xs px-4 py-2 rounded-full shadow-lg">
          {t("exitMsg")}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-10 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          {user?.photoURL
            ? <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0"/>
            : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-green-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{user?.name?.slice(0,2).toUpperCase()||"KA"}</div>
          }
          <div>
            <p className="text-base font-bold text-foreground">{t("namaste")}, {name} 🙏</p>
            <p className="text-xs italic text-green-500">{t("tagline")}</p>
          </div>
        </div>
        {/* Requirement #1: Company logo top-right */}
        <PHLogo size={52}/>
      </div>

      {/* Search */}
      <div className="px-5 py-3">
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5">
          <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
          <input className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            placeholder={t("search")} value={search} onChange={e=>setSearch(e.target.value)}/>
          {search && <button onClick={()=>setSearch("")}><svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>}
        </div>
      </div>

      {/* Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto pb-24">
        {q.length>=2 ? (
          <div className="px-5">
            <p className="text-xs font-semibold text-primary mb-3">{results.length} results — "{q}"</p>
            {results.length===0
              ? <div className="text-center py-12"><p className="text-muted-foreground text-sm">Koi video nahi mili</p></div>
              : <div className="flex flex-col gap-3">{results.map(v=><VideoCard key={v.id} video={v} compact progress={progress[v.id]}/>)}</div>
            }
          </div>
        ) : (
          <>
            {continueW.length>0 && (
              <section className="mb-2">
                <p className="px-5 pt-4 pb-2 text-xs font-bold text-primary">{t("continueWatching")}</p>
                <div className="relative">
                  <div ref={setRowRef("continueW")} className="flex gap-3 overflow-x-auto px-5 pb-3" style={{scrollbarWidth:"none"}}>
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
                            <div className="h-full bg-red-500" style={{width:`${progress[v.id]?.progress||0}%`}}/>
                          </div>
                          <p className="text-[10px] text-red-400 mt-1">{progress[v.id]?.progress||0}% {t("viewed")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <RightArrowBtn rowKey="continueW"/>
                </div>
              </section>
            )}
            <section className="mb-2">
              <p className="px-5 pt-4 pb-2 text-xs font-bold text-primary">{t("recentlyAdded")}</p>
              <div className="relative">
                <div ref={setRowRef("recent")} className="flex gap-3 overflow-x-auto px-5 pb-3" style={{scrollbarWidth:"none"}}>
                  {loading
                    ? [1,2,3].map(i=><div key={i} className="min-w-[160px] flex-shrink-0"><div className="w-40 h-24 rounded-xl bg-card animate-pulse mb-2"/><div className="h-3 bg-card rounded animate-pulse w-28"/></div>)
                    : recent.map(v=><VideoCard key={v.id} video={v} progress={progress[v.id]}/>)
                  }
                </div>
                <RightArrowBtn rowKey="recent"/>
              </div>
            </section>
            {!loading && cats.map(cat=>{
              const vs = byCat[cat];
              return (
                <section key={cat} className="mb-2">
                  <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                    <div className="w-1.5 h-4 rounded-full" style={{background:vs[0]?.categoryColor||"#2E7D32"}}/>
                    <p className="text-xs font-bold text-primary">{cat.toUpperCase()}</p>
                  </div>
                  <div className="relative">
                    <div ref={setRowRef(cat)} className="flex gap-3 overflow-x-auto px-5 pb-3" style={{scrollbarWidth:"none"}}>
                      {vs.map(v=><VideoCard key={v.id} video={v} progress={progress[v.id]}/>)}
                    </div>
                    <RightArrowBtn rowKey={cat}/>
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
// COURSES SCREEN (Requirement #4: Single card, See Content button)
// ================================================================
function CoursesScreen() {
  const { setPath } = useRouter();
  const { t }       = useLang();
  const [videos, setVideos]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showList, setShowList] = useState(false);

  useEffect(()=>{
    getDocs(query(collection(db,"videos"),orderBy("order")))
      .then(s=>setVideos(s.docs.map(d=>({id:d.id,...d.data()}))))
      .catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const cats = [...new Set(videos.map(v=>v.category))];
  const byCat = Object.fromEntries(cats.map(c=>[c,videos.filter(v=>v.category===c)]));

  // Sub-screen: playlist/chapter list (opens ONLY after See Content click)
  if (showList) return (
    <div className="w-full max-w-[900px] mx-auto min-h-screen bg-background flex flex-col">
      <div className="px-5 pt-10 pb-4 border-b border-border flex items-center gap-3">
        <button onClick={()=>setShowList(false)}>
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">Kisan Family Pro</h1>
          <p className="text-xs text-muted-foreground">{videos.length} videos</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-24">
        {loading
          ? <div className="flex flex-col gap-3 px-5 pt-4">{[1,2,3,4,5].map(i=><div key={i} className="h-20 bg-card rounded-xl animate-pulse"/>)}</div>
          : cats.map(cat=>{
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

  // Main Courses tab: only ONE clean card visible
  return (
    <div className="w-full max-w-[900px] mx-auto min-h-screen bg-background flex flex-col">
      <div className="px-5 pt-10 pb-4 border-b border-border">
        <h1 className="text-lg font-bold text-foreground">{t("courses")}</h1>
        <p className="text-xs text-muted-foreground mt-1">Premium Courses</p>
      </div>
      <div className="flex-1 overflow-y-auto pb-24 px-5 pt-6">

        {/* Course Logo first, then Title, then See Content button */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-5">
          <div className="bg-gradient-to-br from-green-900 to-green-700 p-6 flex flex-col items-center gap-4">
            {/* Requirement #4: Course logo first */}
            <PHLogo size={80}/>
            {/* Requirement #4: Course title */}
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">Kisan Family</h2>
              <p className="text-xs text-green-200 mt-1">Apple Farming Complete Course</p>
            </div>
            <div className="flex gap-3 text-center">
              <div><p className="text-lg font-bold text-white">{videos.length}</p><p className="text-[10px] text-green-200">Videos</p></div>
              <div className="w-px bg-green-600"/>
              <div><p className="text-lg font-bold text-white">{cats.length}</p><p className="text-[10px] text-green-200">Categories</p></div>
              <div className="w-px bg-green-600"/>
              <div><p className="text-lg font-bold text-white">Pro</p><p className="text-[10px] text-green-200">Level</p></div>
            </div>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {cats.map(c=>(
                <span key={c} className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full">{c}</span>
              ))}
            </div>
            {/* Requirement #4: See Content button - playlist loads ONLY after this click */}
            <button onClick={()=>setShowList(true)}
              className="w-full bg-primary text-white rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {t("seeContent")}
            </button>
          </div>
        </div>

        {/* Requirement #4: Coming Soon placeholder for future courses */}
        <div className="bg-card border border-dashed border-border rounded-2xl p-6 flex flex-col items-center gap-3 opacity-60">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">New Course</p>
            <span className="text-xs bg-orange-500 text-white px-3 py-1 rounded-full mt-2 inline-block">{t("comingSoon")} 🚀</span>
          </div>
        </div>

      </div>
      <BottomNav/>
    </div>
  );
}

// ================================================================
// VIDEO PLAYER SCREEN
// Requirements: #5 Anti-piracy red warning, #8 Red progress bar,
//               #9 Video details formatting, #10 Collapsible desc + recommendations
// ================================================================
function VideoPlayerScreen({ videoId }) {
  const { user }    = useAuth();
  const { setPath } = useRouter();
  const { t }       = useLang();

  const [video,    setVideo]    = useState(null);
  const [videos,   setVideos]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [progress, setProgress] = useState({});
  const [watchPct, setWatchPct] = useState(0);
  const [wmIdx,    setWmIdx]    = useState(0);
  const [descOpen, setDescOpen] = useState(false);
  const timerRef = useRef(null);

  useEffect(()=>{
    Promise.all([
      getDoc(doc(db,"videos",videoId)),
      getDocs(query(collection(db,"videos"),orderBy("order"))),
    ]).then(([vs,all])=>{
      if (vs.exists()) setVideo({id:vs.id,...vs.data()});
      setVideos(all.docs.map(d=>({id:d.id,...d.data()})));
    }).catch(()=>{}).finally(()=>setLoading(false));
  },[videoId]);

  useEffect(()=>{
    if (!user?.uid) return;
    getDocs(collection(db,"progress",user.uid,"videos"))
      .then(s=>{const p={};s.docs.forEach(d=>{p[d.id]={videoId:d.id,...d.data()};});setProgress(p);setWatchPct(p[videoId]?.progress||0);})
      .catch(()=>{});
  },[user?.uid,videoId]);

  useEffect(()=>{ const t=setInterval(()=>setWmIdx(i=>(i+1)%WM_POS.length),4000); return()=>clearInterval(t); },[]);

  useEffect(()=>{
    if (!user?.uid) return;
    timerRef.current = setInterval(()=>{
      setWatchPct(prev=>{
        const next = Math.min(prev+2,100);
        if (next>prev) {
          const entry = {
            videoId,
            watched: next>=80,
            watchedAt: new Date().toISOString(),
            lastViewedAt: new Date().toISOString(), // used for Requirement #6 sorting
            progress: next
          };
          setDoc(doc(db,"progress",user.uid,"videos",videoId),entry,{merge:true}).catch(()=>{});
        }
        return next;
      });
    },10000);
    return()=>clearInterval(timerRef.current);
  },[user?.uid,videoId]);

  // Recommendation engine: same category first, then others (Requirement #10)
  const recommendations = videos
    .filter(v=>v.id!==videoId)
    .sort((a,b)=>{
      const sameA = a.category===video?.category;
      const sameB = b.category===video?.category;
      if (sameA&&!sameB) return -1;
      if (!sameA&&sameB) return 1;
      return 0;
    }).slice(0,5);

  const wm = WM_POS[wmIdx];

  if (loading) return <div className="w-full max-w-[900px] mx-auto min-h-screen bg-background flex items-center justify-center"><Spinner/></div>;
  if (!video) return (
    <div className="w-full max-w-[900px] mx-auto min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">Video nahi mili</p>
      <button onClick={()=>setPath("/home")} className="text-primary text-sm">Home par jao</button>
    </div>
  );

  return (
    <div className="w-full max-w-[900px] mx-auto min-h-screen bg-background flex flex-col">
      {/* Video Player on Top (Requirement #9) */}
      <div className="relative bg-black w-full" style={{paddingTop:"56.25%"}}>
        <iframe src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0&modestbranding=1`}
          title={video.title} className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/>
        {/* Floating watermark */}
        <div className="absolute pointer-events-none select-none" style={{
          top:wm.top, left:wm.left, transition:"all 1.5s ease", zIndex:10,
          color:"rgba(255,255,255,0.35)", fontFamily:"monospace", fontSize:"11px",
          lineHeight:1.4, textShadow:"0 1px 3px rgba(0,0,0,0.8)", userSelect:"none",
        }}>
          <div>{maskEmail(user?.email)}</div>
          <div>{fmtNow()}</div>
        </div>
      </div>

      {/* Requirement #8: Neon Red progress bar (replaces old green) */}
      <div className="h-1.5 bg-border">
        <div className="h-full transition-all duration-1000"
          style={{width:`${watchPct}%`, background:"linear-gradient(90deg,#ef4444,#ff1744,#ef4444)"}}/>
      </div>

      {/* Requirement #5: Anti-piracy warning in RED below player */}
      <div className="mx-4 mt-3 px-3 py-2 bg-red-50 dark:bg-red-950/40 border border-red-400 dark:border-red-700 rounded-lg">
        <p className="text-[11px] text-red-600 dark:text-red-400 font-bold leading-relaxed">{t("piracyWarning")}</p>
      </div>

      {/* Video Info */}
      <div className="flex-1 overflow-y-auto pb-6">
        <div className="px-4 pt-3">
          <button onClick={()=>setPath("/home")} className="flex items-center gap-1 text-primary text-sm mb-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            {t("backBtn")}
          </button>

          {/* Requirement #9: Topic header directly beneath player */}
          <div className="bg-card border border-border rounded-xl px-4 py-3 mb-3">
            <p className="text-xs text-muted-foreground mb-1">{t("videoDetails")} =</p>
            <p className="text-base font-bold text-foreground leading-snug">{video.title}</p>
          </div>

          {/* Requirement #9: Metadata row - Category, Duration, Upload Date */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-card border border-border rounded-xl px-3 py-2.5 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">{t("category")}</p>
              <p className="text-xs font-semibold leading-tight" style={{color:video.categoryColor}}>{video.category}</p>
            </div>
            <div className="bg-card border border-border rounded-xl px-3 py-2.5 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">{t("duration")}</p>
              <p className="text-xs font-semibold text-foreground">{video.duration}</p>
            </div>
            <div className="bg-card border border-border rounded-xl px-3 py-2.5 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">{t("uploadDate")}</p>
              <p className="text-xs font-semibold text-foreground">{fmtDate(video.createdAt)}</p>
            </div>
          </div>

          {/* Requirement #10: Collapsible description box - closed by default */}
          {video.description && (
            <div className="mb-4">
              <button onClick={()=>setDescOpen(v=>!v)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-xl text-sm font-medium text-primary">
                <span>{descOpen?t("hideDesc"):t("readDesc")}</span>
              </button>
              {descOpen && (
                <div className="mt-2 px-4 py-3 bg-card border border-border rounded-xl">
                  <p className="text-sm text-foreground leading-relaxed">{video.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {video.tags?.length>0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {video.tags.map(tag=>(
                <span key={tag} className="text-[10px] bg-card border border-border text-muted-foreground px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Requirement #10: YouTube-style video recommendations with progress indicators */}
        {recommendations.length>0 && (
          <div className="px-4 mt-2">
            <div className="h-px bg-border mb-4"/>
            <p className="text-xs font-bold text-muted-foreground mb-3">{t("upNext")}</p>
            <div className="flex flex-col gap-3">
              {recommendations.map(v=>(
                <VideoCard key={v.id} video={v} compact progress={progress[v.id]}/>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ================================================================
// SUPPORT CHAT SCREEN (Requirement #3: Persistent chat with onSnapshot)
// ================================================================
function ChatScreen() {
  const { user }    = useAuth();
  const { setPath } = useRouter();
  const { t }       = useLang();
  const [messages,  setMessages]  = useState([]);
  const [newMsg,    setNewMsg]    = useState("");
  const [sending,   setSending]   = useState(false);
  const bottomRef = useRef(null);

  // FIX: onSnapshot ensures messages persist across refreshes
  // Messages are fetched from Firestore on mount AND updated in real-time
  useEffect(()=>{
    if (!user?.uid) return;
    const q = query(
      collection(db,"chats",user.uid,"messages"),
      orderBy("createdAt","asc")
    );
    // onSnapshot = real-time listener, NOT a one-time fetch
    // This means messages reload automatically even after refresh
    const unsub = onSnapshot(q, (snap)=>{
      setMessages(snap.docs.map(d=>({id:d.id,...d.data()})));
    }, ()=>{});
    return () => unsub();
  },[user?.uid]);

  // Also ensure the chat thread document exists with user info
  useEffect(()=>{
    if (!user?.uid) return;
    setDoc(doc(db,"chats",user.uid), {
      userId: user.uid,
      userName: user.name||"",
      userEmail: user.email||"",
      updatedAt: new Date().toISOString(),
    }, {merge:true}).catch(()=>{});
  },[user?.uid]);

  useEffect(()=>{
    bottomRef.current?.scrollIntoView({behavior:"smooth"});
  },[messages]);

  const sendMessage = async () => {
    if (!newMsg.trim()||!user) return;
    setSending(true);
    const text = newMsg.trim();
    setNewMsg("");
    try {
      await addDoc(collection(db,"chats",user.uid,"messages"),{
        text, sender:"user",
        createdAt: new Date().toISOString(),
        read: false,
      });
      // Update thread metadata
      await updateDoc(doc(db,"chats",user.uid),{
        lastMessage: text,
        lastMessageAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch(_){} finally{setSending(false);}
  };

  return (
    <div className="w-full max-w-[900px] mx-auto min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-5 pt-10 pb-4 border-b border-border flex items-center gap-3">
        <button onClick={()=>setPath("/profile")}>
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">{t("supportChat")}</h1>
            <p className="text-[10px] text-green-500">Priya Haraik Ventures</p>
          </div>
        </div>
      </div>

      {/* Messages — loaded from Firestore on every mount (fix for persistence bug) */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length===0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">{t("noMessages")}</p>
          </div>
        )}
        {messages.map(msg=>{
          const isUser = msg.sender==="user";
          return (
            <div key={msg.id} className={`flex ${isUser?"justify-end":"justify-start"}`}>
              {!isUser && (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                  <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                </div>
              )}
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed
                ${isUser
                  ? "bg-primary text-white rounded-br-sm"
                  : "bg-card border border-border text-foreground rounded-bl-sm"
                }`}>
                {msg.text}
                <p className={`text-[10px] mt-1 ${isUser?"text-white/60":"text-muted-foreground"}`}>
                  {fmtDate(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-background flex gap-2 items-end">
        <textarea
          className="flex-1 bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary transition-colors"
          rows={1} style={{maxHeight:"100px"}}
          placeholder={t("typeMessage")}
          value={newMsg}
          onChange={e=>setNewMsg(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();} }}
        />
        <button onClick={sendMessage} disabled={sending||!newMsg.trim()}
          className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 disabled:opacity-50">
          {sending
            ? <Spinner/>
            : <svg className="w-5 h-5 text-white ml-0.5" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          }
        </button>
      </div>
    </div>
  );
}

// ================================================================
// PROFILE SCREEN (Requirement #7: Working Language Switcher)
// ================================================================
function ProfileScreen() {
  const { user, isAdmin, signOut } = useAuth();
  const { theme, setTheme }        = useTheme();
  const { lang, setLang, t }       = useLang();
  const { setPath }                = useRouter();

  const [videos,   setVideos]    = useState([]);
  const [progress, setProgress]  = useState({});
  const [questions,setQuestions] = useState([]);
  const [newQ,     setNewQ]      = useState("");
  const [cert,     setCert]      = useState(null);
  const [submQ,    setSubmQ]     = useState(false);
  const [reqCert,  setReqCert]   = useState(false);
  const [certMsg,  setCertMsg]   = useState("");

  useEffect(()=>{
    getDocs(query(collection(db,"videos"),orderBy("order"))).then(s=>setVideos(s.docs.map(d=>({id:d.id,...d.data()})))).catch(()=>{});
  },[]);

  useEffect(()=>{
    if (!user?.uid) return;
    getDocs(collection(db,"progress",user.uid,"videos")).then(s=>{const p={};s.docs.forEach(d=>{p[d.id]={videoId:d.id,...d.data()};});setProgress(p);}).catch(()=>{});
    getDocs(query(collection(db,"questions"),where("userId","==",user.uid),orderBy("createdAt","desc"))).then(s=>setQuestions(s.docs.map(d=>({id:d.id,...d.data()})))).catch(()=>{});
    getDocs(query(collection(db,"certificates"),where("userId","==",user.uid))).then(s=>{if(!s.empty)setCert({id:s.docs[0].id,...s.docs[0].data()});}).catch(()=>{});
  },[user?.uid]);

  const watched    = Object.values(progress).filter(p=>p.watched).length;
  const total      = videos.length;
  const completion = total>0?Math.round((watched/total)*100):0;

  const submitQ = async () => {
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
          <PHLogo size={44}/>
        </div>

        {/* Progress */}
        <div className="px-5 mt-4">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs font-bold text-muted-foreground mb-3">PROGRESS</p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[[t("watched"),watched,"text-primary"],[t("total"),total,"text-foreground"],[t("complete"),`${completion}%`,"text-foreground"]].map(([l,v,c])=>(
                <div key={l} className="text-center"><p className={`text-2xl font-bold ${c}`}>{v}</p><p className="text-[10px] text-muted-foreground">{l}</p></div>
              ))}
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full transition-all" style={{width:`${completion}%`}}/>
            </div>
          </div>
        </div>

        {/* Settings: Theme + Language Switcher (Requirement #7 - FIXED) */}
        <div className="px-5 mt-4">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
              <span className="text-sm text-foreground">{t("theme")}</span>
              <div className="flex gap-1">
                {["light","dark"].map(th=>(
                  <button key={th} onClick={()=>setTheme(th)}
                    className={`text-xs px-3 py-1 rounded-lg transition-colors ${theme===th?"bg-primary text-white":"bg-secondary text-secondary-foreground"}`}>
                    {th==="light"?`${t("light")} ☀️`:`${t("dark")} 🌙`}
                  </button>
                ))}
              </div>
            </div>
            {/* Requirement #7: Language switcher - properly connected to LangCtx */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm text-foreground">{t("language")}</span>
              <div className="flex gap-1">
                {[["en","English"],["hi","हिंदी"]].map(([code,label])=>(
                  <button key={code} onClick={()=>setLang(code)}
                    className={`text-xs px-3 py-1 rounded-lg transition-colors ${lang===code?"bg-primary text-white":"bg-secondary text-secondary-foreground"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Support Chat Button */}
        <div className="px-5 mt-4">
          <button onClick={()=>setPath("/chat")}
            className="w-full flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              <span className="text-sm font-medium text-foreground">💬 {t("supportChat")}</span>
            </div>
            <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>

        {/* Certificate */}
        <div className="px-5 mt-4">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-sm font-semibold text-foreground mb-3">🏆 {t("certificate")}</p>
            {cert ? (
              <div className={`text-xs rounded-lg px-3 py-2 ${cert.status==="approved"?"bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400":cert.status==="rejected"?"bg-red-100 dark:bg-red-950 text-red-600":"bg-secondary text-secondary-foreground"}`}>
                {cert.status==="approved"?"✅ Certificate approve ho gaya!":cert.status==="rejected"?"❌ Reject hua. Admin se contact karein.":"⏳ Admin review kar raha hai."}
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>{completion}% complete</span><span>80% chahiye</span></div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden"><div className="h-full bg-red-500 rounded-full" style={{width:`${Math.min(completion,100)}%`}}/></div>
                </div>
                <button onClick={requestCert} disabled={reqCert||completion<80}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50">
                  {reqCert?<Spinner/>:null} {t("requestCert")}
                </button>
                {certMsg && <p className="text-xs text-muted-foreground text-center mt-2">{certMsg}</p>}
              </>
            )}
          </div>
        </div>

        {/* Ask Question */}
        <div className="px-5 mt-4">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-sm font-semibold text-foreground mb-3">❓ {t("askQuestion")}</p>
            <textarea className="w-full bg-background border border-border rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary transition-colors"
              rows={3} placeholder="Apna farming sawaal yahan likho..." value={newQ} onChange={e=>setNewQ(e.target.value)}/>
            <button onClick={submitQ} disabled={submQ||!newQ.trim()}
              className="mt-2 flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50">
              {submQ?<Spinner/>:null} {t("submitQ")}
            </button>
            {questions.length>0 && (
              <div className="mt-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-muted-foreground">{t("yourQuestions")}</p>
                {questions.map(q=>(
                  <div key={q.id} className="bg-background border border-border rounded-xl p-3">
                    <p className="text-sm text-foreground mb-1">{q.question}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${q.status==="answered"?"bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400":"bg-secondary text-muted-foreground"}`}>
                      {q.status==="answered"?`✅ ${t("answered")}`:`⏳ ${t("pending")}`}
                    </span>
                    {q.answer && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-[10px] text-primary font-semibold mb-1">{t("adminReply")}</p>
                        <p className="text-sm text-foreground">{q.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Admin Link */}
        {isAdmin && (
          <div className="px-5 mt-4">
            <button onClick={()=>setPath("/admin")}
              className="w-full flex items-center justify-between bg-primary/10 border border-primary/20 text-primary rounded-xl px-4 py-3">
              <span className="text-sm font-medium">🛡️ {t("adminPanel")}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        )}

        {/* Sign Out */}
        <div className="px-5 mt-4 mb-4">
          <button onClick={async()=>{await signOut();setPath("/login");}}
            className="w-full flex items-center justify-center gap-2 border border-red-300 dark:border-red-800 text-red-500 rounded-xl py-3 text-sm font-medium">
            {t("signOut")}
          </button>
        </div>
      </div>
      <BottomNav/>
    </div>
  );
}

// ================================================================
// ADMIN PANEL
// ================================================================
const ADMIN_NAV = [
  {path:"/admin/dashboard",     label:"Dashboard"},
  {path:"/admin/students",      label:"Students"},
  {path:"/admin/approvals",     label:"Approvals"},
  {path:"/admin/videos",        label:"Videos"},
  {path:"/admin/questions",     label:"Questions"},
  {path:"/admin/chat",          label:"Support Chat 💬"},
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <button onClick={()=>setMenu(v=>!v)} className="p-1.5 rounded-lg hover:bg-secondary">
            {menu
              ? <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              : <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
            }
          </button>
          <PHLogo size={28}/>
          <span className="text-sm font-bold text-foreground">Admin Panel</span>
        </div>
        <button onClick={()=>setPath("/home")} className="p-1.5 rounded-lg hover:bg-secondary">
          <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        </button>
      </div>
      {menu && (
        <div className="fixed inset-0 z-40 flex" onClick={()=>setMenu(false)}>
          <div className="w-64 bg-card border-r border-border h-full flex flex-col shadow-xl" onClick={e=>e.stopPropagation()}>
            <div className="px-4 py-4 border-b border-border flex items-center gap-2"><PHLogo size={32}/><p className="text-xs font-bold text-muted-foreground">ADMIN NAVIGATION</p></div>
            <nav className="flex-1 overflow-y-auto py-2">
              {ADMIN_NAV.map(item=>{
                const active=path===item.path;
                return <button key={item.path} onClick={()=>{setPath(item.path);setMenu(false);}}
                  className={`w-full flex items-center px-4 py-3 text-sm ${active?"bg-primary/10 text-primary":"text-foreground hover:bg-secondary"}`}>{item.label}</button>;
              })}
            </nav>
            <div className="px-4 py-3 border-t border-border"><button onClick={async()=>{await signOut();setPath("/login");}} className="text-sm text-red-500">Sign Out</button></div>
          </div>
          <div className="flex-1 bg-black/40"/>
        </div>
      )}
      <div className="hidden sm:flex overflow-x-auto border-b border-border bg-card">
        {ADMIN_NAV.map(item=>{
          const active=path===item.path;
          return <button key={item.path} onClick={()=>setPath(item.path)}
            className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 ${active?"border-primary text-primary":"border-transparent text-muted-foreground hover:text-foreground"}`}>{item.label}</button>;
        })}
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

function AdminDashboard() {
  const [stats,setStats]=useState({s:0,p:0,a:0,v:0,q:0,c:0});
  const [loading,setLoading]=useState(true);
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
  const cards=[["Total Students",stats.s,"text-blue-400"],["Pending Approvals",stats.p,"text-orange-400"],["Active Students",stats.a,"text-primary"],["Total Videos",stats.v,"text-purple-400"],["Pending Questions",stats.q,"text-yellow-400"],["Cert. Requests",stats.c,"text-pink-400"]];
  return (
    <div className="p-5">
      <h2 className="text-lg font-bold text-foreground mb-5">Dashboard</h2>
      {loading?<div className="grid grid-cols-2 gap-3">{[1,2,3,4,5,6].map(i=><div key={i} className="h-24 bg-card border border-border rounded-xl animate-pulse"/>)}</div>
      :<div className="grid grid-cols-2 gap-3">{cards.map(([l,v,c])=><div key={l} className="bg-card border border-border rounded-xl p-4"><p className="text-xs text-muted-foreground mb-2">{l}</p><p className={`text-3xl font-bold ${c}`}>{v}</p></div>)}</div>}
    </div>
  );
}

function AdminStudents() {
  const [students,setStudents]=useState([]);
  const [loading,setLoading]=useState(true);
  const [updating,setUpdating]=useState(null);
  useEffect(()=>{ getDocs(query(collection(db,"users"),orderBy("joinDate","desc"))).then(s=>setStudents(s.docs.map(d=>({id:d.id,...d.data()})))).catch(()=>{}).finally(()=>setLoading(false)); },[]);
  const toggle=async(uid,cur)=>{const next=cur==="approved"?"blocked":cur==="blocked"?"pending":"approved";setUpdating(uid);try{await updateDoc(doc(db,"users",uid),{accessStatus:next});setStudents(p=>p.map(s=>s.uid===uid?{...s,accessStatus:next}:s));}catch(_){}finally{setUpdating(null);}};
  const badge=s=>s==="approved"?"bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400":s==="blocked"?"bg-red-100 dark:bg-red-950 text-red-600":"bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400";
  return (
    <div className="p-5">
      <h2 className="text-lg font-bold text-foreground mb-5">Students</h2>
      {loading?<div className="flex flex-col gap-3">{[1,2,3,4].map(i=><div key={i} className="h-20 bg-card rounded-xl animate-pulse"/>)}</div>
      :students.length===0?<p className="text-sm text-muted-foreground text-center py-12">Abhi koi student nahi</p>
      :<div className="flex flex-col gap-3">{students.map(s=>(
        <div key={s.uid} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">{s.name?.slice(0,2).toUpperCase()||"??"}</div>
          <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-foreground truncate">{s.name}</p><p className="text-xs text-muted-foreground truncate">{s.email}</p><span className={`text-[10px] px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${badge(s.accessStatus)}`}>{s.accessStatus}</span></div>
          <button disabled={updating===s.uid} onClick={()=>toggle(s.uid,s.accessStatus)} className="text-xs bg-secondary text-secondary-foreground border border-border rounded-lg px-3 py-1.5 disabled:opacity-60">{updating===s.uid?"...":s.accessStatus==="approved"?"Block":s.accessStatus==="blocked"?"Reset":"Approve"}</button>
        </div>
      ))}</div>}
    </div>
  );
}

function AdminApprovals() {
  const [pending,setPending]=useState([]);
  const [loading,setLoading]=useState(true);
  const [updating,setUpdating]=useState(null);
  useEffect(()=>{ getDocs(query(collection(db,"users"),where("accessStatus","==","pending"),orderBy("joinDate","desc"))).then(s=>setPending(s.docs.map(d=>({id:d.id,...d.data()})))).catch(()=>{}).finally(()=>setLoading(false)); },[]);
  const update=async(uid,status)=>{setUpdating(uid);try{await updateDoc(doc(db,"users",uid),{accessStatus:status});setPending(p=>p.filter(s=>s.uid!==uid));}catch(_){}finally{setUpdating(null);}};
  return (
    <div className="p-5">
      <h2 className="text-lg font-bold text-foreground mb-5">Pending Approvals</h2>
      {loading?<div className="flex flex-col gap-3">{[1,2,3].map(i=><div key={i} className="h-24 bg-card rounded-xl animate-pulse"/>)}</div>
      :pending.length===0?<div className="text-center py-12"><p className="text-sm text-muted-foreground">Sab clear hai! 🎉</p></div>
      :<div className="flex flex-col gap-3">{pending.map(s=>(
        <div key={s.uid} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-400 flex-shrink-0">{s.name?.slice(0,2).toUpperCase()||"??"}</div>
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-foreground">{s.name}</p><p className="text-xs text-muted-foreground">{s.email}</p><p className="text-[10px] text-muted-foreground mt-1">Joined: {new Date(s.joinDate).toLocaleDateString("hi-IN")}</p></div>
          </div>
          <div className="flex gap-2">
            <button disabled={updating===s.uid} onClick={()=>update(s.uid,"approved")} className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-60">{updating===s.uid?<Spinner/>:null} ✓ Approve</button>
            <button disabled={updating===s.uid} onClick={()=>update(s.uid,"blocked")} className="flex-1 flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground border border-border rounded-lg py-2.5 text-sm font-medium disabled:opacity-60">✕ Reject</button>
          </div>
        </div>
      ))}</div>}
    </div>
  );
}

const EMPTY_V={title:"",description:"",youtubeId:"",category:"",categoryColor:"#2E7D32",duration:"",tags:[],order:99,isNew:false,createdAt:""};
function AdminVideos() {
  const [videos,setVideos]=useState([]);
  const [loading,setLoading]=useState(true);
  const [editing,setEditing]=useState(null);
  const [saving,setSaving]=useState(false);
  const [deleting,setDeleting]=useState(null);
  const [tags,setTags]=useState("");
  const load=()=>getDocs(query(collection(db,"videos"),orderBy("order"))).then(s=>setVideos(s.docs.map(d=>({id:d.id,...d.data()})))).catch(()=>{}).finally(()=>setLoading(false));
  useEffect(()=>{load();},[]);
  const save=async()=>{if(!editing?.title||!editing?.youtubeId)return;setSaving(true);try{const{id,...data}={...editing,tags:tags.split(",").map(t=>t.trim()).filter(Boolean),createdAt:editing.createdAt||new Date().toISOString().split("T")[0]};if(editing.id)await updateDoc(doc(db,"videos",editing.id),data);else await setDoc(doc(db,"videos",`vid_${Date.now()}`),data);await load();setEditing(null);setTags("");}catch(_){}finally{setSaving(false);}};
  const del=async(id)=>{if(!confirm("Delete?"))return;setDeleting(id);try{await deleteDoc(doc(db,"videos",id));setVideos(p=>p.filter(v=>v.id!==id));}catch(_){}finally{setDeleting(null);}};
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-foreground">Videos</h2>
        <button onClick={()=>{setEditing({...EMPTY_V});setTags("");}} className="flex items-center gap-1.5 bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium">+ Add</button>
      </div>
      {editing && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-4"><p className="text-sm font-bold text-foreground">{editing.id?"Edit Video":"Naya Video"}</p><button onClick={()=>{setEditing(null);setTags("");}}>✕</button></div>
          <div className="flex flex-col gap-3">
            {[["Title *","title"],["YouTube ID *","youtubeId"],["Category","category"],["Duration (18:24)","duration"],["Upload Date (2025-01-15)","createdAt"]].map(([l,k])=>(
              <div key={k}><label className="text-xs text-muted-foreground block mb-1">{l}</label><input className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary" value={editing[k]||""} onChange={e=>setEditing(p=>({...p,[k]:e.target.value}))}/></div>
            ))}
            <div><label className="text-xs text-muted-foreground block mb-1">Description</label><textarea className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none" rows={2} value={editing.description||""} onChange={e=>setEditing(p=>({...p,description:e.target.value}))}/></div>
            <div><label className="text-xs text-muted-foreground block mb-1">Tags (comma separated)</label><input className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary" value={tags} onChange={e=>setTags(e.target.value)}/></div>
            <div className="flex items-center gap-4">
              <div><label className="text-xs text-muted-foreground block mb-1">Order</label><input type="number" className="w-20 bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none" value={editing.order||99} onChange={e=>setEditing(p=>({...p,order:Number(e.target.value)}))}/></div>
              <div><label className="text-xs text-muted-foreground block mb-1">Color</label><input type="color" value={editing.categoryColor||"#2E7D32"} onChange={e=>setEditing(p=>({...p,categoryColor:e.target.value}))} className="w-10 h-8 rounded border border-border cursor-pointer"/></div>
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer mt-3"><input type="checkbox" checked={editing.isNew||false} onChange={e=>setEditing(p=>({...p,isNew:e.target.checked}))} className="w-4 h-4"/> NEW</label>
            </div>
          </div>
          <button onClick={save} disabled={saving||!editing.title||!editing.youtubeId} className="mt-4 w-full flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-60">{saving?<Spinner/>:null} {editing.id?"Save":"Add Video"}</button>
        </div>
      )}
      {loading?<div className="flex flex-col gap-3">{[1,2,3].map(i=><div key={i} className="h-20 bg-card rounded-xl animate-pulse"/>)}</div>
      :videos.length===0?<p className="text-sm text-muted-foreground text-center py-12">Koi video nahi</p>
      :<div className="flex flex-col gap-3">{videos.map(v=>(
        <div key={v.id} className="bg-card border border-border rounded-xl p-3 flex gap-3">
          <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0"><img src={`https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`} alt="" className="w-full h-full object-cover"/></div>
          <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground line-clamp-1">{v.title}</p><p className="text-xs text-muted-foreground">{v.category} · {v.duration}</p><p className="text-[10px] text-muted-foreground">Order: {v.order} · {fmtDate(v.createdAt)}</p></div>
          <div className="flex gap-2 items-start flex-shrink-0">
            <button onClick={()=>{setEditing({...v});setTags((v.tags||[]).join(", "));}} className="p-1.5 rounded-lg bg-secondary text-xs">✏️</button>
            <button onClick={()=>del(v.id)} disabled={deleting===v.id} className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950 text-xs disabled:opacity-60">🗑️</button>
          </div>
        </div>
      ))}</div>}
    </div>
  );
}

function AdminQuestions() {
  const [qs,setQs]=useState([]);
  const [loading,setLoading]=useState(true);
  const [answers,setAnswers]=useState({});
  const [saving,setSaving]=useState(null);
  useEffect(()=>{ getDocs(query(collection(db,"questions"),orderBy("createdAt","desc"))).then(s=>setQs(s.docs.map(d=>({id:d.id,...d.data()})))).catch(()=>{}).finally(()=>setLoading(false)); },[]);
  const reply=async(id)=>{const ans=(answers[id]||"").trim();if(!ans)return;setSaving(id);try{await updateDoc(doc(db,"questions",id),{answer:ans,status:"answered"});setQs(p=>p.map(q=>q.id===id?{...q,answer:ans,status:"answered"}:q));setAnswers(p=>({...p,[id]:""}));}catch(_){}finally{setSaving(null);}};
  return (
    <div className="p-5">
      <h2 className="text-lg font-bold text-foreground mb-5">Student Questions</h2>
      {loading?<div className="flex flex-col gap-3">{[1,2,3].map(i=><div key={i} className="h-28 bg-card rounded-xl animate-pulse"/>)}</div>
      :qs.length===0?<p className="text-sm text-muted-foreground text-center py-12">Koi sawaal nahi</p>
      :<div className="flex flex-col gap-4">{qs.map(q=>(
        <div key={q.id} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div><p className="text-xs font-semibold text-foreground">{q.userName}</p><p className="text-[10px] text-muted-foreground">{q.userEmail}</p></div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${q.status==="answered"?"bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400":"bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400"}`}>{q.status}</span>
          </div>
          <p className="text-sm text-foreground mb-3">"{q.question}"</p>
          {q.answer && <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 mb-3"><p className="text-[10px] text-primary font-semibold mb-1">Aapka jawab:</p><p className="text-sm text-foreground">{q.answer}</p></div>}
          <textarea className="w-full bg-background border border-border rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary" rows={2} placeholder="Jawab likho..." value={answers[q.id]||""} onChange={e=>setAnswers(p=>({...p,[q.id]:e.target.value}))}/>
          <button onClick={()=>reply(q.id)} disabled={saving===q.id||!(answers[q.id]||"").trim()} className="mt-2 flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50">{saving===q.id?<Spinner/>:null} Bhejein</button>
        </div>
      ))}</div>}
    </div>
  );
}

// ── Admin Chat (Requirement #3: Admin side of persistent chat) ────
function AdminChat() {
  const [threads, setThreads]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [messages, setMessages]     = useState([]);
  const [replyText, setReplyText]   = useState("");
  const [sending, setSending]       = useState(false);
  const bottomRef = useRef(null);
  const unsubRef = useRef(null);

  useEffect(()=>{
    getDocs(query(collection(db,"chats"),orderBy("updatedAt","desc")))
      .then(s=>setThreads(s.docs.map(d=>({id:d.id,...d.data()}))))
      .catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const openThread = (thread) => {
    setSelected(thread);
    if (unsubRef.current) unsubRef.current();
    const q = query(
      collection(db,"chats",thread.userId,"messages"),
      orderBy("createdAt","asc")
    );
    unsubRef.current = onSnapshot(q,(snap)=>{
      setMessages(snap.docs.map(d=>({id:d.id,...d.data()})));
    });
  };

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);
  useEffect(()=>()=>{ if(unsubRef.current) unsubRef.current(); },[]);

  const sendReply = async () => {
    if (!replyText.trim()||!selected) return;
    setSending(true);
    const text = replyText.trim();
    setReplyText("");
    try {
      await addDoc(collection(db,"chats",selected.userId,"messages"),{
        text, sender:"admin",
        createdAt: new Date().toISOString(),
        read: false,
      });
      await updateDoc(doc(db,"chats",selected.userId),{
        lastMessage: text,
        lastMessageAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch(_){} finally{setSending(false);}
  };

  if (selected) return (
    <div className="flex flex-col h-full min-h-screen">
      <div className="px-4 py-3 border-b border-border flex items-center gap-3">
        <button onClick={()=>{ setSelected(null); if(unsubRef.current) unsubRef.current(); }}>
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div>
          <p className="text-sm font-bold text-foreground">{selected.userName}</p>
          <p className="text-[10px] text-muted-foreground">{selected.userEmail}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map(msg=>{
          const isAdmin = msg.sender==="admin";
          return (
            <div key={msg.id} className={`flex ${isAdmin?"justify-end":"justify-start"}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed
                ${isAdmin?"bg-primary text-white rounded-br-sm":"bg-card border border-border text-foreground rounded-bl-sm"}`}>
                {msg.text}
                <p className={`text-[10px] mt-1 ${isAdmin?"text-white/60":"text-muted-foreground"}`}>{fmtDate(msg.createdAt)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>
      <div className="px-4 py-3 border-t border-border flex gap-2 items-end">
        <textarea className="flex-1 bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground resize-none outline-none focus:border-primary" rows={1} style={{maxHeight:"80px"}}
          placeholder="Reply likho..." value={replyText}
          onChange={e=>setReplyText(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendReply();} }}/>
        <button onClick={sendReply} disabled={sending||!replyText.trim()}
          className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 disabled:opacity-50">
          {sending?<Spinner/>:<svg className="w-5 h-5 text-white ml-0.5" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-5">
      <h2 className="text-lg font-bold text-foreground mb-5">Support Chat Threads</h2>
      {loading?<div className="flex flex-col gap-3">{[1,2,3].map(i=><div key={i} className="h-16 bg-card rounded-xl animate-pulse"/>)}</div>
      :threads.length===0?<p className="text-sm text-muted-foreground text-center py-12">Koi chat nahi abhi tak</p>
      :<div className="flex flex-col gap-3">{threads.map(t=>(
        <button key={t.id} onClick={()=>openThread(t)} className="w-full bg-card border border-border rounded-xl p-4 flex items-start gap-3 text-left">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">{t.userName?.slice(0,2).toUpperCase()||"??"}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{t.userName}</p>
            <p className="text-xs text-muted-foreground truncate">{t.lastMessage||"No messages"}</p>
          </div>
          <svg className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
        </button>
      ))}</div>}
    </div>
  );
}

function AdminNotifications() {
  const [title,setTitle]=useState("");
  const [msg,setMsg]=useState("");
  const [sending,setSending]=useState(false);
  const [sent,setSent]=useState(false);
  const [history,setHistory]=useState([]);
  useEffect(()=>{ getDocs(query(collection(db,"notifications"),orderBy("createdAt","desc"))).then(s=>setHistory(s.docs.map(d=>({id:d.id,...d.data()})))).catch(()=>{}); },[]);
  const send=async()=>{if(!title.trim()||!msg.trim())return;setSending(true);try{const n={title:title.trim(),message:msg.trim(),createdAt:new Date().toISOString()};const ref=await addDoc(collection(db,"notifications"),n);setHistory(p=>[{id:ref.id,...n},...p]);setTitle("");setMsg("");setSent(true);setTimeout(()=>setSent(false),3000);}catch(_){}finally{setSending(false);}};
  return (
    <div className="p-5">
      <h2 className="text-lg font-bold text-foreground mb-5">Notification Bhejein</h2>
      <div className="bg-card border border-border rounded-2xl p-4 mb-5">
        <div className="flex flex-col gap-3">
          <div><label className="text-xs text-muted-foreground block mb-1">Title</label><input className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)}/></div>
          <div><label className="text-xs text-muted-foreground block mb-1">Message</label><textarea className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary" rows={3} placeholder="Message..." value={msg} onChange={e=>setMsg(e.target.value)}/></div>
          <button onClick={send} disabled={sending||!title.trim()||!msg.trim()} className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50">{sending?<Spinner/>:null}{sent?"✓ Bhej diya!":"Bhejein"}</button>
        </div>
      </div>
      {history.length>0 && <><p className="text-xs font-bold text-muted-foreground mb-3">HISTORY</p><div className="flex flex-col gap-3">{history.map(n=><div key={n.id} className="bg-card border border-border rounded-xl p-3"><p className="text-sm font-semibold text-foreground">{n.title}</p><p className="text-xs text-muted-foreground mt-0.5 mb-1">{n.message}</p><p className="text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleString("hi-IN")}</p></div>)}</div></>}
    </div>
  );
}

function AdminCertificates() {
  const [certs,setCerts]=useState([]);
  const [loading,setLoading]=useState(true);
  const [updating,setUpdating]=useState(null);
  useEffect(()=>{ getDocs(query(collection(db,"certificates"),orderBy("requestedAt","desc"))).then(s=>setCerts(s.docs.map(d=>({id:d.id,...d.data()})))).catch(()=>{}).finally(()=>setLoading(false)); },[]);
  const update=async(id,status)=>{setUpdating(id);try{await updateDoc(doc(db,"certificates",id),{status});setCerts(p=>p.map(c=>c.id===id?{...c,status}:c));}catch(_){}finally{setUpdating(null);}};
  return (
    <div className="p-5">
      <h2 className="text-lg font-bold text-foreground mb-5">Certificate Requests</h2>
      {loading?<div className="flex flex-col gap-3">{[1,2,3].map(i=><div key={i} className="h-24 bg-card rounded-xl animate-pulse"/>)}</div>
      :certs.length===0?<p className="text-sm text-muted-foreground text-center py-12">Koi request nahi</p>
      :<div className="flex flex-col gap-3">{certs.map(c=>(
        <div key={c.id} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div><p className="text-sm font-semibold text-foreground">{c.userName}</p><p className="text-xs text-muted-foreground">{c.userEmail}</p><p className="text-[10px] text-muted-foreground mt-1">{c.completion}% · {new Date(c.requestedAt).toLocaleDateString("hi-IN")}</p></div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${c.status==="approved"?"bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400":c.status==="rejected"?"bg-red-100 dark:bg-red-950 text-red-600":"bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400"}`}>{c.status}</span>
          </div>
          {c.status==="pending" && <div className="flex gap-2"><button disabled={updating===c.id} onClick={()=>update(c.id,"approved")} className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60">{updating===c.id?"...":"✓ Approve"}</button><button disabled={updating===c.id} onClick={()=>update(c.id,"rejected")} className="flex-1 bg-secondary text-secondary-foreground border border-border rounded-lg py-2 text-sm font-medium disabled:opacity-60">✕ Reject</button></div>}
        </div>
      ))}</div>}
    </div>
  );
}

const EMPTY_M={name:"",phone:"",plan:"monthly",lastRenewed:new Date().toISOString().split("T")[0],notes:""};
function AdminKFP() {
  const [members,setMembers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [form,setForm]=useState(null);
  const [saving,setSaving]=useState(false);
  const [deleting,setDeleting]=useState(null);
  const [filter,setFilter]=useState("all");
  const load=()=>getDocs(query(collection(db,"kfp_members"),orderBy("name"))).then(s=>setMembers(s.docs.map(d=>({id:d.id,...d.data()})))).catch(()=>{}).finally(()=>setLoading(false));
  useEffect(()=>{load();},[]);
  const save=async()=>{if(!form?.name||!form?.phone)return;setSaving(true);try{const{id,...data}=form;if(form.id)await updateDoc(doc(db,"kfp_members",form.id),data);else await addDoc(collection(db,"kfp_members"),data);await load();setForm(null);}catch(_){}finally{setSaving(false);}};
  const del=async(id)=>{if(!confirm("Delete?"))return;setDeleting(id);try{await deleteDoc(doc(db,"kfp_members",id));setMembers(p=>p.filter(m=>m.id!==id));}catch(_){}finally{setDeleting(null);}};
  const getColor=(m)=>{const s=kfpStatus(m);return s.color==="green"?"border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30":s.color==="yellow"?"border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30":"border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30";};
  const getBadge=(m)=>{const s=kfpStatus(m);return s.color==="green"?"bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400":s.color==="yellow"?"bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-400":"bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400";};
  const filtered=filter==="all"?members:filter==="due"?members.filter(m=>{const s=kfpStatus(m);return s.left<=7&&s.left>0;}):filter==="overdue"?members.filter(m=>kfpStatus(m).left<=0):members.filter(m=>kfpStatus(m).left>7);
  const dueCount=members.filter(m=>{const s=kfpStatus(m);return s.left<=7&&s.left>0;}).length;
  const overdueCount=members.filter(m=>kfpStatus(m).left<=0).length;
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-2"><div><h2 className="text-lg font-bold text-foreground">KFP Members 🌿</h2><p className="text-xs text-muted-foreground">WhatsApp renewal reminder tool</p></div><button onClick={()=>setForm({...EMPTY_M})} className="flex items-center gap-1.5 bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium">+ Add</button></div>
      <div className="grid grid-cols-3 gap-2 mb-4 mt-3">{[["Total",members.length,"text-foreground"],["Due Soon",dueCount,"text-yellow-600 dark:text-yellow-400"],["Overdue",overdueCount,"text-red-600 dark:text-red-400"]].map(([l,v,c])=><div key={l} className="bg-card border border-border rounded-xl p-3 text-center"><p className={`text-2xl font-bold ${c}`}>{v}</p><p className="text-[10px] text-muted-foreground">{l}</p></div>)}</div>
      <div className="flex gap-2 mb-4 overflow-x-auto" style={{scrollbarWidth:"none"}}>{[["all","Sab"],["active","Active ✅"],["due","Due ⚠️"],["overdue","Late 🔴"]].map(([k,l])=><button key={k} onClick={()=>setFilter(k)} className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${filter===k?"bg-primary text-white":"bg-secondary text-secondary-foreground"}`}>{l}</button>)}</div>
      {form && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-4"><p className="text-sm font-bold text-foreground">{form.id?"Edit":"Naya Member"}</p><button onClick={()=>setForm(null)}>✕</button></div>
          <div className="flex flex-col gap-3">
            <div><label className="text-xs text-muted-foreground block mb-1">Naam *</label><input className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary" placeholder="Ramesh Kumar" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
            <div><label className="text-xs text-muted-foreground block mb-1">WhatsApp * (10 digits)</label><input type="tel" maxLength={10} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary" placeholder="9876543210" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value.replace(/\D/,"")}))} /></div>
            <div><label className="text-xs text-muted-foreground block mb-1">Plan</label><div className="flex gap-2">{[["monthly","Monthly ₹99"],["yearly","Yearly ₹499"]].map(([k,l])=><button key={k} onClick={()=>setForm(p=>({...p,plan:k}))} className={`flex-1 text-sm py-2 rounded-xl border transition-colors ${form.plan===k?"bg-primary text-white border-primary":"bg-secondary text-secondary-foreground border-border"}`}>{l}</button>)}</div></div>
            <div><label className="text-xs text-muted-foreground block mb-1">Pichli Renewal</label><input type="date" className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary" value={form.lastRenewed} onChange={e=>setForm(p=>({...p,lastRenewed:e.target.value}))}/></div>
            <div><label className="text-xs text-muted-foreground block mb-1">Notes</label><input className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary" placeholder="Optional..." value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></div>
          </div>
          <button onClick={save} disabled={saving||!form.name||!form.phone} className="mt-4 w-full flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-60">{saving?<Spinner/>:null} {form.id?"Save":"Add"}</button>
        </div>
      )}
      {loading?<div className="flex flex-col gap-3">{[1,2,3].map(i=><div key={i} className="h-28 bg-card rounded-xl animate-pulse"/>)}</div>
      :filtered.length===0?<div className="text-center py-12"><p className="text-sm text-muted-foreground">Koi member nahi</p></div>
      :<div className="flex flex-col gap-3">{filtered.map(m=>{const status=kfpStatus(m);return(
        <div key={m.id} className={`border rounded-xl p-4 ${getColor(m)}`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0"><p className="text-sm font-bold text-foreground">{m.name}</p><p className="text-xs text-muted-foreground">📱 +91 {m.phone}</p><div className="flex items-center gap-2 mt-1"><span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{m.plan==="yearly"?"Yearly ₹499":"Monthly ₹99"}</span><span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getBadge(m)}`}>{status.label}</span></div>{m.notes&&<p className="text-[10px] text-muted-foreground mt-1">📝 {m.notes}</p>}</div>
            <div className="flex gap-2 flex-shrink-0"><button onClick={()=>setForm({...m})} className="p-1.5 rounded-lg bg-white/70 dark:bg-white/10 text-xs">✏️</button><button onClick={()=>del(m.id)} disabled={deleting===m.id} className="p-1.5 rounded-lg bg-white/70 dark:bg-white/10 text-xs disabled:opacity-60">🗑️</button></div>
          </div>
          <a href={kfpWA(m)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-[#25D366] text-white rounded-xl py-2.5 text-sm font-medium mt-2 w-full">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp Reminder
          </a>
        </div>
      );})}</div>}
    </div>
  );
}

// ================================================================
// MAIN ROUTER
// ================================================================
function AppRouter() {
  const { user, loading, isAdmin } = useAuth();
  const { path, setPath }          = useRouter();

  useEffect(()=>{
    if (loading) return;
    const isApp    = ["/home","/courses","/profile","/chat"].some(r=>path.startsWith(r))||path.startsWith("/player");
    const isAdminR = path.startsWith("/admin");
    if (!user && (isApp||isAdminR)) { setPath("/login"); return; }
    if (user && (path==="/login"||path===""||path==="/")) {
      if (isAdmin||user.accessStatus==="approved") { setPath("/home"); return; }
      else { setPath("/access-pending"); return; }
    }
    if (user) {
      const ok = isAdmin||user.accessStatus==="approved";
      if (!ok && (isApp||isAdminR)) { setPath("/access-pending"); return; }
      if (isAdminR && !isAdmin) { setPath("/home"); return; }
    }
  },[path,user,loading,isAdmin]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Spinner/></div>;

  if (path==="/"||path==="")         return <SplashScreen/>;
  if (path==="/terms")               return <TermsScreen/>;
  if (path==="/login")               return <LoginScreen/>;
  if (path==="/access-pending")      return <AccessPendingScreen/>;
  if (path==="/home")                return <HomeScreen/>;
  if (path==="/courses")             return <CoursesScreen/>;
  if (path==="/profile")             return <ProfileScreen/>;
  if (path==="/chat")                return <ChatScreen/>;

  const pm = path.match(/^\/player\/(.+)$/);
  if (pm) return <VideoPlayerScreen videoId={pm[1]}/>;

  if (path==="/admin"||path==="/admin/dashboard") return <AdminLayout><AdminDashboard/></AdminLayout>;
  if (path==="/admin/students")      return <AdminLayout><AdminStudents/></AdminLayout>;
  if (path==="/admin/approvals")     return <AdminLayout><AdminApprovals/></AdminLayout>;
  if (path==="/admin/videos")        return <AdminLayout><AdminVideos/></AdminLayout>;
  if (path==="/admin/questions")     return <AdminLayout><AdminQuestions/></AdminLayout>;
  if (path==="/admin/chat")          return <AdminLayout><AdminChat/></AdminLayout>;
  if (path==="/admin/notifications") return <AdminLayout><AdminNotifications/></AdminLayout>;
  if (path==="/admin/certificates")  return <AdminLayout><AdminCertificates/></AdminLayout>;
  if (path==="/admin/kfp")           return <AdminLayout><AdminKFP/></AdminLayout>;

  return <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4"><p className="text-3xl font-bold text-foreground">404</p><button onClick={()=>setPath("/home")} className="text-primary text-sm">Home par jao</button></div>;
}

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <RouterProvider>
            <AppRouter/>
          </RouterProvider>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  );
}
