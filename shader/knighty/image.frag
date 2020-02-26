
HEADER

Mat[6] material = Mat[6]( 
    //  hue    sat   lum   shiny  metal glossy emit
    Mat(0.1,   0.5,  0.2,   1.0,  0.5,  0.1,   0.0  ), // puppy
    Mat(HUE_B, 1.0,  0.7,   0.8,  0.4,  0.1,   0.0  ), // body
    Mat(0.5,   0.0,  0.05,  1.0,  0.0,  0.3,   0.0  ), // shoe 
    Mat(0.2,   0.5,  0.9,   0.5,  0.0,  0.5,   0.0  ), // skin
    Mat(HUE_R, 0.85, 0.5,   0.8,  0.4,  0.1,   0.0  ), // cap
    Mat(HUE_B, 1.0,  0.7,   0.5,  0.0,  1.0,   0.0  )  // glasses
);

void guy()
{
    sdPush();
    
    sdf.pos.xz += vec2(10.0,-5.0); 
    sdf.pos *= alignMatrix(normal(-1.0,0.0,-0.6),vy);
    
    sdPush();
    sdf.pos.x = abs(sdf.pos.x);
    
    float d, h;
    vec3 body, leg, foot, toe, neck, arm, elle, hand, head, nose, tail, ttip;

    body = 2.2*vy;
    neck = body +3.0*vy +3.0*vz;
    leg  = body +2.0*vx;
    foot = leg  +2.0*vx -1.0*vy +4.0*vz;
    arm  = neck +1.7*vx -0.2*vy;
    hand = arm  -0.5*vx -4.0*vy +2.0*vz;
    head = neck         +3.0*vy +2.0*vz;
    
    d = sdCone(body, neck, 2.5, 1.5);
    d = opUnion(d, sdCone(leg,  foot, 1.8, 0.8), 0.4);
    d = opUnion(d, sdCone(arm,  hand, 1.5, 0.8), 0.4);
    sdPop();

    tail = body -1.9*vz;
    ttip = tail +2.0*vx +3.0*vy -2.0*vz;
    d = opUnion(d, sdCapsule(tail, ttip, 0.5), 0.5);
    
    sdf.pos -= head;
    sdf.pos *= alignMatrix(normal(1.0,0.0,iRange(-0.2,0.4)),vy);
    sdf.pos.x = abs(sdf.pos.x);
        
    nose = 2.0*vy +1.5*vz;
    
    vec3 hdir = normalize(nose);
    vec3 hdrg = cross(hdir, vy);
    vec3 hdup = cross(hdrg, hdir);
    vec3 ceye = nose*0.3;
    vec3 leye = ceye -3.0*hdrg;
    vec3 reye = ceye +3.0*hdrg;
    
    vec3 cear  = -0.5*nose + hdup;
    vec3 lear1 = -0.2*nose -2.0*hdrg +2.0*hdup;
    vec3 lear2 = cear -4.0*hdrg;
    
    d = opUnion(d, sdCone(v0, nose, 2.2, 1.2), 0.5);
    d = opUnion(d, sdCapsule(lear1, lear2, 0.9), 0.3);
    d = opDiff (d, sdCapsule(leye, reye, 0.7), 0.4);
    sdPop();
    
    sdMat(0, d);
    
    sdPush();
    sdf.pos.z += 20.0;
    sdPush();
    sdf.pos.x = abs(sdf.pos.x);
    
    body = 15.0*vy;
    d = sdSphere(body, 7.0);
    d = opInter(d, sdPlane (body -3.0*vz, normal(0.0,1.0,-0.5)), 1.0);  // trousers cutoff
    d = opUnion(d, sdSphere(body +2.0*vx -5.0*vy -2.0*vz, 3.0), 2.0);   // ass
    d = opUnion(d, sdSphere(body         -6.0*vy +3.8*vz, 1.0), 2.0);   // crotch
    
    leg  = body +3.0*vx -8.0*vy + 1.0*vz;
    foot = leg  +1.0*vx -5.0*vy - 1.1*vz;
    toe  = foot +1.0*vx +4.0*vz -1.2*vy;
    
    d = opUnion(d, sdCone  (leg, foot, 3.0, 2.0), 1.75); // leg
    sdMat(1, d);
    
    sdUni(2, sdCone(foot, toe, 2.0, 1.0), 0.1); // shoe
    
    arm  = body + 6.0*vx + 3.0*vy - 2.0*vz;
    elle = arm  + 5.0*vx - 5.0*vy +     vz;
    hand = elle - 1.0*vx          + 6.0*vz;
    d = sdCone(arm,  elle, 3.5, 1.5); // arm
    d = opUnion(d, sdCone(elle, hand, 2.5, 1.5), 1.0); 
    d = opUnion(d, sdSphere(hand+vz, 2.6), 0.5); 
    
    sdPop();
    
    head = body +11.0*vy+3.0*vx+2.0*vz;
    nose = head +4.5*normalize(hand+4.0*vy+3.0*vz-head);
    d = opUnion(d, sdSphere(head, 4.5), 2.0); // head
    d = opUnion(d, sdSphere(nose, 1.4), 0.5); // nose
    d = opUnion(d, sdCylinder(head+4.5*vz+1.0*vy, head+4.5*vz+1.0*vy+0.01*normal(0.5,-1.0,1.0), 0.7, 0.4), 0.5); // ear
    
    sdMat(3, d);
    nose = normalize(hand+9.5*vy-2.0*vz-head);
    d =        sdCylinder(head+5.0*nose, head+4.9*nose, 1.1, 0.3);
    nose = normalize(hand+9.5*vy+6.0*vz-head);
    d = min(d, sdCylinder(head+5.0*nose, head+4.9*nose, 1.1, 0.3));
    sdMat(5, d);
    
    vec3 phup = normal(-0.5,1.0,-0.5);
    sdMat(2, sdBox(hand+3.0*vz+1.0*vx+vy, normalize(cross(vy,phup)), phup, vec3(2.5,0.6,4.5), 0.6));
    
    hand.x = -hand.x;
    sdMat(0, sdCapsule(hand-4.0*vx+2.0*vz+4.0*vy, hand+3.0*vx-1.5*vy+0.5*vz, 0.8));
    
    sdMat(4, sdCapsule(body, body+2.0*vy-1.5*vz, 6.6)); // shirt
    
    nose = normal(0.1,1.0,-0.2);
    d = sdCylinder(head+2.0*nose, head+2.03*nose, 5.1, 0.6);
    d = opUnion(d, sdHalfSphere(head+2.0*nose, nose, 4.5, 1.0), 0.6);
    sdMat(4, d); // cap
    sdPop();
}

