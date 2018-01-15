const fs = require('fs');
const common = require('./common.js');

var dateStamp;
var logger;

/**
 * print a normal message
 * 
 * @param {string} text 
 */
exports.log = function (text) {
    init();

    var txt = common.formatString('[{0}] log: {1}', [common.getDate(), text]);
    console.log(txt);
}

/**
 * print an error message
 * 
 * @param {string} text 
 */
exports.error = function (text) {
    init();

    var txt = common.formatString('[{0}] error: {1}', [common.getDate(), text]);
    console.error(txt);
}

/**
 * initiate the logging with file
 */
var init = function () {
    var currentDate = common.getDateByFormat('YYYY-MM-DD');
    if (!process.env.DEBUG && dateStamp !== currentDate) {
        dateStamp = currentDate;
        logger = fs.createWriteStream(__dirname + '/../logs/'+dateStamp+'.log', {'flags':'a'});
        process.stdout.write = process.stderr.write = logger.write.bind(logger);
        process.on('uncaughtException', function(err) {
                console.error((err && err.stack) ? err.stack : err);
            }
        );
    }
}