import { Bookmark, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "../api/axiosClient.js";
import { getListings } from "../api/listingsApi.js";
import { createSavedSearch, deleteSavedSearch, getSavedSearches } from "../api/savedSearchesApi.js";
import { ListingCard } from "../components/listings/ListingCard.jsx";
import { MarketplaceMap } from "../components/listings/MarketplaceMap.jsx";
import { Pagination } from "../components/ui/Pagination.jsx";
import { propertyTypeLabels, sortLabels, transactionTypeLabels } from "../constants/listingLabels.js";
import { countyOptions, romanianLocations } from "../constants/romaniaLocations.js";
import { useAuth } from "../context/AuthContext.jsx";

const listingsPerPage = 12;

const initialFilters = {
  county: "",
  city: "",
  propertyType: "",
  transactionType: "",
  minPrice: "",
  maxPrice: "",
  rooms: "",
  sort: "newest"
};

function filtersAreEqual(first, second) {
  return Object.keys(initialFilters).every((key) => first[key] === second[key]);
}

export function MarketplacePage() {
  const { isAuthenticated } = useAuth();
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [listings, setListings] = useState([]);
  const [visibleListingIds, setVisibleListingIds] = useState(null);
  const [savedSearches, setSavedSearches] = useState([]);
  const [error, setError] = useState("");
  const [savedSearchStatus, setSavedSearchStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavedSearchLoading, setIsSavedSearchLoading] = useState(false);

  const query = useMemo(() => {
    return Object.fromEntries(
      Object.entries({ ...appliedFilters, page: 1, limit: 50 }).filter(([, value]) => value !== "")
    );
  }, [appliedFilters]);

  const visibleListings = useMemo(() => {
    if (!visibleListingIds) {
      return listings;
    }

    const visibleIdSet = new Set(visibleListingIds);
    return listings.filter((listing) => visibleIdSet.has(listing.id));
  }, [listings, visibleListingIds]);

  const totalPages = Math.max(1, Math.ceil(visibleListings.length / listingsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pagedListings = visibleListings.slice(
    (currentPage - 1) * listingsPerPage,
    currentPage * listingsPerPage
  );

  const activeFilterChips = useMemo(() => {
    return [
      appliedFilters.county ? { key: "county", label: `Judet: ${appliedFilters.county}` } : null,
      appliedFilters.city ? { key: "city", label: `Oras/comuna: ${appliedFilters.city}` } : null,
      appliedFilters.propertyType
        ? { key: "propertyType", label: `Tip: ${propertyTypeLabels[appliedFilters.propertyType]}` }
        : null,
      appliedFilters.transactionType
        ? { key: "transactionType", label: `Tranzactie: ${transactionTypeLabels[appliedFilters.transactionType]}` }
        : null,
      appliedFilters.minPrice ? { key: "minPrice", label: `Pret min: ${appliedFilters.minPrice}` } : null,
      appliedFilters.maxPrice ? { key: "maxPrice", label: `Pret max: ${appliedFilters.maxPrice}` } : null,
      appliedFilters.rooms ? { key: "rooms", label: `Camere: ${appliedFilters.rooms}` } : null,
      appliedFilters.sort && appliedFilters.sort !== "newest"
        ? { key: "sort", label: `Sortare: ${sortLabels[appliedFilters.sort]}` }
        : null
    ].filter(Boolean);
  }, [appliedFilters]);

  useEffect(() => {
    let isMounted = true;

    async function loadListings() {
      setIsLoading(true);
      setError("");

      try {
          const response = await getListings(query);
          if (isMounted) {
            setListings(response.data);
            setVisibleListingIds(null);
            setPage(1);
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
  }, [query]);

  useEffect(() => {
    let isMounted = true;

    async function loadSavedSearches() {
      if (!isAuthenticated) {
        setSavedSearches([]);
        return;
      }

      setIsSavedSearchLoading(true);

      try {
        const response = await getSavedSearches();
        if (isMounted) {
          setSavedSearches(response.data);
        }
      } catch (apiError) {
        if (isMounted) {
          setError(getApiErrorMessage(apiError));
        }
      } finally {
        if (isMounted) {
          setIsSavedSearchLoading(false);
        }
      }
    }

    loadSavedSearches();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  function applyFilterValues(nextFilters) {
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setPage(1);
  }

  useEffect(() => {
    if (filtersAreEqual(filters, appliedFilters)) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setAppliedFilters(filters);
      setPage(1);
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [appliedFilters, filters]);

  function updateFilter(event) {
    const nextValue = event.target.value;
    const nextFilters = {
      ...filters,
      [event.target.name]: nextValue,
      ...(event.target.name === "county" ? { city: "" } : {})
    };

    setFilters(nextFilters);
  }

  function applyFilters(event) {
    event.preventDefault();
    applyFilterValues(filters);
  }

  function clearFilters() {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setPage(1);
  }

  function removeFilter(filterKey) {
    const nextFilters = {
      ...appliedFilters,
      [filterKey]: initialFilters[filterKey],
      ...(filterKey === "county" ? { city: "" } : {})
    };

    applyFilterValues(nextFilters);
  }

  function updateVisibleListingIds(nextVisibleIds) {
    setVisibleListingIds(nextVisibleIds);
    setPage(1);
  }

  function savedSearchPayload(name) {
    return {
      name,
      county: appliedFilters.county || null,
      city: appliedFilters.city || null,
      propertyType: appliedFilters.propertyType || null,
      transactionType: appliedFilters.transactionType || null,
      minPrice: appliedFilters.minPrice ? Number(appliedFilters.minPrice) : null,
      maxPrice: appliedFilters.maxPrice ? Number(appliedFilters.maxPrice) : null,
      rooms: appliedFilters.rooms ? Number(appliedFilters.rooms) : null,
      sort: appliedFilters.sort || "newest"
    };
  }

  async function saveCurrentSearch() {
    const suggestedName = [
      appliedFilters.county,
      appliedFilters.city,
      propertyTypeLabels[appliedFilters.propertyType],
      transactionTypeLabels[appliedFilters.transactionType]
    ]
      .filter(Boolean)
      .join(" - ");
    const name = window.prompt("Nume pentru cautarea salvata", suggestedName || "Cautare noua")?.trim() ?? "";

    if (name.length < 2) {
      setSavedSearchStatus("");
      setError("Introdu un nume pentru cautarea salvata.");
      return;
    }

    setIsSavedSearchLoading(true);
    setError("");
    setSavedSearchStatus("");

    try {
      const response = await createSavedSearch(savedSearchPayload(name));
      setSavedSearches((current) => [response.data, ...current]);
      setSavedSearchStatus("Cautarea a fost salvata.");
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setIsSavedSearchLoading(false);
    }
  }

  function applySavedSearch(savedSearch) {
    const nextFilters = {
      city: savedSearch.city ?? "",
      county: savedSearch.county ?? "",
      propertyType: savedSearch.propertyType ?? "",
      transactionType: savedSearch.transactionType ?? "",
      minPrice: savedSearch.minPrice ?? "",
      maxPrice: savedSearch.maxPrice ?? "",
      rooms: savedSearch.rooms ?? "",
      sort: savedSearch.sort || "newest"
    };

    applyFilterValues(nextFilters);
    setSavedSearchStatus(`Cautarea "${savedSearch.name}" a fost aplicata.`);
  }

  async function removeSavedSearch(id) {
    setIsSavedSearchLoading(true);
    setError("");
    setSavedSearchStatus("");

    try {
      await deleteSavedSearch(id);
      setSavedSearches((current) => current.filter((savedSearch) => savedSearch.id !== id));
      setSavedSearchStatus("Cautarea salvata a fost stearsa.");
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setIsSavedSearchLoading(false);
    }
  }

  return (
    <section className="marketplace-page">
      <div className="marketplace-toolbar">
        <div>
          <h1>Anunturi imobiliare</h1>
          <p>Exploreaza proprietati aprobate din orasele principale din Romania.</p>
        </div>
      </div>

      <MarketplaceMap listings={listings} onVisibleListingIdsChange={updateVisibleListingIds} />

      <form className="filters-panel" id="listing-filters" onSubmit={applyFilters}>
        <label>
          Judet
          <select name="county" value={filters.county} onChange={updateFilter}>
            <option value="">Toate judetele</option>
            {countyOptions.map((county) => (
              <option key={county} value={county}>
                {county}
              </option>
            ))}
          </select>
        </label>
        <label>
          Oras / comuna
          <select name="city" value={filters.city} onChange={updateFilter} disabled={!filters.county}>
            <option value="">{filters.county ? "Toate localitatile" : "Alege judetul"}</option>
            {(romanianLocations[filters.county] ?? []).map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tip proprietate
          <select name="propertyType" value={filters.propertyType} onChange={updateFilter}>
            <option value="">Toate</option>
            {Object.entries(propertyTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tranzactie
          <select name="transactionType" value={filters.transactionType} onChange={updateFilter}>
            <option value="">Toate</option>
            {Object.entries(transactionTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Pret minim
          <input name="minPrice" type="number" min="0" value={filters.minPrice} onChange={updateFilter} />
        </label>
        <label>
          Pret maxim
          <input name="maxPrice" type="number" min="0" value={filters.maxPrice} onChange={updateFilter} />
        </label>
        <label>
          Camere
          <input name="rooms" type="number" min="1" value={filters.rooms} onChange={updateFilter} />
        </label>
        <label>
          Sortare
          <select name="sort" value={filters.sort} onChange={updateFilter}>
            {Object.entries(sortLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="filter-actions">
          <button className="primary-button" type="submit">
            <Search size={18} aria-hidden="true" />
            Cauta
          </button>
          <button className="secondary-button" type="button" onClick={clearFilters}>
            Reseteaza
          </button>
        </div>
      </form>

      {activeFilterChips.length ? (
        <div className="active-filter-chips" aria-label="Filtre active">
          {activeFilterChips.map((filter) => (
            <button key={filter.key} type="button" onClick={() => removeFilter(filter.key)}>
              {filter.label}
              <span aria-hidden="true">x</span>
            </button>
          ))}
        </div>
      ) : null}

      {isAuthenticated ? (
        <section className="saved-searches-panel" aria-label="Cautari salvate">
          <div className="saved-searches-row">
            <div className="saved-searches-left">
              <span className="saved-searches-label">Cautari salvate</span>
              {isSavedSearchLoading && !savedSearches.length ? (
                <span className="saved-searches-empty">Se incarca...</span>
              ) : null}
              {savedSearches.length ? (
                <div className="saved-search-list">
                  {savedSearches.map((savedSearch) => (
                    <div className="saved-search-chip" key={savedSearch.id}>
                      <button type="button" onClick={() => applySavedSearch(savedSearch)}>
                        {savedSearch.name}
                      </button>
                      <button
                        className="saved-search-delete"
                        type="button"
                        onClick={() => removeSavedSearch(savedSearch.id)}
                        aria-label={`Sterge cautarea ${savedSearch.name}`}
                        disabled={isSavedSearchLoading}
                      >
                        <Trash2 size={13} aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : !isSavedSearchLoading ? (
                <span className="saved-searches-empty">Nu ai cautari salvate.</span>
              ) : null}
            </div>
            <button className="secondary-button compact-button" type="button" onClick={saveCurrentSearch} disabled={isSavedSearchLoading}>
              <Bookmark size={17} aria-hidden="true" />
              Salveaza cautarea
            </button>
          </div>
          {savedSearchStatus ? <p className="form-success">{savedSearchStatus}</p> : null}
        </section>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}

      {isLoading ? <div className="page-status">Se incarca anunturile...</div> : null}

      {!isLoading && !error && listings.length === 0 ? (
        <div className="empty-state">
          <h2>Nu am gasit anunturi</h2>
          <p>Modifica filtrele pentru a vedea mai multe rezultate.</p>
        </div>
      ) : null}

      {!isLoading && listings.length > 0 ? (
        <>
          <div className="results-summary">
            {visibleListings.length} anunturi vizibile pe harta
            {visibleListings.length ? `, pagina ${currentPage} din ${totalPages}` : ""}
          </div>
          {pagedListings.length > 0 ? (
            <>
              <div className="listing-grid">
                {pagedListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
            </>
          ) : (
            <div className="empty-state">
              <h2>Nu exista anunturi in zona vizibila</h2>
              <p>Muta sau mareste harta pentru a vedea anunturile din alta zona.</p>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
