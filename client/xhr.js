"use strict";

/**
 * helper method to make XHR requests
 * 
 * @param {*} info 
 * @param {*} headersObject 
 * @param {*} callback 
 */
export default function createXHR(info, headersObject, callback){
  const xhr = new XMLHttpRequest();
  xhr.open(info['method'], info['action']);

  if(headersObject != null){
    Object.keys(headersObject).forEach((key) => {
      xhr.setRequestHeader(key, headersObject[key]);
    });
  }
  
  xhr.onload = () => callback(xhr, true);
  return xhr;
};