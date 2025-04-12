import { Router } from 'express';

import { validate } from '../middleware/validate';
import { CreateChurchSchema } from '../schemas/churches';

const router = Router();

// Create a new church
router.post('/', validate(CreateChurchSchema), async (req, res) => {
  try {
    const { name, address, city, state, zip, phone, email, website } = req.body;

    // TODO: Implement church creation logic
    const church = {
      id: 'temp-id', // Replace with actual ID from database
      name,
      address,
      city,
      state,
      zip,
      phone,
      email,
      website,
      createdAt: new Date().toISOString(),
    };

    res.status(201).json(church);
  } catch (error) {
    console.error('Error creating church:', error);
    res.status(500).json({ error: 'Failed to create church' });
  }
});

export default router;
