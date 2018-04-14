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

const analytics_admin = require('./analytics-components/analytics-admin.js');
const analytics_kanban = require('./analytics-components/analytics-kanban.js');
const analytics_releases = require('./analytics-components/analytics-releases.js');
const analytics_sprints = require('./analytics-components/analytics-sprints.js');
const common = require('./common.js');
const logger = require('./logger.js');

const analyticsTimeInterval = 86400000;

/**
 * Initialize the intervals
 *
 * @param {function} callback callback function
 */
const initialize = function (debug, callback) {
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes();
    var s = d.getSeconds();
    var secondsTilMidNight = ((24 * 60 * 60) - (h * 60 * 60) - (m * 60) - s) * 1000;

    if (debug) {
        processAnalytics();
    }
    
    setTimeout(function () {
        processAnalytics();
        setInterval(function () {
            processAnalytics();
        }, analyticsTimeInterval);
    }, secondsTilMidNight);
    return callback(null, '');
}

/**
 * Save marker for sprints and releases
 */
const processAnalytics = function () {
    analytics_admin.saveAdminAnalytics();
    analytics_kanban.saveKanbanAnalytics();
    analytics_releases.saveReleaseAnalytics();
    analytics_sprints.saveSprintAnalytics();
}

/**
 * Returns admin analytics
 * @param {object} project project obj
 * @param {array} tickets tickets list
 * @param {function} callback callback function
 */
const getAdminAnalytics = function (projectObj, tickets, callback) {
    analytics_admin.getAdminAnalytics(projectObj, tickets, function (err, adminAnalytics) {
        if (err) {
            logger.error(err);
            return callback(common.getError(8002), null);
        }

        return callback(null, adminAnalytics);
    });
}

/**
 * Returns scrum analytics
 * @param {object} team team object
 * @param {object} sprints sprints object
 * @param {object} releases releases object
 * @param {object} tickets tickets object
 * @param {function} callback callback
 */
const getScrumTeamAnalytics = function (team, sprints, releases, tickets, callback) {
    let result = {
        sprints: [],
        releases: []
    }
    analytics_releases.getReleaseAnalytics(team, releases, tickets, function (err, releaseAnalytics) {
        if (err) {
            logger.error(err);
            return callback(common.getError(8002), null);
        }

        analytics_sprints.getSprintAnalytics(team, sprints, tickets,function (err, sprintAnalytics) {
            if (err) {
                logger.error(err);
                return callback(common.getError(8002), null);
            }

            result.sprints = sprintAnalytics;
            result.releases = releaseAnalytics;
            return callback(null, result);
        });
    });
}

/**
 * Returns kanban analytics
 * @param {object} team team object
 * @param {object} tickets tickets object
 * @param {function} callback callback
 */
const getKanbanTeamAnalytics = function (team, tickets, callback) {
    analytics_kanban.getKanbanAnalytics(team, tickets, function (err, kanbanAnalytics) {
        if (err) {
            logger.error(err);
            return callback(common.getError(8002), null);
        }

        return callback(null, kanbanAnalytics);
    });
}

// <exports> -----------------------------------
exports.initialize = initialize;
exports.getAdminAnalytics = getAdminAnalytics;
exports.getKanbanTeamAnalytics = getKanbanTeamAnalytics;
exports.getScrumTeamAnalytics = getScrumTeamAnalytics;
// </exports> ----------------------------------

// <analytics-releases> -----------------------------------
exports.saveKanbanAnalytics = analytics_kanban.saveKanbanAnalytics;
exports.saveSpecificKanbanAnalytics = analytics_kanban.saveSpecificKanbanAnalytics;
exports.getReleaseAnalytics = analytics_kanban.getKanbanAnalytics;
// </analytics-releases> -----------------------------------

// <analytics-releases> -----------------------------------
exports.saveReleaseAnalytics = analytics_releases.saveReleaseAnalytics;
exports.saveSpecificReleaseAnalytics = analytics_releases.saveSpecificReleaseAnalytics;
exports.getReleaseAnalytics = analytics_releases.getReleaseAnalytics;
// </analytics-releases> ----------------------------------

// <analytics-sprints> -----------------------------------
exports.saveSprintAnalytics = analytics_sprints.saveSprintAnalytics;
exports.saveSpecificSprintAnalytics = analytics_sprints.saveSpecificSprintAnalytics;
exports.getSprintAnalytics = analytics_sprints.getSprintAnalytics;
// <analytics-sprints> -----------------------------------