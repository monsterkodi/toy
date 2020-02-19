// https://www.shadertoy.com/view/4lyGzR 'Biomine' by Shane

#define keys(x,y)  texelFetch(iChannel0, ivec2(x,y), 0)
bool keyState(int key) { return keys(key, 2).x < 0.5; }
bool keyDown(int key)  { return keys(key, 0).x > 0.5; }

#define ZERO min(iFrame,0)
#define CAM_DIST   0.01
#define MAX_STEPS  256
#define MIN_DIST   0.001
#define MAX_DIST   60.0

#define NONE 0
#define GYRO 1
#define HEAD 2
#define TAIL 3

bool space, anim, soft, occl, light, dither, foggy, rotate, normal, depthb;

float hash(float n) { return fract(cos(n)*45758.5453); }
mat2  rot2(float a) { vec2 v = sin(vec2(1.570796, 0) + a); return mat2(v, -v.y, v.x); }

float at;
int screen;

float noise3D(in vec3 p)
{
	const vec3 s = vec3(7, 157, 113);
	vec3 ip = floor(p); p -= ip; 
    vec4 h = vec4(0., s.yz, s.y + s.z) + dot(ip, s);
    p = p*p*(3. - 2.*p); 
    h = mix(fract(sin(h)*43758.5453), fract(sin(h + s.x)*43758.5453), p.x);
    h.xy = mix(h.xz, h.yw, p.y);
    return mix(h.x, h.y, p.z);
}

float drawSphere(in vec3 p)
{
    p = fract(p)-.5;    
    return dot(p, p);
}

float cellTile(in vec3 p)
{
    vec4 d; 
    d.x = drawSphere(p - vec3(.81, .62, .53)); p.xy = vec2(p.y-p.x, p.y + p.x)*.7071;
    d.y = drawSphere(p - vec3(.39, .2,  .11)); p.yz = vec2(p.z-p.y, p.z + p.y)*.7071;
    d.z = drawSphere(p - vec3(.62, .24, .06)); p.xz = vec2(p.z-p.x, p.z + p.x)*.7071;
    d.w = drawSphere(p - vec3(.2,  .82, .64));
    d.xy = min(d.xz, d.yw);
    return min(d.x, d.y)*2.66;
}

//  0000000   000   000  00000000    0000000   
// 000         000 000   000   000  000   000  
// 000  0000    00000    0000000    000   000  
// 000   000     000     000   000  000   000  
//  0000000      000     000   000   0000000   

void gyro()
{
    vec3 p = gl.sdf.pos;
    float d = dot(cos(p*PI2), sin(p.yzx*PI2)) + 1.25;

    sdMat(GYRO, d); 
}

// 00000000  000      000   000  00000000  00000000   
// 000       000       000 000   000       000   000  
// 000000    000        00000    0000000   0000000    
// 000       000         000     000       000   000  
// 000       0000000     000     00000000  000   000  

vec3 tailPos(float t) 
{
    t += at;
    return vec3(-t,0,0)+vz*(2.5+0.4*(1.35 + cos(1.7+t*PI2)))+vy*(0.05-0.5*(sin(-PI2+t*PI2)));
}

void flyer()
{
    vec3 tp = tailPos(-0.5/8.0);
    vec3 hp = tailPos( 1.0/8.0);
    float d = sdSphere(tp, 0.13);
    d = opUnion(d, sdCapsule(hp, tp, 0.05), 0.1);
    
    sdMat(HEAD, d); 
    
    float id = floor((gl.light1.x-gl.sdf.pos.x)*8.0);
    gl.sdf.pos.x = fract((gl.sdf.pos.x-gl.light1.x)*8.0);
    if (id < -1.0 && id > -30.0) 
    {
        tp = tailPos(id/8.0);
        d = min(d, sdEllipsoid(vec3(0.5,tp.yz), vec3(8.0,1,1)*(0.06*(1.0+id/30.0))));
    }
        
    sdMat(TAIL, d); 
}

