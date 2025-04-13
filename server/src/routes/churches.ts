import { Router } from 'express';

import { validate } from '../middleware/validate';
import { createChurch } from '../models/churches_storage';
import { CreateChurchSchema } from '../schemas/churches';

const router = Router();

// Create a new church
router.post('/', validate(CreateChurchSchema), async (req, res) => {
  try {
    const { name, address, city, state, zip, phone, email, website } = req.body;

    const church = await createChurch({
      name,
      address,
      city,
      state,
      zip,
      county: city, // Using city as county for now
      phone,
      email,
      website,
    });

    res.status(201).json(church);
  } catch (error) {
    console.error('Error creating church:', error);
    res.status(500).json({ error: 'Failed to create church' });
  }
});

export default router;
