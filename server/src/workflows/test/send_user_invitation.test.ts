import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

import { sendUserInvitation } from '../send_user_invitation';
import { Gender } from '@common/server-api/types/gender';
import { createChurch } from '@server/models/churches_storage';
import { createAdminUser } from '@server/models/users_storage';
import { FakeServicesBuilder } from '@server/services/test/fake_services_builder';
import { setupTestDb, teardownTestDb } from '@server/test/db_test_helper';
import { WorkflowName, WorkflowParams } from '@server/types/workflows';

describe('sendUserInvitation', () => {
  let services: FakeServicesBuilder;
  let churchId: string;
  let adminUserId: string;

  beforeEach(async () => {
    await setupTestDb();
    services = new FakeServicesBuilder();

    churchId = await createChurch({
      name: 'Grace Community Church',
      address: '123 Main St, Anytown, USA',
      city: 'Anytown',
      state: 'CA',
      zip: '12345',
      county: 'Anytown',
      email: 'admin@gracechurch.com',
    });

    const adminUser = await createAdminUser({
      churchId,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      gender: Gender.Male,
      passwordHash: 'password123',
    });
    adminUserId = adminUser.userId;
  });

  afterEach(async () => {
    await teardownTestDb();
  });

  test('should generate invitation code and send email', async () => {
    const params: WorkflowParams<WorkflowName.InviteUser> = {
      type: WorkflowName.InviteUser,
      runId: 'test-run-id',
      payload: {
        targetEmail: 'newuser@example.com',
        churchId,
        createdByUserId: adminUserId,
      },
    };

    await sendUserInvitation(services, params);

    expect(services.email.sentEmails).toHaveLength(1);
    expect(services.email.sentEmails[0].to).toBe('newuser@example.com');
    expect(services.email.sentEmails[0].subject).toContain('Grace Community Church');
    expect(services.email.sentEmails[0].html).toContain('Grace Community Church');
    expect(services.email.sentEmails[0].html).toContain('/portal/invite?code=');
  });

  test('should handle missing church gracefully', async () => {
    const params: WorkflowParams<WorkflowName.InviteUser> = {
      type: WorkflowName.InviteUser,
      runId: 'test-run-id',
      payload: {
        targetEmail: 'newuser@example.com',
        churchId: '00000000-0000-0000-0000-000000000000',
        createdByUserId: adminUserId,
      },
    };

    // generateInvitationCode will fail because the churchId FK doesn't exist
    await expect(sendUserInvitation(services, params)).rejects.toThrow();
  });
});
