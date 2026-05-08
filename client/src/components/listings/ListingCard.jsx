import { Bath, BedDouble, MapPin, Ruler } from "lucide-react";
import { Link } from "react-router-dom";
import { apiOrigin } from "../../api/axiosClient.js";
import {
  furnishingLabels,
  parkingLabels,
  propertyTypeLabels,
  transactionTypeLabels
} from "../../constants/listingLabels.js";
import { formatArea, formatPrice, formatPricePerSquareMeter } from "../../utils/formatters.js";
import { CompareButton } from "./CompareButton.jsx";
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
        <div>
          <p className="listing-price">{formatPrice(listing.price, listing.currency)}</p>
          <p className="listing-price-sqm">{formatPricePerSquareMeter(listing.price, listing.surface, listing.currency)}</p>
        </div>
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
        <div className="listing-attribute-chips">
          {listing.furnished ? <span>{furnishingLabels[listing.furnished]}</span> : null}
          {listing.parking && listing.parking !== "NONE" ? <span>{parkingLabels[listing.parking]}</span> : null}
          {listing.balcony ? <span>Balcon</span> : null}
          {listing.hasOwnCentralHeating ? <span>Centrala proprie</span> : null}
        </div>
        <CompareButton listingId={listing.id} variant="compact" />
      </div>
    </article>
  );
}
