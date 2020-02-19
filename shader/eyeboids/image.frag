#define keys(x,y) texelFetch(iChannel0, ivec2(x,y), 0)
#define load(x) texelFetch(iChannel1, ivec2(x,0), 0)
#define load3(x,y) texelFetch(iChannel3, ivec2(x,y), 0)
#define font(x,y) texelFetch(iChannel2, ivec2(x,y), 0)

bool keyState(int key) { return keys(key, 2).x < 0.5; }
bool keyDown(int key)  { return keys(key, 0).x > 0.5; }

#define ZERO min(iFrame,0)
#define MAX_STEPS  128
#define MIN_DIST   0.002
#define MAX_DIST   5.0
#define SHADOW     0.2
#define FLOOR      0.0

#define NONE  0
#define PLANE 1
#define BULB  2
#define PUPL  3

bool anim, soft, occl, light;

vec3 camPos;
vec3 camTgt;
vec3 camDir;

int  mat;
int  num;
int  AA = 2;

float planeDist;

struct sdf {
    float dist;
    vec3  pos;
    int   mat;
};

sdf s;

// 00000000  000   000  00000000  
// 000        000 000   000       
// 0000000     00000    0000000   
// 000          000     000       
// 00000000     000     00000000  

void eye(int id, vec3 pos, vec3 n)
{
    float d, r = 0.1;
        
   	d = sdSphere(s.pos, pos, r);
    
    if (d > s.dist+r) return;
    
    float fid = float(id);
    vec3 hsh1 = hash31(fid+floor(iTime*fid/(fid-0.5)*0.2));
    vec3 hsh2 = hash31(fid+floor(iTime*fid/(fid-0.5)*0.3));
    
    n  = normalize(n+(hsh1 + hsh2 - 1.0)*(dot(n,vz)-0.5));
    
    vec3 pupil = pos+1.0*r*n;
    vec3 lens  = pos+0.5*r*n;
    
    d = opDiff(d, sdSphere(s.pos, pupil, r*0.75), r*0.1);

    if (d < s.dist) { s.mat = BULB; s.dist = d; }
    
    d = min(d, sdEllipsoid(s.pos, lens, r*vec3(0.7, 0.7, 0.35)));
    
    if (d < s.dist) { s.mat = PUPL; s.dist = d; }
    
    d = opUnion(planeDist, sdTorus(s.pos, pos+0.0*vz, vz, r*1.3, r*0.2), r*0.3);
    
    if (d < s.dist) { s.mat = PLANE; s.dist = d; }
}

void nose(vec3 pos)
{
    float r = 0.1;
    float d = sdPlane(s.pos, v0, vz);
 
    d = opDiff (d, sdSphere(s.pos, pos, r*1.4), r*0.4);
    
    planeDist = d;
    if (d < s.dist) { s.mat = PLANE; s.dist = d; }
}

// 00     00   0000000   00000000   
// 000   000  000   000  000   000  
// 000000000  000000000  00000000   
// 000 0 000  000   000  000        
// 000   000  000   000  000        

float map(vec3 p)
{
    s = sdf(1000.0, p, NONE);
    
    nose(vec3(gl.mp,0));
     
    for (int i = 1; i <= num; i++)
    {
        vec4 fish = load(i);
            
        float fd = length(fish.xy-gl.uv); 
        
        if (fd < 0.5 || gl.option!=0)
    	{
            vec3 fp = vec3(fish.x,fish.y,0);
            vec3 fdir = vec3(fish.zw,0);
            eye(i, fp, normalize(normalize(camPos-fp) + 1.5*fdir));
    	}
    }

    return s.dist;
}

vec3 getNormal(vec3 p)
{
    vec3 n = v0;
    for (int i=ZERO; i<4; i++)
    {
        vec3 e = 0.5773*(2.0*vec3((((i+3)>>1)&1),((i>>1)&1),(i&1))-1.0);
        n += e*map(p+e*0.0001);
    }
    return normalize(n);
}

// 00     00   0000000   00000000    0000000  000   000  
// 000   000  000   000  000   000  000       000   000  
// 000000000  000000000  0000000    000       000000000  
// 000 0 000  000   000  000   000  000       000   000  
// 000   000  000   000  000   000   0000000  000   000  

float rayMarch(vec3 ro, vec3 rd)
{
    float dz = 0.0;
    for (int i = ZERO; i < MAX_STEPS; i++)
    {
        vec3 p = ro + dz * rd;
        float d = map(p);
        dz += d;
        if (d < MIN_DIST) return dz;
        if (dz > MAX_DIST) break;
    }
    s.mat = NONE;
    return dz;
}

//  0000000  000   000   0000000   0000000     0000000   000   000  
// 000       000   000  000   000  000   000  000   000  000 0 000  
// 0000000   000000000  000000000  000   000  000   000  000000000  
//      000  000   000  000   000  000   000  000   000  000   000  
// 0000000   000   000  000   000  0000000     0000000   00     00  

float softShadow(vec3 ro, vec3 lp, float k)
{
    float shade = 1.;
    float dist = MIN_DIST;    
    vec3 rd = (lp-ro);
    float end = max(length(rd), MIN_DIST);
    float stepDist = end/25.0;
    rd /= end;
    for (int i=0; i<25; i++)
    {
        float h = map(ro+rd*dist);
        //if (s.mat != BBOX)
            shade = min(shade, k*h/dist);
        dist += clamp(h, 0.02, stepDist*2.0);
        
        if (h < 0.0 || dist > end) break; 
    }

    return min(max(shade, 0.0) + SHADOW, 1.0); 
}

