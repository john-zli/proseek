import { beforeEach, describe, expect, mock, test } from 'bun:test';

import { nonQuery, queryRows, queryScalar, querySingleRow } from '../db_query_helper';

const mockQuery = mock(() => {});
mock.module('@server/services/db', () => ({
  getPool: () => ({
    query: mockQuery,
  }),
}));

describe('db_query_helper', () => {
  describe('queryRows', () => {
    test('should transform rows from snake_case to camelCase', async () => {
      const mockRows = [
        { user_id: '1', first_name: 'John', last_name: 'Doe' },
        { user_id: '2', first_name: 'Jane', last_name: 'Smith' },
      ];

      mockQuery.mockResolvedValue({ rows: mockRows });

      const result = await queryRows({
        query: 'SELECT * FROM users',
        params: [],
        mapping: {
          userId: 'user_id',
          firstName: 'first_name',
          lastName: 'last_name',
        },
        commandIdentifier: 'test-query',
      });

      expect(result).toEqual([
        { userId: '1', firstName: 'John', lastName: 'Doe' },
        { userId: '2', firstName: 'Jane', lastName: 'Smith' },
      ]);
    });

    test('should handle empty result set', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await queryRows({
        query: 'SELECT * FROM users',
        params: [],
        mapping: {
          userId: 'user_id',
          firstName: 'first_name',
        },
        commandIdentifier: 'test-query',
      });

      expect(result).toEqual([]);
    });

    test('should handle database errors', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await expect(
        queryRows({
          query: 'SELECT * FROM users',
          params: [],
          mapping: {
            userId: 'user_id',
          },
          commandIdentifier: 'test-query',
        })
      ).rejects.toThrow('Error executing query test-query: Database error');
    });
  });

  describe('querySingleRow', () => {
    test('should return single row when one result found', async () => {
      const mockRow = { user_id: '1', first_name: 'John' };
      mockQuery.mockResolvedValue({ rows: [mockRow] });

      const result = await querySingleRow({
        query: 'SELECT * FROM users WHERE id = $1',
        params: ['1'],
        mapping: {
          userId: 'user_id',
          firstName: 'first_name',
        },
        commandIdentifier: 'test-query',
      });

      expect(result).toEqual({ userId: '1', firstName: 'John' });
    });

    test('should throw error when multiple rows found', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          { user_id: '1', first_name: 'John' },
          { user_id: '2', first_name: 'Jane' },
        ],
      });

      await expect(
        querySingleRow({
          query: 'SELECT * FROM users',
          params: [],
          mapping: {
            userId: 'user_id',
            firstName: 'first_name',
          },
          commandIdentifier: 'test-query',
        })
      ).rejects.toThrow('Multiple results found for command test-query');
    });

    test('should return null when no rows found and allowNull is true', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await querySingleRow({
        query: 'SELECT * FROM users WHERE id = $1',
        params: ['999'],
        mapping: {
          userId: 'user_id',
          firstName: 'first_name',
        },
        commandIdentifier: 'test-query',
        allowNull: true,
      });

      expect(result).toBeNull();
    });
  });

  describe('queryScalar', () => {
    test('should return scalar value', async () => {
      mockQuery.mockResolvedValue({ rows: [{ count: 42 }] });

      const result = await queryScalar<number>({
        query: 'SELECT COUNT(*) FROM users',
        params: [],
        commandIdentifier: 'test-query',
      });

      expect(result).toBe(42);
    });

    test('should return null when no results and allowNull is true', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await queryScalar<number>({
        query: 'SELECT COUNT(*) FROM users',
        params: [],
        commandIdentifier: 'test-query',
      });

      expect(result).toBeNull();
    });

    test('should throw error when no results and allowNull is false', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await expect(
        queryScalar<number>({
          query: 'SELECT COUNT(*) FROM users',
          params: [],
          commandIdentifier: 'test-query',
        })
      ).rejects.toThrow('No results found for command test-query');
    });
  });

  describe('nonQuery', () => {
    test('should execute query without returning results', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await nonQuery({
        query: 'INSERT INTO users (name) VALUES ($1)',
        params: ['John'],
        commandIdentifier: 'test-query',
      });

      expect(mockQuery).toHaveBeenCalledWith('INSERT INTO users (name) VALUES ($1)', ['John']);
    });

    test('should handle database errors', async () => {
      mockQuery.mockRejectedValue(new Error('Database error'));

      await expect(
        nonQuery({
          query: 'INSERT INTO users (name) VALUES ($1)',
          params: ['John'],
          commandIdentifier: 'test-query',
        })
      ).rejects.toThrow('Error executing query test-query: Database error');
    });
  });
});
