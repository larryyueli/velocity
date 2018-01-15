// server related configuration
const port = 8000;
exports.port = port;
const urlencoded = true;
exports.urlencoded = urlencoded;

// database related configuration
const default_db_host = 'localhost';
exports.default_db_host = default_db_host;
const default_db_port = 27017;
exports.default_db_port = default_db_port;
const default_db_name = 'quizzard';
exports.default_db_name = default_db_name;

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
const languageOptions = ['en'];
exports.secureSessionCookie = languageOptions;
const defaultLanguage = 'en';
exports.secureSessionCookie = defaultLanguage;