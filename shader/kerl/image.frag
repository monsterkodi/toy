#define TOY  1

#ifdef TOY
#define MAX_STEPS 64
#define MIN_DIST  0.01
#define MAX_DIST  80.0
#else
#define MAX_STEPS 64
#define MIN_DIST  0.01
#define MAX_DIST  100.0
#endif

#define PI 3.141592653589793
#define ZERO min(iFrame,0)

#define FLOOR -3.5

#define NONE  0
#define PLANE 1
#define BODY  2
#define BONE  3
#define BULB  4
#define PUPL  5

struct ray {
    vec3 pos;
    vec3 dir;
};

struct sdf {
    float dist;
    vec3  pos;
    int   mat;
};

sdf s;
vec3 camPos;
vec3 vec0 = vec3(0,0,0);

vec3 pHip;      vec3 pHipT;     vec3 pHipL;     vec3 pHipR;     vec3 pHipUp;    vec3 pHipRotL;      vec3 pHipRotR;
vec3 pTorsoT;   vec3 pTorsoB;   vec3 pTorsoL;   vec3 pTorsoR;   vec3 pTorsoUp;  vec3 pTorsoRotL;    vec3 pTorsoRotR;
vec3 pEyeL;     vec3 pEyeR;     vec3 pEyeHoleL; vec3 pEyeHoleR; vec3 pEyeLensL; vec3 pEyeLensR;
vec3 pArmL;     vec3 pArmR;     vec3 pArmLup;   vec3 pArmLx;    vec3 pArmLz;    vec3 pArmRup;   vec3 pArmRx; vec3 pArmRz;
vec3 pLegL;     vec3 pLegR;     vec3 pLegLup;   vec3 pLegLx;    vec3 pLegLz;    vec3 pLegRup;   vec3 pLegRx; vec3 pLegRz; 
vec3 pFootL;    vec3 pFootR;    vec3 pFootLup;  vec3 pFootLz;   vec3 pFootRup;  vec3 pFootRz;
vec3 pHandL;    vec3 pHandR;    vec3 pHandLz;   vec3 pHandRz;   vec3 pHandLup;  vec3 pHandRup;
vec3 pHead;     vec3 pHeadUp;   vec3 pHeadZ; 
vec3 pArmLud;   vec3 pArmRud;
vec3 pLegLud;   vec3 pLegRud;
vec3 pElbowL;   vec3 pElbowR;
vec3 pPalmL;    vec3 pPalmR;
vec3 pKneeR;    vec3 pKneeL;
vec3 pHeelL;    vec3 pHeelR;
vec3 pToeL;     vec3 pToeR;
vec3 pSpine;
vec3 pNeck;

vec4 qHip;      vec4 qNeck; vec4 qSpine; vec4 qTorso; 
vec4 qArmL;     vec4 qArmR; vec4 qHandL; vec4 qHandR;
vec4 qLegL;     vec4 qLegR; vec4 qFootL; vec4 qFootR;
vec4 qHead;     vec4 qEyes;
vec4 qKneeL;    vec4 qKneeR;
vec4 qElbowL;   vec4 qElbowR;

float rad2deg(float r) { return 180.0 * r / PI; }
float deg2rad(float d) { return PI * d / 180.0; }

//  0000000   000   000   0000000   000000000  
// 000   000  000   000  000   000     000     
// 000 00 00  000   000  000000000     000     
// 000 0000   000   000  000   000     000     
//  00000 00   0000000   000   000     000     

vec4 quatAxisAngle(vec3 axis, float angle)
{ 
    vec4 qr;
    float half_angle = deg2rad(angle * 0.5);
    qr.x = axis.x * sin(half_angle);
    qr.y = axis.y * sin(half_angle);
    qr.z = axis.z * sin(half_angle);
    qr.w = cos(half_angle);
    return qr;
}

vec4 quatConj(vec4 q)
{ 
    return vec4(-q.x, -q.y, -q.z, q.w); 
}
  
