import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import SplashScreen from "@/pages/SplashScreen";
import LoginScreen from "@/pages/LoginScreen";
import AccessPendingScreen from "@/pages/AccessPendingScreen";
import HomeScreen from "@/pages/HomeScreen";
import CoursesScreen from "@/pages/CoursesScreen";
import VideoPlayerScreen from "@/pages/VideoPlayerScreen";
import ProfileScreen from "@/pages/ProfileScreen";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminStudents from "@/pages/admin/AdminStudents";
import AdminApprovals from "@/pages/admin/AdminApprovals";
import AdminVideos from "@/pages/admin/AdminVideos";
import AdminQuestions from "@/pages/admin/AdminQuestions";
import AdminNotifications from "@/pages/admin/AdminNotifications";
import AdminCertificates from "@/pages/admin/AdminCertificates";
import NotFound from "@/pages/not-found";
import { ReactNode } from "react";

const queryClient = new QueryClient();

function ProtectedRoute({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { user, loading, accessStatus, isAdmin } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Redirect to="/login" />;
  if (accessStatus === "blocked") return <Redirect to="/access-pending" />;
  if (!isAdmin && accessStatus !== "approved") return <Redirect to="/access-pending" />;
  if (adminOnly && !isAdmin) return <Redirect to="/home" />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: ReactNode }) {
  const { user, loading, accessStatus, isAdmin } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (user && (isAdmin || accessStatus === "approved")) return <Redirect to="/home" />;
  if (user && (accessStatus === "pending" || accessStatus === "blocked")) return <Redirect to="/access-pending" />;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={SplashScreen} />
      <Route path="/login">
        <AuthRoute><LoginScreen /></AuthRoute>
      </Route>
      <Route path="/access-pending" component={AccessPendingScreen} />
      <Route path="/home">
        <ProtectedRoute><HomeScreen /></ProtectedRoute>
      </Route>
      <Route path="/courses">
        <ProtectedRoute><CoursesScreen /></ProtectedRoute>
      </Route>
      <Route path="/player/:videoId">
        {(params) => <ProtectedRoute><VideoPlayerScreen videoId={params.videoId} /></ProtectedRoute>}
      </Route>
      <Route path="/profile">
        <ProtectedRoute><ProfileScreen /></ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute adminOnly><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>
      </Route>
      <Route path="/admin/dashboard">
        <ProtectedRoute adminOnly><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>
      </Route>
      <Route path="/admin/students">
        <ProtectedRoute adminOnly><AdminLayout><AdminStudents /></AdminLayout></ProtectedRoute>
      </Route>
      <Route path="/admin/approvals">
        <ProtectedRoute adminOnly><AdminLayout><AdminApprovals /></AdminLayout></ProtectedRoute>
      </Route>
      <Route path="/admin/videos">
        <ProtectedRoute adminOnly><AdminLayout><AdminVideos /></AdminLayout></ProtectedRoute>
      </Route>
      <Route path="/admin/questions">
        <ProtectedRoute adminOnly><AdminLayout><AdminQuestions /></AdminLayout></ProtectedRoute>
      </Route>
      <Route path="/admin/notifications">
        <ProtectedRoute adminOnly><AdminLayout><AdminNotifications /></AdminLayout></ProtectedRoute>
      </Route>
      <Route path="/admin/certificates">
        <ProtectedRoute adminOnly><AdminLayout><AdminCertificates /></AdminLayout></ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="kisan-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
