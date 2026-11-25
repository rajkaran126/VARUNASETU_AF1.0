import * as T from "three";

// Value noise in world space keeps the grain attached to the surface while seeking.
const noise = `
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float fbm(vec2 p){float n=0.,a=.5;for(int i=0;i<4;i++){n+=a*noise2(p);p=p*2.05+vec2(6.2,1.7);a*=.5;}return n;}`;
const colorOutput = `
#include <tonemapping_fragment>
#include <colorspace_fragment>
`;
export function earthSurface(onLoad: () => void) {
  const height = new T.TextureLoader().load(
    "/contourlines/data/elev-1080.png",
    onLoad,
  );
  height.magFilter = T.NearestFilter;
  height.minFilter = T.NearestFilter;
  height.wrapS = T.RepeatWrapping;
  height.generateMipmaps = false;
  const material = new T.ShaderMaterial({
    uniforms: { heightMap: { value: height } },
    vertexShader: `varying vec3 n;varying vec3 local;varying vec3 eye;
    void main(){local=position;n=normalize(mat3(modelMatrix)*normal);
    vec4 w=modelMatrix*vec4(position,1.);eye=cameraPosition-w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader: `uniform sampler2D heightMap;varying vec3 n;varying vec3 local;varying vec3 eye;
    ${noise}
    float elevation(vec2 uv){vec2 rg=texture2D(heightMap,uv).rg;return dot(rg,vec2(65280.,255.))-11000.;}
    void main(){vec3 s=normalize(local);vec2 uv=vec2(atan(s.x,s.z)/6.283185+.5,asin(s.y)/3.14159+.5);
    float h=elevation(uv);float arid=smoothstep(.0,.65,abs(s.y))*(1.-smoothstep(.49,.8,abs(s.y)));
    vec3 land=mix(vec3(.045,.12,.064),vec3(.46,.30,.14),arid*.9);
    land=mix(land,vec3(.85,.88,.86),smoothstep(3000.,5700.,h)+.45*smoothstep(.89,.99,abs(s.y)));
    land*=clamp(1.+(elevation(uv+vec2(.001,.001))-h)*.00032,.63,1.35);
    vec3 sea=mix(vec3(.01,.038,.09),vec3(.026,.20,.25),exp(min(h,0.)/780.));
    vec3 base=h<0.?sea:land;
    vec2 wind=uv*vec2(32.,21.);wind.y+=1.9*sin(wind.x*.66)+.8*sin(wind.x*1.7);
    float clouds=smoothstep(.53,.76,fbm(wind+fbm(wind*2.5)*1.6));
    base=mix(base,vec3(.85,.89,.90),clouds*.83);
    float day=.20+.83*max(dot(normalize(n),normalize(vec3(-.52,.64,.58))),0.);
    float rim=pow(1.-max(dot(normalize(n),normalize(eye)),0.),3.8);
    gl_FragColor=vec4(base*day+vec3(.06,.26,.49)*rim,1.);
    ${colorOutput}}`,
  });
  material.addEventListener("dispose", () => height.dispose());
  return new T.Mesh(new T.SphereGeometry(2.5, 96, 64), material);
}

export function surfaceSky() {
  return new T.Mesh(
    new T.SphereGeometry(70, 48, 24),
    new T.ShaderMaterial({
      side: T.BackSide,
      depthWrite: false,
      vertexShader: `varying vec3 dir;void main(){dir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying vec3 dir;${noise}
    void main(){vec3 d=normalize(dir);float h=max(d.y,0.);
    vec3 sky=mix(vec3(.96,.48,.28),vec3(.08,.205,.37),smoothstep(-.04,.68,h));
    vec3 sun=normalize(vec3(.6,.15,-.67));float g=max(dot(d,sun),0.);
    sky+=vec3(1.,.52,.18)*(pow(g,28.)*.33+smoothstep(.9994,.99985,g)*2.);
    vec2 p=d.xz/max(.085,h)*1.35;
    float cloud=smoothstep(.43,.70,fbm(p+vec2(fbm(p*1.7),0.)));
    sky=mix(sky,mix(vec3(.54,.43,.45),vec3(.90,.78,.69),h),cloud*.65*smoothstep(.015,.16,h));
    gl_FragColor=vec4(sky,1.);${colorOutput}}`,
    }),
  );
}
export function oceanSurface() {
  const material = new T.ShaderMaterial({
    uniforms: { seconds: { value: 0 } },
    vertexShader: `uniform float seconds;varying vec3 w;
    void main(){w=(modelMatrix*vec4(position,1.)).xyz;w.y+=.055*sin(w.x*2.+w.z*1.4+seconds)+.032*sin(w.z*3.1-seconds*.8);
    gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}`,
    fragmentShader: `uniform float seconds;varying vec3 w;${noise}
    float wave(vec2 p){return .12*sin(p.x*2.+p.y*1.4+seconds)+.08*sin(p.y*3.1-seconds*.8)+.14*fbm(p*6.+seconds*.31);}
    void main(){vec2 p=w.xz;float a=wave(p);vec3 n=normalize(vec3((a-wave(p+vec2(.035,0.)))/.035,1.,(a-wave(p+vec2(0.,.035)))/.035));
    vec3 eye=normalize(cameraPosition-w),r=reflect(-eye,n);
    float fres=pow(1.-max(dot(eye,n),0.),3.);
    vec3 col=mix(vec3(.008,.054,.073),vec3(.26,.41,.46),.14+.74*fres);
    float spec=pow(max(dot(r,normalize(vec3(.6,.15,-.67))),0.),45.);
    col+=vec3(1.,.59,.30)*spec*1.8;
    gl_FragColor=vec4(col,1.);${colorOutput}}`,
  });
  const surface = new T.Mesh(new T.PlaneGeometry(115, 115, 140, 140), material);
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = -0.115;
  return surface;
}
