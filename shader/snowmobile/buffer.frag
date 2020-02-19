#define keys(x,y)  texelFetch(iChannel0, ivec2(x,y), 0)
#define load(x)    texelFetch(iChannel1, ivec2((x),0), 0)
#define load2(x,y) texelFetch(iChannel1, ivec2((x),(y)), 0)
#define save(a,c)    if((gl.ifrag.x==(a))&&(gl.ifrag.y==0)){gl.color=(c);}
#define save2(a,b,c) if((gl.ifrag.x==(a))&&(gl.ifrag.y==(b))){gl.color=(c);}
bool keyState(int key) { return keys(key, 2).x < 0.5; }
bool keyDown(int key)  { return keys(key, 0).x > 0.5; }

#define ZERO min(iFrame,0)

#define MAX_STEPS  128
#define MIN_DIST   0.005
#define MAX_DIST   100.0

#define NONE    0
#define MOBILE  2

//  0000000  000   000   0000000   000   000  
// 000       0000  000  000   000  000 0 000  
// 0000000   000 0 000  000   000  000000000  
//      000  000  0000  000   000  000   000  
// 0000000   000   000   0000000   00     00  

float snowHeight(vec3 p)
{
    vec2  q = mod(p.xz, 512.0);
    ivec2 m = ivec2(q)/2;
    vec4  h = load2(m.x, m.y);
    vec2  f = fract(q/2.0);
    vec4  n;
    
    if (m.x < 2 && m.y < 8 || m.x >= 255 && m.y < 3 || m.y >= 255 && m.x < 2 || m.x >= 255 && m.y >= 255)
    {
        return load2(2, 0)[0];
    }
    
    if (f.x < 0.5 && f.y < 0.5)
    {
        return mix(mix(h[0], h[2], f.x*2.0), mix(h[1], h[3], f.x*2.0), f.y*2.0);
    }
    if (f.x >= 0.5 && f.y < 0.5)
    {
        n  = load2((m.x+1)%256, m.y);
        return mix(mix(h[2], n[0], (f.x-0.5)*2.0), mix(h[3], n[1], (f.x-0.5)*2.0), f.y*2.0);
    }
    if (f.x < 0.5 && f.y >= 0.5)
    {
        n  = load2(m.x, (m.y+1)%256);
        return mix(mix(h[1], h[3], f.x*2.0), mix(n[0], n[2], f.x*2.0), (f.y-0.5)*2.0);
    }

    n       = load2((m.x+1)%256, (m.y+1)%256);
    vec4 nx = load2((m.x+1)%256, m.y);
    vec4 ny = load2(m.x, (m.y+1)%256);
    return mix(mix(h[3], nx[1], (f.x-0.5)*2.0), mix(ny[2], n[0], (f.x-0.5)*2.0), (f.y-0.5)*2.0);
}

float floorDist()
{
    return min(floorSinus(), sdf.pos.y - snowHeight(sdf.pos*SNOW_SCALE));
}

vec3 floorNormal(vec3 p)
{
    vec3 n = v0;
    for (int i=ZERO; i<4; i++) {
        vec3 e = 0.5773*(2.0*vec3((((i+3)>>1)&1),((i>>1)&1),(i&1))-1.0);
        sdf.pos = p+e*0.0001;
        n += e*floorDist(); }
    return normalize(n);
}

float floorHeight(vec3 p)
{
    sdf.pos = p;
    return floorDist();
}

// 000       0000000    0000000   0000000    
// 000      000   000  000   000  000   000  
// 000      000   000  000000000  000   000  
// 000      000   000  000   000  000   000  
// 0000000   0000000   000   000  0000000    

void loadMobile()
{
    mobile.pos    = load2(1, 0).xyz;
    mobile.up     = load2(1, 1).xyz;
    mobile.dir    = load2(1, 2).xyz;
    mobile.rgt    = load2(1, 3).xyz;
    mobile.vel    = load2(1, 4).xyz;
    mobile.turret = load2(1, 5).xyz;
    mobile.track  = load2(1, 6).xy;
}

//  0000000   0000000   000   000  00000000  
// 000       000   000  000   000  000       
// 0000000   000000000   000 000   0000000   
//      000  000   000     000     000       
// 0000000   000   000      0      00000000  

