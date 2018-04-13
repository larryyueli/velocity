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

const common_api = require('./common-api.js');

const analytics = require('../../Backend/analytics.js');
const common_backend = require('../../Backend/common.js');
const logger = require('../../Backend/logger.js');
const projects = require('../../Backend/projects.js');

/**
 * path to get the admin analytics data
 * 
 * @param {*} req req object
 * @param {*} res res object
 */
const handleAdminAnalytics = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.query.projectId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getTicketsByProjectId(projectId, function (err, tickets) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            analytics.getAdminAnalytics(projectObj, tickets, function (err, adminObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }
    
                return res.status(200).send({
                    teams: adminObj
                });
            });
        });
    });
}

/**
 * path to get the teams analytics data
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const handleProjectTeamAnalytics = function (req, res) {

    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.query.projectId;
    const teamId = req.query.teamId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            projects.getTicketsByTeamId(projectId, teamId, function (err, ticketsObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                if (teamObj.boardType === common_backend.boardTypes.SCRUM.value) {
                    projects.getReleasesByTeamId(projectId, teamId, function (err, releaseObj) {
                        if (err) {
                            logger.error(JSON.stringify(err));
                            return res.status(500).send(err);
                        }
    
                        projects.getSprintsByTeamId(projectId, teamId, function (err, sprintsObj) {
                            if (err) {
                                logger.error(JSON.stringify(err));
                                return res.status(500).send(err);
                            }
    
                            analytics.getScrumTeamAnalytics(teamObj, sprintsObj, releaseObj, ticketsObj, function (err, stateObj) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                    return res.status(500).send(err);
                                }

                                return res.status(200).send({
                                    boardType: teamObj.boardType,
                                    sprints: stateObj.sprints,
                                    releases: stateObj.releases
                                });
                            });
                        });
                    });
                } else if (teamObj.boardType === common_backend.boardTypes.KANBAN.value) {
                    analytics.getKanbanTeamAnalytics(teamObj, ticketsObj, function (err, stateObj) {
                        if (err) {
                            logger.error(JSON.stringify(err));
                            return res.status(500).send(err);
                        }
                        
                        return res.status(200).send({
                            boardType: teamObj.boardType,
                            kanban: stateObj
                        });
                    });
                } else {
                    return res.status(500).send(common_backend.getError(6000));
                }    
            });
        });
    });
}

// <exports>
exports.handleAdminAnalytics = handleAdminAnalytics;
exports.handleProjectTeamAnalytics = handleProjectTeamAnalytics;
// </exports>