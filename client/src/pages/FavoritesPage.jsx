import { HeartOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../api/axiosClient.js";
import { getFavorites, removeFavorite } from "../api/favoritesApi.js";
import { ListingCard } from "../components/listings/ListingCard.jsx";

export function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState("");

  async function loadFavorites() {
    setIsLoading(true);
    setError("");

    try {
      const response = await getFavorites();
      setFavorites(response.data);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadFavorites();
  }, []);

  async function removeFromFavorites(listingId) {
    setRemovingId(listingId);
    setError("");
    setNotice("");

    try {
      await removeFavorite(listingId);
      setFavorites((current) => current.filter((listing) => listing.id !== listingId));
      setNotice("Anuntul a fost eliminat din favorite.");
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setRemovingId("");
    }
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Favorite</h1>
          <p>Anunturile aprobate pe care le-ai salvat pentru comparare rapida.</p>
        </div>
        <Link className="secondary-button" to="/">
          Inapoi la anunturi
        </Link>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {notice ? <p className="form-success">{notice}</p> : null}
      {isLoading ? <div className="page-status">Se incarca favoritele...</div> : null}

      {!isLoading && favorites.length === 0 ? (
        <div className="empty-state">
          <h2>Nu ai anunturi favorite</h2>
          <p>Deschide un anunt aprobat si foloseste butonul de favorite pentru a-l salva aici.</p>
        </div>
      ) : null}

      {!isLoading && favorites.length > 0 ? (
        <div className="favorite-grid">
          {favorites.map((listing) => (
            <div className="favorite-item" key={listing.id}>
              <ListingCard listing={listing} />
              <button
                className="danger-button"
                type="button"
                disabled={removingId === listing.id}
                onClick={() => removeFromFavorites(listing.id)}
              >
                <HeartOff size={16} aria-hidden="true" />
                {removingId === listing.id ? "Se elimina..." : "Elimina din favorite"}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
