const fs = require('fs');

const common = require('./common.js');

var dateStamp;

/**
 * print an info message
 * 
 * @param {string} text 
 */
exports.info = function (text) {
    init();

    const txt = `[{${common.getDate()}}] info: ${text}`;
    console.log(txt);
}

/**
 * print an error message
 * 
 * @param {string} text 
 */
exports.error = function (text) {
    init();

    const txt = `[{${common.getDate()}}] error: ${text}`;
    console.error(txt);
}

/**
 * initiate the logging with file
 */
const init = function () {
    const currentDate = common.getDateFormatted('YYYY-MM-DD');
    if (!process.env.DEBUG && dateStamp !== currentDate) {
        dateStamp = currentDate;
        const logger = fs.createWriteStream(`${__dirname}/../Logs/${dateStamp}.log`, { 'flags': 'a' });
        process.stdout.write = process.stderr.write = logger.write.bind(logger);
        process.on('uncaughtException', function (err) {
            console.error((err && err.stack) ? err.stack : err);
        });
    }
}