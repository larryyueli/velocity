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

const path = require('path');

const common_api = require('./common-api.js');

const notifications = require('../../Backend/customFileSystem.js');

var notificationsWS;

/**
 * initialize the notifications api components
 *
 * @param {object} nWS notifications web secket instance
 * @param {function} callback callback function
 */
const initialize = function (nWS) {
}


// <exports> ------------------------------------------------
exports.initialize = initialize;
// </exports> -----------------------------------------------