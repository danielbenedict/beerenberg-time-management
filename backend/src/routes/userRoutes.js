const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, getDepartmentsAndRoles } = require('../controllers/userController');

// Task 1.2 Routes
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.get('/metadata', getDepartmentsAndRoles);

module.exports = router;