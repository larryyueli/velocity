// TODO: license

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const pug = require('pug');
//const http = require('http');
const app = express();

app.use(express.static(__dirname + '/UI'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'test',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        secure: false,
        maxAge: 60 * 60 * 1000
    }
}));

//const httpServer = http.createServer();
//httpServer.listen(config.httpPort, function () {
//    logger.log(common.formatString('HTTP Server listening on http://{0}:{1}.', [config.hostName, config.httpPort]));
//});

app.listen(8001, function () {
    console.log("app is listening on port 8001");
});

app.get('/', function (req, res) {
    res.status(200).send('hello world');
});