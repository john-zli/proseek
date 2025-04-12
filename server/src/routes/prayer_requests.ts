import { Router } from 'express';

import { validate } from '../middleware/validate';
import {
  assignPrayerRequest,
  createPrayerRequestWithChurchAssignment,
  listPrayerRequests,
} from '../models/prayer_requests_storage';
import { getUser } from '../models/users_storage';
import {
  AssignPrayerRequestSchema,
  CreatePrayerRequestSchema,
  ListPrayerRequestsSchema,
} from '../schemas/prayer_requests';

const router = Router();

// Create a new prayer request
router.post('/', validate(CreatePrayerRequestSchema), async (req, res) => {
  try {
    const {
      requestSummary,
      requestContactEmail,
      requestContactPhone,
      requestContactName,
      requestContactMethod,
      zip,
      county,
      city,
    } = req.body;

    const prayerRequest = await createPrayerRequestWithChurchAssignment({
      requestSummary,
      requestContactEmail,
      requestContactPhone,
      requestContactName,
      requestContactMethod,
      zip,
      county,
      city,
    });

    res.status(201).json(prayerRequest);
  } catch (error) {
    console.error('Error creating prayer request:', error);
    res.status(500).json({ error: 'Failed to create prayer request' });
  }
});

// List prayer requests for a church
router.get('/church/:churchId', validate(ListPrayerRequestsSchema), async (req, res) => {
  try {
    const { churchId } = req.params;
    const prayerRequests = await listPrayerRequests({ churchId });
    res.json(prayerRequests);
  } catch (error) {
    console.error('Error listing prayer requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign a prayer request to a user
router.post('/:requestId/assign', validate(AssignPrayerRequestSchema), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { userId } = req.body;

    const user = await getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const prayerRequest = await assignPrayerRequest(requestId, user.userId, user.churchId);
    if (!prayerRequest) {
      return res.status(404).json({ error: 'Prayer request not found or not assigned to your church' });
    }

    res.status(200).json(prayerRequest);
  } catch (error) {
    console.error('Error assigning prayer request:', error);
    res.status(500).json({ error: 'Failed to assign prayer request' });
  }
});

export default router;
