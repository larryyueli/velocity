/*
UI errors for user display
1000 -> user errors
*/
const errors = Object.freeze({
    //1000 user errors
    1000: 'Invalid username or password',
});

const defaultError = 'A system error has occured';

/**
 * Returns the correct error message to use, if no errors match returns
 * the default error message
 * 
 * @param {Object} data
 * @returns {String} Error message 
 */
function getErrorFromResponse(data) {
    return data ? errors[data['code']] || defaultError : defaultError;
}
