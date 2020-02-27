
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

pivot pDog;
pivot pDogTail;
pivot pDogHead;
pivot pDogEar;
pivot pDogLeg;
pivot pDogArm;

pivot pHead;
vec3 pCap, qCap, nCap;
vec3 pNose, pEar, qEar;
vec3 pEye,  qEye;
vec3 pBody, pTorso;
vec3 pBelt, nBelt;
vec3 pAss,  pCrotch;
vec3 pLeg,  pFoot, pToe;

//  0000000   000   000  000  00     00   0000000   000000000  00000000  
// 000   000  0000  000  000  000   000  000   000     000     000       
// 000000000  000 0 000  000  000000000  000000000     000     0000000   
// 000   000  000  0000  000  000 0 000  000   000     000     000       
// 000   000  000   000  000  000   000  000   000     000     00000000  

void animate()
{
    eulerPivot   (pDog,     -50.0,   0.0, 0.0);
    eulerPivot   (pDogEar,  iRange(-90.0,-120.0, 2.0), iRange(-60.0,-90.0, 2.0), 0.0);
    concatPivotXY(pDogLeg,  pDog,     -63.0, -30.0);
    concatPivotXY(pDogArm,  pDog,    -100.0,  10.0);
    concatPivotXY(pDogTail, pDog,     100.0,  iRange(-25.0,25.0,10.0));
    concatPivotYZ(pDogHead, pDog, iRange(-10.0,10.0, 1.0),  iRange(-25.0,25.0, 1.0));
    
    eulerPivot   (pHead,    -42.0,   -50.0, 20.0);

    pDog.p     = 2.2*vy;
    pDogLeg.p  = pDog.p +2.0*pDog.x;
    pDogArm.p  = pDog.p +1.8*pDog.x + 4.2*pDog.y;
    pDogTail.p = pDog.p -1.5*pDog.y - 1.5*pDog.z;
    pDogHead.p = pDog.p +8.0*pDog.y - 1.5*pDog.z;
    pDogEar.p  = 1.2*vx -vy -1.0*vz;
    pDogEar.x  = 3.0*vx +vy;
    pDogEar.z  = pDogEar.p+2.0*pDogEar.y;
    pDogTail.z = pDogTail.p+4.1*pDogTail.y;
    
    pBody      = 15.0*vy;
    pBelt      = pBody -3.0*vz;
    nBelt      = normalize(vy-0.5*vz);
    pAss       = pBody +2.0*vx -5.0*vy -2.0*vz;
    pCrotch    = pBody         -6.0*vy +3.8*vz;
    pLeg       = pBody +3.0*vx -8.0*vy +1.0*vz;
    pFoot      = pLeg  +1.0*vx -5.0*vy -1.1*vz;
    pToe       = pFoot +1.0*vx -1.2*vy +4.0*vz;
    pTorso     = pBody         +2.0*vy -1.1*vz;
    
    pHead.p    = pBody +3.0*vx +11.0*vy+2.0*vz;
    pNose      = 4.5*vz;
    pEye       = 4.6*normal(0.4,0.5,1.0);
    qEye       = 1.05*pEye;
    
    pEar = 4.5*vx+vy;
    qEar = pEar+0.01*normal(0.5,-0.1,1.0);
    
    nCap = normal(0.0,1.0,-1.0);
    pCap = 2.5*nCap;
    qCap = 1.02*pCap;
}

//  0000000   000   000  000   000  
// 000        000   000   000 000   
// 000  0000  000   000    00000    
// 000   000  000   000     000     
//  0000000    0000000      000     