// 00     00   0000000   00000000   
// 000   000  000   000  000   000  
// 000000000  000000000  00000000   
// 000 0 000  000   000  000        
// 000   000  000   000  000        

void distort(inout vec3 p) 
{
    if (iMouse.z < 1.0)
    p *= rotMat(normalize(cam.x), 0.6*length((p-cam.pos).yz));
}

float map(vec3 p)
{
    float t = sin(iTime)*0.5+0.5;
    
    distort(p);

    gl.sdf = SDF(MAX_DIST, p, NONE);
    
    gyro();
    
    if (gl.march) flyer(); 
    
    return gl.sdf.dist;
}

// 0000000    000   000  00     00  00000000   
// 000   000  000   000  000   000  000   000  
// 0000000    000   000  000000000  00000000   
// 000   000  000   000  000 0 000  000        
// 0000000     0000000   000   000  000        

float bumpSurf( in vec3 p)
{
    return cellTile(p*8.0)*2.0 + 0.1*noise3D(p*150.0);
}

vec3 doBumpMap(in vec3 p, in vec3 nor, float factor)
{
    distort(p);
    
    const vec2 e = vec2(0.001, 0);
    float ref = bumpSurf(p);                 
    vec3 grad = (vec3(bumpSurf(p - e.xyy),
                      bumpSurf(p - e.yxy),
                      bumpSurf(p - e.yyx))-ref)/e.x;                     
    grad -= nor*dot(nor, grad);          
    return normalize(nor + grad*factor);
}

// 00     00   0000000   00000000    0000000  000   000  
// 000   000  000   000  000   000  000       000   000  
// 000000000  000000000  0000000    000       000000000  
// 000 0 000  000   000  000   000  000       000   000  
// 000   000  000   000  000   000   0000000  000   000  

float march(in vec3 ro, in vec3 rd)
{
    float t = 0.0, h;
    for(int i = 0; i < 72; i++)
    {
        h = map(ro+rd*t);
        // if (abs(h)<0.002*(t*.125 + 1.) || t>MAX_DIST) break; 
        if (abs(h)<0.001*max(t*.25, 1.) || t>MAX_DIST) break;        
        t += step(h, 1.)*h*.2 + h*.5;
    }
    return min(t, MAX_DIST);
}

vec3 getNormal(in vec3 p) 
{
	const vec2 e = vec2(0.002, 0);
	return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy),	map(p + e.yyx) - map(p - e.yyx)));
}

//  0000000  000   000   0000000   0000000     0000000   000   000  
// 000       000   000  000   000  000   000  000   000  000 0 000  
// 0000000   000000000  000000000  000   000  000   000  000000000  
//      000  000   000  000   000  000   000  000   000  000   000  
// 0000000   000   000  000   000  0000000     0000000   00     00  

float softShadow(vec3 ro, vec3 rd, float start, float end, float k)
{
    float shade = 1.0;
    float dist = start;

    for (int i=0; i<16; i++)
    {
        float h = map(ro + rd*dist);
        shade = min(shade, k*h/dist);

        dist += clamp(h, 0.01, 0.25);
        
        if (h<0.001 || dist > end) break; 
    }
    return min(max(shade, 0.) + 0.1, 1.0); 
}

// 000      000   0000000   000   000  000000000  
// 000      000  000        000   000     000     
// 000      000  000  0000  000000000     000     
// 000      000  000   000  000   000     000     
// 0000000  000   0000000   000   000     000     

