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

    sdFloor(fog.color, -2.0);
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

    if (!opt.shadow) return 1.0;
    
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

//  0000000    0000000   0000000  000      000   000   0000000  000   0000000   000   000  
// 000   000  000       000       000      000   000  000       000  000   000  0000  000  
// 000   000  000       000       000      000   000  0000000   000  000   000  000 0 000  
// 000   000  000       000       000      000   000       000  000  000   000  000  0000  
//  0000000    0000000   0000000  0000000   0000000   0000000   000   0000000   000   000  

float occlusion(vec3 p, vec3 n)
{
    if (!opt.occl) return 1.0;
    float a = 0.0;
    float weight = 1.0;
    for (int i = gl.zero; i <= 6; i++)
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

float diffuse(vec3 p, vec3 n)
{
    float dif;
    dif = clamp(dot(n,normalize(gl.light1-p)), 0.0, 1.0);
    dif *= shadow(p, gl.light1, n);
    dif *= occlusion(p, n);
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

    col = (opt.colors) ? desat(col) : col;

    if (opt.normal || opt.depthb)
    {
        vec3 nc = opt.normal ? gl.hit.dist >= gl.maxDist ? black : n : white;
        vec3 zc = opt.depthb ? vec3(pow(1.0-gl.hit.dist/gl.maxDist, 4.0)) : white;
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
    opt.axes     =  keyState(KEY_X);
    opt.info     =  keyState(KEY_I);
    opt.help     =  keyState(KEY_H);
    opt.shadow   =  keyState(KEY_L);
    opt.occl     =  keyState(KEY_O);
    opt.dither   =  keyState(KEY_T);
    opt.gamma    =  keyState(KEY_G);
    opt.anim     =  keyState(KEY_P);
    opt.normal   = !keyState(KEY_N);
    opt.depthb   = !keyState(KEY_B);
    opt.colors   = !keyState(KEY_K);
    opt.space    = !keyState(KEY_SPACE);
    opt.foggy    =  keyState(KEY_F);
    opt.vignette = !keyState(KEY_V);

    initGlobal(fragCoord, iResolution, iMouse, iTime, iFrame);
    gl.maxDist       = 50.0;
    gl.maxSteps      = 256;

    float mx = gl.mp.x+0.77;
    float my = gl.mp.y;

    if (iMouse.z <= 0.0 && opt.rotate)
    {
        mx = -iTime/12.0;
    }

    initCam(v0, 25.0, mx, my);

    march(cam.pos, fragCoord);

    vec3 col = getLight(gl.hit.pos, gl.hit.normal);
    if (opt.foggy) col = mix(col, fog.color, smoothstep(gl.maxDist*fog.near, gl.maxDist*fog.far, gl.hit.dist));

    if (opt.info && gl.ifrag.x < 9*text.size.x && gl.ifrag.y > gl.ires.y-10*text.size.y)
    {
        col *= 0.02;
        
        col = mix(col, yellow, print(-2, 0, int(iFrameRate) ));
        col = mix(col, blue,   print(-2, 1, int(iTime)      ));
        col = mix(col, red,    print(-2, 2, int(iMouse.x)   ));
        col = mix(col, green,  print(-2, 3, int(iMouse.y)   ));
        col = mix(col, red,    print(-2, 4, mx              ));
        col = mix(col, green,  print(-2, 5, my              ));

        if (iMouse.z > 0.0)
        {
            march(cam.pos, iMouse.xy);

            if (gl.hit.dist < gl.maxDist)
            {
                col = mix(col, white, print(-2, 6, gl.hit.dist  ));
                col = mix(col, red,   print(-2, 7, gl.hit.pos.x ));
                col = mix(col, green, print(-2, 8, gl.hit.pos.y ));
                col = mix(col, blue,  print(-2, 9, gl.hit.pos.z ));
            }
        }
    }

    if (opt.help && gl.ifrag.x < 9*text.size.x && gl.ifrag.y <= gl.ires.y-10*text.size.y)
    {
        col *= 0.02;
        int y = 10;
        vec3 ct;
        int[6] iv;
        #define printOpt(o,k,c1,c2,c3,c4) \
            iv = int[6](k, 32, c1, c2+32, c3+32, c4+32); \
            ct = o ? white : gray; \
            for (int i = gl.zero; i<6; i++) \
                col = mix(col, ct, print(ivec2(i+1,y), iv[i])); \
            y++
         
        printOpt(opt.help,     KEY_H, KEY_H, KEY_E, KEY_L, KEY_P);
        printOpt(opt.info,     KEY_I, KEY_I, KEY_N, KEY_F, KEY_O);
        printOpt(opt.axes,     KEY_X, KEY_A, KEY_X, KEY_E, KEY_S);
        printOpt(opt.anim,     KEY_P, KEY_A, KEY_N, KEY_I, KEY_M);
        printOpt(opt.shadow,   KEY_L, KEY_S, KEY_H, KEY_A, KEY_D);
        printOpt(opt.occl,     KEY_O, KEY_O, KEY_C, KEY_C, KEY_L);
        printOpt(opt.dither,   KEY_T, KEY_D, KEY_I, KEY_T, KEY_H);
        printOpt(opt.gamma,    KEY_G, KEY_G, KEY_A, KEY_M, KEY_M);
        printOpt(opt.foggy,    KEY_F, KEY_F, KEY_O, KEY_G, 0);
        printOpt(opt.rotate,   KEY_R, KEY_R, KEY_O, KEY_T, 0);
        printOpt(opt.colors,   KEY_K, KEY_C, KEY_O, KEY_L, 0);
        printOpt(opt.depthb,   KEY_B, KEY_Z, KEY_B, KEY_U, KEY_F);
        printOpt(opt.normal,   KEY_N, KEY_N, KEY_O, KEY_R, KEY_M);
        printOpt(opt.vignette, KEY_V, KEY_V, KEY_I, KEY_G, KEY_N);
    }

    fragColor = postProc(col, opt.dither, opt.gamma && !opt.depthb, opt.vignette);
}
