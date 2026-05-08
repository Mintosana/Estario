import { ArrowLeft, CalendarDays, Phone, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getApiErrorMessage, resolveApiAssetUrl } from "../api/axiosClient.js";
import { getOwnerProfile } from "../api/ownersApi.js";
import { ListingCard } from "../components/listings/ListingCard.jsx";

function formatDate(value) {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium"
  }).format(new Date(value));
}

export function OwnerProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadOwnerProfile() {
      setIsLoading(true);
      setError("");

      try {
        const response = await getOwnerProfile(id);
        if (isMounted) {
          setProfile(response.data);
        }
      } catch (apiError) {
        if (isMounted) {
          setError(getApiErrorMessage(apiError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOwnerProfile();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return <div className="page-status">Se incarca profilul...</div>;
  }

  if (error && !profile) {
    return (
      <div className="page-status">
        <p className="form-error">{error}</p>
        <Link to="/">Inapoi la anunturi</Link>
      </div>
    );
  }

  const { listings, owner } = profile;

  return (
    <section className="owner-profile-page">
      <Link className="back-link" to="/">
        <ArrowLeft size={16} aria-hidden="true" />
        Inapoi la anunturi
      </Link>

      <section className="content-panel owner-profile-header">
        <div className="owner-profile-avatar">
          {owner.avatarUrl ? (
            <img src={resolveApiAssetUrl(owner.avatarUrl)} alt={owner.name} />
          ) : (
            <UserCircle size={74} aria-hidden="true" />
          )}
        </div>
        <div>
          <h1>{owner.name}</h1>
          <div className="owner-profile-meta">
            <span>
              <CalendarDays size={16} aria-hidden="true" />
              Membru din {formatDate(owner.createdAt)}
            </span>
            {owner.phone ? (
              <a href={`tel:${owner.phone}`}>
                <Phone size={16} aria-hidden="true" />
                {owner.phone}
              </a>
            ) : null}
          </div>
          {owner.bio ? <p>{owner.bio}</p> : <p>Proprietarul nu a adaugat inca o descriere publica.</p>}
        </div>
      </section>

      <div className="dashboard-header">
        <div>
          <h2>Anunturi publicate</h2>
          <p>{listings.length} anunturi aprobate</p>
        </div>
      </div>

      {listings.length ? (
        <div className="listing-grid">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Nu exista anunturi aprobate</h2>
          <p>Acest profil nu are momentan anunturi publice.</p>
        </div>
      )}
    </section>
  );
}