vec3 getLight(vec3 p, vec3 n, vec3 rd, float d)
{
    vec3 col = v0;
    vec3 frc = v0;
    
    float ff;
    
    vec3 p2l = gl.light1-p;
    float lightDist = length(p2l);
    float atten = pow(max(0.0, 1.0-lightDist/40.0), 6.0);
        
    int mat = gl.sdf.mat;
    
    switch (mat)
    {
        case GYRO: 
            col = vec3(1,0,0); 
            frc = vec3(0.8, 0.5, 0);
            n = doBumpMap(p, n, dither ? 0.006 : 0.008);
            ff = 32.0 * atten * atten * atten;
            break;
        case HEAD: 
        case TAIL: 
            col = vec3(1,0.5,0); 
            frc = vec3(1,0.5,0);
            ff = mat == HEAD ? 100.0 : 18.0;
            p2l -= cam.dir*0.2;
            break;
    }
    
    vec3 ln = normalize(p2l);
    
    float ambience = 0.01;
    float diff = max(dot(n, ln), 0.0);
    float spec = pow(max(dot(reflect(-ln, n), -rd), 0.0), 32.0);
    float fre  = pow(clamp(dot(n, rd) + 1.0, 0.0, 1.0), 1.0);
    
    float shading = softShadow(p, ln, 0.05, lightDist, 8.0);
    
    if (mat == GYRO) 
    {
        col *= diff + ambience + spec + frc*pow(fre,4.0)*ff;
        col *= atten*shading;
    }
    else if (mat == TAIL) 
    {
        col = col * (0.5 + diff + spec) + frc*pow(fre,4.0)*ff;
    }
    else
    {
        col += frc*pow(fre,4.0)*ff;
    }
    
    if (light) col = vec3(atten*shading*(diff + ambience + spec +pow(fre,4.0)*ff));
    else if (foggy) col = mix(vec3(0.001,0.0,0.0), col, 1.0/(1.0+d*d/MAX_DIST));
    
    return col;
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
    for (int i = KEY_1; i <= KEY_9; i++) { if (keyDown(i)) { gl.option = i-KEY_1+1; break; } }
    
    rotate =  keyState(KEY_R);
    anim   =  keyState(KEY_RIGHT);
    occl   =  keyState(KEY_UP);
    dither =  keyState(KEY_D);
    normal = !keyState(KEY_X);
    depthb = !keyState(KEY_Z);
    light  = !keyState(KEY_LEFT);
    space  = !keyState(KEY_SPACE);
    foggy  =  keyState(KEY_F);
	
    if (anim)
        at = 0.5*iTime;
    
    initCam(CAM_DIST, vec2(0));
    
    lookAtFrom(vec3(0,0,2.5), vec3(0,0,0));
    lookPan(vec3(-at,0,0));
    if (rotate)
        orbit(sin(at*1.0)*10.0, sin(at*0.5)*5.0);
            
    if (iMouse.z > 0.0)
        lookAtFrom(vec3(-at,0,2.5), vec3(-at,0,2.5) + rotAxisAngle(vec3(0,0,-2.5-1.5*gl.mp.y), vy, gl.mp.x*90.0));
        
    #ifndef TOY
    if (space) lookAtFrom(iCenter, iCamera);
    #endif
    
    gl.uv = (2.0*fragCoord-iResolution.xy)/iResolution.y;
    vec3 rd = normalize(gl.uv.x*cam.x + gl.uv.y*cam.up + cam.fov*cam.dir);
    
    gl.light1 = vec3(-at,0,0)+vz*(2.5+0.4*(1.35 + cos(1.7+at*PI2)))+vy*(0.35-0.5*(sin(-PI2+at*PI2)));
    
    gl.march = true;
    float d = march(cam.pos, rd);
    vec3  p = cam.pos + d * rd;
    vec3  n = getNormal(p);
    vec3  col = v0;
    gl.march = false;
           
    if (normal || depthb)
    {
        vec3 nc = normal ? d >= MAX_DIST ? black : n : white;
        vec3 zc = depthb ? vec3(1.0-pow(d/MAX_DIST,0.1)) : white;
        col = nc*zc;
    }
    else
    {
        col = getLight(p, n, rd, d);
    }
        
    #ifndef TOY
    col += vec3(print(0,0,vec2(iFrameRate, iTime)));
    #endif    

    fragColor = vec4(sqrt(clamp(col, 0., 1.)), 1.0);
}