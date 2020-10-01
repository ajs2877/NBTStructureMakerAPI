"use strict";
import createXHR from './xhr.js';
import setup from './ui.js';

// Set global as this is needed to be setup by ui
// Hold info of the structure itself as a 2d array rn. (will be changed to 3d)
window.structureBlocks = [];
window.size = 9;

const handleResponse = (xhr, parseResponse) => {
  switch(xhr.status) 
  {
      case 200: 
        alert(`<b>Success</b>`);
        break;

      case 201: 
        alert('<b>Create</b>');
        break;

      case 204: 
        alert('<b>Updated (No Content)</b>');
        break;

      case 400: 
        alert( `<b>Bad Request</b>`);
        break;

      case 404: 
        alert(`<b>Resource Not Found</b>`);
        break;

      default: 
        alert(`Error code not implemented by client.`);
        break;
  }
  
  if(parseResponse && xhr.response && xhr.getResponseHeader('Content-Type') === 'application/json') {
    const obj = JSON.parse(xhr.response);
    console.dir(obj);
  } 
  else { 
    alert('<p>Meta Data Recieved<p>');
  }
};

const requestUpdate = (e) => {
  
  //make a new AJAX request asynchronously
  const xhr = new XMLHttpRequest();
  xhr.open("GET","/sdfgh");
  xhr.setRequestHeader('Accept', 'application/json');

  //get request or head request
  xhr.onload = () => handleResponse(xhr, true);
  
  xhr.send();
  e.preventDefault();
  
  return false;
};

// Send post with payload.
const sendPost = (e) => {
  const payload = {
      structureBlocks: window.structureBlocks,
      size: window.size
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
      action: "/savenbt",
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
  document.querySelector("#saveButton").addEventListener('click', sendPost);
  setup();
};

window.onload = init;
