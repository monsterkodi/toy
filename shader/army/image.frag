#define keys(x,y)  texelFetch(iChannel0, ivec2(x,y), 0)
bool keyState(int key) { return keys(key, 2).x < 0.5; }
bool keyDown(int key)  { return keys(key, 0).x > 0.5; }

#define ZERO min(iFrame,0)
#define CAM_DIST   25.0
#define MAX_STEPS  256
#define MIN_DIST   0.001
#define MAX_DIST   260.0

#define NONE 0
#define FLOR 1
#define SKIN 2
#define DBLU 3
#define LBLU 4
#define BLCK 5

Mat[5] material = Mat[5](
    //  hue   sat  lum    shiny  glossy
    Mat(0.5,  0.0, 0.005, 0.0,   0.0 ), // FLOR
    Mat(0.05, 1.0, 1.0,   0.3,   0.5 ), // SKIN
    
    Mat(0.67, 0.5, 0.25,  0.1,   0.0 ), 
    Mat(0.67, 1.0, 0.75,  0.3,   0.6 ),
    Mat(0.5,  0.0, 0.01,  0.0,   0.0 )
);

bool space, anim, soft, occl, light, dither, foggy, rotate, normal, depthb;

// 00     00   0000000   00000000   
// 000   000  000   000  000   000  
// 000000000  000000000  00000000   
// 000 0 000  000   000  000        
// 000   000  000   000  000        

void dummy(vec2 id)
{
    vec3 bp = -vz*0.3 + sin(iTime*5.0)*0.2*vy;
    vec3 hp = bp+1.8*vz+vy*(1.8+0.2*sin(id.x*0.08+0.07*id.y+iTime*4.0));
    
    float boxDist = sdBox(bp, vec3(1), 0.5);
    if (gl.sdf.dist < boxDist - 1.5) { return; }
    
    float d = sdCapsule (hp-0.5*vy, hp+0.5*vy, 1.0);          // head
    d = opDiff(d, sdLine(hp+vz*0.6+vy*0.5, vx, 0.32), 0.2);   // eyes
    sdMat(SKIN, d);                                           // head
    sdMat(LBLU, sdCylinder(bp-vx*1.5+vy, bp+vx*1.5+vy,  0.6, 0.5)); // shoulder
    sdMat(LBLU, sdCylinder(bp-vx+vy,     bp+vx+vy,     1.0, 0.5));  // neck
    sdMat(DBLU, boxDist);                // body
    
    vec3 lap = bp+1.25*vy-1.75*vx -smoothstep(-0.6, 0.6, cos(iTime*5.0+PI))*0.1*vy;
    vec3 rap = bp+1.25*vy+1.75*vx -smoothstep(-0.6, 0.6, cos(iTime*5.0))*0.1*vy;
    
    sdMat(LBLU, sdCylinder(lap,lap-1.6*vy, 0.4, 0.35)); // larm
    sdMat(LBLU, sdCylinder(rap,rap-1.6*vy, 0.4, 0.35)); // rarm
    sdMat(SKIN, sdSphere  (lap-2.25*vy, 0.75)); // lhand
    sdMat(SKIN, sdSphere  (rap-2.25*vy, 0.75)); // rhand
    
    sdMat(BLCK, sdCapsule(lap-2.25*vy-0.2*vx, lap-(2.25+0.25*smoothstep(-0.2, 0.3, sin(id.x*0.08+0.07*id.y+iTime*4.0)))*vy-0.2*vx+2.9*vz, 0.25)); // baton
        
    vec3 llp = bp-(1.0-0.4*max(0.0,sin(iTime*5.0)))*vy-0.75*vx -cos(iTime*5.0)*0.2*vz;
    vec3 rlp = bp-(1.0-0.4*max(0.0,sin(iTime*5.0+PI)))*vy+0.75*vx -cos(iTime*5.0+PI)*0.2*vz;
    
    sdMat(LBLU,  sdCylinder(llp,    llp-vy,     0.5, 0.25)); // leg
    sdMat(LBLU,  sdCylinder(rlp,    rlp-vy,     0.5, 0.25)); // leg
    sdMat(DBLU,  sdBox     (llp-1.5*vy+vz*0.25, vec3(0.35,0.25,0.70), 0.5)); // foot
    sdMat(DBLU,  sdBox     (rlp-1.5*vy+vz*0.25, vec3(0.35,0.25,0.70), 0.5)); // foot
        
    sdMat(BLCK, sdBox(bp+1.5*vy-1.75*vz, vec3(0.75,0.75,0.1), 0.5)); // rucksack
}

