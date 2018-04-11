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

const common_backend = require('../../Backend/common.js');
const logger = require('../../Backend/logger.js');
const projects = require('../../Backend/projects.js');
const settings = require('../../Backend/settings.js');

/**
 * root path to create a tag
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const createTag = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    const teamId = req.body.teamId;
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

            let newTag = {
                projectId: projectId,
                teamId: teamId,
                name: req.body.name
            };
            projects.addTagToTeam(newTag, function (err, tagObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                return res.status(200).send(tagObj);
            });
        });
    });
}

/**
 * root path to get the tags list
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const getTagsList = function (req, res) {
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

            if (settings.getModeType() === common_backend.modeTypes.CLASS
                && projectObj.admins.indexOf(req.session.user._id) === -1
                && teamObj.members.indexOf(req.session.user._id) === -1) {
                logger.error(JSON.stringify(common_backend.getError(2019)));
                return res.status(400).send(common_backend.getError(2019));
            }

            projects.getTagsByTeamId(projectId, teamId, function (err, tagsObjList) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                let tagsList = [];
                for (let i = 0; i < tagsObjList.length; i++) {
                    let tag = tagsObjList[i];
                    tagsList.push({
                        _id: tag._id,
                        name: tag.name
                    });
                }

                return res.status(200).send({
                    tagsList: tagsList
                });
            });
        });
    });
}

/**
 * root path to delete a tag
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const deleteTag = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.body.projectId;
    const teamId = req.body.teamId;
    const tagId = req.body.tagId;

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

            projects.getTagById(projectId, teamId, tagId, function (err, tagObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                if (tagObj.status !== common_backend.tagStatus.ACTIVE.value) {
                    logger.error(JSON.stringify(common_backend.getError(2054)));
                    return res.status(400).send(common_backend.getError(2054));
                }

                let updatedTag = { status: common_backend.tagStatus.DELETED.value };
                projects.updateTagById(tagId, teamId, projectId, updatedTag, function (err, result) {
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
 * root path to render the tag page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const renderTagPage = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.params.projectId;
    const teamId = req.params.teamId;
    const tagId = req.params.tagId;
    projects.getActiveProjectById(projectId, function (err, projectObj) {
        if (err) {
            logger.error(JSON.stringify(err));
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

            return res.status(200).render(common_api.pugPages.tagPage, {
                user: req.session.user,
                projectId: projectId,
                teamId: teamId
            });
        });
    });
}

/**
 * root path to get the tag page components
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const getTagComponents = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    const projectId = req.params.projectId;
    const teamId = req.params.teamId;
    const tagId = req.params.tagId;
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

            projects.getTagById(projectId, teamId, tagId, function (err, tagObj) {
                if (err) {
                    logger.error(JSON.stringify(err));
                    return res.status(500).send(err);
                }

                projects.getTicketsByIds(projectId, teamId, tagObj.tickets, function (err, ticketsList) {
                    if (err) {
                        logger.error(JSON.stringify(err));
                        return res.status(500).send(err);
                    }

                    return res.status(200).send({
                        ticketEntryComponent: common_api.pugComponents.ticketEntryComponent(),
                        ticketsList: ticketsList
                    });
                });
            });
        });
    });
}

// <exports> ------------------------------------------------
exports.createTag = createTag;
exports.deleteTag = deleteTag;
exports.getTagComponents = getTagComponents;
exports.getTagsList = getTagsList;
exports.renderTagPage = renderTagPage;
// </exports> -----------------------------------------------