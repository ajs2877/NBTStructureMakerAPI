
// Set global as this is needed to be setup by ui
// Hold info of the structure itself as a 2d array rright now.
window.structureBlocks = [];
selectedFile = "";


/**
 * Parses the response from server and update the state of the
 * code on client side to be up to date on what happened serverside.
 */
const handleResponse = (xhr, parseResponse) => {
  let msg;

  if(parseResponse && xhr.response) {
    const obj = JSON.parse(xhr.response);
    if(obj.message){
      msg = obj.message;
    }

    // We deleted a file and now need to refresh the list of files on client end
    if(obj.task === "delete"){
      getAllNBTFiles();
      msg = "file deleted successfully!"
    }
    
    if(obj.task === "save"){
      getAllNBTFiles(selectedFile);
      msg = "Updated file successfully!"
    }

    if(obj.filename){
      let fileElement = document.querySelector("#files");

      // remove all entries except for the 'no file selected' option
      while (fileElement.lastChild.value) {
        fileElement.removeChild(fileElement.lastChild);
      }

      // re-add all files as an option so now the list is up to date
      obj.filename.forEach(filename =>{
        var optionElement = document.createElement("option");
        optionElement.value = filename;
        optionElement.text = filename;
        fileElement.appendChild(optionElement);
      });
    }

    if(xhr.getResponseHeader('Content-Type') === 'application/json'){
  
      // refresh the grid on screen and update internal structureBlocks variable 
      if(obj.task === "load" && obj.nbts && obj.size){
        setupGrid(obj.nbt, obj.size);
        msg = "file loaded successfully!"
      }
    }
  }

  // give the user the message so they know the server did something magical
  if(msg){
    alert(msg);
  }
  
  // How to download blobs safely on any browser. 
  // The setTimeout is needed for FireFox because
  // FireFox just has to be special...
  // Source: https://stackoverflow.com/a/48968694
  if (xhr.getResponseHeader("Content-Type") === "application/octet-stream" && xhr.responseType === "arraybuffer") {
    let link = document.createElement('a');
    let blob = new Blob([xhr.response], {type: "application/octet-stream"});

    let url = window.URL.createObjectURL(blob);
    link.href = url;
    link.download = xhr.getResponseHeader('Content-Disposition').split('=')[1];
    document.body.appendChild(link);
    link.dispatchEvent(new MouseEvent(`click`, {bubbles: true, cancelable: true, view: window}));
    setTimeout(function(){
      document.body.removeChild(link);
    }, 1);  
  }
};

/**
 * using query params, this will ask the server to return the specified
 * file so we can update clientside to show or download the nbt file.
 * 
 * @param {*} e dom element activated
 */
const NBTFileRequest = (e) => {
  const file = document.querySelector("#files").value;

  if(file){
    //make a new AJAX request asynchronously
    const xhr = new XMLHttpRequest();
    
    //needed to parse the response as binary easily
    if(e.target.value === "getDownloadableNBTFile"){
      xhr.responseType = "arraybuffer";
    }

    // The button stores what the request is
    let action = `/${e.target.value}?_csrf=${document.querySelector("#_csrfhidden").value}&nbt_file=${file}`;

    xhr.open(e.target.getAttribute("data-request-type"), action); 
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onload = () => handleResponse(xhr, true);
    xhr.send();
    e.preventDefault();
  }
  else{
    alert("No file was selected.");
  }

  return false;
};

/**
 * Will retrieve the list of all uuids of all nbt files on the server.
 */
const getAllNBTFiles = (defaultFile) => {

  sendAjax('GET', `/getFileList?_csrf=${document.querySelector("#_csrfhidden").value}`, null, (data) => {
    // ReactDOM.render(
    //     <DomoList domos={data.domos} />, document.querySelector("#domos")
    // );
    
    let fileElement = document.querySelector("#files");

    // remove all entries except for the 'no file selected' option
    while (fileElement.lastChild.value) {
      fileElement.removeChild(fileElement.lastChild);
    }
    fileElement.selectedIndex = 0; // Select default by well, default

    // re-add all files as an option so now the list is up to date
    let index = 1; // 0 is no file selected
    data.nbts.forEach(entry =>{
      var optionElement = document.createElement("option");
      optionElement.value = entry.filename;
      optionElement.text = entry.filename;
      fileElement.appendChild(optionElement);

      // set selected default
      if(defaultFile && defaultFile === entry.filename){
        fileElement.selectedIndex = index;
      }

      index = index + 1;
    });
  });

  return false;
};

/**
 * will tell the server what the current structureBlocks 
 * state is and which file to save to.
 * 
 * @param {*} e dom element activated 
 */
const sendNBTData = (e) => {
  const payload = {
      structureBlocks: window.structureBlocks,
      size: window.structureBlocks[0].length
  };
  
  const file = document.querySelector("#files").value;
  if(file){
    payload.filename = file; // a file to save to was selected
  }
  else{
    payload.filename = prompt("Enter a name for your build!");
  }

  if(!payload.filename){
    alert("You need to enter a valid name to create or overwrite a file.");
    return false;
  }
  else{
    selectedFile = payload.filename;
  }

  // Format the data.
  // From working example of one of the HWs when inspected. 
  // I prefer this over the hardcoded string.
  const data = [];
  Object.keys(payload).forEach((key) => {
    data.push(`${key}=${payload[key]}`);
  });
  const bodyData = data.join('&');

  // Setup the post request and zooom. To the server it goes
  const info = {
      action: `/saveNBT?_csrf=${document.querySelector("#_csrfhidden").value}`,
      method: "POST" 
    };
  const xhrObj = createXHR(info, {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
  }, handleResponse)
  xhrObj.send(bodyData);

  // prevent button default bubbling down behavior I believe
  return false;
};

    
const TopSection = (props) => { 
  // Multi layered jigsaws can be a future add-on to this project
  //  <div class="layerControls">
  //    <button id="downbutton">Down</button>
  //    Layer <span id="currentLayer">1</span>/<span id="totalLayers">9</span>
  //    <button id="upbutton">Up</button>
  //  </div>
  return (
    <div>
      <h1>NBT Structure Maker API</h1>
      <input type="hidden" name="_csrf" id="_csrfhidden" value={props.csrf} />
      <div className="navlink"><a href="/logout">Log out</a></div>
      <select id="files">
        <option value="">Create New File</option>
      </select>
      <button id="saveButton">Save NBT</button>
      <button id="loadButton" value="getNBTFile" data-request-type="GET">Load NBT File</button>
      <button id="downloadButton" value="getDownloadableNBTFile" data-request-type="GET">Download Loaded File</button>
      <button id="deleteButton" value="deleteFile" data-request-type="DELETE">Delete selected NBT File</button>
    </div>
  );
};

var setup = function(csrf) {
  ReactDOM.render(
    <TopSection csrf={csrf}/>, document.querySelector("#topSection")
  );
  document.querySelector("#saveButton").addEventListener('click', sendNBTData);
  document.querySelector("#loadButton").addEventListener('click', NBTFileRequest);
  document.querySelector("#downloadButton").addEventListener('click', NBTFileRequest);
  document.querySelector("#deleteButton").addEventListener('click', NBTFileRequest);
  setupControls();
  setupGrid();
  getAllNBTFiles();
};

var getToken = () => {
    sendAjax('GET', '/getToken', null, (result) => {
        setup(result.csrfToken);
    });
};

$(document).ready(function() {
    getToken();
});