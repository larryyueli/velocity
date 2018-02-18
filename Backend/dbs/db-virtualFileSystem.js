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

const common = require('./../common.js');

var vfsCollection;

/**
 * instantiate the virtual file system database object
 *
 * @param {object} collectionObject collection object
 */
const initialize = function (collectionObject) {
    vfsCollection = collectionObject;
}

/**
 * add an entry to the virtual file system collection
 *
 * @param {object} systemEntry the system entry to add
 * @param {function} callback callback function
 */
const addToVirtualFileSystem = function (systemEntry, callback) {
    vfsCollection.insert(systemEntry, function (err, obj) {
        if (err) {
            return callback(common.getError(4000), null);
        }

        return callback(null, systemEntry);
    });
}

/**
 * remove an entry from the virtual file system
 *
 * @param {object} searchQuery the search query for the entry
 * @param {function} callback callback function
 */
const removeFromVirtualFileSystem = function (searchQuery, callback) {
    vfsCollection.remove(searchQuery, function (err, result) {
        if (err) {
            return callback(common.getError(4002), null);
        }

        return callback(null, 'ok');
    });
}

/**
 * find an entry in the virtual file system by the search query
 *
 * @param {object} searchQuery search query
 * @param {function} callback callback function
 */
const findInVirtualFileSystem = function (searchQuery, callback) {
    vfsCollection.findOne(searchQuery, function (err, obj) {
        if (err) {
            return callback(common.getError(4005), null);
        }

        if (!obj) {
            return callback(common.getError(4006), null);
        }

        return callback(null, obj);
    });
}

// <exports> -----------------------------------
exports.addToVirtualFileSystem = addToVirtualFileSystem;
exports.findInVirtualFileSystem = findInVirtualFileSystem;
exports.initialize = initialize;
exports.removeFromVirtualFileSystem = removeFromVirtualFileSystem;
// </exports> ----------------------------------