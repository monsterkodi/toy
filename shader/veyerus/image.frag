#define keys(x,y)  texelFetch(iChannel0, ivec2(x,y), 0)
#define load(x)    texelFetch(iChannel1, ivec2(x,0), 0)
#define load3(x,y) texelFetch(iChannel3, ivec2(x,y), 0)
#define font(x,y)  texelFetch(iChannel2, ivec2(x,y), 0)

bool keyState(int key) { return keys(key, 2).x < 0.5; }
bool keyDown(int key)  { return keys(key, 0).x > 0.5; }

#define ZERO min(iFrame,0)
#define MAX_STEPS  128
#define MIN_DIST   0.01
#define MAX_DIST   60.0
#define SHADOW     0.2

#define NONE 0
#define SKIN 1
#define BULB 2
#define PUPL 3

#define CORE_RADIUS 1.2
#define CAM_DIST    30.0

vec3 BG_COLOR;

float EYE_RADIUS = 0.8;
float heartBeat;
float bgH, bgS, bgL;

bool anim, soft, occl, light, dither, rotate, normal, depthb;

vec3 camPos;
vec3 camTgt;
vec3 camDir;

int  AA = 2;
int  shape;
float[5] eyeRadii = float[5](0.8, 1.2, 0.9, 0.7, 0.7);
float[5] stalkLen = float[5](1.0, 0.8, 0.9, 1.0, 1.0);

//  0000000   000   000  000  00     00  
// 000   000  0000  000  000  000   000  
// 000000000  000 0 000  000  000000000  
// 000   000  000  0000  000  000 0 000  
// 000   000  000   000  000  000   000  

float iFade(float a, float b, float s)
{
    return a + (b-a) * (1.0 - (sin(iTime*s) * 0.5 + 0.5));
}

void calcAnim()
{
    if (anim)
    {
        heartBeat = smoothstep(1.0, 0.8, sin(1.5*iTime*TAU)*0.5+0.5);
        bgH = iFade(0.66,0.67,0.1);
        bgS = iFade(0.75,0.8,0.1);
        bgL = iFade(0.15,0.05,0.1);
    }
    else
    {
        heartBeat = 0.0;
        bgH = 2./3.;
        bgS = 0.75;
        bgL = 0.15;
    }
    
    shape = int(mod(iTime*0.08,5.0));
    EYE_RADIUS = eyeRadii[shape];

    BG_COLOR = hsl(bgH, bgS, bgL);
    
    if (light) BG_COLOR = gray(BG_COLOR);
}

//  0000000  000000000   0000000   000      000   000  
// 000          000     000   000  000      000  000   
// 0000000      000     000000000  000      0000000    
//      000     000     000   000  000      000  000   
// 0000000      000     000   000  0000000  000   000  

float stalk(float open, vec3 pos)
{    
    float d = sdCapsule(v0, pos, 0.3);
    d = opUnion(d, sdSphere(pos, EYE_RADIUS*1.25));    
    d = opInter(d, sdPlane(pos*(2.0-open), normalize(pos)), 0.2);
    return d;
}

// 00000000  000   000  00000000  
// 000        000 000   000       
// 0000000     00000    0000000   
// 000          000     000       
// 00000000     000     00000000  

void eye(float id, vec3 pos)
{
    vec3  n   = normalize(pos);
    float r   = EYE_RADIUS;
    float d   = sdSphere(pos, r);
    
    if (d > gl.sdf.dist) return;
        
    if (d < gl.sdf.dist) { gl.sdf.mat = BULB; gl.sdf.dist = d; }

    vec3 hsh1 = hash31(id+floor(iTime*id/(id-0.5)*0.2));
    vec3 hsh2 = hash31(id+floor(iTime*id/(id-0.5)*0.3));
    n  = normalize(n+(hsh1 + hsh2 - 1.0)*(dot(n,vz)-0.5));
    vec3 lens = pos + 0.67 * r * n;
    d = sdPill(lens,  0.6*r, n*0.2);
    
    if (d < gl.sdf.dist) { gl.sdf.mat = PUPL; gl.sdf.dist = d; }
}

// 00     00   0000000   00000000   
// 000   000  000   000  000   000  
// 000000000  000000000  00000000   
// 000 0 000  000   000  000        
// 000   000  000   000  000        

