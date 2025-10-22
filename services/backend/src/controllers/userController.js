const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { createUser, getUserByEmail } = require('../models/userModel');
const dotenv = require('dotenv');

dotenv.config({ path: "../../../.env" });

const genToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES || "1h" }
    );
};

const registerUser = async (req, res) => {
    try {
        const { rut, nombre, email, password, role } = req.body;

        if (!rut || !nombre || !email || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const exitingUser = await getUserByEmail(email);
        if (exitingUser) {
            return res.status(409).json({ message: 'Email already in use' });
        }

        const newUser = await createUser({ rut, nombre, email, password, role });
        const token = genToken(newUser);

        res.status(201).json({
        msg: "Usuario registrado correctamente.",
        user: { id: newUser.id, nombre: newUser.nombre, email: newUser.email },
        token,
        });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Missing email or password' });
        }

        const user = await getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = genToken(user);
        res.status(200).json({
            msg: "Login exitoso.",
            user: { id: user.id, nombre: user.nombre, email: user.email, role: user.role },
            token,
        });
    } catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    registerUser,
    loginUser
};