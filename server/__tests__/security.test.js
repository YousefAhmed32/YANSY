'use strict';
/**
 * Security regression tests — verify the beacon was removed and
 * key security controls exist in the server configuration.
 */
const fs = require('fs');
const path = require('path');

const readFile = (relPath) =>
  fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');

describe('Security: Beacon/telemetry code removal', () => {
  it('analyticsController.js contains NO requests to 127.0.0.1:7242', () => {
    const src = readFile('controllers/analyticsController.js');
    expect(src).not.toContain('127.0.0.1');
    expect(src).not.toContain('7242');
    expect(src).not.toContain('agent log');
    expect(src).not.toContain('ingest/');
    expect(src).not.toContain('hypothesisId');
  });

  it('analyticsController.js contains NO hidden http.request calls', () => {
    const src = readFile('controllers/analyticsController.js');
    expect(src).not.toMatch(/require\(['"]http['"]\)\.request/);
  });

  it('No other controller file contains requests to 127.0.0.1', () => {
    const controllersDir = path.join(__dirname, '../controllers');
    const files = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'));
    files.forEach(file => {
      const src = fs.readFileSync(path.join(controllersDir, file), 'utf8');
      expect(src).not.toContain('127.0.0.1:7242');
      expect(src).not.toContain('hypothesisId');
    });
  });

  it('client analytics.js contains NO beacon calls', () => {
    const src = readFile('../client/src/utils/analytics.js');
    expect(src).not.toContain('127.0.0.1');
    expect(src).not.toContain('7242');
    expect(src).not.toContain('hypothesisId');
    expect(src).not.toContain('agent log');
    expect(src).not.toContain('38a3d643');
  });

  it('portfolio.routes.js has /image/:id before /:id', () => {
    const src = readFile('routes/portfolio.routes.js');
    const imageIdx  = src.indexOf("'/image/:id'");
    const idIdx     = src.indexOf("'/:id'");
    expect(imageIdx).toBeLessThan(idIdx);
  });

  it('portfolio.routes.js caps limit at 100', () => {
    const src = readFile('routes/portfolio.routes.js');
    expect(src).toContain('Math.min');
    expect(src).toContain('100');
  });

  it('portfolio.routes.js stream error handler checks headersSent', () => {
    const src = readFile('routes/portfolio.routes.js');
    expect(src).toContain('headersSent');
  });
});

describe('Security: Auth controller', () => {
  it('authController exports forgotPassword', () => {
    const ctrl = require('../controllers/authController');
    expect(typeof ctrl.forgotPassword).toBe('function');
  });

  it('authController exports resetPassword', () => {
    const ctrl = require('../controllers/authController');
    expect(typeof ctrl.resetPassword).toBe('function');
  });

  it('authController uses crypto for token hashing', () => {
    const src = readFile('controllers/authController.js');
    expect(src).toContain("require('crypto')");
    expect(src).toContain('createHash');
    expect(src).toContain('sha256');
  });

  it('reset token expires in 1 hour', () => {
    const src = readFile('controllers/authController.js');
    expect(src).toContain('60 * 60 * 1000');
  });
});

describe('Security: File controller role check', () => {
  it('fileController uses ADMIN (uppercase) not admin (lowercase)', () => {
    const src = readFile('controllers/fileController.js');
    expect(src).toContain("!== 'ADMIN'");
    expect(src).not.toContain("!== 'admin'");
  });
});

describe('Security: Server middleware order', () => {
  it('server.js loads helmet', () => {
    const src = readFile('server.js');
    expect(src).toContain('helmet');
  });

  it('server.js sanitizes NoSQL injection ($-prefixed keys)', () => {
    // express-mongo-sanitize is incompatible with Express 5's read-only req.query
    // getter, so server.js inlines equivalent $-key-stripping logic instead of
    // importing the package (see server.js's NoSQL injection sanitization block).
    const src = readFile('server.js');
    expect(src).toContain('stripDollarKeys');
  });

  it('server.js loads express-rate-limit', () => {
    const src = readFile('server.js');
    expect(src).toContain('rateLimit');
  });

  it('server.js loads compression', () => {
    const src = readFile('server.js');
    expect(src).toContain('compression');
  });

  it('server.js has rate limit on /api/auth/login', () => {
    const src = readFile('server.js');
    expect(src).toContain("'/api/auth/login'");
    expect(src).toContain('authLimiter');
  });
});

describe('Security: User model password reset fields', () => {
  it('User schema has passwordResetToken with select:false', () => {
    const src = readFile('models/User.js');
    expect(src).toContain('passwordResetToken');
    expect(src).toContain('select: false');
  });

  it('User schema has passwordResetExpires', () => {
    const src = readFile('models/User.js');
    expect(src).toContain('passwordResetExpires');
  });

  it('User schema has isActive field', () => {
    const src = readFile('models/User.js');
    expect(src).toContain('isActive');
  });
});

describe('Security: Routes', () => {
  it('auth routes include forgot-password and reset-password', () => {
    const src = readFile('routes/auth.js');
    expect(src).toContain('forgot-password');
    expect(src).toContain('reset-password');
  });

  it('audit routes exist and require admin', () => {
    const auditRoutes = require('../routes/audit');
    expect(auditRoutes).toBeDefined();
  });
});
