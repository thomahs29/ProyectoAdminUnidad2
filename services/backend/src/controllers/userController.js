const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createUser, getUserByEmail, getAllUsers, getUserByRut} = require('../models/userModel');
const dotenv = require('dotenv');
const redisClient = require('../config/redis');

dotenv.config({ path: "../../../.env" });

const genToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, rut: user.rut, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES || "1h" }
    );
};

const registerUser = async (req, res) => {
    try {
        const { rut, nombre, email, password, role } = req.body;

        //revisar formato del rut CONSTRAINT
        // CONSTRAINT usuarios_rut_check CHECK (CHECK (((rut)::text ~ '^[0-9]{7,8}-[0-9Kk]$'::text)))
        
        const rutPattern = /^[0-9]{7,8}-[0-9Kk]$/;
        if (!rutPattern.test(rut)) {
            return res.status(400).json({ message: 'Invalid RUT format' });
        }

        if (!rut || !nombre || !email || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const exitingUser = await getUserByEmail(email);
        if (exitingUser) {
            return res.status(409).json({ message: 'Email already in use' });
        }
        const exitingRut = await getUserByRut(rut);
        if (exitingRut) {
            return res.status(409).json({ message: 'RUT already in use' });
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
        const { rut, password } = req.body;

        if (!rut || !password) {
            return res.status(400).json({ message: 'Missing rut or password' });
        }

        const user = await getUserByRut(rut);
        if (!user) {
            return res.status(401).json({ message: 'Invalid rut or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid rut or password' });
        }

        const token = genToken(user);

        await redisClient.set(`user_token_${user.id}`, token, 'EX', 3600);
        
        res.status(200).json({
            msg: "Login exitoso.",
            user: { id: user.id, nombre: user.nombre, email: user.email, rut: user.rut, role: user.role },
            token,
        });
    } catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getUsers = async (req, res) => {
    try {
        const users = await getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUsers
};