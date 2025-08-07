// ✅ File: backend/server.js

// ✅ backend/server.js

// const app = require('./app');
// const PORT = process.env.PORT || 5000;
// const sequelize = require('./utils/database');

// // ✅ Import models to register them with Sequelize
// require('./models'); // This registers User, Document, Chat etc.

// // ✅ Sync all models before starting server
// sequelize.sync().then(() => {
//   console.log('✅ Database synced');

//   app.listen(PORT, () => {
//     console.log(`🚀 Server running on http://localhost:${PORT}`);
//   });
// }).catch((err) => {
//   console.error('❌ Failed to sync database:', err);
// });
// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const authRoutes = require("./routes/authRoutes");
// const docRoutes = require("./routes/docRoutes");

// dotenv.config();
// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Mount API routes under `/api`
// app.use("/api/auth", authRoutes);
// app.use("/api", docRoutes); // This includes /upload, /ask, etc.

// // Health check
// app.get("/", (req, res) => res.send("✅ Lone Bot AI Backend Running"));

// app.listen(PORT, () => {
//   console.log(`🚀 Server listening on port ${PORT}`);
// });

// const app = require("./app");
// const dotenv = require("dotenv");
// const cors = require('cors');
// app.use(cors());

// dotenv.config();
// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });

// ✅ backend/server.js

// ✅ File: backend/server.js

const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await sequelize.sync({ alter: true });
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
  }
})();

