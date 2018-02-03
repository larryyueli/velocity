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

const common = require('./common.js');
const db = require('./db.js');

var settingsObject;

/**
 * fetch the settings object from the database
 *
 * @param {function} callback callback function
 */
const initialize = function (callback) {
    updateCachedSettings(callback);
}

/**
 * get all settings
 *
 * @returns {object}
 */
const getAllSettings = function () {
    return settingsObject;
}

/**
 * fetch the latest settings object from the database
 *
 * @param {function} callback callback function
 */
const updateCachedSettings = function (callback) {
    db.getAllSettings(function (err, obj) {
        if (err) {
            if (err.code === 3001) {
                return resetAllSettings(callback);
            } else {
                return callback(err, null);
            }
        }

        settingsObject = obj;
        return callback(null, obj);
    });
}

/**
 * reset all settings to default
 *
 * @param {function} callback callback function
 */
const resetAllSettings = function (callback) {
    db.removeAllSettings(function (err, result) {
        if (err) {
            return callback(err, null);
        }

        const currentDate = common.getDate();;
        var defaultSettings = {};
        defaultSettings._id = common.getUUID();
        defaultSettings.ctime = currentDate;
        defaultSettings.mtime = currentDate;
        defaultSettings.active = true;
        defaultSettings.mode = common.modeTypes.UNKNOWN;
        defaultSettings.users = {};
        defaultSettings.users.canEditEmail = false;
        defaultSettings.users.canEditFirstAndLastName = false;
        defaultSettings.users.canEditPassword = false;

        db.addAllSettings(defaultSettings, function (err, result) {
            if (err) {
                return callback(err, null);
            }

            settingsObject = defaultSettings;
            return callback(null, defaultSettings);
        });
    });
}

/**
 * update the website active status
 *
 * @param {boolean} status active status
 * @param {function} callback callback function
 */
const updateActiveStatus = function (status, callback) {
    if (typeof (common.convertStringToBoolean(status)) !== common.variableTypes.BOOLEAN) {
        return callback(common.getError(3009), null);
    }

    updateAllSettings({ active: status }, callback);
}

/**
 * update the mode type
 *
 * @param {number} modeType mode type
 * @param {function} callback callback function
 */
const updateModeType = function (modeType, callback) {
    if (!common.isValueInObject(modeType, common.modeTypes)) {
        return callback(common.getError(3006), null);
    }

    updateAllSettings({ mode: modeType }, callback);
}

/**
 * update users can edit thier email
 *
 * @param {boolean} status active status
 * @param {function} callback callback function
 */
const updateUsersCanEditEmail = function (status, callback) {
    if (typeof (common.convertStringToBoolean(status)) !== common.variableTypes.BOOLEAN) {
        return callback(common.getError(3009), null);
    }

    updateAllSettings({ canEditEmail: status }, callback);
}

/**
 * update users can edit thier first and last name
 *
 * @param {boolean} status active status
 * @param {function} callback callback function
 */
const updateUsersCanEditFirstAndLastName = function (status, callback) {
    if (typeof (common.convertStringToBoolean(status)) !== common.variableTypes.BOOLEAN) {
        return callback(common.getError(3009), null);
    }

    updateAllSettings({ canEditFirstAndLastName: status }, callback);
}

/**
 * update users can edit thier password
 *
 * @param {boolean} status active status
 * @param {function} callback callback function
 */
const updateUsersCanEditPassword = function (status, callback) {
    if (typeof (common.convertStringToBoolean(status)) !== common.variableTypes.BOOLEAN) {
        return callback(common.getError(3009), null);
    }

    updateAllSettings({ canEditPassword: status }, callback);
}

/**
 * update all settings
 *
 * @param {object} newSettings update parameters
 * @param {function} callback callback function
 */
const updateAllSettings = function (newSettings, callback) {
    var updateQuery = {};
    updateQuery.$set = {};
    updateQuery.$set.users = {};

    if (typeof (common.convertStringToBoolean(newSettings.active)) === common.variableTypes.BOOLEAN) {
        updateQuery.$set['active'] = newSettings.active;
    }

    if (common.isValueInObject(newSettings.mode, common.modeTypes)) {
        updateQuery.$set['mode'] = newSettings.mode;
    }

    if (typeof (common.convertStringToBoolean(newSettings.canEditEmail)) === common.variableTypes.BOOLEAN) {
        updateQuery.$set['users.canEditEmail'] = newSettings.canEditEmail;
    }

    if (typeof (common.convertStringToBoolean(newSettings.canEditFirstAndLastName)) === common.variableTypes.BOOLEAN) {
        updateQuery.$set['users.canEditFirstAndLastName'] = newSettings.canEditFirstAndLastName;
    }

    if (typeof (common.convertStringToBoolean(newSettings.canEditPassword)) === common.variableTypes.BOOLEAN) {
        updateQuery.$set['users.canEditPassword'] = newSettings.canEditPassword;
    }

    if (common.isEmptyObject(updateQuery.$set.users)) {
        delete updateQuery.$set.users;
    }

    if (common.isEmptyObject(updateQuery.$set)) {
        delete updateQuery.$set;
    }

    if (common.isEmptyObject(updateQuery)) {
        return callback(common.getError(3008), null);
    }

    updateQuery.$set.mtime = common.getDate();

    db.updateAllSettings(updateQuery, function (err, result) {
        if (err) {
            return callback(err, null);
        }

        updateCachedSettings(callback);
    });
}

// <exports> -----------------------------------
exports.getAllSettings = getAllSettings;
exports.initialize = initialize;
exports.resetAllSettings = resetAllSettings;
exports.updateActiveStatus = updateActiveStatus;
exports.updateAllSettings = updateAllSettings;
exports.updateUsersCanEditEmail = updateUsersCanEditEmail;
exports.updateUsersCanEditFirstAndLastName = updateUsersCanEditFirstAndLastName;
exports.updateUsersCanEditPassword = updateUsersCanEditPassword;
exports.updateModeType = updateModeType;
// </exports> ----------------------------------