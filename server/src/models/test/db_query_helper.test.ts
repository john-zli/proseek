import { describe, expect, test } from 'bun:test';

import { transformRow } from '../db_query_helper';

describe('db_query_helper', () => {
  describe('transformRow', () => {
    test('should transform snake_case to camelCase', () => {
      const row = {
        user_id: '1',
        first_name: 'John',
        last_name: 'Doe',
        creation_timestamp: 1234567890,
      };

      const mapping = {
        userId: 'user_id',
        firstName: 'first_name',
        lastName: 'last_name',
        creationTimestamp: 'creation_timestamp',
      };

      const result = transformRow(row, mapping);

      expect(result).toEqual({
        userId: '1',
        firstName: 'John',
        lastName: 'Doe',
        creationTimestamp: 1234567890,
      });
    });

    test('should handle missing fields', () => {
      const row = {
        user_id: '1',
        first_name: 'John',
      };

      const mapping = {
        userId: 'user_id',
        firstName: 'first_name',
        lastName: 'last_name', // not in row
        creationTimestamp: 'creation_timestamp', // not in row
      };

      const result = transformRow(row, mapping);

      expect(result).toEqual({
        userId: '1',
        firstName: 'John',
      });
    });

    test('should handle empty row', () => {
      const row = {};
      const mapping = {
        userId: 'user_id',
        firstName: 'first_name',
      };

      const result = transformRow(row, mapping);

      expect(result).toEqual({});
    });
  });
});
