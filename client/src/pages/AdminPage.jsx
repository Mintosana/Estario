import { CheckCircle2, Eye, RefreshCw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { approveListing, getPendingListings, getRejectedListings, rejectListing } from "../api/adminApi.js";
import { getApiErrorMessage } from "../api/axiosClient.js";
import { propertyTypeLabels, transactionTypeLabels } from "../constants/listingLabels.js";
import { statusLabels } from "../constants/statusLabels.js";
import { formatArea, formatPrice } from "../utils/formatters.js";

const tabs = {
  pending: "In asteptare",
  rejected: "Respinse"
};

export function AdminPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingListings, setPendingListings] = useState([]);
  const [rejectedListings, setRejectedListings] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rejectReasons, setRejectReasons] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState("");

  async function loadModerationQueues() {
    setIsLoading(true);
    setError("");

    try {
      const [pendingResponse, rejectedResponse] = await Promise.all([getPendingListings(), getRejectedListings()]);
      setPendingListings(pendingResponse.data);
      setRejectedListings(rejectedResponse.data);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadModerationQueues();
  }, []);

  async function approve(id) {
    setActionId(id);
    setError("");
    setSuccess("");

    try {
      const response = await approveListing(id);
      setPendingListings((current) => current.filter((listing) => listing.id !== id));
      setRejectedListings((current) => current.filter((listing) => listing.id !== id));
      setSuccess(`Anuntul "${response.data.title}" a fost aprobat.`);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setActionId("");
    }
  }

  function updateRejectReason(id, reason) {
    setRejectReasons((current) => ({
      ...current,
      [id]: reason
    }));
  }

  async function reject(id) {
    const reason = rejectReasons[id]?.trim() ?? "";

    if (reason.length < 5) {
      setError("Completeaza motivul respingerii cu cel putin 5 caractere.");
      return;
    }

    setActionId(id);
    setError("");
    setSuccess("");

    try {
      const response = await rejectListing(id, reason);
      setPendingListings((current) => current.filter((listing) => listing.id !== id));
      setRejectedListings((current) => [response.data, ...current.filter((listing) => listing.id !== id)]);
      setRejectReasons((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setSuccess(`Anuntul "${response.data.title}" a fost respins.`);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setActionId("");
    }
  }

  const visibleListings = activeTab === "pending" ? pendingListings : rejectedListings;

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Administrare anunturi</h1>
          <p>Verifica anunturile trimise de utilizatori si decide ce devine public.</p>
        </div>
        <button className="secondary-button icon-button" type="button" onClick={loadModerationQueues} disabled={isLoading}>
          <RefreshCw size={18} aria-hidden="true" />
          Actualizeaza
        </button>
      </div>

      <div className="admin-tabs" role="tablist" aria-label="Liste de moderare">
        {Object.entries(tabs).map(([value, label]) => (
          <button
            aria-selected={activeTab === value}
            className={activeTab === value ? "active" : ""}
            key={value}
            onClick={() => setActiveTab(value)}
            role="tab"
            type="button"
          >
            {label}
            <span>{value === "pending" ? pendingListings.length : rejectedListings.length}</span>
          </button>
        ))}
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {success ? <p className="form-success">{success}</p> : null}
      {isLoading ? <div className="page-status">Se incarca anunturile pentru moderare...</div> : null}

      {!isLoading && visibleListings.length === 0 ? (
        <div className="empty-state">
          <h2>{activeTab === "pending" ? "Nu exista anunturi in asteptare" : "Nu exista anunturi respinse"}</h2>
          <p>
            {activeTab === "pending"
              ? "Cand utilizatorii trimit anunturi noi, acestea vor aparea aici pentru aprobare."
              : "Anunturile respinse raman ascunse pana cand proprietarul le editeaza si le retrimite spre aprobare."}
          </p>
        </div>
      ) : null}

      <div className="management-list">
        {visibleListings.map((listing) => (
          <article className="management-item admin-management-item" key={listing.id}>
            <div className="management-info">
              <span className={`status-badge status-${listing.status.toLowerCase()}`}>
                {statusLabels[listing.status]}
              </span>
              <h2>{listing.title}</h2>
              <p>
                {propertyTypeLabels[listing.propertyType]} pentru {transactionTypeLabels[listing.transactionType].toLowerCase()} in{" "}
                {listing.city}, {listing.county}
              </p>
              <dl className="admin-listing-facts">
                <div>
                  <dt>Pret</dt>
                  <dd>{formatPrice(listing.price, listing.currency)}</dd>
                </div>
                <div>
                  <dt>Suprafata</dt>
                  <dd>{formatArea(listing.surface)}</dd>
                </div>
                <div>
                  <dt>Camere</dt>
                  <dd>{listing.rooms}</dd>
                </div>
                <div>
                  <dt>Proprietar</dt>
                  <dd>{listing.owner?.name ?? "Utilizator"}</dd>
                </div>
              </dl>
            </div>

            <div className="management-actions admin-actions">
              <Link className="secondary-button" to={`/listings/${listing.id}`}>
                <Eye size={16} aria-hidden="true" />
                Vezi
              </Link>
              {listing.status === "PENDING" ? (
                <button
                  className="primary-button"
                  disabled={actionId === listing.id}
                  type="button"
                  onClick={() => approve(listing.id)}
                >
                  <CheckCircle2 size={16} aria-hidden="true" />
                  Aproba
                </button>
              ) : null}
              {listing.status === "PENDING" ? (
                <label className="admin-reject-reason">
                  Motiv respingere
                  <textarea
                    maxLength={500}
                    minLength={5}
                    rows={3}
                    value={rejectReasons[listing.id] ?? ""}
                    onChange={(event) => updateRejectReason(listing.id, event.target.value)}
                    placeholder="Explica ce trebuie corectat inainte de retrimitere."
                  />
                </label>
              ) : null}
              {listing.status === "PENDING" ? (
                <button
                  className="danger-button"
                  disabled={actionId === listing.id}
                  type="button"
                  onClick={() => reject(listing.id)}
                >
                  <XCircle size={16} aria-hidden="true" />
                  Respinge
                </button>
              ) : null}
              {listing.status === "REJECTED" ? (
                <p className="admin-review-note">
                  <strong>Motiv respingere:</strong> {listing.rejectionReason || "Motiv necompletat."}
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
