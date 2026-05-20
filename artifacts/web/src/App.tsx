import { Route, Switch, Redirect, Router } from "wouter";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Feed from "@/pages/Feed";
import { TopNav } from "@/components/TopNav";
import { LeftSidebar } from "@/components/LeftSidebar";
import { RightSidebar } from "@/components/RightSidebar";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { loading, firebaseUser } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-fb-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!firebaseUser) return <Redirect to="/login" />;
  return (
    <div className="min-h-screen bg-fb-bg">
      <TopNav />
      <div className="max-w-[1600px] mx-auto flex gap-0">
        <LeftSidebar />
        <main className="flex-1 min-w-0 max-w-[680px] mx-auto py-4 px-2 sm:px-4">
          {children}
        </main>
        <RightSidebar />
      </div>
    </div>
  );
}

function AuthOnly({ children }: { children: React.ReactNode }) {
  const { loading, firebaseUser } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-fb-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (firebaseUser) return <Redirect to="/" />;
  return <>{children}</>;
}

export default function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <AuthProvider>
      <Router base={base}>
        <Switch>
          <Route path="/login">
            <AuthOnly>
              <Login />
            </AuthOnly>
          </Route>
          <Route path="/register">
            <AuthOnly>
              <Register />
            </AuthOnly>
          </Route>
          <Route path="/">
            <ProtectedLayout>
              <Feed />
            </ProtectedLayout>
          </Route>
          <Route>
            <Redirect to="/" />
          </Route>
        </Switch>
      </Router>
    </AuthProvider>
  );
}
