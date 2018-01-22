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

const common = require('./../common.js');

var settingsCollection;

/**
 * instantiate the settings database object
 *
 * @param {object} collectionObject collection object
 */
const initialize = function (collectionObject) {
    settingsCollection = collectionObject;
}
exports.initialize = initialize;

/**
 * get the settings object
 *
 * @param {function} callback callback function
 */
const getAllSettings = function (callback) {
    settingsCollection.findOne({}, function (err, obj) {
        if (err) {
            return callback(common.getError(1007), null);
        }

        if (!obj) {
            return callback(common.getError(1008), null);
        }

        return callback(null, obj);
    });
}
exports.getAllSettings = getAllSettings;

/**
 * remove the settings object to its initial state
 *
 * @param {function} callback callback function
 */
const removeAllSettings = function (callback) {
    settingsCollection.remove({}, function (err, result) {
        if (err) {
            return callback(common.getError(1009), null);
        }

        return callback(null, 'ok');
    });
}
exports.removeAllSettings = removeAllSettings;

/**
 * add the settings object
 *
 * @param {object} settingsObj the settings object
 * @param {function} callback callback function
 */
const addAllSettings = function (settingsObj, callback) {
    settingsCollection.insert(settingsObj, function (err, obj) {
        if (err) {
            return callback(common.getError(1010), null);
        }

        return callback(null, settingsObj);
    });
}
exports.addAllSettings = addAllSettings;

/**
 * update the settings object
 *
 * @param {object} udpateQuery the deltas for the settings object
 * @param {function} callback callback function
 */
const updateAllSettings = function (udpateQuery, callback) {
    settingsCollection.update({}, udpateQuery, function (err, result) {
        if (err) {
            return callback(common.getError(1011), null);
        }

        return callback(null, 'ok');
    });
}
exports.updateAllSettings = updateAllSettings;