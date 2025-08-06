// ✅ File: backend/app.js

// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');

// const sequelize = require('./utils/database'); // ✅ corrected path
// const authRoutes = require('./routes/authRoutes');
// const docRoutes = require('./routes/docRoutes');

// const app = express();

// // Middleware
// app.use(cors());
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/upload', docRoutes);

// // Health Check
// app.get('/', (req, res) => {
//   res.send('Lone Bot AI Backend Running');
// });

// module.exports = app;

const express = require('express');

const bodyParser = require('body-parser');
const cors = require('cors');



const app = express();

app.use(cors());
app.use(bodyParser.json());
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
const docRoutes = require('./routes/docRoutes'); 
app.use('/api/upload', docRoutes); // ✅ Route defined here


app.get('/', (req, res) => res.send('Lone Bot AI Backend Running'));

module.exports = app;
