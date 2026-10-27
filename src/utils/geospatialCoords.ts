/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GeoLocation {
  lat: number;
  lng: number;
  city: string;
  governorate: string;
}

// Master geocoding dictionary for Omani cities, ports, and industrial regions
export const OMAN_LOCATION_COORDINATES: Record<string, GeoLocation> = {
  // Muscat Governorate
  'muscat': { lat: 23.5880, lng: 58.3829, city: 'Muscat', governorate: 'Muscat' },
  'muttrah': { lat: 23.6267, lng: 58.5639, city: 'Muttrah', governorate: 'Muscat' },
  'wattayah': { lat: 23.5939, lng: 58.4983, city: 'Wattayah', governorate: 'Muscat' },
  'qurum': { lat: 23.6186, lng: 58.4682, city: 'Qurum', governorate: 'Muscat' },
  'qantab': { lat: 23.5510, lng: 58.6275, city: 'Qantab', governorate: 'Muscat' },
  'ruwi': { lat: 23.5975, lng: 58.5444, city: 'Ruwi', governorate: 'Muscat' },
  'al mouj': { lat: 23.6253, lng: 58.2831, city: 'Al Mouj', governorate: 'Muscat' },
  'al khoudh': { lat: 23.6167, lng: 58.1750, city: 'Al Khoudh', governorate: 'Muscat' },
  'mina al fahal': { lat: 23.6300, lng: 58.5100, city: 'Mina Al Fahal', governorate: 'Muscat' },
  'bustan': { lat: 23.5700, lng: 58.6050, city: 'Al Bustan', governorate: 'Muscat' },

  // Al Batinah North & South
  'sohar': { lat: 24.3640, lng: 56.7460, city: 'Sohar', governorate: 'Al Batinah North' },
  'sohar port': { lat: 24.5020, lng: 56.6340, city: 'Sohar Port', governorate: 'Al Batinah North' },
  'barka': { lat: 23.7080, lng: 57.8860, city: 'Barka', governorate: 'Al Batinah South' },
  'al batinah': { lat: 23.8500, lng: 57.4500, city: 'Al Batinah Corridor', governorate: 'Al Batinah South' },
  'khazaen': { lat: 23.6700, lng: 57.9100, city: 'Khazaen Hub', governorate: 'Al Batinah South' },

  // Al Wusta (Duqm Special Economic Zone)
  'duqm': { lat: 19.6644, lng: 57.7039, city: 'Duqm', governorate: 'Al Wusta' },
  'al wusta': { lat: 20.0000, lng: 56.5000, city: 'Al Wusta Region', governorate: 'Al Wusta' },

  // Ash Sharqiyah (Sur & Qalhat)
  'sur': { lat: 22.5667, lng: 59.5289, city: 'Sur', governorate: 'South Ash Sharqiyah' },
  'qalhat': { lat: 22.6970, lng: 59.3730, city: 'Qalhat LNG Terminal', governorate: 'South Ash Sharqiyah' },

  // Dhofar (Salalah)
  'salalah': { lat: 17.0151, lng: 54.0924, city: 'Salalah', governorate: 'Dhofar' },
  'dhofar': { lat: 17.2000, lng: 54.2000, city: 'Dhofar Region', governorate: 'Dhofar' },
  'nimr': { lat: 18.6667, lng: 55.7833, city: 'Nimr Oilfield', governorate: 'Dhofar' },

  // Ad Dakhiliyah & Ad Dhahirah
  'nizwa': { lat: 22.9333, lng: 57.5333, city: 'Nizwa', governorate: 'Ad Dakhiliyah' },
  'ibri': { lat: 23.2257, lng: 56.5158, city: 'Ibri', governorate: 'Ad Dhahirah' },
  'fahud': { lat: 22.3333, lng: 56.4833, city: 'Fahud', governorate: 'Ad Dhahirah' },
};

/**
 * Resolves geographic coordinates for any claim based on its location string.
 * Adds a small pseudo-random deterministic jitter based on claim ID so overlapping
 * claims in the same city fan out cleanly.
 */
export const resolveClaimCoordinates = (
  locationStr: string,
  claimId: string
): GeoLocation => {
  const norm = (locationStr || '').toLowerCase();

  let matched: GeoLocation | null = null;
  for (const [key, geo] of Object.entries(OMAN_LOCATION_COORDINATES)) {
    if (norm.includes(key)) {
      matched = geo;
      break;
    }
  }

  if (!matched) {
    // Default to Muscat Central
    matched = { lat: 23.5880, lng: 58.3829, city: 'Muscat', governorate: 'Muscat' };
  }

  // Deterministic jitter based on claim ID
  let hash = 0;
  for (let i = 0; i < claimId.length; i++) {
    hash = (hash << 5) - hash + claimId.charCodeAt(i);
    hash |= 0;
  }
  const jitterLat = ((hash % 100) / 100) * 0.035 - 0.0175;
  const jitterLng = (((hash >> 2) % 100) / 100) * 0.035 - 0.0175;

  return {
    lat: matched.lat + jitterLat,
    lng: matched.lng + jitterLng,
    city: matched.city,
    governorate: matched.governorate,
  };
};
