import { Edit, Eye, Mail, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../api/axiosClient.js";
import { deleteListing, getMyListings } from "../api/listingsApi.js";
import { getListingMessages } from "../api/messagesApi.js";
import { propertyTypeLabels } from "../constants/listingLabels.js";
import { statusLabels } from "../constants/statusLabels.js";
import { formatPrice } from "../utils/formatters.js";

export function MyListingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [messagesByListing, setMessagesByListing] = useState({});
  const [error, setError] = useState("");
  const [notice] = useState(location.state?.notice ?? "");
  const [highlightedListingId] = useState(location.state?.highlightedListingId ?? "");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (location.state?.notice || location.state?.highlightedListingId) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  async function loadListings() {
    setIsLoading(true);
    setError("");

    try {
      const response = await getMyListings();
      setListings(response.data);
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

      {error ? <p className="form-error">{error}</p> : null}
      {notice ? <p className="form-success">{notice}</p> : null}
      {isLoading ? <div className="page-status">Se incarca anunturile...</div> : null}

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
              <span className={`status-badge status-${listing.status.toLowerCase()}`}>
                {statusLabels[listing.status]}
              </span>
              <h2>{listing.title}</h2>
              <p>
                {propertyTypeLabels[listing.propertyType]} in {listing.city}, {listing.county}
              </p>
              <strong>{formatPrice(listing.price, listing.currency)}</strong>
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
