import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from 'react-leaflet';
import type { DeliveryStop } from '../types/delivery';

interface DeliveryMapProps {
  stops: DeliveryStop[];
  selectedOrderId?: string | null;
  onSelectStop?: (stop: DeliveryStop) => void;
  compact?: boolean;
}

const DEFAULT_CENTER: [number, number] = [24.8607, 67.0011];

function FitStops({ stops }: { stops: DeliveryStop[] }) {
  const map = useMap();

  useEffect(() => {
    if (stops.length === 0) {
      map.setView(DEFAULT_CENTER, 11);
      return;
    }
    if (stops.length === 1) {
      map.setView([stops[0].latitude, stops[0].longitude], 13);
      return;
    }
    const bounds = L.latLngBounds(
      stops.map((stop) => [stop.latitude, stop.longitude] as [number, number]),
    );
    map.fitBounds(bounds.pad(0.22));
  }, [map, stops]);

  return null;
}

function createStopIcon(stop: DeliveryStop, selected: boolean) {
  const statusClass = (stop.stopStatus || 'ASSIGNED').toLowerCase();
  return L.divIcon({
    className: 'delivery-marker-shell',
    html: `<span class="delivery-marker ${statusClass}${selected ? ' selected' : ''}"><b>${stop.stopSequence || '•'}</b></span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

const DeliveryMap = ({
  stops,
  selectedOrderId,
  onSelectStop,
  compact = false,
}: DeliveryMapProps) => {
  const orderedStops = useMemo(
    () => [...stops].sort((a, b) => (a.stopSequence || 999) - (b.stopSequence || 999)),
    [stops],
  );
  const routePositions = orderedStops.map(
    (stop) => [stop.latitude, stop.longitude] as [number, number],
  );

  return (
    <div className={`delivery-map ${compact ? 'compact' : ''}`}>
      <MapContainer center={DEFAULT_CENTER} zoom={11} scrollWheelZoom className="delivery-map-canvas">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitStops stops={orderedStops} />
        {routePositions.length > 1 && (
          <Polyline positions={routePositions} pathOptions={{ color: '#22c55e', weight: 4, opacity: 0.72 }} />
        )}
        {orderedStops.map((stop) => (
          <Marker
            key={stop.orderId}
            position={[stop.latitude, stop.longitude]}
            icon={createStopIcon(stop, selectedOrderId === stop.orderId)}
            eventHandlers={{ click: () => onSelectStop?.(stop) }}
          >
            <Popup>
              <strong>Stop {stop.stopSequence || '—'}</strong>
              <br />
              {stop.deliveryAddress}
              <br />
              Status: {stop.stopStatus || 'Not assigned'}
              {stop.coordinatesAreApproximate && (
                <><br /><em>Approximate map position</em></>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default DeliveryMap;
