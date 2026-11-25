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

testConnection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Smart Bakery API connected to PostgreSQL and running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error(`Database connection failed: ${error.message}`);
    process.exitCode = 1;
  });

module.exports = app;
