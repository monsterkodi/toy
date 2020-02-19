#define keys(x,y)  texelFetch(iChannel0, ivec2(x,y), 0)
bool keyState(int key) { return keys(key, 2).x < 0.5; }
bool keyDown(int key)  { return keys(key, 0).x > 0.5; }

#define ZERO min(iFrame,0)
#define CAM_DIST   6.0
#define MAX_STEPS  256
#define MIN_DIST   0.001
#define MAX_DIST   20.0
#define HEX_DIST   5.0

#define NONE 0
#define HEXA 1
#define GLOW 2

Mat[2] material = Mat[2](
    //  hue   sat  lum    shiny  glossy
    Mat(0.67, 1.0, 0.6,   0.3,   0.9 ),
    Mat(0.33, 1.0, 0.5,   0.1,   1.0 )
);

bool space, anim, soft, occl, light, dither, foggy, rotate, normal, depthb;

float hash(float n) { return fract(cos(n)*45758.5453); }
mat2  rot2(float a) { vec2 v = sin(vec2(1.570796, 0) + a); return mat2(v, -v.y, v.x); }

float at;
vec2 hexid;

// 000   000  00000000  000   000   0000000   
// 000   000  000        000 000   000   000  
// 000000000  0000000     00000    000000000  
// 000   000  000        000 000   000   000  
// 000   000  00000000  000   000  000   000  

float shoreDist(vec3 p)
{
    float ll = length(p.xz);
    return max(0.03+0.06*clamp01(p.y-3.0), ll-2.8);
}

float mountain(vec2 p)
{
    vec2 po = p-vec2(-0.5,0.5);
    return 0.1+0.6*dot(cos(po), cos(po))*(1.2-length(p)/2.6);
}

float hexHeight(vec2 p)
{
    float t = iTime*2.0;
    float shore = length(p);
    if (shore > 2.6) return 0.08 + sin(t+p.x)*0.02 + cos(t+p.y)*0.02;
    vec2 po = p-vec2(-0.5,0.5);
    return 0.15+(sin(iTime*1.2+PI/(2.0+length(p)))*0.5+0.75)*0.6*dot(cos(po), cos(po))*(1.2-shore/2.6);
}
 
// 00000000  000  00000000  000      0000000    
// 000       000  000       000      000   000  
// 000000    000  0000000   000      000   000  
// 000       000  000       000      000   000  
// 000       000  00000000  0000000  0000000    

void field()
{
    vec3 a = gl.sdf.pos;
    vec2 p = a.xz;
    
    float rd = 0.25;
    vec2 s = vec2(0.8660254, 1);

        
    float fy = 0.8660254;
    float ry = fy*rd;
    float rx = rd*1.5;
    float dy = ry*2.0;
    s = vec2(rd*1.5, dy);
    
    vec2 c1, c2, c3;
    vec2 fps = floor(p/s);
    bool odd = mod(fps.x,2.0) >= 1.0;
    if (odd) fps.y += 0.5;
    
    c1 = fps*s;
    
    if (odd)
    {
        c2 = c1+vec2(rx,-ry);
        c3 = c1+vec2(rx, ry);
    }
    else
    {
        c2 = c1+vec2( 0, dy);
        c3 = c1+vec2(rx, ry);
    }
    
    vec2  r1 = p - c1;
    vec2  r2 = p - c2;
    vec2  r3 = p - c3;
          
    float h1 = hexHeight(c1);
    float h2 = hexHeight(c2);
    float h3 = hexHeight(c3);
    
    float d1 = sdHexagon(vec3(r1.x,a.y-h1,r1.y), v0, vec3(rd*fy,h1,0.05));
    float d2 = sdHexagon(vec3(r2.x,a.y-h2,r2.y), v0, vec3(rd*fy,h2,0.05));
    float d3 = sdHexagon(vec3(r3.x,a.y-h3,r3.y), v0, vec3(rd*fy,h3,0.05));

    float d = min(min(d1,d2), d3);
    
    if (gl.march)
    {
        if      (d1 == d) hexid = c1;
        else if (d2 == d) hexid = c2;
        else if (d3 == d) hexid = c3;
    }
    
    sdMat(HEXA, d);
}

// 00     00   0000000   00000000   
// 000   000  000   000  000   000  
// 000000000  000000000  00000000   
// 000 0 000  000   000  000        
// 000   000  000   000  000        

float map(vec3 p)
{
    float t = sin(iTime)*0.5+0.5;
    
    gl.sdf = SDF(MAX_DIST, p, NONE);
    
    field();
    
    if (gl.march) { 
        sdMat(GLOW, sdSphere(gl.light3, 0.1));
        sdMat(GLOW, sdSphere(gl.light2, 0.1));
        sdMat(GLOW, sdSphere(gl.light1, 0.1));
    }
    
    return gl.sdf.dist;
}

// 00     00   0000000   00000000    0000000  000   000  
// 000   000  000   000  000   000  000       000   000  
// 000000000  000000000  0000000    000       000000000  
// 000 0 000  000   000  000   000  000       000   000  
// 000   000  000   000  000   000   0000000  000   000  

float march(in vec3 ro, in vec3 rd)
{
    float t = 0.0, d;
    for(int i = ZERO; i < MAX_STEPS; i++)
    {
        vec3 p = ro+rd*t;
        gl.rd = rd;
        d = map(p);
        t += min(d, shoreDist(p));
        if (d < MIN_DIST) return t;
        if (t > MAX_DIST) break;
    }
    gl.sdf.mat = NONE;
    return min(t, MAX_DIST);
}