// 00     00   0000000   00000000   
// 000   000  000   000  000   000  
// 000000000  000000000  00000000   
// 000 0 000  000   000  000        
// 000   000  000   000  000        

float map(vec3 p)
{
    sdStart(p);
    
    guy();
    sdFlex(vec3(0.04), 0.0);
    // sdAxes(0.1);
    
    if (false && gl.pass != PASS_SHADOW)
    {
        // sdMat(3, sdSphere(gl.light[0].pos, gl.light[0].bright)); 
        // sdMat(4, sdSphere(gl.light[1].pos, gl.light[1].bright)); 
        sdMat(5, sdSphere(gl.light[2].pos, 2.0)); 
    }
    
    return sdf.dist;
}

NORMAL   
MARCH    
OCCLUSION
SHADOW

// 000      000   0000000   000   000  000000000  
// 000      000  000        000   000     000     
// 000      000  000  0000  000000000     000     
// 000      000  000   000  000   000     000     
// 0000000  000   0000000   000   000     000     

vec3 calcLight(vec3 p, vec3 n)                    
{                                                 
    vec3 col;                                     
    Mat  mat;                                     
    switch (gl.hit.mat)                           
    {                                             
        case -2: col = gl.hit.color; break;       
        case NONE:
        {                                         
           vec2   guv = gl.frag.xy - gl.res / 2.; 
           float  grid = dot(step(mod(guv.xyxy, vec4(10,10,100,100)), vec4(1)), vec4(.5, .5, 1, 1)); 
           return mix(vec3(.001), vec3(0.01,0.01,0.01), grid); 
        }                                                      
        default:                                               
        {                                                      
            mat = material[gl.hit.mat];                      
            col = hsl(mat.hue, mat.sat, mat.lum);              
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
        vec3 sum   = v0;
        vec3 gloss = v0;
        float bsum = 0.0;
        float mbr  = 0.0;
        float occl = occlusion(p,n);
        for (int i = gl.zero; i < 3; i++)
        {
            vec3  pl  = gl.light[i].pos-p;
            float br  = gl.light[i].bright * (gl.light[i].range>0.0 ? pow(clamp01(1.0-length(pl)/gl.light[i].range), 2.0) : 1.0);
            vec3  ld  = normalize(pl);
            vec3  vn  = normalize(ld-cam.dir);
            float shd = i == 0 ? shadow(p,n,i) : 1.0;
            float dvn = dot(n,vn);
            float dld = dot(n,ld);
            float dcd = dot(n,-cam.dir);
            
            gloss += gl.light[i].bright*gl.light[i].color*mix(mat.glossy*0.1,pow(mat.glossy,4.0),mat.glossy)*pow(smoothstep(
                mat.glossy*(0.992-env.specs*0.6*0.01), 
                1.0-env.specs*0.45*0.01, dvn), 
                4.0+36.0*mat.glossy);
            
            float shiny, metal;
            
            shiny  = pow(dld*dld, 5.0);
            shiny += pow(dvn,2.0)*0.2;
            shiny += pow(1.0-dcd, 2.0);
            
            metal  = smoothstep(mat.metal*0.5, 0.52, dot(n,normalize(vy+ld)));
            
            float shf = 1.0-mat.shiny*(1.0-shiny);
            float mtf = 1.0-mat.metal*(1.0-metal);
            
            sum  += gl.light[i].color * (max(dld,0.0) * br * shd * occl * shf * mtf);
            
            bsum += gl.light[i].bright;
            mbr = max(mbr, gl.light[i].bright);
        }
        sum /= bsum/mbr;
        
        col = mix(col * sum, col, mat.emit);
        col += gloss*env.gloss;
        
        col = max(col, env.ambient);
    } 
    return col; 
}

void setMatColor(int i, vec3 c)
{
    vec3 hc = rgb2hsl(c);
    material[i].hue = hc.x;
    material[i].sat = hc.y;
    material[i].lum = hc.z;
}

void setup()
{
    cam.fov     = PI;
    fog.near    = 0.9;
    fog.color   = vec3(0.01);
    env.ambient = white*0.005;
    env.gloss   = 1.0;
    env.specs   = 1.0;
    
    gl.maxSteps = 128;
    gl.minDist  = 0.02;
    gl.maxDist  = 400.0;
    
    vec3 lp = vec3(22,30,0); 
    float soft = 1.0; 
    float dark = 0.4;
    gl.light[0].color       = vec3(1.0,1.0,1.0);
    gl.light[0].bright      = 0.7;
    gl.light[0].shadow.soft = soft;
    gl.light[0].shadow.dark = dark;
    gl.light[0].pos = cam.pos -20.0*cam.rgt + 50.0*vy + 50.0*cam.dir;
    
    gl.light[1].color       = vec3(1.0,1.0,1.0);
    gl.light[1].bright      = 0.2;
    gl.light[1].pos = cam.pos;
    
    gl.light[2].color       = vec3(0.5,0.5,1.0);
    gl.light[2].bright      = 1.0;
    gl.light[2].range       = 17.0;
    gl.light[2].pos = 12.0*vx +17.0*vy -11.0*vz;
    
    // for (int i = 0; i < 3; i++)
    // {
        // setMatColor(3+i, gl.light[i].bright*gl.light[i].color);
    // }    
}

SETUP