//  0000000    0000000   0000000  000      000   000   0000000  000   0000000   000   000  
// 000   000  000       000       000      000   000  000       000  000   000  0000  000  
// 000   000  000       000       000      000   000  0000000   000  000   000  000 0 000  
// 000   000  000       000       000      000   000       000  000  000   000  000  0000  
//  0000000    0000000   0000000  0000000   0000000   0000000   000   0000000   000   000  

float getOcclusion(vec3 p, vec3 n)
{
    if (!occl) return 1.0;
    float a = 0.0;
    float weight = 1.0;
    for (int i = ZERO; i <= 6; i++)
    {
        float d = (float(i) / 6.0) * 0.3;
        a += weight * (d - map(p + n*d));
        weight *= 0.8;
    }
    float f = clamp01(1.0-a);
    return f*f;
}

// 000      000   0000000   000   000  000000000  
// 000      000  000        000   000     000     
// 000      000  000  0000  000000000     000     
// 000      000  000   000  000   000     000     
// 0000000  000   0000000   000   000     000     

float shiny(float rough, float NoH, const vec3 h) 
{
    float oneMinusNoHSquared = 1.0 - NoH * NoH;
    float a = NoH * rough;
    float k = rough / (oneMinusNoHSquared + a * a);
    float d = k * k / PI;
    return d;
}

vec3 getLight(vec3 p, vec3 n, vec3 col)
{
    if (mat == NONE) return col;
    
    vec3 cr = cross(camDir, vec3(0,1,0));
    vec3 up = normalize(cross(cr,camDir));
    vec3 lp = vec3(-0.5,1.0,4.0); 
    vec3 l = normalize(lp-p);
 
    float ambient = 0.005;
    float dif = clamp(dot(n,l), 0.0, 1.0);
    
    if (mat == PUPL)
    {
        dif = clamp(dot(n,normalize(mix(camPos,lp,0.1)-p)), 0.0, 1.0);
        dif = mix(pow(dif, 16.0), dif, 0.2);
        dif += 1.0 - smoothstep(0.0, 0.2, dif);
        if (mat == PUPL) ambient = 0.1;
    }
    else if (mat == BULB)
    {
        dif = mix(pow(dif, 32.0), 3.0*dif+1.0, 0.2);
        ambient = 0.12;
    }
    else if (mat == PLANE)
    {
        dif = mix(pow(dif, 2.0), dif, 0.2);
    }
    
    if (mat == PLANE || mat == BULB)
    {
        dif *= softShadow(p, lp, 6.0);        
    }
       
    col *= clamp(dif, ambient, 1.0);
    col *= getOcclusion(p, n);
    
    if (light) col = vec3(dif*getOcclusion(p, n));
    
   	if (mat == PUPL || mat == BULB)
    {
        col += vec3(pow(clamp01(smoothstep(0.9,1.0,dot(n, l))), 20.0));
    }
    else if (mat == PLANE)
    {
        col += col*vec3(pow(clamp01(smoothstep(0.25,1.0,dot(n, l))), 2.0));
        col += col*vec3(pow(clamp01(smoothstep(0.9,1.0,dot(n, l))), 4.0));
    }
    
    if (light) col = clamp(col, 0.0, 1.0);
    return col;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    initGlobal(fragCoord, iResolution, iMouse, iTime);
    for (int i = KEY_1; i <= KEY_9; i++) { if (keyDown(i)) { gl.option = i-KEY_1+1; break; } }
    
    soft  =  keyState(KEY_DOWN);
    light = !keyState(KEY_LEFT);
    anim  =  keyState(KEY_RIGHT);
    occl  =  keyState(KEY_UP);
    
    vec3 cols = v0, col = v0;
	num = int(load(0).x);
    
    if (!soft) AA = 1; 
    
   	vec2 ao = vec2(0);
    
    float md = 4.0;
    float my = 0.0;
    float mx = 0.0;
        
    camTgt = v0; 
  	camPos = rotAxisAngle(rotAxisAngle(vec3(0,0,md), vx, 89.0*my), vy, -180.0*mx);
        
    vec3 ww = normalize(camTgt-camPos);
    vec3 uu = normalize(cross(ww, vy));
    vec3 vv = normalize(cross(uu, ww));
    float fov = 4.0 + float(gl.option);
    
    for( int am=ZERO; am<AA; am++ )
    for( int an=ZERO; an<AA; an++ )
    {
        if (AA > 1) ao = vec2(float(am),float(an))/float(AA)-0.5;

        gl.uv = (2.0*(fragCoord+ao)-iResolution.xy)/iResolution.y;
    
        vec3 rd = normalize(gl.uv.x*uu + gl.uv.y*vv + fov*ww);
        
        float d = rayMarch(camPos, rd);
        mat = s.mat;
        
        vec3 p = camPos + d * rd;
        vec3 n = getNormal(p);
                
        if      (mat == PLANE) col = vec3(0.15, 0.0, 0.0);
        else if (mat == PUPL)  col = vec3(0.1, 0.1, 0.5);
        else if (mat == BULB)  col = vec3(1.0, 1.0, 1.0);
        else if (mat == NONE)  col = vec3(0.22, 0.0, 0.0);
    
        col = getLight(p, n, col);
            
        cols += col;
    }
    
    col = cols/float(AA*AA);
    
    col *= pow(clamp01(1.2*gl.aspect-length(gl.uv)), 0.5);
    col = pow(col, vec3(1.0/2.2));
    fragColor = vec4(col,1.0);
}