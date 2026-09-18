export function layoutPins(pins,width,height){
 const cellWidth=100,cellHeight=112,padding=12;
 const columns=Math.max(1,Math.floor((width-padding*2)/cellWidth));
 const visibleRows=Math.max(1,Math.floor((height-130-padding*2)/cellHeight));
 const rows=Math.max(visibleRows,Math.ceil(pins.length/columns));
 const occupied=new Set();
 const placements=pins.map(pin=>{
  const wantedCol=Math.round(Math.max(0,Math.min(1,pin.x))*(columns-1));
  const wantedRow=Math.round(Math.max(0,Math.min(1,pin.y))*(visibleRows-1));
  let best=null;
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
   const slot=row*columns+col;if(occupied.has(slot))continue;
   const distance=(col-wantedCol)**2+(row-wantedRow)**2;
   if(!best||distance<best.distance)best={slot,col,row,distance};
  }
  occupied.add(best.slot);
  return {...pin,left:padding+best.col*cellWidth,top:padding+best.row*cellHeight};
 });
 return {placements,contentHeight:rows*cellHeight+padding*2,width:columns*cellWidth+padding*2};
}
