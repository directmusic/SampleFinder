const
ipc      = require('electron').ipcRenderer,

asyncBtn = document.querySelector('#form');
const file_name = document.querySelector('#file_name');
let replyDiv = document.querySelector('#reply');

asyncBtn.addEventListener('submit', () => {
 ipc.send('search', file_name.value)
});

ipc.on('asynReply', (event, args) => {
 replyDiv.innerHTML = args;
});

ipcRenderer.on('asynchronous-message', (event, arg) => {
    console.log(arg) // prints "ping"
  })

function dragfile(url) {
    ipc.send('ondragstart', url)
}
function open_favorites() {
	ipc.send('favorites', 0)
}
function open_folder(url) {
	ipc.send('folder', url)
}
function open_settings(url) {
	ipc.send('settings', url)
}
