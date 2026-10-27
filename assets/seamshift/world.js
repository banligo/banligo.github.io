// Data-driven map machinery. Coordinates of rooms/floors and dual corners stay distinct.
export const equal = (a,b) => !!a&&!!b&&a.x===b.x&&a.y===b.y;
export const at = p => ({x:p[0],y:p[1]});
export function territoryAt(level,p) {
  let best=null,distance=Infinity;
  for(const site of level.territories??[]) {const d=(p.x-site.x)**2+(p.y-site.y)**2;if(d<distance){distance=d;best=site.id;}}
  return best; // Ties belong to the first declared seed, deterministically.
}
export function roomAt(level,state,p) {
  for(const room of level.rooms??[]) {
    const rotation=state?.rooms?.[room.id]??room.rotation??0, cx=room.x+(room.size-1)/2,cy=room.y+(room.size-1)/2;
    if(p.x<room.x||p.x>=room.x+room.size||p.y<room.y||p.y>=room.y+room.size)continue;
    let x=p.x-cx,y=p.y-cy;
    for(let i=0;i<rotation;i++)[x,y]=[y,-x];
    return {room,ports:room.cells[`${x+(room.size-1)/2},${y+(room.size-1)/2}`]?.map(d=>(d+rotation)%4)??[]};
  }
  return null;
}
export const bridgeAt = (level,p) => (level.bridges??[]).find(b=>b.cells.some(c=>equal(p,at(c))));
export const bridgeIsOpen = (state,b) => state.bridgeStates?.[b.id]??b.initialOpen??false;
export const worldSignature = state => JSON.stringify([state.bridgeStates,state.rooms]);
export function buildable(level,p) {
  if(!p||level.map[p.y]?.[p.x]!=='_')return false;
  if(bridgeAt(level,p)||(level.radiusLinks??[]).some(e=>equal(p,at(e.from))||equal(p,at(e.to))))return false;
  return !(level.controls??[]).some(c=>equal(p,c)) && !(level.rifts??[]).some(r=>equal(p,r.primal)) && !equal(p,level.star);
}
