// Configuración de la base de datos (ejemplo)
module.exports = {
  development: {
    port: process.env.DB_PORT || 5432,
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'development_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  },
  
  production: {
    port: process.env.DB_PORT || 5432,
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'production_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  }
};