vec4 quatMul(vec4 q1, vec4 q2)
{ 
    vec4 qr;
    qr.x = (q1.w * q2.x) + (q1.x * q2.w) + (q1.y * q2.z) - (q1.z * q2.y);
    qr.y = (q1.w * q2.y) - (q1.x * q2.z) + (q1.y * q2.w) + (q1.z * q2.x);
    qr.z = (q1.w * q2.z) + (q1.x * q2.y) - (q1.y * q2.x) + (q1.z * q2.w);
    qr.w = (q1.w * q2.w) - (q1.x * q2.x) - (q1.y * q2.y) - (q1.z * q2.z);
    return qr;
}

vec3 rotate(vec4 quat, vec3 p)
{
    vec4 conj = quatConj(quat);
    vec4 q_tmp = quatMul(quat, vec4(p, 0));
    return quatMul(q_tmp, conj).xyz;
}

vec3 rotate(vec4 quat, vec3 o, vec3 p)
{
    vec4 conj = quatConj(quat);
    vec4 q_tmp = quatMul(quat, vec4(p-o, 0));
    return o + quatMul(q_tmp, conj).xyz;
}

// 00000000    0000000   000000000  
// 000   000  000   000     000     
// 0000000    000   000     000     
// 000   000  000   000     000     
// 000   000   0000000      000     

vec3 rotAxisAngle(vec3 position, vec3 axis, float angle)
{ 
    vec4 qr = quatAxisAngle(axis, angle);
    vec4 qr_conj = quatConj(qr);
    vec4 q_pos = vec4(position.x, position.y, position.z, 0);
    
    vec4 q_tmp = quatMul(qr, q_pos);
    qr = quatMul(q_tmp, qr_conj);
    
    return vec3(qr.x, qr.y, qr.z);
}

vec3 rotRayAngle(vec3 position, vec3 ro, vec3 rd, float angle)
{ 
    return rotAxisAngle(position-ro, rd-ro, angle)+ro;
}

vec3 rotY(vec3 v, float deg)
{
    float rad = deg2rad(deg);
    float c = cos(rad);
    float s = sin(rad);
    return vec3(v.x*c+v.z*s, v.y, v.z*c+v.x*s);
}

vec3 rotX(vec3 v, float deg)
{
    float rad = deg2rad(deg);
    float c = cos(rad);
    float s = sin(rad);
    return vec3(v.x, v.y*c+v.z*s, v.z*c+v.y*s);
}

vec3 rotZ(vec3 v, float deg)
{
    float rad = deg2rad(deg);
    float c = cos(rad);
    float s = sin(rad);
    return vec3(v.x*c+v.y*s, v.y*c+v.x*s, v.z);
}

vec3 posOnPlane(vec3 p, vec3 a, vec3 n)
{
    return p-dot(p-a,n)*n;
}

vec3 posOnPlane(vec3 p, vec3 n)
{
    return p-dot(p,n)*n;
}

vec3 posOnRay(vec3 ro, vec3 rd, vec3 p)
{
    return ro + max(0.0, dot(p - ro, rd) / dot(rd, rd)) * rd;
}

bool rayIntersectsSphere(vec3 ro, vec3 rd, vec3 ctr, float r)
{
    return length(posOnRay(ro, rd, ctr) - ctr) < r;
}

//  0000000   00000000   
// 000   000  000   000  
// 000   000  00000000   
// 000   000  000        
//  0000000   000        

float opUnion(float d1, float d2) 
{
    float k = 0.05;
    float h = clamp(0.5 + 0.5*(d2-d1)/k, 0.0, 1.0);
    return mix(d2, d1, h) - k*h*(1.0-h);
}

float opUnion(float d1, float k, float d2) 
{
    float h = clamp(0.5 + 0.5*(d2-d1)/k, 0.0, 1.0);
    return mix(d2, d1, h) - k*h*(1.0-h);
}

float opDiff(float d1, float d2) 
{
    float k = 0.05;
    float h = clamp(0.5 - 0.5*(d2+d1)/k, 0.0, 1.0);
    return mix(d1, -d2, h) + k*h*(1.0-h); 
}

float opDiff(float d1, float k, float d2) 
{
    float h = clamp(0.5 - 0.5*(d2+d1)/k, 0.0, 1.0);
    return mix(d1, -d2, h) + k*h*(1.0-h); 
}

float opInter(float d1, float d2) 
{
    float k = 0.05;
    float h = clamp(0.5 - 0.5*(d2-d1)/k, 0.0, 1.0);
    return mix(d2, d1, h) + k*h*(1.0-h);
}

