const profileModel = require('../models/profileModel');

const getProfile = async (userId) => {
  const profile = await profileModel.findByUserId(userId);
  if (!profile) {
    const err = new Error('Profile not found');
    err.statusCode = 404;
    throw err;
  }
  return profile;
};

const upsertProfile = async (userId, fields) => {
  const existing = await profileModel.findByUserId(userId);

  if (!existing) {
    return profileModel.create({
      userId,
      bio: fields.bio,
      avatarUrl: fields.avatarUrl,
      phone: fields.phone,
      address: fields.address,
    });
  }

  const allowedFields = ['bio', 'avatar_url', 'phone', 'address'];
  // Map camelCase input to snake_case columns
  const columnMap = { bio: 'bio', avatarUrl: 'avatar_url', phone: 'phone', address: 'address' };
  const filtered = {};
  Object.entries(fields).forEach(([key, value]) => {
    const column = columnMap[key];
    if (column && allowedFields.includes(column) && value !== undefined) {
      filtered[column] = value;
    }
  });

  return profileModel.updateByUserId(userId, filtered);
};

const deleteProfile = async (userId) => {
  const deleted = await profileModel.deleteByUserId(userId);
  if (!deleted) {
    const err = new Error('Profile not found');
    err.statusCode = 404;
    throw err;
  }
  return true;
};

module.exports = { getProfile, upsertProfile, deleteProfile };
