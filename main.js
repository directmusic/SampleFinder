const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require ('path');
const fg = require('fast-glob');
const fs = require('fs');
const os = require('os');

let settings_json = "";

function load_settings_file() {
  fs.readFile('./settings.json', function (err, data) {
    if (err) {
      throw err; 
    }
    settings_json = JSON.parse(data);
  });
}

const { WSAETIMEDOUT } = require('constants');
let win;
function createWindow () {
  win = new BrowserWindow({
    width: 700,
    // height: 86,
    height: 1080,
    x:2880-700- 40,
    y:1800/4,
    // transparent: true,
    // frame: false,
    resizable: false,
    titleBarStyle: 'hidden',
    // vibrancy: 'sheet',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
    },
    
  })
  // win.webContents.openDevTools();
  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()
  load_settings_file();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
  const ret = globalShortcut.register('Command+Control+Shift+Alt+X', () => {
    win.show();
    // ipcMain.sendSync('window-got-focus', 'ping')
    win.webContents.executeJavaScript('document.getElementById("file_name").focus()');
    win.webContents.executeJavaScript('document.getElementById("file_name").select()');
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
function getfilename(str) {
  let temp = str.split('/');
  return temp[temp.length - 1];
}
function tokenizefilters(str) {
  return str.split(' ');
}

function check_sample_validity(element) {
  if (element.toLowerCase().indexOf("asd") >= 0 ||
      element.toLowerCase().indexOf("reapeaks") >= 0) {
    return false;
  }
  if (element.toLowerCase().indexOf("wav") >= 0 ||
      element.toLowerCase().indexOf("aif") >= 0 ||
      element.toLowerCase().indexOf("mp3") >= 0 ||
      element.toLowerCase().indexOf("m4a") >= 0){
    return true;
    
  }
}

async function fromDir(startPath, filter){
  var results = "";
  var filter_tokens = tokenizefilters(filter);
  var files = [];
  for (let i = 0; i < startPath.length; i++){
    let temp = fg.sync(startPath[i] + "**", { onlyFiles: true , globstar: true });
    temp.forEach(element => {
      if (check_sample_validity(element)) {
        files.push(element);
      }
    });
    
  }
  for(var i=0;i<files.length;i++){
    // takes the split tokens and checks if we match all of them.
    let n_valid_tokens = 0;
    for(var j = 0; j < filter_tokens.length; j++){
      if (files[i].toLowerCase().indexOf(filter_tokens[j]) >= 0) {
        n_valid_tokens++;
      }
      if (n_valid_tokens == filter_tokens.length){
        results += "<a class='sample' href='javascript:void(0);' onmouseout='hoveroff()' onclick='hover(\"" + files[i] + "\")' onmouseover='hover(\"" + files[i] + "\")' ondrag='dragfile(\"" + files[i] + "\")'>"+ getfilename(files[i]) + "</a> <br>";
      }
    }
  }
  return results;
};

ipcMain.on('search', (event, args) => {
  event.sender.send('asynReply', "<div id='loading'>Loading...</div>")

  fromDir(settings_json.search_paths, args.toLowerCase()).then(
    function(value) {event.sender.send('asynReply', value)}
  );
 // win.setSize(700, 1000, true);
});

ipcMain.on('favorites', (event, args) => {
  load_settings_file();
  let temp = "";
  for (let i = 0; i < settings_json.favorites.length; i++){
    temp += "<a class='sample' href='javascript:void(0);' onmouseout='hoveroff()' onclick='open_folder(\"" + settings_json.favorites[i] + "\")'><img src='folder.png'/>"+ settings_json.favorites[i]+ "</a> <br>";
  }
  event.sender.send('asynReply', temp)
});

async function load_all_files_in_folder(startPath){
  var results = "";
  var files = [];

  let temp = fg.sync(startPath + "**", { onlyFiles: true , globstar: true });
  temp.forEach(element => {
    if (check_sample_validity(element)) {
      files.push(element);
    }
  });
    
  for(var i=0;i<files.length;i++){
    results += "<a class='sample' href='javascript:void(0);' onmouseout='hoveroff()' onclick='hover(\"" + files[i] + "\")' onmouseover='hover(\"" + files[i] + "\")' ondrag='dragfile(\"" + files[i] + "\")'>"+ getfilename(files[i]) + "</a> <br>";
  }
  return results;
};

ipcMain.on('folder', (event, args) => {
  event.sender.send('asynReply', "<div id='loading'>Loading...</div>")

  load_all_files_in_folder(args).then(
    function(value) {event.sender.send('asynReply', value)}
  );
});

ipcMain.on('ondragstart', (event, filePath) => {
  event.sender.startDrag({
    file: filePath,
    icon: '/Users/joe/Dropbox/Graphics/Grow Cold Art 2 copy.png'
  })
})
function getCommandLine() {
   switch (process.platform) { 
      case 'darwin' : return 'open';
      case 'win32' : return 'start';
      case 'win64' : return 'start';
      default : return 'xdg-open';
   }
}
var exec = require('child_process').exec;

ipcMain.on('settings', (event, filePath) => {

  exec(getCommandLine() + ' ' + "./settings.json");
})