// TODO: license
const bodyParser = require('body-parser');
const express = require('express');
const i18n = require("i18n");
const pug = require('pug');
const session = require('express-session');

const config = require(`${__dirname}/Backend/config.js`);
const logger = require(`${__dirname}/Backend/logger.js`);

const app = express();

// File names to render
const loginPage = 'login';

// Setting up i18n library
i18n.configure({
    locales: config.languageOptions,
    defaultLocale: config.defaultLanguage,
    directory: `${__dirname}/Locales`,
    objectNotation: true
});

app.set('view engine', 'pug');

app.use('/jquery', express.static(`${__dirname}/node_modules/jquery/dist/`));
app.use('/bootstrap', express.static(`${__dirname}/node_modules/bootstrap/dist`));
app.use('/materializecss', express.static(`${__dirname}/node_modules/materialize-css/dist`));
app.use(express.static(`${__dirname}/UI`));
app.use(bodyParser.urlencoded({ extended: config.urlencoded }));

app.use(session({
    secret: config.sessionSecret,
    resave: config.sessionResave,
    saveUninitialized: config.saveUninitializedSession,
    rolling: config.rollingSession,
    cookie: {
        secure: config.secureSessionCookie,
        maxAge: config.maxSessionAge
    }
}));

app.use(function(req, res, next) {
    res.locals.__ = res.__ = function() {
        return i18n.__.apply(req, arguments);
    };

    next();
});

app.listen(config.port, function () {
    logger.info(`app is listening on port ${config.port}`);
});

app.get('/', function (req, res) {
    return res.status(200).render(loginPage);
});