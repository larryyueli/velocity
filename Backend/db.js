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

const mongoClient = require('mongodb').MongoClient;

const common = require('./common.js');
const config = require('./config.js');
const db_analytics_admin = require('./dbs/db-analytics-admin.js');
const db_analytics_kanban = require('./dbs/db-analytics-kanban.js');
const db_analytics_releases = require('./dbs/db-analytics-releases.js');
const db_analytics_sprints = require('./dbs/db-analytics-sprints.js');
const db_comments = require('./dbs/db-comments.js');
const db_feedback = require('./dbs/db-feedback.js');
const db_notifications = require('./dbs/db-notifications.js');
const db_projects = require('./dbs/db-projects.js');
const db_releases = require('./dbs/db-releases.js');
const db_settings = require('./dbs/db-settings.js');
const db_sprints = require('./dbs/db-sprints.js');
const db_tags = require('./dbs/db-tags.js');
const db_teams = require('./dbs/db-teams.js');
const db_tickets = require('./dbs/db-tickets.js');
const db_users = require('./dbs/db-users.js');
const db_vfs = require('./dbs/db-virtualFileSystem.js');

/**
 * Open a connection to the database
 *
 * @param {function} callback callback function
 */
const initialize = function (callback) {
    const url = `mongodb://${config.db_admin_name}:${config.db_admin_password}@${config.db_host}:${config.db_port}`;
    mongoClient.connect(url, function (err, client) {
        if (err) {
            return callback(common.getError(1001), null);
        }
        db_analytics_admin.initialize(client.db(config.db_name).collection('analytics_admin'));
        db_analytics_kanban.initialize(client.db(config.db_name).collection('analytics_kanban'));
        db_analytics_releases.initialize(client.db(config.db_name).collection('analytics_releases'));
        db_analytics_sprints.initialize(client.db(config.db_name).collection('analytics_sprints'));
        db_comments.initialize(client.db(config.db_name).collection('comments'));
        db_feedback.initialize(client.db(config.db_name).collection('feedback'));
        db_notifications.initialize(client.db(config.db_name).collection('notifications'));
        db_projects.initialize(client.db(config.db_name).collection('projects'));
        db_releases.initialize(client.db(config.db_name).collection('releases'));
        db_settings.initialize(client.db(config.db_name).collection('settings'));
        db_sprints.initialize(client.db(config.db_name).collection('sprints'));
        db_tags.initialize(client.db(config.db_name).collection('tags'));
        db_teams.initialize(client.db(config.db_name).collection('teams'));
        db_tickets.initialize(client.db(config.db_name).collection('tickets'));
        db_users.initialize(client.db(config.db_name).collection('users'));
        db_vfs.initialize(client.db(config.db_name).collection('virtualFileSystem'));

        return callback(null, 'ok');
    });
}
exports.initialize = initialize;

// <Admin Analytics Collection> ----------------------------------------------
exports.addAdminAnalytics = db_analytics_admin.addAdminAnalytics;
exports.getLimitedAdminAnalyticsListSorted = db_analytics_admin.getLimitedAdminAnalyticsListSorted;
// </Admin Analytics Collection> ----------------------------------------------

// <Comments Collection> ----------------------------------------------
exports.addComment = db_comments.addComment;
exports.getLimitedCommentsListSorted = db_comments.getLimitedCommentsListSorted;
exports.getComment = db_comments.getComment;
exports.updateComment = db_comments.updateComment;
// </Comments Collection> ---------------------------------------------

// <Feedbacks Collection> ----------------------------------------------
exports.addFeedback = db_feedback.addFeedback;
exports.getFeedback = db_feedback.getFeedback;
exports.getLimitedFeedbacksListSorted = db_feedback.getLimitedFeedbacksListSorted;
// </Feedbacks Collection> ---------------------------------------------

// <Kanban Analytics Collection> ----------------------------------------------
exports.addKanbanAnalytics = db_analytics_kanban.addKanbanAnalytics;
exports.getLimitedKanbanAnalyticsListSorted = db_analytics_kanban.getLimitedKanbanAnalyticsListSorted;
// </Kanban Analytics Collection> ----------------------------------------------

