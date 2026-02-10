let mapsLoaderPromise;

function getApiKey() {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
}

export function hasGoogleMapsKey() {
  return Boolean(getApiKey());
}

export function loadGoogleMapsPlaces() {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  if (window.google?.maps?.places) {
    return Promise.resolve(window.google.maps);
  }

  if (!getApiKey()) {
    return Promise.resolve(null);
  }

  if (mapsLoaderPromise) {
    return mapsLoaderPromise;
  }

  mapsLoaderPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-google-maps="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google?.maps || null), {
        once: true,
      });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(getApiKey())}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = 'true';
    script.onload = () => resolve(window.google?.maps || null);
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });

  return mapsLoaderPromise;
}

export async function fetchPlacePredictions(input) {
  const maps = await loadGoogleMapsPlaces();
  if (!maps?.places || !input?.trim()) return [];

  return new Promise((resolve) => {
    const service = new maps.places.AutocompleteService();
    service.getPlacePredictions(
      { input, types: ['(cities)'] },
      (predictions, status) => {
        if (status !== maps.places.PlacesServiceStatus.OK || !predictions) {
          resolve([]);
          return;
        }
        resolve(
          predictions.slice(0, 5).map((item) => ({
            placeId: item.place_id,
            description: item.description,
            mainText: item.structured_formatting?.main_text || item.description,
            secondaryText: item.structured_formatting?.secondary_text || '',
          }))
        );
      }
    );
  });
}

export async function geocodePlaceId(placeId) {
  const maps = await loadGoogleMapsPlaces();
  if (!maps?.Geocoder || !placeId) return null;

  return new Promise((resolve) => {
    const geocoder = new maps.Geocoder();
    geocoder.geocode({ placeId }, (results, status) => {
      if (status !== 'OK' || !results?.[0]?.geometry?.location) {
        resolve(null);
        return;
      }

      const location = results[0].geometry.location;
      resolve({
        lat: location.lat(),
        lng: location.lng(),
        formattedAddress: results[0].formatted_address,
      });
    });
  });
}

export async function reverseGeocode(lat, lng) {
  const maps = await loadGoogleMapsPlaces();
  if (!maps?.Geocoder || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return new Promise((resolve) => {
    const geocoder = new maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status !== 'OK' || !results?.[0]) {
        resolve(null);
        return;
      }
      resolve(results[0].formatted_address);
    });
  });
}