void saveMobile()
{
    save2(1, 0, vec4(mobile.pos,   0));
    save2(1, 1, vec4(mobile.up,    0));
    save2(1, 2, vec4(mobile.dir,   0));
    save2(1, 3, vec4(mobile.rgt,   0));
    save2(1, 4, vec4(mobile.vel,   0));
    save2(1, 5, vec4(mobile.turret,0));
    save2(1, 6, vec4(mobile.track, 0,0));
}

// 000  000   000  000  000000000  
// 000  0000  000  000     000     
// 000  000 0 000  000     000     
// 000  000  0000  000     000     
// 000  000   000  000     000     

void initCamera()
{
    save2(0,1,vec4(0,1,0,0));
    save2(0,2,vec4(0,1,20,0));
}

void initMobile()
{
   mobile.pos    = vec3(0,1,0);
   mobile.dir    = vx;
   mobile.up     = vy;
   mobile.rgt    = vz;
   mobile.turret = vx;
   mobile.vel    = vx*0.5;
   mobile.track  = vec2(0);
   saveMobile();
}

void initSnow(int x, int y)
{
   float x1 = 3.0*cos( (float(x)     /256.0-0.5)*TAU);
   float x2 = 3.0*cos(((float(x)+0.5)/256.0-0.5)*TAU);
   float y1 = 3.0*cos( (float(y)     /256.0-0.5)*TAU);
   float y2 = 3.0*cos(((float(y)+0.5)/256.0-0.5)*TAU);
   
   x1 += 1.0*cos(((float(x)+0.0)/64.0-0.5)*TAU);
   x2 += 1.0*cos(((float(x)+0.5)/64.0-0.5)*TAU);
   y1 += 1.0*cos(((float(y)+0.0)/64.0-0.5)*TAU);
   y2 += 1.0*cos(((float(y)+0.5)/64.0-0.5)*TAU);
   
   save2(x, y, 8.0+vec4( x1+y1, x1+y2, x2+y1, x2+y2));
}

// 00     00   0000000   0000000    000  000      00000000  
// 000   000  000   000  000   000  000  000      000       
// 000000000  000   000  0000000    000  000      0000000   
// 000 0 000  000   000  000   000  000  000      000       
// 000   000   0000000   0000000    000  0000000  00000000  

void calcMobile()
{
    loadMobile();
    
    float d, v, a;
    vec3 acc, vel;
    
    acc = v0;

    vec3 oldPosR = mobile.pos + 1.3*mobile.rgt;
    vec3 oldPosL = mobile.pos - 1.3*mobile.rgt;
    
    float td = 1.0; // iTimeDelta*60.0;
        
    float rotSpeed = 4.0*td;
    float rotAngle = keyDown(KEY_LEFT) ? -rotSpeed : keyDown(KEY_RIGHT) ? rotSpeed : iMouse.z > 0.0 ? gl.mp.x * rotSpeed : 0.0;
    
    mobile.dir = rotAxisAngle(mobile.dir, mobile.up, rotAngle);        
    mobile.dir = normalize(mobile.dir);
    
    float accel = 0.02*td;
    accel *= keyDown(KEY_UP) ? 1.0 : keyDown(KEY_DOWN) ? -0.8 : iMouse.z > 0.0 ? gl.mp.y*0.5+0.5 : 0.0;
    acc += accel*mobile.dir;
        
    mobile.vel += acc;
    
    mobile.pos += mobile.vel*td;
    
    mobile.pos.y -= (floorHeight(mobile.pos+mobile.dir*2.0) + floorHeight(mobile.pos-mobile.dir*2.0) + floorHeight(mobile.pos+mobile.rgt*2.0) + floorHeight(mobile.pos-mobile.rgt*2.0))/4.0; 
    mobile.up     = mix(mobile.up, (floorNormal(mobile.pos+mobile.dir*2.0) + floorNormal(mobile.pos-mobile.dir*2.0) + floorNormal(mobile.pos+mobile.rgt*2.0) + floorNormal(mobile.pos-mobile.rgt*2.0))/4.0, 0.5);
    
    mobile.rgt = normalize(cross(mobile.dir, mobile.up));
    mobile.dir = normalize(cross(mobile.up, mobile.rgt));
    
    mobile.vel = mix(mobile.vel, mobile.dir*length(mobile.vel), 0.01);
    float vell = length(mobile.vel);
    if (vell > 0.01)
    {
        vec3 veln = normalize(mobile.vel);
        mobile.vel -= veln*0.01;
        if (vell > 1.0)
        {
            mobile.vel = veln;
        }
    }
    else
    {
        mobile.vel = v0;
    }
    
    vec3 deltaR = (mobile.pos + 1.3*mobile.rgt)-oldPosR;
    vec3 deltaL = (mobile.pos - 1.3*mobile.rgt)-oldPosL;
    float dr = length(deltaR);
    float dl = length(deltaL);
    if (dl > EPS)
    {
        mobile.track.x = fract(mobile.track.x-dot(normalize(deltaL), mobile.dir)*dl);
    }
    if (dr > EPS)
    {
        mobile.track.y = fract(mobile.track.y-dot(normalize(deltaR), mobile.dir)*dr);
    }
    
    mobile.turret = normalize(mix(mobile.turret, mobile.dir, 0.1))*(0.75+0.25*smoothstep(0.0, 3.0, length(mobile.vel)));
    
    saveMobile();
}