vec3 getNormal(vec3 p)
{
    vec3 n = v0;
    for (int i=ZERO; i<4; i++) {
        vec3 e = 0.5773*(2.0*vec3((((i+3)>>1)&1),((i>>1)&1),(i&1))-1.0);
        n += e*map(p+e*0.0001); }
    return normalize(n);
}

//  0000000   00     00  0000000    000  00000000  000   000  000000000    
// 000   000  000   000  000   000  000  000       0000  000     000       
// 000000000  000000000  0000000    000  0000000   000 0 000     000       
// 000   000  000 0 000  000   000  000  000       000  0000     000       
// 000   000  000   000  0000000    000  00000000  000   000     000       

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

vec3 getLight(vec3 p, vec3 n, int mat, float d)
{
    if (mat == NONE) return black;
    if (mat == GLOW) return white;
    
    Mat m = material[mat-1];

    vec3 bn = dither ? bumpMap(p, n, 0.003) : n;

    if (p.y > 0.25)
    {
        m.lum = 0.6+pow(mountain(hexid)*1.4, 2.0);
        m.hue = sin(iTime*0.1)*0.5+0.5;
    }
    
    vec3  col = hsl(m.hue, m.sat, m.lum);
    
    float dl1 = dot(bn,normalize(gl.light1-p));
    float dl2 = dot(bn,normalize(gl.light2-p));
    float dl3 = dot(bn,normalize(gl.light3-p));
    float dnl = max(max(dl1, dl2), dl3);
    
    col  = (light) ? gray(col) : col;
    
    col += pow(m.glossy, 3.0)*vec3(pow(smoothstep(0.0+m.glossy*0.9, 1.0, dnl), 1.0+40.0*m.glossy));
    col *= clamp(pow(dnl, 1.0+m.shiny*20.0), gl.ambient, 1.0) * getOcclusion(p, n);

    if (p.y < 0.25)
    {
        d = 1.0-length(hexid)/HEX_DIST;
        col *= smoothstep(0.04, 0.3, d);
        col *= clamp01(pow(p.y*4.0, 1.5));
    }
        
    return clamp01(col);
}

// 00     00   0000000   000  000   000  
// 000   000  000   000  000  0000  000  
// 000000000  000000000  000  000 0 000  
// 000 0 000  000   000  000  000  0000  
// 000   000  000   000  000  000   000  

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    initGlobal(fragCoord, iResolution, iMouse, iTime);
    gl.zero = ZERO;
    gl.shadow = 0.5;
    for (int i = KEY_1; i <= KEY_9; i++) { if (keyDown(i)) { gl.option = i-KEY_1+1; break; } }
    
    rotate =  keyState(KEY_R);
    anim   =  keyState(KEY_RIGHT);
    occl   =  keyState(KEY_UP);
    dither =  keyState(KEY_D);
    normal = !keyState(KEY_X);
    depthb = !keyState(KEY_Z);
    light  = !keyState(KEY_LEFT);
    space  =  keyState(KEY_SPACE);
    foggy  =  keyState(KEY_F);
    
    if (anim) at = 0.5*iTime;
    
    initCam(CAM_DIST, vec2(0));
    
    lookAtFrom(vec3(0.5*0.25,-0.5*0.25,0), vec3(0,3.0,CAM_DIST));
    if (rotate)
        orbitYaw(-at*10.0);
            
    if (iMouse.z > 0.0)
        lookAtFrom(vec3(0.5*0.25,-0.5*0.25,0), rotAxisAngle(vec3(0,3.0,CAM_DIST-2.5*gl.mp.y), vy, gl.mp.x*90.0));
        
    #ifndef TOY
    if (space) lookAtFrom(iCenter, iCamera);
    #endif
    
    gl.uv = (2.0*fragCoord-iResolution.xy)/iResolution.y;
    vec3 rd = normalize(gl.uv.x*cam.x + gl.uv.y*cam.up + cam.fov*cam.dir);
    
    gl.light1 = vy*(1.5+0.7*(sin(iTime*1.2+PI/1.0))) - 2.25*vx - 1.3*vz;
    gl.light2 = vy*(1.5+0.7*(sin(iTime*1.2+PI/2.0))) + 1.14*vx - 1.08*vz;
    gl.light3 = vy*(1.5+0.7*(sin(iTime*1.2+PI/3.0))) + 1.14*vx + 1.98*vz;
    
    hexid = vec2(0);
    gl.march = true;
    float d = march(cam.pos, rd);
    gl.march = false;
    int mat = gl.sdf.mat;
    vec3  p = cam.pos + d * rd;
    vec3  n = getNormal(p);
    vec3  col = v0;
           
    if (normal || depthb)
    {
        vec3 nc = normal ? d >= MAX_DIST ? black : n : white;
        vec3 zc = depthb ? vec3(1.0-pow(d/MAX_DIST,0.1)) : white;
        col = nc*zc;
    }
    else
    {
        col = getLight(p, n, mat, d);
    }
        
    #ifndef TOY
    col += vec3(print(0,0,vec2(iFrameRate, iTime)));
    #endif    

    fragColor = vec4(sqrt(clamp(col, 0., 1.)), 1.0);
}