//  0000000  0000000    
// 000       000   000  
// 0000000   000   000  
//      000  000   000  
// 0000000   0000000    

float sdCapsule(vec3 p, vec3 a, vec3 b, float r)
{
    vec3 ab = b-a;
    vec3 ap = p-a;
    float t = dot(ab,ap) / dot(ab,ab);
    t = clamp(t, 0.0, 1.0);
    vec3 c = a + t*ab;
    return length(p-c)-r;        
}

float sdTorus(vec3 p, vec3 a, vec3 n, vec2 r)
{
    vec3 q = p-a;
    return length(vec2(length(posOnPlane(q, n))-r.x,abs(dot(n, q))))-r.y;
}

float distToDoublePlane(vec3 p, vec3 n, float d)
{
    float dt = dot(p,n);
    return dt-sign(dt)*d;
}

float sdDoubleTorus(vec3 p, vec3 a, vec3 n, vec3 r)
{
    vec3 q = p-a;
    return length(vec2(length(posOnPlane(q, n))-r.x, distToDoublePlane(n, q, r.z)))-r.y;
}

float sdBend(vec3 p, vec3 a, vec3 n, vec3 d, float side, vec2 r)
{
    vec3 q = p-a;

    if (dot(q,side*d) > 0.0) return length(q)-r.y;
    
    vec3 c = cross(d,n);
    vec3 pp = q - r.x*c + side*r.x*d;
    if (dot(pp,c) > 0.0) return length(pp)-r.y;

    return length(vec2(length(posOnPlane(q, n)-r.x*c)-r.x,abs(dot(n, q))))-r.y;
}

float sdSphere(vec3 p, vec3 a, float r)
{
    return length(p-a)-r;
}

float sdPlane(vec3 p, vec3 a, vec3 n)
{   
    return dot(n, p-a);
}

float sdHalfSphere(vec3 p, vec3 a, vec3 n, float r)
{
    vec3 q = p-a;
    float dt = dot(q, n);
    float sd = length(q)-r;
    if (dt > 0.0)
    {
        return sd;
    }
    return max(sd,-dt);
}

float sdSocket(vec3 p, vec3 a, vec3 n, float r, float k)
{
    vec3 q = p-a;
    float dp = dot(q, n);
    float ds = length(q)-r;
    if (dp > k)
    {
        return ds;
    }
    else if (ds < -k*2.0)
    {
        return -dp+k;
    }

    return sdTorus(q, k*n, n, vec2(0.997*r-k,k));
}

float sdSocket(vec3 p, vec3 a, vec3 n, float r)
{
    return sdSocket(p, a, n, r, 0.05);
}

float sdBearing(vec3 p, vec3 a, vec3 n, float r)
{
    return opDiff(sdSphere(p, a, r), sdPlane(p, a, n));
}

// 00000000    0000000    0000000  00000000  
// 000   000  000   000  000       000       
// 00000000   000   000  0000000   0000000   
// 000        000   000       000  000       
// 000         0000000   0000000   00000000  

