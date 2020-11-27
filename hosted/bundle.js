// Set global as this is needed to be setup by ui
// Hold info of the structure itself as a 2d array rright now.
window.structureBlocks = [];
/**
 * Parses the response from server and update the state of the
 * code on client side to be up to date on what happened serverside.
 */

const handleResponse = (xhr, parseResponse) => {
  let msg;

  switch (xhr.status) {
    case 201:
      // A new NBT file was made.
      // Refresh list to show current files avaliable.
      getAllNBTFiles();
      break;

    case 204:
      // Manually show this message as 204 code will not send an xhr.response
      msg = "Updated file successfully!";
      break;
  }

  if (parseResponse && xhr.response) {
    const obj = JSON.parse(xhr.response);

    if (obj.message) {
      msg = obj.message;
    } // We deleted a file and now need to refresh the list of files on client end


    if (obj.task === "delete") {
      getAllNBTFiles();
    }

    if (xhr.getResponseHeader('Content-Type') === 'application/json') {
      if (obj.filename) {
        let fileElement = document.querySelector("#files"); // remove all entries except for the 'no file selected' option

        while (fileElement.lastChild.value) {
          fileElement.removeChild(fileElement.lastChild);
        } // re-add all files as an option so now the list is up to date


        obj.filename.forEach(filename => {
          var optionElement = document.createElement("option");
          optionElement.value = filename;
          optionElement.text = filename;
          fileElement.appendChild(optionElement);
        });
      } // refresh the grid on screen and update internal structureBlocks variable 


      if (obj.structureData) {
        setupGrid(obj.structureData);
      }
    }
  } // give the user the message so they know the server did something magical


  if (msg) {
    alert(msg);
  } // How to download blobs safely on any browser. 
  // The setTimeout is needed for FireFox because
  // FireFox just has to be special...
  // Source: https://stackoverflow.com/a/48968694


  if (xhr.getResponseHeader("Content-Type") === "application/octet-stream" && xhr.responseType === "arraybuffer") {
    let link = document.createElement('a');
    let blob = new Blob([xhr.response], {
      type: "application/octet-stream"
    });
    let url = window.URL.createObjectURL(blob);
    link.href = url;
    link.download = xhr.getResponseHeader('Content-Disposition').split('=')[1];
    document.body.appendChild(link);
    link.dispatchEvent(new MouseEvent(`click`, {
      bubbles: true,
      cancelable: true,
      view: window
    }));
    setTimeout(function () {
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


const NBTFileRequest = e => {
  const file = document.querySelector("#files").value;

  if (file) {
    //make a new AJAX request asynchronously
    const xhr = new XMLHttpRequest(); //needed to parse the response as binary easily

    if (e.target.value === "getDownloadableNBTFile") {
      xhr.responseType = "arraybuffer";
    } // The button stores what the request is


    let action = `/${e.target.value}?_csrf=${document.querySelector("#_csrfhidden").value}&nbt_file=${file}`;
    xhr.open(e.target.getAttribute("data-request-type"), action);
    xhr.setRequestHeader('Accept', 'application/json');

    xhr.onload = () => handleResponse(xhr, true);

    xhr.send();
    e.preventDefault();
  } else {
    alert("No file was selected.");
  }

  return false;
};
/**
 * Will retrieve the list of all uuids of all nbt files on the server.
 */


const getAllNBTFiles = () => {
  sendAjax('GET', `/getFileList?_csrf=${document.querySelector("#_csrfhidden").value}`, null, data => {
    // ReactDOM.render(
    //     <DomoList domos={data.domos} />, document.querySelector("#domos")
    // );
    let fileElement = document.querySelector("#files"); // remove all entries except for the 'no file selected' option

    while (fileElement.lastChild.value) {
      fileElement.removeChild(fileElement.lastChild);
    } // re-add all files as an option so now the list is up to date


    data.nbts.forEach(entry => {
      var optionElement = document.createElement("option");
      optionElement.value = entry.filename;
      optionElement.text = entry.filename;
      fileElement.appendChild(optionElement);
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


const sendNBTData = e => {
  const payload = {
    structureBlocks: window.structureBlocks,
    size: window.structureBlocks[0].length
  };
  const file = document.querySelector("#files").value;

  if (file) {
    payload.filename = file; // a file to save to was selected
  } else {
    payload.filename = prompt("Enter a name for your build!");
  } // Format the data.
  // From working example of one of the HWs when inspected. 
  // I prefer this over the hardcoded string.


  const data = [];
  Object.keys(payload).forEach(key => {
    data.push(`${key}=${payload[key]}`);
  });
  const bodyData = data.join('&'); // Setup the post request and zooom. To the server it goes

  const info = {
    action: `/saveNBT?_csrf=${document.querySelector("#_csrfhidden").value}`,
    method: "POST"
  };
  const xhrObj = createXHR(info, {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json'
  }, handleResponse);
  xhrObj.send(bodyData); // prevent button default bubbling down behavior I believe

  return false;
};

const TopSection = props => {
  // Multi layered jigsaws can be a future add-on to this project
  //  <div class="layerControls">
  //    <button id="downbutton">Down</button>
  //    Layer <span id="currentLayer">1</span>/<span id="totalLayers">9</span>
  //    <button id="upbutton">Up</button>
  //  </div>
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "NBT Structure Maker API"), /*#__PURE__*/React.createElement("input", {
    type: "hidden",
    name: "_csrf",
    id: "_csrfhidden",
    value: props.csrf
  }), /*#__PURE__*/React.createElement("div", {
    className: "navlink"
  }, /*#__PURE__*/React.createElement("a", {
    href: "/logout"
  }, "Log out")), /*#__PURE__*/React.createElement("select", {
    id: "files"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Create New File")), /*#__PURE__*/React.createElement("button", {
    id: "saveButton"
  }, "Save NBT"), /*#__PURE__*/React.createElement("button", {
    id: "loadButton",
    value: "getNBTFile",
    "data-request-type": "GET"
  }, "Load NBT File"), /*#__PURE__*/React.createElement("button", {
    id: "downloadButton",
    value: "getDownloadableNBTFile",
    "data-request-type": "GET"
  }, "Download selected NBT File"), /*#__PURE__*/React.createElement("button", {
    id: "deleteButton",
    value: "deleteFile",
    "data-request-type": "DELETE"
  }, "Delete selected NBT File"));
};

var setup = function (csrf) {
  ReactDOM.render( /*#__PURE__*/React.createElement(TopSection, {
    csrf: csrf
  }), document.querySelector("#topSection"));
  document.querySelector("#saveButton").addEventListener('click', sendNBTData);
  document.querySelector("#loadButton").addEventListener('click', NBTFileRequest);
  document.querySelector("#downloadButton").addEventListener('click', NBTFileRequest);
  document.querySelector("#deleteButton").addEventListener('click', NBTFileRequest);
  setupControls();
  setupGrid();
  getAllNBTFiles();
};

var getToken = () => {
  sendAjax('GET', '/getToken', null, result => {
    setup(result.csrfToken);
  });
};

$(document).ready(function () {
  getToken();
});
let defaultSize = 10;
let currentBlock = "dirt";
/**
 * Does the painting on the grid when users click or drag.air
 * 
 * @param {*} e dom element activated
 */

const placeBlock = e => {
  // Detect if mouse is pressed or clicked at time: https://stackoverflow.com/a/15098620
  if (e.buttons == 1 || e.buttons == 3) {
    e.currentTarget.className = "block " + currentBlock;
    let coordinate = e.currentTarget.id.split(',').map(Number);
    window.structureBlocks[coordinate[0]][coordinate[1]] = currentBlock;
  }

  ;
};
/**
 * Changes what block the user is painting to the element's value.
 * Used for when radio button is pressed.
 * 
 * @param {*} e dom element activated
 */


const changeBlockSelected = e => {
  currentBlock = e.currentTarget.value;
};
/**
 * Attachs changeBlockSelected to all radio buttons so clicking any button
 * will swap the user's block to the radio button's value (which is a block)
 */


const setupControls = () => {
  //https://www.techiedelight.com/bind-change-event-handler-radio-button-javascript/
  const radios = document.querySelectorAll('input[type=radio][name="blockRadio"]');
  radios.forEach(radio => radio.addEventListener('change', e => changeBlockSelected(e)));
};
/**
 * Wipes and re-creates the grid of air blocks.
 * If nbt data is passed in instead, it will make
 * the grid show the contents of the nbt data.
 */


const setupGrid = structureData => {
  let xSize = defaultSize;
  let zSize = defaultSize;
  window.structureBlocks = [];

  if (structureData) {
    xSize = structureData.length;
    zSize = structureData[0].length;
    window.structureBlocks = structureData;
  } // wipes old grid


  document.querySelectorAll(".grid").forEach(gridElement => {
    document.body.removeChild(gridElement);
  }); // setup the arrays for layers
  // In mc, x/z is the horizontal plane.

  for (let x = 0; x < xSize; x++) {
    if (!structureData) {
      // make new row as this is hit on startup which has no rows saved yet.
      window.structureBlocks.push([]);
    }

    let row = document.createElement("div");
    row.id = `row${x}`;
    row.className = `grid`; // Make the grid unabled to be dragged: https://stackoverflow.com/a/4211930

    row.ondragstart = function () {
      return false;
    };

    for (let z = 0; z < zSize; z++) {
      let block = document.createElement("div");
      block.classList.add("block");

      if (structureData && structureData[x] && structureData[x][z]) {
        block.classList.add(structureData[x][z]);
      } else {
        // add air at startup or when nbt data entries are undefined
        structureBlocks[x].push("air");
        block.classList.add("air");
      }

      block.id = `${x},${z}`; // Store coordinate. Unique to every block

      block.ondragstart = function () {
        return false;
      }; // Make the grid unabled to be dragged: https://stackoverflow.com/a/4211930
      // Mouseover with a check for mouse pressed doesn't work for clicking.
      // Thus the use of mousedown as well.


      block.addEventListener('mouseover', e => placeBlock(e));
      block.addEventListener('mousedown', e => placeBlock(e));
      row.appendChild(block);
    }

    ;
    document.body.appendChild(row);
  }

  ;
};
var handleError = message => {
  $("#errorMessage").text(message);
};

var redirect = response => {
  window.location = response.redirect;
};

var sendAjax = (type, action, data, success) => {
  $.ajax({
    cache: false,
    type: type,
    url: action,
    data: data,
    dataType: "json",
    success: success,
    error: function (xhr, status, error) {
      let messageObj = JSON.parse(xhr.responseText);
      handleError(messageObj.error);
    }
  });
};
/**
 * helper method to make XHR requests
 */
const createXHR = (info, headersObject, callback) => {
  const xhr = new XMLHttpRequest();
  xhr.open(info['method'], info['action']);

  if (headersObject != null) {
    Object.keys(headersObject).forEach(key => {
      xhr.setRequestHeader(key, headersObject[key]);
    });
  }

  xhr.onload = () => callback(xhr, true);

  return xhr;
};
