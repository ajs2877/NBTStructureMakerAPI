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

function setupGrid(){

  // setup the arrays for layers
  // In mc, x/z is the horizontal plane.
  for(let x = 0; x < window.size; x++){  
    structureBlocks.push([]); // new row in storage
    let row = document.createElement("div");
    row.id = `row${x}`;
    row.ondragstart = function() { return false; }; // https://stackoverflow.com/a/4211930

    for(let z = 0; z < window.size; z++){
      window.structureBlocks[x].push("air"); // -1 is air
      let block = document.createElement("div");
      block.classList.add("block");
      block.classList.add("air");
      block.id = `${x},${z}`; // Store coordinate. Unique to every block
      block.ondragstart = function() { return false; }; // https://stackoverflow.com/a/4211930

      block.addEventListener('mouseover', (e) => placeBlock(e)); // doesnt handle clicking
      block.addEventListener('mousedown', (e) => placeBlock(e));

      row.appendChild(block);
    };

    document.body.appendChild(row);
  };
};

export default function setup(){
  setupControls();
  setupGrid();
};

