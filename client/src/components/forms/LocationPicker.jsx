import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";

const defaultCenter = [45.9432, 24.9668];
const defaultZoom = 7;
const focusedZoom = 16;

function hasValidCoordinates(latitude, longitude) {
  if (latitude === "" || longitude === "" || latitude == null || longitude == null) {
    return false;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function LocationPicker({ latitude, longitude, onChange, searchQuery = "" }) {
  const elementRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const lastSearchRef = useRef("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!elementRef.current || mapRef.current) {
      return undefined;
    }

    const initialCenter = hasValidCoordinates(latitude, longitude)
      ? [Number(latitude), Number(longitude)]
      : defaultCenter;

    const map = L.map(elementRef.current, {
      scrollWheelZoom: true,
      zoomControl: true
    }).setView(initialCenter, defaultZoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    map.on("click", (event) => {
      onChangeRef.current({
        latitude: event.latlng.lat.toFixed(6),
        longitude: event.latlng.lng.toFixed(6)
      });
    });

    mapRef.current = map;
    window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  async function searchAddress(query, { silent = false } = {}) {
    const trimmedQuery = query.trim();

    if (!trimmedQuery || isSearching) {
      return;
    }

    setIsSearching(true);
    setSearchError("");

    try {
      const params = new URLSearchParams({
        countrycodes: "ro",
        format: "json",
        limit: "1",
        q: trimmedQuery
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Nu am putut cauta adresa pe harta.");
      }

      const results = await response.json();
      const firstResult = results[0];

      if (!firstResult) {
        if (!silent) {
          setSearchError("Nu am gasit adresa. Incearca sa adaugi strada, numarul sau orasul.");
        }
        return;
      }

      const nextLatitude = Number(firstResult.lat);
      const nextLongitude = Number(firstResult.lon);
      const nextLatLng = L.latLng(nextLatitude, nextLongitude);

      onChangeRef.current({
        latitude: nextLatitude.toFixed(6),
        longitude: nextLongitude.toFixed(6)
      });

      mapRef.current?.setView(nextLatLng, focusedZoom);
      lastSearchRef.current = trimmedQuery;
    } catch (error) {
      if (!silent) {
        setSearchError(error.message || "Nu am putut cauta adresa pe harta.");
      }
    } finally {
      setIsSearching(false);
    }
  }

  useEffect(() => {
    const normalizedQuery = searchQuery.trim();
    const hasEnoughAddressContext = normalizedQuery.split(",").filter(Boolean).length >= 4;

    if (
      hasValidCoordinates(latitude, longitude) ||
      !hasEnoughAddressContext ||
      normalizedQuery.length < 12 ||
      normalizedQuery === lastSearchRef.current
    ) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      searchAddress(normalizedQuery, { silent: true });
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [latitude, longitude, searchQuery]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !hasValidCoordinates(latitude, longitude)) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    const nextLatLng = L.latLng(Number(latitude), Number(longitude));

    if (!markerRef.current) {
      markerRef.current = L.circleMarker(nextLatLng, {
        color: "#ffffff",
        fillColor: "#0f4c5c",
        fillOpacity: 0.95,
        radius: 8,
        weight: 2
      }).addTo(map);
    } else {
      markerRef.current.setLatLng(nextLatLng);
    }

    if (!map.getBounds().contains(nextLatLng)) {
      map.setView(nextLatLng, Math.max(map.getZoom(), focusedZoom));
    }
  }, [latitude, longitude]);

  return (
    <div className="location-picker">
      <div className="location-picker-actions">
        <button
          className="secondary-button"
          disabled={!searchQuery.trim() || isSearching}
          onClick={() => searchAddress(searchQuery)}
          type="button"
        >
          {isSearching ? "Se cauta..." : "Cauta adresa pe harta"}
        </button>
        {searchError ? <p>{searchError}</p> : null}
      </div>
      <div className="location-picker-map" ref={elementRef} />
    </div>
  );
}
