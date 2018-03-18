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

var commentsCollection;

/**
 * instantiate the comments database object
 *
 * @param {object} collectionObject collection object
 */
const initialize = function (collectionObject) {
    commentsCollection = collectionObject;
}

/**
 * add a comment object
 *
 * @param {object} commentObj the comment object
 * @param {function} callback callback function
 */
const addComment = function (commentObj, callback) {
    commentsCollection.insert(commentObj, function (err, obj) {
        if (err) {
            return callback(common.getError(8001), null);
        }

        return callback(null, commentObj);
    });
}

/**
 * get the limited list of comments from the database
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit
 * @param {function} callback callback function
 */
const getLimitedCommentsListSorted = function (searchQuery, sortQuery, lim, callback) {
    commentsCollection.find(searchQuery).sort(sortQuery).limit(lim).toArray(function (err, list) {
        if (err) {
            return callback(common.getError(8002), null);
        }

        return callback(null, list);
    });
}

/**
 * find a single comment by the search parameters
 *
 * @param {object} searchQuery search parameters
 * @param {function} callback callback function
 */
const getComment = function (searchQuery, callback) {
    commentsCollection.findOne(searchQuery, function (err, obj) {
        if (err) {
            return callback(common.getError(8003), null);
        }

        if (!obj) {
            return callback(common.getError(8004), null);
        }

        return callback(null, obj);
    });
}

/**
 * find comments by the search parameters,
 * then update their values by the update parameters
 *
 * @param {object} searchQuery search parameters
 * @param {object} updateQuery update parameters
 * @param {function} callback callback function
 */
const updateComment = function (searchQuery, updateQuery, callback) {
    commentsCollection.update(searchQuery, updateQuery, function (err, result) {
        if (err) {
            return callback(common.getError(8005), null);
        }

        return callback(null, 'ok');
    });
}

// <exports> -----------------------------------
exports.addComment = addComment;
exports.getLimitedCommentsListSorted = getLimitedCommentsListSorted;
exports.getComment = getComment;
exports.initialize = initialize;
exports.updateComment = updateComment;
// </exports> ----------------------------------