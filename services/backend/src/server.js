const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const db = require('./config/db');
const userRoutes = require("./routes/userRoutes.js");
const reservaRoutes = require("./routes/reservaRoutes.js");
const tramiteRoutes = require("./routes/tramiteRoutes.js");

dotenv.config({ path: "../../../.env" });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/tramites', tramiteRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    db.testDBConnection();
}); 