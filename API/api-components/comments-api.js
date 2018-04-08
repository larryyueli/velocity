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
 * root path for commenting on a ticket
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const addComment = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    const teamId = req.body.teamId;
    const ticketId = req.body.ticketId;

    projects.getActiveProjectById(projectId, function (err, projectObj) {
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

            projects.getTicketsByTeamId(projectId, teamId, function (err, ticketsList) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                let ticketObj = null;
                for (let i = 0; i < ticketsList.length; i++) {
                    if (ticketsList[i]._id === ticketId) {
                        ticketObj = ticketsList[i];
                    }
                }

                if (!ticketObj) {
                    logger.error(JSON.stringify(common_backend.getError(7004)));
                    return res.status(400).send(common_backend.getError(7004));
                }

                const ticketsDisplayIdObj = common_backend.convertListToJason('displayId', ticketsList);
                const userNamesObj = common_backend.convertListToJason('username', users.getActiveUsersList());

                const content = req.body.content;
                let splitContent = content.split(' ');
                let resolvedContent = '';

                for (let i = 0; i < splitContent.length; i++) {
                    let phrase = splitContent[i];
                    let firstChar = phrase.charAt(0);
                    switch (firstChar) {
                        case '@':
                            let username = phrase.slice(1);
                            let user = userNamesObj[username];
                            if (user) {
                                resolvedContent += `@${user._id} `;

                                if (req.session.user._id !== user._id) {
                                    let notifObj = common_backend.notifications.COMMENT_MENTION;
                                    notifObj.link = `/project/${projectId}/team/${teamId}/ticket/${ticketObj._id}`;
                                    notifications_api.notifyUserById(user._id, notifObj);
                                }
                            } else {
                                resolvedContent += `@UNKNOWN `;
                            }
                            break;
                        case '#':
                            let ticketDisplayId = phrase.slice(1);
                            let ticket = ticketsDisplayIdObj[ticketDisplayId];
                            if (ticket) {
                                resolvedContent += `#${ticket._id} `;
                            } else {
                                resolvedContent += `#UNKNOWN `;
                            }
                            break;
                        default:
                            resolvedContent += `${phrase} `;
                            break;
                    }
                }

                resolvedContent = resolvedContent.trim();

                const newComment = {
                    projectId: projectId,
                    teamId: teamId,
                    ticketId: ticketId,
                    userId: req.session.user._id,
                    content: resolvedContent
                };

                projects.addCommentToTicket(newComment, function (err, result) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    let notifObj = common_backend.notifications.COMMENT_ADDED;
                    notifObj.link = `/project/${projectId}/team/${teamId}/ticket/${ticketObj._id}`;

                    if (req.session.user._id !== ticketObj.assignee) {
                        notifications_api.notifyUserById(ticketObj.assignee, notifObj);
                    }
                    if (req.session.user._id !== ticketObj.reporter) {
                        notifications_api.notifyUserById(ticketObj.reporter, notifObj);
                    }

                    return res.status(200).send(result);
                });
            });
        });
    });
}

/**
 * root path to edit a comment
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const updateComment = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    const teamId = req.body.teamId;
    const ticketId = req.body.ticketId;
    const commentId = req.body.commentId;

    projects.getActiveProjectById(projectId, function (err, projectObj) {
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

                projects.getCommentById(projectId, teamId, ticketId, commentId, function (err, commentObj) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    if (commentObj.userId !== req.session.user._id) {
                        logger.error(JSON.stringify(common_backend.getError(2046)));
                        return res.status(400).send(common_backend.getError(2046));
                    }

                    let updatedComment = { content: req.body.content };
                    projects.updateComment(commentId, ticketId, teamId, projectId, updatedComment, function (err, result) {
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
}

/**
 * root path to delete a comment
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const deleteComment = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    const teamId = req.body.teamId;
    const ticketId = req.body.ticketId;
    const commentId = req.body.commentId;

    projects.getActiveProjectById(projectId, function (err, projectObj) {
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

                projects.getCommentById(projectId, teamId, ticketId, commentId, function (err, commentObj) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    if (commentObj.userId !== req.session.user._id) {
                        logger.error(JSON.stringify(common_backend.getError(2047)));
                        return res.status(400).send(common_backend.getError(2047));
                    }

                    let updatedComment = { status: common_backend.commentStatus.DELETED.value };
                    projects.updateComment(commentId, ticketId, teamId, projectId, updatedComment, function (err, result) {
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
}

// <exports> ------------------------------------------------
exports.addComment = addComment;
exports.deleteComment = deleteComment;
exports.updateComment = updateComment;
// </exports> -----------------------------------------------