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

const mongoClient = require('mongodb').MongoClient;

const common = require('./common.js');
const config = require('./config.js');
const db_projects = require('./dbs/db-projects.js');
const db_settings = require('./dbs/db-settings.js');
const db_teams = require('./dbs/db-teams.js');
const db_users = require('./dbs/db-users.js');
const db_vfs = require('./dbs/db-virtualFileSystem.js');

/**
 * Open a connection to the database
 *
 * @param {function} callback callback function
 */
const initialize = function (callback) {
    const url = `mongodb://${config.default_db_host}:${config.default_db_port}`;
    mongoClient.connect(url, function (err, client) {
        if (err) {
            return callback(common.getError(1001), null);
        }

        db_projects.initialize(client.db(config.default_db_name).collection('projects'));
        db_settings.initialize(client.db(config.default_db_name).collection('settings'));
        db_teams.initialize(client.db(config.default_db_name).collection('teams'));
        db_users.initialize(client.db(config.default_db_name).collection('users'));
        db_vfs.initialize(client.db(config.default_db_name).collection('virtualFileSystem'));

        return callback(null, 'ok');
    });
}
exports.initialize = initialize;

// <Users Collection> -------------------------------------------------
exports.addUser = db_users.addUser;
exports.getLimitedUsersListSorted = db_users.getLimitedUsersListSorted;
exports.getUser = db_users.getUser;
exports.updateUser = db_users.updateUser;
// </Users Collection> ------------------------------------------------

// <Settings Collection> ----------------------------------------------
exports.addAllSettings = db_settings.addAllSettings;
exports.getAllSettings = db_settings.getAllSettings;
exports.removeAllSettings = db_settings.removeAllSettings;
exports.updateAllSettings = db_settings.updateAllSettings;
// </Settings Collection> ---------------------------------------------

// <Virtual File System Collection> -----------------------------------
exports.addToVirtualFileSystem = db_vfs.addToVirtualFileSystem;
exports.removeFromVirtualFileSystem = db_vfs.removeFromVirtualFileSystem;
exports.findInVirtualFileSystem = db_vfs.findInVirtualFileSystem;
// </Virtual File System Collection> ----------------------------------

// <Projects Collection> ----------------------------------------------
exports.addProject = db_projects.addProject;
exports.getLimitedProjectsListSorted = db_projects.getLimitedProjectsListSorted;
exports.getProject = db_projects.getProject;
exports.updateProject = db_projects.updateProject;
// </Projects Collection> ---------------------------------------------

// <Teams Collection> ----------------------------------------------
exports.addTeam = db_teams.addTeam;
exports.getLimitedTeamsListSorted = db_teams.getLimitedTeamsListSorted;
exports.getTeam = db_teams.getTeam;
exports.updateTeam = db_teams.updateTeam;
// </Teams Collection> ---------------------------------------------