// =============================================================================
// MAP COMPONENT WITH LEAFLET - FIXED VERSION
// =============================================================================

import dynamic from "next/dynamic";

// Dynamically import komponen react-leaflet
export const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
export const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
export const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);
export const Circle = dynamic(
  () => import("react-leaflet").then((m) => m.Circle),
  { ssr: false }
);
export const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

export const LocationMap = dynamic(
  () => {
    return import("react-leaflet").then(
      ({ MapContainer, TileLayer, Marker, Popup }) => {
        const L = require("leaflet");
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });

        return function LocationMap({
          latitude,
          longitude,
        }: {
          latitude: string;
          longitude: string;
        }) {
          const position: [number, number] = [
            parseFloat(latitude),
            parseFloat(longitude),
          ];

          return (
            <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-200">
              <MapContainer
                center={position}
                zoom={15}
                style={{ height: "100%", width: "100%", zIndex: 0 }}
                // scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position}>
                  <Popup>Lokasi Absensi</Popup>
                </Marker>
              </MapContainer>
            </div>
          );
        };
      }
    );
  },
  {
    ssr: false,
    loading: () => <MapLoader />,
  }
);

const MapLoader = () => (
  <div className="h-64 w-full bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-2 text-gray-600">Memuat peta...</p>
    </div>
  </div>
);