//  0000000  000   000   0000000   000   000  
// 000       0000  000  000   000  000 0 000  
// 0000000   000 0 000  000   000  000000000  
//      000  000  0000  000   000  000   000  
// 0000000   000   000   0000000   00     00  

void calcSnow(int x, int y)
{
    if (keyDown(KEY_R)) 
    {
        initSnow(x, y);
        return;
    }
    
    vec4 h = load2(x,y);
    loadMobile();
    
    vec3 p = mobile.pos*SNOW_SCALE;
    vec2 q1 = mod(p.xz, 512.0)*0.5;
    vec2 q2 = q1+vec2(256.0,0);
    vec2 q3 = q1-vec2(256.0,0);
    vec2 q4 = q1+vec2(0,256.0);
    vec2 q5 = q1-vec2(0,256.0);
    
    float speedFactor = clamp01(1.2*(length(mobile.vel)-0.15));
    
    for (float i = float(ZERO); i < 4.0; i++)
    {
        vec2 o = vec2(x,y)+vec2(0.5*mod(floor(i/2.0),2.0),0.5*mod(i,2.0));
        float d = min (min( min(length(q1-o), length(q2-o)), min(length(q3-o), length(q4-o))), length(q5-o));
        float mf = clamp01(1.0-(mobile.pos.y-h[int(i)])/0.35);
        h[int(i)] -= 0.33*(1.0-smoothstep(4.0,5.0+2.0*speedFactor,d))*speedFactor*mf;
    }
    save2(x, y, h);
}

//  0000000   0000000   00     00  00000000  00000000    0000000   
// 000       000   000  000   000  000       000   000  000   000  
// 000       000000000  000000000  0000000   0000000    000000000  
// 000       000   000  000 0 000  000       000   000  000   000  
//  0000000  000   000  000   000  00000000  000   000  000   000  

void calcCamera()
{
    vec4 tgt = load2(0,1);
    vec4 pos = load2(0,2);
    
    loadMobile();
        
    tgt.xyz = mix(tgt.xyz, mobile.pos, 0.2);
    pos.xyz = mix(pos.xyz, tgt.xyz - 20.0*mobile.dir + 8.0*mobile.up, 0.005);
    
    pos.y = max(pos.y, snowHeight(pos.xyz)+8.0);
    
    save2(0,1,tgt);
    save2(0,2,pos);
}

// 00     00   0000000   000  000   000  
// 000   000  000   000  000  0000  000  
// 000000000  000000000  000  000 0 000  
// 000 0 000  000   000  000  000  0000  
// 000   000  000   000  000  000   000  

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    initGlobal(fragCoord, iResolution, iMouse, iTime);

    ivec2 mem = ivec2(fragCoord);
    int id = mem.x;
    
    if (iFrame < 10)
    {
        if (id == 0 && mem.y == 0)
        {
            save(0,vec4(30.1,0,0,0));
        }
        else
        {
            if (id == 0 && mem.y < 3)
            {
                initCamera();
            }
            else if (id >= 1 && id <= 1 && mem.y < 8)
            {
                initMobile();
            } 
            else
            {
                initSnow(mem.x, mem.y);
            }
        }
        
        fragColor = gl.color;
        return;
    }

    if (id == 0 && mem.y == 0)
    {
        save(id,vec4(load(0).x+0.1,0,0,0));
    }
    else
    {
        if (id == 0 && mem.y < 3)
        {
            calcCamera();
        }
        else if (id >= 1 && id <= 1 && mem.y < 8)
        {
            calcMobile();
        }
        else if (mem.x < 256 && mem.y < 256)
        {
            calcSnow(mem.x, mem.y);
        }
    }
    
    fragColor = gl.color;
}