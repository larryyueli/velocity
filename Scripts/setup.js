/*
Copyright (C) 2018
Developed at University of Toronto

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

const fs = require('fs');
const rls = require('readline-sync');

const common = require('../Backend/common.js');
const config = require('../Backend/config.js');
const db = require('../Backend/db.js');
const logger = require('../Backend/logger.js');
const users = require('../Backend/users.js');

/**
 * add an admin account
 */
const setupAdminAccount = function () {
    config.debugMode = true;
    logger.info('Velocity server setup');

    const pathToConfigFile = `${__dirname}/../Backend/config.js`;

    const username = rls.question('Please enter your username: ');
    const fname = rls.question('Please enter your first name: ');
    const lname = rls.question('Please enter your last name: ');
    var password = rls.question('Enter your password: ', {
        hideEchoBack: true,
        mask: '*'
    });
    var password2 = rls.question('Confirm your password: ', {
        hideEchoBack: true,
        mask: '*'
    });

    while (password !== password2) {
        logger.error('Your passwords do not match, please try again.');
        password = rls.question('Enter your password: ', {
            hideEchoBack: true,
            mask: '*'
        });
        password2 = rls.question('Confirm your password: ', {
            hideEchoBack: true,
            mask: '*'
        });
    }

    const user = {
        username: username,
        password: password,
        fname: fname,
        lname: lname,
        type: common.userTypes.MODE_SELECTOR
    };

    fs.readFile(pathToConfigFile, 'utf8', function (err, data) {
        if (err) {
            logger.error(JSON.stringify(err));
            process.exit(1);
        }

        const newDbName = `velocity_db_${common.getUUID()}`;
        const newConfig = data.replace(/velocity_db_.+;/g, `${newDbName}';`);
        fs.writeFile(pathToConfigFile, newConfig, function (err) {
            if (err) {
                logger.error(JSON.stringify(err));
                process.exit(1);
            }

            config.default_db_name = newDbName;
            logger.info('The new configuration has been saved!');
            db.initialize(function (err, result) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    process.exit(1);
                }

                logger.info('Connection to Velocity database successful.');
                users.addUser(user, function (err, res) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        process.exit(1);
                    }

                    logger.info('Successful created mode selector account.');
                    process.exit(0);
                });
            });
        });
    });
}

setupAdminAccount();