void poseDancing()
{
    pHip = vec3(-sin(iTime*4.0), 0, 0);
    
    vec3 x = vec3(1,0,0);
    vec3 y = vec3(0,1,0);
    vec3 z = vec3(0,0,1);
    
    float sq = sin(iTime*0.25);
    float sh = sin(iTime*0.5);
    float s1 = sin(iTime);
    float s2 = sin(iTime*2.0);
    float t2 = sin(iTime*2.0+PI);
    float s4 = sin(iTime*4.0);
    float t4 = sin(iTime*4.0+PI);
    float s8 = sin(iTime*8.0);
    float s16 = sin(iTime*16.0);
    
    vec4 q0 = vec4(0,0,0,1);            
    vec4 q1 = quatAxisAngle(y, s2*20.0);
    vec4 q2 = quatAxisAngle(x, s2*20.0-5.0);
    vec4 q3 = quatAxisAngle(z, t2*10.0-10.0);
    vec4 q4 = quatAxisAngle(x, t2*10.0);
    vec4 q5 = quatAxisAngle(y, t4*20.0);
    vec4 q6 = quatAxisAngle(z, t4*10.0);
    vec4 q7 = quatAxisAngle(x, s16*3.0);
    vec4 qh = quatAxisAngle(x, abs(s8)*(sq*20.0+40.0));

    qHip    = quatMul(q2,     q1);  
    qSpine  = quatMul(qHip,   q4);  
    qTorso  = quatMul(qHip,   q1); 
    qNeck   = quatMul(q6,     q5);
    qHead   = quatMul(q7,  qNeck); 
    
    qArmL   = quatAxisAngle(z, -t2*20.0);
    qArmR   = quatMul(quatAxisAngle(z,  s4*20.0), q3);
    qLegR   = quatAxisAngle(z,  s4*20.0);
    qEyes   = quatAxisAngle(y,  s1*15.0);
            
    qFootL  = quatAxisAngle(y, -smoothstep(0.0, 1.0, s4)*(sh*20.0+30.0));
    qFootR  = quatAxisAngle(y,  smoothstep(0.0, 1.0, t4)*(sq*15.0+25.0));
            
    qLegL   = quatMul(qLegR, qFootL);  
    qLegR   = quatMul(qLegR, qFootR);  
    
    qKneeL  = quatMul(qLegL, quatAxisAngle(-x, smoothstep(0.0, 1.0, s4)*(sq*40.0+50.0)));
    qKneeR  = quatMul(qLegR, quatAxisAngle(-x, smoothstep(0.0, 1.0, t4)*(sq*40.0+50.0)));
    qElbowL = quatMul(qArmL, quatAxisAngle( x, smoothstep(0.0, 1.0, t4)*(sq*50.0+60.0))); 
    qElbowR = quatMul(qArmR, quatAxisAngle( x, smoothstep(0.0, 1.0, s4)*(sq*50.0+60.0)));
    
    qHandR  = quatMul(qh, quatMul(qArmR, qElbowR));
    qHandL  = quatMul(qh, quatMul(qArmL, qElbowL));
}

void poseNeutral()
{
    pHip = vec0;
    
    vec4 q = vec4(0,0,0,1);
    qHip  = q; qNeck = q; qSpine = q; qTorso = q; 
    qArmL = q; qArmR = q; qHandL = q; qHandR = q;
    qLegL = q; qLegR = q; qFootL = q; qFootR = q;
    qHead = q; qEyes = q;
    qKneeL = q; qKneeR = q;
    qElbowL = q; qElbowR = q;
}

//  0000000   000   000  000  00     00  
// 000   000  0000  000  000  000   000  
// 000000000  000 0 000  000  000000000  
// 000   000  000  0000  000  000 0 000  
// 000   000  000   000  000  000   000  

