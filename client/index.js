"use strict";
import createXHR from './xhr.js';
import setupGrid from './ui.js';

let size = 9;

const handleResponse = (xhr, parseResponse) => {
  const content = document.querySelector('#content');
  content.style["textAlign"] = "center";

  switch(xhr.status) 
  {
      case 200: 
        content.innerHTML = `<b>Success</b>`;
        break;

      case 201: 
        content.innerHTML = '<b>Create</b>';
        break;

      case 204: 
        content.innerHTML = '<b>Updated (No Content)</b>';
        break;

      case 400: 
        content.innerHTML = `<b>Bad Request</b>`;
        break;

      case 404: 
        content.innerHTML = `<b>Resource Not Found</b>`;
        break;

      default: 
        content.innerHTML = `Error code not implemented by client.`;
        break;
  }
  
  if(parseResponse && xhr.response && xhr.getResponseHeader('Content-Type') === 'application/json') {
    const obj = JSON.parse(xhr.response);
    console.dir(obj);
    if(obj.message){
      content.innerHTML += `<p>${obj.message}<p>`;
    }
    else{
      content.innerHTML += `<p><pre>${JSON.stringify(obj, undefined, 2)}<pre><p>`;
      content.style["textAlign"] = "left";
    }
  } 
  else { 
    content.innerHTML += '<p>Meta Data Recieved<p>';
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


// these three fuctions are from working example of hw when inspected. Very useful!
// Get value from a field, if it exists. If field doesn't exist, returns null.
const getValueOf = (form, fieldSelector) => {
  const field = form.querySelector(fieldSelector);
  return (field) ? field.value : null;
};

// Send post with payload.
const sendPost = (e) => {
  e.preventDefault();
  
  const payload = {
      name: "test"
  };

  // Format the data
  // From working example of hw when inspected. 
  // I prefer this over the hardcoded string
  const data = [];
  Object.keys(payload).forEach((key) => {
    data.push(`${key}=${payload[key]}`);
  });
  const formData = data.join('&');

  // form cannot be empty
  if(!formData) { 
    onError({
        message: "Form data is empty",
        form: nameForm
    });
    return;
  }

  // make xhr and send it
  const info = nameForm ? {
      action: "POST",
      method: "/sdfgh" 
    } : null;
    console.log(info);

  const xhrObj = createXHR(info, {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
  }, handleResponse)

  xhrObj.send(formData);

  return false;
};

// add reaction to submitting
const init = () => {
  const getUsers = (e) => requestUpdate(e);
  //userForm.addEventListener('submit', getUsers);

  // const nameForm = document.querySelector('#nameForm');
  // const addUser = (e) => sendPost(e, nameForm);
  // nameForm.addEventListener('submit', addUser);

  setupGrid();
};

window.onload = init;
