import { afterEach, describe, expect, mock, test } from 'bun:test';

import { createChurch, listChurchesNearUser } from '../churches_storage';
import { queryRows, queryScalar } from '../db_query_helper';

// Mock the database query helpers
const mockQueryRows = mock(() => {});
const mockQueryScalar = mock(() => {});

mock.module('../db_query_helper', () => ({
  queryRows: mockQueryRows,
  queryScalar: mockQueryScalar,
}));

describe('churches_storage', () => {
  afterEach(() => {
    mockQueryRows.mockReset();
    mockQueryScalar.mockReset();
  });

  describe('listChurchesNearUser', () => {
    test('should list churches by zip code', async () => {
      const mockChurches = [
        {
          church_id: '1',
          name: 'Church 1',
          zip: '12345',
          county: 'County 1',
          city: 'City 1',
          creation_timestamp: 1234567890,
          modification_timestamp: 1234567890,
        },
      ];

      mockQueryRows.mockResolvedValue(mockChurches);

      const result = await listChurchesNearUser({ zip: '12345' });

      expect(mockQueryRows).toHaveBeenCalledWith({
        commandIdentifier: 'ListChurchesNearUser',
        query: expect.any(String),
        params: ['12345', null, null],
        mapping: expect.any(Object),
      });

      expect(result).toEqual([
        {
          churchId: '1',
          name: 'Church 1',
          zip: '12345',
          county: 'County 1',
          city: 'City 1',
          creationTimestamp: 1234567890,
          modificationTimestamp: 1234567890,
        },
      ]);
    });

    test('should list churches by city and county', async () => {
      const mockChurches = [
        {
          church_id: '2',
          name: 'Church 2',
          zip: '54321',
          county: 'County 2',
          city: 'City 2',
          creation_timestamp: 1234567890,
          modification_timestamp: 1234567890,
        },
      ];

      mockQueryRows.mockResolvedValue(mockChurches);

      const result = await listChurchesNearUser({ city: 'City 2', county: 'County 2' });

      expect(mockQueryRows).toHaveBeenCalledWith({
        commandIdentifier: 'ListChurchesNearUser',
        query: expect.any(String),
        params: [null, 'City 2', 'County 2'],
        mapping: expect.any(Object),
      });

      expect(result).toEqual([
        {
          churchId: '2',
          name: 'Church 2',
          zip: '54321',
          county: 'County 2',
          city: 'City 2',
          creationTimestamp: 1234567890,
          modificationTimestamp: 1234567890,
        },
      ]);
    });

    test('should handle empty results', async () => {
      mockQueryRows.mockResolvedValue([]);

      const result = await listChurchesNearUser({ zip: '99999' });

      expect(result).toEqual([]);
    });
  });

  describe('createChurch', () => {
    test('should create a church with all required fields', async () => {
      const mockChurchId = 'new-church-1';
      mockQueryScalar.mockResolvedValue(mockChurchId);

      const params = {
        name: 'New Church',
        address: '123 Main St',
        city: 'New City',
        state: 'NS',
        zip: '12345',
        county: 'New County',
      };

      const result = await createChurch(params);

      expect(mockQueryScalar).toHaveBeenCalledWith({
        commandIdentifier: 'CreateChurch',
        query: expect.any(String),
        allowNull: false,
        params: [params.name, params.address, params.city, params.state, params.zip, params.county, null, null, null],
      });

      expect(result).toBe(mockChurchId);
    });

    test('should create a church with optional fields', async () => {
      const mockChurchId = 'new-church-2';
      mockQueryScalar.mockResolvedValue(mockChurchId);

      const params = {
        name: 'New Church',
        address: '123 Main St',
        city: 'New City',
        state: 'NS',
        zip: '12345',
        county: 'New County',
        phone: '123-456-7890',
        email: 'church@example.com',
        website: 'https://church.example.com',
      };

      const result = await createChurch(params);

      expect(mockQueryScalar).toHaveBeenCalledWith({
        commandIdentifier: 'CreateChurch',
        query: expect.any(String),
        allowNull: false,
        params: [
          params.name,
          params.address,
          params.city,
          params.state,
          params.zip,
          params.county,
          params.phone,
          params.email,
          params.website,
        ],
      });

      expect(result).toBe(mockChurchId);
    });

    test('should handle database errors', async () => {
      mockQueryScalar.mockRejectedValue(new Error('Database error'));

      const params = {
        name: 'New Church',
        address: '123 Main St',
        city: 'Test City',
        state: 'CA',
        zip: '12345',
        county: 'Test County',
      };

      await expect(createChurch(params)).rejects.toThrow('Database error');
    });
  });
});
