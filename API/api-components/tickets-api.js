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
const notifications_api = require('./notifications-api.js');

const common_backend = require('../../Backend/common.js');
const logger = require('../../Backend/logger.js');
const projects = require('../../Backend/projects.js');
const settings = require('../../Backend/settings.js');
const users = require('../../Backend/users.js');

/**
 * lookup a ticket by its display id
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const getTicketByDisplayId = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.query.projectId;
    const teamId = req.query.teamId;
    const ticketDisplayId = req.query.displayId;

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

            if (settings.getModeType() === common_backend.modeTypes.CLASS
                && projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
            }

            projects.getTicketByDisplayId(projectId, teamId, ticketDisplayId, function (err, ticketObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                const resolvedUsers = common_backend.convertListToJason('_id', users.getActiveUsersList());
                const resolvedReporter = resolvedUsers[ticketObj.reporter] ? `${resolvedUsers[ticketObj.reporter].fname} ${resolvedUsers[ticketObj.reporter].lname}` : common_backend.noReporter;
                const resolvedAssignee = resolvedUsers[ticketObj.assignee] ? `$${resolvedUsers[ticketObj.assignee].fname} ${resolvedUsers[ticketObj.assignee].lname}}` : common_backend.noReporter;
                const reporterPicture = resolvedUsers[ticketObj.reporter] ? resolvedUsers[ticketObj.reporter].picture : null;
                const assigneePicture = resolvedUsers[ticketObj.assignee] ? resolvedUsers[ticketObj.assignee].picture : null;
                let resolvedTicket = {
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
                    sprints: ticketObj.sprints,
                    releases: ticketObj.releases,
                    tags: ticketObj.tags,
                    links: ticketObj.links,
                    title: ticketObj.title,
                    description: ticketObj.description,
                    status: ticketObj.status,
                    state: ticketObj.state,
                    type: ticketObj.type,
                    priority: ticketObj.priority,
                    points: ticketObj.points
                };

                return res.status(200).send(resolvedTicket);
            });
        });
    });
}

/**
 * root path to create a ticket
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const createTicket = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    const teamId = req.body.teamId;
    const assignee = req.body.assignee;
    const links = req.body.links;
    let sprints = req.body.sprints;
    let releases = req.body.releases;
    let tags = req.body.tags;

    try {
        sprints = JSON.parse(sprints);
    }
    catch (err) {
        logger.error(common_backend.getError(1011));
        sprints = [];
    }

    try {
        releases = JSON.parse(releases);
    }
    catch (err) {
        logger.error(common_backend.getError(1011));
        releases = [];
    }

    try {
        tags = JSON.parse(tags);
    }
    catch (err) {
        logger.error(common_backend.getError(1011));
        tags = [];
    }

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

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
            }

            users.getUserByUsername(assignee, function (err, assigneeObj) {
                if (err && err.code !== 2003) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                let newTicket = {
                    projectId: req.body.projectId,
                    teamId: req.body.teamId,
                    title: req.body.title,
                    description: req.body.description,
                    type: parseInt(req.body.type),
                    state: parseInt(req.body.state),
                    points: parseInt(req.body.points),
                    priority: parseInt(req.body.priority),
                    reporter: req.session.user._id
                };

                if (assigneeObj) {
                    if (projectObj.members.indexOf(assigneeObj._id) === -1) {
                        logger.error(JSON.stringify(common_backend.getError(2018)));
                        return res.status(400).send(common_backend.getError(2018));
                    }

                    if (settings.getModeType() === common_backend.modeTypes.CLASS
                        && teamObj.members.indexOf(assigneeObj._id) === -1) {
                        logger.error(JSON.stringify(common_backend.getError(2019)));
                        return res.status(400).send(common_backend.getError(2019));
                    }

                    newTicket.assignee = assigneeObj._id;
                }

                projects.addTicketToTeam(newTicket, function (err, ticketObj) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    if (ticketObj.assignee !== common_backend.noAssignee
                        && ticketObj.assignee !== req.session.user._id) {
                        let notifObj = common_backend.notifications.TICKET_ASSINGEE;
                        notifObj.link = `/project/${projectId}/team/${teamId}/ticket/${ticketObj._id}`;
                        notifications_api.notifyUserById(ticketObj.assignee, notifObj);
                    }

                    let sprintsIdsList = [];
                    let releasesIdsList = [];
                    let tagsIdsList = [];
                    let linksList = [];

                    let processSprints = function (callback) {
                        if (Array.isArray(sprints)) {
                            projects.getSprintsByIds(projectId, teamId, sprints, function (err, sprintsList) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                    return res.status(500).send(err);
                                }

                                for (let i = 0; i < sprintsList.length; i++) {
                                    sprintsIdsList.push(sprintsList[i]['_id']);
                                }

                                projects.addTicketToSprints(ticketObj._id, projectId, teamId, sprintsIdsList, function (err, result) {
                                    if (err) {
                                        logger.error(JSON.stringify(err));
                                        return res.status(500).send(err);
                                    }

                                    return callback();
                                });
                            });
                        } else {
                            return callback();
                        }
                    }

                    let processReleases = function (callback) {
                        if (Array.isArray(releases)) {
                            projects.getReleasesByIds(projectId, teamId, releases, function (err, releasesList) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                    return res.status(500).send(err);
                                }

                                for (let i = 0; i < releasesList.length; i++) {
                                    releasesIdsList.push(releasesList[i]['_id']);
                                }

                                projects.addTicketToReleases(ticketObj._id, projectId, teamId, releasesIdsList, function (err, result) {
                                    if (err) {
                                        logger.error(JSON.stringify(err));
                                        return res.status(500).send(err);
                                    }

                                    return callback();
                                });
                            });
                        } else {
                            return callback();
                        }
                    }

                    let processTags = function (callback) {
                        if (Array.isArray(tags)) {
                            projects.getTagsByIds(projectId, teamId, tags, function (err, tagsList) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                    return res.status(500).send(err);
                                }

                                for (let i = 0; i < tagsList.length; i++) {
                                    tagsIdsList.push(tagsList[i]['_id']);
                                }

                                projects.addTicketToTags(ticketObj._id, projectId, teamId, tagsIdsList, function (err, result) {
                                    if (err) {
                                        logger.error(JSON.stringify(err));
                                        return res.status(500).send(err);
                                    }

                                    return callback();
                                });
                            });
                        } else {
                            return callback();
                        }
                    }

                    let processLinks = function (callback) {
                        if (typeof (links) === common_backend.variableTypes.OBJECT) {
                            const linksIdsList = Object.keys(links);
                            projects.getTicketsByIds(projectId, teamId, linksIdsList, function (err, ticketsObjList) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                    return res.status(500).send(err);
                                }

                                if (ticketsObjList.length === 0) {
                                    return callback();
                                }

                                let counter = 0;
                                for (let i = 0; i < ticketsObjList.length; i++) {
                                    let ticket = ticketsObjList[i];
                                    let parsedValue = parseInt(links[ticket._id]);
                                    if (common_backend.isValueInObjectWithKeys(parsedValue, 'value', common_backend.ticketLinkTypes)) {
                                        linksList.push({
                                            ticketId: ticket._id,
                                            relation: parsedValue
                                        });

                                        ticket.links.push({
                                            ticketId: ticketObj._id,
                                            relation: parsedValue % 2 === 0 ? parsedValue + 1 : parsedValue - 1
                                        });

                                        projects.updateTicket(ticket._id, teamId, projectId, { links: ticket.links }, function (err, result) {
                                            if (err) {
                                                logger.error(JSON.stringify(err));
                                                return res.status(500).send(err);
                                            }

                                            counter++;
                                            if (ticketsObjList.length === counter) {
                                                return callback();
                                            }
                                        });
                                    }
                                }
                            });
                        } else {
                            return callback();
                        }
                    }

                    processSprints(function () {
                        processReleases(function () {
                            processTags(function () {
                                processLinks(function () {
                                    let updateObj = {
                                        sprints: sprintsIdsList,
                                        releases: releasesIdsList,
                                        tags: tagsIdsList,
                                        links: linksList
                                    };
                                    projects.updateTicket(ticketObj._id, teamId, projectId, updateObj, function (err, result) {
                                        if (err) {
                                            logger.error(JSON.stringify(err));
                                            return res.status(500).send(err);
                                        }

                                        return res.status(200).send(ticketObj._id);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

/**
 * root path to render the team's project tickets add page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const renderCreateTicketPage = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.params.projectId;
    const teamId = req.params.teamId;
    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value) {
            logger.error(JSON.stringify(common_backend.getError(2043)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
            if (err) {
                logger.error(JSON.stringify(err));
                return res.status(404).render(common_api.pugPages.pageNotFound);
            }

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(404).render(common_api.pugPages.pageNotFound);
            }

            const reporter = `${req.session.user.fname} ${req.session.user.lname}`;
            const assignee = '';

            return res.status(200).render(common_api.pugPages.ticketCreation, {
                user: req.session.user,
                projectId: projectId,
                teamId: teamId,
                reporter: reporter,
                assignee: assignee,
                canSearch: true,
                isUnKnownBoardType: teamObj.boardType === common_backend.boardTypes.UNKNOWN.value,
                isKanbanBoardType: teamObj.boardType === common_backend.boardTypes.KANBAN.value,
                isScrumBoardType: teamObj.boardType === common_backend.boardTypes.SCRUM.value
            });
        });
    });
}

/**
 * root path to render the team's project tickets modify page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const renderTicketPage = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.params.projectId;
    const teamId = req.params.teamId;
    const ticketId = req.params.ticketId;

    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value
            && projectObj.status !== common_backend.projectStatus.CLOSED.value) {
            logger.error(JSON.stringify(common_backend.getError(2044)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
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

            let continueWithTicketsList = function (ticketsList) {
                let ticketObj = null;
                for (let i = 0; i < ticketsList.length; i++) {
                    if (ticketsList[i]._id === ticketId) {
                        ticketObj = ticketsList[i];
                        break;
                    }
                }

                if (!ticketObj) {
                    logger.error(JSON.stringify(common_backend.getError(7004)));
                    return res.status(404).render(common_api.pugPages.pageNotFound);
                }

                projects.getCommentsByTicketId(projectId, teamId, ticketId, function (err, commentsList) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(404).render(common_api.pugPages.pageNotFound);
                    }

                    const usersIdObj = common_backend.convertListToJason('_id', users.getActiveUsersList());
                    const ticketsIdObj = common_backend.convertListToJason('_id', ticketsList);

                    let assignee = '';
                    let resolvedAssignee = usersIdObj[ticketObj.assignee];
                    if (resolvedAssignee) {
                        assignee = `${resolvedAssignee.fname} ${resolvedAssignee.lname}`
                    }

                    let reporter = common_backend.noReporter;
                    let resolvedReporter = usersIdObj[ticketObj.reporter];
                    if (resolvedReporter) {
                        reporter = `${resolvedReporter.fname} ${resolvedReporter.lname}`
                    }

                    for (let i = 0; i < commentsList.length; i++) {
                        let comment = commentsList[i];
                        let resolvedUserFromComment = usersIdObj[comment.userId];
                        if (resolvedUserFromComment) {
                            commentsList[i]['username'] = `${resolvedUserFromComment.fname} ${resolvedUserFromComment.lname}`;
                            commentsList[i]['picture'] = resolvedUserFromComment.picture;
                        }
                    }

                    let resolvedRelatedTickets = [];
                    for (let i = 0; i < ticketObj.links.length; i++) {
                        let relatedTicket = ticketsIdObj[ticketObj.links[i].ticketId];
                        if (relatedTicket) {
                            const resolvedReporter = usersIdObj[relatedTicket.reporter] ? `${usersIdObj[relatedTicket.reporter].fname} ${usersIdObj[relatedTicket.reporter].lname}` : common_backend.noReporter;
                            const resolvedAssignee = usersIdObj[relatedTicket.assignee] ? `$${usersIdObj[relatedTicket.assignee].fname} ${usersIdObj[relatedTicket.assignee].lname}}` : common_backend.noReporter;
                            const reporterPicture = usersIdObj[relatedTicket.reporter] ? usersIdObj[relatedTicket.reporter].picture : null;
                            const assigneePicture = usersIdObj[relatedTicket.assignee] ? usersIdObj[relatedTicket.assignee].picture : null;
                            let resolvedTicket = {
                                _id: relatedTicket._id,
                                reporterId: relatedTicket.reporter,
                                assigneeId: relatedTicket.assignee,
                                reporter: resolvedReporter,
                                assignee: resolvedAssignee,
                                reporterPicture: reporterPicture,
                                assigneePicture: assigneePicture,
                                ctime: relatedTicket.ctime,
                                mtime: relatedTicket.mtime,
                                displayId: relatedTicket.displayId,
                                title: relatedTicket.title,
                                status: relatedTicket.status,
                                state: relatedTicket.state,
                                type: relatedTicket.type,
                                priority: relatedTicket.priority,
                                points: relatedTicket.points,
                                relation: ticketObj.links[i].relation,
                                relatedText: common_backend.getValueInObjectByKey(ticketObj.links[i].relation, 'value', 'text', common_backend.ticketLinkTypes)
                            };
                            resolvedRelatedTickets.push(resolvedTicket);
                        }
                    }


                    projects.getSprintsByIds(projectId, teamId, ticketObj.sprints, function (err, sprintsObjList) {
                        if (err) {
                            logger.error(JSON.stringify(err));
                            return res.status(404).render(common_api.pugPages.pageNotFound);
                        }

                        projects.getReleasesByTicketId(projectId, teamId, ticketId, function (err, releasesObjList) {
                            if (err) {
                                logger.error(JSON.stringify(err));
                                return res.status(404).render(common_api.pugPages.pageNotFound);
                            }

                            projects.getTagsByTicketId(projectId, teamId, ticketId, function (err, tagsObjList) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                    return res.status(404).render(common_api.pugPages.pageNotFound);
                                }

                                return res.status(200).render(common_api.pugPages.ticketModification, {
                                    user: req.session.user,
                                    projectId: projectId,
                                    teamId: teamId,
                                    reporter: reporter,
                                    assignee: assignee,
                                    ticket: ticketObj,
                                    comments: commentsList,
                                    sprints: sprintsObjList,
                                    releases: releasesObjList,
                                    tags: tagsObjList,
                                    relatedTickets: resolvedRelatedTickets,
                                    resolveState: (state) => {
                                        return common_backend.getValueInObjectByKey(state, 'value', 'text', common_backend.ticketStates);
                                    },
                                    resolveUsername: (userId) => {
                                        return usersIdObj[userId] ? `${usersIdObj[userId].fname} ${usersIdObj[userId].lname}` : common_backend.noAssignee;
                                    },
                                    resolveCommentContent: (content) => {
                                        let splitContent = content.split(' ');
                                        let resolvedContent = '';

                                        for (let i = 0; i < splitContent.length; i++) {
                                            let phrase = splitContent[i];
                                            let firstChar = phrase.charAt(0);
                                            switch (firstChar) {
                                                case '@':
                                                    let userId = phrase.slice(1);
                                                    let user = usersIdObj[userId];
                                                    if (user) {
                                                        resolvedContent += `<b>@${user.username}</b> `;
                                                    } else {
                                                        resolvedContent += `@UNKNOWN `;
                                                    }
                                                    break;
                                                case '#':
                                                    let ticketId = phrase.slice(1);
                                                    let ticket = ticketsIdObj[ticketId];
                                                    if (ticket) {
                                                        resolvedContent += `<a href='/project/${ticket.projectId}/team/${ticket.teamId}/ticket/${ticket._id}'>#${ticket.displayId} </a>`;
                                                    } else {
                                                        resolvedContent += `#UNKNOWN `;
                                                    }
                                                    break;
                                                default:
                                                    resolvedContent += `${phrase} `;
                                                    break;
                                            }
                                        }

                                        return resolvedContent.trim();
                                    },
                                    canSearch: true,
                                    commonSprintStatus: common_backend.sprintStatus,
                                    commonReleaseStatus: common_backend.releaseStatus,
                                    isUnKnownBoardType: teamObj.boardType === common_backend.boardTypes.UNKNOWN.value,
                                    isKanbanBoardType: teamObj.boardType === common_backend.boardTypes.KANBAN.value,
                                    isScrumBoardType: teamObj.boardType === common_backend.boardTypes.SCRUM.value
                                });
                            });
                        });
                    });
                });
            }

            if (settings.getModeType() === common_backend.modeTypes.CLASS) {
                projects.getTicketsByTeamId(projectId, teamId, function (err, ticketsList) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(404).render(common_api.pugPages.pageNotFound);
                    }
                    return continueWithTicketsList(ticketsList);
                });
            }

            if (settings.getModeType() === common_backend.modeTypes.COLLABORATORS) {
                projects.getTicketsByProjectId(projectId, function (err, ticketsList) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(404).render(common_api.pugPages.pageNotFound);
                    }
                    return continueWithTicketsList(ticketsList);
                });
            }
        });
    });
}

/**
 * root path to update a ticket
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const updateTicket = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    const teamId = req.body.teamId;
    const ticketId = req.body.ticketId;
    const assignee = req.body.assignee;
    const links = req.body.links;
    let sprints = req.body.sprints;
    let releases = req.body.releases;
    let tags = req.body.tags;

    if (!Array.isArray(sprints)) {
        try {
            sprints = JSON.parse(sprints);
        }
        catch (err) {
            logger.error(common_backend.getError(1011));
            sprints = [];
        }
    }

    if (!Array.isArray(releases)) {
        try {
            releases = JSON.parse(releases);
        }
        catch (err) {
            logger.error(common_backend.getError(1011));
            releases = [];
        }
    }

    if (!Array.isArray(tags)) {
        try {
            tags = JSON.parse(tags);
        }
        catch (err) {
            logger.error(common_backend.getError(1011));
            tags = [];
        }
    }

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

            if (settings.getModeType() === common_backend.modeTypes.CLASS
                && projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
            }

            projects.getTicketById(projectId, teamId, ticketId, function (err, ticketObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                users.getUserById(assignee, function (err, assigneeObj) {
                    if (err && err.code !== 2003) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    let newType = parseInt(req.body.type);
                    let newState = parseInt(req.body.state);
                    let newPoints = parseInt(req.body.points);
                    let newPriority = parseInt(req.body.priority);

                    let updatedTicket = {
                        title: req.body.title,
                        description: req.body.description,
                        type: newType,
                        state: newState,
                        points: newPoints,
                        priority: newPriority
                    };

                    if (common_backend.isValueInObjectWithKeys(newState, 'value', common_backend.ticketStates)
                        && ticketObj.state !== newState) {
                        updatedTicket.stateHistoryEntry = {
                            actor: req.session.user._id,
                            from: ticketObj.state,
                            to: newState,
                            ctime: common_backend.getDate()
                        };
                    }

                    if (assigneeObj) {
                        if (projectObj.members.indexOf(assigneeObj._id) === -1) {
                            logger.error(JSON.stringify(common_backend.getError(2018)));
                            return res.status(400).send(common_backend.getError(2018));
                        }

                        if (settings.getModeType() === common_backend.modeTypes.CLASS
                            && teamObj.members.indexOf(assigneeObj._id) === -1) {
                            logger.error(JSON.stringify(common_backend.getError(2019)));
                            return res.status(400).send(common_backend.getError(2019));
                        }

                        updatedTicket.assignee = assigneeObj._id;

                        if (ticketObj.assignee !== assigneeObj._id) {
                            updatedTicket.assigneeHistoryEntry = {
                                actor: req.session.user._id,
                                from: ticketObj.assignee,
                                to: assigneeObj._id,
                                ctime: common_backend.getDate()
                            };
                        }
                    } else {
                        updatedTicket.assignee = common_backend.noAssignee;
                    }

                    if (updatedTicket.assignee !== ticketObj.assignee) {
                        if (updatedTicket.assignee !== common_backend.noAssignee
                            && updatedTicket.assignee !== req.session.user._id) {
                            let notifObj = common_backend.notifications.TICKET_ASSINGEE;
                            notifObj.link = `/project/${projectId}/team/${teamId}/ticket/${ticketObj._id}`;
                            notifications_api.notifyUserById(updatedTicket.assignee, notifObj);
                        }

                        if (ticketObj.assignee !== common_backend.noAssignee
                            && ticketObj.assignee !== req.session.user._id) {
                            let notifObj = common_backend.notifications.TICKET_UPDATED;
                            notifObj.link = `/project/${projectId}/team/${teamId}/ticket/${ticketObj._id}`;
                            notifications_api.notifyUserById(ticketObj.assignee, notifObj);
                        }
                    } else {
                        if (updatedTicket.assignee !== common_backend.noAssignee) {
                            let notifObj = common_backend.notifications.TICKET_UPDATED;
                            notifObj.link = `/project/${projectId}/team/${teamId}/ticket/${ticketObj._id}`;
                            notifications_api.notifyUserById(updatedTicket.assignee, notifObj);
                        }
                    }

                    if (ticketObj.reporter !== common_backend.noReporter
                        && ticketObj.reporter !== req.session.user._id) {
                        let notifObj = common_backend.notifications.TICKET_UPDATED;
                        notifObj.link = `/project/${projectId}/team/${teamId}/ticket/${ticketObj._id}`;
                        notifications_api.notifyUserById(ticketObj.reporter, notifObj);
                    }

                    let processSprints = function (callback) {
                        if (Array.isArray(sprints)) {
                            let allSprints = common_backend.joinSets(ticketObj.sprints, sprints);
                            projects.getSprintsByIds(projectId, teamId, allSprints, function (err, sprintsList) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                    return res.status(500).send(err);
                                }

                                let allSprintsId = [];
                                for (let i = 0; i < sprintsList.length; i++) {
                                    allSprintsId.push(sprintsList[i]['_id']);
                                }

                                let validSprintIds = [];
                                for (let i = 0; i < sprints.length; i++) {
                                    let sprintId = sprints[i];
                                    if (allSprintsId.indexOf(sprintId) !== -1) {
                                        validSprintIds.push(sprintId);
                                    }
                                }

                                let sprintsToRemove = common_backend.getArrayDiff(allSprintsId, validSprintIds);

                                projects.addTicketToSprints(ticketObj._id, projectId, teamId, validSprintIds, function (err, result) {
                                    if (err) {
                                        logger.error(JSON.stringify(err));
                                        return res.status(500).send(err);
                                    }

                                    projects.removeTicketFromSprints(ticketObj._id, projectId, teamId, sprintsToRemove, function (err, result) {
                                        if (err) {
                                            logger.error(JSON.stringify(err));
                                            return res.status(500).send(err);
                                        }

                                        updatedTicket.sprints = validSprintIds;
                                        return callback();
                                    });
                                });
                            });
                        } else {
                            updatedTicket.sprints = [];
                            projects.removeTicketFromSprints(ticketObj._id, projectId, teamId, ticketObj.sprints, function (err, result) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                    return res.status(500).send(err);
                                }

                                return callback();
                            });
                        }
                    }

                    let processReleases = function (callback) {
                        if (Array.isArray(releases)) {
                            let allReleases = common_backend.joinSets(ticketObj.releases, releases);
                            projects.getReleasesByIds(projectId, teamId, allReleases, function (err, releasesList) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                    return res.status(500).send(err);
                                }

                                let allReleasesId = [];
                                for (let i = 0; i < releasesList.length; i++) {
                                    allReleasesId.push(releasesList[i]['_id']);
                                }

                                let validReleasesIds = [];
                                for (let i = 0; i < releases.length; i++) {
                                    let releaseId = releases[i];
                                    if (allReleasesId.indexOf(releaseId) !== -1) {
                                        validReleasesIds.push(releaseId);
                                    }
                                }

                                let releasesToRemove = common_backend.getArrayDiff(allReleasesId, validReleasesIds);

                                projects.addTicketToReleases(ticketObj._id, projectId, teamId, validReleasesIds, function (err, result) {
                                    if (err) {
                                        logger.error(JSON.stringify(err));
                                        return res.status(500).send(err);
                                    }

                                    projects.removeTicketFromReleases(ticketObj._id, projectId, teamId, releasesToRemove, function (err, result) {
                                        if (err) {
                                            logger.error(JSON.stringify(err));
                                            return res.status(500).send(err);
                                        }

                                        updatedTicket.releases = validReleasesIds;
                                        return callback();
                                    });
                                });
                            });
                        } else {
                            updatedTicket.releases = [];
                            projects.removeTicketFromReleases(ticketObj._id, projectId, teamId, ticketObj.releases, function (err, result) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                    return res.status(500).send(err);
                                }

                                return callback();
                            });
                        }
                    }

                    let processTags = function (callback) {
                        if (Array.isArray(tags)) {
                            let allTags = common_backend.joinSets(ticketObj.tags, tags);
                            projects.getTagsByIds(projectId, teamId, allTags, function (err, tagsList) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                    return res.status(500).send(err);
                                }

                                let allTagsId = [];
                                for (let i = 0; i < tagsList.length; i++) {
                                    allTagsId.push(tagsList[i]['_id']);
                                }

                                let validTagsIds = [];
                                for (let i = 0; i < tags.length; i++) {
                                    let tagId = tags[i];
                                    if (allTagsId.indexOf(tagId) !== -1) {
                                        validTagsIds.push(tagId);
                                    }
                                }

                                let tagsToRemove = common_backend.getArrayDiff(allTagsId, validTagsIds);

                                projects.addTicketToTags(ticketObj._id, projectId, teamId, validTagsIds, function (err, result) {
                                    if (err) {
                                        logger.error(JSON.stringify(err));
                                        return res.status(500).send(err);
                                    }

                                    projects.removeTicketFromTags(ticketObj._id, projectId, teamId, tagsToRemove, function (err, result) {
                                        if (err) {
                                            logger.error(JSON.stringify(err));
                                            return res.status(500).send(err);
                                        }

                                        updatedTicket.tags = validTagsIds;
                                        return callback();
                                    });
                                });
                            });
                        } else {
                            updatedTicket.tags = [];
                            projects.removeTicketFromTags(ticketObj._id, projectId, teamId, ticketObj.tags, function (err, result) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                    return res.status(500).send(err);
                                }

                                return callback();
                            });
                        }
                    }

                    let processLinks = function (callback) {
                        if (typeof (links) === common_backend.variableTypes.OBJECT) {
                            const linksIdsList = Object.keys(links);
                            const oldLinks = common_backend.convertJsonListToList('ticketId', ticketObj.links);
                            const allLinks = common_backend.joinSets(oldLinks, linksIdsList);
                            projects.getTicketsByIds(projectId, teamId, allLinks, function (err, ticketsObjList) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                    return res.status(500).send(err);
                                }

                                if (ticketsObjList.length === 0) {
                                    return callback();
                                }

                                let counter = 0;
                                for (let i = 0; i < ticketsObjList.length; i++) {
                                    const ticket = ticketsObjList[i];
                                    if (ticketObj._id !== ticket._id) {
                                        if (linksIdsList.indexOf(ticket._id) === -1) {
                                            for (let j = 0; j < ticket.links.length; j++) {
                                                if (ticket.links[j].ticketId === ticketObj._id) {
                                                    ticket.links.splice(j, 1);
                                                    break;
                                                }
                                            }
                                            for (let j = 0; j < ticketObj.links.length; j++) {
                                                if (ticketObj.links[j].ticketId === ticket._id) {
                                                    ticketObj.links.splice(j, 1);
                                                    break;
                                                }
                                            }
                                        } else {
                                            const parsedValue = parseInt(links[ticket._id]);
                                            if (common_backend.isValueInObjectWithKeys(parsedValue, 'value', common_backend.ticketLinkTypes)) {
                                                let foundLink = false;

                                                if (ticket.links.length === 0) {
                                                    ticketObj.links.push({
                                                        ticketId: ticket._id,
                                                        relation: parsedValue
                                                    });

                                                    ticket.links.push({
                                                        ticketId: ticketObj._id,
                                                        relation: parsedValue % 2 === 0 ? parsedValue + 1 : parsedValue - 1
                                                    });
                                                } else {
                                                    for (let j = 0; j < ticket.links.length; j++) {
                                                        if (ticket.links[j].ticketId === ticketObj._id) {
                                                            ticket.links[j].relation = parsedValue % 2 === 0 ? parsedValue + 1 : parsedValue - 1;
                                                            foundLink = true;
                                                        }

                                                        if (!foundLink) {
                                                            ticketObj.links.push({
                                                                ticketId: ticket._id,
                                                                relation: parsedValue
                                                            });

                                                            ticket.links.push({
                                                                ticketId: ticketObj._id,
                                                                relation: parsedValue % 2 === 0 ? parsedValue + 1 : parsedValue - 1
                                                            });
                                                        } else {
                                                            for (let k = 0; k < ticketObj.links.length; k++) {
                                                                if (ticketObj.links[k].ticketId === ticket._id) {
                                                                    ticketObj.links[k].relation = parsedValue;
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }

                                        projects.updateTicket(ticket._id, teamId, projectId, { links: ticket.links }, function (err, result) {
                                            if (err) {
                                                logger.error(JSON.stringify(err));
                                                return res.status(500).send(err);
                                            }

                                            counter++;
                                            if (ticketsObjList.length === counter) {
                                                updatedTicket.links = ticketObj.links;
                                                return callback();
                                            }
                                        });
                                    } else {
                                        counter++;
                                        if (ticketsObjList.length === counter) {
                                            updatedTicket.links = ticketObj.links;
                                            return callback();
                                        }
                                    }
                                }
                            });
                        } else {
                            updatedTicket.links = [];
                            const oldLinks = common_backend.convertJsonListToList('ticketId', ticketObj.links);
                            projects.getTicketsByIds(projectId, teamId, oldLinks, function (err, ticketsObjList) {
                                if (err) {
                                    logger.error(JSON.stringify(err));
                                    return res.status(500).send(err);
                                }

                                if (ticketsObjList.length === 0) {
                                    return callback();
                                }

                                let counter = 0;
                                for (let i = 0; i < ticketsObjList.length; i++) {
                                    let ticket = ticketsObjList[i];
                                    for (let j = 0; j < ticket.links.length; j++) {
                                        if (ticket.links[j].ticketId === ticketObj._id) {
                                            ticket.links.splice(j, 1);
                                        }

                                        projects.updateTicket(ticket._id, teamId, projectId, { links: ticket.links }, function (err, result) {
                                            if (err) {
                                                logger.error(JSON.stringify(err));
                                                return res.status(500).send(err);
                                            }

                                            counter++;
                                            if (ticketsObjList.length === counter) {
                                                return callback();
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    }

                    processSprints(function () {
                        processReleases(function () {
                            processTags(function () {
                                processLinks(function () {
                                    projects.updateTicket(ticketObj._id, teamId, projectId, updatedTicket, function (err, result) {
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
            });
        });
    });
}

/**
 * root path to get edit page components
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const getEditPageComponents = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    return res.status(200).send({
        ticketCommentEntry: common_api.pugComponents.ticketCommentEntry()
    });
}

/**
 * root path to search for tickets in projects
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const renderSearchPage = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.params.projectId;
    const teamId = req.params.teamId;
    const terms = req.query.criteria;

    let searchForTickets = function (projectId, teamId, terms) {
        if (settings.getModeType() === common_backend.modeTypes.COLLABORATORS) {
            projects.searchTicketsByProjectId(projectId, terms, function (err, ticketsList) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(404).render(common_api.pugPages.pageNotFound);
                }

                return res.status(200).render(common_api.pugPages.ticketSearch, {
                    user: req.session.user,
                    projectId: projectId,
                    teamId: teamId,
                    ticketsList: ticketsList,
                    canSearch: true
                });
            });
        } else {
            projects.searchTicketsByTeamId(projectId, teamId, terms, function (err, ticketsList) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(404).render(common_api.pugPages.pageNotFound);
                }

                return res.status(200).render(common_api.pugPages.ticketSearch, {
                    user: req.session.user,
                    projectId: projectId,
                    teamId: teamId,
                    ticketsList: ticketsList,
                    canSearch: true
                });
            });
        }
    }

    projects.getProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.status !== common_backend.projectStatus.ACTIVE.value) {
            logger.error(JSON.stringify(common_backend.getError(2043)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (projectObj.members.indexOf(req.session.user._id) === -1) {
            logger.error(JSON.stringify(common_backend.getError(2018)));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        if (typeof (teamId) === common_backend.variableTypes.UNDEFINED) {
            projects.getTeamByUserId(projectId, req.session.user._id, function (err, teamObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(404).render(common_api.pugPages.pageNotFound);
                }

                searchForTickets(projectId, teamObj._id, terms);
            });
        } else {
            projects.getTeamInProjectById(projectId, teamId, function (err, teamObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(404).render(common_api.pugPages.pageNotFound);
                }

                if (projectObj.admins.indexOf(req.session.user._id) === -1
                    && teamObj.members.indexOf(req.session.user._id) === -1) {
                    logger.error(JSON.stringify(common_backend.getError(2019)));
                    return res.status(404).render(common_api.pugPages.pageNotFound);
                }

                searchForTickets(projectId, teamId, terms);
            });
        }
    });
}

/**
 * path to get the tickets list component
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const getTicketsListComponent = function (req, res) {
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

            if (projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
            }

            projects.getTicketsByTeamId(projectId, teamId, function (err, ticketsObjList) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(404).render(common_api.pugPages.pageNotFound);
                }

                const usersObj = common_backend.convertListToJason('_id', users.getActiveUsersList());
                let limitedTicketList = [];
                for (let i = 0; i < ticketsObjList.length; i++) {
                    let ticket = ticketsObjList[i];
                    let ticketAssignee = usersObj[ticket.assignee];
                    let ticketReporter = usersObj[ticket.reporter];
                    limitedTicketList.push({
                        _id: ticket._id,
                        ctime: ticket.ctime,
                        mtime: ticket.mtime,
                        displayId: ticket.displayId,
                        title: ticket.title,
                        state: ticket.state,
                        type: ticket.type,
                        assignee: ticketAssignee ? `${ticketAssignee.fname} ${ticketAssignee.lname}` : common_backend.noAssignee,
                        reporter: ticketReporter ? `${ticketReporter.fname} ${ticketReporter.lname}` : common_backend.noReporter,
                        assigneePicture: ticketAssignee ? ticketAssignee.picture : null,
                        reporterPicture: ticketReporter ? ticketReporter.picture : null,
                        priority: ticket.priority,
                        points: ticket.points
                    });
                }

                return res.status(200).send({
                    issueEntryHTML: common_api.pugComponents.ticketEntryComponent(),
                    ticketsList: limitedTicketList
                });
            });
        });
    });
}

// <exports> ------------------------------------------------
exports.createTicket = createTicket;
exports.getEditPageComponents = getEditPageComponents;
exports.getTicketByDisplayId = getTicketByDisplayId;
exports.getTicketsListComponent = getTicketsListComponent;
exports.renderCreateTicketPage = renderCreateTicketPage;
exports.renderTicketPage = renderTicketPage;
exports.renderSearchPage = renderSearchPage;
exports.updateTicket = updateTicket;
// </exports> -----------------------------------------------