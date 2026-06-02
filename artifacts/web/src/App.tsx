import { Route, Switch, Redirect, Router } from "wouter";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { MessagingProvider } from "@/context/MessagingContext";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Feed from "@/pages/Feed";
import Profile from "@/pages/Profile";
import Messages from "@/pages/Messages";
import Chat from "@/pages/Chat";
import PalavaRoom from "@/pages/PalavaRoom";
import Notifications from "@/pages/Notifications";
import CampusJams from "@/pages/CampusJams";
import PostDetail from "@/pages/PostDetail";
import Search from "@/pages/Search";
import Settings from "@/pages/Settings";
import Topic from "@/pages/Topic";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import CommunityGuidelines from "@/pages/CommunityGuidelines";
import Support from "@/pages/Support";
import AccountDeletion from "@/pages/AccountDeletion";
import { TopNav } from "@/components/TopNav";
import { LeftSidebar } from "@/components/LeftSidebar";
import { RightSidebar } from "@/components/RightSidebar";

function ProtectedLayout({
  children,
  hideRightSidebar,
}: {
  children: React.ReactNode;
  hideRightSidebar?: boolean;
}) {
  const { loading, firebaseUser } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-palava-red border-t-transparent rounded-full animate-spin" />
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
        {!hideRightSidebar && <RightSidebar />}
      </div>
    </div>
  );
}

function AuthOnly({ children }: { children: React.ReactNode }) {
  const { loading, firebaseUser } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-palava-red border-t-transparent rounded-full animate-spin" />
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
      <MessagingProvider>
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
            <Route path="/profile/:userId">
              {(params) => (
                <ProtectedLayout>
                  <Profile userId={params.userId} />
                </ProtectedLayout>
              )}
            </Route>
            <Route path="/me">
              {() => {
                return (
                  <ProtectedLayout>
                    <Profile userId="me" />
                  </ProtectedLayout>
                );
              }}
            </Route>
            <Route path="/messages">
              <ProtectedLayout hideRightSidebar>
                <Messages />
              </ProtectedLayout>
            </Route>
            <Route path="/messages/:userId">
              {(params) => (
                <ProtectedLayout hideRightSidebar>
                  <Chat otherUserId={params.userId} />
                </ProtectedLayout>
              )}
            </Route>
            <Route path="/palava-room">
              <ProtectedLayout>
                <PalavaRoom />
              </ProtectedLayout>
            </Route>
            <Route path="/notifications">
              <ProtectedLayout>
                <Notifications />
              </ProtectedLayout>
            </Route>
            <Route path="/campus-jams">
              <ProtectedLayout>
                <CampusJams />
              </ProtectedLayout>
            </Route>
            <Route path="/post/:postId">
              {(params) => (
                <ProtectedLayout>
                  <PostDetail postId={params.postId} />
                </ProtectedLayout>
              )}
            </Route>
            <Route path="/topic/:tag">
              {(params) => (
                <ProtectedLayout>
                  <Topic tag={params.tag} />
                </ProtectedLayout>
              )}
            </Route>
            <Route path="/search">
              <ProtectedLayout>
                <Search />
              </ProtectedLayout>
            </Route>
            <Route path="/settings">
              <ProtectedLayout hideRightSidebar>
                <Settings />
              </ProtectedLayout>
            </Route>
            <Route path="/privacy-policy">
              <PrivacyPolicy />
            </Route>
            <Route path="/terms-of-service">
              <TermsOfService />
            </Route>
            <Route path="/community-guidelines">
              <CommunityGuidelines />
            </Route>
            <Route path="/support">
              <Support />
            </Route>
            <Route path="/account-deletion">
              <AccountDeletion />
            </Route>
            <Route>
              <Redirect to="/" />
            </Route>
          </Switch>
        </Router>
      </MessagingProvider>
    </AuthProvider>
  );
}
