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

/**
 * Returns the ticket states for sprints and releases
 * @param {*} sprints sprints object
 * @param {*} callback callback
 */
const getTicketStates = function (sprints, callback) {
    let states = {
        sprints: []
    }

    return callback(null, states);
}

//return callback(null, obj);

// <exports> -----------------------------------
exports.getTicketStates = getTicketStates;
// </exports> ----------------------------------