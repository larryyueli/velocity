/*
UI errors for user display

1000 -> user errors
2000 -> system errors
*/
const errors = Object.freeze({
    //1000 system errors

    //2000 user errors
    2000: 'Invalid username or password',
});

const defaultError = 'Something went wrong, please try again!';

/**
 * Returns the correct error message to use, if no errors match returns
 * the default error message
 * 
 * @param {Object} data
 * @returns {String} Error message 
 */
function getErrorMessageFromResponse(data) {
    return data ? errors[data['code']] || defaultError : defaultError;
}
