import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useTheme } from './contexts/ThemeContext'
import GlobalStyles from './styles/GlobalStyles'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import AppContainer from './utils/AppContainer'
import Spinner from './components/GDG-Spinner'
import CertificateDisplay from './pages/CertificateDisplay'
import CertificateVerification from './pages/CertificateVerification';
import CheckOut from './pages/CheckOut'
const HomePage =lazy(()=>import( './pages/HomePage'));
const Events =lazy(()=>import('./pages/Events'));
const Team =lazy(()=>import('./pages/Team'));
const AuthPage=lazy(()=>import('./pages/AuthPage'));

const AuthProvider =lazy(()=>import('./contexts/AuthContext'));
const AuthCallback =lazy(()=>import('./pages/AuthCallback'));
const About =lazy(()=>import('./pages/About'));

// Dashboard components
const DashboardLayout = lazy(() => import('./pages/Dashboard/DashboardLayout'));
const Overview = lazy(() => import('./pages/Dashboard/Overview'));
const MyEvents = lazy(() => import('./pages/Dashboard/MyEvents'));
const Certificates = lazy(() => import('./pages/Dashboard/Certificates'));
const Profile = lazy(() => import('./pages/Dashboard/Profile'));
const Teams = lazy(() => import('./pages/Dashboard/Teams'));
const StudyJams = lazy(() => import('./pages/Dashboard/StudyJams'));

// Admin components
const AdminRoute = lazy(() => import('./pages/Admin/AdminRoute'));
const TeamManagement = lazy(() => import('./pages/Admin/TeamManagement'));
const CertificateManagement = lazy(() => import('./pages/Admin/CertificateManagement'));
const AdminLayout = lazy(() => import('./pages/Admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const AdminUsers = lazy(() => import('./pages/Admin/Users'));
const AdminEvents = lazy(() => import('./pages/Admin/Events'));
const EventDetails = lazy(() => import('./pages/Admin/EventDetails'));
const EditEvent = lazy(() => import('./pages/Admin/EditEvent'));
const AdminRegistrations = lazy(() => import('./pages/Admin/Registrations'));
const AdminNotifications = lazy(() => import('./pages/Admin/Notifications'));

const FollowCursor =lazy(()=>import('./components/FollowCursor'));

function App() {
  const { theme } = useTheme();

  
  useEffect(() => {
    document.title = "GDG MMMUT - Google Developer Group"
  }, []);

  return (
    <AuthProvider>
      <Suspense fallback={<Spinner />}>
      {/* Using StyledThemeProvider to apply the theme */}
        <StyledThemeProvider theme={theme}>
      <GlobalStyles />
      <FollowCursor />
      <Routes>
            <Route element={<AppContainer />} >
             <Route path='/' index element={<HomePage />} />
            <Route path='/events' element={<Events />} />
            <Route path='/about' element={<About />} />
            <Route path='/team' element={<Team />} />
            
             </Route>
             <Route path='/auth' element={<AuthPage />} />
             <Route path="/auth/callback" element={<AuthCallback/>} />
             <Route path="/verification/:serial" element={<CertificateDisplay />} />
             <Route path="/certificate/verify" element={<CertificateVerification />} />
             <Route path='/rsvp' element={<CheckOut />} />
             
             {/* Dashboard Routes */}
             <Route path="/dashboard" element={<DashboardLayout />}>
               <Route index element={<Overview />} />
               <Route path="events" element={<MyEvents />} />
               <Route path="study-jams" element={<StudyJams />} />
               <Route path="teams" element={<Teams />} />
               <Route path="certificates" element={<Certificates />} />
               <Route path="profile" element={<Profile />} />
             </Route>

             {/* Admin Routes */}
             <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
               <Route index element={<AdminDashboard />} />
               <Route path="users" element={<AdminUsers />} />
               <Route path="events" element={<AdminEvents />} />
               <Route path="events/:id" element={<EventDetails />} />
               <Route path="events/:id/edit" element={<EditEvent />} />
               <Route path="registrations" element={<AdminRegistrations />} />
               <Route path="notifications" element={<AdminNotifications />} />
               <Route path="certificates" element={<CertificateManagement />} />
               <Route path="teams" element={<TeamManagement />} />
               <Route path="analytics" element={<div style={{padding: '24px'}}>Analytics - Coming Soon</div>} />
               <Route path="settings" element={<div style={{padding: '24px'}}>Settings - Coming Soon</div>} />
             </Route>
          </Routes>
    </StyledThemeProvider>
      </Suspense>
    </AuthProvider>
  )
}

export default App