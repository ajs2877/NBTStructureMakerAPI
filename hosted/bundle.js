// Set global as this is needed to be setup by ui
// Hold info of the structure itself as a 2d array rright now.
window.structureBlocks = [];
selectedFile = ""; // This const, getBase64Code, and base64ToBytes are needed to convert the encoded 
// base64 string back to binary data to download as a file. Due to an unknown
// issue I am having, express keeps converting my binary data to utf8 strings and
// losing data in the process instead of sending straight binary. This base64
// encoding bypasses the issue and client side will decode it back to binary.
// https://stackoverflow.com/a/57111228

const base64codes = [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 62, 255, 255, 255, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 255, 255, 255, 0, 255, 255, 255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 255, 255, 255, 255, 255, 255, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51]; // https://stackoverflow.com/a/57111228

function getBase64Code(charCode) {
  if (charCode >= base64codes.length) {
    throw new Error("Unable to parse base64 string.");
  }

  const code = base64codes[charCode];

  if (code === 255) {
    throw new Error("Unable to parse base64 string.");
  }

  return code;
} // https://stackoverflow.com/a/57111228


function base64ToBytes(str) {
  if (str.length % 4 !== 0) {
    throw new Error("Unable to parse base64 string.");
  }

  const index = str.indexOf("=");

  if (index !== -1 && index < str.length - 2) {
    throw new Error("Unable to parse base64 string.");
  }

  let missingOctets = str.endsWith("==") ? 2 : str.endsWith("=") ? 1 : 0,
      n = str.length,
      result = new Uint8Array(3 * (n / 4)),
      buffer;

  for (let i = 0, j = 0; i < n; i += 4, j += 3) {
    buffer = getBase64Code(str.charCodeAt(i)) << 18 | getBase64Code(str.charCodeAt(i + 1)) << 12 | getBase64Code(str.charCodeAt(i + 2)) << 6 | getBase64Code(str.charCodeAt(i + 3));
    result[j] = buffer >> 16;
    result[j + 1] = buffer >> 8 & 0xFF;
    result[j + 2] = buffer & 0xFF;
  }

  return result.subarray(0, result.length - missingOctets);
} ///////////////////////////////////////////////////////////////////

/**
 * Parses the response from server and update the state of the
 * code on client side to be up to date on what happened serverside.
 */


