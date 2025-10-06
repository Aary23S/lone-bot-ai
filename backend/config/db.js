/*
The config folder is a common convention in backend projects for keeping files 
that define how the application connects to external resources (like databases) and 
manages internal parameters (like retrieval settings). By placing configuration files here, 
the codebase becomes easier to maintain, update, and scale. It also keeps sensitive or 
environment-specific information separate from business logic, 
promoting better security and cleaner architecture. Other parts of the backend can 
import these configurations as needed, ensuring consistency throughout the application.
*/
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
  }
);

module.exports = sequelize;

// Module Importing (const { Sequelize } = require('sequelize'))

// Function: Brings the Sequelize library into the file, allowing you to use its features for database management.
// Way: Uses Node.js require syntax to import only the Sequelize class.
// Environment Variables (require('dotenv').config())

// Function: Loads configuration values (like database credentials) from a .env file into process.env.
// Way: The dotenv package reads the .env file and sets variables in the Node.js process, making them accessible via process.env.
// Database Connection (new Sequelize(...))

// Function: Establishes a connection to the MySQL database using the provided credentials and options.
// Way: Instantiates the Sequelize class with database name, user, password, and options (host, dialect, logging).
// Configuration via Environment Variables (process.env.DB_NAME, etc.)

// Function: Keeps sensitive information (like credentials) out of the codebase and allows easy configuration changes.
// Way: Reads values from the environment, which are set by dotenv, for use in the Sequelize constructor.
// Sequelize Options ({ host, dialect, logging })

// Function: Customizes the database connection (e.g., specifies MySQL, disables logging).
// Way: Passes an options object to the Sequelize constructor to set connection parameters.
// Module Exporting (module.exports = sequelize)

// Function: Makes the configured Sequelize instance available to other files in the project.
// Way: Uses Node.js module system to export the instance, so it can be imported elsewhere.
// Object-Oriented Programming (Instantiation of Sequelize)

// Function: Encapsulates database connection logic and provides methods for interacting with the database.
// Way: Creates an object (sequelize) from the Sequelize class, which manages all database operations.