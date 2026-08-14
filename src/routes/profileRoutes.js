const express = require('express');
const {
  getMyProfile,
  upsertMyProfile,
  deleteMyProfile,
} = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // all profile routes require auth

router.get('/me', getMyProfile);
router.put('/me', upsertMyProfile);
router.delete('/me', deleteMyProfile);

module.exports = router;
