import config from '@server/config';
import { getChurchById } from '@server/models/churches_storage';
import { generateInvitationCode } from '@server/models/users_storage';
import { logger } from '@server/services/logger';
import { IServicesBuilder } from '@server/services/services_builder';
import { WorkflowName, WorkflowParams } from '@server/types/workflows';

export async function sendUserInvitation(services: IServicesBuilder, params: WorkflowParams<WorkflowName.InviteUser>) {
  const { targetEmail, churchId, createdByUserId } = params.payload;

  logger.info({ targetEmail, churchId, createdByUserId }, 'Processing user invitation workflow');

  const invitationCode = await generateInvitationCode(churchId, createdByUserId, targetEmail);

  const church = await getChurchById(churchId);
  if (!church) {
    logger.error({ churchId }, 'Church not found');
    return;
  }

  const churchName = church.name;

  const inviteLink = `${config.clientUrl}/invite?code=${invitationCode}`;

  const html = `
    <h2>You've Been Invited to Join ${churchName} on ProSeek</h2>
    <p>You've been invited to join <strong>${churchName}</strong> on ProSeek, a platform that connects people seeking prayer with local churches and communities.</p>
    <p>Click the link below to accept your invitation and create your account:</p>
    <p><a href="${inviteLink}" style="display: inline-block; padding: 10px 20px; background: #4A90D9; color: white; text-decoration: none; border-radius: 4px;">Accept Invitation</a></p>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p>${inviteLink}</p>
  `;

  const sent = await services.email.sendEmail(targetEmail, `You're invited to join ${churchName} on Proseek`, html);

  if (sent) {
    logger.info({ targetEmail, churchId }, 'Invitation email sent successfully');
  } else {
    logger.error({ targetEmail, churchId }, 'Failed to send invitation email');
  }
}
