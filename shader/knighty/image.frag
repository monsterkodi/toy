
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

pivot pPhone;
pivot pHead;
pivot pArmL;
pivot pArmR;
pivot pEllL;
pivot pEllR;
pivot pHndR;
vec3  pHndL;
vec3  pStck;
vec3 pCap, qCap, nCap;
vec3 pNose, pEar, nEar;
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
    float headsUp = smoothstep(0.45,0.5,iRange(0.0,1.0,0.25));
    pDog.m = eulerX(-50.0);
    pDogEar.m = eulerXY(iRange(-110.0, -130.0, 0.5), iRange(-60.0,-100.0, 0.5));
    concatPivotXY(pDogLeg,  pDog,     -63.0, -30.0);
    concatPivotXY(pDogArm,  pDog,    -100.0,  10.0);
    concatPivotXY(pDogTail, pDog,     100.0,  iRange(-25.0,25.0,headsUp<0.5?24.0:8.0));
    concatPivotXY(pDogHead, pDog, -50.0*headsUp-20.0, 0.0);

    pHead.m  = euler(iRange(-55.0, -40.0), -50.0, 20.0);
    pArmR.m  = eulerZ(iRange(125.0,110.0));
    pArmL.m  = eulerZY(iSawtooth(-130.0, -132.0, 5.0), 80.0);
    pPhone.m = euler(60.0,-40.0,-10.0);

    concatPivotXY(pEllL, pArmL, 90.0, iSawtooth(69.0, 67.0, 5.0));
    concatPivotXY(pEllR, pArmR, -110.0, 0.0);
    concatPivotXY(pHndR, pEllR, 0.0, 0.0);

    pDog.p        = 2.2*vy;
    pDogLeg.p     = pDog.p +2.0*pDog.m[0];
    pDogArm.p     = pDog.p +1.8*pDog.m[0] + 4.2*pDog.m[1];
    pDogTail.p    = pDog.p -1.5*pDog.m[1] - 1.5*pDog.m[2];
    pDogHead.p    = pDog.p +8.0*pDog.m[1] - 1.5*pDog.m[2];
    pDogEar.p     = 1.2*vx -vy -1.0*vz;
    pDogEar.m[0]  = 3.0*vx +vy;
    pDogEar.m[2]  = pDogEar.p+2.0*pDogEar.m[1];
    pDogTail.m[2] = pDogTail.p+4.1*pDogTail.m[1];

    pBody   = 15.0*vy;
    pBelt   = pBody -3.0*vz;
    nBelt   = normalize(vy-0.5*vz);
    pAss    = pBody +2.0*vx -5.0*vy -2.0*vz;
    pCrotch = pBody         -6.0*vy +3.8*vz;
    pLeg    = pBody +3.0*vx -8.0*vy +1.0*vz;
    pFoot   = pLeg  +1.0*vx -5.0*vy -1.1*vz;
    pToe    = pFoot +1.0*vx -1.2*vy +4.0*vz;
    pTorso  = pBody         +2.0*vy -1.1*vz;

    pHead.p = pBody +3.0*vx +11.0*vy+2.0*vz;
    pNose   = 4.5*vz;
    pEye    = 4.6*normal(0.4,0.5,1.0);
    qEye    = 1.05*pEye;

    pEar    = 4.5*vx+vy;
    nEar    = normal(-0.5,0.1,-1.0);

    nCap    = normal(0.0,1.0,-1.0);
    pCap    = 2.5*nCap;
    qCap    = 1.02*pCap;

    pArmR.p = pBody +6.0*vx +3.0*vy -2.0*vz;
    pArmL.p = pBody -6.0*vx +3.0*vy -2.0*vz;

    pEllR.p = pArmR.p +7.0*pArmR.m[1];
    pEllL.p = pArmL.p +7.0*pArmL.m[1];

    pHndR.p = pEllR.p +7.0*pEllR.m[1];
    pHndL   = pEllL.p +7.0*pEllL.m[1];
    pStck   = pArmL.p -8.0*vx +4.0*vz;
    pStck.y = 0.8;

    pPhone.p = pHndR.p +pHndR.m[1] +pPhone.m[2];
    gl.light[1].pos = pPhone.p +pPhone.m[1];
    gl.light[1].pos.z -= 20.0;
}

