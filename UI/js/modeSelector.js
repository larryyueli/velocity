/**
 * Saves the user mode ICP to the backend
 * 0 -> collaborator mode
 * 1 -> class mode
 * 
 * @param {Integer} mode 
 */
function selectMode(mode) {
    $.ajax({
        type: 'POST',
        url: '/selectMode',
        data: { selectedMode: mode },
        success: function (data) {
            window.location.href = '/';
        },
        error: function (data) {
            const jsonResponse = data.responseJSON;
            errorField.html(getErrorPill(jsonResponse));
        }
    });
}