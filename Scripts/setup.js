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

"use strict";

const fs = require('fs');
const mongoClient = require('mongodb').MongoClient;
const rls = require('readline-sync');

const cfs = require('../Backend/customFileSystem.js');
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

    const mongoAdminUsername = rls.question('Enter mongo admin username: ');
    const mongoAdminPassword = rls.question('Enter mongo admin password: ', {
        hideEchoBack: true,
        mask: '*'
    });

    const url = `mongodb://${mongoAdminUsername}:${mongoAdminPassword}@${config.db_host}:${config.db_port}`;
    mongoClient.connect(url, function (err, client) {
        if (err) {
            logger.error(JSON.stringify(common.getError(1001)));
            process.exit(1);
        } logger.error(JSON.stringify('ok'));

        const adminDb = client.db('admin');
        const randomDbSuffix = common.getUUID();
        const newDbName = `velocity_db_${randomDbSuffix}`;
        const newDbAdmin = `velocity_admin_${randomDbSuffix}`;
        const velocityUser = {
            roles: [{ role: 'readWrite', db: newDbName }]
        };
        
        adminDb.addUser(newDbAdmin, config.db_admin_password, velocityUser, function (err, result) {
            if (err) {
                logger.error(JSON.stringify(err));
                logger.error(JSON.stringify(common.getError(1001)));
                process.exit(1);
            }

            const username = rls.question('Please enter your username: ');
            const fname = rls.question('Please enter your first name: ');
            const lname = rls.question('Please enter your last name: ');
            let password = rls.question('Please enter your password: ', {
                hideEchoBack: true,
                mask: '*'
            });
            let password2 = rls.question('Please confirm your password: ', {
                hideEchoBack: true,
                mask: '*'
            });

            while (password !== password2) {
                logger.error('Your passwords do not match, please try again.');
                password = rls.question('Please enter your password again: ', {
                    hideEchoBack: true,
                    mask: '*'
                });
                password2 = rls.question('Please confirm your password again: ', {
                    hideEchoBack: true,
                    mask: '*'
                });
            }

            const user = {
                username: username,
                password: password,
                fname: fname,
                lname: lname,
                type: common.userTypes.MODE_SELECTOR.value,
                status: common.userStatus.ACTIVE.value
            };

            const newConfig = JSON.stringify({
                hostName: config.hostName,
                httpPort: config.httpPort,
                httpsPort: config.httpsPort,
                notificationsWSPort: config.notificationsWSPort,
                maxSessionAge: config.maxSessionAge,
                db_host: config.db_host,
                db_port: config.db_port,
                db_name: newDbName,
                db_admin_name: newDbAdmin,
                db_admin_password: config.db_admin_password,
                password: config.password
            }, null, 4);

            fs.writeFile(`${__dirname}/../velocity.config`, newConfig, function (err) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    process.exit(1);
                }

                config.db_name = newDbName;
                logger.info('The new configuration has been saved!');
                db.initialize(function (err, result) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        process.exit(1);
                    }

                    logger.info('Connection to Velocity database successful.');
                    cfs.initialize(function (err, result) {
                        if (err) {
                            logger.error(JSON.stringify(err));
                            process.exit(1);
                        }

                        logger.info('File System exists and seems ok');
                        users.addUser(user, function (err, userObject) {
                            if (err) {
                                logger.error(JSON.stringify(err));
                                process.exit(1);
                            }

                            logger.info('Successful created mode selector account.');
                            cfs.mkdir(common.cfsTree.USERS, userObject._id, common.cfsPermission.OWNER, function (err, result) {
                                if (err) {
                                    logger.error(err);
                                    process.exit(1);
                                }

                                logger.info('Successful created users directory.');
                                process.exit(0);
                            });
                        });
                    });
                });
            });
        });
    });
}

setupAdminAccount();