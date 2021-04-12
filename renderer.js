const ipc = require('electron').ipcRenderer;

let sort_mode = 0;

const submit_button = document.querySelector('#form');

const file_name = document.querySelector('#file_name');
let reply_div = document.querySelector('#reply');

submit_button.addEventListener('submit', () => {
 ipc.send('search', file_name.value, sort_mode);
});

ipc.on('change_reply_content', (event, args) => {
 reply_div.innerHTML = args;
});

function sort_by(sort) {
	sort_mode = sort;
	ipc.send('changesort', sort);
}
function dragfile(url) {
    ipc.send('ondragstart', url)
}
function open_favorites() {
	ipc.send('favorites', 0)
}
function open_folder(url) {
	ipc.send('folder', url, sort_mode)
}
function open_settings(url) {
	ipc.send('settings', url)
}
