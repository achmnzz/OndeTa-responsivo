export const PET_TYPE_LABEL = {
  cachorro: 'Cachorro',
  gato: 'Gato',
};

export const CATEGORY_LABEL = {
  perdido: 'Perdido',
  encontrado: 'Encontrado',
};

export const DEFAULT_CENTER = { latitude: -25.4311, longitude: -49.2718 };

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não suportada pelo navegador'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }),
      () => reject(new Error('Não foi possível obter sua localização')),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}
