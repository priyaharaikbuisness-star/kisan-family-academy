import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import kisanLogo from "@assets/Green_Leaf_Aesthetic_Organic_Skincare_Logo_20260604_180821_000_1780580817882.png";
import { SiGoogle } from "react-icons/si";
import { Loader2 } from "lucide-react";

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign in was cancelled.");
      } else {
        setError("Failed to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[900px] mx-auto min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-border">
            <img src={kisanLogo} alt="Kisan Academy" className="h-24 w-auto object-contain" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary font-serif">Kisan Family Academy</h1>
            <p className="text-sm text-muted-foreground mt-1">Apple Farming Knowledge Hub</p>
          </div>
        </div>

        <div className="w-full flex flex-col gap-4">
          <div className="text-center">
            <p className="text-foreground font-medium">Sign in to continue</p>
            <p className="text-xs text-muted-foreground mt-1">Use your Google account to access the course</p>
          </div>

          <button
            data-testid="button-google-signin"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 border border-gray-200 rounded-xl py-3 px-4 font-medium shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <SiGoogle className="w-5 h-5 text-[#4285F4]" />
            )}
            <span>{loading ? "Signing in..." : "Continue with Google"}</span>
          </button>

          {error && (
            <p className="text-sm text-destructive text-center" data-testid="text-login-error">{error}</p>
          )}
        </div>

        <div className="w-full bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Access to <span className="text-primary font-medium">Kisan Family Pro</span> is manually approved by admin after payment confirmation. After signing in, your account will be reviewed.
          </p>
        </div>
      </div>
    </div>
  );
}
