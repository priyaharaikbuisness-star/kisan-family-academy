import { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Users, UserCheck, Video, MessageSquare,
  Bell, Award, Menu, X, ChevronRight, LogOut, Home
} from "lucide-react";
import kisanLogo from "@assets/Green_Leaf_Aesthetic_Organic_Skincare_Logo_20260604_180821_000_1780580817882.png";

const navItems = [
  { path: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/admin/students", icon: Users, label: "Students" },
  { path: "/admin/approvals", icon: UserCheck, label: "Approvals" },
  { path: "/admin/videos", icon: Video, label: "Videos" },
  { path: "/admin/questions", icon: MessageSquare, label: "Questions" },
  { path: "/admin/notifications", icon: Bell, label: "Notifications" },
  { path: "/admin/certificates", icon: Award, label: "Certificates" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setLocation("/login");
  };

  return (
    <div className="w-full max-w-[900px] mx-auto min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <button
            data-testid="button-admin-menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
          </button>
          <img src={kisanLogo} alt="" className="h-7 w-auto object-contain bg-white p-0.5 rounded" />
          <span className="text-sm font-bold text-foreground font-serif">Admin Panel</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocation("/home")}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <Home className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="text-xs text-muted-foreground hidden sm:block">{user?.email}</div>
        </div>
      </div>

      {/* Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex" onClick={() => setMenuOpen(false)}>
          <div className="w-64 bg-card border-r border-border h-full flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-4 border-b border-border">
              <p className="text-xs font-bold text-muted-foreground">ADMIN NAVIGATION</p>
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location === item.path || location.startsWith(item.path);
                return (
                  <button
                    key={item.path}
                    data-testid={`nav-admin-${item.label.toLowerCase()}`}
                    onClick={() => { setLocation(item.path); setMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary"}`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {active && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </button>
                );
              })}
            </nav>
            <div className="px-4 py-3 border-t border-border">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-sm text-destructive"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black/40" />
        </div>
      )}

      {/* Tab bar for desktop */}
      <div className="hidden sm:flex overflow-x-auto border-b border-border bg-card">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location === item.path || location.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
