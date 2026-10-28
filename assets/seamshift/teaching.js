import {hunterArt,shadowArt,trapArt,riftArt,controlArt,lampArt,energyArt,floorArt,bridgeArt,keyArt,doorArt,playerArt,darkFloorArt,noiseArt,generatorArt} from './sprites.js';
import {pieceIcon} from './board.js';
import {starPath} from './icons.js';
import {dualGraph} from './graphs.js';
const art=body=>`<svg viewBox="-60 -32 120 66" aria-hidden="true">${body}</svg>`;
const pair=(a,b)=>art(`<g transform="translate(-30 0) scale(.8)">${a}</g><g transform="translate(30 0) scale(.8)">${b}</g>`);
// Pocket manual: game actions only. Mathematical material lives separately below.
export const lessons=[
 {id:'road',title:'移动与等待',text:'方向键或滑动移动；等待可让时间前进。Z 撤销，R 重来。',art:art(playerArt())},
 {id:'bridge',title:'同纹机关与桥',text:'踩同纹地板开关桥。桥上有人时不能断桥。',art:pair(controlArt(),bridgeArt(true))},
 {id:'pieces',title:'自由建路',text:'选择碎片，在空地放下；可以旋转、交换或收回。上面有人时不能改动。',art:pieceIcon({rotation:0},{shape:'corner',color:'clay'})},
 {id:'topologies',title:'四种空间',text:'平面不相连；环绕连接左右；扭转连接左右反向的行；环面连接左右和上下。',art:''},
 {id:'hunter-sleep',title:'睡眠与警戒',text:'小兽睡着时不动。进入虚线范围，它会先警觉。',art:art(hunterArt(false))},
 {id:'hunter-awake',title:'先警觉，再追击',text:'警觉一回合后，小兽开始沿道路追你。棕色箭头提示下一步。',art:art(hunterArt(true))},
 {id:'key',title:'普通钥匙与门',text:'走到钥匙上拾取，再通过门。',art:pair(keyArt(),doorArt())},
 {id:'key-noise',title:'带铃钥匙',text:'带铃的钥匙会沿道路传出声音，听到的小兽会警觉。',art:art(keyArt()+noiseArt())},
 {id:'shadow',title:'紫线里的影子',text:'影子沿紫线移动。接通道路可以挡住交叉的紫线。',art:art('<path d="M-50 0H50" stroke="#795c85" stroke-width="3"/>'+shadowArt())},
 {id:'trap',title:'危险与下一步',text:'避开紫色裂痕；空心菱形提示下一回合的危险。',art:pair(trapArt(),'<path d="M0-12 11 0 0 12-11 0Z" fill="none" stroke="#96799b" stroke-width="2"/>')},
 {id:'lamp',title:'灯每回合充一格',text:'接通电源并避开短路，灯每回合充一格。',art:art(lampArt(true)+energyArt(2,false))},
 {id:'energy',title:'看清 0/2、1/2、2/2',text:'充到 2/2 灯才亮；短路会清零，断供会熄灯。',art:pair(lampArt(true)+energyArt(2),lampArt(false)+energyArt(0,true))},
 {id:'dark',title:'灰灯印地板',text:'灰灯印处需要灯光；灯灭时不要走上去。',art:art(darkFloorArt())},
 {id:'ignite',title:'踩下发电地板',text:'踩火纹地板启动发电机。金色虚线显示供电路线。',art:pair(controlArt('ignite'),generatorArt(true))},
 {id:'rift',title:'查看，与真正进入',text:'眼睛只切换视图。站在裂隙上按 E 可进入另一侧；危险或被占据时不能进入。',art:art(riftArt())},
 {id:'room',title:'同色箭头与房间',text:'踩同色箭头旋转房间。房间里有人时不能旋转。',art:pair(controlArt('room','#78939c'),controlArt('room','#b18065',-1))},
 {id:'star',title:'可选星片',text:'收集星片并在目标步数内通关，就能获得三星。',art:art(`<path d="${starPath}" fill="#e9b54e" stroke="#ad7f32"/>`)},
];
export function observeDiscoveries(level,state,action=null,before=null){
 const ids=['road','star'];
 if(level.bridges.length)ids.push('bridge');if(level.pieces.length)ids.push('pieces');if(level.modes.length>1||state.topology!=='plane')ids.push('topologies');
 if(state.hunters.length)ids.push(state.hunterStates.some(m=>m!=='sleeping')?'hunter-awake':'hunter-sleep');
 if(level.map.some(r=>r.includes('K')||r.includes('D')))ids.push('key');if(level.keyNoise)ids.push('key-noise');
 if(state.shadows.length)ids.push('shadow','trap');if(level.circuit)ids.push('lamp','energy','dark');
 if(level.controls.some(c=>c.kind==='ignite'))ids.push('ignite');if(level.rifts.length)ids.push('rift');if(level.rooms.length)ids.push('room');
 if(state.topology==='plane')ids.push('math-plane');
 if(action?.type==='topology')ids.push(`math-${state.topology}`,'math-boundary','math-dynamic');
 if(action?.type==='wait'&&state.shadows.length)ids.push('math-dynamics');
 if(state.hunterStates.some(m=>m==='chasing'))ids.push('math-bfs','math-shortest','math-dynamics');
 if(['place','rotate','remove'].includes(action?.type)||before&&JSON.stringify(state.bridgeStates)!==JSON.stringify(before.bridgeStates))ids.push('math-connectivity','math-cut','math-dynamic');
 if(before&&state.shadows.length&&['place','rotate','remove','topology','move'].includes(action?.type)){const old=dualGraph(level,before).crossings.map(e=>e.open).join(','),now=dualGraph(level,state).crossings.map(e=>e.open).join(',');if(old!==now)ids.push('math-dual','math-cut-cycle');}
 if(before&&JSON.stringify(state.rooms)!==JSON.stringify(before.rooms))ids.push('math-voronoi','math-dynamic');
 if(before&&before.lampCharge!==state.lampCharge)ids.push('math-energy','math-dynamics');
 if(before&&before.world!==state.world)ids.push('math-dual');
 if(before&&before.world===state.world&&(Math.abs(before.player.x-state.player.x)>1||Math.abs(before.player.y-state.player.y)>1)){
  ids.push(`math-${state.topology}`,'math-boundary');if(state.topology==='torus')ids.push('math-loops');
 }
 return [...new Set(ids)];
}
export const referenceLessons=(level,progress)=>lessons.filter(l=>progress.discoveries.includes(l.id));
export function introducedLessons(level){
 const cards=lessons.filter(l=>(levelTopics[level.id]??[]).includes(l.id)).map(l=>l.id==='topologies'?{...l,title:'三种边界',modes:level.modes,text:'平面封闭；环绕连接左右同一行；扭转连接左右相反的行。'}:l.id==='key-noise'?{...l,text:`钥匙声沿道路传 ${level.keyNoise.radius} 步；听到的小兽先警觉。`}:l);
 if(level.id===3)cards.push({...lessons.find(l=>l.id==='topologies'),id:'torus',title:'上下也相接',modes:['plane','torus'],text:'环面的左右相连，上下也相连。'});
 return cards;
}
export const pendingLessons=(level,progress)=>referenceLessons(level,progress); // Persistent, never consumed by a timer.
const levelTopics={1:['bridge'],2:['hunter-sleep','hunter-awake','key','key-noise','topologies'],3:['pieces'],4:['shadow','trap'],5:[],6:['lamp','energy','dark'],7:[],8:[],9:[],10:[],11:['rift'],12:['ignite'],13:['room'],14:[],15:[]};
const boundaryDiagram=mode=>`<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="13" y="9" width="38" height="30" rx="2" fill="#ded1ad" stroke="#b9ad90"/><path d="M25 9v30M39 9v30M13 19h38M13 29h38" stroke="#c2b592" stroke-width=".6"/>${mode==='plane'?'<path d="M10 9v30M54 9v30M13 6h38M13 42h38" stroke="#9e957e"/>':mode==='mobius'?'<path d="M4 13 60 35M4 35 60 13" stroke="#ac7d6b" stroke-width="1.5"/>':'<path d="M4 24h56m-5-4 5 4-5 4" fill="none" stroke="#7d936e" stroke-width="1.5"/>'}${mode==='torus'?'<path d="M32 2v44m-4-5 4 5 4-5" fill="none" stroke="#6c8892" stroke-width="1.5"/>':''}</svg>`;
const topologyArt=(modes=['plane','cylinder','mobius','torus'])=>`<div class="topology-reference">${[['plane','平面','不连接'],['cylinder','环绕','左右同向'],['mobius','扭转','左右反序'],['torus','环面','左右＋上下']].filter(([id])=>modes.includes(id)).map(([id,name,rule])=>`<div>${boundaryDiagram(id)}<b>${name}</b><small>${rule}</small></div>`).join('')}</div>`;
export const lessonCards=cards=>cards.map(l=>`<article class="rule-card">${l.modes||l.id==='topologies'?topologyArt(l.modes):l.art}<h3>${l.title}</h3><p>${l.text}</p></article>`).join('');

