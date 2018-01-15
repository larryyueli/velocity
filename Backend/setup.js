const rls = require('readline-sync');

const common = require(`${__dirname}/common.js`);
const db = require(`${__dirname}/db.js`);
const logger = require(`${__dirname}/logger.js`);

/**
 * add an admin account
 */
const setupAdminAccount = function () {
    logger.info('Quizzard server setup');
    logger.info('Creating administrator account.');

    const username = rls.question('Please enter a username: ');
    const password = rls.question('Enter a password: ', {
        hideEchoBack: true,
        mask: '*'
    });
    const password2 = rls.question('Confirm your password: ', {
        hideEchoBack: true,
        mask: '*'
    });

    if (password !== password2) {
        logger.error('Your passwords do not match, please try again.');
        process.exit(1);
    }

    const user = {
        username: username,
        password: password,
        fname: username,
        lname: username
    };

    db.initialize(function (err, result) {
        if (err) {
            logger.error(JSON.stringify(err));
            process.exit(1);
        }

        users.addAdmin(user, function (err, res) {
            if (err) {
                logger.error(JSON.stringify(err));
                process.exit(1);
            }

            logger.info('Administrator account created.');
            process.exit(0);
        });
    });
}

setupAdminAccount();