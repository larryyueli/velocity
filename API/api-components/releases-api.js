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
const settings = require('../../Backend/settings.js');
const users = require('../../Backend/users.js');

/**
 * root path to create a releases
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const createRelease = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    const teamId = req.body.teamId;
    projects.getActiveProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getConfiguredTeamById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
            }

            let newRelease = {
                projectId: projectId,
                teamId: teamId,
                name: req.body.name
            };
            projects.addReleaseToTeam(newRelease, function (err, releaseObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                projects.getTicketsByTeamId(projectId, teamId, function (err, ticketObj) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }
                    
                    analytics.saveSpecificReleaseAnalytics(releaseObj, teamObj, ticketObj, function (err, analyticsObj) {
                        if (err) {
                            logger.error(JSON.stringify(err));
                            return res.status(500).send(err);
                        }
    
                        return res.status(200).send(releaseObj);
                    });
                });
            });
        });
    });
}

/**
 * root path to get the releases list of a team
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const getReleasesList = function (req, res) {
    const projectId = req.query.projectId;
    const teamId = req.query.teamId;
    projects.getActiveOrClosedProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getConfiguredTeamById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (settings.getModeType() === common_backend.modeTypes.CLASS
                && projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
            }

            projects.getAvailableReleasesByTeamId(projectId, teamId, function (err, releasesObjList) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                let releasesList = [];
                for (let i = 0; i < releasesObjList.length; i++) {
                    let release = releasesObjList[i];
                    releasesList.push({
                        _id: release._id,
                        name: release.name
                    });
                }

                return res.status(200).send({
                    releasesList: releasesList
                });
            });
        });
    });
}

/**
 * root path to delete a release
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const deleteRelease = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    const teamId = req.body.teamId;
    const releaseId = req.body.releaseId;

    projects.getActiveProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getConfiguredTeamById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
            }

            projects.getReleaseById(projectId, teamId, releaseId, function (err, releaseObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                if (releaseObj.status !== common_backend.releaseStatus.ACTIVE.value) {
                    logger.error(JSON.stringify(common_backend.getError(2049)));
                    return res.status(400).send(common_backend.getError(2049));
                }

                let updatedRelease = { status: common_backend.releaseStatus.DELETED.value };
                projects.updateReleaseById(releaseId, teamId, projectId, updatedRelease, function (err, result) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    return res.status(200).send('ok');
                });
            });
        });
    });
}

/**
 * root path to close a release
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const closeRelease = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    const teamId = req.body.teamId;
    const releaseId = req.body.releaseId;

    projects.getActiveProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }

        projects.getConfiguredTeamById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
            }

            projects.getReleaseById(projectId, teamId, releaseId, function (err, releaseObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                if (releaseObj.status !== common_backend.releaseStatus.ACTIVE.value) {
                    logger.error(JSON.stringify(common_backend.getError(2050)));
                    return res.status(400).send(common_backend.getError(2050));
                }

                let updatedRelease = { status: common_backend.releaseStatus.CLOSED.value };
                projects.updateReleaseById(releaseId, teamId, projectId, updatedRelease, function (err, result) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    releaseObj.status = common_backend.releaseStatus.CLOSED.value;
                    console.log(`EY FUCK, THE STATUS IS ${releaseObj.status}`);
                    projects.getTicketsByTeamId(projectId, teamId, function (err, ticketObj) {
                        if (err) {
                            logger.error(JSON.stringify(err));
                            return res.status(500).send(err);
                        }
                        
                        analytics.saveSpecificReleaseAnalytics(releaseObj, teamObj, ticketObj, function (err, analyticsObj) {
                            if (err) {
                                logger.error(JSON.stringify(err));
                                return res.status(500).send(err);
                            }
        
                            return res.status(200).send('ok');
                        });
                    });
                });
            });
        });
    });
}

/**
 * root path to render the release page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const renderReleasePage = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.params.projectId;
    const teamId = req.params.teamId;
    const releaseId = req.params.releaseId;
    projects.getActiveOrClosedProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }
        projects.getConfiguredTeamById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(404).render(common_api.pugPages.pageNotFound);
            }

            if (settings.getModeType() === common_backend.modeTypes.CLASS
                && projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(404).render(common_api.pugPages.pageNotFound);
            }

            projects.getReleaseById(projectId, teamId, releaseId, function (err, releaseObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(404).render(common_api.pugPages.pageNotFound);
                }

                return res.status(200).render(common_api.pugPages.releasePage, {
                    user: req.session.user,
                    projectId: projectId,
                    teamId: teamId,
                    release: releaseObj
                });
            });
        });
    });
}

/**
 * root path to get the release page components
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const getReleaseComponents = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.query.projectId;
    const teamId = req.query.teamId;
    const releaseId = req.query.releaseId;
    projects.getActiveOrClosedProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(400).send(common_backend.getError(2018));
        }
        projects.getConfiguredTeamById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(500).send(err);
            }

            if (settings.getModeType() === common_backend.modeTypes.CLASS
                && projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
            }

            projects.getReleaseById(projectId, teamId, releaseId, function (err, releaseObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                projects.getTicketsByIds(projectId, teamId, releaseObj.tickets, function (err, ticketsList) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    const resolvedUsers = common_backend.convertListToJason('_id', users.getActiveUsersList());
                    let resolvedList = [];
                    for (let i = 0; i < ticketsList.length; i++) {
                        const ticketObj = ticketsList[i];
                        const resolvedReporter = resolvedUsers[ticketObj.reporter] ? `${resolvedUsers[ticketObj.reporter].fname} ${resolvedUsers[ticketObj.reporter].lname}` : common_backend.noReporter;
                        const resolvedAssignee = resolvedUsers[ticketObj.assignee] ? `${resolvedUsers[ticketObj.assignee].fname} ${resolvedUsers[ticketObj.assignee].lname}` : common_backend.noReporter;
                        const reporterPicture = resolvedUsers[ticketObj.reporter] ? resolvedUsers[ticketObj.reporter].picture : null;
                        const assigneePicture = resolvedUsers[ticketObj.assignee] ? resolvedUsers[ticketObj.assignee].picture : null;
                        resolvedList.push({
                            _id: ticketObj._id,
                            reporterId: ticketObj.reporter,
                            assigneeId: ticketObj.assignee,
                            reporter: resolvedReporter,
                            assignee: resolvedAssignee,
                            reporterPicture: reporterPicture,
                            assigneePicture: assigneePicture,
                            ctime: ticketObj.ctime,
                            mtime: ticketObj.mtime,
                            displayId: ticketObj.displayId,
                            projectId: ticketObj.projectId,
                            teamId: ticketObj.teamId,
                            title: ticketObj.title,
                            description: ticketObj.description,
                            status: ticketObj.status,
                            state: ticketObj.state,
                            type: ticketObj.type,
                            priority: ticketObj.priority,
                            points: ticketObj.points
                        });
                    }

                    return res.status(200).send({
                        ticketEntryComponent: common_api.pugComponents.ticketEntryComponent(),
                        ticketsList: resolvedList
                    });
                });
            });
        });
    });
}


// <exports> ------------------------------------------------
exports.createRelease = createRelease;
exports.closeRelease = closeRelease;
exports.deleteRelease = deleteRelease;
exports.getReleaseComponents = getReleaseComponents;
exports.getReleasesList = getReleasesList;
exports.renderReleasePage = renderReleasePage;
// </exports> -----------------------------------------------