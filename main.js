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

// LAST RESULT LIST
var results = "";
var files = [];

function getfilename(str) {
  let temp = str.split('/');
  return temp[temp.length - 1];
}
function tokenizefilters(str) {
  return str.split(' ');
}

function check_sample_validity(element) {
  if (element.path.toLowerCase().indexOf("asd") >= 0 ||
      element.path.toLowerCase().indexOf("reapeaks") >= 0) {
    return false;
  }
  if (element.path.toLowerCase().indexOf("wav") >= 0 ||
      element.path.toLowerCase().indexOf("aif") >= 0 ||
      element.path.toLowerCase().indexOf("mp3") >= 0 ||
      element.path.toLowerCase().indexOf("m4a") >= 0){
    return true;
    
  }
}
function clean_sample_list(list) {
      list.forEach(element => {
      if (check_sample_validity(element)) {
        files.push(element);
      }
    });
}
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}
function sort_files(files, sort_mode) {
    if (sort_mode == 1) {
    files.sort(function(a, b) {
      // return a.stats.ctimeMs < b.stats.ctimeMs;
      var nameA = a.name.toUpperCase(); // ignore upper and lowercase
      var nameB = b.name.toUpperCase(); // ignore upper and lowercase
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });
  } else if (sort_mode == 2) {
    files.sort(function(a, b) {
      // return  < b.stats.ctimeMs;
      var timeA = a.stats.ctimeMs; // ignore upper and lowercase
      var timeB = b.stats.ctimeMs; // ignore upper and lowercase
      if (timeA > timeB) {
        return -1;
      }
      if (timeA < timeB) {
        return 1;
      }
      return 0;
    });
  } else if (sort_mode == 3) {
    shuffle(files);
  }
}
function update_results(file) {
  results += "<a class='sample' href='javascript:void(0);' onmouseout='hoveroff()' onclick='hover(\"" + file.path + "\")' onmouseover='hover(\"" + file.path + "\")' ondrag='dragfile(\"" + file.path + "\")'>"+ file.name + "</a> <br>";
}

async function from_search(startPath, filter, sort_mode){
  results = "";
  files = [];
  let temp_files = [];

  var filter_tokens = tokenizefilters(filter);

  for (let i = 0; i < startPath.length; i++){
    let temp = fg.sync(startPath[i] + "**", { onlyFiles: true , globstar: true, stats: true});
    clean_sample_list(temp);
  }
  sort_files(files, sort_mode);

  for(var i=0;i<files.length;i++){
    files[i].path = files[i].path.replaceAll(/'/g,"&apos;")
    files[i].path = files[i].path.replaceAll(/"/g,"&quot;")

    // takes the split tokens and checks if we match all of them.
    let n_valid_tokens = 0;
    for(var j = 0; j < filter_tokens.length; j++){
      if (files[i].path.toLowerCase().indexOf(filter_tokens[j]) >= 0) {
        n_valid_tokens++;
      }
      if (n_valid_tokens == filter_tokens.length){
        temp_files.push(files[i]);
      }
    }
  }
  for(let i = 0; i < temp_files.length; i++){
    update_results(temp_files[i]);
  }
  files = temp_files;
  return results;
};

async function from_folder(startPath, sort_mode){
  results = "";
  files = [];

  let temp = fg.sync(startPath + "**", { onlyFiles: true , globstar: true, stats: true});
  clean_sample_list(temp);
  sort_files(files, sort_mode);

  for(var i=0;i<files.length;i++){
    files[i].path = files[i].path.replaceAll(/'/g,"&apos;")
    files[i].path = files[i].path.replaceAll(/"/g,"&quot;")
    update_results(files[i]);
  }
  return results;
};
async function change_sort(sort_mode){
  results = "";
  sort_files(files, sort_mode);
  for(var i = 0 ; i < files.length; i++){
    update_results(files[i]);
  }
  return results;
}

ipcMain.on('search', (event, args, sort_mode) => {
  event.sender.send('change_reply_content', "<div id='loading'>Loading...</div>")

  from_search(settings_json.search_paths, args.toLowerCase(), sort_mode).then(
    function(value) {event.sender.send('change_reply_content', value)}
  );
});

ipcMain.on('folder', (event, args, sort_mode) => {
  event.sender.send('change_reply_content', "<div id='loading'>Loading...</div>")

  from_folder(args, sort_mode).then(
    function(value) {event.sender.send('change_reply_content', value)}
  );
});

ipcMain.on('changesort', (event, sort_mode) => {
  event.sender.send('change_reply_content', "<div id='loading'>Loading...</div>")

  change_sort(sort_mode).then(
    function(value) {event.sender.send('change_reply_content', value)}
  );
});

ipcMain.on('favorites', (event, args) => {
  load_settings_file();
  let temp = "";
  for (let i = 0; i < settings_json.favorites.length; i++){
    temp += "<a class='sample' href='javascript:void(0);' onmouseout='hoveroff()' onclick='open_folder(\"" + settings_json.favorites[i] + "\")'><img src='folder.png'/>"+ settings_json.favorites[i]+ "</a> <br>";
  }
  event.sender.send('change_reply_content', temp)
});


ipcMain.on('ondragstart', (event, filePath) => {
  event.sender.startDrag({
    file: filePath,
    icon: 'file.png'
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