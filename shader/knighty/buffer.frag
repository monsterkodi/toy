/*
0000000    000   000  00000000  00000000  00000000  00000000     
000   000  000   000  000       000       000       000   000    
0000000    000   000  000000    000000    0000000   0000000      
000   000  000   000  000       000       000       000   000    
0000000     0000000   000       000       00000000  000   000    
*/

KEYS
LOAD

// 000  000   000  000  000000000  
// 000  0000  000  000     000     
// 000  000 0 000  000     000     
// 000  000  0000  000     000     
// 000  000   000  000     000     

void initCamera()
{    
    initCam(-2.0*vy, 40.0, 0.0, -0.4);
    
    save(0,2,vec4(cam.tgt,0));
    save(0,3,vec4(cam.pos,0));
}

//  0000000   0000000   00     00  00000000  00000000    0000000   
// 000       000   000  000   000  000       000   000  000   000  
// 000       000000000  000000000  0000000   0000000    000000000  
// 000       000   000  000 0 000  000       000   000  000   000  
//  0000000  000   000  000   000  00000000  000   000  000   000  

void calcCamera()
{
    vec4 d01 = load(0,1);
    vec4 tgt = load(0,2);
    vec4 pos = load(0,3);
    
    lookAtFrom(tgt.xyz,pos.xyz);
    
    orbit(-100.0*(d01.y), 100.0*(d01.x));
    
    if (opt.rotate) orbitYaw(iRange(0.15,-0.15,0.2));
    
    if (keyDown(KEY_LEFT))  orbitYaw(-1.0);
    if (keyDown(KEY_RIGHT)) orbitYaw( 1.0);
    if (keyDown(KEY_UP))    orbitPitch(-1.0);
    if (keyDown(KEY_DOWN))  orbitPitch( 1.0);
    
    vec3 pan;
    if (keyDown(KEY_W))  { if (length(cam.pos2tgt)>1.0) { lookZoom(1.0); } else { pan += 0.2*cam.dir; }}
    if (keyDown(KEY_S))  { lookZoom(-1.0); }
    if (keyDown(KEY_A))  { lookZoom(0.0); pan -= 0.1*cam.rgt; }
    if (keyDown(KEY_D))  { lookZoom(0.0); pan += 0.1*cam.rgt; }
    if (keyDown(KEY_Q))  { lookZoom(0.0); pan -= 0.1*cam.up;  }
    if (keyDown(KEY_E))  { lookZoom(0.0); pan += 0.1*cam.up;  }
    
    lookPan(pan);
    
    if (keyDown(KEY_PGDN)) lookPan(-vy*0.1);
    if (keyDown(KEY_PGUP)) lookPan( vy*0.1);
    
    save(0,2,vec4(cam.tgt, 0));
    save(0,3,vec4(cam.pos, 0));
}

// 00     00   0000000   000  000   000  
// 000   000  000   000  000  0000  000  
// 000000000  000000000  000  000 0 000  
// 000 0 000  000   000  000  000  0000  
// 000   000  000   000  000  000   000  

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    INIT

    ivec2 mem = ivec2(fragCoord);
    
    if (mem.x == 0 && mem.y <= 1)
    {
        vec4 d00 = load(0,0);
        
        vec2 delta;
        if (iMouse.z > 0.0 && d00.z > 0.0)
        {
            delta = gl.mp - d00.xy;
        }
        
        save(0,0,vec4(gl.mp, iMouse.z, iMouse.w));
        save(0,1,vec4(delta, 0,0));
    }
    else if (mem.x == 0 && mem.y <= 3)
    {
        if (iFrame < 1 || keyDown(KEY_C))
        {
            initCamera();
        }
        else
        {
            calcCamera();
        }
    }
    
    fragColor = gl.color;
}