//  0000000   000   000  000   000
// 000        000   000   000 000
// 000  0000  000   000    00000
// 000   000  000   000     000
//  0000000    0000000      000

void guy()
{
    float d;
    
    sdPush();
    sdf.pos.z += 20.0;

    sdMat(0, sdCapsule(pHndL, pStck, 0.8)); // stock

    float dBody = sdSphere(pBody, 7.0);
    if (dBody > sdf.dist+9.0) { sdPop(); return; }
    
    sdPush();
    sdf.pos.x = abs(sdf.pos.x);

    d = dBody;
    d = opInter(d, sdPlane(pBelt, nBelt), 1.0);            // trousers cutoff
    d = opUnion(d, sdSphere(pAss, 3.0), 2.0);              // ass
    d = opUnion(d, sdSphere(pCrotch, 1.0), 2.0);           // crotch
    d = opUnion(d, sdCone  (pLeg, pFoot, 3.0, 2.0), 1.75); // leg

    sdMat(1, d);

    float dShirt = sdSphere(pTorso, 6.6); // shirt

    d = sdCone(pFoot, pToe, 2.1, 1.0); // shoe
    sdPop();

    d = min(d, sdBox(pPhone.p, pPhone.m[0], pPhone.m[1], vec3(2.5,0.6,4.5), 0.6)); // phone
    sdMat(2, d); // black

    d = sdCone(pArmR.p, pEllR.p, 3.5, 1.5); // arm
    d = opUnion(d, sdCone(pEllR.p, pHndR.p, 2.5, 1.1), 0.5);
    d = opUnion(d, sdSphere(pHndR.p, 2.6), 0.5);

    d = min    (d, sdCone(pArmL.p, pEllL.p, 3.5, 1.5));
    d = opUnion(d, sdCone(pEllL.p, pHndL, 2.5, 1.1), 0.5);
    d = opUnion(d, sdSphere(pHndL, 2.6), 0.5);

    sdf.pos -= pHead.p;
    sdf.pos *= pHead.m;
    sdf.pos.x = abs(sdf.pos.x);

    d = min(d, sdSphere(v0, 4.5)); // head
    d = opUnion(d, sdSphere(pNose,   1.4), 0.5); // nose
    d = opUnion(d, sdHalfSphere(pEar, nEar, 1.2, 0.5), 0.5); // ear

    sdMat(3, d); // skin
    sdMat(5, sdCylinder(pEye, qEye, 1.1, 0.3)); // eye

    d = sdCylinder(pCap, qCap, 5.1, 0.6);
    d = opUnion(d, sdHalfSphere(pCap, nCap, 4.5, 1.0), 0.6);
    sdMat(4, min(d, dShirt)); // cap

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
    sdf.pos *= eulerY(-130.0);
    
    sdPush();

    sdf.pos.x = abs(sdf.pos.x);

    d = sdCone(pDog, 4.25, 2.2, 1.5);
    
    if (d > sdf.dist+4.0) { sdPop(); sdPop(); return; }
    
    d = opUnion(d, sdCone(pDogLeg, 4.5, 1.8, 0.8), 0.4);
    d = opUnion(d, sdCone(pDogArm, 4.5, 1.5, 0.8), 0.4);

    sdPop();

    d = opUnion(d, sdCapsule(pDogTail.p, pDogTail.m[2], 0.5), 0.5);

    sdf.pos -= pDogHead.p;
    sdf.pos *= pDogHead.m;
    sdf.pos.x = abs(sdf.pos.x);

    d = opUnion(d, sdCone(v0, 2.5, 2.2, 1.2), 1.2);
    d = opDiff (d, sdCapsule(-pDogEar.m[0], pDogEar.m[0], 0.7), 0.4);
    d = opUnion(d, sdCapsule( pDogEar.p, pDogEar.m[2], 0.8), 0.3);
    
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

    sdFlex(vec3(0.04), 0.0);
    dog();
    guy();

    return sdf.dist;
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
    
    gl.light[1].color       = vec3(0.5,0.5,1.0);
    gl.light[1].bright      = 1.0;
    gl.light[1].range       = 17.0;
    
    gl.light[2].color       = vec3(1.0,1.0,1.0);
    gl.light[2].bright      = 0.2;
    gl.light[2].pos = cam.pos;

    animate();
}

SETUP
