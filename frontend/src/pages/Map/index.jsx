import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useMap } from '../../hooks/useMap';
import MapView from '../../components/MapView';
import { getCurrentPosition, DEFAULT_CENTER } from '../../utils/geoUtils';
import logo from '../../assets/Logo-ondeta-v1.png';
import './styles.css';

export default function MapPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pins, loading, error, fetchPins } = useMap();

  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [petType, setPetType] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    let cancelled = false;

    (async () => {
      let start = DEFAULT_CENTER;
      try {
        start = await getCurrentPosition();
      } catch {
        // sem permissão/suporte: mantém o centro padrão
      }
      if (!cancelled) {
        setCenter(start);
        fetchPins({ ...start, petType, category });
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  function handle_area_change(newCenter) {
    setCenter(newCenter);
    fetchPins({ ...newCenter, petType, category });
  }

  function handle_filter_submit(e) {
    e.preventDefault();
    fetchPins({ ...center, petType, category });
  }

  function handle_logout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="map-page-container">
      <header className="map-page-header">
        <img src={logo} alt="OndeTá?" className="map-page-logo" />
        <div className="map-page-header-actions">
          <button className="map-page-nav-btn" onClick={() => navigate('/feed')}>
            Feed
          </button>
          <button className="map-page-nav-btn" onClick={() => navigate('/feed', { state: { showMyPosts: true } })}>
            Minhas postagens
          </button>
          <button className="map-page-nav-btn map-page-nav-btn--active">
            Mapa
          </button>
          <button className="map-page-nav-btn" onClick={() => navigate('/create-post')}>
            Criar postagem
          </button>
          <button className="map-page-nav-btn" onClick={() => navigate('/profile')}>
            Meu perfil
          </button>
          <button className="map-page-logout-btn" onClick={handle_logout}>
            Sair
          </button>
        </div>
      </header>

      <form className="map-page-filters" onSubmit={handle_filter_submit}>
        <select value={petType} onChange={(e) => setPetType(e.target.value)}>
          <option value="">Todos os tipos</option>
          <option value="cachorro">Cachorro</option>
          <option value="gato">Gato</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Perdidos e encontrados</option>
          <option value="perdido">Perdidos</option>
          <option value="encontrado">Encontrados</option>
        </select>
        <button type="submit" className="map-page-filter-btn">
          Filtrar
        </button>
        {loading && <span className="map-page-loading">Carregando...</span>}
      </form>

      {error && <p className="map-page-error">{error}</p>}

      <main className="map-page-main">
        <MapView center={center} pins={pins} onAreaChange={handle_area_change} />
      </main>
    </div>
  );
}
