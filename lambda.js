const serverless = require('serverless-http');
const app = require('./app');

// Export the serverless handler
module.exports.handler = serverless(app, {
  request: (request, event, context) => {
    // Add AWS context to request for logging
    request.awsContext = context;
    request.awsEvent = event;
  },
  response: (response, event, context) => {
    // Add custom headers if needed
    response.headers = response.headers || {};
    response.headers['X-Request-Id'] = context.awsRequestId;
  }
});