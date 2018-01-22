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

var settingsCollection;

/**
 * get the settings object
 *
 * @param {function} callback callback function
 */
const getSettings = function (callback) {
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
exports.getSettings = getSettings;

/**
 * remove the settings object to its initial state
 *
 * @param {function} callback callback function
 */
const removeSettings = function (callback) {
    settingsCollection.remove({}, function (err, result) {
        if (err) {
            return callback(common.getError(1009), null);
        }

        return callback(null, 'ok');
    });
}
exports.removeSettings = removeSettings;

/**
 * add the settings object
 *
 * @param {object} settingsObj the settings object
 * @param {function} callback callback function
 */
const addSettings = function (settingsObj, callback) {
    settingsCollection.insert(settingsObj, function (err, obj) {
        if (err) {
            return callback(common.getError(1010), null);
        }

        return callback(null, settingsObj);
    });
}
exports.addSettings = addSettings;