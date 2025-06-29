import haversine from 'haversine';

import { listChurchesNearUser } from '@server/models/churches_storage';
import { Church } from '@server/models/storage_types';
import { ServicesBuilder } from '@server/services/services_builder';

const MIN_MILES_TO_CHURCH = 20;

// Write test cases for you.
export async function getNearestChurchToUser(
  services: ServicesBuilder,
  params: { userLatitude?: number; userLongitude?: number }
): Promise<Church | undefined> {
  const { userLatitude, userLongitude } = params;
  if (userLatitude && userLongitude) {
    const userLocation = await services.geocode.reverseGeocode(userLatitude, userLongitude);

    if (userLocation) {
      const churches = await listChurchesNearUser({
        zip: userLocation.zipcode,
        city: userLocation.city,
        county: userLocation.state || '',
      });

      // 20 miles is the minimum distance to a church.
      let minDistance = MIN_MILES_TO_CHURCH;
      let nearestChurch: Church | undefined;
      for (const church of churches) {
        // Results of this should be cached; this is public knowledge.
        // Maybe, this is stored in the database itself.
        // This way we don't do crazy amount of geocode lookup.
        const churchLocation = await services.geocode.geocodeAddress(church.address);

        if (churchLocation) {
          const distance = haversine(
            { latitude: userLatitude, longitude: userLongitude },
            { latitude: churchLocation.latitude, longitude: churchLocation.longitude }
          );

          if (distance < minDistance) {
            minDistance = distance;
            nearestChurch = church;
          }
        }
      }

      return nearestChurch;
    }
  }
  return undefined;
}
