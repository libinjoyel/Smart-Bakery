const { configureApp } = require('./config/app');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { testConnection } = require('./config/database');

const app = configureApp();

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Bakery API is healthy',
  });
});

app.use('/api', routes);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Smart Bakery API running on http://localhost:${PORT}`);
  testConnection()
    .then(() => {
      console.log('PostgreSQL database connection verified.');
    })
    .catch((error) => {
      console.error(`Database connection warning: ${error.message}`);
    });
});

module.exports = app;
