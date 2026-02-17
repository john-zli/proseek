import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

import { createChurch } from '../churches_storage';
import {
  $getUser,
  createAdminUser,
  createUser,
  generateInvitationCode,
  listChurchesForUser,
  listUsersFromChurch,
} from '../users_storage';
import { Gender } from '@common/server-api/types/gender';
import { setupTestDb, teardownTestDb } from '@server/test/db_test_helper';
import { v4 as uuidv4 } from 'uuid';

describe('users_storage', () => {
  let churchId: string;

  beforeEach(async () => {
    await setupTestDb();
    churchId = await createChurch({
      name: 'Test Church',
      address: '123 Main St',
      city: 'Test City',
      state: 'CA',
      zip: '12345',
      county: 'Test County',
      email: 'test@church.com',
    });
  });

  afterEach(async () => {
    await teardownTestDb();
  });

  describe('createAdminUser', () => {
    test('should create an admin user', async () => {
      const user = await createAdminUser({
        churchId,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        gender: Gender.Male,
        passwordHash: 'password',
      });

      expect(user).toEqual({
        userId: expect.any(String),
        churchIds: [churchId],
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        gender: Gender.Male,
      });
    });
  });

  describe('createUser', () => {
    let adminUserId: string;
    beforeEach(async () => {
      const adminUser = await createAdminUser({
        churchId,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        gender: Gender.Male,
        passwordHash: 'password',
      });
      adminUserId = adminUser.userId;
    });

    test('should create a regular user with valid invitation code', async () => {
      const invitationCode = await generateInvitationCode(churchId, adminUserId, 'test1@example.com');

      const user = await createUser({
        firstName: 'Test',
        lastName: 'User',
        email: 'test1@example.com',
        gender: Gender.Female,
        passwordHash: 'password',
        invitationCode,
      });

      expect(user).toEqual({
        userId: expect.any(String),
        churchIds: [churchId],
        firstName: 'Test',
        lastName: 'User',
        email: 'test1@example.com',
        gender: Gender.Female,
      });
    });
    test('should error with invalid invitation code', async () => {
      const invitationCode = 'invalid-code';

      await expect(
        createUser({
          firstName: 'Test',
          lastName: 'User',
          email: 'test1@example.com',
          gender: Gender.Female,
          passwordHash: 'password',
          invitationCode,
        })
      ).rejects.toThrow('INVALID_INVITATION_CODE');
    });

    test('should error if user email exists', async () => {
      const invitationCode = await generateInvitationCode(churchId, adminUserId, 'test1@example.com');

      await createUser({
        firstName: 'Test',
        lastName: 'User',
        email: 'test1@example.com',
        gender: Gender.Female,
        passwordHash: 'password',
        invitationCode,
      });

      const invitationCode2 = await generateInvitationCode(churchId, adminUserId, 'test1@example.com');

      // Create a user with the same email
      await expect(
        createUser({
          firstName: 'Test',
          lastName: 'User',
          email: 'test1@example.com',
          gender: Gender.Female,
          passwordHash: 'password',
          invitationCode: invitationCode2,
        })
      ).rejects.toThrow('USER_EMAIL_EXISTS');
    });
  });

  describe('$getUser', () => {
    test('should get a user by ID', async () => {
      const createdUser = await createAdminUser({
        churchId,
        firstName: 'Test',
        lastName: 'User',
        email: 'test1@example.com',
        gender: Gender.Male,
        passwordHash: 'password',
      });

      const user = await $getUser(createdUser.userId);

      expect(user).toEqual({
        userId: createdUser.userId,
        churchIds: [churchId],
        firstName: 'Test',
        lastName: 'User',
        email: 'test1@example.com',
        gender: Gender.Male,
        passwordHash: 'password',
        creationTimestamp: expect.any(Number),
        modificationTimestamp: expect.any(Number),
      });
    });

    test('should throw for non-existent user', async () => {
      await expect($getUser(uuidv4())).rejects.toThrow('No results found for command GetUser');
    });
  });

  describe('listUsers', () => {
    test('should list users by church ID', async () => {
      // Create two users in the same church
      const user1 = await createAdminUser({
        churchId,
        firstName: 'Test1',
        lastName: 'User1',
        email: 'test1@example.com',
        gender: Gender.Male,
        passwordHash: 'password1',
      });

      const user2 = await createAdminUser({
        churchId,
        firstName: 'Test2',
        lastName: 'User2',
        email: 'test2@example.com',
        gender: Gender.Female,
        passwordHash: 'password2',
      });

      // Create a user in a different church
      const otherChurchId = await createChurch({
        name: 'Other Church',
        address: '456 Other St',
        city: 'Other City',
        state: 'CA',
        zip: '67890',
        county: 'Other County',
        email: 'other@church.com',
      });

      await createAdminUser({
        churchId: otherChurchId,
        firstName: 'Other',
        lastName: 'User',
        email: 'other@example.com',
        gender: Gender.Male,
        passwordHash: 'password',
      });

      // List users for the first church
      const users = await listUsersFromChurch(churchId);

      expect(users).toHaveLength(2);
      expect(users).toEqual(
        expect.arrayContaining([
          {
            userId: user1.userId,
            firstName: 'Test1',
            lastName: 'User1',
            email: 'test1@example.com',
            gender: Gender.Male,
          },
          {
            userId: user2.userId,
            firstName: 'Test2',
            lastName: 'User2',
            email: 'test2@example.com',
            gender: Gender.Female,
          },
        ])
      );
    });

    test('should return empty array for non-existent church', async () => {
      const users = await listUsersFromChurch(uuidv4());
      expect(users).toEqual([]);
    });
  });

  describe('listChurchesForUser', () => {
    test('should list churches a user belongs to with roles', async () => {
      const user = await createAdminUser({
        churchId,
        firstName: 'Test',
        lastName: 'User',
        email: 'churches-test@example.com',
        gender: Gender.Male,
        passwordHash: 'password',
      });

      const churches = await listChurchesForUser(user.userId);

      expect(churches).toHaveLength(1);
      expect(churches[0]).toEqual({
        churchId,
        churchName: 'Test Church',
        role: 'Admin',
      });
    });

    test('should return empty array for non-existent user', async () => {
      const churches = await listChurchesForUser(uuidv4());
      expect(churches).toEqual([]);
    });
  });
});
