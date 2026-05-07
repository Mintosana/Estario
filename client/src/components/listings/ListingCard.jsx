import { Bath, BedDouble, MapPin, Ruler } from "lucide-react";
import { Link } from "react-router-dom";
import { apiOrigin } from "../../api/axiosClient.js";
import { propertyTypeLabels, transactionTypeLabels } from "../../constants/listingLabels.js";
import { formatArea, formatPrice } from "../../utils/formatters.js";
import { ListingImage } from "./ListingImage.jsx";

export function ListingCard({ listing }) {
  const imageUrl = listing.images?.[0]?.url
    ? `${apiOrigin}${listing.images[0].url}`
    : null;

  return (
    <article className="listing-card">
      <Link to={`/listings/${listing.id}`} className="listing-card-image">
        <ListingImage src={imageUrl} alt={listing.title} />
      </Link>
      <div className="listing-card-body">
        <div className="listing-card-meta">
          <span>{transactionTypeLabels[listing.transactionType]}</span>
          <span>{propertyTypeLabels[listing.propertyType]}</span>
        </div>
        <Link to={`/listings/${listing.id}`}>
          <h2>{listing.title}</h2>
        </Link>
        <p className="listing-location">
          <MapPin size={16} aria-hidden="true" />
          {listing.city}, {listing.county}
        </p>
        <p className="listing-price">{formatPrice(listing.price, listing.currency)}</p>
        <dl className="listing-facts">
          <div>
            <Ruler size={16} aria-hidden="true" />
            <dt>Suprafata</dt>
            <dd>{formatArea(listing.surface)}</dd>
          </div>
          {listing.rooms ? (
            <div>
              <BedDouble size={16} aria-hidden="true" />
              <dt>Camere</dt>
              <dd>{listing.rooms}</dd>
            </div>
          ) : null}
          {listing.bathrooms ? (
            <div>
              <Bath size={16} aria-hidden="true" />
              <dt>Bai</dt>
              <dd>{listing.bathrooms}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </article>
  );
}