void calcAnim()
{
    pHipUp   = rotate(qHip, vec3(0,1,0));
    pHipT    = pHip + pHipUp*0.6;
    
    pHipRotL = rotate(qHip, rotZ(vec3(0,1,0),  120.0));
    pHipRotR = rotate(qHip, rotZ(vec3(0,1,0), -120.0));
    
    pHipL    = pHip + 0.6*pHipRotL;
    pHipR    = pHip + 0.6*pHipRotR;
    
    vec3 vs = rotate(qSpine, 0.5*pHipUp);
    pSpine   = pHipT  + vs;
    pTorsoB  = pSpine + rotate(qSpine, vs);
    
    pTorsoRotL = 1.2*pHipRotL;
    pTorsoRotR = 1.2*pHipRotR;
    
    pTorsoUp = pHipUp;
    pTorsoT  = pTorsoB + pTorsoUp*1.2;
    pTorsoR  = pTorsoT + pTorsoRotR;
    pTorsoL  = pTorsoT + pTorsoRotL;
    
    vec3 vn = rotate(qNeck, 0.5*vec3(0,1,0));
    pNeck    = pTorsoT + vn;
    pHead    = pNeck   + rotate(qNeck, vn);
    
    pEyeL    = pHead + rotate(qHead, vec3( 0.5, 0.45, -1.3));
    pEyeR    = pHead + rotate(qHead, vec3(-0.5, 0.45, -1.3));
    pHeadUp  = rotate(qHead, vec3(0,1,0));
    pHeadZ   = rotate(qHead, vec3(0,0,1));
    
    vec3 nZ = rotate(qEyes, vec3(0,0,-1));
    vec3 eyeCam = normalize(camPos - (pEyeL+pEyeR)*0.5);
    eyeCam = mix(nZ, eyeCam, dot(nZ, eyeCam));
    pEyeHoleL = pEyeL+eyeCam*0.25;
    pEyeHoleR = pEyeR+eyeCam*0.25;
    pEyeLensL = pEyeL+eyeCam*0.2;
    pEyeLensR = pEyeR+eyeCam*0.2;
        
    pArmLup = rotate(qArmL,   vec3(0,1,0));
    pArmLud = rotate(qElbowL, vec3(0,1,0));
    pArmLx  = rotate(qArmL,   vec3(1,0,0));
    pArmLz  = rotate(qArmL,   vec3(0,0,1));
    
    pElbowL = pTorsoL +0.45*pArmLx -1.20*pArmLup;
    pHandL  = pElbowL -1.15*pArmLud;    
    
    pArmRup = rotate(qArmR,   vec3(0,1,0));
    pArmRud = rotate(qElbowR, vec3(0,1,0));
    pArmRx  = rotate(qArmR,   vec3(1,0,0));
    pArmRz  = rotate(qArmR,   vec3(0,0,1));
    
    pElbowR = pTorsoR -0.45*pArmRx -1.20*pArmRup;
    pHandR  = pElbowR -1.15*pArmRud;    

    pHandLz = rotate(qHandL, vec3(-1,0,0));
    pHandRz = rotate(qHandR, vec3( 1,0,0));

    pHandLup = rotate(qHandL, vec3(0,1,0));
    pHandRup = rotate(qHandR, vec3(0,1,0));
    pPalmL  = pHandL - 0.6 * pHandLup;
    pPalmR  = pHandR - 0.6 * pHandRup;

    pLegLup = rotate(qLegL, vec3(0,1,0));
    pLegLud = rotate(qKneeL, vec3(0,1,0));
    pLegLx  = rotate(qLegL, vec3(1,0,0));
    pLegLz  = rotate(qLegL, vec3(0,0,1));
    
    pKneeL  = pHipL +0.45*pLegLx -1.20*pLegLup;
    pFootL  = pKneeL -1.15*pLegLud;

    pLegRup = rotate(qLegR, vec3(0,1,0));
    pLegRud = rotate(qKneeR, vec3(0,1,0));
    pLegRx  = rotate(qLegR, vec3(1,0,0));
    pLegRz  = rotate(qLegR, vec3(0,0,1));
    
    pKneeR  = pHipR -0.45*pLegRx -1.20*pLegRup;
    pFootR  = pKneeR -1.15*pLegRud;    

    pFootLup = rotate(qFootL, vec3(0,1,0));
    pFootLz  = rotate(qFootL, vec3(0,0,1));
    pHeelL   = pFootL -0.75 * pFootLup;
    pToeL    = pHeelL -0.75 * pFootLz;
    
    pFootRup = rotate(qFootR, vec3(0,1,0));
    pFootRz  = rotate(qFootR, vec3(0,0,1));
    pHeelR   = pFootR -0.75 * pFootRup;
    pToeR    = pHeelR -0.75 * pFootRz;    
}

// 000   000  000  00000000   
// 000   000  000  000   000  
// 000000000  000  00000000   
// 000   000  000  000        
// 000   000  000  000        

void hip()
{
    float d = sdSphere(s.pos, pHip, 0.5);
    
    d = opUnion(d, sdBearing(s.pos, pHipT, -pHipUp,   0.3));
    d = opUnion(d, sdBearing(s.pos, pHipL, -pHipRotL, 0.3));
    d = opUnion(d, sdBearing(s.pos, pHipR, -pHipRotR, 0.3));
    
    if (d < s.dist) { s.mat = BODY; s.dist = d; }
}

//  0000000  00000000   000  000   000  00000000  
// 000       000   000  000  0000  000  000       
// 0000000   00000000   000  000 0 000  0000000   
//      000  000        000  000  0000  000       
// 0000000   000        000  000   000  00000000  

