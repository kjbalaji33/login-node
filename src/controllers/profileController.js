const profileService = require('../services/profileService');
const { success } = require('../utils/response');

const getMyProfile = async (req, res, next) => {
  try {
    const profile = await profileService.getProfile(req.user.id);
    return success(res, 200, 'Profile fetched successfully', { profile });
  } catch (err) {
    next(err);
  }
};

const upsertMyProfile = async (req, res, next) => {
  try {
    const { bio, avatarUrl, phone, address } = req.body;
    const profile = await profileService.upsertProfile(req.user.id, {
      bio,
      avatarUrl,
      phone,
      address,
    });
    return success(res, 200, 'Profile saved successfully', { profile });
  } catch (err) {
    next(err);
  }
};

const deleteMyProfile = async (req, res, next) => {
  try {
    await profileService.deleteProfile(req.user.id);
    return success(res, 200, 'Profile deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyProfile, upsertMyProfile, deleteMyProfile };
