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

const https = require('https');
const querystring = require('query-string');
const rls = require('readline-sync');

const common = require('../Backend/common.js');
const logger = require('../Backend/logger.js');

const classMode = querystring.stringify({
    'selectedMode': common.modeTypes.CLASS
});

const numOfProfessors = 2;
const numOfTAs = 3;
const numOfStudents = 25;

var adminCookie; // Stores the cookie we use throughout all requests

/**
 * Generates a lot of dummy data.
 */
const dataGenerator = function () {

    const adminUsername = rls.question('Please enter your admin username: ');
    const adminPassword = rls.question('Enter your admin password: ', {
        hideEchoBack: true,
        mask: '*'
    });

    const postData = querystring.stringify({
        'username': adminUsername,
        'password': adminPassword
    });

    const options = {
        hostname: 'localhost',
        port: 8080,
        path: '/login',
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = https.request(options, (res) => {

        res.setEncoding('utf8');
        res.on('data', (chunk) => {});
        res.on('end', () => {
            adminCookie = res.headers['set-cookie'][0];
            selectedMode();
        });
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });

    req.write(postData);
    req.end();
}

/**
 * Selects Class mode
 */
const selectedMode = function() {
    const options = {
        hostname: 'localhost',
        port: 8080,
        path: '/mode/select',
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(classMode),
            'Cookie' : adminCookie
        }
    };

    const req = https.request(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {});
        res.on('end', () => {
            generateUsers();
        });
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });

    req.write(classMode);
    req.end();
}

/**
 * Generates the entirety of our user list
 */
const generateUsers = function() {
    for (var i = 0; i < numOfProfessors; i++) {
        createUser("Professor", i.toString(), common.userTypes.PROFESSOR)
    }
}

/**
 * User creation request
 */
const createUser = function(fname, lname, type) {

    const userObject = querystring.stringify({
        'fname': fname,
        'lname': lname,
        'username': fname,
        'password': lname,
        'email': `${fname}@${lname}.ca`,
        'type': type
    });

    const options = {
        hostname: 'localhost',
        port: 8080,
        path: '/users/create',
        method: 'PUT',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(userObject),
            'Cookie' : adminCookie
        }
    };

    const req = https.request(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {});
        res.on('end', () => {
            console.log("Created a shmuck!");
        });
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });

    req.write(userObject);
    req.end();
}

dataGenerator();