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

const numOfProfessors = 2;
const numOfTAs = 3;
const numOfStudents = 10;
const numOfCollaboratorAdmins = 5;
const numOfCollaborators = 20;
const numOfProjects = 3;
const numOfProjectsToActivate = 2;
const numOfTicketsPerState = 1;
const groupSize = 5;
const userPassword = 'asd';
var userCookies = [];
var projectList = [];
var groupList = [];
var ticketsList = [];
var projectGroupIds = [];
var usersToAdd = [];
var numOfGroups = 0;
var processedUsers = 0;
var processedProjects = 0;
var processedGroups = 0;

var adminCookie; // Stores the cookie we use throughout all 
var workingMode; // Stores whether we have Class mode or Collab mode

/**
 * Generates a lot of dummy data.
 */
const dataGenerator = function () {
    config.debugMode = true;
    let selectedMode = rls.question('Type collab or class to choose that mode: ');
    while (selectedMode !== 'collab' && selectedMode !== 'class') {
        selectedMode = rls.question('Unrecognized. Type either class or collab for your mode: ');
    }
    if (selectedMode === 'collab') {
        workingMode = common.modeTypes.COLLABORATORS;
    } else {
        workingMode = common.modeTypes.CLASS;
    }
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
            configureMode();
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
 * Selects whichever mode was selected by the 
 */
const configureMode = function () {
    const chosenMode = querystring.stringify({
        'selectedMode': workingMode
    });
    const options = {
        hostname: config.hostName,
        port: config.httpsPort,
        path: '/mode/select',
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(chosenMode),
            'Cookie': adminCookie
        }
    };

    const req = https.request(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => { });
        res.on('end', () => {
            logger.info(`Selected mode ${workingMode}`);
            if (workingMode === common.modeTypes.CLASS) {
                generateClassUsers();
            } else {
                generateCollabUsers();
            }
        });
    });

    req.on('error', (e) => {
        logger.error(`Problem with request: ${e.message}`);
        process.exit(1);
    });

    req.write(chosenMode);
    req.end();
}

/**
 * Generates the entirety of our class user list
 */
const generateClassUsers = function () {
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
 * Generates the entirety of our collab user list
 */
const generateCollabUsers = function () {
    for (let i = 0; i < numOfCollaboratorAdmins; i++) {
        createUser(`CollabAdmin${i}`, i.toString(), common.userTypes.COLLABORATOR_ADMIN.value);
        usersToAdd.push(`collabadmin${i}`);
    }
    for (let i = 0; i < numOfCollaborators; i++) {
        createUser(`Collaborator${i}`, i.toString(), common.userTypes.COLLABORATOR.value);
        usersToAdd.push(`collab${i}`);
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
        'password': userPassword,
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
            logUserIn(fname);
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
 * Logs the user in and stores the cookie for their login
 * @param {*} username username
 */
const logUserIn = function (username) {
    const loginData = querystring.stringify({
        'username': username,
        'password': userPassword
    });

    const options = {
        hostname: config.hostName,
        port: config.httpsPort,
        path: '/login',
        method: 'POST',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(loginData)
        }
    };

    const req = https.request(options, (res) => {

        res.setEncoding('utf8');
        res.on('data', (chunk) => { });
        res.on('end', () => {
            logger.info(`Logged in and stored the cookie of ${username}`);
            userCookies.push({username: username, cookie: res.headers['set-cookie'][0]});
            processedUsers++;
            let totalUsers;
            if (workingMode === common.modeTypes.CLASS) {
                totalUsers = numOfProfessors + numOfTAs + numOfStudents;
            } else {
                totalUsers = numOfCollaboratorAdmins + numOfCollaborators;
            }
            if (processedUsers === totalUsers) {
                splitUsersIntoGroups();
                generateProjects();
            }
        });
    });

    req.on('error', (e) => {
        logger.error(`Problem with request: ${e.message}`);
        process.exit(1);
    });

    req.write(loginData);
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
    numOfGroups *= numOfProjects;
}

/**
 * Creates a group and adds it to our group list
 */
const createGroup = function (name, members) {
    let group = {
        'name': name,
        'members': []
    }
    for (let i = 0; i < members.length; i++) {
        group.members.push({ 'username': members[i] });
    }
    groupList.push(group);
    numOfGroups++;
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
        path: '/components/projectsList',
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
            logger.info('Retrieved all projects');
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
            assignGroups(project);
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
            processedProjects++;
            if (processedProjects === numOfProjectsToActivate) {
                projectList.forEach(project => {
                    getGroupIds(project._id);
                });
            }
        });
    });

    req.on('error', (e) => {
        logger.error(`Problem with request: ${e.message}`);
    });

    req.write(projectIdObject);
    req.end();
}

