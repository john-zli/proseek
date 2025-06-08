import { describe, expect, test } from 'bun:test';

import { extractArraysByKeys } from '../db_helpers';

describe('db_helpers', () => {
  describe('extractArraysByKeys', () => {
    test('should extract arrays by specified keys', () => {
      const objects = [
        { id: '1', name: 'John', age: 30 },
        { id: '2', name: 'Jane', age: 25 },
      ];

      const result = extractArraysByKeys(objects, ['id', 'name', 'age']);

      expect(result).toEqual([
        ['1', '2'],
        ['John', 'Jane'],
        [30, 25],
      ]);
    });

    test('should handle empty array of objects', () => {
      const objects: Record<string, any>[] = [];

      const result = extractArraysByKeys(objects, ['id', 'name']);

      expect(result).toEqual([[], []]);
    });

    test('should handle objects with missing keys', () => {
      const objects = [
        { id: '1', name: 'John' },
        { id: '2', age: 25 },
      ];

      const result = extractArraysByKeys(objects, ['id', 'name', 'age']);

      expect(result).toEqual([
        ['1', '2'],
        ['John', undefined],
        [undefined, 25],
      ]);
    });
  });
});
