// // // File: backend/server.js

// // const express = require('express');
// // const cors = require('cors');
// // const dotenv = require('dotenv');
// // const authRoutes = require('./routes/authRoutes');
// // const sequelize = require('./utils/database');
// // const useser = require('./models/User');
// // const app = require('./app');

// // // const uploadRoutes = require('./routes/docRoutes');
// // // const authRoutes = require('./routes/authRoutes');
// // // Load environment variables from .env file
// // dotenv.config();

// // // const app = express();
// // const PORT = process.env.PORT || 5000;
// // // app.use('/api', uploadRoutes);

// // // Middleware
// // app.use(cors());
// // app.use(express.json());
// // app.use('/api/auth', authRoutes);

// // // Routes
// // app.use('/api/auth', authRoutes);

// // // Root route
// // app.get('/', (req, res) => {
// //   res.send('Lone Bot AI Backend Running');
// // });

// // sequelize.sync()
// //   .then(() => {
// //     console.log('Database synced ✅');
// //     app.listen(PORT, () => {
// //       console.log(`Server running on port ${PORT}`);
// //     });
// //   })
// //   .catch((err) => console.log('Error syncing DB: ', err));

// // // // Start server
// // // app.listen(PORT, () => {
// // //   console.log(`Server running on http://localhost:${PORT}`);
// // // });
// // ✅ File: backend/app.js

// const dotenv = require('dotenv');
// dotenv.config();

// const app = require('./app');
// const sequelize = require('./utils/database');

// const PORT = process.env.PORT || 5000;

// console.log('🟡 Starting server setup...');

// sequelize.sync()
//   .then(() => {
//     console.log('✅ Database synced');
//     app.listen(PORT, () => {
//       console.log(`🚀 Server running on http://localhost:${PORT}`);
//     });
//   })
//   .catch((err) => console.error('❌ Error syncing DB:', err));


// ✅ File: backend/server.js

const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const sequelize = require('./utils/database');

const PORT = process.env.PORT || 5000;

console.log('🟡 Starting server setup...');

sequelize.sync({alter: true}) // Use alter: true for development to auto-update schema
  .then(() => {
    console.log('✅ Database synced');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error('❌ Error syncing DB:', err));
