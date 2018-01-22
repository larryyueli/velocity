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

const settingsObject;

/**
 * fetch the settings object from the database
 *
 * @param {function} callback callback function
 */
const initialize = function (callback) {
    db.getSettings(function (err, obj) {
        if (err) {
            if (err.code === 1008) {
                resetSettings(callback);
            } else {
                return callback(err, null);
            }
        }

        settingsObject = obj;
        return callback(null, 'ok');
    });
}
exports.initialize = initialize;

/**
 * get all settings
 *
 * @returns {object}
 */
const getSettings = function () {
    return settingsObject;
}
exports.getSettings = getSettings;

/**
 * reset all settings to default
 *
 * @param {function} callback callback function
 */
const resetSettings = function (callback) {
    db.removeSettings(function (err, result) {
        if (err) {
            return callback(err, null);
        }

        var defaultSettings = {};
        defaultSettings._id = common.getUUID();
        defaultSettings.active = true;
        defaultSettings.type = common.projectType.UNKNOWN;

        db.addSettings(defaultSettings, function (err, result) {
            if (err) {
                return callback(err, null);
            }

            settingsObject = obj;
            return callback(null, 'ok');
        });
    });
}
exports.resetSettings = resetSettings;