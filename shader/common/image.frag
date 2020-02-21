/*
 0000000   0000000   00     00  00     00   0000000   000   000  
000       000   000  000   000  000   000  000   000  0000  000  
000       000   000  000000000  000000000  000   000  000 0 000  
000       000   000  000 0 000  000 0 000  000   000  000  0000  
 0000000   0000000   000   000  000   000   0000000   000   000  
*/

KEYS
PRINT
TIME

#define NONE   0
#define HEAD   4
#define PLANE  5

// 00     00   0000000   00000000   
// 000   000  000   000  000   000  
// 000000000  000000000  00000000   
// 000 0 000  000   000  000        
// 000   000  000   000  000        

float map(vec3 p)
{
    sdStart(p);
    
    sdFloor(white, -2.0);
    sdAxes(0.1);
    sdMat(HEAD,  sdCube(v0, 1.0, 0.2));
    sdMat(HEAD,  sdCube(vy*10.0, 1.0, 0.2));
    // sdMat(HEAD,  sdCube(v0, iRange(1.0, 2.0), iRange(0.0, 2.0)));
    // sdMat(HEAD,  sdBox(vy*4.0, normalize(vec3(0, iRange(0.0, 2.0), 1.0-iRange(0.0, 2.0))), vx, vec3(iRange(1.0, 1.2)), iRange(0.0, 2.0)));
    
    if (gl.pass == PASS_MARCH) sdColor(white, sdSphere(gl.light1, 0.5));
    
    return sdf.dist;
}

NORMAL
MARCH

//  0000000  000   000   0000000   0000000     0000000   000   000  
// 000       000   000  000   000  000   000  000   000  000 0 000  
// 0000000   000000000  000000000  000   000  000   000  000000000  
//      000  000   000  000   000  000   000  000   000  000   000  
// 0000000   000   000  000   000  0000000     0000000   00     00  

float shadow(vec3 ro, vec3 lp, vec3 n, float softness)
{
    gl.pass = PASS_SHADOW; 
    
    float k = 1.0/softness;
    
    ro += n*gl.minDist*2.0;
    vec3 rd = lp-ro;
    float far = max(length(rd), gl.minDist);
    rd = normalize(rd);
    
    float shade = 1.0;
    for (float t=float(gl.zero); t<far;)
    {
        float h = map(ro+rd*t);
        if (h < gl.minDist) return 0.0; // gl.shadow;
        
        if (softness > 0.0001)
        {
            shade = min(shade, h/(t/k));
            t += min(h, 0.1);
        }
        else
        {
            t += h;
        }
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
    vec3 cr = cross(cam.dir, vec3(0,1,0));
    vec3 up = normalize(cross(cr,cam.dir));
    vec3 l = normalize(gl.light1-p);
 
    float ambient = 0.005;
    float dif = clamp(dot(n,l), 0.0, 1.0);
    dif *= shadow(p, gl.light1, n, iRange(0.0, 1.0, 0.1));
    // dif *= shadow(p, gl.light1, n, 0.0);
    return clamp(dif, ambient, 1.0);
}

vec3 getLight(vec3 p, vec3 n, SDF hit)
{
    vec3 col;
    
    switch (hit.mat) 
    {
        case -2:    col = hit.color;   break;
        case HEAD:  col = vec3(0.1); break;
        case PLANE: col = vec3(0.5); break;
        case NONE:  
        {
           vec2 guv = gl.frag.xy - iResolution.xy / 2.;
           float grid = dot(step(mod(guv.xyxy, vec4(10,10,100,100)), vec4(1)), vec4(.5, .5, 1., 1.));
           col = mix(vec3(.001), vec3(0.02,0.02,0.02), grid);
        }
    }
    
    col = (opt.colors) ? gray(col) : col;
    
    if (opt.normal || opt.depthb)
    {
        vec3 nc = opt.normal ? hit.dist >= gl.maxDist ? black : n : white;
        vec3 zc = opt.depthb ? vec3(1.0-pow(hit.dist/gl.maxDist,0.1)) : white;
        col = nc*zc;
    }
    else
    {
        col *= getLight(p,n);
    }
    
    return col;
}

// 00     00   0000000   000  000   000  
// 000   000  000   000  000  0000  000  
// 000000000  000000000  000  000 0 000  
// 000 0 000  000   000  000  000  0000  
// 000   000  000   000  000  000   000  

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{    
    initGlobal(fragCoord, iResolution, iMouse, iTime, iFrame);
    gl.light1 = (vy + vx)*15.0;
    
    opt.rotate = !keyState(KEY_R);
    opt.anim   =  keyState(KEY_P);
    opt.occl   =  keyState(KEY_UP);
    opt.dither = !keyState(KEY_D);
    opt.normal = !keyState(KEY_X);
    opt.depthb = !keyState(KEY_Z);
    opt.colors = !keyState(KEY_L);
    opt.space  = !keyState(KEY_SPACE);
    opt.foggy  =  keyState(KEY_F);
    opt.grid   =  keyState(KEY_G);
            
    float mx = 2.0*(iMouse.x/iResolution.x-0.5);
    float my = 2.0*(iMouse.y/iResolution.y-0.5);
    
    if (iMouse.z <= 0.0 && opt.rotate)
    {
        float ts = 276.2;
        mx = 0.3*sin(ts+iTime/12.0);
        my = -0.20-0.10*cos(ts+iTime/8.0);
    }
    
    initCam(v0, 25.0, mx, my);
    
    gl.uv = (2.0*fragCoord-iResolution.xy)/iResolution.y;
    vec3 rd = normalize(gl.uv.x*cam.x + gl.uv.y*cam.up + cam.fov*cam.dir);
    
    float d = march(cam.pos, rd);
    SDF hit = sdf;
    
    vec3 p = cam.pos + d * rd;
    vec3 n = getNormal(p);
        
    vec3 col = getLight(p, n, hit);

    if (opt.dither)
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
        gl.uv = (iMouse.xy-.5*iResolution.xy)/iResolution.y;
        rd = normalize(gl.uv.x*cam.x + gl.uv.y*cam.up + cam.fov*cam.dir);
        
        d = march(cam.pos, rd);
        if (d < gl.maxDist)
        {
            p = cam.pos + d * rd;
            col = mix(col, white, print(30, 0, d   ));
            col = mix(col, red,   print(30, 3, p.x ));
            col = mix(col, green, print(30, 2, p.y ));
            col = mix(col, blue,  print(30, 1, p.z ));
        }
    }
    
    col = pow(col, vec3(1.0/2.2));
    fragColor = vec4(col, 1.0);
}
