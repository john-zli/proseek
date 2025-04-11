import { Router, Request, Response } from 'express';
import { createPrayerRequestWithChurchAssignment, listPrayerRequests, assignPrayerRequest } from '../models/prayer_requests_storage';
import { getUser } from '../models/users_storage';

const router = Router();

// Create a new prayer request
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      requestSummary,
      requestContactEmail,
      requestContactPhone,
      requestContactName,
      requestContactMethod,
      zip,
      county,
      city
    } = req.body;

    if (!requestSummary) {
      return res.status(400).json({ error: 'Prayer request summary is required' });
    }

    const prayerRequest = await createPrayerRequestWithChurchAssignment({
      requestSummary,
      requestContactEmail,
      requestContactPhone,
      requestContactName,
      requestContactMethod,
      zip,
      county,
      city
    });

    res.status(201).json(prayerRequest);
  } catch (error) {
    console.error('Error creating prayer request:', error);
    res.status(500).json({ error: 'Failed to create prayer request' });
  }
});

// List prayer requests for a church
router.get('/church/:churchId', async (req: Request, res: Response) => {
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
router.post('/:requestId/assign', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const user = await getUser(req.user!.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const prayerRequest = await assignPrayerRequest(requestId, user.userId, user.churchId);
    if (!prayerRequest) {
      return res.status(404).json({ error: 'Prayer request not found or not assigned to your church' });
    }

    res.json(prayerRequest);
  } catch (error) {
    console.error('Error assigning prayer request:', error);
    res.status(500).json({ error: 'Failed to assign prayer request' });
  }
});

export default router; 