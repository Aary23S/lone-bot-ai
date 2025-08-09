// const express = require('express');
// const app = express();
// const cors = require('cors');
// const dotenv = require('dotenv');
// const { sequelize } = require('./models');

// dotenv.config();
// app.use(cors());
// app.use(express.json());

// // Routes here...
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/upload', docRoutes);

// sequelize.sync({ force: true }) // or force: false
//   .then(() => {
//     console.log('✅ Database synced successfully');
//     const PORT = process.env.PORT || 5000;
//     app.listen(PORT, () => {
//       console.log(`🚀 Server running on http://localhost:${PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.error('❌ Failed to start server:', err);
//   });
const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize } = require('./models');

// ✅ Load environment variables
dotenv.config();

// ✅ Middlewares
app.use(cors());
app.use(express.json());


// ✅ Import routes
const authRoutes = require('./routes/authRoutes');
const docRoutes = require('./routes/docRoutes'); // 👈 You forgot this

// ✅ Register routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', docRoutes); // Now works
app.use('/api/admin', require('./routes/adminRoutes'));

// ✅ Database sync and server start
sequelize.sync({ force: false }) // change to false so it won't drop tables
  .then(() => {
    console.log('✅ Database synced successfully');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to start server:', err);
  });
