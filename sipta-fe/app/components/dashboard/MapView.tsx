"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
// import "leaflet/dist/leaflet.css";

// Dynamically import komponen react-leaflet
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), {
  ssr: false,
});
const Circle = dynamic(() => import("react-leaflet").then((m) => m.Circle), {
  ssr: false,
});
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), {
  ssr: false,
});

interface MapViewProps {
  userCoords: { latitude: number; longitude: number } | null;
  tpaLocation: { latitude: number; longitude: number; radius: number };
}

const MapView: React.FC<MapViewProps> = ({ userCoords, tpaLocation }) => {
  // Pastikan Leaflet hanya di-load di client
  const L = useMemo(() => {
    if (typeof window !== "undefined") {
      return require("leaflet");
    }
    return null;
  }, []);

  const userIcon = useMemo<null>(() => {
    if (!L) return null;
    return L.icon({
      iconUrl: "https://cdn-icons-png.flaticon.com/512/447/447031.png",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }, [L]);

  const tpaIcon = useMemo<null>(() => {
    if (!L) return null;
    return L.icon({
      iconUrl: "https://cdn-icons-png.flaticon.com/512/854/854878.png",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });
  }, [L]);

  const center = useMemo<[number, number]>(
    () =>
      userCoords
        ? [userCoords.latitude, userCoords.longitude]
        : [tpaLocation.latitude, tpaLocation.longitude],
    [userCoords, tpaLocation]
  );

  if (!L) {
    return (
      <div className="relative z-0 h-64 w-full rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
        <p>Loading map...</p>
      </div>
    );
  }

  return (
    <div className="relative z-0 h-64 w-full rounded-lg overflow-hidden">
      <MapContainer
        center={center}
        zoom={16}
        // scrollWheelZoom={false}
        className="h-full w-full"
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker
          position={[tpaLocation.latitude, tpaLocation.longitude]}
          icon={tpaIcon!}
        >
          <Popup>📍 Lokasi TPA</Popup>
        </Marker>

        <Circle
          center={[tpaLocation.latitude, tpaLocation.longitude]}
          radius={tpaLocation.radius}
          pathOptions={{
            color: "blue",
            fillColor: "#a3c9ff",
            fillOpacity: 0.3,
          }}
        />

        {userCoords && (
          <Marker
            position={[userCoords.latitude, userCoords.longitude]}
            icon={userIcon!}
          >
            <Popup>👤 Lokasi Anda</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;