void spine(vec3 pos, vec3 mid, vec3 top)
{
    vec3 up = normalize(top-mid);
    float d = sdBearing(s.pos, mid, up, 0.25);

    if (d > s.dist+0.6) return;
    
    d = opUnion(d, sdCapsule(s.pos, mid, top, 0.15));
    d = opUnion(d, sdSphere (s.pos, top, 0.25));

    d = min    (d, sdSphere (s.pos, mid, 0.22));
    d = opUnion(d, sdSphere (s.pos, pos, 0.25));
    d = opUnion(d, sdCapsule(s.pos, pos, mid, 0.15));
    
    if (d < s.dist) { s.mat = BONE; s.dist = d; }
}

// 000000000   0000000   00000000    0000000   0000000   
//    000     000   000  000   000  000       000   000  
//    000     000   000  0000000    0000000   000   000  
//    000     000   000  000   000       000  000   000  
//    000      0000000   000   000  0000000    0000000   

void torso()
{
    float d = sdSocket(s.pos, pTorsoT, -pTorsoUp, 1.0, 0.1);
    
    if (d > s.dist+0.25) return;
    
    d = opUnion(d, sdBearing(s.pos, pTorsoT, -pTorsoUp, 0.3));
    d = opUnion(d, sdBearing(s.pos, pTorsoB,  pTorsoUp, 0.3));
    d = opUnion(d, sdBearing(s.pos, pTorsoR, -pTorsoRotR, 0.3));
    d = opUnion(d, sdBearing(s.pos, pTorsoL, -pTorsoRotL, 0.3));
    
    if (d < s.dist) { s.mat = BODY; s.dist = d; }
}

// 00000000  000   000  00000000  
// 000        000 000   000       
// 0000000     00000    0000000   
// 000          000     000       
// 00000000     000     00000000  

void eye(vec3 pos, vec3 pupil, vec3 lens)
{
    float d = sdSphere(s.pos, pos, 0.25);
    if (d > s.dist) return;
    
    d = opDiff(d, 0.01, sdSphere(s.pos, pupil, 0.125));

    if (d < s.dist) { s.mat = BULB; s.dist = d; }
    
    d = min(d, sdSphere(s.pos, lens, 0.1));
    
    if (d < s.dist) { s.mat = PUPL; s.dist = d; }
}

// 000   000  00000000   0000000   0000000    
// 000   000  000       000   000  000   000  
// 000000000  0000000   000000000  000   000  
// 000   000  000       000   000  000   000  
// 000   000  00000000  000   000  0000000    

void head()
{
    float d = sdSocket(s.pos, pHead, pHeadUp, 1.3, 0.1);
    
    if (d > s.dist+0.3) return;
    
    d = opUnion(d, sdBearing(s.pos, pHead, pHeadUp, 0.3));
    d = opUnion(d, sdBearing(s.pos, pEyeL, pHeadZ, 0.33));
    d = opUnion(d, sdBearing(s.pos, pEyeR, pHeadZ, 0.33));

    if (d < s.dist) { s.mat = BODY; s.dist = d; }
    
    eye(pEyeL, pEyeHoleL, pEyeLensL);
    eye(pEyeR, pEyeHoleR, pEyeLensR);
}

//  0000000   00000000   00     00  
// 000   000  000   000  000   000  
// 000000000  0000000    000000000  
// 000   000  000   000  000 0 000  
// 000   000  000   000  000   000  

void arm(vec3 pos, float side, vec3 elbow, vec3 hand, vec3 up, vec3 ud, vec3 x, vec3 z)
{
    float bb = sdSphere(s.pos, elbow, 2.0);
    if (bb > s.dist) return;
     
    float d = sdSphere(s.pos, pos, 0.25);
    
    d = opUnion(d, sdBend(s.pos, pos, z, x, side, vec2(0.45, 0.1)));
    d = min    (d, sdCapsule(s.pos, elbow+0.75*up, elbow+0.2*up, 0.1));
         
    d = opUnion(d, sdTorus(s.pos, elbow, x, vec2(0.2, 0.07)));
     
    if (d < s.dist) { s.mat = BONE; s.dist = d; }
    
    d = sdCapsule(s.pos, elbow-0.25*ud, elbow-1.0*ud, 0.1);

    d = opUnion(d, sdDoubleTorus(s.pos, elbow, x, vec3(0.2, 0.07, 0.15)));
    d = opUnion(d, sdBearing(s.pos, hand, ud, 0.3));
     
    if (d < s.dist) { s.mat = BONE; s.dist = d; }
}

