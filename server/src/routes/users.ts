import { Router } from 'express';

import { validate } from '../middleware/validate';
import { CreateUserSchema } from '../schemas/users';

const router = Router();

// Create a new user
router.post('/', validate(CreateUserSchema), async (req, res) => {
  try {
    const { email, firstName, lastName, churchId } = req.body;

    // TODO: Implement user creation logic
    const user = {
      id: 'temp-id', // Replace with actual ID from database
      churchId,
      email,
      firstName,
      lastName,
      createdAt: new Date().toISOString(),
    };

    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

export default router;
