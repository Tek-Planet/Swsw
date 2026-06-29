
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import { MyEventsPage } from "./pages/MyEvents";
import EventDetails from "./pages/EventDetails";
import MyEventDetails from "./pages/MyEventDetails";
import Checkout from "./pages/Checkout";
import Success from "./pages/Success";
import Cancel from "./pages/Cancel";
import MyTickets from "./pages/MyTickets";
import OrderDetail from "./pages/OrderDetail";
import Auth from "./pages/Auth";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import SprogteamPrivacyPolicy from "./pages/SprogteamPrivacyPolicy";
import Support from "./pages/Support";
import SupportTickets from "./pages/SupportTickets";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminEvents from "./pages/admin/Events";
import AdminBookings from "./pages/admin/Bookings";
import AdminSettings from "./pages/admin/Settings";
import AdminScanner from "./pages/admin/Scanner";
import AdminEventCreate from "./pages/admin/EventCreate";
import AdminEventEdit from "./pages/admin/EventEdit";
import AdminEventDetails from "./pages/admin/EventDetails";
import AdminEventSeats from "./pages/admin/AdminEventSeats";
import AdminEventPhotos from "./pages/admin/EventPhotos";
import { EventNotificationsPage } from "./pages/admin/EventNotificationsPage";
import EventEmailPage from "./pages/admin/EventEmailPage";
import AdminUsers from "./pages/admin/Users";
import AdminQueries from "./pages/admin/Queries";
import EventApplications from "./pages/admin/EventApplications";
import EventSurvey from "./pages/admin/EventSurvey";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/my-events" element={<MyEventsPage />} />
            <Route path="/my-events/:eventId" element={<MyEventDetails />} />
            <Route path="/events/:eventId" element={<EventDetails />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/success" element={<Success />} />
            <Route path="/cancel" element={<Cancel />} />
            <Route path="/my-tickets" element={<MyTickets />} />
            <Route path="/my-tickets/:orderId" element={<OrderDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/sprogteam-privacy" element={<SprogteamPrivacyPolicy />} />
            <Route path="/support" element={<Support />} />
            <Route path="/support/tickets" element={<SupportTickets />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
            <Route path="/admin/events" element={<AdminLayout><AdminEvents /></AdminLayout>} />
            <Route path="/admin/events/create" element={<AdminLayout><AdminEventCreate /></AdminLayout>} />
            <Route path="/admin/events/:eventId" element={<AdminLayout><AdminEventDetails /></AdminLayout>} />
            <Route path="/admin/events/:eventId/edit" element={<AdminLayout><AdminEventEdit /></AdminLayout>} />
            <Route path="/admin/events/:eventId/seats" element={<AdminLayout><AdminEventSeats /></AdminLayout>} />
            <Route path="/admin/events/:eventId/photos" element={<AdminLayout><AdminEventPhotos /></AdminLayout>} />
            <Route path="/admin/events/:eventId/notifications" element={<AdminLayout><EventNotificationsPage /></AdminLayout>} />
            <Route path="/admin/events/:eventId/email" element={<AdminLayout><EventEmailPage /></AdminLayout>} />
            <Route path="/admin/events/:eventId/applications" element={<AdminLayout><EventApplications /></AdminLayout>} />
            <Route path="/admin/events/:eventId/survey" element={<AdminLayout><EventSurvey /></AdminLayout>} />
            <Route path="/admin/bookings" element={<AdminLayout><AdminBookings /></AdminLayout>} />
            <Route path="/admin/scanner" element={<AdminLayout><AdminScanner /></AdminLayout>} />
            <Route path="/admin/queries" element={<AdminLayout><AdminQueries /></AdminLayout>} />
            <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
            <Route path="/admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
