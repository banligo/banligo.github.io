import {hunterArt,shadowArt,trapArt,riftArt,controlArt,lampArt,energyArt,floorArt,bridgeArt,keyArt,doorArt,playerArt} from './sprites.js';
import {pieceIcon} from './board.js';
import {starPath,icon} from './icons.js';
const art=body=>`<svg viewBox="-60 -32 120 66" aria-hidden="true">${body}</svg>`;
const pair=(a,b)=>art(`<g transform="translate(-30 0) scale(.8)">${a}</g><g transform="translate(30 0) scale(.8)">${b}</g>`);
const entry=(id,category,title,text,art,math,example)=>({id,category,title,text,art,math,example});
export const lessons=[
 entry('road','世界规则','走在道路上','浅色道路相连，才能走过去。',art(floorArt()),'道路中心是原始图的节点；实际可通行的相邻端口构成边。'),
 entry('bridge','世界规则','踩地板，桥会回应','同纹机关每次重新踏入触发一次；桥上有人时不会断桥。',pair(controlArt(),bridgeArt(true)),'机关控制一段真实的道路与地板，不由连接半径决定。','机关纹样 = 桥的纹样；断桥后，小兽也过不去。'),
 entry('radius','世界规则','让节点相遇','增大连接范围，虚线之间的几何道路才会出现。',art('<circle cx="-20" r="23" fill="#b2bfa5" fill-opacity=".12" stroke="#889782"/><circle cx="20" r="23" fill="#b2bfa5" fill-opacity=".12" stroke="#889782"/><path d="M-20 0H20" stroke="#879581" stroke-width="4"/><circle cx="-20" r="4" fill="#7a684d"/><circle cx="20" r="4" fill="#7a684d"/>'),'d(i,j) ≤ r 时连接。图中的每个圆半径为 r/2；两个圆相遇，恰好满足真实距离阈值。机关桥不使用这条规则。'),
 entry('pieces','世界规则','空白地面可以建路','选碎片，点普通空白地面放下。再点旋转，也可收回或交换；上面有角色时不能改。',pieceIcon({rotation:0},{shape:'corner',color:'clay'}),'碎片的四边端口改变原始图。相邻两端同时开放才有边；不是编号匹配。'),
 entry('topologies','世界规则','四种边界，同一张地图','相同边缘标记互相连接；墙和断路仍然不能穿过。','', 'Plane 不粘合；Cylinder 识别左右同向边界；Möbius 识别左右并反转行序；Torus 在两个独立方向识别周期边界。'),
 entry('player','世界居民','小旅人','方向键 / WASD / 滑动移动，每次有效操作走一回合。',art(playerArt())),
 entry('hunter-sleep','世界居民','睡着的小兽','闭着眼睛时不会追击；靠近警戒范围或拿钥匙可能惊醒它。',art(hunterArt(false))),
 entry('hunter-awake','世界居民','醒来的小兽','睁眼后每有效回合追一步；棕色箭头是原地等待后它会到的位置。',art(hunterArt(true)),'每回合在当前原始图上重新 BFS 寻路；没有路径就停留。','换空间、修路、等待，也会推进追击。'),
 entry('shadow','世界居民','道路之间的影子','影子走格子角点的紫线；你接通的路，会挡住交叉的紫线。',art('<path d="M-50 0H50" stroke="#795c85" stroke-width="3"/>'+shadowArt()),'原始边开放时，对应交叉对偶边关闭。Shadow 只能沿真实开放的对偶边移动。'),
 entry('trap','世界居民','裂痕地板','影子所在角点旁的四格会危险；回合结束时仍在裂痕上就会失败。',pair(trapArt(),'<path d="M0-12 11 0 0 12-11 0Z" fill="none" stroke="#96799b" stroke-width="2"/>'),'危险区由对偶角点几何相邻的四个玩家格确定；周期边界使用同一坐标规则。','裂痕 = 当前危险；空心菱形 = 下一回合新增危险。'),
 entry('wait','世界居民','等一回合','点等待或按 Space，原地观察小兽和影子的下一步。',art('<circle r="19" fill="none" stroke="#8d8068" stroke-width="2"/><path d="M0-12V0l8 5" fill="none" stroke="#8d8068" stroke-width="2"/>')),
 entry('key','能量与机关','钥匙与门','金色钥匙打开栅门；有些小兽也会被取钥匙的动静惊醒。',pair(keyArt(),doorArt())),
 entry('lamp','能量与机关','灯与黑暗地板','紫线短路会立刻熄灯；安全供能后还要保持充能两回合。',pair(lampArt(true),lampArt(false)),'Shadow 与灯的对偶节点连通时立即短路。灯光是当前供能、启动、充能与短路状态的结果，不会永久锁定。'),
 entry('energy','能量与机关','稳定，与流失','灯下三小格是储能：安全供能会补充；短路或断供每回合减少一格。',pair(lampArt(true)+energyArt(3),lampArt(false)+energyArt(1,true)),'点亮需要已启动、当前供能连通、无短路，并连续充能两回合。解除短路本身不会启动能源。'),
 entry('ignite','能量与机关','亲手点火','金色源点到灯需要实际道路，再踩火纹地板启动；黑暗格必须有灯才安全。',pair(controlArt('ignite'),lampArt(true)),'能源源点和接收格在当前原始图上连通才有供能。短路优先于其他灯状态。'),
 entry('rift','世界规则','走进另一层','到双色菱形，点双界或按 E；只有裂隙能来回切换。',art(riftArt()),'每个裂隙显式指定一个原始格中心与一个真实对偶角点。普通物品和终点只存在于普通世界。','道路世界走格子中心；紫色世界走格子角点。另一侧不安全时无法切换。'),
 entry('voronoi','世界规则','最近的控制点','地面分区属于最近的控制点；踩同色箭头，远处房间转九十度。',pair(controlArt('room','#78939c'),controlArt('room','#b18065',-1)),'Voronoi：Rᵢ = {x : d(x,sᵢ) ≤ d(x,sⱼ)}。本游戏以实际欧氏距离计算各格归属，相等时按配置顺序。旋转是确定的端口与房间地板变换。','蓝箭头顺时针，橙箭头逆时针；房间里有人时拒绝旋转。'),
 entry('star','能量与机关','星片','星片从开始就可见；普通世界走到它上面即可拾取，不影响普通通关。',art(`<path d="${starPath}" fill="#e9b54e" stroke="#ad7f32"/>`)),
 entry('math-geometry','数学秘密','连接半径','连接范围只改变几何节点的距离阈值。',art('<path d="M-35 0H35" stroke="#879581" stroke-width="3"/><circle cx="-35" r="5" fill="#879581"/><circle cx="35" r="5" fill="#879581"/>'),'固定种子的微小几何扰动给出节点坐标；r 增大时边单调加入，形成 scale filtration。'),
 entry('math-dual','数学秘密','一条路，两种作用','在道路上修通一条边，会关闭与它相交的裂隙。',art('<path d="M-40 0H40" stroke="#c5a56e" stroke-width="8"/><path d="M0-27v18M0 9v18" stroke="#85658e" stroke-width="3"/>'),'对偶节点在面/角点；原始边与交叉对偶边互补。周期边界同样参与建图，不能把环面的非收缩环当作平面围墙。'),
 entry('math-components','数学秘密','连通分支与环','同一片相通道路中的居民，才能沿路到达彼此。',art(floorArt()),'BFS 测试图中的实际连通性。一次桥梁切换、拼图旋转或周期边界变化都可能改变连通分支；这里没有独立随机渗流机关。'),
];
export function observeDiscoveries(level,state,action=null){
 const ids=['road','player','star'];
 if(level.bridges.length)ids.push('bridge');if(level.radiusLinks.length)ids.push('radius');if(level.pieces.length)ids.push('pieces');if(level.modes.length>1||state.topology!=='plane')ids.push('topologies');
 if(state.hunters.length)ids.push(state.hunterAwake?'hunter-awake':'hunter-sleep','wait');if(level.map.some(r=>r.includes('K')||r.includes('D')))ids.push('key');
 if(state.shadows.length)ids.push('shadow','trap','wait');if(level.circuit)ids.push('lamp','energy');if(level.controls.some(c=>c.kind==='ignite'))ids.push('ignite');if(level.rifts.length)ids.push('rift');if(level.territories.length)ids.push('voronoi');
 if(action?.type==='scale')ids.push('math-geometry');if(['place','remove','rotate','move'].includes(action?.type))ids.push('math-components');if(state.shadows.length&&['place','rotate','scale','move'].includes(action?.type))ids.push('math-dual');
 return [...new Set(ids)];
}
export const introducedLessons=level=>lessons.filter(l=>observeDiscoveries(level,{hunters:level.map.some(r=>r.includes('M'))?[{}]:[],shadows:level.shadow?[{}]:[],topology:level.initialTopology}).includes(l.id));
export const referenceLessons=(level,progress)=>lessons.filter(l=>(progress?.discoveries??[]).includes(l.id));
export const pendingLessons=(level,progress)=>referenceLessons(level,progress).filter(l=>!progress.seenTips.includes(`notebook-v5:${l.id}`));
const topologyArt=()=>`<div class="topology-reference">${[['plane','Plane','不连接'],['cylinder','Cylinder','左右同向'],['mobius','Möbius','左右反序'],['torus','Torus','左右＋上下']].map(([id,name,rule])=>`<div>${icon(id)}<b>${name}</b><small>${rule}</small></div>`).join('')}</div>`;
export const lessonCards=cards=>cards.map(l=>`<article class="rule-card">${l.id==='topologies'?topologyArt():l.art}<h3>${l.title}</h3><p>${l.text}</p>${l.example?`<small>${l.example}</small>`:''}${l.math?`<details><summary>数学原理</summary><p>${l.math}</p></details>`:''}</article>`).join('');
export const notebookCards=(level,progress)=>['世界规则','世界居民','能量与机关','数学秘密'].map(category=>{const cards=referenceLessons(level,progress).filter(l=>l.category===category);return `<section><h3>${category}</h3>${cards.length?lessonCards(cards):'<p class="dialog-note">继续探索，再记录这一页。</p>'}</section>`;}).join('');
