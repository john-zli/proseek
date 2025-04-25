import { Router } from 'express';

import { getCap } from '@server/captcha';

const router = Router();

// Create a new challenge
router.post('/challenge', (req, res) => {
  res.json(getCap().createChallenge());
});

// Redeem a challenge
router.post('/redeem', async (req, res) => {
  const { token, solutions } = req.body;

  if (!token || !solutions) {
    res.status(400).json({ success: false });
    return;
  }

  const cap = getCap();
  res.json(await cap.redeemChallenge({ token, solutions }));
});

export default router;
