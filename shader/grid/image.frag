/*
 0000000   00000000   000  0000000      
000        000   000  000  000   000    
000  0000  0000000    000  000   000    
000   000  000   000  000  000   000    
 0000000   000   000  000  0000000      
*/

KEYS
PRINT
TIME

#define MAX_STEPS 512
#define MIN_DIST  0.005
#define MAX_DIST  1000.0

#define NONE   0
#define RED    1
#define GREEN  2
#define BLUE   3
#define HEAD   4
#define PLANE  5

int mat;
bool space, anim, soft, occl, light, dither, foggy, rotate, normal, depthb;
vec3 camPos;
vec3 camTgt;
vec3 camDir;

//  0000000  0000000    
// 000       000   000  
// 0000000   000   000  
//      000  000   000  
// 0000000   0000000    

void sdCoords()
{
    if (gl.pass == PASS_SHADOW) return; 
    float r = 0.04;
    sdMat(RED,   sdCapsule(v0, vx*MAX_DIST, r));
    sdMat(GREEN, sdCapsule(v0, vy*MAX_DIST, r));
    sdMat(BLUE,  sdCapsule(v0, vz*MAX_DIST, r));
}

void sdFloor(float h)
{
    if (cam.pos.y > h) sdMat(PLANE, sdPlane(vy*h, vy));
}

// 00     00   0000000   00000000   
// 000   000  000   000  000   000  
// 000000000  000000000  00000000   
// 000 0 000  000   000  000        
// 000   000  000   000  000        

float map(vec3 p)
{
    sdf = SDF(1000.0, p, NONE);
    
    sdFloor(-2.0);
    sdCoords();
    sdMat(HEAD,  sdCube(v0, iRange(1.0, 2.0), iRange(0.0, 2.0)));
    sdMat(HEAD,  sdBox(vy*4.0, normalize(vec3(0, iRange(0.0, 2.0), 1.0-iRange(0.0, 2.0))), vx, vec3(iRange(1.0, 1.2)), iRange(0.0, 2.0)));
    if (gl.pass == PASS_MARCH) sdMat(RED, sdSphere(gl.light1, 0.5));
    
    return sdf.dist;
}

NORMAL
MARCH

//  0000000  000   000   0000000   0000000     0000000   000   000  
// 000       000   000  000   000  000   000  000   000  000 0 000  
// 0000000   000000000  000000000  000   000  000   000  000000000  
//      000  000   000  000   000  000   000  000   000  000   000  
// 0000000   000   000  000   000  0000000     0000000   00     00  

float hardShadow(vec3 ro, vec3 lp, vec3 n)
{
    gl.pass = PASS_SHADOW;  
    ro += n*MIN_DIST*2.0;
    vec3 rd = normalize(lp-ro);
    for (float t=float(gl.zero); t<MAX_DIST;)
    {
        float h = map(ro+rd*t);
        if (h < MIN_DIST) return gl.shadow;
        t+=h;
    }
    return 1.0;
}

float softShadow(vec3 ro, vec3 lp, vec3 n, float k)
{
    gl.pass = PASS_SHADOW;  
    ro += n*MIN_DIST*2.0;
    float shade = 1.0;
    vec3 rd = lp-ro;
    float end = max(length(rd), MIN_DIST);
    rd = normalize(rd);
    for (float t=float(gl.zero); t<end;)
    {
        float h = map(ro+rd*t);
        shade = min(shade, k*h/(t/k));
        t += min(h, 0.1*k);
        if (h < MIN_DIST) return gl.shadow;
    }
    return clamp(shade, gl.shadow, 1.0); 
}

// 000      000   0000000   000   000  000000000  
// 000      000  000        000   000     000     
// 000      000  000  0000  000000000     000     
// 000      000  000   000  000   000     000     
// 0000000  000   0000000   000   000     000     

float getLight(vec3 p, vec3 n)
{
    vec3 cr = cross(camDir, vec3(0,1,0));
    vec3 up = normalize(cross(cr,camDir));
    vec3 l = normalize(gl.light1-p);
 
    float ambient = 0.005;
    float dif = clamp(dot(n,l), 0.0, 1.0);
    if (mat == HEAD)
    {
        dif = pow(dif, 4.0);
    }
    // dif *= hardShadow(p, gl.light1, n);
    dif *= softShadow(p, gl.light1, n, 2.0);
    return clamp(dif, ambient, 1.0);
}

