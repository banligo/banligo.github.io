import {hunterArt,shadowArt,trapArt,riftArt,controlArt,lampArt,energyArt,floorArt,bridgeArt,keyArt,doorArt,playerArt,darkFloorArt,noiseArt} from './sprites.js';
import {pieceIcon} from './board.js';
import {starPath} from './icons.js';
const art=body=>`<svg viewBox="-60 -32 120 66" aria-hidden="true">${body}</svg>`;
const pair=(a,b)=>art(`<g transform="translate(-30 0) scale(.8)">${a}</g><g transform="translate(30 0) scale(.8)">${b}</g>`);
// Pocket manual: game actions only. Mathematical material lives separately below.
export const lessons=[
 {id:'road',title:'移动与等待',text:'方向键 / WASD / 地图滑动移动；Space 或等待原地过一回合。无效操作不计回合；Z 撤销、R 重开。',art:art(playerArt())},
 {id:'bridge',title:'同纹机关与桥',text:'每次重新踩入同纹地板，桥切换一次。桥上有人时不会断桥；桥不是用底部按钮开关的。',art:pair(controlArt(),bridgeArt(true))},
 {id:'pieces',title:'自由建路',text:'选碎片，点空白地面放下；再点旋转，可收回、交换和拖放。玩家或小兽在上面时不能改动。',art:pieceIcon({rotation:0},{shape:'corner',color:'clay'})},
 {id:'topologies',title:'四种空间',text:'平面：四边封闭。环绕：左右同一行。扭转：左右相反一行。环面：左右和上下都连接。点模式按钮或按 T；同色边缘标记相连。',art:''},
 {id:'hunter-sleep',title:'睡眠与警戒',text:'闭眼的小兽不移动、不攻击。淡金虚线格是它真实能听见脚步的道路范围，墙和断桥会挡住。进入范围后先睁眼警觉，本回合不移动。',art:art(hunterArt(false))},
 {id:'hunter-awake',title:'先警觉，再追击',text:'“! 警觉”这一回合不移动；下一有效回合开始追一步。棕色箭头和三角格是原地等待后它会到的位置，换路后预测立即更新。',art:art(hunterArt(true))},
 {id:'key',title:'普通钥匙与门',text:'走到钥匙上自动拾取，只计这次移动的一回合。普通钥匙只开门，不会把整张地图的小兽吵醒。',art:pair(keyArt(),doorArt())},
 {id:'key-noise',title:'带铃钥匙',text:'带声波记号的钥匙会响。声音只沿接通的道路传到本关注明的步数；听见的小兽也先警觉一回合，不会免费扑来。',art:art(keyArt()+noiseArt())},
 {id:'shadow',title:'紫线里的影子',text:'影子只走角点之间的紫线。接通一条玩家道路，会挡住交叉的紫线；影子改道，身边的危险格也跟着变。',art:art('<path d="M-50 0H50" stroke="#795c85" stroke-width="3"/>'+shadowArt())},
 {id:'trap',title:'危险与下一步',text:'紫色裂痕是影子当前影响的地板；空心菱形是下一回合新增危险。回合结束仍在危险格会失败。棕色三角属于普通小兽，与影子不同。',art:pair(trapArt(),'<path d="M0-12 11 0 0 12-11 0Z" fill="none" stroke="#96799b" stroke-width="2"/>')},
 {id:'lamp',title:'灯每回合充一格',text:'发电已启动、供能道路相连、没有短路，每次有效操作就充一格。移动、等待、拼图和换空间都一样。无效操作和撤销不充电。',art:art(lampArt(true)+energyArt(2,false))},
 {id:'energy',title:'看清 0/2、1/2、2/2',text:'充满 2/2 灯才亮。紫线短路立即熄灯并归零；断供停止充电。修好后仍需按回合充电，不能瞬间回满。',art:pair(lampArt(true)+energyArt(2),lampArt(false)+energyArt(0,true))},
 {id:'dark',title:'灰灯印地板',text:'灰色斜纹、角上的灰灯印表示这里需要灯光。灯亮后恢复安全；它与紫色裂痕是两种不同危险，不会重复画两层阴影。',art:art(darkFloorArt())},
 {id:'ignite',title:'踩下发电地板',text:'火纹地板把发电机从 OFF 变为 ON，离开后仍运行。条件已满足时，踩下的这一回合就能充第一格；亮起的金色虚线显示能量沿哪条路输送。',art:pair(controlArt('ignite'),lampArt(true))},
 {id:'rift',title:'查看，与真正进入',text:'眼睛只切换显示。旁边的进入裂隙按钮 / E 才切换世界，且只能站在双色裂隙上使用。另一侧危险或被占据就不能进入；紫色世界不能拾取普通物品或完成普通终点。',art:art(riftArt())},
 {id:'room',title:'同色箭头与房间',text:'踩同色箭头，让对应房间转九十度。箭头方向就是转向；房间里还有角色时拒绝旋转。',art:pair(controlArt('room','#78939c'),controlArt('room','#b18065',-1))},
 {id:'star',title:'可选星片',text:'普通世界走到金色星片上即可拾取，星片从开始就可见。它不影响普通通关；三星还需达到通关后显示的步数目标。',art:art(`<path d="${starPath}" fill="#e9b54e" stroke="#ad7f32"/>`)},
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
 if(before&&state.shadows.length&&['place','rotate','remove','topology'].includes(action?.type))ids.push('math-dual','math-cut-cycle');
 if(before&&JSON.stringify(state.rooms)!==JSON.stringify(before.rooms))ids.push('math-voronoi','math-dynamic');
 if(before&&before.lampCharge!==state.lampCharge)ids.push('math-energy','math-dynamics');
 if(before&&before.world!==state.world)ids.push('math-dual');
 if(before&&before.world===state.world&&(Math.abs(before.player.x-state.player.x)>1||Math.abs(before.player.y-state.player.y)>1)){
  ids.push(`math-${state.topology}`,'math-boundary');if(state.topology==='torus')ids.push('math-loops');
 }
 return [...new Set(ids)];
}
export const referenceLessons=(level,progress)=>lessons.filter(l=>progress.discoveries.includes(l.id));
export const introducedLessons=level=>lessons.filter(l=>(levelTopics[level.id]??['road']).includes(l.id));
export const pendingLessons=(level,progress)=>referenceLessons(level,progress); // Persistent, never consumed by a timer.
const levelTopics={1:['bridge'],2:['hunter-sleep','key-noise'],3:['pieces','topologies'],4:['hunter-sleep','trap'],5:['bridge','hunter-awake'],6:['lamp'],7:['energy'],8:['dark','key-noise'],9:['star','hunter-awake'],10:['trap','dark'],11:['rift'],12:['ignite'],13:['room','hunter-sleep'],14:['rift','room'],15:['bridge','shadow']};
const summary={
 1:['踩同纹地板，桥梁会切换；桥上有人时不会断桥。'],
 2:['闭眼不攻击；先警觉一回合，再追击。','带铃钥匙沿道路传声 4 步，普通钥匙不响。'],
 3:['点空白地面建路；上面有人时不能改动。','环面的上边，也接着下边。'],
 4:['进入 1 步道路警戒范围后，小兽先警觉一回合。','紫裂痕是影子当前影响的地板。'],
 5:['踩机关断桥，能切断追击；棕箭头是下一回合。'],
 6:['供能连通且没有短路时，每过一回合，灯充电一格。'],
 7:['短路立刻熄灯并归零；安全供能后按回合重新充电。'],
 8:['灯亮，灰灯印地板才安全。','带铃钥匙沿道路传声 6 步，先警觉再追击。'],
 9:['星片就在道路上；先看小兽的警戒与棕色箭头。'],
 10:['紫裂痕属于影子；灰灯印需要照明，二者不同。'],
 11:['眼睛只查看；进入裂隙 / E 才真正切换世界。'],
 12:['踩下发电地板，能量才会开始输送。'],
 13:['同色箭头转动房间；房间里有人不能转。','小兽只在道路 2 步内警觉，普通钥匙不会响。'],
 14:['转动同色房间，再经裂隙或上下接缝绕行。'],
 15:['守桥者已警觉；断桥留住它，利用翻转或上下接缝。','影子每 4 回合走一步；紫裂痕与菱形提示危险。'],
};
export function currentDiscoveryCards(level,state,progress){
 return (summary[level.id]??[level.lesson]).map((text,i)=>{const topics=levelTopics[level.id]??['road'],id=topics[Math.min(i,topics.length-1)],rule=lessons.find(l=>l.id===id),known=progress.discoveries.includes(id);let image=rule.art;
 if(id==='hunter-sleep'||id==='hunter-awake')image=art(hunterArt(state.hunterStates.some(m=>m!=='sleeping')));
 return `<div class="current-rule" data-rule="${id}">${known?image:art('<circle r="7" fill="none" stroke="#aaa18a"/>')}<span>${known?text:'尚未发现 · 观察地图上的变化'}</span></div>`;}).join('');
}
const boundaryDiagram=mode=>`<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="13" y="9" width="38" height="30" rx="2" fill="#ded1ad" stroke="#b9ad90"/><path d="M25 9v30M39 9v30M13 19h38M13 29h38" stroke="#c2b592" stroke-width=".6"/>${mode==='plane'?'<path d="M10 9v30M54 9v30M13 6h38M13 42h38" stroke="#9e957e"/>':mode==='mobius'?'<path d="M4 13 60 35M4 35 60 13" stroke="#ac7d6b" stroke-width="1.5"/>':'<path d="M4 24h56m-5-4 5 4-5 4" fill="none" stroke="#7d936e" stroke-width="1.5"/>'}${mode==='torus'?'<path d="M32 2v44m-4-5 4 5 4-5" fill="none" stroke="#6c8892" stroke-width="1.5"/>':''}</svg>`;
const topologyArt=()=>`<div class="topology-reference">${[['plane','平面','不连接'],['cylinder','环绕','左右同向'],['mobius','扭转','左右反序'],['torus','环面','左右＋上下']].map(([id,name,rule])=>`<div>${boundaryDiagram(id)}<b>${name}</b><small>${rule}</small></div>`).join('')}</div>`;
export const lessonCards=cards=>cards.map(l=>`<article class="rule-card">${l.id==='topologies'?topologyArt():l.art}<h3>${l.title}</h3><p>${l.text}</p></article>`).join('');

