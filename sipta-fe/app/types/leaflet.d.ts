declare module 'react-leaflet' {
  import { ReactNode } from 'react';
  import { MapOptions, LatLngExpression, Icon, IconOptions } from 'leaflet';

  export interface MapContainerProps extends MapOptions {
    children?: ReactNode;
    center: LatLngExpression;
    zoom: number;
    className?: string;
    style?: React.CSSProperties;
  }

  export interface TileLayerProps {
    url: string;
    attribution?: string;
  }

  export interface MarkerProps {
    position: LatLngExpression;
    icon?: Icon;
    children?: ReactNode;
  }

  export interface PopupProps {
    children?: ReactNode;
  }

  export interface CircleProps {
    center: LatLngExpression;
    radius: number;
    pathOptions?: {
      color?: string;
      fillColor?: string;
      fillOpacity?: number;
    };
  }

  export const MapContainer: React.ComponentType<MapContainerProps>;
  export const TileLayer: React.ComponentType<TileLayerProps>;
  export const Marker: React.ComponentType<MarkerProps>;
  export const Popup: React.ComponentType<PopupProps>;
  export const Circle: React.ComponentType<CircleProps>;
}

declare module 'leaflet' {
  export function Icon(options: IconOptions): Icon;
}