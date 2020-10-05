"use strict";
import createXHR from './xhr.js';
import {setupMain} from './ui.js';
import {setupGrid} from './ui.js';

// Set global as this is needed to be setup by ui
// Hold info of the structure itself as a 2d array rright now.
window.structureBlocks = [];

/**
 * Parses the response from server and update the state of the
 * code on client side to be up to date on what happened serverside.
 */
const handleResponse = (xhr, parseResponse) => {
  let msg;

  switch(xhr.status) 
  {
      case 201: 
        // A new NBT file was made.
        // Refresh list to show current files avaliable.
        getAllNBTFiles(); 
        break;

      case 204: 
        // Manually show this message as 204 code will not send an xhr.response
        msg = "Updated file successfully!"
        break;
  }
  
  if(parseResponse && xhr.response && xhr.getResponseHeader('Content-Type') === 'application/json') {
    const obj = JSON.parse(xhr.response);
    if(obj.message){
      msg = obj.message;
    }

    if(obj.uuids){
      let fileElement = document.querySelector("#files");

      // remove all entries except for the 'no file selected' option
      while (fileElement.lastChild.value) {
        fileElement.removeChild(fileElement.lastChild);
      }

      // re-add all files as an option so now the list is up to date
      obj.uuids.forEach(uuid =>{
        var optionElement = document.createElement("option");
        optionElement.value = uuid;
        optionElement.text = uuid;
        fileElement.appendChild(optionElement);
      });
    }

    // refresh the grid on screen and update internal structureBlocks variable 
    if(obj.structureData){
      setupGrid(obj.structureData);
    }
  }

  // give the user the message so they know the server did something magical
  if(msg){
    alert(msg);
  }
};

/**
 * using query params, this will ask the server to return the specified
 * file so we can update clientside to show the nbt file.
 * 
 * @param {*} e dom element activated
 */
const requestNBTFile = (e) => {
  const file = document.querySelector("#files").value;

  if(file){
    //make a new AJAX request asynchronously
    const xhr = new XMLHttpRequest();
    xhr.open("GET",`/getNBTFile?uuid=${file}`);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onload = () => handleResponse(xhr, true);
    xhr.send();
    e.preventDefault();
  }
  else{
    alert("No file was selected to load.");
  }

  return false;
};

/**
 * Will retrieve the list of all uuids of all nbt files on the server.
 */
const getAllNBTFiles = () => {
  //make a new AJAX request asynchronously
  const xhr = new XMLHttpRequest();
  xhr.open("GET","/getFileList");
  xhr.setRequestHeader('Accept', 'application/json');
  xhr.onload = () => handleResponse(xhr, true);
  xhr.send();

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
      size: window.structureBlocks[0]
  };
  
  const file = document.querySelector("#files").value;
  if(file){
    payload.uuid = file; // a file to save to was selected
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
      action: "/saveNBT",
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

/**
 * Sets up the entire page on clientside when the page is first loaded.
 * This includes hooking up event listeners, showing a blank grid, and listing all uuids.
 */
const init = () => {
  document.querySelector("#saveButton").addEventListener('click', sendNBTData);
  document.querySelector("#loadButton").addEventListener('click', requestNBTFile);
  setupMain();
  getAllNBTFiles();
};
window.onload = init;
