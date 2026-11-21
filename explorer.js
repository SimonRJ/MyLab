(() => {
'use strict';
const D=window.ATLAS,main=document.getElementById('main');
const list={world:D.worlds,ship:D.ships,character:D.characters,event:D.events,site:D.sites,route:D.routes,story:D.stories,lore:D.lore};
const names=['','Children of Time','Children of Ruin','Children of Memory'];
const numerals=['','I','II','III'];
const worldOrder=['kerns','damascus','nod','imir','rourke','earth','moon','ruins'];
const surveys={
  kerns:['Portiid cradle','A forest world prepared for primates becomes the home of the Portiids. In its canopy, the first threads of a civilization take hold.'],
  damascus:['Ocean world','Under an alien sky, octopuses inherit an ocean reshaped by Disra Senkovi. Their descendants carry its waters into orbit.'],
  nod:['Native biosphere','The terraformers arrive expecting to make a world habitable. In the salt marshes of Nod, life has already found its own way.'],
  imir:['Ark destination','The trail of the Enkidu ends above Imir. On the surface, a child remembers a settlement whose history refuses to stay in order.'],
  rourke:['Corvid habitat','On a world marked by a failed human venture, two corvids raise a difficult question. Where does a mind begin and end?'],
  earth:['Human origin','The ruins of one spacefaring civilization become the inheritance of another. As Earth fails, the ark ships follow maps drawn by the dead.'],
  moon:['Colony moon','Turned away from the green planet, the crew of Gilgamesh must judge whether a far less hospitable moon can sustain a colony.'],
  ruins:['Salvage site','An abandoned installation offers the crew of Gilgamesh a rare chance to recover the technology of their predecessors.']
};
const navigation={world:'orbit',ship:'fleet',character:'people',event:'chronology'};
const plural={world:'worlds',ship:'ships',character:'characters',event:'timeline',site:'sites',route:'routes',story:'stories',lore:'lore'};
const label={world:'Destination',ship:'Spacecraft / installation',character:'Character',event:'Event',site:'Location',route:'Journey',story:'Storyline',lore:'Field guide'};
const glyphs={search:'<circle cx="10" cy="10" r="6.5"/><path d="m15 15 5 5"/>',map:'<circle cx="6" cy="15" r="2"/><circle cx="17" cy="6" r="2"/><circle cx="19" cy="17" r="2"/><path d="m7.5 13.5 8-6m2.2.8 1.1 6.6m-11 1 9 1"/>',globe:'<circle cx="12" cy="12" r="8.5"/><ellipse cx="12" cy="12" rx="4.2" ry="8.5"/><path d="M4 9h16M4 15h16"/>',orbit:'<circle cx="12" cy="12" r="6.2"/><ellipse cx="12" cy="12" rx="11" ry="4" transform="rotate(-32 12 12)"/>',left:'<path d="m14.5 5-7 7 7 7"/>',right:'<path d="m9.5 5 7 7-7 7"/>',plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',rotate:'<path d="M5 10a7 7 0 1 1 .9 7M4 4.5V10h5.5"/>',ship:'<path d="m12 2 8 18-8-4-8 4zM12 2v14"/>',person:'<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c.6-4 3.1-6 7.5-6s6.9 2 7.5 6"/>',time:'<circle cx="12" cy="12" r="8.5"/><path d="M12 6v6l4 2"/>',book:'<path d="M12 6C9 3.5 5 3.5 2 4v14c4-.6 7 0 10 2 3-2 6-2.6 10-2V4c-3-.5-7-.5-10 2v14"/>',cross:'<path d="M3 12h5m8 0h5M12 3v5m0 8v5"/><circle cx="12" cy="12" r="5.5"/>'};
function icon(k){return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(glyphs[k]||'')+'</svg>';}
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=(t,id)=>list[t]?.find(o=>o.id===id);
const title=o=>o.name||o.title;
const books=o=>o.books||[o.book];
const bookText=o=>(books(o).length===1?'Book ':'Books ')+books(o).map(n=>numerals[n]).join(' · ');
const related=(field,id)=>D.events.filter(e=>(e[field]||[]).includes(id));
function href(type,id){return navigation[type]?'#/'+navigation[type]+'/'+id:'reader.html#/'+plural[type]+'/'+type+'/'+id;}
function chip(type,id){const o=get(type,id);return o?'<a class="chip" href="'+href(type,id)+'">'+esc(title(o))+'</a>':'';}
function group(heading,type,ids){const links=[...new Set(ids||[])].map(id=>chip(type,id)).join('');return links?'<div class="group"><h3>'+esc(heading)+'</h3><div class="chips">'+links+'</div></div>':'';}
const btn=(url,text,g,cls='quietBtn')=>'<a class="'+cls+'" href="'+url+'">'+icon(g)+esc(text)+'</a>';
const meta=t=>'<span class="meta">'+esc(t)+'</span>';
function getArt(t,o){return t==='world'?'media/'+o.id+'-disc.webp':o.image;}
let viewer=null;
let savedFocus=null;
const filters={fleet:{q:'',book:'',kind:''},people:{q:'',book:'',kind:''},chronology:{q:'',book:'',kind:''}};
const realName={physical:'Physical history',simulated:'Simulated history',boundary:'Across realities'};
function routesArt(){return '<svg class="orbits" aria-hidden="true" viewBox="0 0 700 470" preserveAspectRatio="xMidYMid meet"><g fill="none" stroke="currentColor" stroke-width=".8"><ellipse cx="350" cy="237" rx="298" ry="119" transform="rotate(-23 350 237)" opacity=".6"/><ellipse cx="350" cy="237" rx="288" ry="118" transform="rotate(38 350 237)" opacity=".27" stroke-dasharray="3 7"/><circle cx="350" cy="235" r="198" stroke-dasharray="1 9" opacity=".4"/><path d="M74 228h12m-6-6v12m539 9h10m-5-5v10"/></g><g fill="#d5be8a"><circle cx="122" cy="379" r="2.5"/><circle cx="555" cy="87" r="2.5"/></g></svg>';}
const localCraft={kerns:'flask',earth:'gilgamesh',moon:'gilgamesh',ruins:'gilgamesh',damascus:'mirrors',nod:'lightfoot',rourke:'phoenix',imir:'enkidu'};
function sight(o){const craft=get('ship',localCraft[o.id]);return '<a class="sight" href="'+href('ship',craft.id)+'"><small>ASSOCIATED CRAFT</small>'+esc(craft.name)+'</a>';}
function stage(type,o){const planet=type==='world';return '<div class="stage">'+routesArt()+(planet?sight(o):'')+'<img class="disc" alt="" src="'+esc(getArt(type,o))+'"><canvas class="'+(planet?'globe':'shipCanvas')+'" tabindex="0" aria-label="Rotate '+esc(title(o))+' in 3D. Drag or use the arrow keys."></canvas><span class="caption">'+icon('orbit')+'Drag to rotate</span><div class="controls">'+[['rotate','Rotate view','turn'],['minus','Zoom out','out'],['plus','Zoom in','in'],['cross','Reset view','reset']].map(([g,n,a])=>'<button class="iconBtn" title="'+n+'" aria-label="'+n+'" data-camera="'+a+'">'+icon(g)+'</button>').join('')+'</div></div>';}
function attachViewer(t,o){
 const canvas=main.querySelector('canvas'),poster=main.querySelector('.disc');if(!canvas)return;
 if(t==='world'&&o.id!=='ruins')viewer=window.mountGlobe(canvas,o.id,poster);
 else{viewer=window.mountVessel(canvas,o.id);if(viewer)poster.style.visibility='hidden';}
 if(!viewer)return;
 let point=null,mode='';
 canvas.onpointerdown=e=>{if(e.button!==0)return;point=[e.clientX,e.clientY];mode=e.pointerType==='touch'?'pending':'drag';if(mode==='drag')canvas.setPointerCapture(e.pointerId);};
 canvas.onpointermove=e=>{if(!point)return;const dx=e.clientX-point[0],dy=e.clientY-point[1];if(mode==='pending'){if(Math.max(Math.abs(dx),Math.abs(dy))<4)return;if(Math.abs(dy)>Math.abs(dx)){point=null;return;}mode='drag';canvas.setPointerCapture(e.pointerId);}viewer.rotate(dx,dy);point=[e.clientX,e.clientY];};
 canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=()=>{point=null;};
 
 canvas.onkeydown=e=>{const d={ArrowLeft:[-24,0],ArrowRight:[24,0],ArrowUp:[0,-15],ArrowDown:[0,15]}[e.key];if(d){e.preventDefault();viewer.rotate(...d);}};
 main.querySelectorAll('[data-camera]').forEach(b=>b.onclick=()=>{const k=b.dataset.camera;if(k==='turn')viewer.rotate(65,0);else if(k==='reset')viewer.reset();else viewer.zoom(k==='in'?1.14:1/1.14);});
}
function destinations(active){return '<section class="section"><div class="sectionHead"><h2>Destination index</h2><div class="stripControl"><a class="headLink" href="#/chart">'+icon('map')+' Open star chart</a><button data-strip="-1" class="iconBtn" aria-label="Previous destinations">'+icon('left')+'</button><button data-strip="1" class="iconBtn" aria-label="More destinations">'+icon('right')+'</button></div></div><div class="strip" aria-label="Select a destination">'+worldOrder.map(id=>{const w=get('world',id);return '<a class="dest '+(id===active?'active':'')+'" '+(id===active?'aria-current="true"':'')+' href="#/orbit/'+id+'"><img src="media/'+id+'-disc.webp" alt="" loading="lazy">'+(id===active?'<span class="activeMark">IN VIEW</span>':'')+'<span class="micro">Book '+numerals[books(w)[0]]+'</span><strong>'+esc(w.name)+'</strong></a>';}).join('')+'</div></section>';}
function portals(){return '<section class="section"><div class="sectionHead"><h2>Explore the archive</h2></div><div class="browseCards">'+[['fleet','ship','Spacecraft',D.ships.length+' vessels and installations'],['people','person','Characters',D.characters.length+' linked dossiers'],['chronology','time','Timeline',D.events.length+' events across three books']].map(([r,g,n,s])=>'<a href="#/'+r+'" class="portal">'+icon(g)+'<span><strong>'+n+'</strong><small>'+s+'</small></span>'+icon('right')+'</a>').join('')+'</div></section>';}
function hero(t,o){
 const w=t==='world',name=title(o),featured=w&&o.id==='kerns'?'Kern’s <em>World</em>':esc(name);
 return '<section class="hero"><div class="heroInner"><div class="heroCopy">'+(!w?'<a class="breadcrumb" href="#/fleet">'+icon('left')+'Spacecraft index</a>':'')+'<span class="tag">'+(w?'Orbital explorer':'Vessel inspection')+' &nbsp;/&nbsp; Book '+numerals[books(o)[0]]+'</span><h1>'+featured+'</h1><p>'+esc(w?surveys[o.id][1]:o.kind)+'</p><div class="actions">'+(w?btn('#/survey/'+o.id,'Explore '+(o.id==='ruins'?'site':o.id==='moon'?'moon':'world'),'globe','primary')+btn('#/chart','Star chart','map'):btn('#ship-record','Open ship record','book','primary')+btn(href('world',o.where),'Visit destination','globe'))+'</div></div>'+stage(t,o)+'</div></section>';
}
function back(url,text){return '<a class="breadcrumb" href="'+url+'">'+icon('left')+esc(text)+'</a>';}

function block(title,body){return '<section><h2>'+esc(title)+'</h2>'+body+'</section>';}
function p(s){return s?'<p>'+esc(s)+'</p>':'';}
function sourceNotes(o){
 const references=(o.sourceIds||[]).map(id=>D.sources.find(s=>s.id===id)).filter(Boolean).map(s=>({label:s.title,url:s.url}));
 for(const r of o.life?.refs||[])if(!references.some(x=>x.label===r.label))references.push(r);
 return references.length?'<div class="group"><h3>Sources &amp; chapters</h3><ul class="sourceList">'+references.map(r=>'<li>'+(r.url?'<a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">'+esc(r.label)+'</a>':esc(r.label))+'</li>').join('')+'</ul></div>':'';
}
function lifeRecord(o){if(!o.life)return '';const fields=[['age','Age'],['birth','Birth date'],['size','Stature or scale'],['parents','Parents or origin'],['children','Children'],['family','Relationships'],['fate','Last known fate']];return block('Life record','<dl class="lifeRecord">'+fields.map(([k,n])=>'<dt>'+n+'</dt><dd>'+esc(o.life[k])+'</dd>').join('')+'</dl>');}
function ref(t,o){return sourceNotes(o)+'<div class="group">'+btn('reader.html#/'+plural[t]+'/'+t+'/'+o.id,'Open reference entry','book')+'</div>';}
function eventsPanel(events){return events.length?block('Connected events','<div class="eventList">'+events.map(eventRow).join('')+'</div>'):'';}
function eventRow(e){return '<a class="entryRow" href="'+href('event',e.id)+'"><span class="bookLabel">BOOK '+numerals[e.book]+' · '+esc(e.type.toUpperCase())+'</span><span><strong>'+esc(e.title)+'</strong><br><small>'+esc(e.era)+' · '+esc(realName[e.reality]||e.reality)+'</small></span>'+icon('right')+'</a>';}
function worldSurvey(o){
 const events=related('worlds',o.id), sites=D.sites.filter(s=>s.world===o.id);
 return '<div class="pageHead">'+back(href('world',o.id),'Return to orbit')+'<div class="profileHead"><div><span class="tag">Destination dossier · '+bookText(o)+'</span><h1>'+esc(o.name)+'</h1><p>'+esc(o.subtitle)+'</p></div><img class="surveyDisc" src="'+getArt('world',o)+'" alt="Interpretive orbital view of '+esc(o.name)+'"></div></div><div class="section detailGrid"><div class="detailBody">'+block(o.id==='ruins'?'Station record':'Planetary record',p(o.bio)+p(o.note))+group('Locations on record','site',sites.map(s=>s.id))+eventsPanel(events)+'</div><aside class="sidebox"><h2>In this orbit</h2>'+group('Associated spacecraft','ship',D.ships.filter(s=>s.where===o.id||events.some(e=>e.ships.includes(s.id))).map(s=>s.id))+group('Associated characters','character',D.characters.filter(c=>c.home===o.id).map(c=>c.id))+group('Journeys','route',D.routes.filter(r=>r.route.includes(o.id)).map(r=>r.id))+ref('world',o)+'<p class="graphicNote">Surface details and map positions are artistic interpretations.</p></aside></div>';
}
function shipRecord(o){
 const events=related('ships',o.id);
 return '<div class="section detailGrid" id="ship-record"><div class="detailBody">'+block('Vessel record',p(o.bio))+eventsPanel(events)+'</div><aside class="sidebox"><h2>Flight record</h2>'+group('Associated world','world',[o.where])+group('People and intelligences','character',o.links)+group('Journeys','route',D.routes.filter(r=>r.ship===o.id).map(r=>r.id))+ref('ship',o)+'<p class="graphicNote">The 3D model interprets the craft’s role. Hull geometry and proportions are illustrative.</p></aside></div>';
}
function detail(t,o){
 const char=t==='character',name=title(o);
 const hd='<div class="pageHead">'+back(char?'#/people':'#/chronology',char?'Character index':'Timeline')+'<div class="profileHead"><div><span class="tag">'+label[t]+' dossier · '+bookText(o)+'</span><h1>'+esc(name)+'</h1><p>'+esc(char?o.role:o.era+' · '+realName[o.reality])+'</p></div>'+(char?'<figure class="profileArt"><img src="'+esc(o.image)+'" alt="Illustrative portrait for '+esc(name)+'"><figcaption>'+(['media/portrait-octopus.webp','media/portrait-portiid.webp'].includes(o.image)?'Representative species study':'Artist’s interpretation')+'</figcaption></figure>':'')+'</div></div>';
 return hd+'<div class="section detailGrid"><div class="detailBody">'+block(char?'Biography':'Event record',p(char?o.bio:o.detail))+(char?lifeRecord(o):'')+(char?eventsPanel(related('characters',o.id)):'')+'</div><aside class="sidebox"><h2>'+(char?'Identity record':'In this event')+'</h2>'+(char?p(o.species)+p(o.identity)+p(o.notes)+group('Associated world','world',[o.home])+group('Connections','character',o.links)+group('Spacecraft','ship',D.ships.filter(s=>s.links.includes(o.id)).map(s=>s.id)):group('Worlds','world',o.worlds)+group('Spacecraft','ship',o.ships)+group('Characters','character',o.characters)+group('Locations','site',o.sites))+ref(t,o)+'</aside></div>';
}
const catalogInfo={fleet:['ship','Spacecraft','Inspect the ark ships, orbital installations and living technologies that carry the story between worlds.'],people:['character','Character index','Follow a life, a lineage or an instance of a mind through the worlds and events that shaped it.'],chronology:['event','Trilogy timeline','Trace the three novels by era. Imir’s physical history and its simulated histories are marked separately.']};
function species(o){const s=o.species.toLowerCase();return s.includes('portiid')?'Portiids':s.includes('octopus')?'Octopuses':s.includes('corvid')?'Corvids':s.includes('nodan')?'Nodan':s.includes('human')?'Human / human-derived':'Other intelligences';}
function options(entries,sel){return entries.map(([v,n])=>'<option value="'+esc(v)+'" '+(sel===v?'selected':'')+'>'+esc(n)+'</option>').join('');}
function catalog(view){
 const [t,n,desc]=catalogInfo[view],f=filters[view],kinds=view==='people'?[...new Set(D.characters.map(species))].sort().map(k=>[k,k]):Object.entries(realName);
 return '<div class="pageHead"><span class="tag">Trilogy archive</span><h1>'+n+'</h1><p>'+desc+'</p></div><section class="section"><div class="filterBar"><input id="filterQ" type="search" placeholder="Filter '+(t==='event'?'events':view==='fleet'?'spacecraft':'characters')+'" aria-label="Filter records by text" value="'+esc(f.q)+'"><label>Book <select id="filterBook">'+options([['','All three'],...names.slice(1).map((b,i)=>[String(i+1),b])],f.book)+'</select></label>'+(view!=='fleet'?'<label>'+(view==='people'?'Group':'History')+' <select id="filterKind">'+options([['','All'],...kinds],f.kind)+'</select></label>':'')+'<span id="count" class="count" aria-live="polite"></span></div><div id="catalogResults"></div></section>';
}
function listCatalog(view){
 const f=filters[view],t=catalogInfo[view][0],items=list[t].filter(o=>(!f.book||books(o).includes(Number(f.book)))&&(!f.kind||(t==='event'?o.reality:species(o))===f.kind)&&[title(o),o.role,o.kind,o.era,o.species,o.bio,o.detail].filter(Boolean).join(' ').toLowerCase().includes(f.q.toLowerCase().trim()));
 document.getElementById('count').textContent=items.length+(items.length===1?' record':' records');
 const target=document.getElementById('catalogResults');target.className=t==='event'?'eventList':'grid';target.innerHTML=items.length?items.map(o=>t==='event'?eventRow(o):'<a class="record '+(t==='ship'?'shipcard':'')+'" href="'+href(t,o.id)+'"><img loading="lazy" alt="" src="'+esc(o.image)+'"><div class="recordInfo">'+meta(bookText(o))+'<strong>'+esc(title(o))+'</strong><small>'+esc(o.kind||o.role)+'</small></div></a>').join(''):'<p class="empty">No matching records. Try another name or book.</p>';
}
const chartPositions={earth:[65,183],kerns:[269,120],moon:[162,280],ruins:[145,54],nod:[426,84],damascus:[453,216],rourke:[310,300],imir:[596,144]};
function chart(){
 return '<div class="pageHead"><span class="tag">Orbital navigation</span><h1>Star chart</h1><p>Select a destination to enter orbit, or trace a journey from the novels.</p></div><section class="section"><div class="filterBar"><label>Journey <select id="journey">'+options([['','All journeys'],...D.routes.map(r=>[r.id,r.title])],'')+'</select></label></div><div class="chartWrap" id="starChart"></div><div class="chartFooter"><p class="graphicNote">Schematic routes. Positions, distances and sizes are illustrative.</p><a class="headLink" href="reader.html#/routes">Journey records '+icon('book')+'</a></div><div class="worldLinks">'+worldOrder.map(id=>chip('world',id)).join('')+'</div></section>';
}
function drawChart(){
 const id=document.getElementById('journey').value, journeys=id?D.routes.filter(r=>r.id===id):D.routes;
 const segs=new Set(),lines=[];
 for(const r of journeys){for(let i=1;i<r.route.length;i++){const a=r.route[i-1],b=r.route[i],k=[a,b].sort().join('/');if(a===b||segs.has(k)||!chartPositions[a]||!chartPositions[b])continue;segs.add(k);const [x1,y1]=chartPositions[a],[x2,y2]=chartPositions[b];lines.push('<path d="M'+x1+' '+y1+' Q'+((x1+x2)/2)+' '+((y1+y2)/2-42)+' '+x2+' '+y2+'" fill="none" stroke="'+(id?'#e4c38a':'#73978b')+'" stroke-dasharray="4 5" stroke-width="'+(id?2:1.2)+'"/>');}}
 const nodes=worldOrder.map(k=>{const [x,y]=chartPositions[k],w=get('world',k),name=k==='moon'?'Colony moon':k==='ruins'?'Salvage site':w.name;
 return '<a class="chartNode" href="#/orbit/'+k+'" aria-label="Enter orbit around '+esc(w.name)+'"><title>'+esc(w.name)+'</title><circle cx="'+x+'" cy="'+y+'" r="26" fill="#101c17" stroke="#527262"/><image href="media/'+k+'-disc.webp" x="'+(x-29)+'" y="'+(y-29)+'" width="58" height="58"/><text x="'+x+'" y="'+(y+40)+'" text-anchor="middle">'+esc(name)+'</text></a>';}).join('');
 const r=journeys[0];document.getElementById('starChart').innerHTML='<svg viewBox="0 0 660 365" role="group" aria-label="Selectable destinations and schematic travel routes">'+lines.join('')+nodes+'</svg>'+(id?'<div class="journeyInfo"><strong>'+esc(r.title)+'</strong>'+p(r.description)+'<div class="chips">'+r.route.filter(k=>get('world',k)).map(k=>chip('world',k)).join('')+'</div></div>':'');
}
function render(){
 viewer?.destroy();viewer=null;
 const raw=location.hash.slice(1).replace(/^\//,'').split('/');let [view,id]=raw;view=view||'orbit';
 // Preserve earlier shared links to the book-by-book atlas and its named records.
 if(['atlas','characters','timeline','worlds','ships','sites','stories','routes','conflicts','lore','author','refresher','audit','sources','search'].includes(view)){location.replace('reader.html'+location.hash);return;}
 const nav=({survey:'orbit',chart:'orbit'})[view]||view;
 document.querySelectorAll('nav a').forEach(a=>{if(a.dataset.nav===nav)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 let name,markup,after;
 if(view==='orbit'||view==='survey'){const o=get('world',id||'kerns');if(o){name=o.name;markup=view==='survey'?worldSurvey(o):hero('world',o)+destinations(o.id)+portals();if(view==='orbit')after=()=>{attachViewer('world',o);const active=main.querySelector('.dest.active'),strip=active.parentElement;strip.scrollLeft=active.offsetLeft-strip.offsetLeft-10;const buttons=main.querySelectorAll('[data-strip]');const sync=()=>buttons.forEach(b=>b.disabled=b.dataset.strip==='-1'?strip.scrollLeft<2:strip.scrollLeft+strip.clientWidth>=strip.scrollWidth-2);buttons.forEach(b=>b.onclick=()=>strip.scrollBy({left:Number(b.dataset.strip)*strip.clientWidth*.72,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));strip.onscroll=sync;sync();};}}
 else if(view==='chart'){name='Star chart';markup=chart();after=()=>{drawChart();document.getElementById('journey').onchange=drawChart;};}
 else if(catalogInfo[view]){
   const t=catalogInfo[view][0],o=get(t,id);
   if(!id){name=catalogInfo[view][1];markup=catalog(view);after=()=>{listCatalog(view);[['filterQ','q'],['filterBook','book'],['filterKind','kind']].forEach(([key,field])=>{const el=document.getElementById(key);if(el)el.addEventListener(key==='filterQ'?'input':'change',()=>{filters[view][field]=el.value;listCatalog(view);});});};}
   else if(o){name=title(o);markup=t==='ship'?hero(t,o)+shipRecord(o):detail(t,o);if(t==='ship')after=()=>{attachViewer(t,o);const link=main.querySelector('[href="#ship-record"]');link.onclick=e=>{e.preventDefault();document.getElementById('ship-record').scrollIntoView();};};}
 }
 if(markup===undefined){name='Unknown destination';markup='<div class="pageHead"><h1>Unknown destination</h1><p>This link does not match an atlas record.</p>'+btn('#/orbit/kerns','Return to explorer','orbit')+'</div>';}
 main.innerHTML=markup;document.title=name+' · Children of Time Atlas';after?.();window.scrollTo(0,0);
}
const search=document.getElementById('searchDialog'),lookup=document.getElementById('lookup'),results=document.getElementById('results');
function searchResults(){
 const q=lookup.value.trim().toLowerCase();if(!q){results.innerHTML='<p>Search by name, place, vessel or event.</p>';return;}
 const matches=[];for(const [t,entries] of Object.entries(list))for(const o of entries){const name=title(o).toLowerCase();const score=name===q?5:name.startsWith(q)?4:name.includes(q)?3:[o.bio,o.detail,o.role,o.kind,o.description].filter(Boolean).join(' ').toLowerCase().includes(q)?1:0;if(score)matches.push({o,t,score});}
 matches.sort((a,b)=>b.score-a.score||title(a.o).localeCompare(title(b.o)));results.innerHTML=matches.length?matches.slice(0,40).map(({o,t})=>'<a href="'+href(t,o.id)+'"><small>'+esc(label[t])+'</small>'+esc(title(o))+'</a>').join(''):'<p>No matching entries.</p>';
}
function openSearch(){savedFocus=document.activeElement;search.showModal();lookup.value='';searchResults();lookup.focus();}
document.querySelector('.skip').onclick=e=>{e.preventDefault();main.focus();main.scrollIntoView();};
document.getElementById('searchOpen').onclick=openSearch;lookup.oninput=searchResults;results.onclick=e=>{if(e.target.closest('a'))search.close();};search.addEventListener('close',()=>savedFocus?.focus({preventScroll:true}));
document.addEventListener('keydown',e=>{if(e.key==='/'&&!search.open&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){e.preventDefault();openSearch();}});
window.addEventListener('hashchange',()=>{if(search.open)search.close();render();main.focus({preventScroll:true});});
render();
})();