void guy2()
{
    float d;
    
    sdPush();
    sdf.pos.z += 20.0;
    
    sdPush();
    sdf.pos.x = abs(sdf.pos.x);
    
    d = sdSphere(pBody, 7.0);
    d = opInter(d, sdPlane(pBelt, nBelt), 1.0);  // trousers cutoff
    d = opUnion(d, sdSphere(pAss, 3.0), 2.0);   // ass
    d = opUnion(d, sdSphere(pCrotch, 1.0), 2.0);   // crotch
    d = opUnion(d, sdCone  (pLeg, pFoot, 3.0, 2.0), 1.75); // leg
    
    sdMat(1, d);
    
    sdUni(2, sdCone(pFoot, pToe, 2.1, 1.0), 0.2); // shoe
    
    sdMat(4, sdSphere(pTorso, 6.6)); // shirt
    
    // arm  = body + 6.0*vx + 3.0*vy - 2.0*vz;
    // elle = arm  + 5.0*vx - 5.0*vy +     vz;
    // hand = elle - 1.0*vx          + 6.0*vz;
    // d = sdCone(pArm, pElle, 3.5, 1.5); // arm
    // d = opUnion(d, sdCone(pElle, pHand, 2.5, 1.5), 1.0); 
    // d = opUnion(d, sdSphere(pHand+vz, 2.6), 0.5); 
    
    sdPop();

    sdf.pos -= pHead.p;
    sdf.pos *= pHead.m;
    sdf.pos.x = abs(sdf.pos.x);
    
    d = sdSphere(v0, 4.5); // head
    d = opUnion(d, sdSphere(pNose,   1.4), 0.5); // nose
    d = opUnion(d, sdCylinder(pEar, qEar, 0.7, 0.4), 0.5); // ear
    
    sdMat(3, d);
        
    sdMat(5, sdCylinder(pEye, qEye, 1.1, 0.3)); // eye
    
    d = sdCylinder(pCap, qCap, 5.1, 0.6);
    d = opUnion(d, sdHalfSphere(pCap, nCap, 4.5, 1.0), 0.6);
    sdMat(4, d); // cap

    sdPop();
}

void guy()
{
    float d, h;
    vec3 body, leg, foot, toe, neck, arm, elle, hand, head, nose, tail, ttip;
    
    sdPush();
    sdf.pos.z += 20.0;
    sdPush();
    sdf.pos.x = abs(sdf.pos.x);
    
    body = 15.0*vy;
    
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
    
    // sdMat(4, sdCapsule(body, body+2.0*vy-1.5*vz, 6.6)); // shirt
        
    nose = normal(0.1,1.0,-0.2);
    d = sdCylinder(head+2.0*nose, head+2.03*nose, 5.1, 0.6);
    d = opUnion(d, sdHalfSphere(head+2.0*nose, nose, 4.5, 1.0), 0.6);
    sdMat(4, d); // cap
    sdPop();
}

// 0000000     0000000    0000000   
// 000   000  000   000  000        
// 000   000  000   000  000  0000  
// 000   000  000   000  000   000  
// 0000000     0000000    0000000   

void dog()
{
    float d;
    
    sdPush();
    
    sdf.pos.xz -= vec2(-12.0,4.0);
    sdf.pos *= rMatY(-130.0);
    
    sdPush();
    
    sdf.pos.x = abs(sdf.pos.x);
    
    d = sdCone(pDog, 4.25, 2.2, 1.5);
    d = opUnion(d, sdCone(pDogLeg, 4.5, 1.8, 0.8), 0.4);
    d = opUnion(d, sdCone(pDogArm, 4.5, 1.5, 0.8), 0.4);    
    
    sdPop();
    
    d = opUnion(d, sdCapsule(pDogTail.p, pDogTail.z, 0.5), 0.5);
    
    sdf.pos -= pDogHead.p;
    sdf.pos *= pDogHead.m;
    sdf.pos.x = abs(sdf.pos.x);
    
    d = opUnion(d, sdCone(v0, 2.5, 2.2, 1.2), 1.2);
    d = opDiff (d, sdCapsule(-pDogEar.x, pDogEar.x, 0.7), 0.4);
    d = opUnion(d, sdCapsule( pDogEar.p, pDogEar.z, 0.8), 0.3);
    sdPop();
    
    sdMat(0, d);
}

// 00     00   0000000   00000000   
// 000   000  000   000  000   000  
// 000000000  000000000  00000000   
// 000 0 000  000   000  000        
// 000   000  000   000  000        

float map(vec3 p)
{
    sdStart(p);
    
    // guy();
    guy2();
    dog();
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

//  0000000  00000000  000000000  000   000  00000000   
// 000       000          000     000   000  000   000  
// 0000000   0000000      000     000   000  00000000   
//      000  000          000     000   000  000        
// 0000000   00000000     000      0000000   000        

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
    
    animate();
    
    // for (int i = 0; i < 3; i++)
    // {
        // setMatColor(3+i, gl.light[i].bright*gl.light[i].color);
    // }    
}

SETUP