// Discoveries notebook: definitions, scope and links; no duplicated game-legend gallery.
const note=(id,group,title,intuition,definition,game,connection)=>({id,group,title,intuition,definition,game,connection});
export const mathNotes=[
 note('math-rgg','随机几何','Random Geometric Graph','距离足够近的点才连边。','V 是给定点集，E(r) = {{i,j}: d(i,j) ≤ r}。','当前版本没有主动改变连接半径的关卡；机关桥由触发地板控制，并非随机几何边。','与距离、尺度过滤有关；不能把每次手工断桥称为随机几何相变。'),
 note('math-radius','随机几何','连接半径与尺度','半径控制哪些几何关系能被看见。','r₁ ≤ r₂ 时，固定点集上的 E(r₁) ⊆ E(r₂)。','本版关卡固定尺度，不提供半径按钮。遇到实际距离连接机制后才解锁此页。','改变拓扑或手动开关桥梁通常不满足这个单调关系。'),
 note('math-filtration','随机几何','Filtration','逐步加入结构，形成嵌套的一族空间。','过滤满足 X(r₁) ⊆ X(r₂)，r₁ ≤ r₂；还可由图建立旗复形。','目前的拼图可增加也可删除边，因此其任意操作序列不自动构成过滤。','持久同调需要明确过滤参数；有限地图的连通改变也不等于严格渗流临界现象。'),
 note('math-voronoi','随机几何','Voronoi Tessellation','每个位置归最近的控制点。','Rᵢ = {x : d(x,sᵢ) ≤ d(x,sⱼ), 对所有 j}。','房间关按格中心的欧氏距离计算归属；相等时按配置顺序确定。地板控制该领地对应房间。','这是确定的几何划分；房间旋转是另一项离散变换，不会重新随机生成领地。'),
 note('math-plane','空间拓扑','Plane 与边界','地图边缘结束，不能从另一侧回来。','本游戏采用有边界的有限矩形方格域，不识别相对边。','“平面”模式中的普通道路与影子路线都没有周期接缝；并不是模拟整个无穷平面。','外部面的处理会影响对偶图；这里采用省略外部通路的边界约定。'),
 note('math-cylinder','空间拓扑','Cylinder','把左右边缘按相同方向粘起来。','(0,y) ∼ (W,y)，上下边仍有边界。','从一侧进入另一侧同一行；小兽也使用这些真实邻接边。','只有一个独立周期方向；与上下也周期连接的环面不同。'),
 note('math-mobius','空间拓扑','Möbius Strip','边缘识别时，行序发生反转。','(0,y) ∼ (W,H−y)；格中心索引对应 y → H−1−y。','普通格中心与对偶角点各用自己的正确坐标公式，不能混用半格位置。','这是非定向的边界识别；从边缘回来时，局部方向可能翻转。'),
 note('math-torus','空间拓扑','Torus','两个独立方向都能绕回来。','(x,y) ∼ (x+W,y) ∼ (x,y+H)。','左右与上下都生成真实周期邻接；对偶网络同时包含两类接缝。','环面上的一个绕圈通常不能直接当成平面上的封闭围墙。'),
 note('math-boundary','空间拓扑','周期边界识别','边缘相连是邻接规则，不是任意传送。','邻点先加单位方向，再按当前空间的识别关系映射。','相同边缘标记表示同一连接，墙和拼图端口仍然限制是否真的可走。','原始与对偶坐标不同，但必须使用相容的边界映射。'),
 note('math-loops','空间拓扑','Non-contractible Loops','有些绕圈无法在空间内部缩成一点。','环面的基本群为 ℤ × ℤ；绕两个周期方向的环有不同绕数。','一条跨越接缝的闭合道路，未必把影子与灯分到两侧。','应直接检查实际连通性，而不能沿用平面“围起来就隔开”的直觉。'),
 note('math-connectivity','图论与对偶','Graph Connectivity','两点之间存在一条路，就属于同一连通分支。','u ∼ v 当且仅当存在路径 u=v₀,…,vₙ=v。','道路、机关桥、拼图与空间共同决定当前图；安全性还要考虑回合中的居民。','静态可达不代表动态可通关，因此求解还需要完整状态搜索。'),
 note('math-cut','图论与对偶','Graph Cuts','移除某些连接后，原本相通的区域可能分开。','对顶点子集 S，边割 δ(S) 包含恰有一个端点位于 S 的边。','断桥同时关闭桥格及其邻接边；它能切断小兽追击，但未必是最小割。','打开原始道路也可能切断交叉的影子路线，两种图的效果相反。'),
 note('math-dual','图论与对偶','Primal / Dual Graph','道路中心与道路之间，可以各有一套连线。','在固定嵌入网络中，每条原始边对应一条与之相交的对偶边。','本游戏在固定方格的交叉边上实行开闭互补；原始边开，则交叉紫线关。角点不是玩家格中心。','不是重新计算任意嵌入的全部合并面；边界约定和周期识别也必须参与建图。'),
 note('math-cut-cycle','图论与对偶','Cut–Cycle Duality','在适当的平面图中，割和对偶闭环有对应关系。','有限连通平面图包含外部面时，极小边割对应对偶中的圈。','游戏有省略外部面的边界和周期空间，因此以真实图搜索验证是否隔开影子。','环面上非收缩环不一定分割空间，不能直接套用平面结论。'),
 note('math-dynamic','图论与对偶','动态图结构','一个操作改变的可能是整张可通行网络。','Gₜ = (Vₜ,Eₜ)，由当前桥、端口、房间方向和边界决定。','拼图、机关桥和房间旋转后，怪物及能量都重新使用当前真实图。','预测必须基于同一个状态转移，不能沿用上回合缓存的旧路线。'),
 note('math-bfs','游戏与算法','BFS / A*','逐层找路，或用可靠的下界引导搜索。','无权图 BFS 按边数逐层扩展；A* 使用 f(n)=g(n)+h(n)。','小兽在当前道路图用 BFS 找一步；关卡求解器在完整状态图上搜索。','A* 的最优保证需要可采纳的启发式和正确的状态去重。'),
 note('math-search','游戏与算法','State-space Search','位置相同，不代表局面相同。','状态包含角色、世界、怪物阶段、时钟、机关、拼图、收集物和灯。','通关搜索逐步调用真实游戏引擎，并重放每一个操作；只检查地图连通不够。','预算耗尽只意味着尚未证明，不能写成无解或伪造最优。'),
 note('math-shortest','游戏与算法','最优路径与最优策略','最短移动路线，未必是最少操作策略。','每个有效操作成本为 1；三星搜索另要求实际收集星片。','旋转、等待、换空间也计步，普通通关最优与三星最优分别计算。','松弛敌人和机关约束只能用于下界，最终胜利仍由真实转移判定。'),
 note('math-dynamics','游戏与算法','离散动力系统','世界在每个有效回合后更新一次。','Sₜ₊₁ = F(Sₜ,aₜ)，无效输入保持 S 不变。','先处理玩家与道路，再处理怪物、供能与危险；警觉有明确的一回合反应时间。','Undo 恢复过去的完整 S，不是再模拟一个额外回合。'),
 note('math-energy','游戏与算法','能量传输网络','供能路径与短路路径是两个不同的问题。','安全供能时 qₜ₊₁=min(qmax,qₜ+1)；短路时 qₜ₊₁=0。','电源到接收格按道路图判连通，影子到灯按紫色网络判短路；还需已启动。','这是连通性与整数计数的游戏模型，不是电压、电阻的完整电路模拟。'),
];
export const notebookCards=(level,progress)=>['随机几何','空间拓扑','图论与对偶','游戏与算法'].map(group=>`<section class="math-category"><h3>${group}</h3>${mathNotes.filter(n=>n.group===group).map(n=>{const known=progress.discoveries.includes(n.id);return `<article class="math-note ${known?'':'locked'}"><h4>${n.title}</h4>${known?`<p>${n.intuition}</p><p class="math-definition">${n.definition}</p><p><b>在游戏中：</b>${n.game}</p><p><b>联系：</b>${n.connection}</p>`:'<p>尚未体验相关变化。</p>'}</article>`;}).join('')}</section>`).join('');
