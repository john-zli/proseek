import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

import { createChurch, listChurchesNearUser } from '../churches_storage';
import { setupTestDb, teardownTestDb } from '@server/test/db_test_helper';

describe('churches_storage', () => {
  beforeEach(async () => {
    await setupTestDb();
  });

  afterEach(async () => {
    await teardownTestDb();
  });

  describe('listChurchesNearUser', () => {
    test('should list churches by zip code', async () => {
      // Create a test church
      const churchId = await createChurch({
        name: 'Church 1',
        address: '123 Main St',
        city: 'City 1',
        state: 'CA',
        zip: '12345',
        county: 'County 1',
      });

      // List churches by zip
      const churches = await listChurchesNearUser({ zip: '12345' });

      expect(churches).toHaveLength(1);
      expect(churches[0]).toEqual({
        churchId,
        name: 'Church 1',
        address: '123 Main St',
        city: 'City 1',
        state: 'CA',
        zip: '12345',
        county: 'County 1',
      });
    });

    test('should list churches by city and county', async () => {
      // Create a test church
      const churchId = await createChurch({
        name: 'Church 2',
        address: '456 Other St',
        city: 'City 2',
        state: 'CA',
        zip: '54321',
        county: 'County 2',
      });

      // List churches by city and county
      const churches = await listChurchesNearUser({ city: 'City 2', county: 'County 2' });

      expect(churches).toHaveLength(1);
      expect(churches[0]).toEqual({
        churchId,
        name: 'Church 2',
        address: '456 Other St',
        city: 'City 2',
        state: 'CA',
        zip: '54321',
        county: 'County 2',
      });
    });

    test('should handle empty results', async () => {
      const churches = await listChurchesNearUser({ zip: '99999' });
      expect(churches).toEqual([]);
    });
  });

  describe('createChurch', () => {
    test('should handle duplicate church names', async () => {
      const params = {
        name: 'Duplicate Church',
        address: '123 Main St',
        city: 'Test City',
        state: 'CA',
        zip: '12345',
        county: 'Test County',
      };

      // Create first church
      await createChurch(params);

      // Try to create a church with the same name
      await expect(createChurch(params)).rejects.toThrow();
    });
  });
});