// 00000000   0000000    0000000   000000000  
// 000       000   000  000   000     000     
// 000000    000   000  000   000     000     
// 000       000   000  000   000     000     
// 000        0000000    0000000      000     

void foot(vec3 pos, vec3 heel, vec3 toe, vec3 up)
{
    float d = sdHalfSphere(s.pos, heel, up, 0.5);
    
    if (d > s.dist+0.9) return;
    
    d = opUnion(d, 0.1, sdSphere(s.pos, pos, 0.25));
    d = opUnion(d, sdHalfSphere (s.pos, toe, up, 0.4));
    
    d = opUnion(d, 0.02, sdTorus(s.pos, heel, up, vec2(0.53, 0.07)));
    d = opUnion(d, 0.02, sdTorus(s.pos, toe,  up, vec2(0.43, 0.07)));
    
    if (d < s.dist) { s.mat = BODY; s.dist = d; }
}

// 000   000   0000000   000   000  0000000    
// 000   000  000   000  0000  000  000   000  
// 000000000  000000000  000 0 000  000   000  
// 000   000  000   000  000  0000  000   000  
// 000   000  000   000  000   000  0000000    

void hand(vec3 pos, vec3 palm, vec3 z)
{    
    float d = sdSocket(s.pos, palm+z*0.15, -z, 0.5);
    
    d = opUnion(d, sdSphere(s.pos, pos, 0.25));
    
    if (d < s.dist) { s.mat = BODY; s.dist = d; }
}

// 00     00   0000000   00000000   
// 000   000  000   000  000   000  
// 000000000  000000000  00000000   
// 000 0 000  000   000  000        
// 000   000  000   000  000        

float map(vec3 p)
{
    float planeDist = sdPlane(p, vec3(0,FLOOR,0), vec3(0,1,0));
   
    #ifndef TOY
    if (iCamera.y < FLOOR) { planeDist = 1000.0; }
    #endif
     
    s = sdf(planeDist, p, PLANE);
         
    hip  ();
    spine(pHipT, pSpine, pTorsoB);
    torso();
    spine(pTorsoT, pNeck, pHead);
    head ();
             
    arm  (pTorsoR,  1.0, pElbowR, pHandR, pArmRup, pArmRud, pArmRx,  pArmRz);
    arm  (pTorsoL, -1.0, pElbowL, pHandL, pArmLup, pArmLud, pArmLx,  pArmLz);
    arm  (pHipR,    1.0, pKneeR,  pFootR, pLegRup, pLegRud, pLegRx, pLegRz);
    arm  (pHipL,   -1.0, pKneeL,  pFootL, pLegLup, pLegLud, pLegLx, pLegLz);
    foot (pFootR,        pHeelR,  pToeR,  pFootRup);
    foot (pFootL,        pHeelL,  pToeL,  pFootLup);
    hand (pHandR,        pPalmR,  pHandRz);
    hand (pHandL,        pPalmL,  pHandLz);
    
    return s.dist;
}

vec3 getNormal(vec3 p)
{
    vec3 n = vec0;
    for (int i=ZERO; i<4; i++)
    {
        vec3 e = 0.5773*(2.0*vec3((((i+3)>>1)&1),((i>>1)&1),(i&1))-1.0);
        n += e*map(p+e*0.0001);
    }
    return normalize(n);
}

// 00     00   0000000   00000000    0000000  000   000  
// 000   000  000   000  000   000  000       000   000  
// 000000000  000000000  0000000    000       000000000  
// 000 0 000  000   000  000   000  000       000   000  
// 000   000  000   000  000   000   0000000  000   000  

float rayMarch(vec3 ro, vec3 rd)
{
    float dz = 0.0;

    for (int i = ZERO; i < MAX_STEPS; i++)
    {
        vec3 p = ro + dz * rd;
        float d = map(p);
        dz += d;
        if (d < MIN_DIST) return dz;
        if (dz > MAX_DIST) break;
    }
    s.mat = NONE;
    return dz;
}

