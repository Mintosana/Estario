import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { apiOrigin } from "../../api/axiosClient.js";
import { getPointsOfInterest } from "../../api/pointsOfInterestApi.js";
import { propertyTypeLabels, transactionTypeLabels } from "../../constants/listingLabels.js";
import { formatArea, formatPrice, formatPricePerSquareMeter } from "../../utils/formatters.js";

const romaniaCenter = [45.9443, 24.9668];
const defaultZoom = 6;
const clusterDistance = 46;
const singleListingZoom = 13;
const poiMinZoom = 15;
const poiLoadDelayMs = 350;

const poiCategories = {
  metro: {
    color: "#2563eb",
    label: "Metrou",
    marker: "M",
    markerClass: "poi-marker-metro"
  },
  bus: {
    color: "#ea580c",
    label: "STB autobuz",
    marker: "bus",
    markerClass: "poi-marker-transit"
  },
  trolley: {
    color: "#0891b2",
    label: "STB troleibuz",
    marker: "trolley",
    markerClass: "poi-marker-transit"
  },
  tram: {
    color: "#9333ea",
    label: "STB tramvai",
    marker: "TR",
    markerClass: "poi-marker-transit"
  },
  healthcare: {
    color: "#dc2626",
    label: "Spitale",
    marker: "H"
  },
  education: {
    color: "#7c3aed",
    label: "Scoli",
    marker: "S"
  },
  groceries: {
    color: "#16a34a",
    label: "Magazine",
    marker: "bag",
    markerClass: "poi-marker-shop"
  }
};

const initialPoiCategories = {
  metro: true,
  bus: true,
  trolley: true,
  tram: true,
  healthcare: true,
  education: true,
  groceries: true
};

function isValidCoordinate(listing) {
  return Number.isFinite(listing.latitude) && Number.isFinite(listing.longitude);
}

