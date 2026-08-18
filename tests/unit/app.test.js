// Tests for the real application wiring in app.js.
//
// The file this replaces (tests/unit/index.test.js) hand-built a throwaway
// Express app inside beforeEach and asserted against that, so it exercised none
// of the production code -- index.js sat at 0% coverage while the suite was
// green, and two of its assertions contradicted the real app outright (it
// expected the 404 body to echo req.path, and expected an Access-Control-Allow-
// Origin of '*'; the real app deliberately does neither). It also duplicated the
// request-logging middleware, which is why one defect produced two CodeQL
// js/log-injection alerts (see #60).

const request = require('supertest');

const LF = String.fromCharCode(10);
const CR = String.fromCharCode(13);

// Reload app.js (and the config it closes over) under a specific environment.
const loadAppWith = env => {
  const saved = { ...process.env };
  Object.assign(process.env, env);
  let mod;
  try {
    jest.resetModules();
    mod = require('../../app');
  } finally {
    for (const key of Object.keys(process.env)) {
      delete process.env[key];
    }
    Object.assign(process.env, saved);
    jest.resetModules();
  }
  return mod;
};

describe('app.js - application wiring', () => {
  let app;

  beforeEach(() => {
    jest.resetModules();
    app = require('../../app');
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('health check', () => {
    test('GET /health reports healthy without authentication', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'openai-content-moderator');
      expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false);
    });
  });

  describe('404 handler', () => {
    test('returns a static message and does not reflect the requested path', async () => {
      const response = await request(app).get('/no-such-endpoint-abc123').expect(404);

      expect(response.body).toEqual({
        error: 'Not found',
        message: 'The requested endpoint does not exist.',
      });
      // Reflecting the path would put attacker-controlled text in the response.
      expect(JSON.stringify(response.body)).not.toContain('no-such-endpoint-abc123');
    });
  });

  describe('security headers', () => {
    test('helmet is applied', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).not.toHaveProperty('x-powered-by');
    });
  });

  describe('CORS', () => {
    test('an origin outside the allowlist is rejected', async () => {
      // CORS_ORIGIN is unset in tests, so the allowlist is empty and every
      // browser origin should be refused.
      const response = await request(app).get('/health').set('Origin', 'https://evil.example');

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test('a request with no Origin header is allowed through', async () => {
      await request(app).get('/health').expect(200);
    });

    test('a wildcard allowlist is refused at startup', () => {
      expect(() => loadAppWith({ CORS_ORIGIN: '*' })).toThrow(/cannot contain/i);
    });
  });

  describe('request logging', () => {
    test('logs the method and path on a single line', async () => {
      await request(app).get('/health').expect(200);

      expect(console.log).toHaveBeenCalledTimes(1);
      const line = console.log.mock.calls[0][0];
      expect(line).toContain('GET /health');
      expect(line.split(LF)).toHaveLength(1);
    });

    test('a percent-encoded newline in the path cannot forge a second log line', async () => {
      await request(app).get('/a%0Ainjected').expect(404);

      const line = console.log.mock.calls[0][0];
      expect(line).not.toContain(LF);
      expect(line).not.toContain(CR);
      // Express does not percent-decode req.path, so the escape stays literal.
      expect(line).toContain('/a%0Ainjected');
      expect(line.split(LF)).toHaveLength(1);
    });
  });

  describe('API key authentication', () => {
    // authenticateApiKey reads process.env at request time, not at module load,
    // so these set the variable for the duration of the request rather than
    // rebuilding the app.
    const withSecret = async (value, fn) => {
      const had = Object.prototype.hasOwnProperty.call(process.env, 'API_SECRET_KEY');
      const previous = process.env.API_SECRET_KEY;
      process.env.API_SECRET_KEY = value;
      try {
        return await fn();
      } finally {
        if (had) {
          process.env.API_SECRET_KEY = previous;
        } else {
          delete process.env.API_SECRET_KEY;
        }
      }
    };

    test('is skipped when API_SECRET_KEY is unset (development default)', async () => {
      const response = await request(app).get('/api/moderation/models');

      expect(response.status).toBe(200);
    });

    test('rejects a request with no key when API_SECRET_KEY is set', async () => {
      const response = await withSecret('secret-under-test', () =>
        request(app).get('/api/moderation/models')
      );

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    test('rejects a request with the wrong key', async () => {
      const response = await withSecret('secret-under-test', () =>
        request(app).get('/api/moderation/models').set('x-api-key', 'wrong')
      );

      expect(response.status).toBe(401);
    });

    test('accepts a request carrying the correct key', async () => {
      const response = await withSecret('secret-under-test', () =>
        request(app).get('/api/moderation/models').set('x-api-key', 'secret-under-test')
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('models');
    });

    test('refuses to build the app at all in production with no API_SECRET_KEY', () => {
      expect(() => loadAppWith({ NODE_ENV: 'production', API_SECRET_KEY: '' })).toThrow(
        /API_SECRET_KEY must be set/
      );
    });

    test('builds normally in production once API_SECRET_KEY is present', () => {
      expect(() =>
        loadAppWith({ NODE_ENV: 'production', API_SECRET_KEY: 'a-real-key' })
      ).not.toThrow();
    });
  });
});