// Short notes connect each discovery to something the player has seen.
const note=(id,group,title,text)=>({id,group,title,text});
export const mathNotes=[
 note('math-rgg','随机几何','随机几何图','距离足够近的点之间可以连线。'),
 note('math-radius','随机几何','连接半径','把半径变大，能连接到的点也会增多。'),
 note('math-filtration','随机几何','逐层变化','逐步增加连接，可以观察空间如何变化。'),
 note('math-voronoi','随机几何','最近的控制点','每块地属于离它最近的控制点。游戏里的颜色显示这些区域。'),
 note('math-plane','空间拓扑','平面','地图边缘是终点，不能从另一侧回来。'),
 note('math-cylinder','空间拓扑','环绕','左右边缘接在一起，从一侧出去会回到另一侧的同一行。'),
 note('math-mobius','空间拓扑','扭转','左右边缘反向接在一起：从上方出去，会从另一侧下方回来。'),
 note('math-torus','空间拓扑','环面','左右相接，上下也相接，就像一张可以绕回来的地图。'),
 note('math-boundary','空间拓扑','相连的边缘','相同标记的边缘彼此相接；道路也要接通才能通过。'),
 note('math-loops','空间拓扑','绕空间一圈','环面上的路可以绕回起点，却不一定把里面和外面分开。'),
 note('math-connectivity','图论与对偶','道路连通','两处之间有路可走，它们就是连通的。'),
 note('math-cut','图论与对偶','切断道路','断开一座桥，可能让原本相连的地方分开，小兽也就过不来了。'),
 note('math-dual','图论与对偶','两张交叉的网','玩家走地板上的路，影子走角点间的紫线。道路接通时，会挡住交叉的紫线。'),
 note('math-cut-cycle','图论与对偶','围住与隔开','在平面上，围成一圈常能隔开两边；接上环面后，要再检查是否能绕过去。'),
 note('math-dynamic','图论与对偶','会变化的地图','转动房间、接桥或拼路后，角色和能量都会使用新的道路。'),
 note('math-bfs','游戏与算法','寻找近路','小兽会沿当前接通的道路，寻找通向玩家的短路。'),
 note('math-search','游戏与算法','寻找通关方法','找路时还要考虑怪物、桥和灯：位置相同，局面也可能不同。'),
 note('math-shortest','游戏与算法','最少步数','移动、等待和改变地图都算一步。拿星片的最短路线可能更长。'),
 note('math-dynamics','游戏与算法','回合中的变化','每次有效操作后，怪物和灯都会更新；撤销可以回到上一步。'),
 note('math-energy','游戏与算法','能量的道路','电源沿道路供能；影子沿紫线造成短路。观察两张网，保护灯光。'),
];
export const notebookCards=(level,progress)=>['随机几何','空间拓扑','图论与对偶','游戏与算法'].map(group=>`<section class="math-category"><h3>${group}</h3>${mathNotes.filter(n=>n.group===group).map(n=>{const known=progress.discoveries.includes(n.id);return `<article class="math-note ${known?'':'locked'}"><h4>${n.title}</h4><p>${known?n.text:'继续探索后解锁。'}</p></article>`;}).join('')}</section>`).join('');
