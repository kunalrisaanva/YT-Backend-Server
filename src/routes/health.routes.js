import { Router } from 'express';
import { healthcheck } from "../controllers/hearlthCheckController.js"

const router = Router();

router.route('/').get(healthcheck);

export default router