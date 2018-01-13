// TODO: license
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const pug = require('pug');
const app = express();

const config = require(`${__dirname}/Backend/config.js`);

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

app.listen(config.port, function () {
    console.log(`app is listening on port ${config.port}`);
});

app.get('/', function (req, res) {
    return res.status(200).send('hello world');
});