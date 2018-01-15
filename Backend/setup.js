const rls = require('readline-sync');
const users = require('./users.js');
const common = require('./common.js');
const logger = require('./logger.js');

const setupAdminAccount = function () {

    logger.log('Quizzard server setup');
    logger.log('Creating administrator account.');

    let user = rls.question('Please enter username: ');
    let pass = rls.question('Enter password: ', {
        hideEchoBack: true,
        mask: ''
    });
    let pass2 = rls.question('Confirm password: ', {
        hideEchoBack: true,
        mask: ''
    });

    if (pass != pass2) {
        logger.error('Passwords do not match.');
        process.exit(1);
    }
    setupAdminAccount(user, pass);
    var acc = {
        username: accid,
        password: pass,
        fname: accid,
        lname: accid
    };

    db.initialize(function (err, result) {
        if (err) {
            logger.error(JSON.stringify(err));
            process.exit(1);
        }

        users.addAdmin(acc, function (err, res) {
            if (err) {
                if (err.code === 2014) {
                    logger.error('Could not create account. Please try again.');
                    process.exit(1);
                } else if (err.code === 2019) {
                    logger.error('Account with username exists.');
                    process.exit(1);
                }
                logger.error(JSON.stringify(err));
                process.exit(1);
            }

            logger.log('Administrator account created.');
            process.exit(0);
        });
    });
}

setupAdminAccount();