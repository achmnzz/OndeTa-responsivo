const NOMINATIM = 'https://nominatim.openstreetmap.org';
const CACHE_PREFIX = 'ondeta:endereco:';

export function formatAddress(parts = {}, fallbackNumber) {
  const street =
    parts.road || parts.pedestrian || parts.footway || parts.path ||
    parts.residential || parts.square || parts.place;
  const number = parts.house_number || (street ? fallbackNumber : undefined);
  const district = parts.suburb || parts.neighbourhood || parts.quarter || parts.city_district;
  const city = parts.city || parts.town || parts.village || parts.municipality;
  const state = parts['ISO3166-2-lvl4']?.split('-')[1] || parts.state;

  const line1 = [street, number].filter(Boolean).join(', ');
  const cityState = city && state ? `${city} - ${state}` : city || state;
  const line2 = [district, cityState].filter(Boolean).join(', ');

  return [line1, line2].filter(Boolean).join(' – ');
}

function numberFromQuery(query) {
  const match = query.match(/(?:,|\s)\s*(\d{1,5})(?!\d)/);
  return match ? match[1] : undefined;
}

export async function searchAddress(query, signal) {
  const url =
    `${NOMINATIM}/search?q=${encodeURIComponent(query)}` +
    '&format=jsonv2&addressdetails=1&limit=6&countrycodes=br&accept-language=pt-BR';
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = await res.json();

  const typedNumber = numberFromQuery(query);
  const seen = new Set();
  const results = [];
  for (const item of data) {
    const label = formatAddress(item.address, typedNumber) || item.display_name;
    if (seen.has(label)) continue;
    seen.add(label);
    results.push({
      label,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    });
  }
  return results.slice(0, 5);
}

export async function reverseGeocode(latitude, longitude, signal) {
  const key = `${CACHE_PREFIX}${latitude.toFixed(5)},${longitude.toFixed(5)}`;
  const cached = sessionStorage.getItem(key);
  if (cached) return cached;

  const url =
    `${NOMINATIM}/reverse?lat=${latitude}&lon=${longitude}` +
    '&format=jsonv2&addressdetails=1&zoom=18&accept-language=pt-BR';
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = await res.json();

  const address = data?.address ? formatAddress(data.address) : '';
  if (address) sessionStorage.setItem(key, address);
  return address;
}
