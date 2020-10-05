"use strict";

let currentBlock = "dirt";


//https://stackoverflow.com/a/15098620
const placeBlock = (e) => {
  if(e.buttons == 1 || e.buttons == 3){
    e.currentTarget.className = "block "+currentBlock;

    // source: https://stackoverflow.com/a/57208937
    let coordinate = e.currentTarget.id.split(',').map(Number);
    window.structureBlocks[coordinate[0]][coordinate[1]] = currentBlock; 
  };
};

const changeBlockSelected = (e) => {
  currentBlock = e.currentTarget.value;
};

function setupControls(){
  //https://www.techiedelight.com/bind-change-event-handler-radio-button-javascript/
  var radios = document.querySelectorAll('input[type=radio][name="blockRadio"]');
  radios.forEach(radio => radio.addEventListener('change', (e) => changeBlockSelected(e)));
};

let defaultSize = 10;
export function setupGrid(structureData){
  let xSize = defaultSize; 
  let zSize = defaultSize;
  window.structureBlocks = [];

  if(structureData){
    xSize = structureData.length;
    zSize = structureData[0].length;
    window.structureBlocks = structureData; 
  }
  
  document.querySelectorAll(".grid").forEach(gridElement => {
    document.body.removeChild(gridElement);
  })

  // setup the arrays for layers
  // In mc, x/z is the horizontal plane.
  for(let x = 0; x < xSize; x++){  
    if(!structureData){
      window.structureBlocks.push([]); // new row in storage
    }
    let row = document.createElement("div");
    row.id = `row${x}`;
    row.className = `grid`;
    row.ondragstart = function() { return false; }; // https://stackoverflow.com/a/4211930

    for(let z = 0; z < zSize; z++){
      let block = document.createElement("div");
      block.classList.add("block");

      if(structureData && structureData[x] && structureData[x][z]){
        block.classList.add(structureData[x][z]);
      }
      else{
        structureBlocks[x].push("air"); 
        block.classList.add("air");
      }


      block.id = `${x},${z}`; // Store coordinate. Unique to every block
      block.ondragstart = function() { return false; }; // https://stackoverflow.com/a/4211930

      block.addEventListener('mouseover', (e) => placeBlock(e)); // doesnt handle clicking
      block.addEventListener('mousedown', (e) => placeBlock(e));

      row.appendChild(block);
    };

    document.body.appendChild(row);
  };
};

export function setupMain(){
  setupControls();
  setupGrid();
};