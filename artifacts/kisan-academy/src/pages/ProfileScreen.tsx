import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useVideos } from "@/hooks/useVideos";
import { useProgress } from "@/hooks/useProgress";
import BottomNav from "@/components/BottomNav";
import { useLocation } from "wouter";
import {
  LogOut, Moon, Sun, Globe, Award, MessageSquare, TrendingUp, ChevronRight, Check, Loader2, Shield
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import kisanLogo from "@assets/Green_Leaf_Aesthetic_Organic_Skincare_Logo_20260604_180821_000_1780580817882.png";

interface Question {
  id: string;
  question: string;
  answer?: string;
  status: "pending" | "answered";
  createdAt: string;
}

interface Certificate {
  id: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
}

export default function ProfileScreen() {
  const { user, isAdmin, signOut } = useAuth();
  const { videos } = useVideos();
  const { progress } = useProgress(user?.uid);
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();

  const [language, setLanguage] = useState(user?.language || "en");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [submittingQ, setSubmittingQ] = useState(false);
  const [requestingCert, setRequestingCert] = useState(false);
  const [certMsg, setCertMsg] = useState("");

  const watched = Object.values(progress).filter((p) => p.watched).length;
  const total = videos.length;
  const completion = total > 0 ? Math.round((watched / total) * 100) : 0;
  const lastWatched = Object.values(progress)
    .filter((p) => p.watched)
    .sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime())[0];
  const lastWatchedVideo = lastWatched ? videos.find((v) => v.id === lastWatched.videoId) : null;

  useEffect(() => {
    if (!user?.uid) return;
    const loadQuestions = async () => {
      const q = query(collection(db, "questions"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Question)));
    };
    const loadCert = async () => {
      const q = query(collection(db, "certificates"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        setCertificate({ id: d.id, ...d.data() } as Certificate);
      }
    };
    loadQuestions();
    loadCert();
  }, [user?.uid]);

  const handleSignOut = async () => {
    await signOut();
    setLocation("/login");
  };

  const submitQuestion = async () => {
    if (!newQuestion.trim() || !user) return;
    setSubmittingQ(true);
    try {
      const docRef = await addDoc(collection(db, "questions"), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.name,
        question: newQuestion.trim(),
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      setQuestions((prev) => [{
        id: docRef.id,
        question: newQuestion.trim(),
        status: "pending",
        createdAt: new Date().toISOString(),
      }, ...prev]);
      setNewQuestion("");
    } finally {
      setSubmittingQ(false);
    }
  };

  const requestCertificate = async () => {
    if (!user) return;
    if (completion < 80) {
      setCertMsg(`Complete ${80 - completion}% more videos to request a certificate.`);
      return;
    }
    if (certificate) {
      setCertMsg("You have already submitted a certificate request.");
      return;
    }
    setRequestingCert(true);
    try {
      const docRef = await addDoc(collection(db, "certificates"), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.name,
        status: "pending",
        requestedAt: new Date().toISOString(),
      });
      setCertificate({ id: docRef.id, status: "pending", requestedAt: new Date().toISOString() });
      setCertMsg("Certificate request submitted! Admin will review and send manually.");
    } finally {
      setRequestingCert(false);
    }
  };

  const updateLanguage = async (lang: string) => {
    setLanguage(lang);
    if (user?.uid) {
      await updateDoc(doc(db, "users", user.uid), { language: lang });
    }
  };

  return (
    <div className="w-full max-w-[900px] mx-auto min-h-screen bg-background flex flex-col">
      <div className="px-5 pt-10 pb-4 border-b border-border flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground font-serif">Profile</h1>
        <div className="bg-white rounded-lg p-1 border border-border">
          <img src={kisanLogo} alt="" className="h-6 w-auto object-contain" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* User Card */}
        <div className="px-5 pt-5">
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-[#1B5E20] flex items-center justify-center text-white font-bold flex-shrink-0">
                {user?.name?.slice(0, 2).toUpperCase() || "KA"}
              </div>
            )}
            <div>
              <p className="font-bold text-foreground font-serif" data-testid="text-username">{user?.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5" data-testid="text-email">{user?.email}</p>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-1">
                  <Shield className="w-3 h-3" /> Admin
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="px-5 mt-4">
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Learning Progress</p>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary font-serif">{watched}</p>
                <p className="text-[10px] text-muted-foreground">Watched</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground font-serif">{total}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground font-serif">{completion}%</p>
                <p className="text-[10px] text-muted-foreground">Complete</p>
              </div>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden mb-2">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${completion}%` }} />
            </div>
            {lastWatchedVideo && (
              <p className="text-[10px] text-muted-foreground">Last watched: <span className="text-foreground">{lastWatchedVideo.title}</span></p>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="px-5 mt-4">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Theme */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
              <div className="flex items-center gap-3">
                {theme === "dark" ? <Moon className="w-4 h-4 text-muted-foreground" /> : <Sun className="w-4 h-4 text-muted-foreground" />}
                <span className="text-sm text-foreground">Theme</span>
              </div>
              <div className="flex gap-1">
                <button
                  data-testid="button-theme-light"
                  onClick={() => setTheme("light")}
                  className={`text-xs px-3 py-1 rounded-lg transition-colors ${theme === "light" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
                >
                  Light
                </button>
                <button
                  data-testid="button-theme-dark"
                  onClick={() => setTheme("dark")}
                  className={`text-xs px-3 py-1 rounded-lg transition-colors ${theme === "dark" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
                >
                  Dark
                </button>
              </div>
            </div>

            {/* Language */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Language</span>
              </div>
              <div className="flex gap-1">
                <button
                  data-testid="button-lang-en"
                  onClick={() => updateLanguage("en")}
                  className={`text-xs px-3 py-1 rounded-lg transition-colors ${language === "en" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
                >
                  English
                </button>
                <button
                  data-testid="button-lang-hi"
                  onClick={() => updateLanguage("hi")}
                  className={`text-xs px-3 py-1 rounded-lg transition-colors ${language === "hi" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
                >
                  Hindi
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Certificate */}
        <div className="px-5 mt-4">
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Certificate</p>
            </div>
            {certificate ? (
              <div className={`text-xs rounded-lg px-3 py-2 ${
                certificate.status === "approved" ? "bg-primary/10 text-primary" :
                certificate.status === "rejected" ? "bg-destructive/10 text-destructive" :
                "bg-secondary text-secondary-foreground"
              }`}>
                {certificate.status === "approved" ? "Certificate approved! Admin will send it to you." :
                 certificate.status === "rejected" ? "Certificate request was rejected. Contact admin." :
                 "Certificate request pending admin review."}
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{completion}% complete</span>
                    <span>Need 80%</span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(completion, 100)}%` }} />
                  </div>
                </div>
                <button
                  data-testid="button-request-certificate"
                  onClick={requestCertificate}
                  disabled={requestingCert || completion < 80}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 transition-opacity hover:opacity-90"
                >
                  {requestingCert ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                  Request Certificate
                </button>
                {certMsg && <p className="text-xs text-muted-foreground text-center mt-2">{certMsg}</p>}
              </>
            )}
          </div>
        </div>

        {/* Discussion */}
        <div className="px-5 mt-4">
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Ask a Question</p>
            </div>
            <textarea
              data-testid="input-question"
              className="w-full bg-background border border-border rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary transition-colors"
              rows={3}
              placeholder="Type your farming question here..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
            />
            <button
              data-testid="button-submit-question"
              onClick={submitQuestion}
              disabled={submittingQ || !newQuestion.trim()}
              className="mt-2 flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50 transition-opacity hover:opacity-90"
            >
              {submittingQ ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Submit
            </button>

            {questions.length > 0 && (
              <div className="mt-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-muted-foreground">YOUR QUESTIONS</p>
                {questions.map((q) => (
                  <div key={q.id} className="bg-background border border-border rounded-xl p-3">
                    <p className="text-sm text-foreground mb-1">{q.question}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${q.status === "answered" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                      {q.status === "answered" ? "Answered" : "Pending"}
                    </span>
                    {q.answer && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-[10px] text-primary font-semibold mb-1">Admin Reply:</p>
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
            <button
              data-testid="button-admin-panel"
              onClick={() => setLocation("/admin")}
              className="w-full flex items-center justify-between bg-primary/10 border border-primary/20 text-primary rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Admin Panel</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Sign out */}
        <div className="px-5 mt-4 mb-4">
          <button
            data-testid="button-signout"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 border border-destructive/30 text-destructive rounded-xl py-3 text-sm font-medium transition-opacity hover:opacity-80"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
