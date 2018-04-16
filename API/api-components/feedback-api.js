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
const feedback = require('../../Backend/feedback.js');
const logger = require('../../Backend/logger.js');

/**
 * root path to create a feedback
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const createFeedback = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type === common_backend.userTypes.COLLABORATOR_ADMIN.value
        || req.session.user.type === common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(13005)));
        return res.status(400).send(common_backend.getError(13005));
    }

    const subject = req.body.subject;
    const body = req.body.body;
    const newFeedback = {
        subject: req.body.subject,
        body: req.body.body,
        creator: req.session.user._id
    };

    feedback.addFeedback(newFeedback, function (err, feedbackObj) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        return res.status(200).send(feedbackObj);
    });
}

/**
 * root path to render the feedback page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const renderFeedbackPage = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(13006)));
        return res.status(404).render(common_api.pugPages.pageNotFound);
    }

    feedback.getFeedbackList(function (err, feedbackList) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(404).render(common_api.pugPages.pageNotFound);
        }

        return res.status(200).render(common_api.pugPages.feedback, {
            user: req.session.user,
            feedbackList: feedbackList
        });
    });
}

// <exports> ------------------------------------------------
exports.createFeedback = createFeedback;
exports.renderFeedbackPage = renderFeedbackPage;
// </exports> -----------------------------------------------