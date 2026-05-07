import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

export function ListingMap({ latitude, longitude, title }) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) {
      return;
    }

    const center = [latitude, longitude];
    const map = L.map(mapElementRef.current, {
      scrollWheelZoom: false
    }).setView(center, 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    L.circleMarker(center, {
      color: "#0f4c5c",
      fillColor: "#0f4c5c",
      fillOpacity: 0.9,
      radius: 9,
      weight: 2
    })
      .addTo(map)
      .bindPopup(title);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, title]);

  return <div className="listing-map" ref={mapElementRef} aria-label="Harta locatiei" />;
}
