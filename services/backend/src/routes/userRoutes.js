const express = require('express');
const { registerUser, loginUser, getUsers } = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/', getUsers);




router.get("/profile", verifyToken, (req, res) => {
  res.json({
    msg: "Acceso autorizado",
    user: req.user,
  });
});

module.exports = router;
