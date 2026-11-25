const express = require('express');
const cors = require('cors');

const configureApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  return app;
};

module.exports = { configureApp };
