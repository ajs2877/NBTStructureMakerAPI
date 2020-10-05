"use strict";
import createXHR from './xhr.js';
import {setupMain} from './ui.js';
import {setupGrid} from './ui.js';

// Set global as this is needed to be setup by ui
// Hold info of the structure itself as a 2d array rright now.
window.structureBlocks = [];
window.structureSize = 20;

const handleResponse = (xhr, parseResponse) => {
  let msg = "";
  
  if(parseResponse && xhr.response && xhr.getResponseHeader('Content-Type') === 'application/json') {
    const obj = JSON.parse(xhr.response);
    console.dir(obj);
    if(obj.message){
      msg += obj.message;
    }

    if(obj.uuids){
      let fileElement = document.querySelector("#files");
      // remove all entries except for the 'no file selected' option
      while (fileElement.lastChild.value) {
        fileElement.removeChild(fileElement.lastChild);
      }

      obj.uuids.forEach(uuid =>{
        var optionElement = document.createElement("option");
        optionElement.value = uuid;
        optionElement.text = uuid;
        fileElement.appendChild(optionElement);
      });
    }

    if(obj.structureData){
      setupGrid(obj.structureData);
    }
  }

  alert(msg);
};

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

const getAllNBTFiles = () => {
  //make a new AJAX request asynchronously
  const xhr = new XMLHttpRequest();
  xhr.open("GET","/getFileList");
  xhr.setRequestHeader('Accept', 'application/json');
  xhr.onload = () => handleResponse(xhr, true);
  xhr.send();

  return false;
};

// Send post with payload.
const sendNBTData = (e) => {
  const payload = {
      structureBlocks: window.structureBlocks,
      size: window.structureSize
  };

  // Format the data
  // From working example of hw when inspected. 
  // I prefer this over the hardcoded string
  const data = [];
  Object.keys(payload).forEach((key) => {
    data.push(`${key}=${payload[key]}`);
  });
  const bodyData = data.join('&');

  // make xhr and send it
  const info = {
      action: "/saveNBT",
      method: "POST" 
    };

  const xhrObj = createXHR(info, {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
  }, handleResponse)

  xhrObj.send(bodyData);

  return false;
};

// add reaction to submitting
const init = () => {
  document.querySelector("#saveButton").addEventListener('click', sendNBTData);
  document.querySelector("#loadButton").addEventListener('click', requestNBTFile);
  setupMain();
  getAllNBTFiles();
};

window.onload = init;
