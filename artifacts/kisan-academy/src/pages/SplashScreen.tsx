import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import kisanLogo from "@assets/Green_Leaf_Aesthetic_Organic_Skincare_Logo_20260604_180821_000_1780580817882.png";
import priyaLogo from "@assets/Screenshot_20260312_151049_Swipe_Billing-removebg-preview_1780580838926.png";
import { useAuth } from "@/contexts/AuthContext";

export default function SplashScreen() {
  const [count, setCount] = useState(3);
  const [, setLocation] = useLocation();
  const { user, loading, accessStatus, isAdmin } = useAuth();

  useEffect(() => {
    if (loading) return;
    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            if (!user) {
              setLocation("/login");
            } else if (isAdmin || accessStatus === "approved") {
              setLocation("/home");
            } else {
              setLocation("/access-pending");
            }
          }, 400);
          return 0;
        }
        return prev - 1;
      });
    }, 800);
    return () => clearInterval(timer);
  }, [loading, user, accessStatus, isAdmin]);

  const circumference = 2 * Math.PI * 24;
  const progress = count / 3;

  return (
    <div className="w-full max-w-[900px] mx-auto h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute w-96 h-96 rounded-full bg-gradient-to-br from-green-50 to-transparent top-0 left-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="mb-8 flex items-center justify-center">
        <div className="flex items-center justify-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <img src={kisanLogo} alt="Kisan Academy" className="h-36 w-auto object-contain" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-[#1B5E20] font-serif mb-2 text-center">Kisan Family Academy</h1>
      <p className="text-sm text-gray-500 italic mb-12 text-center">Apple Farming Knowledge Hub</p>

      <div className="flex flex-col items-center gap-3">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <svg viewBox="0 0 56 56" className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="28" cy="28" r="24" fill="none" stroke="#E8F5E9" strokeWidth="3" />
            <circle
              cx="28" cy="28" r="24" fill="none" stroke="#2E7D32" strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress * circumference}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.7s ease" }}
            />
          </svg>
          <span className="text-xl font-bold text-[#1B5E20] font-serif relative z-10">{count}</span>
        </div>
        <p className="text-xs text-gray-400">{loading ? "Loading..." : "Logging you in..."}</p>
      </div>

      <div className="absolute bottom-7 left-0 right-0 flex items-center justify-center gap-2">
        <img src={priyaLogo} alt="Priya Haraik" className="h-5 w-auto object-contain opacity-60" />
        <span className="text-xs text-gray-400 italic">A product by Priya Haraik Ventures</span>
      </div>
    </div>
  );
}