float map(vec3 p)
{
    float rep = 10.0;
    vec2 id = vec2(round(p.x/rep)*rep, round(p.z/rep)*rep);
    vec3 q = p-vec3(id.x, 0, id.y);

    gl.sdf = SDF(MAX_DIST, q, NONE);
    
    if (cam.pos.y > -3.25) sdMat(FLOR, sdPlane(-3.25*vy, vy));
    
    dummy(id);
    
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
    float shade = 1.0;
    float dist = MIN_DIST;    
    vec3 rd = (lp-ro);
    float end = max(length(rd), MIN_DIST);
    float stepDist = end/25.0;
    rd /= end;
    for (int i = ZERO; i < 25; i++)
    {
        float h = map(ro+rd*dist);
        shade = min(shade, k*h/dist);
        dist += clamp(h, 0.02, stepDist*2.0);
        if (h < 0.0 || dist > end) break; 
    }
    return min(max(shade, 0.0)+gl.shadow, 1.0); 
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
    if (mat == NONE) return black;
    
    Mat m = material[mat-1];

    vec3 fakeL2 = vec3(p.x, gl.light2.yz);
    
    vec3  col = hsl(m.hue, m.sat, m.lum);
    float dl1 = dot(n,normalize(gl.light1-p));
    float dl2 = dot(n,normalize(fakeL2-p));
    float dnl = max(dl1, dl2);
    
    col  = (light) ? gray(col) : col;
    
    col *=  clamp(pow(dnl, 1.0+m.shiny*20.0), gl.ambient, 1.0) * 
            softShadow(p, gl.light1, 6.0) * 
            softShadow(p, fakeL2, 6.0) * 
            getOcclusion(p, n);
            
    col += pow(m.glossy, 3.0)*vec3(pow(smoothstep(0.0+m.glossy*0.9, 1.0, dnl), 1.0+40.0*m.glossy));
    
    return clamp01(col);
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
    normal = !keyState(KEY_X);
    depthb = !keyState(KEY_Z);
    light  = !keyState(KEY_LEFT);
    soft   = !keyState(KEY_DOWN);
    space  = !keyState(KEY_SPACE);
    foggy  =  keyState(KEY_F);
    
    vec3 cols = v0, col = v0;
    
    int AA = (soft) ? 2 : 1;
    
    vec2 ao = vec2(0);
            
    initCam(CAM_DIST+(rotate ? CAM_DIST*(sin(iTime*0.15)*0.5+0.5) : 0.0), 
            (iMouse.z > 0.0 ? -gl.mp : (rotate ? vec2(2.0+0.5*cos(iTime*0.15), 0.25+0.0625*sin(iTime*0.3)) : -gl.mp)));
    
    #ifndef TOY
    if (space) lookAtFrom(iCenter, iCamera);
    #endif
    
    gl.light1 = cam.pos + 5.0*vy - 3.0*vx;
    gl.light2 = vec3(0.0, 20.0, -10.0+60.0*(sin(iTime*0.3)*0.5+0.5));
    
    if (gl.option > 3) cam.fov += float(gl.option);
    
    for (int am=ZERO; am<AA; am++)
    for (int an=ZERO; an<AA; an++)
    {
        if (AA > 1) ao = vec2(float(am),float(an))/float(AA)-0.5;

        gl.uv = (2.0*(fragCoord+ao)-iResolution.xy)/iResolution.y;
    
        vec3 rd = normalize(gl.uv.x*cam.x + gl.uv.y*cam.up + cam.fov*cam.dir);
        float d = rayMarch(cam.pos, rd);
        int mat = gl.sdf.mat;
        float dst = d;
        vec3  p = cam.pos + d * rd;
        vec3  n = getNormal(p);
        
        if (normal || depthb)
        {
            vec3 nc = normal ? mat == NONE ? black : n : white;
            vec3 zc = depthb ? vec3(1.0-pow(dst/MAX_DIST,0.1)) : white;
            col = nc*zc;
        }
        else
        {
            col = getLight(p, n, mat);
            if (foggy) col = mix(col, vec3(0.005), smoothstep(MAX_DIST*0.1, MAX_DIST*0.5, d));
        }

        cols += col;
    }
    col = cols/float(AA*AA);
    
    #ifndef TOY
    col += vec3(print(0,0,iFrameRate));
    #endif    
    
    fragColor = postProc(col, dither, true, true);
}