import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Clock, ShieldX, LogOut, RefreshCw } from "lucide-react";
import kisanLogo from "@assets/Green_Leaf_Aesthetic_Organic_Skincare_Logo_20260604_180821_000_1780580817882.png";
import { useState } from "react";

export default function AccessPendingScreen() {
  const { user, accessStatus, signOut, refreshUser } = useAuth();
  const [, setLocation] = useLocation();
  const [refreshing, setRefreshing] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setLocation("/login");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  };

  const isBlocked = accessStatus === "blocked";

  return (
    <div className="w-full max-w-[900px] mx-auto min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-border">
          <img src={kisanLogo} alt="Kisan Academy" className="h-16 w-auto object-contain" />
        </div>

        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isBlocked ? "bg-destructive/10" : "bg-primary/10"}`}>
          {isBlocked ? (
            <ShieldX className="w-10 h-10 text-destructive" />
          ) : (
            <Clock className="w-10 h-10 text-primary" />
          )}
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground font-serif mb-2">
            {isBlocked ? "Access Blocked" : "Access Pending"}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isBlocked
              ? "Your account has been blocked. Please contact the admin for assistance."
              : "Your account is awaiting admin approval. You will receive access once your payment is confirmed and your account is approved."}
          </p>
        </div>

        {user && (
          <div className="w-full bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Signed in as</p>
            <p className="text-sm font-medium text-foreground" data-testid="text-user-email">{user.email}</p>
          </div>
        )}

        <div className="w-full flex flex-col gap-3">
          {!isBlocked && (
            <button
              data-testid="button-refresh-status"
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3 font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Checking..." : "Check Status"}
            </button>
          )}
          <button
            data-testid="button-signout"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground border border-border rounded-xl py-3 font-medium transition-opacity hover:opacity-80"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
