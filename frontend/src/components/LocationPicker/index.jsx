import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { searchAddress, reverseGeocode } from '../../services/geocoding';
import './styles.css';

const GEO_OPTIONS = { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 };

function geoErrorMessage(err) {
  if (err.code === err.PERMISSION_DENIED) {
    return 'Permissão de localização negada. Habilite o acesso à localização nas configurações do navegador pra este site, ou digite o endereço.';
  }
  if (err.code === err.POSITION_UNAVAILABLE) {
    return 'Localização indisponível no momento. Verifique se o GPS/localização está ativado no seu dispositivo.';
  }
  if (err.code === err.TIMEOUT) {
    return 'Tempo esgotado ao tentar obter sua localização. Tente novamente.';
  }
  return 'Não foi possível obter sua localização';
}

export default function LocationPicker({ value, onChange, autoLocate = false, error = '' }) {
  const hasGeolocation = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  const [mode, setMode] = useState(autoLocate ? 'current' : null);
  const [geoLoading, setGeoLoading] = useState(autoLocate && hasGeolocation);
  const [geoError, setGeoError] = useState(
    autoLocate && !hasGeolocation ? 'Geolocalização não suportada pelo navegador' : ''
  );
  const [reverseLoading, setReverseLoading] = useState(false);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  async function handlePosition(position) {
    const coords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    onChange({ coords, address: '' });
    setGeoLoading(false);

    setReverseLoading(true);
    try {
      const address = await reverseGeocode(coords.latitude, coords.longitude);
      onChange((prev) => (prev.coords === coords && !prev.address ? { ...prev, address } : prev));
    } catch {
      return;
    } finally {
      setReverseLoading(false);
    }
  }

  function handlePositionError(err) {
    console.error('Erro de geolocalização:', err);
    setGeoError(geoErrorMessage(err));
    setGeoLoading(false);
  }

  function requestPosition() {
    navigator.geolocation.getCurrentPosition(handlePosition, handlePositionError, GEO_OPTIONS);
  }

  function handleUseCurrentLocation() {
    setMode('current');
    setGeoError('');
    if (!hasGeolocation) {
      setGeoError('Geolocalização não suportada pelo navegador');
      return;
    }
    setGeoLoading(true);
    requestPosition();
  }

  const locateOnMount = useEffectEvent(() => {
    if (autoLocate && hasGeolocation) requestPosition();
  });
  useEffect(() => {
    locateOnMount();
  }, []);

  function handleQueryChange(e) {
    const text = e.target.value;
    setQuery(text);
    setSearchError('');
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    if (text.trim().length < 4) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      abortRef.current = new AbortController();
      setSearching(true);
      try {
        const results = await searchAddress(text, abortRef.current.signal);
        setSuggestions(results);
        if (results.length === 0) setSearchError('Nenhum endereço encontrado.');
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Erro ao buscar endereço:', err);
          setSuggestions([]);
          setSearchError('Não foi possível buscar o endereço. Verifique sua conexão.');
        }
      } finally {
        setSearching(false);
      }
    }, 400);
  }

  function handleSelectSuggestion(suggestion) {
    onChange({
      coords: { latitude: suggestion.latitude, longitude: suggestion.longitude },
      address: suggestion.label,
    });
    setQuery('');
    setSuggestions([]);
  }

  function handleQueryKeyDown(e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (suggestions.length > 0) handleSelectSuggestion(suggestions[0]);
  }

  return (
    <fieldset className="location-picker">
      <legend>Localização</legend>

      <div className="location-picker-tabs">
        <button
          type="button"
          className={`location-picker-tab ${mode === 'current' ? 'location-picker-tab--active' : ''}`}
          aria-pressed={mode === 'current'}
          onClick={handleUseCurrentLocation}
          disabled={geoLoading}
        >
          Usar localização atual
        </button>
        <button
          type="button"
          className={`location-picker-tab ${mode === 'address' ? 'location-picker-tab--active' : ''}`}
          aria-pressed={mode === 'address'}
          onClick={() => setMode('address')}
        >
          Digitar endereço
        </button>
      </div>

      {mode === 'current' && (
        <div aria-live="polite">
          {geoLoading && <p className="location-picker-status">Obtendo localização...</p>}
          {!geoLoading && geoError && (
            <>
              <p className="location-picker-error">{geoError}</p>
              <button type="button" className="location-picker-retry" onClick={handleUseCurrentLocation}>
                Tentar novamente
              </button>
            </>
          )}
        </div>
      )}

      {mode === 'address' && (
        <div className="location-picker-search">
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleQueryKeyDown}
            onBlur={() => setTimeout(() => setSuggestions([]), 150)}
            placeholder="Ex: Rua das Flores, 123, Curitiba"
            aria-label="Buscar endereço"
            autoComplete="off"
            enterKeyHint="search"
          />
          {searching && <span className="location-picker-status">Buscando...</span>}
          {suggestions.length > 0 && (
            <ul className="location-picker-dropdown">
              {suggestions.map((s) => (
                <li key={s.label}>
                  <button
                    type="button"
                    className="location-picker-option"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectSuggestion(s)}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {searchError && <p className="location-picker-error">{searchError}</p>}
        </div>
      )}

      {value.coords && (
        <div className="location-picker-address">
          <label htmlFor="post-address">
            Endereço do local {mode === 'current' && !reverseLoading && <span className="location-picker-ok">✓ localização obtida</span>}
          </label>
          <input
            id="post-address"
            type="text"
            value={value.address}
            onChange={(e) => {
              const address = e.target.value;
              onChange((prev) => ({ ...prev, address }));
            }}
            placeholder={reverseLoading ? 'Buscando endereço...' : 'Rua, número – bairro, cidade'}
            maxLength={255}
            autoComplete="off"
            autoCapitalize="words"
            enterKeyHint="done"
            aria-required="true"
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? 'post-address-hint location-picker-error' : 'post-address-hint'}
          />
          <p id="post-address-hint" className="location-picker-hint">
            {reverseLoading
              ? 'Buscando o endereço deste ponto...'
              : 'Confira o endereço e complete com o número ou uma referência, se precisar.'}
          </p>
        </div>
      )}

      {error && (
        <p id="location-picker-error" className="location-picker-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
