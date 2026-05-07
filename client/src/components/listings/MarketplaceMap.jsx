import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { apiOrigin } from "../../api/axiosClient.js";
import { propertyTypeLabels, transactionTypeLabels } from "../../constants/listingLabels.js";
import { formatArea, formatPrice } from "../../utils/formatters.js";

const romaniaCenter = [45.9443, 24.9668];
const defaultZoom = 6;
const clusterDistance = 46;
const singleListingZoom = 13;
const poiMinZoom = 13;
const overpassEndpoints = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter"
];

const poiCategories = {
  metro: {
    color: "#2563eb",
    label: "Metrou",
    marker: "M",
    markerClass: "poi-marker-metro",
    queries: [
      'node["railway"="subway_entrance"]',
      'node["station"="subway"]',
      'node["railway"="station"]["station"="subway"]'
    ]
  },
  bus: {
    color: "#ea580c",
    label: "STB autobuz",
    marker: "bus",
    markerClass: "poi-marker-transit",
    queries: ['node["highway"="bus_stop"]']
  },
  trolley: {
    color: "#0891b2",
    label: "STB troleibuz",
    marker: "trolley",
    markerClass: "poi-marker-transit",
    queries: [
      'node["highway"="bus_stop"]["trolleybus"="yes"]',
      'node["public_transport"="platform"]["trolleybus"="yes"]'
    ]
  },
  tram: {
    color: "#9333ea",
    label: "STB tramvai",
    marker: "TR",
    markerClass: "poi-marker-transit",
    queries: ['node["railway"="tram_stop"]']
  },
  healthcare: {
    color: "#dc2626",
    label: "Spitale",
    marker: "H",
    queries: ['node["amenity"="hospital"]', 'node["amenity"="clinic"]', 'node["amenity"="doctors"]']
  },
  education: {
    color: "#7c3aed",
    label: "Scoli",
    marker: "S",
    queries: ['node["amenity"="school"]', 'node["amenity"="kindergarten"]', 'node["amenity"="university"]']
  },
  groceries: {
    color: "#16a34a",
    label: "Magazine",
    marker: "bag",
    markerClass: "poi-marker-shop",
    queries: ['node["shop"="supermarket"]', 'node["shop"="convenience"]', 'node["shop"="greengrocer"]']
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

function poiCategoryForTags(tags = {}) {
  if (tags.railway === "subway_entrance" || tags.station === "subway") {
    return "metro";
  }

  if (tags.trolleybus === "yes") {
    return "trolley";
  }

  if (tags.railway === "tram_stop") {
    return "tram";
  }

  if (tags.highway === "bus_stop") {
    return "bus";
  }

  if (["hospital", "clinic", "doctors"].includes(tags.amenity)) {
    return "healthcare";
  }

  if (["school", "kindergarten", "university"].includes(tags.amenity)) {
    return "education";
  }

  if (["supermarket", "convenience", "greengrocer"].includes(tags.shop)) {
    return "groceries";
  }

  return null;
}

function buildCategoryOverpassQuery(bounds, category) {
  const bbox = [
    bounds.getSouth().toFixed(6),
    bounds.getWest().toFixed(6),
    bounds.getNorth().toFixed(6),
    bounds.getEast().toFixed(6)
  ].join(",");
  const queries = poiCategories[category].queries
    .map((query) => `${query}(${bbox});`)
    .join("");

  return `[out:json][timeout:12];(${queries});out center 120;`;
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
  const poiRequestRef = useRef(null);
  const poiCacheRef = useRef(new Map());
  const loadedPoisRef = useRef(new Map());
  const [activePoiCategories, setActivePoiCategories] = useState(initialPoiCategories);
  const [poiStatus, setPoiStatus] = useState("");
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
          })
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
    map.on("moveend zoomend", renderMarkers);

    return () => {
      map.off("moveend zoomend", renderMarkers);
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

    function markPoiLayerStale() {
      poiRequestRef.current?.abort();
      setIsPoiLoading(false);
      setPoiStatus("");
    }

    map.on("moveend zoomend", markPoiLayerStale);

    return () => {
      map.off("moveend zoomend", markPoiLayerStale);
      poiRequestRef.current?.abort();
    };
  }, []);

