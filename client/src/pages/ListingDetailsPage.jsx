import {
  Bus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Heart,
  Hospital,
  Mail,
  MapPin,
  School,
  ShoppingBag,
  Train,
  UserCircle,
  X,
  XCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { approveListing, rejectListing } from "../api/adminApi.js";
import { getApiErrorMessage, apiOrigin, resolveApiAssetUrl } from "../api/axiosClient.js";
import { addFavorite, getFavorites, removeFavorite } from "../api/favoritesApi.js";
import { getListing } from "../api/listingsApi.js";
import { createMessage } from "../api/messagesApi.js";
import { getNearbyPlaces } from "../api/nearbyPlacesApi.js";
import { CompareButton } from "../components/listings/CompareButton.jsx";
import { ListingMap } from "../components/listings/ListingMap.jsx";
import { ListingImage } from "../components/listings/ListingImage.jsx";
import {
  buildingConditionLabels,
  centralHeatingTypeLabels,
  compartmentalizationLabels,
  energyClassLabels,
  furnishingLabels,
  heatingTypeLabels,
  parkingLabels,
  propertyTypeLabels,
  transactionTypeLabels
} from "../constants/listingLabels.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { formatArea, formatDistance, formatPrice, formatPricePerSquareMeter } from "../utils/formatters.js";
import { formatFloor } from "../utils/listingDisplay.js";

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
  const { showToast } = useToast();
  const [listing, setListing] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [messageForm, setMessageForm] = useState(initialMessage);
  const [error, setError] = useState("");
  const [moderationStatus, setModerationStatus] = useState("");
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [nearbyStatus, setNearbyStatus] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModerating, setIsModerating] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isMessageSubmitting, setIsMessageSubmitting] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);

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
    if (error && listing) {
      showToast({ message: error, type: "error" });
    }
  }, [error, listing, showToast]);

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
    setError("");

    if (!isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }

    setIsMessageSubmitting(true);

    try {
      await createMessage(id, messageForm);
      showToast({ message: "Mesajul a fost trimis catre proprietar.", type: "success" });
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
      showToast({ message: "Anuntul a fost aprobat si este acum public.", type: "success" });
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
      showToast({
        message: "Anuntul a fost respins. Proprietarul il poate edita si retrimite spre aprobare.",
        type: "success"
      });
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setIsModerating(false);
    }
  }

  const selectedImageUrl = selectedImage ? `${apiOrigin}${selectedImage}` : "";
  const selectedImageIndex = Math.max(
    0,
    images.findIndex((image) => image.url === selectedImage)
  );
  const lightboxImage = lightboxImageIndex !== null ? images[lightboxImageIndex] : null;
  const lightboxImageUrl = lightboxImage ? `${apiOrigin}${lightboxImage.url}` : "";

  function openLightbox(index = selectedImageIndex) {
    if (!images.length) {
      return;
    }

    setLightboxImageIndex(index >= 0 ? index : 0);
    setLightboxZoom(1);
  }

  function closeLightbox() {
    setLightboxImageIndex(null);
    setLightboxZoom(1);
  }

  function showPreviousLightboxImage() {
    setLightboxImageIndex((current) => {
      if (current === null || !images.length) {
        return current;
      }

      return current === 0 ? images.length - 1 : current - 1;
    });
    setLightboxZoom(1);
  }

  function showNextLightboxImage() {
    setLightboxImageIndex((current) => {
      if (current === null || !images.length) {
        return current;
      }

      return current === images.length - 1 ? 0 : current + 1;
    });
    setLightboxZoom(1);
  }

  function zoomLightboxImage(delta) {
    setLightboxZoom((current) => Math.min(3, Math.max(1, Number((current + delta).toFixed(1)))));
  }

  useEffect(() => {
    if (lightboxImageIndex === null) {
      return undefined;
    }

    function handleLightboxKeydown(event) {
      if (event.key === "Escape") {
        closeLightbox();
      }

      if (event.key === "ArrowLeft") {
        showPreviousLightboxImage();
      }

      if (event.key === "ArrowRight") {
        showNextLightboxImage();
      }
    }

    document.addEventListener("keydown", handleLightboxKeydown);

    return () => {
      document.removeEventListener("keydown", handleLightboxKeydown);
    };
  }, [lightboxImageIndex, images.length]);

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

  return (
    <section className="details-page">
      <Link className="back-link" to="/">
        Inapoi la anunturi
      </Link>

      <div className="details-layout">
        <div className="details-main">
          <div className="gallery-panel">
            <button className="gallery-main" type="button" onClick={() => openLightbox()} aria-label="Mareste fotografia">
              <ListingImage src={selectedImageUrl} alt={listing.title} />
            </button>
            {images.length > 1 ? (
              <div className="gallery-thumbnails">
                {images.map((image, index) => (
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

          {lightboxImage ? (
            <div className="image-lightbox" role="dialog" aria-modal="true" aria-label="Fotografie anunt">
              <button className="image-lightbox-backdrop" type="button" onClick={closeLightbox} aria-label="Inchide fotografia" />
              <button className="image-lightbox-close" type="button" onClick={closeLightbox} aria-label="Inchide fotografia">
                <X size={24} aria-hidden="true" />
              </button>
              <div className="image-lightbox-content">
                {images.length > 1 ? (
                  <button
                    className="image-lightbox-arrow image-lightbox-arrow-left"
                    type="button"
                    onClick={showPreviousLightboxImage}
                    aria-label="Fotografia anterioara"
                  >
                    <ChevronLeft size={32} aria-hidden="true" />
                  </button>
                ) : null}
                <div className="image-lightbox-scroll">
                  <img src={lightboxImageUrl} alt={listing.title} style={{ transform: `scale(${lightboxZoom})` }} />
                </div>
                {images.length > 1 ? (
                  <button
                    className="image-lightbox-arrow image-lightbox-arrow-right"
                    type="button"
                    onClick={showNextLightboxImage}
                    aria-label="Fotografia urmatoare"
                  >
                    <ChevronRight size={32} aria-hidden="true" />
                  </button>
                ) : null}
                {images.length > 1 ? (
                  <span className="image-lightbox-count">
                    {lightboxImageIndex + 1} / {images.length}
                  </span>
                ) : null}
                <div className="image-lightbox-zoom">
                  <button type="button" onClick={() => zoomLightboxImage(-0.25)} disabled={lightboxZoom <= 1}>
                    -
                  </button>
                  <span>{Math.round(lightboxZoom * 100)}%</span>
                  <button type="button" onClick={() => zoomLightboxImage(0.25)} disabled={lightboxZoom >= 3}>
                    +
                  </button>
                </div>
              </div>
            </div>
          ) : null}

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
                <dd>{formatFloor(listing.floor, listing.totalFloors)}</dd>
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
                <dt>Compartimentare</dt>
                <dd>{listing.compartmentalization ? compartmentalizationLabels[listing.compartmentalization] : "-"}</dd>
              </div>
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
                <dt>Aer conditionat</dt>
                <dd>
                  {listing.hasAirConditioning === null || listing.hasAirConditioning === undefined
                    ? "-"
                    : listing.hasAirConditioning
                      ? "Da"
                      : "Nu"}
                </dd>
              </div>
              <div>
                <dt>Lift</dt>
                <dd>{listing.hasElevator === null || listing.hasElevator === undefined ? "-" : listing.hasElevator ? "Da" : "Nu"}</dd>
              </div>
              <div>
                <dt>Pet friendly</dt>
                <dd>{listing.petFriendly === null || listing.petFriendly === undefined ? "-" : listing.petFriendly ? "Da" : "Nu"}</dd>
              </div>
              <div>
                <dt>Tip incalzire</dt>
                <dd>{listing.heatingType ? heatingTypeLabels[listing.heatingType] : "-"}</dd>
              </div>
              {listing.heatingType === "CENTRAL" ? (
                <div>
                  <dt>Tip centrala</dt>
                  <dd>{listing.centralHeatingType ? centralHeatingTypeLabels[listing.centralHeatingType] : "-"}</dd>
                </div>
              ) : null}
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
                <Link className="sender-profile" to={`/owners/${listing.owner.id}`}>
                  <div className="sender-avatar">
                    {listing.owner.avatarUrl ? (
                      <img src={resolveApiAssetUrl(listing.owner.avatarUrl)} alt="" />
                    ) : (
                      <UserCircle size={26} aria-hidden="true" />
                    )}
                  </div>
                  <div className="sender-profile-content">
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
                    {listing.owner.bio ? <p>{listing.owner.bio}</p> : null}
                    {listing.owner.phone ? <small>{listing.owner.phone}</small> : null}
                  </div>
                </Link>
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