//  0000000  000   000   0000000   0000000     0000000   000   000  
// 000       000   000  000   000  000   000  000   000  000 0 000  
// 0000000   000000000  000000000  000   000  000   000  000000000  
//      000  000   000  000   000  000   000  000   000  000   000  
// 0000000   000   000  000   000  0000000     0000000   00     00  

float hardShadow(vec3 ro, vec3 rd, float mint, float maxt, const float w)
{
    if (!rayIntersectsSphere(ro, rd, vec3(0,1.0,0), 5.0))
    {
        return 0.0;
    }
    
    for (float t=mint+float(ZERO); t<maxt;)
    {
        float h = map(ro+rd*t);
        if (h < 0.001)
        {
            return w;
        }
        t+=h;
    }
    return 1.0;
}

// 000      000   0000000   000   000  000000000  
// 000      000  000        000   000     000     
// 000      000  000  0000  000000000     000     
// 000      000  000   000  000   000     000     
// 0000000  000   0000000   000   000     000     

float getLight(vec3 p, vec3 n)
{
    float t = 0.0; // sin(iTime*0.2);
    vec3 lp = rotY(rotX(vec3(0, 10, -10), -10.0 - 20.0*t), 20.0*t);
    vec3 l = normalize(lp - p);
 
    float dif = dot(n,l);
    
    vec3 off = p+n*2.0*MIN_DIST;

    dif *= hardShadow(off, normalize(lp-off), MIN_DIST, 100.0, 0.5);
        
    return clamp(dif, 0.0, 1.0);
}

// 00     00   0000000   000  000   000  
// 000   000  000   000  000  0000  000  
// 000000000  000000000  000  000 0 000  
// 000 0 000  000   000  000  000  0000  
// 000   000  000   000  000  000   000  

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = (fragCoord-.5*iResolution.xy)/iResolution.y;
    vec3 ct;
    
    #ifdef TOY
    	ct = vec0;
    	float my = -2.0*(iMouse.y/iResolution.y-0.5);
    	float mx = -2.0*(iMouse.x/iResolution.x-0.5);
    	float md = -12.5-my*2.5;
    	if (iMouse.z <= 0.0)
    	{
        	mx = sin(iTime*0.2)*0.5;
    		my = sin(iTime*0.1)*0.5;
            md = -12.5-2.5*sin(iTime*0.05);
            ct.y = 0.4-sin(iTime*0.05)*0.4;
    	}
    	else
        {
            ct.y = 0.35-my*0.35;
        }
    
    	camPos = rotAxisAngle(rotAxisAngle(vec3(0,0,md), vec3(1,0,0), 20.0+30.0*my), vec3(0,1,0), 90.0*mx);
    #else
        ct = iCenter; 
    	camPos = iCamera;
        camPos.x *= -1.0; 
    	ct.x *= -1.0;
    #endif

    if (true) poseDancing();
    else      poseNeutral();
    calcAnim();
    
    vec3 ww = normalize(ct-camPos);
    vec3 uu = normalize(cross(ww, vec3(0,1,0)));
    vec3 vv = normalize(cross(uu, ww));
    
    vec3 rd = normalize(uv.x*uu + uv.y*vv + 1.0*ww);
    
    float d = rayMarch(camPos, rd);
    int mat = s.mat;
    
    vec3  p = camPos + d * rd;
    vec3  n = getNormal(p);
    float l = getLight(p,n);
        
    vec3 col;
    
    if      (mat == NONE)  col = vec3(0,0,0); 
    else if (mat == PLANE) col = vec3(0.2,0.2,0.2); 
    else if (mat == BODY)  col = vec3(1.0,0.0,0.0); 
    else if (mat == BONE)  col = vec3(1.0,1.0,0.0);
    else if (mat == PUPL)  col = vec3(0.5,0.5,1.0);
    else col = vec3(1,1,1);

    #ifndef TOY    
    if (fragCoord.x < 2.5 && (iResolution.y * floor(1000.0/iMs) / 60.0 - fragCoord.y) < 2.0)
    {
        l = 1.0-l;
        col = vec3(1,1,1);
    }
    #endif
    
    fragColor = vec4(col * l, 1.0);
}
