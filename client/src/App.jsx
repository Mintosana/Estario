import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout.jsx";
import { ProtectedRoute } from "./components/layout/ProtectedRoute.jsx";
import { MarketplacePage } from "./pages/MarketplacePage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { ListingDetailsPage } from "./pages/ListingDetailsPage.jsx";
import { ListingFormPage } from "./pages/ListingFormPage.jsx";
import { MyListingsPage } from "./pages/MyListingsPage.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";
import { ConversationPage } from "./pages/ConversationPage.jsx";
import { ComparePage } from "./pages/ComparePage.jsx";
import { FavoritesPage } from "./pages/FavoritesPage.jsx";
import { MessagesInboxPage } from "./pages/MessagesInboxPage.jsx";
import { NotificationsPage } from "./pages/NotificationsPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";
import { OwnerProfilePage } from "./pages/OwnerProfilePage.jsx";

const AdminAnalyticsPage = lazy(() =>
  import("./pages/AdminAnalyticsPage.jsx").then((module) => ({ default: module.AdminAnalyticsPage }))
);

function LazyAdminAnalyticsPage() {
  return (
    <Suspense fallback={<div className="page-status">Se incarca statisticile...</div>}>
      <AdminAnalyticsPage />
    </Suspense>
  );
}

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<MarketplacePage />} />
        <Route path="/listings/:id" element={<ListingDetailsPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/owners/:id" element={<OwnerProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/messages" element={<MessagesInboxPage />} />
          <Route path="/messages/:id" element={<ConversationPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/my-listings" element={<MyListingsPage />} />
          <Route path="/listings/new" element={<ListingFormPage mode="create" />} />
          <Route path="/listings/:id/edit" element={<ListingFormPage mode="edit" />} />
        </Route>
        <Route element={<ProtectedRoute requireAdmin />}>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/analytics" element={<LazyAdminAnalyticsPage />} />
        </Route>
      </Routes>
    </AppLayout>
  );
}
