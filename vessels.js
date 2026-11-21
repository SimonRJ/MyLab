/* Original interpretive spacecraft models. Coordinates serve illustration only. */
(() => {
  'use strict';

  const TAU = 2 * Math.PI;
  const palette = {
    shell: [173, 191, 189], pale: [218, 218, 192], steel: [91, 117, 128],
    dark: [53, 75, 83], gold: [198, 152, 83], copper: [186, 119, 74],
    foil: [207, 185, 128], violet: [133, 140, 193], panel: [67, 115, 143],
    ocean: [43, 144, 158], ice: [144, 211, 213], silk: [175, 215, 203],
    glass: [63, 135, 156], lamp: [137, 243, 231], warm: [255, 203, 133]
  };
  const add = (a, b) => a.map((v, i) => v + b[i]);
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const times = (a, factor) => a.map(v => v * factor);
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const norm = a => times(a, 1 / (Math.hypot(...a) || 1));
  const radial = (x, r, angle) => [x, r*Math.cos(angle), r*Math.sin(angle)];
  const clamp = (v, low, high) => Math.max(low, Math.min(high, v));

  function modelFor(id) {
    const shapes = [];
    const face = (points, mat, emission = false) => {
      const normal = norm(cross(sub(points[1],points[0]), sub(points[2],points[0])));
      shapes.push({points, normal, mat, emission});
    };
    const line = (start, end, mat, width = 1) => shapes.push({points:[start,end], mat, width});

    function bridge(a, b, mat) {
      for(let i=0; i<a.length; i++) {
        const j = (i+1) % a.length;
        face([a[i],a[j],b[j],b[i]],mat);
      }
    }

    // Sections are [longitudinal position, vertical radius, optional beam radius].
    function hull(pos, sections, mat, sides = 16, stripe = []) {
      let last;
      sections.forEach(([x, ry, rz = ry], i) => {
        const ring = Array.from({length:sides}, (_, k) => {
          const a = TAU*(k + .5)/sides;
          return add(pos, [x,ry*Math.cos(a),rz*Math.sin(a)]);
        });
        if(last) bridge(last,ring,stripe[i-1] || mat);
        else face(ring,mat);
        if(i === sections.length - 1) face(ring.slice().reverse(),mat);
        last = ring;
      });
    }
    function beam(a,b,r,mat,n=7) {
      const axis = norm(sub(b,a));
      const p = norm(cross(axis, Math.abs(axis[1])>.9 ? [1,0,0] : [0,1,0]));
      const q = cross(axis,p);
      const circleAt = v => Array.from({length:n},(_,i)=>add(v,add(times(p,r*Math.cos(TAU*i/n)),times(q,r*Math.sin(TAU*i/n)))));
      const first=circleAt(a), second=circleAt(b);
      bridge(first,second,mat); face(first,mat); face(second,mat);
    }
    function pod(pos,len,r,mat,rz=r) {
      hull(pos,[[-.5*len,.26*r,.26*rz],[-.39*len,.78*r,.78*rz],[-.24*len,r,rz],[.25*len,r,rz],[.41*len,.74*r,.74*rz],[.5*len,.21*r,.21*rz]],mat,12);
    }
    function collar(pos,r,thickness,mat,rz=r) {
      hull(pos,[[-thickness/2,r,rz],[thickness/2,r,rz]],mat);
    }
    function halo(x,r,t,mat,n=24) {
      const points = Array.from({length:n},(_,i)=>radial(x,r,TAU*i/n));
      for(let i=0;i<n;i++) beam(points[i],points[(i+1)%n],t,mat,5);
    }
    function engine(pos,r) {
      hull(pos,[[-.28,r],[-.19,r*.98],[0,r*.63],[.15,r*.67]],'dark',12,['steel','dark','copper']);
      const aperture=[pos[0]-.281,pos[1],pos[2]];
      const inner=Array.from({length:12},(_,i)=>add(aperture,radial(0,r*.67,i*TAU/12)));
      face(inner,'lamp',true);
    }
    function radiator(x,span,width,tilt=0,mat='panel') {
      for(const sign of [-1,1]) {
        const anchor=[x,0,sign*.17];
        const vecRise=k=>[0,k*Math.sin(tilt),sign*k*Math.cos(tilt)];
        const at=(along,k)=>add(add(anchor,vecRise(k)),[along,0,0]);
        beam(anchor,at(0,span),.035,'foil');
        for(let j=0;j<6;j++) {
          const k1=.22+j*(span-.22)/6, k2=k1+(span-.22)/6-.025;
          for(const side of [-1,1]) face([at(side*.025,k1),at(side*width,k1),at(side*width,k2),at(side*.025,k2)],j%3===1?'steel':mat);
        }
      }
    }
    function runningLights(from,to,step,offset) {
      for(let x=from;x<to;x+=step) line(add([x,0,0],offset),add([x+.075,0,0],offset),'lamp',1.35);
    }
    function truss(x1,x2,r,spans) {
      for(let k=0;k<3;k++) {
        const a=TAU*k/3, b=a+TAU/3;
        beam(radial(x1,r,a),radial(x2,r,a),.028,'foil');
        for(let j=0;j<spans;j++) {
          const x=x1+(x2-x1)*j/spans, nx=x1+(x2-x1)*(j+1)/spans;
          line(radial(x,r,a),radial(nx,r,b),'silk',1.1);
          line(radial(x,r,b),radial(nx,r,a),'steel',1);
        }
      }
    }

    function ark(damaged) {
      hull([0,0,0],[[-2.05,.45],[-1.85,.57],[-1.46,.54],[-1.28,.30],[1.49,.30],[1.63,.75],[1.84,.75],[2.17,.42],[2.23,.14]],'steel',18,['dark','steel','gold','dark','steel','pale','shell','gold']);
      for(let k=0;k<7;k++) {
        const a=k*TAU/7, r=damaged?.50:.60;
        for(let i=0;i<(damaged&&k===2?2:4);i++) {
          const x=-1.01+i*.63;
          const loc=radial(x,r,a);
          pod(loc,.63,damaged?.255:.31, (i+k)%4===0?'steel':'shell');
          collar(loc,damaged?.259:.314,.055,(i+k)%3===1?'gold':'dark');
        }
        engine(radial(-1.92,.36,a),.135);
        line(radial(-1.43,r+.19,a),radial(1.43,r+.19,a),'foil',1);
      }
      if(damaged) {
        radiator(.85,1.17,.24,.52);
        truss(-1.45,1.19,.82,6);
        halo(1.44,.79,.045,'copper');
      } else {
        [-1.36,.20,1.46].forEach(x=>halo(x,.84,.045,'shell'));
        runningLights(.02,1.15,.19,[0,.84,.15]);
      }
    }

    function shuttle(kind) {
      const lift=kind==='nod'?.65:kind==='urshanabi'?.48:.38;
      hull([0,0,0],[[-1.28,.38,.46],[-1.06,lift,.59],[.35,lift,.62],[.72,.36,.50],[1.45,.12,.18]],kind==='nod'?'copper':'shell',8,['dark',kind==='nod'?'copper':'shell','steel','pale']);
      hull([.45,lift*.74,0],[[-.43,.10,.36],[-.22,.22,.33],[.28,.18,.27],[.52,.02,.12]],'glass',8,['steel','glass','glass']);
      for(const s of [-1,1]) {
        const p=(x,y,z)=>[x,y,s*z];
        const tip=kind==='urshanabi'?1.15:.90;
        const wing=[p(-1.17,-.15,.38),p(-.96,-.17,tip),p(-.40,-.06,tip*.94),p(.68,-.07,.46)];
        face(wing,'steel');face([wing[0],wing[1],p(-.96,-.27,tip),p(-1.2,-.29,.39)],'dark');
        if(kind==='nod') {
          pod(p(-.23,-.10,.65),1.62,.18,'foil');
          beam(p(-.56,-.50,.39),p(-.65,-.69,.72),.047,'steel');
        } else if(kind==='urshanabi') {
          pod(p(-.28,-.16,.77),1.64,.22,'shell'); collar(p(-.29,-.16,.77),.22,.08,'gold');
        } else face([p(-1.16,.04,.56),p(-1.13,.63,.84),p(-.81,.58,.82),p(-.42,.07,.54)],'gold');
        engine(p(-1.16,-.02,.28),.235);
        line(p(-.83,.09,.595),p(-.54,.09,.595),'warm',1.5);
      }
    }

    function station() {
      hull([0,0,0],[[-.97,.26],[-.8,.49],[-.35,.64],[.22,.62],[.63,.33],[.85,.25]],'foil',18,['steel','gold','foil','steel','dark']);
      collar([-.4,0,0],.67,.12,'shell');
      radiator(-.42,1.70,.35,.20);
      beam([.6,0,0],[1.43,0,0],.04,'steel');
      const rim=Array.from({length:20},(_,i)=>radial(1.17,.59,i*TAU/20));
      for(let i=0;i<rim.length;i++) face([[.98,0,0],rim[i],rim[(i+1)%rim.length]],i%2?'shell':'pale');
      for(let i=0;i<3;i++) line(rim[Math.floor(i*rim.length/3)],[1.43,0,0],'foil');
    }

    function brinStation() {
      // A rotating torus with a central hub and exterior service structures.
      const segments=36, outer=1.16, tube=.175, sides=8;
      const section=k=>Array.from({length:sides},(_,j)=>{
        const a=j*TAU/sides, b=k*TAU/segments;
        return radial(tube*Math.sin(a),outer+tube*Math.cos(a),b);
      });
      for(let k=0;k<segments;k++) bridge(section(k),section(k+1), k%6===0?'steel':k%6===1?'foil':'shell');
      for(let k=0;k<6;k++) {
        const a=k*TAU/6;
        beam(radial(0,.19,a),radial(0,outer-.12,a),.057,'steel');
        line(radial(.15,.28,a),radial(.10,outer,a+.16),'gold',1);
        pod(radial(-.07,outer+.13,a),.43,.105,'pale');
      }
      pod([0,0,0],1.24,.32,'shell'); collar([.16,0,0],.34,.09,'gold');
      radiator(-.44,1.51,.18,.4);
    }

    function laboratory(kind) {
      const phoenix=kind==='phoenix';
      truss(-1.71,1.53,.23,8);
      pod([1.34,0,0],1.14,.52,'shell');
      collar([1.19,0,0],.54,.12,'copper');
      engine([-1.66,0,0],.39);
      pod([-1.30,0,0],.61,.36,'steel');
      const count=4;
      for(let j=0;j<count;j++) {
        const a=TAU*j/count;
        const x=phoenix?(j%2?-.49:.20):-.15;
        const p=radial(x,.43,a);
        pod(p,1.45,.32,j%2?'pale':'foil');
        collar(p,.325,.10,'steel');
      }
      if(phoenix) {radiator(.44,1.36,.22,.38,'violet');halo(-.96,.55,.05,'copper');}
      else {radiator(-.84,1.66,.40,.20);radiator(.83,1.33,.27,.20); }
    }

    function silkCraft(kind) {
      const scout=kind==='lightfoot', multi=kind==='skipper';
      const waist=scout?.59:multi?.92:.77;
      const ribs=scout?5:multi?7:8;
      hull([0,0,0],[[-1.68,.17],[-1.18,.30],[-.62,.26],[.55,.20],[1.48,.13],[1.85,.065]],'glass',12,['steel','ocean','steel','shell','gold']);
      for(let i=0;i<ribs;i++) {
        const a=i*TAU/ribs, b=(i+1)*TAU/ribs;
        const stern=radial(-1.44,.25,a);
        const knee=radial(-.65,waist,a+.21);
        const mid=radial(.28,waist*.84,a+.20);
        const nose=radial(1.48,.20,a);
        beam(stern,knee,.034,'gold'); beam(knee,mid,.026,'silk'); beam(mid,nose,.026,'silk');
        line(knee,radial(-.65,waist,b+.21),'silk',1);
        line(mid,radial(.28,waist*.84,b+.20),'silk',1);
        for(let j=1;j<5;j++) {
          const t=j/5, at=(p,q,f)=>add(p,times(sub(q,p),f));
          const nextKnee=radial(-.65,waist,b+.21);
          const fore=radial(1.48,.20,b);
          line(at(knee,mid,t),at(nextKnee,radial(.28,waist*.84,b+.20),1-t),'ocean',.73);
          line(at(mid,nose,t),at(radial(.28,waist*.84,b+.20),fore,t),'silk',.69);
        }
        if(!scout && i%2===0) pod(radial(-.8,waist*.75,a+.18),.76,.13,multi?'glass':'steel');
      }
      engine([-1.54,0,0],.25);
      if(multi) {pod([-.04,.35,.13],1.18,.30,'ocean');collar([.06,.35,.13],.31,.065,'foil');}
    }

    function aquatic(warship) {
      const width=warship?.72:.84;
      hull([0,0,0],[[-1.54,.18,.22],[-.97,.36,width*.71],[-.43,.54,width],[.24,.55,width*1.05],[.79,.44,width*.87],[1.32,.19,width*.43],[1.52,.06,.11]],'ocean',20,['dark','steel','glass','ocean','ice','ocean']);
      for(let k=0;k<8;k++) {
        const a=k*TAU/8;
        const at=(x,r)=>[x,Math.cos(a)*r*.75,Math.sin(a)*r];
        const side=k%2?1:-1;
        const root=at(.66,width*.75), bend=at(-.12,width*1.19), end=at(warship?-1.68:-1.38,width*(warship?1.38:1.07));
        const far=[end[0]-.24,end[1]+side*.08,end[2]+side*.07];
        beam(root,bend,.061,warship?'steel':'ice');
        beam(bend,end,.052,warship?'steel':'ocean'); beam(end,far,.022,'foil');
        if(warship) face([bend,end,at(-1.42,width*.7)],k%2?'steel':'panel');
        else pod(at(-.49,width*.77),.68,.18,k%2?'ocean':'glass');
        if(k%2===0) line(at(.29,width*1.07),at(.48,width*.99),'lamp',1.5);
      }
      engine([-1.43,0,0],.17);
    }

    function mirrorArray() {
      // Individual tiles are curved into a shallow segmented reflector.
      const side=.278;
      for(let q=-3;q<=3;q++) for(let r=-3;r<=3;r++) {
        if(Math.abs(q+r)>3) continue;
        const y=1.5*side*r, z=Math.sqrt(3)*side*(q+r/2);
        const pts=Array.from({length:6},(_,i)=>{
          const sy=y+side*.97*Math.cos(TAU*i/6), sz=z+side*.97*Math.sin(TAU*i/6);
          return [.12*(sy*sy+sz*sz),sy,sz];
        });
        face(pts,(q-r)%3===0?'pale':q%3===1?'foil':'shell');
        if(Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r))===3 && (q+2*r)%3===0) beam([-.43,0,0],[-.02,y,z],.021,'steel');
      }
      pod([-.43,0,0],.63,.25,'gold'); radiator(-.61,1.94,.11,.2);
      for(let i=0;i<3;i++) beam(radial(.17,1.05,TAU*i/3),[.79,0,0],.016,'copper');
      pod([.79,0,0],.11,.066,'steel');
    }
    switch(id) {
      case 'ruins':
        truss(-1.8,1.75,.18,7);
        pod([-.85,0,0],1.1,.38,'steel');collar([-.93,0,0],.40,.14,'copper');
        pod([.7,0,0],.82,.32,'dark');radiator(.66,1.45,.32,.21);
        beam([-.55,0,0],[-.55,.69,0],.1,'steel');pod([-.55,.74,0],.65,.22,'shell');
        beam([1.56,0,0],[1.85,.59,.15],.045,'copper');
        break;
      case 'brin2':brinStation();break;
      case 'aegean': case 'phoenix': laboratory(id);break;
      case 'flask':station();break;
      case 'barrel':
        hull([0,0,0],[[-1.07,.45],[-.92,.65],[-.70,.73],[.70,.73],[.92,.65],[1.07,.45]],'pale',18,['dark','gold','shell','gold','steel']);
        [-.72,-.33,.33,.72].forEach(x=>collar([x,0,0],.76,.074,'steel'));
        for(let i=0;i<6;i++) beam(radial(-.75,.75,i*TAU/6),radial(.75,.75,i*TAU/6),.043,'foil');
        break;
      case 'gilgamesh': case 'enkidu': ark(id==='enkidu');break;
      case 'gilgamesh_shuttle': case 'urshanabi': case 'nod_shuttle':shuttle(id==='nod_shuttle'?'nod':id);break;
      case 'mirrors':mirrorArray();break;
      case 'voyager':case 'lightfoot':case 'skipper':silkCraft(id);break;
      case 'octo_science':case 'profundity':aquatic(id==='profundity');break;
      default:return null;
    }
    const mins=[Infinity,Infinity,Infinity], maxs=[-Infinity,-Infinity,-Infinity];
    for(const {points} of shapes) for(const p of points) p.forEach((v,i)=>{mins[i]=Math.min(v,mins[i]);maxs[i]=Math.max(v,maxs[i]);});
    const center=times(add(mins,maxs),.5);
    let radius=0;
    for(const shape of shapes) {
      shape.points=shape.points.map(p=>sub(p,center));
      for(const p of shape.points) radius=Math.max(radius,Math.hypot(...p));
    }
    return {shapes,radius};
  }

  window.mountVessel = function mountVessel(canvas, shipId) {
    const context = canvas.getContext('2d');
    const model = modelFor(shipId);
    if(!context || !model) return null;
    const initialYaw = ['mirrors','brin2'].includes(shipId) ? 1.06 : -.54;
    let yaw=initialYaw, pitch=.30, magnification=1, queued=0, destroyed=false;
    const render=()=>{
      queued=0;
      if(destroyed) return;
      const {width,height}=canvas.getBoundingClientRect();
      if(width<=0 || height<=0) return;
      const dpr=Math.min(window.devicePixelRatio || 1,2.5);
      const pixelWidth=Math.max(1,Math.round(width*dpr)), pixelHeight=Math.max(1,Math.round(height*dpr));
      if(canvas.width!==pixelWidth || canvas.height!==pixelHeight) {canvas.width=pixelWidth;canvas.height=pixelHeight;}
      context.setTransform(dpr,0,0,dpr,0,0);
      context.clearRect(0,0,width,height);
      const cy=Math.cos(yaw), sy=Math.sin(yaw), cp=Math.cos(pitch), sp=Math.sin(pitch);
      const transform=([x,y,z])=>{
        const depth=z*cy-x*sy;
        return [x*cy+z*sy,y*cp-depth*sp,y*sp+depth*cp];
      };
      const distance=model.radius*5.8;
      let extentX=0, extentY=0;
      const key=norm([-.65,.83,.88]), rim=norm([.62,.53,-.50]);
      const projected=model.shapes.map(shape=>{
        const pts=shape.points.map(transform);
        const depth=pts.reduce((sum,p)=>sum+p[2],0)/pts.length;
        const coords=pts.map(([x,y,z])=>{
          const perspective=distance/(distance-z), u=x*perspective, v=-y*perspective;
          extentX=Math.max(extentX,Math.abs(u)); extentY=Math.max(extentY,Math.abs(v));
          return [u,v];
        });
        return {shape,pts:coords,depth};
      }).sort((a,b)=>a.depth-b.depth);
      const scale=Math.min(width*.445/extentX,height*.435/extentY,Math.min(width,height)*.78/model.radius)*magnification;
      context.translate(width*.5,height*.5);
      context.scale(scale,scale);
      context.lineJoin='round';context.lineCap='round';
      for(const {shape,pts} of projected) {
        const base=palette[shape.mat];
        context.beginPath();context.moveTo(...pts[0]);
        for(let i=1;i<pts.length;i++) context.lineTo(...pts[i]);
        if(shape.width) {
          context.strokeStyle='rgb('+base.join(',')+')';
          context.lineWidth=Math.max(.38,shape.width*Math.min(width,height)/390*magnification)/scale;
          context.stroke(); continue;
        }
        context.closePath();
        let color=base;
        if(!shape.emission) {
          const n=transform(shape.normal);
          if(n[2]<0) for(let i=0;i<3;i++) n[i]=-n[i];
          const k=Math.max(0,n[0]*key[0]+n[1]*key[1]+n[2]*key[2]);
          const edge=Math.max(0,n[0]*rim[0]+n[1]*rim[1]+n[2]*rim[2]);
          const sheen=Math.pow(Math.max(0,n[0]*-.31+n[1]*.42+n[2]*.85),14);
          color=base.map((c,i)=>clamp(Math.round(c*(.38+.69*k+.15*edge)+[25,32,37][i]*sheen+[0,4,9][i]*(1-k)),0,255));
        }
        context.fillStyle='rgb('+color.join(',')+')';
        context.fill();
        // A narrow matching edge closes subpixel seams; broad facets retain their lighting.
        context.lineWidth=.44/scale; context.strokeStyle=context.fillStyle;context.stroke();
      }
    };
    const paint=()=>{if(!destroyed && !queued) queued=requestAnimationFrame(render);};
    const observer=typeof ResizeObserver!=='undefined' ? new ResizeObserver(paint) : null;
    if(observer) observer.observe(canvas); else window.addEventListener('resize',paint);
    paint();
    return {
      rotate(dx,dy){if(!Number.isFinite(dx)||!Number.isFinite(dy)) return; yaw+=dx*.009; pitch=clamp(pitch+dy*.009,-1.48,1.48);paint();},
      zoom(factor){if(factor>0 && Number.isFinite(factor)) {magnification=clamp(magnification*factor,.65,2.2);paint();}},
      reset(){yaw=initialYaw;pitch=.30;magnification=1;paint();},
      destroy(){destroyed=true;if(observer) observer.disconnect();else window.removeEventListener('resize',paint);if(queued) cancelAnimationFrame(queued);queued=0;context.clearRect(0,0,canvas.width,canvas.height);}
    };
  };
})();
