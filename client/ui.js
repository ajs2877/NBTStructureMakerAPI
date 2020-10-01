"use strict";

let size = 9;
let currentBlock = "dirt";


  // // source: https://stackoverflow.com/a/57208937
  // let coordinate = this.id.split(',').map(Number);

  //https://stackoverflow.com/a/15098620
const placeBlock = (e) => {
  if(e.buttons == 1 || e.buttons == 3){
    e.currentTarget.className = "block "+currentBlock;
  }
}

function setupControls(){

}


export default function setupGrid(){

  // setup the arrays for layers
  // In mc, x/z is the horizontal plane.
  for(let x = 0; x < size; x++){  
    structureBlocks.push([]); // new row in storage
    let row = document.createElement("div");
    row.id = `row${x}`
    row.ondragstart = function() { return false; }; // https://stackoverflow.com/a/4211930

    for(let z = 0; z < size; z++){
      window.structureBlocks[x].push(-1); // -1 is air
      let block = document.createElement("div");
      block.classList.add("block");
      block.classList.add("air");
      block.id = `${x},${z}`; // Store coordinate. Unique to every block
      block.ondragstart = function() { return false; }; // https://stackoverflow.com/a/4211930

      block.addEventListener('mouseover', (e) => placeBlock(e)); // doesnt handle clicking
      block.addEventListener('mousedown', (e) => placeBlock(e));

      row.appendChild(block);
    } 

    document.body.appendChild(row);
  }
};

