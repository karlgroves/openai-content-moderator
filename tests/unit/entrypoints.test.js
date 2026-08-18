// Regression tests for #59.
//
// Before the app.js extraction, lambda.js did `require('./app')` against a file
// that did not exist on any tracked path, so every deploy produced a function
// that threw MODULE_NOT_FOUND on first invocation. Nothing caught it: lambda.js
// had no test, was absent from collectCoverageFrom, and no CI job ever resolved
// the deployment artifact. These tests load each entry point for real.

describe('entry points', () => {
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  test('app.js exports a configured Express application', () => {
    jest.resetModules();
    const app = require('../../app');

    expect(typeof app).toBe('function');
    expect(typeof app.listen).toBe('function');
    expect(typeof app.use).toBe('function');
  });

  test('lambda.js resolves its dependencies and exports a handler', () => {
    jest.resetModules();
    const lambda = require('../../lambda');

    expect(lambda).toHaveProperty('handler');
    expect(typeof lambda.handler).toBe('function');
  });

  test('lambda.js wraps the same app instance that app.js exports', () => {
    jest.resetModules();
    const app = require('../../app');
    // Requiring lambda must not construct a second, divergent application.
    expect(() => require('../../lambda')).not.toThrow();
    expect(require('../../app')).toBe(app);
  });

  test('requiring index.js does not bind a port', () => {
    jest.resetModules();
    const app = require('../../app');
    const listenSpy = jest.spyOn(app, 'listen').mockImplementation(() => ({ close() {} }));

    const indexExport = require('../../index');

    expect(listenSpy).not.toHaveBeenCalled();
    expect(indexExport).toBe(app);
  });
});
