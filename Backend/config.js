// server related configuration
const port = 8000;
exports.port = port;

// session related configuration
const maxSessionAge = 60 * 60 * 1000;
exports.maxSessionAge = maxSessionAge;
const sessionSecret = 'test';
exports.sessionSecret = sessionSecret;
const sessionResave = false;
exports.sessionResave = sessionResave;
const saveUninitializedSession = false;
exports.saveUninitializedSession = saveUninitializedSession;
const rollingSession = true;
exports.rollingSession = rollingSession;
const secureSessionCookie = false;
exports.secureSessionCookie = secureSessionCookie;