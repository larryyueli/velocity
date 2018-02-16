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

/**
 * Generates a lot of dummy data
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
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            console.log(`BODY: ${chunk}`);
        });
        res.on('end', () => {
            console.log('No more data in response.');

            const options2 = {
                hostname: 'localhost',
                port: 8080,
                path: '/login',
                method: 'POST',
                rejectUnauthorized: false,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData),
                    'Cookie' : res.headers['set-cookie'][0]
                }
            };

            const req2 = https.request(options2, (res) => {
                console.log(`STATUS: ${res.statusCode}`);
                console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    console.log(`BODY: ${chunk}`);
                });
                res.on('end', () => {
                    console.log('No more data in response.');
                });
            });
        
            req2.on('error', (e) => {
                console.error(`problem with request: ${e.message}`);
            });
        
            // write data to request body
            req2.write(postData);
            req2.end();
        });
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });

    // write data to request body
    req.write(postData);
    req.end();
}

dataGenerator();