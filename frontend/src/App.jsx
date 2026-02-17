import { lazy, Suspense, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useTheme } from "./contexts/ThemeContext";
import GlobalStyles from "./styles/GlobalStyles";
import { ThemeProvider as StyledThemeProvider } from "styled-components";
import AppContainer from "./utils/AppContainer";
import Spinner from "./components/GDG-Spinner";
import CertificateDisplay from "./pages/CertificateDisplay";
import CertificateVerification from "./pages/CertificateVerification";
import CheckOut from "./pages/CheckOut";
const HomePage = lazy(() => import("./pages/HomePage"));
const Events = lazy(() => import("./pages/Events"));
const Team = lazy(() => import("./pages/Team"));
const AuthPage = lazy(() => import("./pages/AuthPage"));

const AuthProvider = lazy(() => import("./contexts/AuthContext"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const About = lazy(() => import("./pages/About"));

// Dashboard components
const DashboardLayout = lazy(() => import("./pages/Dashboard/DashboardLayout"));
const Overview = lazy(() => import("./pages/Dashboard/Overview"));
const MyEvents = lazy(() => import("./pages/Dashboard/MyEvents"));
const Certificates = lazy(() => import("./pages/Dashboard/Certificates"));
const Profile = lazy(() => import("./pages/Dashboard/Profile"));
const Teams = lazy(() => import("./pages/Dashboard/Teams"));
const StudyJams = lazy(() => import("./pages/Dashboard/StudyJams"));

// Admin components
const AdminRoute = lazy(() => import("./pages/Admin/AdminRoute"));
const TeamManagement = lazy(() => import("./pages/Admin/TeamManagement"));
const CertificateManagement = lazy(
  () => import("./pages/Admin/CertificateManagement"),
);
const AdminLayout = lazy(() => import("./pages/Admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/Admin/Dashboard"));
const AdminUsers = lazy(() => import("./pages/Admin/Users"));
const AdminEvents = lazy(() => import("./pages/Admin/Events"));
const EventDetails = lazy(() => import("./pages/Admin/EventDetails"));
const EditEvent = lazy(() => import("./pages/Admin/EditEvent"));
const AdminRegistrations = lazy(() => import("./pages/Admin/Registrations"));
const EmailCenter = lazy(() => import("./pages/Admin/EmailCenter"));
const AdminLogin = lazy(() => import("./pages/Admin/AdminLogin")); // Import
const NotFound = lazy(() => import("./pages/NotFound"));

const FollowCursor = lazy(() => import("./components/FollowCursor"));
const ChatWidget = lazy(() => import("./components/ChatWidget"));

// Immerse components
const ImmerseLogin = lazy(() => import("./pages/Immerse/ImmerseLogin"));
const ImmerseLayout = lazy(() => import("./pages/Immerse/ImmerseLayout"));
const ImmerseDashboard = lazy(() => import("./pages/Immerse/ImmerseDashboard"));
const ImmerseContacts = lazy(() => import("./pages/Immerse/ImmerseContacts"));
const ImmerseCompanies = lazy(() => import("./pages/Immerse/ImmerseCompanies"));
const ImmerseStudents = lazy(() => import("./pages/Immerse/ImmerseStudents"));
const ImmerseCompose = lazy(() => import("./pages/Immerse/ImmerseCompose"));
const ImmerseTemplates = lazy(() => import("./pages/Immerse/ImmerseTemplates"));
const ImmerseLogs = lazy(() => import("./pages/Immerse/ImmerseLogs"));
const ImmerseAnalytics = lazy(() => import("./pages/Immerse/ImmerseAnalytics"));
const ImmerseSettings = lazy(() => import("./pages/Immerse/ImmerseSettings"));
const ImmerseRegistrations = lazy(() => import("./pages/Immerse/ImmerseRegistrations"));

// Immerse Public Pages
const ImmerseLanding = lazy(() => import("./pages/Immerse/public/ImmerseLanding"));
const ImmerseEventPage = lazy(() => import("./pages/Immerse/public/ImmerseEventPage"));

function App() {
  const { theme } = useTheme();

  useEffect(() => {
    document.title = "GDG MMMUT - Google Developer Group";
  }, []);

  return (
    <AuthProvider>
      <Suspense fallback={<Spinner />}>
        {/* Using StyledThemeProvider to apply the theme */}
        <StyledThemeProvider theme={theme}>
          <GlobalStyles />
          <FollowCursor />
          <ChatWidget />
          <Routes>
            <Route element={<AppContainer />}>
              <Route path="/" index element={<HomePage />} />
              <Route path="/events" element={<Events />} />
              <Route path="/about" element={<About />} />
              <Route path="/team" element={<Team />} />
            </Route>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/verification/:serial"
              element={<CertificateDisplay />}
            />
            <Route
              path="/certificate/verify"
              element={<CertificateVerification />}
            />
            <Route path="/rsvp" element={<CheckOut />} />

            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Overview />} />
              <Route path="events" element={<MyEvents />} />
              <Route path="study-jams" element={<StudyJams />} />
              <Route path="teams" element={<Teams />} />
              <Route path="certificates" element={<Certificates />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Admin Login - Separate Portal */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="events/:id" element={<EventDetails />} />
              <Route path="events/:id/edit" element={<EditEvent />} />
              <Route path="registrations" element={<AdminRegistrations />} />
              <Route path="emails" element={<EmailCenter />} />
              <Route path="certificates" element={<CertificateManagement />} />
              <Route path="teams" element={<TeamManagement />} />
              <Route
                path="analytics"
                element={
                  <div style={{ padding: "24px" }}>Analytics - Coming Soon</div>
                }
              />
              <Route
                path="settings"
                element={
                  <div style={{ padding: "24px" }}>Settings - Coming Soon</div>
                }
              />
            </Route>

            {/* Immerse Login - Separate Portal */}
            <Route path="/immerse/login" element={<ImmerseLogin />} />

            {/* Immerse 2026 Public Pages */}
            <Route path="/immerse-2026" element={<ImmerseLanding />} />
            <Route path="/immerse-2026/:slug" element={<ImmerseEventPage />} />

            {/* Immerse Routes */}
            <Route path="/immerse" element={<ImmerseLayout />}>
              <Route index element={<ImmerseDashboard />} />
              <Route path="dashboard" element={<ImmerseDashboard />} />
              <Route path="contacts" element={<ImmerseContacts />} />
              <Route path="companies" element={<ImmerseCompanies />} />
              <Route path="students" element={<ImmerseStudents />} />
              <Route path="compose" element={<ImmerseCompose />} />
              <Route path="templates" element={<ImmerseTemplates />} />
              <Route path="logs" element={<ImmerseLogs />} />
              <Route path="analytics" element={<ImmerseAnalytics />} />
              <Route path="registrations" element={<ImmerseRegistrations />} />
              <Route path="settings" element={<ImmerseSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </StyledThemeProvider>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
