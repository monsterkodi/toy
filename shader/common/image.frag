/*
000  00     00   0000000    0000000   00000000    
000  000   000  000   000  000        000         
000  000000000  000000000  000  0000  0000000     
000  000 0 000  000   000  000   000  000         
000  000   000  000   000   0000000   00000000    
*/

KEYS
LOAD
PRINT

#define GRAY   1

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
    sdMat(GRAY,  sdCube(v0, 1.0, 0.2));
    sdMat(GRAY,  sdCube(v0, iRange(1.0, 2.0), iRange(0.0, 2.0)));
    sdMat(GRAY,  sdBox(vy*5.0, vx, rotAxisAngle(vy, vx, iRange(0.0,360.0)), vec3(iRange(1.5, 1.0)), iRange(0.2, 0.1)));
    sdMat(GRAY,  sdBox(vy*10.0, rotAxisAngle(vx, vy, iRange(0.0,360.0)), vy, vec3(1), iRange(0.0, 0.5)));

    if (gl.pass == PASS_MARCH) sdColor(white, sdSphere(gl.light1, 0.5));

    return sdf.dist;
}

NORMAL
MARCH
SHADOW
OCCLUSION

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
        case GRAY:  col = vec3(0.1); break;
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
    INIT

    fog.color = vec3(0.01);
    
    march(cam.pos, fragCoord);

    vec3 col = getLight(gl.hit.pos, gl.hit.normal);
    if (opt.foggy) col = mix(col, fog.color, smoothstep(gl.maxDist*fog.near, gl.maxDist*fog.far, gl.hit.dist));
    
    DBG(0,load(0,0))
    DBG(1,load(0,1))
    DBG(2,load(0,2))
    DBG(3,load(0,3))
    
    INFO
    HELP
    
    fragColor = postProc(col, opt.dither, opt.gamma && !opt.depthb, opt.vignette);
}
