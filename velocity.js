// TODO: license
const bodyParser = require('body-parser');
const config = require(`${__dirname}/Backend/config.js`);
const express = require('express');
const i18n = require("i18n");
const pug = require('pug');
const sass = require('node-sass');
const sassMiddleware = require('node-sass-middleware');
const session = require('express-session');

const app = express();

// File names to render
const login = 'login';
const modeSelectorPage = 'modeSelector';

// Setting up i18n library
i18n.configure({
    locales: config.languageOptions,
    defaultLocale: config.defaultLanguage,
    directory: `${__dirname}/locales`,
    objectNotation: true
});

app.set('view engine', 'pug');

app.use('/jquery', express.static(`${__dirname}/node_modules/jquery/dist/`));
app.use('/bootstrap', express.static(`${__dirname}/node_modules/bootstrap/dist`));
app.use('/materializecss', express.static(`${__dirname}/node_modules/materialize-css/dist`));
app.use('/animate', express.static(`${__dirname}/node_modules/animate.css/`));
app.use(
    sassMiddleware({
        src: `${__dirname}/sass`, 
        dest: `${__dirname}/UI/stylesheets`,
        prefix:  '/stylesheets',
        debug: true, // TODO: remove before release
        outputStyle: 'compressed'
    })
);
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
    console.log(`app is listening on port ${config.port}`);
});

app.get('/', function (req, res) {
    return res.status(200).render(login);
});