import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import logo from '../../assets/Logo-ondeta-v1.png';
import './styles.css';

const PET_TYPES = [
  { value: 'cachorro', label: 'Cachorro' },
  { value: 'gato', label: 'Gato' },
];

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const GEO_HEADERS = { 'User-Agent': 'OndeTa/1.0' };

async function searchAddressSuggestions(query, signal) {
  const res = await fetch(
    `${NOMINATIM}/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=br`,
    { headers: GEO_HEADERS, signal }
  );
  const data = await res.json();
  return data.map((item) => ({
    label: item.display_name,
    latitude: parseFloat(item.lat),
    longitude: parseFloat(item.lon),
  }));
}

export default function CreatePost() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [category, setCategory] = useState('');
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('');
  const [description, setDescription] = useState('');
  const [coords, setCoords] = useState(null);
  const [foundAddress, setFoundAddress] = useState('');
  const [locationMode, setLocationMode] = useState('current');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const addressDebounceRef = useRef(null);
  const addressAbortRef = useRef(null);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  function handlePhotoChange(e) {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : '');
  }

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setGeoError('Geolocalização não suportada pelo navegador');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setFoundAddress('');
        setGeoLoading(false);
      },
      (err) => {
        console.error('Erro de geolocalização:', err);
        let message = 'Não foi possível obter sua localização';
        if (err.code === err.PERMISSION_DENIED) {
          message = 'Permissão de localização negada. Habilite o acesso à localização nas configurações do navegador pra este site.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          message = 'Localização indisponível no momento. Verifique se o GPS/localização está ativado no seu dispositivo.';
        } else if (err.code === err.TIMEOUT) {
          message = 'Tempo esgotado ao tentar obter sua localização. Tente novamente.';
        }
        setGeoError(message);
        setGeoLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }

  function handleAddressChange(e) {
    const value = e.target.value;
    setAddressQuery(value);
    setFoundAddress('');
    setAddressError('');
    clearTimeout(addressDebounceRef.current);
    if (addressAbortRef.current) addressAbortRef.current.abort();

    if (value.trim().length < 4) {
      setAddressSuggestions([]);
      return;
    }

    addressDebounceRef.current = setTimeout(async () => {
      addressAbortRef.current = new AbortController();
      setAddressLoading(true);
      try {
        const results = await searchAddressSuggestions(value, addressAbortRef.current.signal);
        setAddressSuggestions(results);
        if (results.length === 0) {
          setAddressError('Nenhum endereço encontrado.');
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Erro ao buscar endereço:', err);
          setAddressSuggestions([]);
        }
      } finally {
        setAddressLoading(false);
      }
    }, 400);
  }

  function handleSelectAddress(suggestion) {
    setAddressQuery(suggestion.label);
    setCoords({ latitude: suggestion.latitude, longitude: suggestion.longitude });
    setFoundAddress(suggestion.label);
    setAddressSuggestions([]);
  }

  function handle_logout() {
    logout();
    navigate('/login');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');

    if (!coords) {
      setSubmitError('Use sua localização antes de publicar.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/posts', {
        pet_name: petName || undefined,
        pet_type: petType,
        category,
        description: description || undefined,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        try {
          await api.post(`/me/posts/${response.data.id}/images`, formData, {
            headers: { 'Content-Type': undefined },
          });
        } catch (photoErr) {
          // O post já foi criado; só a foto falhou. Avisa, mas não bloqueia.
          setSubmitError(
            'Postagem criada, mas houve um erro ao enviar a foto: ' +
            (photoErr.response?.data?.message ?? photoErr.response?.data?.error ?? 'erro desconhecido')
          );
          setSubmitting(false);
          return;
        }
      }

      navigate('/feed', { state: { showMyPosts: true } });
    } catch (err) {
      setSubmitError(
        err.response?.data?.message ?? err.response?.data?.error ?? 'Erro ao criar postagem'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="create-post-container">
      <header className="create-post-header">
        <img src={logo} alt="OndeTá?" className="create-post-header-logo" />
        <div className="create-post-header-actions">
          <button className="create-post-nav-btn" onClick={() => navigate('/feed')}>
            Feed
          </button>
          <button className="create-post-nav-btn" onClick={() => navigate('/feed', { state: { showMyPosts: true } })}>
            Minhas postagens
          </button>
          <button className="create-post-nav-btn create-post-nav-btn--active">
            Criar postagem
          </button>
          <button className="create-post-nav-btn" onClick={() => navigate('/profile')}>
            Meu perfil
          </button>
          <button className="create-post-logout-btn" onClick={handle_logout}>
            Sair
          </button>
        </div>
      </header>

      <main className="create-post-main">
      <div className="create-post-card">
        <h1 className="create-post-title">
          {category === 'perdido' && 'Perdi um animal'}
          {category === 'encontrado' && 'Encontrei um animal'}
          {!category && 'O que aconteceu?'}
        </h1>

        {!category && (
          <div className="create-post-category-options">
            <button
              type="button"
              className="create-post-category-btn"
              onClick={() => setCategory('perdido')}
            >
              🔍 Perdi um animal
            </button>
            <button
              type="button"
              className="create-post-category-btn"
              onClick={() => setCategory('encontrado')}
            >
              🐾 Encontrei um animal
            </button>
          </div>
        )}

        {category && (
          <form onSubmit={handleSubmit} className="create-post-form">
            <button
              type="button"
              className="create-post-change-category-btn"
              onClick={() => setCategory('')}
            >
              ← Trocar
            </button>

            <div className="create-post-field">
              <label htmlFor="petName">
                Nome do animal <span className="create-post-optional">(opcional)</span>
              </label>
              <input
                id="petName"
                type="text"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder="Ex: Rex"
              />
            </div>

            <div className="create-post-field">
              <label htmlFor="petType">Tipo</label>
              <select
                id="petType"
                value={petType}
                onChange={(e) => setPetType(e.target.value)}
                required
              >
                <option value="">Selecione</option>
                {PET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="create-post-field">
              <label htmlFor="description">
                Descrição <span className="create-post-optional">(opcional)</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Características do animal, local onde foi visto..."
                rows={4}
              />
            </div>

            <div className="create-post-field">
              <label htmlFor="photo">
                Foto <span className="create-post-optional">(opcional)</span>
              </label>
              <input
                id="photo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handlePhotoChange}
              />
              {photoPreview && (
                <img src={photoPreview} alt="Pré-visualização" className="create-post-photo-preview" />
              )}
            </div>

            <div className="create-post-field">
              <label>Localização</label>

              <div className="create-post-location-tabs">
                <button
                  type="button"
                  className={`create-post-location-tab ${locationMode === 'current' ? 'create-post-location-tab--active' : ''}`}
                  onClick={() => {
                    setLocationMode('current');
                    handleUseLocation();
                  }}
                  disabled={geoLoading}
                >
                  Usar localização atual
                </button>
                <button
                  type="button"
                  className={`create-post-location-tab ${locationMode === 'address' ? 'create-post-location-tab--active' : ''}`}
                  onClick={() => setLocationMode('address')}
                >
                  Digitar endereço
                </button>
              </div>

              {locationMode === 'current' ? (
                <>
                  {geoLoading && <p className="create-post-location-status">Obtendo localização...</p>}
                  {!geoLoading && coords && !foundAddress && (
                    <p className="create-post-address-found">Localização obtida ✓</p>
                  )}
                  {!geoLoading && geoError && (
                    <>
                      <p className="create-post-error">{geoError}</p>
                      <button type="button" className="create-post-retry-btn" onClick={handleUseLocation}>
                        Tentar novamente
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="create-post-address-autocomplete">
                    <input
                      type="text"
                      value={addressQuery}
                      onChange={handleAddressChange}
                      onBlur={() => setTimeout(() => setAddressSuggestions([]), 150)}
                      placeholder="Ex: Rua das Flores, 123, Curitiba"
                      autoComplete="off"
                    />
                    {addressLoading && <span className="create-post-address-loading">Buscando...</span>}
                    {addressSuggestions.length > 0 && (
                      <ul className="create-post-dropdown">
                        {addressSuggestions.map((s, i) => (
                          <li
                            key={i}
                            className="create-post-dropdown-item"
                            onMouseDown={() => handleSelectAddress(s)}
                          >
                            {s.label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {foundAddress && (
                    <p className="create-post-address-found">Endereço selecionado: {foundAddress}</p>
                  )}
                  {addressError && <p className="create-post-error">{addressError}</p>}
                </>
              )}
            </div>

            {submitError && <p className="create-post-error">{submitError}</p>}

            <button type="submit" className="create-post-submit-btn" disabled={submitting}>
              {submitting ? 'Publicando...' : 'Publicar postagem'}
            </button>
          </form>
        )}
      </div>
      </main>
    </div>
  );
}