// 00     00   0000000   000  000   000  
// 000   000  000   000  000  0000  000  
// 000000000  000000000  000  000 0 000  
// 000 0 000  000   000  000  000  0000  
// 000   000  000   000  000  000   000  

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{    
    initGlobal(fragCoord, iResolution, iMouse, iTime, iFrame);
    gl.shadow = 0.0;
    gl.light1 = (vy + vx)*15.0;
    
    rotate = !keyState(KEY_R);
    anim   =  keyState(KEY_P);
    occl   =  keyState(KEY_UP);
    dither =  keyState(KEY_D);
    normal = !keyState(KEY_X);
    depthb = !keyState(KEY_Z);
    light  = !keyState(KEY_L);
    space  =  keyState(KEY_SPACE);
    foggy  =  keyState(KEY_F);
            
    vec2 uv = (fragCoord-.5*iResolution.xy)/iResolution.y;
    vec3 ct;
    
    float aspect = iResolution.x/iResolution.y;
    
    float md = 25.0;
    float mx = 2.0*(iMouse.x/iResolution.x-0.5);
    float my = 2.0*(iMouse.y/iResolution.y-0.5);
    
    if (iMouse.z <= 0.0 && rotate)
    {
        float ts = 276.2;
        mx = 0.3*sin(ts+iTime/12.0);
        my = -0.20-0.10*cos(ts+iTime/8.0);
    }
    
    camTgt = vec3(0,1.2,0); 

    camPos = rotAxisAngle(rotAxisAngle(vec3(0,0,-md), vx, 89.0*my), vy, 180.0*mx);
        
    camDir = normalize(camTgt-camPos);
    
    vec3 ww = normalize(camTgt-camPos);
    vec3 uu = normalize(cross(ww, vec3(0,1,0)));
    vec3 vv = normalize(cross(uu, ww));
        
    vec3 rd = normalize(uv.x*uu + uv.y*vv + ww);

    float d = march(camPos, rd);
    mat = sdf.mat;
    
    vec3  p = camPos + d * rd;
    vec3  n = getNormal(p);
        
    vec3 col;
    
    if (mat == NONE)  
    {
        vec2 guv = fragCoord.xy - iResolution.xy / 2.;
        float grid = dot(step(mod(guv.xyxy, vec4(10,10,100,100)), vec4(1)), vec4(.5, .5, 1., 1.));
        col = mix(vec3(.001), vec3(0.02,0.02,0.02), grid);
    }
    else 
    {
        switch (mat) 
        {
         case RED:   col = red;   break;
         case GREEN: col = green; break;
         case BLUE:  col = blue;  break;
         case HEAD:  col = vec3(0.1); break;
         case PLANE: col = vec3(0.5); break;
        }
        
        col  = (light) ? gray(col) : col;
        
        if (normal || depthb)
        {
            vec3 nc = normal ? d >= MAX_DIST ? black : n : white;
            vec3 zc = depthb ? vec3(1.0-pow(d/MAX_DIST,0.1)) : white;
            col = nc*zc;
        }
        else
        {
            col *= getLight(p,n);
        }
    }

    if (dither)
    {
        float dit = gradientNoise(fragCoord.xy);
        col += vec3(dit/1024.0);
    }
    
    col = mix(col, yellow, print(0,  0,  iFrameRate));
    col = mix(col, blue,   print(0,  1,  iTime     ));
    col = mix(col, green,  print(10, 0,  iMouse.y  ));
    col = mix(col, red,    print(10, 1,  iMouse.x  ));
    col = mix(col, green,  print(20, 0,  my        ));
    col = mix(col, red,    print(20, 1,  mx        ));

    if (iMouse.z > 0.0)
    {
        uv = (iMouse.xy-.5*iResolution.xy)/iResolution.y;
        rd = normalize(uv.x*uu + uv.y*vv + ww);
        d  = march(camPos, rd);
        if (d < MAX_DIST)
        {
            p = camPos + d * rd;
            col = mix(col, white, print(30, 0, d   ));
            col = mix(col, red,   print(30, 3, p.x ));
            col = mix(col, green, print(30, 2, p.y ));
            col = mix(col, blue,  print(30, 1, p.z ));
        }
    }
    
    col = pow(col, vec3(1.0/2.2));
    fragColor = vec4(col, 1.0);
}
