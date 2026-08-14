const userModel = require('../models/userModel');

const getAllUsers = async (pagination) => userModel.findAll(pagination);

const getUserById = async (id) => {
  const user = await userModel.findById(id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return user;
};

const updateUser = async (id, fields) => {
  const allowedFields = ['name', 'email'];
  const filtered = Object.fromEntries(
    Object.entries(fields).filter(([key]) => allowedFields.includes(key))
  );

  const updated = await userModel.updateById(id, filtered);
  if (!updated) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return updated;
};

const deleteUser = async (id) => {
  const deleted = await userModel.deleteById(id);
  if (!deleted) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return true;
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