float map(vec3 p)
{
    vec4 m = chooseMap(p, shape);
    
    p  = m.xyz;
    float id = m.w;
    float time = anim ? iTime : 0.0;
    
    gl.sdf = SDF(MAX_DIST, p, NONE);
    
    float d = sdSphere(v0, CORE_RADIUS*(1.2-0.4*heartBeat));

    float blink = smoothstep(0.9999, 0.9980, sin(id+time*1.1)*0.5+0.5);
    bool  actve = fract(id/12.0+time/30.0) < 0.5;
    float open  = actve ? blink : 0.0;
    
    float jmp = actve ?
        0.15*smoothstep(0.5, 0.6, sin(id+time*1.3)) : 
        0.15*sin(id+time*3.0);
    float len = 4.0 - jmp + 0.7*sin(time*0.5);
        
    vec3 pos = vy * len * stalkLen[shape];
    
    d = opUnion(d, stalk(open, pos), 0.05+0.3*heartBeat);
    
    if (d < gl.sdf.dist) { gl.sdf.mat = SKIN; gl.sdf.dist = d; }

    if (open > 0.8f)
    {
        eye(id, pos);
    }

    return gl.sdf.dist;
}

// 000   000   0000000   00000000   00     00   0000000   000      
// 0000  000  000   000  000   000  000   000  000   000  000      
// 000 0 000  000   000  0000000    000000000  000000000  000      
// 000  0000  000   000  000   000  000 0 000  000   000  000      
// 000   000   0000000   000   000  000   000  000   000  0000000  

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

