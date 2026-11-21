/* Inverse-project a textured sphere. All coordinates and lighting are illustrative. */
window.mountGlobe = function mountGlobe(canvas, id, fallback) {
  const initial = {lon:id === 'earth' ? .10 : .22, lat:.12, scale:1};
  const pose = {...initial};
  let gl, program, texture, buffer, image, renderer, observer, disposed = false;
  const shaders = [];
  const vertex = 'attribute vec2 point; void main(){gl_Position=vec4(point,0.,1.);}';
  const fragment = `
    precision highp float;
    uniform vec2 size; uniform vec3 pose; uniform sampler2D terrain;
    void main(){
      vec2 p=(gl_FragCoord.xy-.5*size)/(.422*min(size.x,size.y)*pose.z);
      float r=length(p);
      if(r>1.07){gl_FragColor=vec4(0.);return;}
      float sunward=max(0.,dot(normalize(p+.0001),normalize(vec2(-.73,.54))));
      if(r>=1.){float halo=exp(-95.*(r-1.))*(.15+.50*sunward);
        gl_FragColor=vec4(.46,.81,.84,halo);return;}
      vec3 n=vec3(p,sqrt(max(0.,1.-dot(p,p))));
      float cs=cos(pose.y),sn=sin(pose.y);
      vec3 q=vec3(n.x,cs*n.y+sn*n.z,cs*n.z-sn*n.y);
      vec2 uv=vec2(fract(.5+atan(q.x,q.z)/6.2831853+pose.x),.5-asin(clamp(q.y,-1.,1.))/3.14159265);
      vec3 land=texture2D(terrain,uv).rgb;
      float light=dot(n,normalize(vec3(-.78,.58,.48)));
      float day=smoothstep(-.18,.88,light);
      vec3 color=land*(.075+1.00*day);
      float limb=pow(1.-n.z,3.9)*(.07+.67*sunward);
      color=mix(color,vec3(.57,.88,.90),limb);
      gl_FragColor=vec4(color,1.);
    }`;
  function draw(){
    if(disposed || !renderer || !image) return;
    const width=canvas.clientWidth,height=canvas.clientHeight;
    if(!width || !height)return;
    const dpr=Math.min(window.devicePixelRatio||1,1.65);
    const w=Math.max(1,Math.round(width*dpr)),h=Math.max(1,Math.round(height*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    renderer(w,h);
    fallback.style.visibility='hidden';
  }
  function makeWebGL(){
    gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false,depth:false,stencil:false});
    if(!gl) return false;
    program=gl.createProgram();
    for(const [type,src] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
      const s=gl.createShader(type);shaders.push(s);gl.shaderSource(s,src);gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))return false;
      gl.attachShader(program,s);
    }
    gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return false;
    gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const pos=gl.getAttribLocation(program,'point');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
    for(const param of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,param,gl.CLAMP_TO_EDGE);
    for(const param of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,param,gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);
    const sizeLoc=gl.getUniformLocation(program,'size'),poseLoc=gl.getUniformLocation(program,'pose');
    renderer=(w,h)=>{gl.viewport(0,0,w,h);gl.uniform2f(sizeLoc,w,h);gl.uniform3f(poseLoc,pose.lon,pose.lat,pose.scale);gl.drawArrays(gl.TRIANGLES,0,6);};
    return true;
  }
  function makeSoftware(){
    // Keep the same orbit gestures on devices that cannot allocate a WebGL context.
    const layer=document.createElement('canvas'),ctx=layer.getContext('2d');
    if(!ctx) return;
    layer.width=768;layer.height=384;ctx.drawImage(image,0,0,768,384);
    const tex=ctx.getImageData(0,0,768,384).data;
    const out=document.createElement('canvas');out.width=out.height=280;
    const dest=out.getContext('2d'),frame=dest.createImageData(280,280),surface=frame.data;
    if (gl) {canvas.style.visibility='hidden';fallback.style.visibility='visible';return;}
    const display=canvas.getContext('2d');if(!display)return;
    renderer=(w,h)=>{
      const sn=Math.sin(pose.lat),cs=Math.cos(pose.lat);
      for(let y=0;y<280;y++){for(let x=0;x<280;x++){
        const X=(x-139.5)/139,Y=(139.5-y)/139,rr=X*X+Y*Y,k=4*(y*280+x);
        if(rr>1){surface[k+3]=0;continue;}
        const Z=Math.sqrt(1-rr);
        const u=((.5+Math.atan2(X,cs*Z-sn*Y)/(2*Math.PI)+pose.lon)%1+1)%1;
        const v=.5-Math.asin(Math.max(-1,Math.min(1,cs*Y+sn*Z)))/Math.PI;
        const ix=4*(Math.min(383,Math.floor(v*384))*768+Math.floor(u*768));
        const d=Math.max(0,Math.min(1,(-.78*X+.58*Y+.48*Z+.18)/1.06)),lit=.075+d*d*(3-2*d);
        for(let c=0;c<3;c++)surface[k+c]=tex[ix+c]*lit;
        surface[k+3]=255;
      }}
      dest.putImageData(frame,0,0);display.clearRect(0,0,w,h);const s=.844*Math.min(w,h)*pose.scale;display.drawImage(out,(w-s)/2,(h-s)/2,s,s);
    };
  }
  image=new Image();image.onload=()=>{if(disposed)return;try{if(!makeWebGL())makeSoftware();draw();}catch{fallback.style.visibility='visible';}};image.src='media/'+id+'.jpg';
  observer=new ResizeObserver(draw);observer.observe(canvas);
  return {rotate(dx,dy){pose.lon-=dx*.0015;pose.lat=Math.max(-1.45,Math.min(1.45,pose.lat+dy*.006));draw();},zoom(f){pose.scale=Math.max(.65,Math.min(1.45,pose.scale*f));draw();},reset(){Object.assign(pose,initial);draw();},destroy(){disposed=true;observer.disconnect();if(gl){gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);for(const s of shaders)gl.deleteShader(s);gl.getExtension('WEBGL_lose_context')?.loseContext();}}};
};
