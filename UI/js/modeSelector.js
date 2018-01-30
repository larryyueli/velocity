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
        url: '/mode/select',
        data: { selectedMode: mode },
        success: function (data) {
            window.location.href = '/';
        },
        error: function (data) {
            if (data['status'] === 401) {
                window.location.href = '/';
            } else if (data['status'] === 404) {
                window.location.href = '/pageNotFound';
            }

            const jsonResponse = data.responseJSON;
            errorField.html(getErrorPill(jsonResponse));
        }
    });
}