vec3 getNormal2(vec3 p)
{
    vec3 eps=vec3(0.001,0,0);
    
    return normalize(vec3(map(p+eps.xyz)-map(p-eps.xyz),
                          map(p+eps.yxz)-map(p-eps.yxz),
                          map(p+eps.yzx)-map(p-eps.yzx)));
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
    gl.sdf.mat = NONE;
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

vec3 getLight(vec3 p, vec3 n, int mat)
{
    vec3 col;
    switch (mat)
    {
        case SKIN: col = vec3(0.4, 0.0, 0.0);  break;
        case PUPL: col = vec3(0.1, 0.1, 0.5);  break;
        case BULB: col = vec3(0.95);           break;
        case NONE: col = BG_COLOR;             break;
    }
    
    if (mat == NONE) 
    {
        return col;
    }
    
    vec3 l = normalize(gl.light-p);
 
    float ambient = 0.05;
    float dif = clamp(dot(n,l), 0.0, 1.0);
    
    if (mat == PUPL)
    {
        dif = clamp(dot(n,normalize(mix(camPos,gl.light,0.1)-p)), 0.0, 1.0);
        dif = mix(pow(dif, 16.0), dif, 0.2);
        dif += 1.0 - smoothstep(0.0, 0.2, dif);
        if (mat == PUPL) ambient = 0.1;
    }
    else if (mat == BULB)
    {
        dif = mix(pow(dif, 32.0), 3.0*dif+1.0, 0.2);
        ambient = 0.12;
    }
    else if (mat == SKIN)
    {
        dif = mix(pow(dif, 2.0), dif, 0.2);
        
        float df = smoothstep(3.0*CORE_RADIUS, CORE_RADIUS*1.5, length(p));
        col = mix(col, vec3(0.8,0.4,0), df*(1.0-heartBeat));
    }
    
    if (mat == SKIN || mat == BULB)
    {
        dif *= softShadow(p, gl.light, 6.0);        
    }
        
    if (light) col = gray(col);
    
    col *= clamp(dif, ambient, 1.0);
    col *= getOcclusion(p, n);
    
   	if (mat == PUPL || mat == BULB)
    {
        col += vec3(pow(clamp01(smoothstep(0.9,1.0,dot(n, l))), 0.8));
    }
    else if (mat == SKIN)
    {
        col += col*vec3(pow(clamp01(smoothstep(0.25,1.0,dot(n, l))), 2.0));
        col += 0.5*col*vec3(pow(clamp01(smoothstep(0.5,0.55,dot(n, l))), 11.8));
        col += vec3(pow(clamp01(smoothstep(0.989,1.0,dot(n, l))), 0.5));
    }
    
    if (light) col = clamp(col, 0.0, 1.0);
    return col;
}

// 00     00   0000000   000  000   000
// 000   000  000   000  000  0000  000
// 000000000  000000000  000  000 0 000
// 000 0 000  000   000  000  000  0000
// 000   000  000   000  000  000   000

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    initGlobal(fragCoord, iResolution, iMouse, iTime);
    gl.zero = ZERO;
    for (int i = KEY_1; i <= KEY_9; i++) { if (keyDown(i)) { gl.option = i-KEY_1+1; break; } }
    
    rotate =  keyState(KEY_R);
    anim   =  keyState(KEY_RIGHT);
    occl   =  keyState(KEY_UP);
    dither =  keyState(KEY_D);
    normal = !keyState(KEY_N);
    depthb = !keyState(KEY_Z);
    light  = !keyState(KEY_LEFT);
    soft   = !keyState(KEY_DOWN);
    
    calcAnim();
    
    vec3 cols = v0, col = v0;
    
    if (!soft) AA = 1; 
    
   	vec2 ao = vec2(0);
    
    float md = CAM_DIST;
    
    float mx = -gl.mp.x*2.0;
    float my = -gl.mp.y*2.0;
    
    if (rotate) 
    {
        mx += 0.15*iTime;
        my += 0.15*sin(iTime*0.6);
    }
        
    camTgt = v0; 
    camPos = rotAxisAngle(rotAxisAngle(vec3(0,0,md), vx, 89.0*my), vy, -90.0*mx);
    camDir = normalize(camTgt-camPos);
        
    vec3 cr = cross(camDir, vec3(0,1,0));
    vec3 up = normalize(cross(cr,camDir));
    gl.light = (-0.2*cr + 0.5*up -camDir)*md; 
    
    vec3 uu = normalize(cross(camDir, vy));
    vec3 vv = normalize(cross(uu, camDir));
    
    float fov = 4.0;
    if (gl.option > 3) fov += float(gl.option);
    
    for (int am=ZERO; am<AA; am++)
    for (int an=ZERO; an<AA; an++)
    {
        if (AA > 1) ao = vec2(float(am),float(an))/float(AA)-0.5;

        gl.uv = (2.0*(fragCoord+ao)-iResolution.xy)/iResolution.y;
    
        if (length(gl.uv) < 1.0)
        {
            vec3 rd = normalize(gl.uv.x*uu + gl.uv.y*vv + fov*camDir);
            float d = rayMarch(camPos, rd);
            int mat = gl.sdf.mat;
            float dst = d;
            vec3  p = camPos + d * rd;
            vec3  n = getNormal(p);
            
            if (normal || depthb)
            {
                vec3 nc = normal ? mat == NONE ? black : n : white;
                vec3 zc = depthb ? vec3(1.0-clamp01(0.5+(dst-CAM_DIST)/6.0)) : white;
                col = nc*zc;
            }
            else
                col = getLight(p, n, mat);
        }
        else
        {
            col = BG_COLOR;
        }
        cols += col;
    }
    col = cols/float(AA*AA);
    
    #ifndef TOY
    col += vec3(print(0, 0, vec4(iFrameRate, bgH, bgS, bgL)));
    
    // col += vec3(print(0, 3, iv26(vx)));
    // col += vec3(print(0, 2, iv26(vy)));
    // col += vec3(print(0, 1, iv26(vz)));
    // col += vec3(print(0, 6, iv26(-vx-vy+vz)));
    // col += vec3(print(0, 5, iv26(-vz-vx)));
    // col += vec3(print(0, 4, iv26(-vy-vz)));
    
    // col += vec3(print(0, 8, id26(-vx+vy+vz)));
    // col += vec3(print(0, 7, id26(-vx+vy-vz)));
    // col += vec3(print(0, 6, id26(-vx-vy+vz)));
    // col += vec3(print(0, 5, id26(-vx-vy-vz)));
    // col += vec3(print(0, 4, id26(vx+vy+vz)));
    // col += vec3(print(0, 3, id26(vx+vy-vz)));
    // col += vec3(print(0, 2, id26(vx-vy+vz)));
    // col += vec3(print(0, 1, id26(vx-vy-vz)));
    
    // col += vec3(print(0, 12, id26(-vy+vz)));
    // col += vec3(print(0, 11, id26(-vy-vz)));
    // col += vec3(print(0, 10, id26( vy+vz)));
    // col += vec3(print(0,  9, id26( vy-vz)));
    // col += vec3(print(0, 8, id26(-vx+vy)));
    // col += vec3(print(0, 7, id26(-vx-vy)));
    // col += vec3(print(0, 6, id26(-vx+vz)));
    // col += vec3(print(0, 5, id26(-vx-vz)));
    // col += vec3(print(0, 4, id26( vx+vy)));
    // col += vec3(print(0, 3, id26( vx-vy)));
    // col += vec3(print(0, 2, id26( vx+vz)));
    // col += vec3(print(0, 1, id26( vx-vz)));
    #endif
    
    if (dither)
    {
        float dit = gradientNoise(fragCoord.xy);
        col -= vec3(dit/256.0);
    }
    
    col  = pow(col, vec3(1.0/2.2));
    
    col *= vec3(smoothstep(1.8, 0.5, length(gl.uv)/max(gl.aspect,1.0)));
    
    fragColor = vec4(col,1.0);
}