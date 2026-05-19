import { Bookmark, Search, SlidersHorizontal, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "../api/axiosClient.js";
import { getListings, interpretListingSearch } from "../api/listingsApi.js";
import { createSavedSearch, deleteSavedSearch, getSavedSearches } from "../api/savedSearchesApi.js";
import { ListingCard } from "../components/listings/ListingCard.jsx";
import { MarketplaceMap } from "../components/listings/MarketplaceMap.jsx";
import { CityAutocomplete } from "../components/ui/CityAutocomplete.jsx";
import { Pagination } from "../components/ui/Pagination.jsx";
import { currencyOptions } from "../constants/formOptions.js";
import {
  furnishingLabels,
  centralHeatingTypeLabels,
  compartmentalizationLabels,
  heatingTypeLabels,
  parkingLabels,
  propertyTypeLabels,
  sortLabels,
  transactionTypeLabels
} from "../constants/listingLabels.js";
import { countyOptions, romanianLocations } from "../constants/romaniaLocations.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

const listingsPerPage = 12;

const initialFilters = {
  county: "",
  city: "",
  propertyType: "",
  transactionType: "",
  currency: "",
  minPrice: "",
  maxPrice: "",
  rooms: "",
  balcony: "",
  hasAirConditioning: "",
  hasElevator: "",
  petFriendly: "",
  compartmentalization: "",
  parking: "",
  furnished: "",
  heatingType: "",
  centralHeatingType: "",
  sort: "relevance"
};

function filtersAreEqual(first, second) {
  return Object.keys(initialFilters).every((key) => first[key] === second[key]);
}

export function MarketplacePage() {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [listings, setListings] = useState([]);
  const [visibleListingIds, setVisibleListingIds] = useState(null);
  const [savedSearches, setSavedSearches] = useState([]);
  const [naturalSearchText, setNaturalSearchText] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isNaturalSearchLoading, setIsNaturalSearchLoading] = useState(false);
  const [isSavedSearchLoading, setIsSavedSearchLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const query = useMemo(() => {
    return Object.fromEntries(
      Object.entries({ ...appliedFilters, page: 1, limit: 50 }).filter(([, value]) => value !== "")
    );
  }, [appliedFilters]);

  const citySuggestions = useMemo(() => {
    if (filters.county) {
      return romanianLocations[filters.county] ?? [];
    }

    return [...new Set(Object.values(romanianLocations).flat())].sort((first, second) =>
      first.localeCompare(second, "ro")
    );
  }, [filters.county]);

  const visibleListings = useMemo(() => {
    if (!visibleListingIds) {
      return listings;
    }

    const visibleIdSet = new Set(visibleListingIds);
    return listings.filter((listing) => visibleIdSet.has(listing.id));
  }, [listings, visibleListingIds]);

  const sponsoredListings = useMemo(() => {
    return visibleListings.filter((listing) => listing.isSponsored);
  }, [visibleListings]);
  const regularListings = useMemo(() => {
    return visibleListings.filter((listing) => !listing.isSponsored);
  }, [visibleListings]);
  const totalPages = Math.max(1, Math.ceil(regularListings.length / listingsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pagedListings = regularListings.slice(
    (currentPage - 1) * listingsPerPage,
    currentPage * listingsPerPage
  );

  const activeFilterChips = useMemo(() => {
    return [
      appliedFilters.county ? { key: "county", label: `Judet: ${appliedFilters.county}` } : null,
      appliedFilters.city ? { key: "city", label: `Oras: ${appliedFilters.city}` } : null,
      appliedFilters.propertyType
        ? { key: "propertyType", label: `Tip: ${propertyTypeLabels[appliedFilters.propertyType]}` }
        : null,
      appliedFilters.transactionType
        ? { key: "transactionType", label: `Tip anunt: ${transactionTypeLabels[appliedFilters.transactionType]}` }
        : null,
      appliedFilters.currency ? { key: "currency", label: `Moneda: ${appliedFilters.currency}` } : null,
      appliedFilters.minPrice
        ? { key: "minPrice", label: `Pret min: ${appliedFilters.minPrice}${appliedFilters.currency ? ` ${appliedFilters.currency}` : ""}` }
        : null,
      appliedFilters.maxPrice
        ? { key: "maxPrice", label: `Pret max: ${appliedFilters.maxPrice}${appliedFilters.currency ? ` ${appliedFilters.currency}` : ""}` }
        : null,
      appliedFilters.rooms ? { key: "rooms", label: `Camere: ${appliedFilters.rooms}` } : null,
      appliedFilters.compartmentalization
        ? { key: "compartmentalization", label: `Compartimentare: ${compartmentalizationLabels[appliedFilters.compartmentalization]}` }
        : null,
      appliedFilters.furnished ? { key: "furnished", label: `Mobilare: ${furnishingLabels[appliedFilters.furnished]}` } : null,
      appliedFilters.parking ? { key: "parking", label: `Parcare: ${parkingLabels[appliedFilters.parking]}` } : null,
      appliedFilters.balcony ? { key: "balcony", label: `Balcon: ${appliedFilters.balcony === "true" ? "Da" : "Nu"}` } : null,
      appliedFilters.hasAirConditioning
        ? { key: "hasAirConditioning", label: `AC: ${appliedFilters.hasAirConditioning === "true" ? "Da" : "Nu"}` }
        : null,
      appliedFilters.hasElevator
        ? { key: "hasElevator", label: `Lift: ${appliedFilters.hasElevator === "true" ? "Da" : "Nu"}` }
        : null,
      appliedFilters.petFriendly
        ? { key: "petFriendly", label: `Pet friendly: ${appliedFilters.petFriendly === "true" ? "Da" : "Nu"}` }
        : null,
      appliedFilters.heatingType ? { key: "heatingType", label: `Incalzire: ${heatingTypeLabels[appliedFilters.heatingType]}` } : null,
      appliedFilters.centralHeatingType
        ? { key: "centralHeatingType", label: `Tip centrala: ${centralHeatingTypeLabels[appliedFilters.centralHeatingType]}` }
        : null,
      appliedFilters.sort && appliedFilters.sort !== "relevance"
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
    if (error) {
      showToast({ message: error, type: "error" });
    }
  }, [error, showToast]);

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

    if (event.target.name === "heatingType" && nextValue !== "CENTRAL") {
      nextFilters.centralHeatingType = "";
    }

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
      currency: appliedFilters.currency || null,
      minPrice: appliedFilters.minPrice ? Number(appliedFilters.minPrice) : null,
      maxPrice: appliedFilters.maxPrice ? Number(appliedFilters.maxPrice) : null,
      rooms: appliedFilters.rooms ? Number(appliedFilters.rooms) : null,
      balcony: appliedFilters.balcony === "" ? null : appliedFilters.balcony === "true",
      hasAirConditioning: appliedFilters.hasAirConditioning === "" ? null : appliedFilters.hasAirConditioning === "true",
      hasElevator: appliedFilters.hasElevator === "" ? null : appliedFilters.hasElevator === "true",
      petFriendly: appliedFilters.petFriendly === "" ? null : appliedFilters.petFriendly === "true",
      compartmentalization: appliedFilters.compartmentalization || null,
      parking: appliedFilters.parking || null,
      furnished: appliedFilters.furnished || null,
      heatingType: appliedFilters.heatingType || null,
      centralHeatingType: appliedFilters.centralHeatingType || null,
      sort: appliedFilters.sort || "relevance"
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
      showToast({ message: "Introdu un nume pentru cautarea salvata.", type: "warning" });
      return;
    }

    setIsSavedSearchLoading(true);
    setError("");

    try {
      const response = await createSavedSearch(savedSearchPayload(name));
      setSavedSearches((current) => [response.data, ...current]);
      showToast({ message: "Cautarea a fost salvata.", type: "success" });
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
      currency: savedSearch.currency ?? "",
      minPrice: savedSearch.minPrice ?? "",
      maxPrice: savedSearch.maxPrice ?? "",
      rooms: savedSearch.rooms ?? "",
      balcony: savedSearch.balcony === null || savedSearch.balcony === undefined ? "" : String(savedSearch.balcony),
      hasAirConditioning:
        savedSearch.hasAirConditioning === null || savedSearch.hasAirConditioning === undefined
          ? ""
          : String(savedSearch.hasAirConditioning),
      hasElevator:
        savedSearch.hasElevator === null || savedSearch.hasElevator === undefined ? "" : String(savedSearch.hasElevator),
      petFriendly:
        savedSearch.petFriendly === null || savedSearch.petFriendly === undefined ? "" : String(savedSearch.petFriendly),
      compartmentalization: savedSearch.compartmentalization ?? "",
      parking: savedSearch.parking ?? "",
      furnished: savedSearch.furnished ?? "",
      heatingType: savedSearch.heatingType ?? "",
      centralHeatingType: savedSearch.centralHeatingType ?? "",
      sort: savedSearch.sort || "relevance"
    };

    applyFilterValues(nextFilters);
    showToast({ message: `Cautarea "${savedSearch.name}" a fost aplicata.`, type: "info" });
  }

  async function removeSavedSearch(id) {
    setIsSavedSearchLoading(true);
    setError("");

    try {
      await deleteSavedSearch(id);
      setSavedSearches((current) => current.filter((savedSearch) => savedSearch.id !== id));
      showToast({ message: "Cautarea salvata a fost stearsa.", type: "success" });
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setIsSavedSearchLoading(false);
    }
  }

  async function applyNaturalSearch(event) {
    event.preventDefault();

    const queryText = naturalSearchText.trim();
    if (queryText.length < 3) {
      showToast({ message: "Scrie cateva detalii despre proprietatea cautata.", type: "warning" });
      return;
    }

    setIsNaturalSearchLoading(true);
    setError("");

    try {
      const response = await interpretListingSearch(queryText);
      const interpreted = response.data;
      const nextFilters = {
        ...initialFilters,
        city: interpreted.filters.city ?? "",
        county: interpreted.filters.county ?? "",
        maxPrice: interpreted.filters.maxPrice ?? "",
        minPrice: interpreted.filters.minPrice ?? "",
        currency: interpreted.filters.currency ?? "",
        propertyType: interpreted.filters.propertyType ?? "",
        rooms: interpreted.filters.rooms ?? "",
        balcony: interpreted.filters.balcony === null || interpreted.filters.balcony === undefined
          ? ""
          : String(interpreted.filters.balcony),
        hasAirConditioning:
          interpreted.filters.hasAirConditioning === null || interpreted.filters.hasAirConditioning === undefined
            ? ""
            : String(interpreted.filters.hasAirConditioning),
        hasElevator:
          interpreted.filters.hasElevator === null || interpreted.filters.hasElevator === undefined
            ? ""
            : String(interpreted.filters.hasElevator),
        petFriendly:
          interpreted.filters.petFriendly === null || interpreted.filters.petFriendly === undefined
            ? ""
            : String(interpreted.filters.petFriendly),
        compartmentalization: interpreted.filters.compartmentalization ?? "",
        parking: interpreted.filters.parking ?? "",
        furnished: interpreted.filters.furnished ?? "",
        heatingType: interpreted.filters.heatingType ?? "",
        centralHeatingType: interpreted.filters.centralHeatingType ?? "",
        sort: interpreted.filters.sort || "relevance",
        transactionType: interpreted.filters.transactionType ?? ""
      };

      applyFilterValues(nextFilters);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setIsNaturalSearchLoading(false);
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

      <form className="natural-search-panel" onSubmit={applyNaturalSearch}>
        <label>
          Cauta cu AI
          <textarea
            value={naturalSearchText}
            onChange={(event) => setNaturalSearchText(event.target.value)}
            rows={2}
            placeholder="Ex: Vreau un apartament de inchiriat in Bucuresti, 2 camere, sub 700 EUR, sortat dupa pret mic."
          />
        </label>
        <button className="primary-button" type="submit" disabled={isNaturalSearchLoading}>
          <Sparkles size={18} aria-hidden="true" />
          {isNaturalSearchLoading ? "Interpretez..." : "Aplica filtre"}
        </button>
      </form>

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
          Oras
          <CityAutocomplete
            name="city"
            value={filters.city}
            onChange={updateFilter}
            options={citySuggestions}
            placeholder={filters.county ? "Tasteaza orasul" : "Tasteaza orasul"}
          />
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
          Tip anunt
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
          Moneda
          <select name="currency" value={filters.currency} onChange={updateFilter}>
            <option value="">Toate</option>
            {currencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Camere
          <input name="rooms" type="number" min="1" value={filters.rooms} onChange={updateFilter} />
        </label>

        <button className="secondary-button advanced-filter-toggle" type="button" onClick={() => setShowAdvancedFilters((current) => !current)}>
          <SlidersHorizontal size={17} aria-hidden="true" />
          {showAdvancedFilters ? "Ascunde filtre avansate" : "Filtre avansate"}
        </button>

        {showAdvancedFilters ? (
          <div className="advanced-filters">
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
            <label>
              Compartimentare
              <select name="compartmentalization" value={filters.compartmentalization} onChange={updateFilter}>
                <option value="">Toate</option>
                {Object.entries(compartmentalizationLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Mobilare
              <select name="furnished" value={filters.furnished} onChange={updateFilter}>
                <option value="">Toate</option>
                {Object.entries(furnishingLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Parcare
              <select name="parking" value={filters.parking} onChange={updateFilter}>
                <option value="">Toate</option>
                {Object.entries(parkingLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Balcon
              <select name="balcony" value={filters.balcony} onChange={updateFilter}>
                <option value="">Toate</option>
                <option value="true">Da</option>
                <option value="false">Nu</option>
              </select>
            </label>
            <label>
              Aer conditionat
              <select name="hasAirConditioning" value={filters.hasAirConditioning} onChange={updateFilter}>
                <option value="">Toate</option>
                <option value="true">Da</option>
                <option value="false">Nu</option>
              </select>
            </label>
            <label>
              Lift
              <select name="hasElevator" value={filters.hasElevator} onChange={updateFilter}>
                <option value="">Toate</option>
                <option value="true">Da</option>
                <option value="false">Nu</option>
              </select>
            </label>
            <label>
              Pet friendly
              <select name="petFriendly" value={filters.petFriendly} onChange={updateFilter}>
                <option value="">Toate</option>
                <option value="true">Da</option>
                <option value="false">Nu</option>
              </select>
            </label>
            <label>
              Tip incalzire
              <select name="heatingType" value={filters.heatingType} onChange={updateFilter}>
                <option value="">Toate</option>
                {Object.entries(heatingTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {filters.heatingType === "CENTRAL" ? (
          <label>
            Tip centrala
            <select name="centralHeatingType" value={filters.centralHeatingType} onChange={updateFilter}>
              <option value="">Toate</option>
              {Object.entries(centralHeatingTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
            ) : null}
          </div>
        ) : null}
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
        </section>
      ) : null}

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
          {sponsoredListings.length > 0 ? (
            <section className="sponsored-listings-section" aria-label="Anunturi promovate">
              <div className="sponsored-listings-heading">
                <span>Promovat</span>
                <h2>Anunturi promovate</h2>
              </div>
              <div className="sponsored-listings-row">
                {sponsoredListings.slice(0, 4).map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </section>
          ) : null}

          {pagedListings.length > 0 ? (
            <>
              <div className="listing-grid">
                {pagedListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
            </>
          ) : sponsoredListings.length === 0 ? (
            <div className="empty-state">
              <h2>Nu exista anunturi in zona vizibila</h2>
              <p>Muta sau mareste harta pentru a vedea anunturile din alta zona.</p>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
