import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

import { createChurch, listChurchMembers, listChurchesNearUser } from '../churches_storage';
import { createAdminUser } from '../users_storage';
import { Gender } from '@common/server-api/types/gender';
import { setupTestDb, teardownTestDb } from '@server/test/db_test_helper';
import { v4 as uuidv4 } from 'uuid';

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
        email: 'church1@test.com',
      });

      // List churches by zip
      const churches = await listChurchesNearUser({ zip: '12345' });

      expect(churches).toHaveLength(1);
      expect(churches[0]).toMatchObject({
        churchId,
        name: 'Church 1',
        address: '123 Main St',
        city: 'City 1',
        state: 'CA',
        zip: '12345',
        county: 'County 1',
        email: 'church1@test.com',
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
        email: 'church2@test.com',
      });

      // List churches by city and county
      const churches = await listChurchesNearUser({ city: 'City 2', county: 'County 2' });

      expect(churches).toHaveLength(1);
      expect(churches[0]).toMatchObject({
        churchId,
        name: 'Church 2',
        address: '456 Other St',
        city: 'City 2',
        state: 'CA',
        zip: '54321',
        county: 'County 2',
        email: 'church2@test.com',
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
        email: 'duplicate@test.com',
      };

      // Create first church
      await createChurch(params);

      // Try to create a church with the same name
      await expect(createChurch(params)).rejects.toThrow();
    });
  });

  describe('listChurchMembers', () => {
    test('should list members of a church with their roles', async () => {
      const churchId = await createChurch({
        name: 'Members Church',
        address: '123 Main St',
        city: 'Test City',
        state: 'CA',
        zip: '12345',
        county: 'Test County',
        email: 'members@test.com',
      });

      const user = await createAdminUser({
        churchId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        gender: Gender.Male,
        passwordHash: 'password',
      });

      const members = await listChurchMembers(churchId);

      expect(members).toHaveLength(1);
      expect(members[0]).toEqual({
        userId: user.userId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        role: 'Admin',
      });
    });

    test('should return empty array for church with no members', async () => {
      const churchId = await createChurch({
        name: 'Empty Church',
        address: '123 Main St',
        city: 'Test City',
        state: 'CA',
        zip: '11111',
        county: 'Test County',
        email: 'empty@test.com',
      });

      const members = await listChurchMembers(churchId);
      expect(members).toEqual([]);
    });

    test('should return empty array for non-existent church', async () => {
      const members = await listChurchMembers(uuidv4());
      expect(members).toEqual([]);
    });
  });
});
