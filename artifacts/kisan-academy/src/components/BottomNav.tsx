import { useLocation } from "wouter";
import { Home, BookOpen, User } from "lucide-react";

const tabs = [
  { id: "home", path: "/home", icon: Home, label: "Home" },
  { id: "courses", path: "/courses", icon: BookOpen, label: "Courses" },
  { id: "profile", path: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] bg-card border-t border-border flex z-40">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = location === tab.path || location.startsWith(tab.path);
        return (
          <button
            key={tab.id}
            data-testid={`nav-${tab.id}`}
            onClick={() => setLocation(tab.path)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
          >
            <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
