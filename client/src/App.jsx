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
import { FavoritesPage } from "./pages/FavoritesPage.jsx";

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<MarketplacePage />} />
        <Route path="/listings/:id" element={<ListingDetailsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/my-listings" element={<MyListingsPage />} />
          <Route path="/listings/new" element={<ListingFormPage mode="create" />} />
          <Route path="/listings/:id/edit" element={<ListingFormPage mode="edit" />} />
        </Route>
        <Route element={<ProtectedRoute requireAdmin />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </AppLayout>
  );
}
