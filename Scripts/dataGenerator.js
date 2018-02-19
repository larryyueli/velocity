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

const https = require('https');
const querystring = require('query-string');
const rls = require('readline-sync');

const common = require('../Backend/common.js');
const config = require('../Backend/config.js');
const logger = require('../Backend/logger.js');

const classMode = querystring.stringify({
    'selectedMode': common.modeTypes.CLASS
});

const numOfProfessors = 2;
const numOfTAs = 3;
const numOfStudents = 25;
const numOfProjects = 5;
const numOfProjectsToActivate = 2;
const groupSize = 5;
var projectList = [];
var groupList = [];
var usersToAdd = [];
var processedUsers = 0;
var processedProjects = 0;
var updatedProjects = 0;

var adminCookie; // Stores the cookie we use throughout all requests

/**
 * Generates a lot of dummy data.
 */
const dataGenerator = function () {
    config.debugMode = true;
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
        hostname: config.hostName,
        port: config.httpsPort,
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
        res.on('data', (chunk) => { });
        res.on('end', () => {
            logger.info(`Logged in as ${adminUsername}`);
            adminCookie = res.headers['set-cookie'][0];
            selectedMode();
        });
    });

    req.on('error', (e) => {
        logger.error(`Problem with request: ${e.message}`);
        process.exit(1);
    });

    req.write(postData);
    req.end();
}

/**
 * Selects Class mode
 */
const selectedMode = function () {
    const options = {
        hostname: config.hostName,
        port: config.httpsPort,
        path: '/mode/select',
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(classMode),
            'Cookie': adminCookie
        }
    };

    const req = https.request(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => { });
        res.on('end', () => {
            logger.info("Selected class mode");
            generateUsers();
        });
    });

    req.on('error', (e) => {
        logger.error(`Problem with request: ${e.message}`);
        process.exit(1);
    });

    req.write(classMode);
    req.end();
}

/**
 * Generates the entirety of our user list
 */
const generateUsers = function () {
    for (let i = 0; i < numOfProfessors; i++) {
        createUser(`Professor${i}`, i.toString(), common.userTypes.PROFESSOR.value);
    }
    for (let i = 0; i < numOfTAs; i++) {
        createUser(`TA${i}`, i.toString(), common.userTypes.TA.value);
    }
    for (let i = 0; i < numOfStudents; i++) {
        createUser(`Student${i}`, i.toString(), common.userTypes.STUDENT.value);
        usersToAdd.push(`student${i}`);
    }
}

/**
 * Generates all the projects
 */
const generateProjects = function () {
    for (let i = 0; i < numOfProjects; i++) {
        createProject(`Project ${i}`, `Welcome to Project ${i}`);
    }
}

/**
 * User creation request
 */
const createUser = function (fname, lname, type) {

    const userObject = querystring.stringify({
        'fname': fname,
        'lname': lname,
        'username': fname,
        'password': 'asd',
        'email': `${fname}@${lname}.ca`,
        'type': type
    });
    const options = {
        hostname: config.hostName,
        port: config.httpsPort,
        path: '/users/create',
        method: 'PUT',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(userObject),
            'Cookie': adminCookie
        }
    };

    const req = https.request(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => { });
        res.on('end', () => {
            logger.info(`Created user ${fname} ${lname}`);
            processedUsers++;
            if (processedUsers === numOfProfessors + numOfTAs + numOfStudents) {
                splitUsersIntoGroups();
                generateProjects();
            }
        });
    });

    req.on('error', (e) => {
        logger.error(`Problem with request: ${e.message}`);
        process.exit(1);
    });

    req.write(userObject);
    req.end();
}

/**
 * Generates the groups
 */
const splitUsersIntoGroups = function () {
    let members = [];
    let groupNumber = 0;
    for (let i = 0; i < usersToAdd.length; i++) {
        members.push(usersToAdd[i]);
        if (members.length === groupSize) {
            createGroup(`${common.defaultTeamPrefix}${groupNumber}`, members);
            groupNumber++;
            members = [];
        }
    }
    if (members.length !== 0) {
        createGroup(`${common.defaultTeamPrefix}${groupNumber}`, members);
    }
}

/**
 * Creates a group and adds it to our group list
 */