function poiKey(poi) {
  return `${poi.category}:${poi.id}`;
}

  function mergePois(pois) {
    pois.forEach((poi) => {
      loadedPoisRef.current.set(poiKey(poi), poi);
    });
  }

  function renderLoadedPois() {
    const poiLayer = poiLayerRef.current;

    if (!poiLayer) {
      return;
    }

    poiLayer.clearLayers();

    Array.from(loadedPoisRef.current.values()).forEach((poi) => {
      const category = poiCategories[poi.category];
      const marker = L.marker([poi.latitude, poi.longitude], {
        icon: L.divIcon({
          className: `poi-marker ${category.markerClass ?? ""}`,
          html: `<span style="background-color:${category.color}">${iconHtml(category)}</span>`,
          iconAnchor: [14, 14],
          iconSize: [28, 28]
        })
      });
      bindPoiPopup(marker, poi);
      marker.addTo(poiLayer);
    });
  }

  async function loadPois() {
    const map = mapRef.current;
    const poiLayer = poiLayerRef.current;

    if (!map || !poiLayer) {
      return;
    }

    poiRequestRef.current?.abort();
    poiLayer.clearLayers();

    if (!Object.values(activePoiCategories).some(Boolean)) {
      setPoiStatus("");
      return;
    }

    if (map.getZoom() < poiMinZoom) {
      setPoiStatus("");
      return;
    }

    const bounds = map.getBounds();
    const controller = new AbortController();
    poiRequestRef.current = controller;
    const selectedCategories = Object.entries(activePoiCategories)
      .filter(([, isEnabled]) => isEnabled)
      .map(([category]) => category);
    const beforeCount = loadedPoisRef.current.size;
    let loadedCategories = 0;
    let failedCategories = 0;
    let foundPois = 0;

    setIsPoiLoading(true);
    setPoiStatus("Se incarca punctele de interes...");

    try {
      for (const categoryName of selectedCategories) {
        const cacheKey = poiCacheKey(bounds, categoryName);
        const cachedPois = poiCacheRef.current.get(cacheKey);

        if (cachedPois) {
          mergePois(cachedPois);
          foundPois += cachedPois.length;
          loadedCategories += 1;
          renderLoadedPois();
          setPoiStatus("Se incarca punctele de interes...");
          continue;
        }

        try {
          let response = null;

          for (const endpoint of overpassEndpoints) {
            response = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "text/plain;charset=UTF-8"
              },
              body: buildCategoryOverpassQuery(bounds, categoryName),
              signal: controller.signal
            });

            if (response.ok || response.status !== 429) {
              break;
            }
          }

          if (!response?.ok) {
            throw new Error(response?.status === 429 ? "rate_limited" : "overpass_failed");
          }

          const payload = await response.json();
          const pois = payload.elements
            .map((element) => {
              const category = poiCategoryForTags(element.tags);
              const latitude = element.lat ?? element.center?.lat;
              const longitude = element.lon ?? element.center?.lon;

              if (!category || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                return null;
              }

              return {
                category,
                id: element.id,
                latitude,
                longitude,
                name: element.tags?.name || poiCategories[category].label
              };
            })
            .filter((poi) => poi?.category === categoryName)
            .slice(0, 120);

          poiCacheRef.current.set(cacheKey, pois);
          mergePois(pois);
          foundPois += pois.length;
          loadedCategories += 1;
          renderLoadedPois();
          setPoiStatus("Se incarca punctele de interes...");
        } catch (error) {
          if (error.name === "AbortError") {
            throw error;
          }
          failedCategories += 1;
          setPoiStatus("Se incarca punctele de interes...");
        }
      }

      renderLoadedPois();
      setPoiStatus("");
    } catch (error) {
      if (error.name !== "AbortError") {
        setPoiStatus("");
      }
    } finally {
      setIsPoiLoading(false);
    }
  }

  function togglePoiCategory(category) {
    setActivePoiCategories((current) => ({
      ...current,
      [category]: !current[category]
    }));
    setPoiStatus("");
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
        <button className="poi-load-button" type="button" onClick={loadPois} disabled={isPoiLoading}>
          {isPoiLoading ? "Se incarca..." : "Incarca puncte"}
        </button>
        {poiStatus ? <p>{poiStatus}</p> : null}
      </div>
      <div className="marketplace-map" ref={mapElementRef} />
    </section>
  );
}
