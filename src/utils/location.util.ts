import axios from 'axios';

interface IpApiResponse {
  status: 'success' | 'fail';
  country?: string;
  regionName?: string;
  city?: string;
  lat?: number;
  lon?: number;
  isp?: string;
  query: string;
  message?: string;
}

/**
 * Fetches geolocation data for a given IP address using IP-API.
 * @param ipAddress - The IP address to lookup (e.g., "24.48.0.1")
 * @returns Parsed location data or throws an error.
 * @throws Will throw if the IP is invalid or API request fails.
 */
export const getLocationFromIp = async (
  ipAddress: string,
): Promise<{
  country: string;
  region: string;
  city: string;
  coordinates?: { lat: number; lon: number };
  isp?: string;
}> => {
  if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ipAddress)) {
    throw new Error('Invalid IP address format');
  }

  try {
    const response = await axios.get<IpApiResponse>(
      `http://ip-api.com/json/${ipAddress}?fields=status,country,regionName,city,lat,lon,isp,query`,
      { timeout: 5000 },
    );

    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to fetch location');
    }

    return {
      country: response.data.country || 'Unknown',
      region: response.data.regionName || 'Unknown',
      city: response.data.city || 'Unknown',
      coordinates:
        response.data.lat && response.data.lon
          ? { lat: response.data.lat, lon: response.data.lon }
          : undefined,
      isp: response.data.isp,
    };
  } catch (error) {
    throw new Error('Unable to fetch location data');
  }
};
