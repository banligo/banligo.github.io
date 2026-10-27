import {seededRandom} from './graphs.js';
import {buildable} from './world.js';
const all=['plane','cylinder','mobius','torus'];
const piece=(id,shape='straight',rotation=0,color='ochre')=>({id,shape,rotation,color});
const control=(id,x,y,kind,extra={})=>({id,x,y,kind,...extra});
const bridge=(id,cells,initialOpen=false,color='ochre')=>({id,cells,initialOpen,color});
const room=(id,x,y,territory,horizontal=false)=>({id,x,y,size:3,territory,rotation:0,cells:horizontal?{'0,1':[1,3],'1,1':[1,3],'2,1':[1,3]}:{'1,0':[0,2],'1,1':[0,2],'1,2':[0,2]}});
const rift=(id,x,y,dx,dy)=>({id,primal:{x,y},dual:{x:dx,y:dy}});
const definitions=[
 {id:1,title:'Broken Path',subtitle:'断开的路',map:['########','#PQBB.##','##.##.##','##.##Q##','#####B##','#####B##','#####E##'],
  bridges:[bridge('reed',[[3,1],[4,1]]),bridge('clay',[[5,4],[5,5]],false,'clay')],
  controls:[control('first',2,1,'bridge',{bridge:'reed'}),control('second',5,3,'bridge',{bridge:'clay'})],
  radiusLinks:[{from:[2,2],to:[2,3],distance:1.22}],scales:[1,2,3],modes:['plane'],star:{x:2,y:3},
  lesson:'踩同纹地板接桥；圆点之间的路由连接范围决定。',hints:['机关上的双横纹，与桥的纹样相同。','星片旁的两节点还没相遇；增大连接范围，再去踩另一座桥的机关。']},
 {id:2,title:'Monster & Boundaries',subtitle:'另一边的小兽',map:['#######','.P####K','..#####','..#####','M.#####','DE#####','#######'],modes:['plane','cylinder','mobius'],scales:[1],wakeOnKey:true,alertRadius:1,star:{x:0,y:2},
  lesson:'钥匙会开门，也会惊醒小兽。',hints:['同一行的另一边有钥匙，扭转后另一边换了一行。','先规划退路；醒来的小兽每回合走一步，等待也会推进它。']},
 {id:3,title:'Puzzle & Torus',subtitle:'上下相接的织片',map:['##._###','##.P###','#._####','#######','#######','###_E##','##._###'],modes:['plane','torus'],scales:[1,2,3],
  pieces:[piece('reed'),piece('bend','corner',3,'clay'),piece('fork','tee',0,'sage'),piece('turn','corner',0,'clay')],
  radiusLinks:[{from:[2,0],to:[2,1],distance:1.25}],star:{x:1,y:2},
  lesson:'空白地面可以建路；环面的上边，也连着下边。',hints:['上下两端的同色边缘是一条真实道路。','先拼下方两个拐角，再让上方的几何节点相连。站在碎片上时不能转动它。']},
 {id:4,title:'Shadow Maze',subtitle:'道路之间的居民',map:['####.##','#P_..##','##.#.##','#....##','#..#.##','#M...##','####.E#'],modes:all,
  pieces:[piece('fork','tee',2,'sage')],shadow:[4,3],beacon:[1,4],shadowSpeed:0,alertRadius:1,star:{x:2,y:3},
  lesson:'裂痕是影子身边的陷阱；小兽却只走地板。',hints:['浅紫线在格子角点，棕色小兽在道路中心。','静止的影子不会追来。绕开裂痕，试试上下相连的路。']},
 {id:5,title:'The Broken Escape',subtitle:'断桥后的退路',map:['########','##PBB.M#','##Q#####','##_#####','#...E###','########','########'],modes:all,
  bridges:[bridge('escape',[[3,1],[4,1]],true)],controls:[control('cut',2,2,'bridge',{bridge:'escape'})],pieces:[piece('reed')],
  alertRadius:6,shadow:[6,5],beacon:[7,5],shadowSpeed:3,star:{x:1,y:4},
  lesson:'先断开追击的桥，再织出自己的退路。',hints:['小兽下一步的棕色箭头，正在指向桥。','踩桥纹地板切断追击；下方的空白地面可以搭一条新路。']},
 {id:6,title:'Keep the Light',subtitle:'守住灯火',map:['###.###','#P....#','#.#.###','#...#.#','###_###','#..NE##','###.###'],modes:['plane'],
  shadow:[2,4],beacon:[5,4],shadowSpeed:4,circuit:{lamp:[5,4],initialStarted:true},pieces:[piece('shield','straight',0,'sage')],star:{x:5,y:1},
  lesson:'紫线把灯短路；修路隔开它，储能才会稳定。',hints:['灯旁三小格显示储能，紫色连线意味着正在流失。','用贯穿上下的直路截断紫线，保持两回合，灯会照亮黑暗地板。']},
 {id:7,title:'Shadow & Light',subtitle:'光也会再次熄灭',map:['###.###','#P....#','###.###','#_..#.#','#.._###','#..NE##','###.###'],modes:['plane','torus'],initialTopology:'torus',
  shadow:[2,4],beacon:[5,4],shadowSpeed:4,circuit:{lamp:[5,4],initialStarted:true},pieces:[piece('shield','straight',0,'sage'),piece('ring','corner',0,'clay')],star:{x:5,y:1},
  lesson:'灯怕短路；接回紫线，它就立刻熄灭。',hints:['环面上，一道长屏障也能从边界绕过去。','可以切开边界，或用拐角围成小环；灯需要安全供能两回合。']},
 {id:8,title:'Light Across the Seam',subtitle:'带着光穿过缝隙',map:['###.####','#P...M.#','#.#.####','#_..#..#','#.._####','###KDE.#','###.####','###.####'],modes:all,
  shadow:[2,4],beacon:[5,4],shadowSpeed:4,wakeOnKey:true,alertRadius:1,circuit:{lamp:[5,4],initialStarted:true,darkCells:[{x:5,y:5}]},pieces:[piece('shield','straight',0,'sage'),piece('ring','corner',0,'clay')],star:{x:3,y:7},
  lesson:'让灯保持安全，再带着钥匙走过黑暗。',hints:['守路的小兽睡着时眼睛闭合，拿钥匙会惊醒它。','先护灯，再取钥匙；换空间会同时改变小兽与影子的道路。']},
 {id:9,title:'Star Hunt',subtitle:'向守路者借一点星光',map:['########','.P....M.','.####...','.___...K','Q#######','.BB.DE##','########','########'],modes:all,
  bridges:[bridge('hunt',[[1,5],[2,5]])],controls:[control('hunt-switch',0,4,'bridge',{bridge:'hunt'})],pieces:[piece('bend','corner',1,'clay'),piece('reed')],wakeOnKey:true,alertRadius:1,star:{x:6,y:2},
  lesson:'星片一直在那里；先引开小兽，再选安全的归路。',hints:['靠近星片前，先看小兽的下一步。','可以从同一行的边缘绕到钥匙附近，再踩机关搭好归途。']},
 {id:10,title:'First Mastery',subtitle:'第一束织成的光',map:['####.####','.PQBB...K','#.##.#.##','#....#M_#','####_####','###.DNE##','####.####','####.####','####.####'],modes:all,scales:[1,2,3],
  bridges:[bridge('crossing',[[3,1],[4,1]])],controls:[control('crossing-switch',2,1,'bridge',{bridge:'crossing'})],radiusLinks:[{from:[4,6],to:[4,7],distance:1.25}],
  shadow:[3,4],beacon:[6,4],shadowSpeed:4,circuit:{lamp:[6,4],initialStarted:true},wakeOnKey:true,alertRadius:1,
  pieces:[piece('shield','straight',0,'sage'),piece('bend','corner',2,'clay')],star:{x:4,y:8},
  lesson:'准备道路、守好灯，再给小兽留下一条错误的路。',hints:['先拼好退路，再从边界接近钥匙。','桥接通后也会成为屏障的一部分；穿越黑暗前，确认灯仍然亮着。']},
 {id:11,title:'Mirror Walk',subtitle:'裂隙另一侧',map:['#######','#P.F###','#######','#######','#F#F.E#','#.#.###','#######'],modes:['plane'],
  rifts:[rift('near',3,1,3,2),rift('far',3,4,3,4),rift('star',1,4,1,4)],shadow:[5,3],beacon:[5,5],shadowSpeed:3,star:{x:1,y:5},
  lesson:'裂隙的另一侧，也有道路。',hints:['走到双色菱形，再按“双界”或 E；紫色世界走角点。','星片在第三处裂隙的普通世界一侧，不能在紫色世界直接拾取。']},
 {id:12,title:'First Light',subtitle:'亲手点亮',map:['###.###','#PQ...#','#.#.###','#...#.#','###_###','#..NE##','###.###'],modes:['plane'],scales:[1,2,3],
  radiusLinks:[{from:[1,2],to:[1,3],distance:1.25}],shadow:[2,4],beacon:[5,4],shadowSpeed:4,circuit:{lamp:[5,4],source:{x:1,y:1},receiver:{x:3,y:5}},
  controls:[control('ignite',2,1,'ignite')],pieces:[piece('shield','straight',0,'sage')],star:{x:5,y:1},
  lesson:'先接通能源道路，再踩点火机关，守住两回合。',hints:['金色源点与灯之间需要一条真实相通的道路。','拼好竖直屏障，踩点火地板；短路解除只表示安全，并不代表已经启动。']},
 {id:13,title:'Moving Territories',subtitle:'转动领地',map:['#########','###RRR###','#PQRRR.##','###RRR.##','#####....','#####.Q.M','#####RRR#','#####RRR#','#####RRR#','######E##'],modes:['plane'],
  territories:[{id:'blue',x:2,y:2},{id:'clay',x:6,y:5},{id:'sage',x:1,y:7}],rooms:[room('north',3,1,'blue'),room('south',5,6,'clay',true)],
  controls:[control('north-turn',2,2,'room',{room:'north',direction:1}),control('south-turn',6,5,'room',{room:'south',direction:-1})],alertRadius:2,star:{x:5,y:4},
  lesson:'踩同色箭头，远处的房间就会转向。',hints:['每块地面属于最近的控制点，同色边框标出对应房间。','先让上方房间横向，再让下方房间纵向；小兽也会沿转好的路前进。']},
 {id:14,title:'Shifting Domains',subtitle:'领地之间的裂缝',map:['######.##','###RRR.##','#PQRRRF##','###RRR###','#########','#RRR##F##','.RRRF#Q##','#RRR##_E#','######.##'],modes:['plane','torus'],
  territories:[{id:'blue',x:2,y:2},{id:'clay',x:6,y:6},{id:'sage',x:1,y:8}],rooms:[room('entry',3,1,'blue'),room('reward',1,5,'clay',true)],
  controls:[control('entry-turn',2,2,'room',{room:'entry'}),control('reward-turn',6,6,'room',{room:'reward'})],
  rifts:[rift('entry',6,2,6,3),rift('return',6,5,6,5),rift('reward',4,6,4,6)],pieces:[piece('bend','corner',1,'sage')],
  shadow:[2,4],beacon:[4,5],shadowSpeed:4,star:{x:0,y:6},
  lesson:'房间可以转向，裂隙也能绕行；不止一种归路。',hints:['先转开普通世界的入口，再比较紫线与上下边缘。','星片在另一片领地；可以先经过奖励裂隙，再回到归途机关。']},
 {id:15,title:'The Last Seam',subtitle:'最后一道缝',map:['##########','#PQBB..M##','#####F####','##########','#####..FQ#','####RRR###','####RRR_.#','####RRR..#','#####..QNE','##########'],modes:all,scales:[1,2,3],
  bridges:[bridge('last',[[3,1],[4,1]])],radiusLinks:[{from:[1,1],to:[2,1],distance:1.25}],controls:[control('bridge',2,1,'bridge',{bridge:'last'}),control('tower',8,4,'room',{room:'tower'}),control('ignite',7,8,'ignite')],
  territories:[{id:'blue',x:8,y:4},{id:'clay',x:2,y:1},{id:'sage',x:7,y:8}],rooms:[room('tower',4,5,'blue',true)],rifts:[rift('near',5,2,5,3),rift('far',7,4,7,4)],
  pieces:[piece('shield','corner',1,'sage'),piece('spare','tee',0,'clay')],shadow:[4,4],beacon:[7,7],shadowSpeed:3,alertRadius:2,
  circuit:{lamp:[8,7],source:{x:5,y:8},receiver:{x:8,y:7}},star:{x:8,y:6},
  lesson:'修路、穿过裂隙，再亲手点亮最后一盏灯。',hints:['小兽会追上桥，双界裂隙却能让你进入另一层。','塔下四格小环可以保护灯；同色箭头负责房间，火纹机关负责启动能源。']},
];
export const levels=definitions.map((l,i)=>({revision:10,legacyRevision:i<10?[2,1,3,3,3,2,2,3,4,4][i]:undefined,seed:103+i*103,initialScale:1,initialTopology:'plane',radii:[.9,1.15,1.4],scales:[1],bridges:[],radiusLinks:[],pieces:[],controls:[],rifts:[],rooms:[],territories:[],shadowSpeed:0,goalText:'找到终点；星片是可选奖励。',levelObjectives:[{type:'reachGoal'}],...l,width:l.map[0].length,height:l.map.length}));
for(const l of levels){
  l.slots=[];for(let y=0;y<l.height;y++)for(let x=0;x<l.width;x++)if(buildable(l,{x,y}))l.slots.push({id:`${x},${y}`,x,y});
  l.pieces=l.pieces.map(p=>({...p,allowedSlots:l.slots.map(s=>s.id)}));
  const random=seededRandom(l.seed);
  l.radiusLinks=l.radiusLinks.map(e=>{const dx=e.to[0]-e.from[0],dy=e.to[1]-e.from[1],d=Math.hypot(dx,dy),mx=(e.from[0]+e.to[0])/2,my=(e.from[1]+e.to[1])/2,r=e.distance;return {...e,nodes:[{x:mx-dx/d*r/2+(random()-.5)*.004,y:my-dy/d*r/2+(random()-.5)*.004},{x:mx+dx/d*r/2+(random()-.5)*.004,y:my+dy/d*r/2+(random()-.5)*.004}]};});
  l.n3Opt=null;l.threeStarLimit=80;
}
export const getLevel=id=>levels.find(l=>l.id===Number(id));
