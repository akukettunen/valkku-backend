import { Router, Request, Response } from 'express';
import { requireSignedIn, requireScope } from '@/middleware/auth';
import { query } from '@/db/index';
import { AppError } from '@/middleware/errors';
import { Client } from '@googlemaps/google-maps-services-js';
import { z } from 'zod';
import { validate } from '@/middleware/validation';
const router: Router = Router();

// Initialize Google Maps client
const googleMapsClient = new Client({});

export interface Location {
  name: string;
  formattedAddress: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string; // ISO 3166-1 alpha-2 preferred
  lat?: number;
  lon?: number;
  provider?: 'google' | 'mapbox' | 'osm' | string;
  providerPlaceId?: string;
}

const createLocationSchema = z.object({
  name: z.string(),
  formattedAddress: z.string(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  provider: z.enum(['google', 'mapbox', 'osm']).optional(),
  providerPlaceId: z.string().optional(),
});

router.post('/team/:teamId', requireSignedIn, requireScope('location:create', 'team'), validate(createLocationSchema), async (req: Request, res: Response) => {
  const { name, formattedAddress, addressLine1, addressLine2, city, state, zip, country, lat, lon, provider, providerPlaceId } = req.body as Location;
  const { teamId } = req.params as { teamId: string };

  const [ wasAlreadyCreated ] = await query(`
    SELECT * FROM locations WHERE providerPlaceId = ? AND teamId = ? AND provider = ?
  `, [providerPlaceId, teamId, provider]) as any;

  if (wasAlreadyCreated) {
    throw new AppError('Location already exists', 400, 'location_already_exists');
  }

  const { insertId } = await query(`
    INSERT INTO locations (name, formattedAddress, addressLine1, addressLine2, city, state, zip, country, lat, lon, provider, providerPlaceId, teamId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [name, formattedAddress, addressLine1, addressLine2, city, state, zip, country, lat, lon, provider, providerPlaceId, teamId]) as any;

  const [ createdLocation ] = await query(`
    SELECT * FROM locations WHERE id = ?
  `, [insertId]) as any;

  res.status(201).json({
    success: true,
    message: 'Location created successfully',
    data: createdLocation
  });
});

router.get('/team/:teamId', requireSignedIn, requireScope('location:read', 'team'), async (req: Request, res: Response) => {
  const { teamId } = req.params as { teamId: string };

  const locations = await query(`
    SELECT * FROM locations WHERE teamId = ?
  `, [teamId]);

  res.status(200).json({
    success: true,
    message: 'Locations fetched successfully',
    data:{
      locations
    }
  });
});

router.delete('/team/:teamId/:locationId', requireSignedIn, requireScope('location:delete', 'team'), async (req: Request, res: Response) => {
  const { teamId, locationId } = req.params as { teamId: string, locationId: string };

  await query(`
    DELETE FROM locations WHERE id = ? AND teamId = ?
  `, [locationId, teamId]);

  res.status(200).json({
    success: true,
    message: 'Location deleted successfully',
    data: 'ok!'
  });
});

router.put('/team/:teamId/:locationId', requireSignedIn, requireScope('location:update', 'team'), async (req: Request, res: Response) => {
  const { teamId, locationId } = req.params as { teamId: string, locationId: string };
  const { name, formattedAddress, addressLine1, addressLine2, city, state, zip, country, lat, lon, provider, providerPlaceId } = req.body as Location;

  await query(`
    UPDATE locations SET name = ?, formattedAddress = ?, addressLine1 = ?, addressLine2 = ?, city = ?, state = ?, zip = ?, country = ?, lat = ?, lon = ?, provider = ?, providerPlaceId = ? WHERE id = ? AND teamId = ?
  `, [name, formattedAddress, addressLine1, addressLine2, city, state, zip, country, lat, lon, provider, providerPlaceId, locationId, teamId]);

  res.status(200).json({
    success: true,
    message: 'Location updated successfully',
    data: 'ok!'
  });
});

router.get('/suggest/language/:language', async (req: Request, res: Response) => {
  const { q } = req.query as { q: string };
  const { language } = req.params as { language: string };

  if (!q || q.trim().length < 2) {
    throw new AppError(
      'Query parameter "q" is required and must be at least 2 characters',
      400,
      'invalid_query'
    );
  }

  try {
    const apiKey = process.env['GOOGLE_MAPS_API_KEY']!;
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.types,places.rating,places.location,places.addressComponents',
      },
      body: JSON.stringify({
        textQuery: q,
        languageCode: language,
        // optional: add a bias so "jkl pesiskenttä" points near Jyväskylä
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Google Maps API error:', err);
      throw new AppError('Failed to fetch location suggestions', 500, 'api_error');
    }

    const data = await response.json() as { places?: any[] };
    console.log("KEYSKJDWJWD: ", Object.keys(data));
    console.log("TYPEOF DATA: ", typeof data);
    console.log("DATA: ", data);

      const suggestions = (data.places || []).map((place: any) => ({
        placeId: place.id,
        name: place.displayName?.text,
        displayName: place.displayName,
        formattedAddress: place.formattedAddress,
        location: place.location,
        types: place.types,
        rating: place.rating,
        addressComponents: place.addressComponents,
        geometry: place.location, // v1 uses `location` instead of `geometry.location`
      }));

    res.status(200).json({
      success: true,
      message: 'Location suggestions fetched successfully',
      data: suggestions,
    });
  } catch (error: any) {
    console.error('Google Maps API error:', error);
    throw new AppError('Failed to fetch location suggestions', 500, 'api_error');
  }
});

router.get('/place-details/:placeId', requireSignedIn, async (req: Request, res: Response) => {
  const { placeId } = req.params as { placeId: string };

  if (!placeId) {
    throw new AppError('Place ID is required', 400, 'invalid_place_id');
  }

  try {
    const response = await googleMapsClient.placeDetails({
      params: {
        place_id: placeId,
        key: process.env['GOOGLE_MAPS_API_KEY']!,
        fields: ['name', 'formatted_address', 'geometry', 'address_components', 'types'],
        language: 'en' as any,
      },
    });

    const place = response.data.result;
    const location = {
      name: place.name,
      address: place.formatted_address,
      coordinates: {
        lat: place.geometry?.location?.lat,
        lng: place.geometry?.location?.lng,
      },
      addressComponents: place.address_components,
      types: place.types,
    };

    res.status(200).json({
      success: true,
      message: 'Place details fetched successfully',
      data: location
    });
  } catch (error: any) {
    console.error('Google Maps API error:', error);
    throw new AppError('Failed to fetch place details', 500, 'api_error');
  }
});

export default router;