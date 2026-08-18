const app = require('./app');
const config = require('./config');

const PORT = config.server.port;

// Only bind a port when this file is the process entry point, so that requiring
// it from tests or tooling does not start a listener. Serverless deployments go
// through lambda.js, which wraps the same ./app export.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${config.server.env}`);
  });
}

module.exports = app;
