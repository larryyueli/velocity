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

var releasesCollection;

/**
 * instantiate the releases database object
 *
 * @param {object} collectionObject collection object
 */
const initialize = function (collectionObject) {
    releasesCollection = collectionObject;
}

/**
 * add a release object
 *
 * @param {object} releaseObj the release object
 * @param {function} callback callback function
 */
const addRelease = function (releaseObj, callback) {
    releasesCollection.insert(releaseObj, function (err, obj) {
        if (err) {
            return callback(common.getError(11001), null);
        }

        return callback(null, releaseObj);
    });
}

/**
 * get the limited list of releases from the database
 *
 * @param {object} searchQuery search parameters
 * @param {object} sortQuery sort parameters
 * @param {number} lim limit
 * @param {function} callback callback function
 */
const getLimitedReleasesListSorted = function (searchQuery, sortQuery, lim, callback) {
    releasesCollection.find(searchQuery).sort(sortQuery).limit(lim).toArray(function (err, list) {
        if (err) {
            return callback(common.getError(11002), null);
        }

        return callback(null, list);
    });
}

/**
 * find a single release by the search parameters
 *
 * @param {object} searchQuery search parameters
 * @param {function} callback callback function
 */
const getRelease = function (searchQuery, callback) {
    releasesCollection.findOne(searchQuery, function (err, obj) {
        if (err) {
            return callback(common.getError(11003), null);
        }

        if (!obj) {
            return callback(common.getError(11004), null);
        }

        return callback(null, obj);
    });
}

/**
 * find releases by the search parameters,
 * then update their values by the update parameters
 *
 * @param {object} searchQuery search parameters
 * @param {object} updateQuery update parameters
 * @param {function} callback callback function
 */
const updateRelease = function (searchQuery, updateQuery, callback) {
    releasesCollection.update(searchQuery, updateQuery, function (err, result) {
        if (err) {
            return callback(common.getError(11005), null);
        }

        return callback(null, 'ok');
    });
}

/**
 * find releases by the search parameters,
 * then update their values by the update parameters
 *
 * @param {object} searchQuery search parameters
 * @param {object} updateQuery update parameters
 * @param {function} callback callback function
 */
const updateReleases = function (searchQuery, updateQuery, callback) {
    releasesCollection.update(searchQuery, updateQuery, { multi: true }, function (err, result) {
        if (err) {
            return callback(common.getError(11005), null);
        }

        return callback(null, 'ok');
    });
}

// <exports> -----------------------------------
exports.addRelease = addRelease;
exports.getLimitedReleasesListSorted = getLimitedReleasesListSorted;
exports.getRelease = getRelease;
exports.initialize = initialize;
exports.updateRelease = updateRelease;
exports.updateReleases = updateReleases;
// </exports> ----------------------------------