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

const fs = require('fs');
const rimraf = require('rimraf');

const common = require('./common.js');
const db = require('./db.js');

/**
 * check if the file system exists, and create it if it doesnt
 *
 * @param {function} callback callback function
 */
const initialize = function (callback) {
    existsSync(common.cfsMainDirectories.FILESYSTEM, function (err, result) {
        if (err) {
            if (err.code === 4006 || err.code === 4007) {
                return resetCustomFileSystem(callback);
            }

            return callback(err, null);
        }

        existsSync(common.cfsMainDirectories.USERS, function (err, result) {
            if (err) {
                if (err.code === 4006 || err.code === 4007) {
                    return resetCustomFileSystem(callback);
                }

                return callback(err, null);
            }

            return callback(null, 'ok');
        });
    });
}

/**
 * make a directory given its parent path and the name of the new directory
 *
 * @param {string} parentPath parent path
 * @param {string} directoryName new directory's name
 * @param {string} directoryPermissions new directory's permissions
 * @param {function} callback callback function
 */
const mkdir = function (parentPath, directoryName, directoryPermissions, callback) {
    const fullPath = `${parentPath}/${directoryName}`;
    const entryObject = {
        _id: directoryName,
        path: fullPath,
        type: common.cfsTypes.DIRECTORY,
        ctime: common.getDate(),
        permission: directoryPermissions
    };

    db.addToVirtualFileSystem(entryObject, function (err, result) {
        if (err) {
            return callback(err, null);
        }

        fs.mkdir(fullPath, function (err) {
            if (err) {
                return callback(common.getError(4001), null);
            }

            return callback(null, entryObject);
        });
    });
}

/**
 * BE CAREFUL: remove a directory given its parent path and the name of the new directory
 *
 * @param {string} parentPath parent path
 * @param {string} directoryName directory name
 * @param {function} callback callback function
 */
const rmdir = function (parentPath, directoryName, callback) {
    const fullPath = `${parentPath}/${directoryName}`;
    db.removeFromVirtualFileSystem({ _id: directoryName }, function (err, result) {
        if (err) {
            return callback(err, null);
        }

        fs.rmdir(fullPath, function (err) {
            if (err) {
                return callback(common.getError(4003), null);
            }

            return callback(null, 'ok');
        });
    });
}

/**
 * BE CAREFUL: perform rm -rf on a directory
 *
 * @param {string} parentPath parent path
 * @param {string} directoryName directory name
 * @param {function} callback callback function
 */
const rmrf = function (parentPath, directoryName, callback) {
    const fullPath = `${parentPath}/${directoryName}`;
    db.removeFromVirtualFileSystem({ _id: directoryName }, function (err, result) {
        if (err) {
            return callback(err, null);
        }

        rimraf(fullPath, function (err) {
            if (err) {
                return callback(common.getError(4004), null);
            }

            return callback(null, 'ok');
        });
    });
}

/**
 * check if a file or directory exists
 *
 * @param {string} entryId file or directory Id
 * @param {function} callback callback function
 */
const existsSync = function (entryId, callback) {
    db.findInVirtualFileSystem({ _id: entryId }, function (err, fileObj) {
        if (err) {
            return callback(err, null);
        }

        if (!fs.existsSync(fileObj.path)) {
            return callback(common.getError(4007), null);
        }

        return callback(null, fileObj);
    });
}

/**
 * write data to a file
 *
 * @param {object} fileObj fileName, filePath, fileExtension, fileCreator, filePermissions and fileData
 * @param {function} callback callback function
 */
const writeFile = function (fileObj, callback) {
    const fullPath = `${fileObj.filePath}/${fileObj.fileName}.${fileObj.fileExtension}`;
    const fileObject = {
        _id: fileObj.fileName,
        path: fullPath,
        type: common.cfsTypes.FILE,
        extension: fileObj.fileExtension,
        creator: fileObj.fileCreator,
        ctime: common.getDate(),
        permission: fileObj.filePermissions
    };

    db.addToVirtualFileSystem(fileObject, function (err, result) {
        if (err) {
            return callback(err, null);
        }

        fs.writeFile(fullPath, fileObj.fileData, function (err) {
            if (err) {
                return callback(common.getError(4008), null);
            }

            return callback(null, fileObject);
        });
    });
}

/**
 * re-create the custom file system
 *
 * @param {function} callback callback function
 */
const resetCustomFileSystem = function (callback) {
    removeCustomFileSystem(function (err, result) {
        if (err) {
            return callback(err, null);
        }

        return createCustomFileSystem(callback);
    });
}

/**
 * remove the custom file system
 *
 * @param {function} callback callback function
 */
const removeCustomFileSystem = function (callback) {
    db.removeFromVirtualFileSystem({}, function (err, result) {
        if (err) {
            return callback(err, null);
        }

        rimraf(common.cfsTree.HOME, function (err) {
            if (err) {
                return callback(common.getError(4009), null);
            }

            return callback(null, 'ok');
        });
    });
}

/**
 * create the root of custom file system
 *
 * @param {function} callback callback function
 */
const createCustomFileSystem = function (callback) {
    let dParent = common.cfsTree.ROOT;
    let dName = common.cfsMainDirectories.FILESYSTEM;
    let dPermissions = common.cfsPermission.SYSTEM;
    mkdir(dParent, dName, dPermissions, function (err, result) {
        if (err) {
            return callback(err, null);
        }

        dParent = common.cfsTree.HOME;
        dName = common.cfsMainDirectories.USERS;
        dPermissions = common.cfsPermission.SYSTEM;
        mkdir(dParent, dName, dPermissions, callback);
    });
}

// <exports> -----------------------------------
exports.createCustomFileSystem = createCustomFileSystem;
exports.dirExists = existsSync;
exports.fileExists = existsSync;
exports.initialize = initialize;
exports.mkdir = mkdir;
exports.removeCustomFileSystem = removeCustomFileSystem;
exports.resetCustomFileSystem = resetCustomFileSystem;
exports.rmdir = rmdir;
exports.rmrf = rmrf;
exports.writeFile = writeFile;
// </exports> ----------------------------------