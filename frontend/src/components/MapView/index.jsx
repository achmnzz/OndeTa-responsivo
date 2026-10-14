import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { PET_TYPE_LABEL, CATEGORY_LABEL } from '../../utils/geoUtils';
import './styles.css';

// O bundler não resolve os ícones padrão do Leaflet sozinho (problema
// conhecido do Leaflet com Vite/Webpack) — por isso importamos e
// registramos manualmente os arquivos de imagem acima.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const CATEGORY_COLOR = {
  perdido: '#c0392b',
  encontrado: '#2e7d32',
};

function createCategoryIcon(category) {
  const color = CATEGORY_COLOR[category] ?? '#4a3b6b';
  return L.divIcon({
    className: 'map-pin-icon',
    html: `<span style="background:${color}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function MoveEndListener({ onMoveEnd }) {
  useMapEvents({
    moveend(e) {
      const center = e.target.getCenter();
      onMoveEnd({ latitude: center.lat, longitude: center.lng });
    },
  });
  return null;
}

export default function MapView({ center, pins, onAreaChange }) {
  const navigate = useNavigate();

  return (
    <MapContainer
      center={[center.latitude, center.longitude]}
      zoom={13}
      className="map-view"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {onAreaChange && <MoveEndListener onMoveEnd={onAreaChange} />}

      {pins.map((pin) => {
        const thumbnailUrl = pin.images?.[0]?.url;
        return (
          <Marker
            key={pin.id}
            position={[pin.latitude, pin.longitude]}
            icon={createCategoryIcon(pin.category)}
          >
            <Popup>
              <div className="map-pin-popup" onClick={() => navigate(`/posts/${pin.id}`)}>
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt={pin.pet_name || 'Foto do animal'} className="map-pin-popup-image" />
                ) : (
                  <div className="map-pin-popup-placeholder">🐾</div>
                )}
                <div className="map-pin-popup-info">
                  <strong>{CATEGORY_LABEL[pin.category] ?? pin.category}</strong>
                  <span>{pin.pet_name || PET_TYPE_LABEL[pin.pet_type] || pin.pet_type}</span>
                  <span className="map-pin-popup-link">Ver detalhes →</span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