const createGroup = function(name, members) {
    let group = {
        'name': name,
        'members': []
    }
    for (let i = 0; i < members.length; i++) {
        group.members.push({'username': members[i]});
    }
    groupList.push(group);
}

/**
 * Creates a project
 */
const createProject = function (title, description) {
    const projectObject = querystring.stringify({
        'title': title,
        'description': description
    });

    const options = {
        hostname: config.hostName,
        port: config.httpsPort,
        path: '/projects/create',
        method: 'PUT',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(projectObject),
            'Cookie': adminCookie
        }
    };

    const req = https.request(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => { });
        res.on('end', () => {
            logger.info(`Created project ${title}`);
            processedProjects++;
            if (processedProjects === numOfProjects) {
                processedProjects = 0;
                getProjectsData();
            }
        });
    });

    req.on('error', (e) => {
        logger.error(`Problem with request: ${e.message}`);
        process.exit(1);
    });

    req.write(projectObject);
    req.end();
}

/**
 * Gets the main projects data block
 */
const getProjectsData = function () {
    let projectsData = '';

    const options = {
        hostname: config.hostName,
        port: config.httpsPort,
        path: '/projectsListComponent',
        method: 'GET',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': adminCookie
        }
    };

    const req = https.request(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            projectsData += chunk;
        });
        res.on('end', () => {
            logger.info("Retrieved all projects");
            projectList = JSON.parse(projectsData).projectsList;
            projectList.forEach(project => {
                setProjectInfo(project);
            });
        });
    });

    req.on('error', (e) => {
        logger.error(`Problem with request: ${e.message}`);
        process.exit(1);
    });

    req.end();
}

/**
 * Sets project settings based on ID
 * 
 * @param {*} project The ID of the project
 */
const setProjectInfo = function (project) {
    const projectConfig = querystring.stringify({
        'projectId': project._id,
        'groupSelectType': common.teamSelectionTypes.RANDOM.value,
        'groupSize': groupSize,
        'groupPrefix': common.defaultTeamPrefix
    });

    const options = {
        hostname: config.hostName,
        port: config.httpsPort,
        path: `/project/teams/config`,
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(projectConfig),
            'Cookie': adminCookie
        }
    };

    const req = https.request(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => { });
        res.on('end', () => {
            logger.info(`Set project info for ${project.title}`);
            updatedProjects++;
            assignGroups(project);
            if (updatedProjects === numOfProjects) {

            }
        });
    });

    req.on('error', (e) => {
        logger.error(`Problem with request: ${e.message}`);
        process.exit(1);
    });

    req.write(projectConfig);
    req.end();
}

/**
 * Assigns the generated group list for each project
 * @param {*} project The project to assign the group to
 */
const assignGroups = function (project) {
    const projectConfig = querystring.stringify({
        'projectId': project._id,
        'teamsList': JSON.stringify(groupList)
    });

    const options = {
        hostname: config.hostName,
        port: config.httpsPort,
        path: '/project/teams/update',
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(projectConfig),
            'Cookie': adminCookie
        }
    };

    const req = https.request(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => { });
        res.on('end', () => {
            logger.info(`Assigned groups to project ${project.title}`);
            processedProjects++;
            if (processedProjects === numOfProjects) {
                processedProjects = 0;
                for (let i = 0; i < numOfProjectsToActivate; i++) {
                    activateProject(projectList[i]);
                }
            }
        });
    });

    req.on('error', (e) => {
        logger.error(`Problem with request: ${e.message}`);
        process.exit(1);
    });

    req.write(projectConfig);
    req.end();
}

/**
 * Activates a project
 * @param {*} project Project to activate
 */
const activateProject = function (project) {
    const projectIdObject = querystring.stringify({
        'projectId': project._id,
    });

    const options = {
        hostname: config.hostName,
        port: config.httpsPort,
        path: '/project/activate',
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(projectIdObject),
            'Cookie': adminCookie
        }
    };

    const req = https.request(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => { });
        res.on('end', () => {
            logger.info(`Activated project ${project.title}`);
            if (processedProjects === numOfProjectsToActivate) {
                process.exit(0);
            }
        });
    });

    req.on('error', (e) => {
        logger.error(`Problem with request: ${e.message}`);
        process.exit(1);
    });

    req.write(projectIdObject);
    req.end();
}

dataGenerator();