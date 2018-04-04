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
const settings = require('../../Backend/settings.js');

/**
 * path to get the settings page
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const renderSettingsPage = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2030)));
        return res.status(404).render(common_api.pugPages.pageNotFound);
    }

    return res.status(200).render(common_api.pugPages.settings, {
        user: req.session.user,
        generalActive: settings.isWebsiteActive(),
        canEditFirstAndLastName: settings.isUsersAbleEditFirstAndLastName(),
        canEditEmail: settings.isUsersAbleEditEmail(),
        canEditPassword: settings.isUsersAbleEditPassword()
    });
}

/**
 * path to reset the settings object
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const resetSettings = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2031)));
        return res.status(400).send(common_backend.getError(2031));
    }

    settings.resetAllSettings(function (err, result) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        return res.status(200).send('ok');
    });
}

/**
 * path to update the settings object
 *
 * @param {object} req req object
 * @param {object} res res object
 */
const updateSettings = function (req, res) {
    if (!common_api.isActiveSession(req)) {
        return res.status(401).render(common_api.pugPages.login);
    }

    if (req.session.user.type !== common_backend.userTypes.COLLABORATOR_ADMIN.value
        && req.session.user.type !== common_backend.userTypes.PROFESSOR.value) {
        logger.error(JSON.stringify(common_backend.getError(2032)));
        return res.status(400).send(common_backend.getError(2032));
    }

    const updateObject = {
        active: common_backend.convertStringToBoolean(req.body.active),
        canEditEmail: common_backend.convertStringToBoolean(req.body.canEditEmail),
        canEditFirstAndLastName: common_backend.convertStringToBoolean(req.body.canEditFirstAndLastName),
        canEditPassword: common_backend.convertStringToBoolean(req.body.canEditPassword)
    };

    settings.updateAllSettings(updateObject, function (err, result) {
        if (err) {
            logger.error(JSON.stringify(err));
            return res.status(500).send(err);
        }

        return res.status(200).send('ok');
    });
}

// <exports> ------------------------------------------------
exports.renderSettingsPage = renderSettingsPage;
exports.resetSettings = resetSettings;
exports.updateSettings = updateSettings;
// </exports> -----------------------------------------------