/**
 * Gets the groupIds for each project
 * @param {*} projectId project id
 */
const getGroupIds = function (projectId) {
    let projectGroups = '';

    const options = {
        hostname: config.hostName,
        port: config.httpsPort,
        path: `/components/teamsList?projectId=${projectId}`,
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
            projectGroups += chunk;
        });
        res.on('end', () => {
            logger.info(`Retrieved groupIds for project ${projectId}`);
            let groups = JSON.parse(projectGroups).teamsList;
            for (let i = 0; i < groups.length; i++) {
                getGroupMembers(projectId, groups[i]._id);
            }
        });
    });

    req.on('error', (e) => {
        logger.error(`Problem with request: ${e.message}`);
        process.exit(1);
    });

    req.end();
}

/**
 * Gets the group members of a group
 * @param {*} projectId project id
 * @param {*} groupId group id
 */
const getGroupMembers = function (projectId, groupId) {
    let groupMembers = '';

    const options = {
        hostname: config.hostName,
        port: config.httpsPort,
        path: `/project/team/members/list?projectId=${projectId}&teamId=${groupId}`,
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
            groupMembers += chunk;
        });
        res.on('end', () => {
            logger.info(`Retrieved group members for project ${projectId}`);
            let teamObj = {
                projectId: projectId,
                teamId: groupId,
                members: [] 
            };
            JSON.parse(groupMembers).forEach(user => {
                teamObj.members.push(user.username);
            });
            projectGroupIds.push(teamObj);
            processedGroups++;
            if (processedGroups === numOfGroups) {
                createTickets();
                pushTickets();
            }
        });
    });

    req.on('error', (e) => {
        logger.error(`Problem with request: ${e.message}`);
        process.exit(1);
    });

    req.end();
}

/**
 * Generates all the tickets we will be adding
 */
const createTickets = function () {
    Object.keys(common.ticketStates).forEach( state => {
        for (let i = 0; i < Object.keys(common.ticketStates).length; i++) {
            Object.keys(common.ticketTypes).forEach( type => {
                ticketsList.push({
                    projectId: '',
                    teamId: '',
                    title: `Ticket ${i} of type ${common.ticketTypes[type].value} with state ${common.ticketStates[state].value}`,
                    description: 'Putting more effort into this desc than I did into CSC301',
                    type: common.ticketTypes[type].value,
                    priority: common.ticketPriority.LOW.value,
                    state: common.ticketStates[state].value,
                    points: 1,
                    assignee: ''
                });
            });
        }
    });
}

/**
 * Pushes all created tickets to each group
 */
const pushTickets = function () {
    projectGroupIds.forEach( obj => {
        ticketsList.forEach( ticket => {
            ticket.projectId = obj.projectId;
            ticket.teamId = obj.teamId;
            ticket.assignee = obj.members[0];
            sendTicket(ticket, obj.members[0]);
        });
    });
}

/**
 * Sends the ticket to the server
 * @param {*} ticket 
 */
const sendTicket = function (ticket, creator) {
    const ticketObj = querystring.stringify(ticket);
    
    const options = {
        hostname: config.hostName,
        port: config.httpsPort,
        path: '/tickets/create',
        method: 'PUT',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(ticketObj),
            'Cookie': getUserCookie(creator)
        }
    };

    const req = https.request(options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => { });
        res.on('end', () => {
            logger.info(`Created ticket ${ticketObj.title} for team ${ticketObj.teamId}`);
        });
    });

    req.on('error', (e) => {
        logger.error(`Problem with request: ${e.message}`);
        process.exit(1);
    });

    req.write(ticketObj);
    req.end();
}

/**
 * Returns the cookie for a given username
 * @param {*} username username
 */
const getUserCookie = function(username) {
    userCookies.forEach( user => {
        if (user.username === username) {
            return user.cookie;
        }
    });
    return null;
}

dataGenerator();