import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, Video, Clock, MessageSquare, Award } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingApprovals: 0,
    totalVideos: 0,
    pendingQuestions: 0,
    pendingCertificates: 0,
    approvedStudents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [usersSnap, pendingSnap, videosSnap, questionsSnap, certsSnap, approvedSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(query(collection(db, "users"), where("accessStatus", "==", "pending"))),
        getDocs(collection(db, "videos")),
        getDocs(query(collection(db, "questions"), where("status", "==", "pending"))),
        getDocs(query(collection(db, "certificates"), where("status", "==", "pending"))),
        getDocs(query(collection(db, "users"), where("accessStatus", "==", "approved"))),
      ]);
      setStats({
        totalStudents: usersSnap.size,
        pendingApprovals: pendingSnap.size,
        totalVideos: videosSnap.size,
        pendingQuestions: questionsSnap.size,
        pendingCertificates: certsSnap.size,
        approvedStudents: approvedSnap.size,
      });
      setLoading(false);
    };
    load();
  }, []);

  const cards = [
    { icon: Users, label: "Total Students", value: stats.totalStudents, color: "text-blue-400" },
    { icon: Clock, label: "Pending Approvals", value: stats.pendingApprovals, color: "text-orange-400" },
    { icon: Users, label: "Active Students", value: stats.approvedStudents, color: "text-primary" },
    { icon: Video, label: "Total Videos", value: stats.totalVideos, color: "text-purple-400" },
    { icon: MessageSquare, label: "Pending Questions", value: stats.pendingQuestions, color: "text-yellow-400" },
    { icon: Award, label: "Cert. Requests", value: stats.pendingCertificates, color: "text-pink-400" },
  ];

  return (
    <div className="p-5">
      <h2 className="text-lg font-bold text-foreground font-serif mb-5">Dashboard</h2>
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${card.color}`} />
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
                <p className="text-3xl font-bold text-foreground font-serif">{card.value}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
