import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAdminAuth } from "@/lib/auth";
import Layout from "@/components/layout";
import LoginPage from "@/pages/login";
import PrivacyPolicyPage from "@/pages/privacy";
import DashboardPage from "@/pages/dashboard";
import SchoolsPage from "@/pages/schools";
import UsersPage from "@/pages/users";
import PostsPage from "@/pages/posts";
import AdsPage from "@/pages/ads";
import VerificationsPage from "@/pages/verifications";
import ReportsPage from "@/pages/reports";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, user, isAdmin } = useAdminAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user || !isAdmin) {
    return <Redirect to="/login" />;
  }
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/privacy" component={PrivacyPolicyPage} />
      <Route path="/privacy-policy" component={PrivacyPolicyPage} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <Layout>
            <DashboardPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/schools">
        <ProtectedRoute>
          <Layout>
            <SchoolsPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/users">
        <ProtectedRoute>
          <Layout>
            <UsersPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/posts">
        <ProtectedRoute>
          <Layout>
            <PostsPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/ads">
        <ProtectedRoute>
          <Layout>
            <AdsPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/verifications">
        <ProtectedRoute>
          <Layout>
            <VerificationsPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute>
          <Layout>
            <ReportsPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/">
        <RootRedirect />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function RootRedirect() {
  const { loading, user, isAdmin } = useAdminAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return user && isAdmin ? <Redirect to="/dashboard" /> : <Redirect to="/login" />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
