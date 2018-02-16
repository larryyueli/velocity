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

const superagent = require('superagent');
const fs = require('fs');
const rls = require('readline-sync');

const common = require('../Backend/common.js');
const config = require('../Backend/config.js');
const logger = require('../Backend/logger.js');

/**
 * Generates a lot of dummy data
 */
const dataGenerator = function () {
    config.debugMode = true;
    const adminUsername = rls.question('Please enter your admin username: ');
    const adminFname = rls.question('Please enter your admin first name: ');
    const adminLname = rls.question('Please enter your admin last name: ');
    const adminPassword = rls.question('Enter your admin password: ', {
        hideEchoBack: true,
        mask: '*'
    });
    superagent
        .post('https://localhost:8080/login')
        //.key(fs.readFileSync('/home/sergey/Velocity/velocity/Keys/private.key'))
        .ca(fs.readFileSync('/home/sergey/Velocity/velocity/Keys/cert.crt'))
        .cert(fs.readFileSync('/home/sergey/Velocity/velocity/Keys/cert.crt'))
        .send({'username': adminUsername, 'password': adminPassword})
        .end((err, res) => {
            if (err) {
                logger.info(err);
            } else {
                logger.info('Logged in!');
            }
    });
}

dataGenerator();