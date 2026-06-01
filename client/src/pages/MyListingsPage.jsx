import { BadgeEuro, BarChart3, Edit, Eye, Mail, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../api/axiosClient.js";
import { deleteListing, getMyListingAnalytics, getMyListings } from "../api/listingsApi.js";
import { getListingMessages } from "../api/messagesApi.js";
import { sponsorListing } from "../api/promotionApi.js";
import { propertyTypeLabels } from "../constants/listingLabels.js";
import { statusLabels } from "../constants/statusLabels.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { formatPrice } from "../utils/formatters.js";

export function MyListingsPage() {
  const { updateUser, user } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [messagesByListing, setMessagesByListing] = useState({});
  const [error, setError] = useState("");
  const [notice] = useState(location.state?.notice ?? "");
  const [promotionActionId, setPromotionActionId] = useState("");
  const [highlightedListingId] = useState(location.state?.highlightedListingId ?? "");
  const [isLoading, setIsLoading] = useState(true);
  const hasShownNavigationNotice = useRef(false);

  useEffect(() => {
    if (location.state?.notice || location.state?.highlightedListingId) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (notice && !hasShownNavigationNotice.current) {
      hasShownNavigationNotice.current = true;
      showToast({ message: notice, type: "success" });
    }
  }, [notice, showToast]);

  useEffect(() => {
    if (error) {
      showToast({ message: error, type: "error" });
    }
  }, [error, showToast]);

  async function loadListings() {
    setIsLoading(true);
    setError("");

    try {
      const [listingsResponse, analyticsResponse] = await Promise.all([getMyListings(), getMyListingAnalytics()]);
      setListings(listingsResponse.data);
      setAnalytics(analyticsResponse.data);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadListings();
  }, []);

  async function removeListing(id) {
    if (!window.confirm("Stergi acest anunt? Actiunea nu poate fi anulata.")) {
      return;
    }

    setError("");

    try {
      await deleteListing(id);
      setListings((current) => current.filter((listing) => listing.id !== id));
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    }
  }

  async function toggleMessages(id) {
    if (messagesByListing[id]) {
      setMessagesByListing((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      return;
    }

    setError("");

    try {
      const response = await getListingMessages(id);
      setMessagesByListing((current) => ({
        ...current,
        [id]: response.data
      }));
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    }
  }

  async function promoteListing(id) {
    setError("");

    if ((user?.promotionCredits ?? 0) <= 0) {
      showToast({
        message: "Nu ai credite de promovare disponibile. Cumpara un pachet din profil pentru a promova anuntul.",
        type: "warning"
      });
      return;
    }

    setPromotionActionId(id);

    try {
      const response = await sponsorListing(id);
      updateUser(response.user);
      setListings((current) => current.map((listing) => (listing.id === id ? response.listing : listing)));
      showToast({ message: "Anuntul a fost promovat pentru o luna.", type: "success" });
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setPromotionActionId("");
    }
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Anunturile mele</h1>
          <p>Gestioneaza anunturile trimise spre publicare si mesajele primite.</p>
        </div>
        <Link className="primary-button" to="/listings/new">
          <Plus size={18} aria-hidden="true" />
          Adauga anunt
        </Link>
      </div>

      {isLoading ? <div className="page-status">Se incarca anunturile...</div> : null}

      {!isLoading && analytics ? (
        <div className="analytics-grid owner-analytics-grid">
          <article className="analytics-card">
            <span>Anunturi</span>
            <strong>{analytics.totalListings}</strong>
            <p>{analytics.statusCounts.APPROVED} aprobate</p>
          </article>
          <article className="analytics-card">
            <span>Vizualizari</span>
            <strong>{analytics.totalViews}</strong>
            <p>Pe toate anunturile tale</p>
          </article>
          <article className="analytics-card">
            <span>Favorite</span>
            <strong>{analytics.totalFavorites}</strong>
            <p>Salvari de la utilizatori</p>
          </article>
          <article className="analytics-card">
            <span>Mesaje</span>
            <strong>{analytics.totalMessages}</strong>
            <p>Primite pentru anunturi</p>
          </article>
          <article className="analytics-card">
            <span>Credite promovare</span>
            <strong>{user?.promotionCredits ?? 0}</strong>
            <p>Disponibile pentru boost</p>
          </article>
        </div>
      ) : null}

      {!isLoading && listings.length === 0 ? (
        <div className="empty-state">
          <h2>Nu ai anunturi</h2>
          <p>Adauga primul anunt si acesta va fi trimis spre aprobare.</p>
        </div>
      ) : null}

      <div className="management-list">
        {listings.map((listing) => (
          <article
            className={`management-item ${listing.id === highlightedListingId ? "management-item-highlight" : ""}`}
            key={listing.id}
          >
            <div className="management-info">
              <div className="management-badges">
                <span className={`status-badge status-${listing.status.toLowerCase()}`}>
                  {statusLabels[listing.status]}
                </span>
                {listing.isSponsored ? (
                  <span className="status-badge status-sponsored">
                    <BadgeEuro size={14} aria-hidden="true" />
                    Promovat
                  </span>
                ) : null}
              </div>
              <h2>{listing.title}</h2>
              <p>
                {propertyTypeLabels[listing.propertyType]} in {listing.city}, {listing.county}
              </p>
              <strong>{formatPrice(listing.price, listing.currency)}</strong>
              {listing.isSponsored ? (
                <div className="promotion-performance">
                  <div className="promotion-performance-heading">
                    <BarChart3 size={17} aria-hidden="true" />
                    <strong>Performanta promovare</strong>
                  </div>
                  <div className="promotion-performance-grid">
                    <div>
                      <span>Promovat pana la</span>
                      <strong>{new Date(listing.sponsoredUntil).toLocaleDateString("ro-RO")}</strong>
                    </div>
                    <div>
                      <span>Vizualizari promovare</span>
                      <strong>{listing.promotionAnalytics?.viewsDuringPromotion ?? listing.viewCount ?? 0}</strong>
                    </div>
                    <div>
                      <span>Fata de perioada anterioara</span>
                      <strong className={(listing.promotionAnalytics?.viewsDelta ?? 0) >= 0 ? "positive-delta" : "negative-delta"}>
                        {(listing.promotionAnalytics?.viewsDelta ?? 0) >= 0 ? "+" : ""}
                        {listing.promotionAnalytics?.viewsDelta ?? 0}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : null}
              {listing.status === "REJECTED" ? (
                <p className="rejection-reason">
                  <strong>Motiv respingere:</strong> {listing.rejectionReason || "Motiv necompletat."}
                </p>
              ) : null}
            </div>

            <div className="management-actions">
              <Link className="secondary-button" to={`/listings/${listing.id}`}>
                <Eye size={16} aria-hidden="true" />
                Vezi
              </Link>
              <Link className="secondary-button" to={`/listings/${listing.id}/edit`}>
                <Edit size={16} aria-hidden="true" />
                Editeaza
              </Link>
              <button className="secondary-button" type="button" onClick={() => toggleMessages(listing.id)}>
                <Mail size={16} aria-hidden="true" />
                Mesaje
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => promoteListing(listing.id)}
                disabled={listing.status !== "APPROVED" || promotionActionId === listing.id}
              >
                <BadgeEuro size={16} aria-hidden="true" />
                {listing.isSponsored ? "Prelungeste" : "Promoveaza"}
              </button>
              <button className="danger-button" type="button" onClick={() => removeListing(listing.id)}>
                <Trash2 size={16} aria-hidden="true" />
                Sterge
              </button>
            </div>

            {messagesByListing[listing.id] ? (
              <div className="message-list">
                {messagesByListing[listing.id].length ? (
                  messagesByListing[listing.id].map((message) => (
                    <div className="message-item" key={message.id}>
                      <strong>{message.senderName}</strong>
                      <span>{message.senderEmail}</span>
                      <p>{message.message}</p>
                    </div>
                  ))
                ) : (
                  <p>Nu exista mesaje pentru acest anunt.</p>
                )}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
