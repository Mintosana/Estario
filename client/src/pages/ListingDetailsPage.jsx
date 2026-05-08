import { Bus, CheckCircle2, Heart, Hospital, Mail, MapPin, School, ShoppingBag, Train, UserCircle, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { approveListing, rejectListing } from "../api/adminApi.js";
import { getApiErrorMessage, apiOrigin } from "../api/axiosClient.js";
import { addFavorite, getFavorites, removeFavorite } from "../api/favoritesApi.js";
import { getListing } from "../api/listingsApi.js";
import { createMessage } from "../api/messagesApi.js";
import { getNearbyPlaces } from "../api/nearbyPlacesApi.js";
import { CompareButton } from "../components/listings/CompareButton.jsx";
import { ListingMap } from "../components/listings/ListingMap.jsx";
import { ListingImage } from "../components/listings/ListingImage.jsx";
import {
  buildingConditionLabels,
  energyClassLabels,
  furnishingLabels,
  heatingTypeLabels,
  parkingLabels,
  propertyTypeLabels,
  transactionTypeLabels
} from "../constants/listingLabels.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatArea, formatDistance, formatPrice, formatPricePerSquareMeter } from "../utils/formatters.js";

const initialMessage = {
  senderName: "",
  senderEmail: "",
  message: ""
};

const nearbyIcons = {
  metro: Train,
  stb: Bus,
  shop: ShoppingBag,
  school: School,
  hospital: Hospital
};

export function ListingDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isAuthenticated, user } = useAuth();
  const [listing, setListing] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [messageForm, setMessageForm] = useState(initialMessage);
  const [error, setError] = useState("");
  const [messageStatus, setMessageStatus] = useState("");
  const [moderationStatus, setModerationStatus] = useState("");
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [nearbyStatus, setNearbyStatus] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModerating, setIsModerating] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isMessageSubmitting, setIsMessageSubmitting] = useState(false);

  const isFavorite = favoriteIds.has(id);
  const images = useMemo(() => listing?.images ?? [], [listing]);
  const isOwnListing = Boolean(user && listing?.ownerId === user.id);
  const canModerateListing = isAdmin && listing?.status === "PENDING";
  const visibleNearbyPlaces = nearbyPlaces.filter((item) => item.place);

  useEffect(() => {
    let isMounted = true;

    async function loadDetails() {
      setIsLoading(true);
      setError("");

      try {
        const [listingResponse, favoritesResponse] = await Promise.all([
          getListing(id),
          isAuthenticated ? getFavorites() : Promise.resolve({ data: [] })
        ]);

        if (isMounted) {
          const loadedListing = listingResponse.data;
          setListing(loadedListing);
          setSelectedImage(loadedListing.images?.[0]?.url ?? "");
          setFavoriteIds(new Set(favoritesResponse.data.map((favorite) => favorite.id)));
          setMessageForm({
            senderName: user?.name ?? "",
            senderEmail: user?.email ?? "",
            message: ""
          });
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

    loadDetails();

    return () => {
      isMounted = false;
    };
  }, [id, isAuthenticated, user]);

  useEffect(() => {
    if (!listing?.latitude || !listing?.longitude) {
      setNearbyPlaces([]);
      setNearbyStatus("");
      return undefined;
    }

    const controller = new AbortController();

    async function loadNearbyPlaces() {
      setNearbyStatus("Se incarca punctele din apropiere...");

      try {
        const places = await getNearbyPlaces(listing.latitude, listing.longitude, controller.signal);
        setNearbyPlaces(places);
        setNearbyStatus("");
      } catch (apiError) {
        if (apiError.name !== "AbortError") {
          setNearbyPlaces([]);
          setNearbyStatus("Nu am putut incarca punctele din apropiere.");
        }
      }
    }

    loadNearbyPlaces();

    return () => {
      controller.abort();
    };
  }, [listing?.latitude, listing?.longitude]);

  function updateMessageField(event) {
    setMessageForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  }

  async function toggleFavorite() {
    if (!isAuthenticated || !listing) {
      return;
    }

    setIsFavoriteLoading(true);

    try {
      if (isFavorite) {
        await removeFavorite(listing.id);
        setFavoriteIds((current) => {
          const next = new Set(current);
          next.delete(listing.id);
          return next;
        });
      } else {
        await addFavorite(listing.id);
        setFavoriteIds((current) => new Set(current).add(listing.id));
      }
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setIsFavoriteLoading(false);
    }
  }

  async function submitMessage(event) {
    event.preventDefault();
    setMessageStatus("");
    setError("");

    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }

    setIsMessageSubmitting(true);

    try {
      await createMessage(id, messageForm);
      setMessageStatus("Mesajul a fost trimis catre proprietar.");
      setMessageForm((current) => ({ ...current, message: "" }));
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setIsMessageSubmitting(false);
    }
  }

  async function approveCurrentListing() {
    if (!listing) {
      return;
    }

    setIsModerating(true);
    setError("");
    setModerationStatus("");

    try {
      const response = await approveListing(listing.id);
      setListing(response.data);
      setModerationStatus("Anuntul a fost aprobat si este acum public.");
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setIsModerating(false);
    }
  }

  async function rejectCurrentListing() {
    const reason = rejectReason.trim();

    if (!listing) {
      return;
    }

    if (reason.length < 5) {
      setError("Completeaza motivul respingerii cu cel putin 5 caractere.");
      return;
    }

    setIsModerating(true);
    setError("");
    setModerationStatus("");

    try {
      const response = await rejectListing(listing.id, reason);
      setListing(response.data);
      setRejectReason("");
      setModerationStatus("Anuntul a fost respins. Proprietarul il poate edita si retrimite spre aprobare.");
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setIsModerating(false);
    }
  }

  if (isLoading) {
    return <div className="page-status">Se incarca anuntul...</div>;
  }

  if (error && !listing) {
    return (
      <div className="page-status">
        <p className="form-error">{error}</p>
        <Link to="/">Inapoi la anunturi</Link>
      </div>
    );
  }

  const selectedImageUrl = selectedImage ? `${apiOrigin}${selectedImage}` : "";

  return (
    <section className="details-page">
      <Link className="back-link" to="/">
        Inapoi la anunturi
      </Link>

      <div className="details-layout">
        <div className="details-main">
          <div className="gallery-panel">
            <div className="gallery-main">
              <ListingImage src={selectedImageUrl} alt={listing.title} />
            </div>
            {images.length > 1 ? (
              <div className="gallery-thumbnails">
                {images.map((image) => (
                  <button
                    className={image.url === selectedImage ? "active" : ""}
                    key={image.id}
                    type="button"
                    onClick={() => setSelectedImage(image.url)}
                  >
                    <ListingImage src={`${apiOrigin}${image.url}`} alt="" fallback="" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <section className="content-panel">
            <div className="details-heading">
              <div>
                <div className="listing-card-meta">
                  <span>{transactionTypeLabels[listing.transactionType]}</span>
                  <span>{propertyTypeLabels[listing.propertyType]}</span>
                  {listing.status !== "APPROVED" ? <span>{listing.status}</span> : null}
                </div>
                <h1>{listing.title}</h1>
                <p className="listing-location">
                  <MapPin size={17} aria-hidden="true" />
                  {listing.address}, {listing.city}, {listing.county}
                </p>
              </div>
              <div className="details-price-block">
                <p className="details-price">{formatPrice(listing.price, listing.currency)}</p>
                <p className="details-price-sqm">
                  {formatPricePerSquareMeter(listing.price, listing.surface, listing.currency)}
                </p>
              </div>
            </div>

            <dl className="details-facts">
              <div>
                <dt>Tip proprietate</dt>
                <dd>{propertyTypeLabels[listing.propertyType]}</dd>
              </div>
              <div>
                <dt>Tip anunt</dt>
                <dd>{transactionTypeLabels[listing.transactionType]}</dd>
              </div>
              <div>
                <dt>Suprafata</dt>
                <dd>{formatArea(listing.surface)}</dd>
              </div>
              <div>
                <dt>Pret pe mp</dt>
                <dd>{formatPricePerSquareMeter(listing.price, listing.surface, listing.currency)}</dd>
              </div>
              <div>
                <dt>Camere</dt>
                <dd>{listing.rooms ?? "-"}</dd>
              </div>
              <div>
                <dt>Bai</dt>
                <dd>{listing.bathrooms ?? "-"}</dd>
              </div>
              <div>
                <dt>Etaj</dt>
                <dd>{listing.floor ?? "-"}</dd>
              </div>
              <div>
                <dt>An constructie</dt>
                <dd>{listing.yearBuilt ?? "-"}</dd>
              </div>
            </dl>

            <h2>Descriere</h2>
            <p>{listing.description}</p>
          </section>

          <section className="content-panel">
            <h2>Dotari si caracteristici</h2>
            <dl className="details-facts">
              <div>
                <dt>Mobilare</dt>
                <dd>{listing.furnished ? furnishingLabels[listing.furnished] : "-"}</dd>
              </div>
              <div>
                <dt>Parcare</dt>
                <dd>{listing.parking ? parkingLabels[listing.parking] : "-"}</dd>
              </div>
              <div>
                <dt>Balcon</dt>
                <dd>{listing.balcony === null || listing.balcony === undefined ? "-" : listing.balcony ? "Da" : "Nu"}</dd>
              </div>
              <div>
                <dt>Centrala proprie</dt>
                <dd>
                  {listing.hasOwnCentralHeating === null || listing.hasOwnCentralHeating === undefined
                    ? "-"
                    : listing.hasOwnCentralHeating
                      ? "Da"
                      : "Nu"}
                </dd>
              </div>
              <div>
                <dt>Tip incalzire</dt>
                <dd>{listing.heatingType ? heatingTypeLabels[listing.heatingType] : "-"}</dd>
              </div>
              <div>
                <dt>Stare imobil</dt>
                <dd>{listing.buildingCondition ? buildingConditionLabels[listing.buildingCondition] : "-"}</dd>
              </div>
              <div>
                <dt>Clasa energetica</dt>
                <dd>{listing.energyClass ? energyClassLabels[listing.energyClass] : "-"}</dd>
              </div>
            </dl>
          </section>

          <section className="content-panel">
            <h2>Locatie</h2>
            <ListingMap latitude={listing.latitude} longitude={listing.longitude} title={listing.title} />
          </section>

          <section className="content-panel">
            <h2>In apropiere</h2>
            {nearbyStatus ? <p>{nearbyStatus}</p> : null}
            {!nearbyStatus && visibleNearbyPlaces.length ? (
              <div className="nearby-grid">
                {visibleNearbyPlaces.map((item) => {
                  const Icon = nearbyIcons[item.category] ?? MapPin;

                  return (
                    <article className="nearby-item" key={item.category}>
                      <div className="nearby-icon">
                        <Icon size={18} aria-hidden="true" />
                      </div>
                      <div>
                        <span>{item.label}</span>
                        <strong>{item.place.name}</strong>
                        <p>{formatDistance(item.place.distance)} de proprietate</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </section>
        </div>

        <aside className="details-sidebar">
          {canModerateListing ? (
            <section className="moderation-panel">
              <h2>Moderare</h2>
              <p>Acest anunt asteapta o decizie de publicare.</p>
              <button className="primary-button" type="button" onClick={approveCurrentListing} disabled={isModerating}>
                <CheckCircle2 size={18} aria-hidden="true" />
                Aproba anuntul
              </button>
              <label className="moderation-reason">
                Motiv respingere
                <textarea
                  maxLength={500}
                  minLength={5}
                  rows={4}
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  placeholder="Explica ce trebuie corectat inainte de retrimitere."
                />
              </label>
              <button className="danger-button" type="button" onClick={rejectCurrentListing} disabled={isModerating}>
                <XCircle size={18} aria-hidden="true" />
                Respinge anuntul
              </button>
              {moderationStatus ? <p className="form-success">{moderationStatus}</p> : null}
            </section>
          ) : null}

          {isAdmin && listing.status === "REJECTED" ? (
            <p className="owner-notice">
              {moderationStatus || `Anunt respins. Motiv: ${listing.rejectionReason || "Motiv necompletat."}`}
            </p>
          ) : null}

          {isOwnListing && listing.status === "REJECTED" ? (
            <p className="owner-notice">
              Motiv respingere: {listing.rejectionReason || "Motiv necompletat."}
            </p>
          ) : null}

          {isAdmin && listing.status === "APPROVED" && moderationStatus ? (
            <p className="form-success">{moderationStatus}</p>
          ) : null}

          {isAuthenticated ? (
            <button className="favorite-button" type="button" onClick={toggleFavorite} disabled={isFavoriteLoading}>
              <Heart size={18} fill={isFavorite ? "currentColor" : "none"} aria-hidden="true" />
              {isFavorite ? "Elimina de la favorite" : "Adauga la favorite"}
            </button>
          ) : (
            <Link className="secondary-button sidebar-link" to="/login">
              Autentifica-te pentru favorite
            </Link>
          )}

          <CompareButton listingId={listing.id} />

          <form className="contact-form" onSubmit={submitMessage}>
            <h2>Contacteaza proprietarul</h2>
            {isOwnListing ? (
              <p className="owner-notice">Acesta este anuntul tau. Nu poti trimite mesaj propriului anunt.</p>
            ) : (
              <>
                <div className="sender-profile">
                  <UserCircle size={22} aria-hidden="true" />
                  <div>
                    {isAuthenticated ? (
                      <>
                        <strong>{listing.owner.name}</strong>
                        <span>Proprietarul anuntului</span>
                      </>
                    ) : (
                      <>
                        <strong>{listing.owner.name}</strong>
                        <span>Autentifica-te pentru a trimite mesaj.</span>
                      </>
                    )}
                  </div>
                </div>
                {isAuthenticated ? (
                  <>
                    <label>
                      Mesaj
                      <textarea
                        name="message"
                        value={messageForm.message}
                        onChange={updateMessageField}
                        minLength={10}
                        rows={5}
                        required
                      />
                    </label>
                    {error ? <p className="form-error">{error}</p> : null}
                    {messageStatus ? <p className="form-success">{messageStatus}</p> : null}
                    <button className="primary-button" type="submit" disabled={isMessageSubmitting}>
                      <Mail size={18} aria-hidden="true" />
                      {isMessageSubmitting ? "Se trimite..." : "Trimite mesaj"}
                    </button>
                  </>
                ) : (
                  <Link className="primary-button sidebar-link" to="/login" state={{ from: location }}>
                    Autentifica-te pentru mesaj
                  </Link>
                )}
              </>
            )}
          </form>
        </aside>
      </div>
    </section>
  );
}