function listingLatLng(listing) {
  return L.latLng(listing.latitude, listing.longitude);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resolveAssetUrl(url) {
  if (!url) {
    return "";
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${apiOrigin}${url}`;
}

function clusterListings(map, listings) {
  const clusters = [];

  listings.filter(isValidCoordinate).forEach((listing) => {
    const point = map.latLngToLayerPoint(listingLatLng(listing));
    const nearbyCluster = clusters.find((cluster) => point.distanceTo(cluster.point) <= clusterDistance);

    if (nearbyCluster) {
      nearbyCluster.listings.push(listing);
      const count = nearbyCluster.listings.length;
      nearbyCluster.point = L.point(
        (nearbyCluster.point.x * (count - 1) + point.x) / count,
        (nearbyCluster.point.y * (count - 1) + point.y) / count
      );
      nearbyCluster.latLng = map.layerPointToLatLng(nearbyCluster.point);
      return;
    }

    clusters.push({
      latLng: listingLatLng(listing),
      listings: [listing],
      point
    });
  });

  return clusters;
}

function bindListingPopup(marker, listing) {
  const thumbnailUrl = resolveAssetUrl(listing.images?.[0]?.url);
  const thumbnailHtml = thumbnailUrl
    ? `<img class="map-popup-image" src="${escapeHtml(thumbnailUrl)}" alt="${escapeHtml(listing.title)}">`
    : `<div class="map-popup-image map-popup-image-empty">Fara imagine</div>`;

  marker.bindPopup(
    `
      <div class="map-popup">
        ${thumbnailHtml}
        <strong>${escapeHtml(listing.title)}</strong>
        <span>${escapeHtml(transactionTypeLabels[listing.transactionType])} - ${escapeHtml(propertyTypeLabels[listing.propertyType])}</span>
        <span>${escapeHtml(listing.city)}, ${escapeHtml(listing.county)} - ${escapeHtml(formatArea(listing.surface))}</span>
        <b>${escapeHtml(formatPrice(listing.price, listing.currency))}</b>
        <span>${escapeHtml(formatPricePerSquareMeter(listing.price, listing.surface, listing.currency))}</span>
        <a href="/listings/${escapeHtml(listing.id)}">Vezi anuntul</a>
      </div>
    `,
    {
      closeButton: true,
      maxWidth: 260,
      minWidth: 220
    }
  );
}

function poiCacheKey(bounds, category) {
  const roundedBounds = [
    bounds.getSouth().toFixed(3),
    bounds.getWest().toFixed(3),
    bounds.getNorth().toFixed(3),
    bounds.getEast().toFixed(3)
  ].join(",");

  return `${category}:${roundedBounds}`;
}

function iconHtml(category) {
  if (category.marker === "bus") {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12c1.7 0 3 1.3 3 3v9c0 1.1-.9 2-2 2v2.2c0 .4-.3.8-.8.8h-1.4c-.4 0-.8-.3-.8-.8V17H8v2.2c0 .4-.3.8-.8.8H5.8c-.4 0-.8-.3-.8-.8V17c-1.1 0-2-.9-2-2V6c0-1.7 1.3-3 3-3Zm0 2c-.6 0-1 .4-1 1v4h14V6c0-.6-.4-1-1-1H6Zm1 10.5A1.5 1.5 0 1 0 7 12a1.5 1.5 0 0 0 0 3Zm10 0A1.5 1.5 0 1 0 17 12a1.5 1.5 0 0 0 0 3Z"/></svg>';
  }

  if (category.marker === "trolley") {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.4 2.2 10 1l3 4h5c1.7 0 3 1.3 3 3v7c0 1.1-.9 2-2 2v2.2c0 .4-.3.8-.8.8h-1.4c-.4 0-.8-.3-.8-.8V17H8v2.2c0 .4-.3.8-.8.8H5.8c-.4 0-.8-.3-.8-.8V17c-1.1 0-2-.9-2-2V8c0-1.7 1.3-3 3-3h4.5L8.4 2.2ZM6 7c-.6 0-1 .4-1 1v3h14V8c0-.6-.4-1-1-1H6Zm1 8.5A1.5 1.5 0 1 0 7 12a1.5 1.5 0 0 0 0 3Zm10 0A1.5 1.5 0 1 0 17 12a1.5 1.5 0 0 0 0 3Z"/></svg>';
  }

  if (category.marker === "bag") {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8V6a5 5 0 0 1 10 0v2h2l1 13H4L5 8h2Zm2 0h6V6a3 3 0 0 0-6 0v2Z"/></svg>';
  }

  return escapeHtml(category.marker);
}

function bindPoiPopup(marker, poi) {
  marker.bindPopup(
    `
      <div class="poi-popup">
        <strong>${escapeHtml(poi.name)}</strong>
        <span>${escapeHtml(poiCategories[poi.category].label)}</span>
      </div>
    `,
    {
      closeButton: true,
      maxWidth: 220
    }
  );
}

export function MarketplaceMap({ listings, onVisibleListingIdsChange }) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const poiLayerRef = useRef(null);
  const listingsRef = useRef(listings);
  const callbackRef = useRef(onVisibleListingIdsChange);
  const fittedListingsKeyRef = useRef("");
  const poiCacheRef = useRef(new Map());
  const poiLoadTimeoutRef = useRef(null);
  const loadedPoisRef = useRef(new Map());
  const [activePoiCategories, setActivePoiCategories] = useState(initialPoiCategories);
  const [isPoiLoading, setIsPoiLoading] = useState(false);

  useEffect(() => {
    listingsRef.current = listings;
  }, [listings]);

  useEffect(() => {
    callbackRef.current = onVisibleListingIdsChange;
  }, [onVisibleListingIdsChange]);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) {
      return;
    }

    const map = L.map(mapElementRef.current, {
      scrollWheelZoom: true,
      zoomControl: true
    }).setView(romaniaCenter, defaultZoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    map.createPane("listingMarkers");
    map.getPane("listingMarkers").style.zIndex = 650;
    map.createPane("poiMarkers");
    map.getPane("poiMarkers").style.zIndex = 620;

    layerRef.current = L.layerGroup().addTo(map);
    poiLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      poiLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;

    if (!map || !layer) {
      return undefined;
    }

    function updateVisibleListings() {
      const bounds = map.getBounds();
      const visibleIds = listingsRef.current
        .filter(isValidCoordinate)
        .filter((listing) => bounds.contains(listingLatLng(listing)))
        .map((listing) => listing.id);
      callbackRef.current(visibleIds);
    }

    function renderMarkers() {
      layer.clearLayers();
      const clusters = clusterListings(map, listingsRef.current);

      clusters.forEach((cluster) => {
        if (cluster.listings.length === 1) {
          const listing = cluster.listings[0];
          const marker = L.circleMarker(listingLatLng(listing), {
            color: "#ffffff",
            fillColor: "#0f4c5c",
            fillOpacity: 0.95,
            pane: "listingMarkers",
            radius: 8,
            weight: 2
          });
          bindListingPopup(marker, listing);
          marker.addTo(layer);
          return;
        }

        const marker = L.marker(cluster.latLng, {
          icon: L.divIcon({
            className: "listing-cluster-marker",
            html: `<span>${cluster.listings.length}</span>`,
            iconSize: [38, 38],
            iconAnchor: [19, 19]
          }),
          pane: "listingMarkers"
        });
        marker.on("click", () => {
          const bounds = L.latLngBounds(cluster.listings.map(listingLatLng));
          map.fitBounds(bounds.pad(0.35), { maxZoom: 15 });
        });
        marker.addTo(layer);
      });

      updateVisibleListings();
    }

    renderMarkers();
    map.on("moveend", updateVisibleListings);
    map.on("zoomend", renderMarkers);

    return () => {
      map.off("moveend", updateVisibleListings);
      map.off("zoomend", renderMarkers);
    };
  }, [listings]);

  useEffect(() => {
    const map = mapRef.current;
    const validListings = listings.filter(isValidCoordinate);
    const listingsKey = validListings.map((listing) => listing.id).sort().join("|");

    if (!map || listingsKey === fittedListingsKeyRef.current) {
      return;
    }

    fittedListingsKeyRef.current = listingsKey;

    if (!validListings.length) {
      map.setView(romaniaCenter, defaultZoom);
      callbackRef.current([]);
      return;
    }

    window.requestAnimationFrame(() => {
      if (!mapRef.current) {
        return;
      }

      if (validListings.length === 1) {
        map.setView(listingLatLng(validListings[0]), singleListingZoom, {
          animate: true
        });
        return;
      }

      const bounds = L.latLngBounds(validListings.map(listingLatLng));
      map.fitBounds(bounds, {
        animate: true,
        maxZoom: 14,
        padding: [64, 64]
      });
    });
  }, [listings]);

  useEffect(() => {
    const map = mapRef.current;
    const poiLayer = poiLayerRef.current;

    if (!map || !poiLayer) {
      return undefined;
    }

    function selectedCategories() {
      return Object.entries(activePoiCategories)
        .filter(([, isEnabled]) => isEnabled)
        .map(([category]) => category);
    }

    function renderLoadedPois() {
      poiLayer.clearLayers();

      Array.from(loadedPoisRef.current.values()).forEach((poi) => {
        if (!activePoiCategories[poi.category]) {
          return;
        }

        const category = poiCategories[poi.category];

        if (!category) {
          return;
        }

        const marker = L.marker([poi.latitude, poi.longitude], {
          icon: L.divIcon({
            className: `poi-marker ${category.markerClass ?? ""}`,
            html: `<span style="background-color:${category.color}">${iconHtml(category)}</span>`,
            iconAnchor: [14, 14],
            iconSize: [20, 20]
          }),
          pane: "poiMarkers"
        });
        bindPoiPopup(marker, poi);
        marker.addTo(poiLayer);
      });
    }

    function clearPoiLoadTimer() {
      if (poiLoadTimeoutRef.current) {
        window.clearTimeout(poiLoadTimeoutRef.current);
        poiLoadTimeoutRef.current = null;
      }
    }

    async function loadPoisForCurrentBounds() {
      const categories = selectedCategories();

      if (!categories.length || map.getZoom() < poiMinZoom) {
        loadedPoisRef.current.clear();
        poiLayer.clearLayers();
        setIsPoiLoading(false);
        return;
      }

      const bounds = map.getBounds();
      const cacheKey = poiCacheKey(bounds, categories.join("|"));
      const cachedPois = poiCacheRef.current.get(cacheKey);

      if (cachedPois) {
        loadedPoisRef.current = new Map(cachedPois.map((poi) => [poiKey(poi), poi]));
        renderLoadedPois();
        setIsPoiLoading(false);
        return;
      }

      setIsPoiLoading(true);

      try {
        const response = await getPointsOfInterest(bounds, categories);
        const pois = response.data ?? [];
        poiCacheRef.current.set(cacheKey, pois);
        loadedPoisRef.current = new Map(pois.map((poi) => [poiKey(poi), poi]));
        renderLoadedPois();
      } catch {
        loadedPoisRef.current.clear();
        poiLayer.clearLayers();
      } finally {
        setIsPoiLoading(false);
      }
    }

    function schedulePoiLoad() {
      clearPoiLoadTimer();
      poiLoadTimeoutRef.current = window.setTimeout(loadPoisForCurrentBounds, poiLoadDelayMs);
    }

    schedulePoiLoad();
    map.on("moveend zoomend", schedulePoiLoad);

    return () => {
      clearPoiLoadTimer();
      map.off("moveend zoomend", schedulePoiLoad);
    };
  }, [activePoiCategories]);

function poiKey(poi) {
  return `${poi.category}:${poi.id}`;
}

  function togglePoiCategory(category) {
    setActivePoiCategories((current) => ({
      ...current,
      [category]: !current[category]
    }));
  }

  return (
    <section className="marketplace-map-panel" aria-label="Harta anunturilor">
      <div className="poi-controls" aria-label="Puncte de interes">
        {Object.entries(poiCategories).map(([category, config]) => (
          <button
            className={activePoiCategories[category] ? "active" : ""}
            key={category}
            type="button"
            onClick={() => togglePoiCategory(category)}
          >
            <span style={{ backgroundColor: config.color }} />
            {config.label}
          </button>
        ))}
        {isPoiLoading ? <p>Se incarca punctele de interes...</p> : null}
      </div>
      <div className="marketplace-map" ref={mapElementRef} />
    </section>
  );
}
