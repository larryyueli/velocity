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

var tagsCollection;

/**
 * instantiate the tags database object
 *
 * @param {object} collectionObject collection object
 */
const initialize = function (collectionObject) {
    tagsCollection = collectionObject;
}

/**
 * add a tag object
 *
 * @param {object} tagObj the tag object
 * @param {function} callback callback function
 */
const addTag = function (tagObj, callback) {
    tagsCollection.insert(tagObj, function (err, obj) {
        if (err) {
            return callback(common.getError(12001), null);
        }

        return callback(null, tagObj);
    });
}

/**
 * get the limited list of tags from the database
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit
 * @param {function} callback callback function
 */
const getLimitedTagsListSorted = function (searchQuery, sortQuery, lim, callback) {
    tagsCollection.find(searchQuery).sort(sortQuery).limit(lim).toArray(function (err, list) {
        if (err) {
            return callback(common.getError(12002), null);
        }

        return callback(null, list);
    });
}

/**
 * find a single tag by the search parameters
 *
 * @param {object} searchQuery search parameters
 * @param {function} callback callback function
 */
const getTag = function (searchQuery, callback) {
    tagsCollection.findOne(searchQuery, function (err, obj) {
        if (err) {
            return callback(common.getError(12003), null);
        }

        if (!obj) {
            return callback(common.getError(12004), null);
        }

        return callback(null, obj);
    });
}

/**
 * find tags by the search parameters,
 * then update their values by the update parameters
 *
 * @param {object} searchQuery search parameters
 * @param {object} updateQuery update parameters
 * @param {function} callback callback function
 */
const updateTag = function (searchQuery, updateQuery, callback) {
    tagsCollection.update(searchQuery, updateQuery, function (err, result) {
        if (err) {
            return callback(common.getError(12005), null);
        }

        return callback(null, 'ok');
    });
}

/**
 * find tags by the search parameters,
 * then update their values by the update parameters
 *
 * @param {object} searchQuery search parameters
 * @param {object} updateQuery update parameters
 * @param {function} callback callback function
 */
const updateTags = function (searchQuery, updateQuery, callback) {
    tagsCollection.update(searchQuery, updateQuery, { multi: true }, function (err, result) {
        if (err) {
            return callback(common.getError(12005), null);
        }

        return callback(null, 'ok');
    });
}

// <exports> -----------------------------------
exports.addTag = addTag;
exports.getLimitedTagsListSorted = getLimitedTagsListSorted;
exports.getTag = getTag;
exports.initialize = initialize;
exports.updateTag = updateTag;
exports.updateTags = updateTags;
// </exports> ----------------------------------