// server related configuration
const port = 8000;
exports.port = port;

// session related configuration
const maxSessionAge = 60 * 60 * 1000;
const sessionSecret = 'test';
const sessionResave = false;
const saveUninitializedSession = false;
const rollingSession = true;
const secureSessionCookie = false;
exports.sessionSecret = 'test';
exports.sessionResave = false;
exports.saveUninitializedSession = false;
exports.rollingSession = true;
exports.secureSessionCookie = false;
exports.maxSessionAge = maxSessionAge;
