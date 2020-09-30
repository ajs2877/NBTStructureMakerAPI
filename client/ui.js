"use strict";

let size = 9;

export default function setupGrid(){

  // setup the arrays for layers
  // In mc, x/z is the horizontal plane.
  for(let x = 0; x < 9; x++){  
    let row = document.createElement("div");
    row.id = `row${x}`
    for(let z = 0; z < 9; z++){
      let block = document.createElement("div");
      block.classList.add("block");
      block.classList.add("bricks");
      row.appendChild(block);
    } 
    document.body.appendChild(row);
  }
};