const handleResponse = (xhr, parseResponse) => {
  let msg; // Need to do .includes( as we get back "application/json; charset=utf-8"

  if (parseResponse && xhr.response && xhr.getResponseHeader('Content-Type').includes('application/json')) {
    const obj = JSON.parse(xhr.response);

    if (obj.message) {
      msg = obj.message;
    } // We deleted a file and now need to refresh the list of files on client end


    if (obj.task === "delete") {
      getAllNBTFiles();
      msg = "file deleted successfully!";
    }

    if (obj.task === "save") {
      getAllNBTFiles(selectedFile);
      msg = "Updated file successfully!";
    }

    if (obj.filename) {
      let fileElement = document.querySelector("#files"); // remove all entries except for the 'no file selected' option

      while (fileElement.lastChild.value) {
        fileElement.removeChild(fileElement.lastChild);
      } // re-add all files as an option so now the list is up to date


      obj.filename.forEach(filename => {
        let optionElement = document.createElement("option");
        optionElement.value = filename;
        optionElement.text = filename;
        fileElement.appendChild(optionElement);
      });
    } // refresh the grid on screen and update internal structureBlocks letiable 


    if (obj.task === "load" && obj.nbt && obj.size) {
      setupGrid(obj.nbt, obj.size);
      msg = "file loaded successfully!";
    }
  } // give the user the message so they know the server did something magical


  if (msg) {
    alert(msg);
  } // How to download blobs safely on any browser. 
  // The setTimeout is needed for FireFox because
  // FireFox just has to be special...
  // Source: https://stackoverflow.com/a/48968694


  if (xhr.getResponseHeader("Content-Type") === "application/octet-stream") {
    let link = document.createElement('a'); // Parse the encoded base64 string back to binary to bypass the express string only issue

    let blob = new Blob([base64ToBytes(xhr.response)], {
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
    const xhr = new XMLHttpRequest(); // The button stores what the request is

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


const getAllNBTFiles = defaultFile => {
  sendAjax('GET', `/getFileList?_csrf=${document.querySelector("#_csrfhidden").value}`, null, data => {
    let fileElement = document.querySelector("#files"); // remove all entries except for the 'no file selected' option

    while (fileElement.lastChild.value) {
      fileElement.removeChild(fileElement.lastChild);
    }

    fileElement.selectedIndex = 0; // Select default by well, default
    // re-add all files as an option so now the list is up to date

    let index = 1; // 0 is no file selected

    data.nbts.forEach(entry => {
      let optionElement = document.createElement("option");
      optionElement.value = entry.filename;
      optionElement.text = entry.filename;
      fileElement.appendChild(optionElement); // set selected default

      if (defaultFile && defaultFile === entry.filename) {
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
  }

  if (!payload.filename) {
    alert("You need to enter a valid name to create or overwrite a file.");
    return false;
  } else {
    selectedFile = payload.filename;
  } // Format the data.
  // From working example of one of the HWs when inspected. 
  // I prefer this over the hardcoded string.


  const data = [];
  Object.keys(payload).forEach(key => {
    data.push(`${key}=${payload[key]}`);
  });
  const bodyData = data.join('&'); // Setup the post request and zooom. To the server it goes

  const info = {
    action: `/${e.target.value}?_csrf=${document.querySelector("#_csrfhidden").value}`,
    method: "POST"
  };
  let accept = 'application/json'; //needed to parse the response as binary easily
  // I'm desperate at this point... just work!

  if (e.target.value === "downloadNBTFile") {
    accept = 'application/octet-stream';
  }

  const xhrObj = createXHR(info, {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': accept
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
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, /*#__PURE__*/React.createElement("img", {
    id: "logo",
    src: "../assets/img/stone_bricks.jpg",
    alt: "logo"
  }), "\xA0\xA0NBT Structure Maker API\xA0\xA0", /*#__PURE__*/React.createElement("img", {
    id: "logo",
    src: "../assets/img/stone_bricks.jpg",
    alt: "logo"
  })), /*#__PURE__*/React.createElement("input", {
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
    id: "saveButton",
    value: "saveNBT"
  }, "Save NBT"), /*#__PURE__*/React.createElement("button", {
    id: "loadButton",
    value: "getNBTFile",
    "data-request-type": "GET"
  }, "Load NBT File"), /*#__PURE__*/React.createElement("button", {
    id: "downloadButton",
    value: "downloadNBTFile"
  }, "Download Loaded File"), /*#__PURE__*/React.createElement("button", {
    id: "deleteButton",
    value: "deleteFile",
    "data-request-type": "DELETE"
  }, "Delete selected NBT File"));
}; //Sets up the nav bar and controls for the main page


let setup = function (csrf) {
  ReactDOM.render( /*#__PURE__*/React.createElement(TopSection, {
    csrf: csrf
  }), document.querySelector("#topSection"));
  document.querySelector("#saveButton").addEventListener('click', sendNBTData);
  document.querySelector("#loadButton").addEventListener('click', NBTFileRequest);
  document.querySelector("#downloadButton").addEventListener('click', sendNBTData);
  document.querySelector("#deleteButton").addEventListener('click', NBTFileRequest);
  setupControls();
  setupGrid();
  getAllNBTFiles();
};

let getToken = () => {
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


const setupGrid = (structureData, structureSize) => {
  let xSize = defaultSize;
  let zSize = defaultSize;

  if (structureSize) {
    xSize = structureSize;
    zSize = structureSize;
  }

  window.structureBlocks = [];

  if (structureData) {
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
let handleError = message => {
  $("#errorMessage").text(message);
  alert(message);
};

let redirect = response => {
  window.location = response.redirect;
};

let sendAjax = (type, action, data, success) => {
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
