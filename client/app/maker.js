

let defaultSize = 10;
let currentBlock = "dirt";

/**
 * Does the painting on the grid when users click or drag.air
 * 
 * @param {*} e dom element activated
 */
const placeBlock = (e) => {
  // Detect if mouse is pressed or clicked at time: https://stackoverflow.com/a/15098620
  if(e.buttons == 1 || e.buttons == 3){
    e.currentTarget.className = "block "+currentBlock;

    let coordinate = e.currentTarget.id.split(',').map(Number);
    window.structureBlocks[coordinate[0]][coordinate[1]] = currentBlock; 
  };
};

/**
 * Changes what block the user is painting to the element's value.
 * Used for when radio button is pressed.
 * 
 * @param {*} e dom element activated
 */
const changeBlockSelected = (e) => {
  currentBlock = e.currentTarget.value;
};

/**
 * Attachs changeBlockSelected to all radio buttons so clicking any button
 * will swap the user's block to the radio button's value (which is a block)
 */
const setupControls = () => {
  //https://www.techiedelight.com/bind-change-event-handler-radio-button-javascript/
  const radios = document.querySelectorAll('input[type=radio][name="blockRadio"]');
  radios.forEach(radio => radio.addEventListener('change', (e) => changeBlockSelected(e)));
};

/**
 * Wipes and re-creates the grid of air blocks.
 * If nbt data is passed in instead, it will make
 * the grid show the contents of the nbt data.
 */
const setupGrid = (structureData, structureSize) => {
  let xSize = defaultSize; 
  let zSize = defaultSize;
  if(structureSize){
    xSize = structureSize;
    zSize = structureSize;
  }

  window.structureBlocks = [];

  if(structureData){
    window.structureBlocks = structureData; 
  }
  
  // wipes old grid
  document.querySelectorAll(".grid").forEach(gridElement => {
    document.body.removeChild(gridElement);
  })

  // setup the arrays for layers
  // In mc, x/z is the horizontal plane.
  for(let x = 0; x < xSize; x++){  
    if(!structureData){
      // make new row as this is hit on startup which has no rows saved yet.
      window.structureBlocks.push([]); 
    }
    let row = document.createElement("div");
    row.id = `row${x}`;
    row.className = `grid`;
    // Make the grid unabled to be dragged: https://stackoverflow.com/a/4211930
    row.ondragstart = function() { return false; }; 

    for(let z = 0; z < zSize; z++){
      let block = document.createElement("div");
      block.classList.add("block");

      if(structureData && structureData[x] && structureData[x][z]){
        block.classList.add(structureData[x][z]);
      }
      else{
        // add air at startup or when nbt data entries are undefined
        structureBlocks[x].push("air"); 
        block.classList.add("air");
      }


      block.id = `${x},${z}`; // Store coordinate. Unique to every block
      block.ondragstart = function() { return false; }; // Make the grid unabled to be dragged: https://stackoverflow.com/a/4211930

      // Mouseover with a check for mouse pressed doesn't work for clicking.
      // Thus the use of mousedown as well.
      block.addEventListener('mouseover', (e) => placeBlock(e)); 
      block.addEventListener('mousedown', (e) => placeBlock(e));

      row.appendChild(block);
    };

    document.body.appendChild(row);
  };
};
