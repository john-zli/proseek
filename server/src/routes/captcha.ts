import { Router } from 'express';

import Cap from '@cap.js/server';

const router = Router();
const cap = new Cap({
  tokens_store_path: '.data/tokensList.json',
});

// Create a new challenge
router.post('/challenge', (req, res) => {
  res.json(cap.createChallenge());
});

// Redeem a challenge
router.post('/redeem', async (req, res) => {
  const { token, solutions } = req.body;

  if (!token || !solutions) {
    res.status(400).json({ success: false });
    return;
  }

  res.json(await cap.redeemChallenge({ token, solutions }));
});

export default router;
