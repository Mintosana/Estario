import { ArrowLeft, Eye, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApiErrorMessage, resolveApiAssetUrl } from "../api/axiosClient.js";
import { getListing } from "../api/listingsApi.js";
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
import { useCompare } from "../context/CompareContext.jsx";
import { formatArea, formatPrice, formatPricePerSquareMeter } from "../utils/formatters.js";

function valueOrDash(value) {
  return value ?? "-";
}

function booleanLabel(value) {
  if (value === null || value === undefined) {
    return "-";
  }

  return value ? "Da" : "Nu";
}

function comparisonRows(listing) {
  return [
    ["Pret", formatPrice(listing.price, listing.currency)],
    ["Pret/mp", formatPricePerSquareMeter(listing.price, listing.surface, listing.currency)],
    ["Suprafata", formatArea(listing.surface)],
    ["Camere", valueOrDash(listing.rooms)],
    ["Bai", valueOrDash(listing.bathrooms)],
    ["Etaj", valueOrDash(listing.floor)],
    ["An constructie", valueOrDash(listing.yearBuilt)],
    ["Localizare", `${listing.city}, ${listing.county}`],
    ["Tip proprietate", propertyTypeLabels[listing.propertyType]],
    ["Tip anunt", transactionTypeLabels[listing.transactionType]],
    ["Mobilare", listing.furnished ? furnishingLabels[listing.furnished] : "-"],
    ["Parcare", listing.parking ? parkingLabels[listing.parking] : "-"],
    ["Balcon", booleanLabel(listing.balcony)],
    ["Centrala proprie", booleanLabel(listing.hasOwnCentralHeating)],
    ["Tip incalzire", listing.heatingType ? heatingTypeLabels[listing.heatingType] : "-"],
    ["Stare imobil", listing.buildingCondition ? buildingConditionLabels[listing.buildingCondition] : "-"],
    ["Clasa energetica", listing.energyClass ? energyClassLabels[listing.energyClass] : "-"]
  ];
}

export function ComparePage() {
  const navigate = useNavigate();
  const { clearCompare, removeListing, selectedIds } = useCompare();
  const [listings, setListings] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(selectedIds.length));

  useEffect(() => {
    let isMounted = true;

    async function loadListings() {
      if (!selectedIds.length) {
        setListings([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const results = await Promise.allSettled(selectedIds.map((id) => getListing(id)));
        const loadedListings = results
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value.data);

        if (isMounted) {
          setListings(loadedListings);

          if (loadedListings.length !== selectedIds.length) {
            setError("Unele anunturi selectate nu mai sunt disponibile pentru comparare.");
          }
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

    loadListings();

    return () => {
      isMounted = false;
    };
  }, [selectedIds]);

  const rowLabels = useMemo(() => comparisonRows(listings[0] ?? {}).map(([label]) => label), [listings]);

  function discardComparison() {
    clearCompare();
    navigate("/");
  }

  return (
    <section className="compare-page">
      <Link className="back-link" to="/">
        <ArrowLeft size={16} aria-hidden="true" />
        Inapoi la anunturi
      </Link>

      <div className="dashboard-header">
        <div>
          <h1>Compara anunturi</h1>
        </div>
        {selectedIds.length ? (
          <button className="secondary-button" type="button" onClick={discardComparison}>
            Renunta la comparare
          </button>
        ) : null}
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {isLoading ? <div className="page-status">Se incarca anunturile pentru comparare...</div> : null}

      {!isLoading && !selectedIds.length ? (
        <div className="empty-state">
          <h2>Nu ai selectat anunturi</h2>
          <p>Foloseste butonul Compara de pe cardurile anunturilor sau din pagina de detalii.</p>
        </div>
      ) : null}

      {!isLoading && selectedIds.length === 1 ? (
        <div className="empty-state">
          <h2>Selecteaza inca un anunt</h2>
          <p>Compararea este utila de la minimum doua proprietati selectate.</p>
        </div>
      ) : null}

      {!isLoading && listings.length >= 2 ? (
        <div className="compare-table-wrap">
          <div
            className="compare-table"
            style={{ gridTemplateColumns: `180px repeat(${listings.length}, minmax(190px, 1fr))` }}
          >
            <div className="compare-cell compare-label compare-sticky">Anunt</div>
            {listings.map((listing) => (
              <article className="compare-listing-head" key={listing.id}>
                <Link className="compare-image" to={`/listings/${listing.id}`}>
                  <ListingImage src={resolveApiAssetUrl(listing.images?.[0]?.url)} alt={listing.title} />
                </Link>
                <h2>{listing.title}</h2>
                <div className="compare-head-actions">
                  <Link className="secondary-button compact-button" to={`/listings/${listing.id}`}>
                    Vezi
                    <Eye size={15} aria-hidden="true" />
                  </Link>
                  <button className="danger-button compact-button" type="button" onClick={() => removeListing(listing.id)}>
                    <Trash2 size={14} aria-hidden="true" />
                    Scoate
                  </button>
                </div>
              </article>
            ))}

            {rowLabels.map((label, rowIndex) => (
              <div className="compare-row-fragment" key={label}>
                <div className="compare-cell compare-label">{label}</div>
                {listings.map((listing) => (
                  <div className="compare-cell" key={`${listing.id}-${label}`}>
                    {comparisonRows(listing)[rowIndex][1]}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
