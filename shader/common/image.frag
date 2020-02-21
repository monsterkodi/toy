/*
 0000000   0000000   00     00  00     00   0000000   000   000  
000       000   000  000   000  000   000  000   000  0000  000  
000       000   000  000000000  000000000  000   000  000 0 000  
000       000   000  000 0 000  000 0 000  000   000  000  0000  
 0000000   0000000   000   000  000   000   0000000   000   000  
*/

KEYS
PRINT

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
    sdMat(HEAD,  sdCube(v0, iRange(1.0, 2.0), iRange(0.0, 2.0)));
    sdMat(HEAD,  sdBox(vy*5.0, vx, rotAxisAngle(vy, vx, iRange(0.0,360.0)), vec3(iRange(1.5, 1.0)), iRange(0.2, 0.1)));
    sdMat(HEAD,  sdBox(vy*10.0, rotAxisAngle(vx, vy, iRange(0.0,360.0)), vy, vec3(1), iRange(0.0, 0.5)));
    
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

float shadowFade(float t, float shade)
{
    shade = max(1.0-pow(1.0-t/gl.maxDist, gl.shadow.power*gl.shadow.soft), shade);
    return gl.shadow.bright + shade * (1.0-gl.shadow.bright);
}

float shadow(vec3 ro, vec3 lp, vec3 n)
{
    gl.pass = PASS_SHADOW; 
    
    ro += n*gl.minDist*2.0;
    vec3 rd = lp-ro;
    float far = max(length(rd), gl.minDist);
    rd = normalize(rd);
    
    float shade = 1.0;
    float sd = 0.0;
    for (float t=float(gl.zero); t<far;)
    {
        float d = map(ro+rd*t);
        if (d < gl.minDist) { shade = 0.0; break; }
        
        if (gl.shadow.soft > 0.01)
        {
            float newShade = d/(t*gl.shadow.soft*0.1);
            if (newShade < shade)
            {
                sd = t;
                shade = newShade;
            }
            t += min(d, 0.1);
        }
        else
        {
            t += d;
        }
    }
    return shadowFade(sd, shade);
}

// 000      000   0000000   000   000  000000000  
// 000      000  000        000   000     000     
// 000      000  000  0000  000000000     000     
// 000      000  000   000  000   000     000     
// 0000000  000   0000000   000   000     000     

float diffuse(vec3 p, vec3 n)
{
    vec3 cr = cross(cam.dir, vec3(0,1,0));
    vec3 up = normalize(cross(cr,cam.dir));
    vec3 l  = normalize(gl.light1-p);
 
    float dif = clamp(dot(n,l), 0.0, 1.0);
    dif *= shadow(p, gl.light1, n);
    
    return clamp(dif, gl.ambient, 1.0);
}

vec3 getLight(vec3 p, vec3 n)
{
    vec3 col;
    
    switch (gl.hit.mat) 
    {
        case -2:    col = gl.hit.color; break;
        case HEAD:  col = vec3(0.1); break;
        case PLANE: col = vec3(0.5); break;
        case NONE:  
        {
           vec2 guv = gl.frag.xy - gl.res / 2.;
           float grid = dot(step(mod(guv.xyxy, vec4(10,10,100,100)), vec4(1)), vec4(.5, .5, 1, 1));
           return mix(vec3(.001), vec3(0.01,0.01,0.01), grid);
        }
    }
    
    col = (opt.colors) ? gray(col) : col;
    
    if (opt.normal || opt.depthb)
    {
        vec3 nc = opt.normal ? gl.hit.dist >= gl.maxDist ? black : n : white;
        vec3 zc = opt.depthb ? vec3(pow(1.0-gl.hit.dist/gl.maxDist, 8.0)) : white;
        col = nc*zc;
    }
    else
    {
        col *= diffuse(p,n);
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
    opt.rotate   = !keyState(KEY_R);
    opt.anim     =  keyState(KEY_P);
    opt.occl     =  keyState(KEY_UP);
    opt.dither   = !keyState(KEY_D);
    opt.normal   = !keyState(KEY_X);
    opt.depthb   = !keyState(KEY_Z);
    opt.colors   = !keyState(KEY_L);
    opt.space    = !keyState(KEY_SPACE);
    opt.foggy    =  keyState(KEY_F);
    opt.grid     =  keyState(KEY_G);
    opt.vignette = !keyState(KEY_V);
    
    initGlobal(fragCoord, iResolution, iMouse, iTime, iFrame);
    gl.light1 = (vy*3.0 + vx)*iRange(5.0,8.0);
    gl.ambient       = 0.1; // iRange(0.0,0.1);
    gl.shadow.bright = 0.5; // iRange(0.2,0.8);
    gl.shadow.power  = 5.0; // iRange(2.0, 8.0);
    gl.shadow.soft   = 0.0; // iRange(0.0,1.0);
    gl.maxDist       = 50.0;
    gl.maxSteps      = 256;
                
    float mx = 2.0*(iMouse.x/iResolution.x-0.5);
    float my = 2.0*(iMouse.y/iResolution.y-0.5);
    
    if (iMouse.z <= 0.0 && opt.rotate)
    {
        float ts = 276.2;
        mx = 0.3*sin(ts+iTime/12.0);
        my = -0.20-0.10*cos(ts+iTime/8.0);
    }
    
    initCam(v0, 25.0, mx, my);
        
    march(cam.pos, fragCoord);
    
    vec3 col = getLight(gl.hit.pos, gl.hit.normal);
    
    if (gl.ifrag.x < 30*text.size.x && gl.ifrag.y > gl.ires.y-4*text.size.y)
    {
        col *= 0.1;
        col = mix(col, yellow, print(0,  0,  iFrameRate));
        col = mix(col, blue,   print(0,  1,  iTime     ));
        col = mix(col, red,    print(10, 0,  vec2(iMouse.x, mx)));
        col = mix(col, green,  print(10, 1,  vec2(iMouse.y, my)));

        if (iMouse.z > 0.0)
        {
            march(cam.pos, iMouse.xy);
            
            if (gl.hit.dist < gl.maxDist)
            {
                col = mix(col, white, print(0,  2, gl.hit.dist));
                col = mix(col, red,   print(0,  3, gl.hit.pos.x ));
                col = mix(col, green, print(10, 3, gl.hit.pos.y ));
                col = mix(col, blue,  print(20, 3, gl.hit.pos.z ));
            }
        }
    }
    
    fragColor = postProc(col, opt.dither, !opt.depthb, opt.vignette);
}