// <Notifications Collection> ----------------------------------------------
exports.addNotification = db_notifications.addNotification;
exports.deleteNotifications = db_notifications.deleteNotifications;
exports.getLimitedNotificationsListSorted = db_notifications.getLimitedNotificationsListSorted;
exports.getNotification = db_notifications.getNotification;
exports.updateNotification = db_notifications.updateNotification;
// </Notifications Collection> ---------------------------------------------

// <Projects Collection> ----------------------------------------------
exports.addProject = db_projects.addProject;
exports.getLimitedProjectsListSorted = db_projects.getLimitedProjectsListSorted;
exports.getProject = db_projects.getProject;
exports.updateProject = db_projects.updateProject;
// </Projects Collection> ---------------------------------------------

// <Releases Collection> ----------------------------------------------
exports.addRelease = db_releases.addRelease;
exports.getLimitedReleasesListSorted = db_releases.getLimitedReleasesListSorted;
exports.getRelease = db_releases.getRelease;
exports.updateRelease = db_releases.updateRelease;
exports.updateReleases = db_releases.updateReleases;
// </Releases Collection> ---------------------------------------------

// <Releases Analytics Collection> ----------------------------------------------
exports.addReleaseAnalytics = db_analytics_releases.addReleaseAnalytics;
exports.getLimitedReleaseAnalyticsListSorted = db_analytics_releases.getLimitedReleaseAnalyticsListSorted;
exports.updateReleaseAnalytics = db_analytics_releases.updateReleaseAnalytics;
// <Releases Analytics Collection> ----------------------------------------------

// <Settings Collection> ----------------------------------------------
exports.addAllSettings = db_settings.addAllSettings;
exports.getAllSettings = db_settings.getAllSettings;
exports.removeAllSettings = db_settings.removeAllSettings;
exports.updateAllSettings = db_settings.updateAllSettings;
// </Settings Collection> ---------------------------------------------

// <Sprints Collection> ----------------------------------------------
exports.addSprint = db_sprints.addSprint;
exports.getLimitedSprintsListSorted = db_sprints.getLimitedSprintsListSorted;
exports.getSprint = db_sprints.getSprint;
exports.updateSprint = db_sprints.updateSprint;
exports.updateSprints = db_sprints.updateSprints;
// </Sprints Collection> ---------------------------------------------

// <Sprints Analytics Collection> ----------------------------------------------
exports.addSprintAnalytics = db_analytics_sprints.addSprintAnalytics;
exports.getLimitedSprintAnalyticsListSorted = db_analytics_sprints.getLimitedSprintAnalyticsListSorted;
exports.updateSprintAnalytics = db_analytics_sprints.updateSprintAnalytics;
// <Sprints Analytics Collection> ----------------------------------------------

// <Tags Collection> ----------------------------------------------
exports.addTag = db_tags.addTag;
exports.getLimitedTagsListSorted = db_tags.getLimitedTagsListSorted;
exports.getTag = db_tags.getTag;
exports.updateTag = db_tags.updateTag;
exports.updateTags = db_tags.updateTags;
// </Tags Collection> ---------------------------------------------

// <Teams Collection> ----------------------------------------------
exports.addTeam = db_teams.addTeam;
exports.getLimitedTeamsListSorted = db_teams.getLimitedTeamsListSorted;
exports.getTeam = db_teams.getTeam;
exports.updateTeam = db_teams.updateTeam;
exports.updateTeams = db_teams.updateTeams;
// </Teams Collection> ---------------------------------------------

// <Tickets Collection> ----------------------------------------------
exports.addTicket = db_tickets.addTicket;
exports.getLimitedTicketsListSorted = db_tickets.getLimitedTicketsListSorted;
exports.getTicket = db_tickets.getTicket;
exports.updateTicket = db_tickets.updateTicket;
exports.updateTickets = db_tickets.updateTickets;
// </Tickets Collection> ---------------------------------------------

// <Users Collection> -------------------------------------------------
exports.addUser = db_users.addUser;
exports.getLimitedUsersListSorted = db_users.getLimitedUsersListSorted;
exports.getUser = db_users.getUser;
exports.updateUser = db_users.updateUser;
// </Users Collection> ------------------------------------------------

// <Virtual File System Collection> -----------------------------------
exports.addToVirtualFileSystem = db_vfs.addToVirtualFileSystem;
exports.removeFromVirtualFileSystem = db_vfs.removeFromVirtualFileSystem;
exports.findInVirtualFileSystem = db_vfs.findInVirtualFileSystem;
// </Virtual File System Collection> ----------------------------------