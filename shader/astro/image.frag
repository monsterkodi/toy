
// #define TOY  1

#define MAX_STEPS 96
#define MIN_DIST   0.005
#define MAX_DIST  40.0
#define SHADOW     0.04
#define PI 3.1415926535897
#define ZERO min(iFrame,0)

#define NONE  0
#define BODY  1
#define BONE  2
#define VISOR 3
#define MOON  4

vec3 v0 = vec3(0,0,0);
vec3 vx = vec3(1,0,0);
vec3 vy = vec3(0,1,0);
vec3 vz = vec3(0,0,1);


struct ray {
    vec3 pos;
    vec3 dir;
};

struct sdf {
    float dist;
    vec3  pos;
    int   mat;
};

struct pivot {
    vec3 p;
    vec3 x;
    vec3 y;
    vec3 z;
    mat3 m;
};


#define pivot0  pivot(v0,vx,vy,vz,mat3(1,0,0,0,1,0,0,0,1))

pivot pHip;
pivot pTorso;
pivot pHead;
pivot pArmL;
pivot pArmR;
pivot pElbowL;
pivot pElbowR;
pivot pHandL;
pivot pHandR;
pivot pLegL;
pivot pLegR;
pivot pKneeL;
pivot pKneeR;
pivot pFootL;
pivot pFootR;

pivot pCam;

vec3 pTorsoT;   
vec3 pTorsoB;
vec3 pHeelL;    
vec3 pHeelR;
vec3 pToeL;     
vec3 pToeR;

vec3 camTgt;
vec3 pLight;

bool soft;
bool camrot;
int  option;

sdf  s;
vec2 frag, uv;

float rad2deg(float r) { return 180.0 * r / PI; }
float deg2rad(float d) { return PI * d / 180.0; }

vec3 hash33(vec3 p)
{ 
    float n = sin(dot(p, vec3(7, 157, 113)));    
    return fract(vec3(2097152, 262144, 32768)*n); 
}

vec3 hash31(float p)
{
   vec3 p3 = fract(vec3(p) * vec3(0.1031, 0.1030, 0.0973));
   p3 += dot(p3, p3.yzx+33.33);
   return fract((p3.xxy+p3.yzz)*p3.zyx); 
}

float hash12(vec2 p)
{
    vec3 p3  = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float clamp01(float v) { return clamp(v, 0.0, 1.0); }

float voronoi(vec3 p)
{
	vec3 b, r, g = floor(p);
	p = fract(p);
	float d = p.z; 
	for(int j = -1; j <= 1; j++) {
	    for(int i = -1; i <= 1; i++) {
		    b = vec3(i, j, -1);
		    r = b - p + hash33(g+b);
		    d = min(d, dot(r,r));
		    b.z = 0.0;
		    r = b - p + hash33(g+b);
		    d = min(d, dot(r,r));
		    b.z = 1.;
		    r = b - p + hash33(g+b);
		    d = min(d, dot(r,r));
	    }
	}
	
	return 1.-d*1.0/p.z;
}

// 0000000    000   0000000   000  000000000  
// 000   000  000  000        000     000     
// 000   000  000  000  0000  000     000     
// 000   000  000  000   000  000     000     
// 0000000    000   0000000   000     000     

float digit(int x, int y, float value, float format)
{     
    float digits  = floor(format);
    float decimal = fract(format)*10.0;
    vec2 pos = (frag-vec2(float(x),float(y))) / vec2(16.0, 25.0);
    
    if ((pos.y < 0.0) || (pos.y >= 1.0)) return 0.0;
    if ((pos.x < 0.0) || (pos.x >= digits+decimal+2.0)) return 0.0;
    
    bool neg = value < 0.0;
    value = abs(value);
    
    float log10 = log2(abs(value))/log2(10.0);
    float maxIndex = max(floor(log10), 0.0);
    float index = digits - floor(pos.x);
    float bin = 0.;
    if (index > (-decimal - 1.01))
    {
        if (index > maxIndex) { if (neg && index < maxIndex+1.5) bin = 1792.; } // minus sign 
        else if (index == -1.0) { if (decimal > 0.0) bin = 2.; } // decimal dot 
        else 
        {
            float reduced = value;
            if (index < 0.0) 
            { 
                reduced = fract(value); 
                index += 1.0; 
            }

            switch (int(floor(mod(abs(reduced/(pow(10.0, index))), 10.0))))
            {
            case 0: bin = 480599.; break;
            case 1: bin = 139810.+65536.; break;
            case 2: bin = 476951.; break;
            case 3: bin = 476999.; break;
            case 4: bin = 350020.; break;
            case 5: bin = 464711.; break;
            case 6: bin = 464727.; break;
            case 7: bin = 476228.; break;
            case 8: bin = 481111.; break;
            case 9: bin = 481095.; break;
            }
        }
    }

    return floor(mod((float(bin) / pow(2.0, floor(fract(pos.x)*4.0) + (floor(pos.y*5.0)*4.0))), 2.0));
}

// 00000000    0000000   000000000  
// 000   000  000   000     000     
// 0000000    000   000     000     
// 000   000  000   000     000     
// 000   000   0000000      000     

mat3 rotMat(vec3 u, float angle)
{
    float s = sin(deg2rad(angle));
    float c = cos(deg2rad(angle));
    float i = 1.0-c;
    
    return mat3(
        c+u.x*u.x*i, u.x*u.y*i-u.z*s, u.x*u.z*i+u.y*s,
        u.y*u.x*i+u.z*s, c+u.y*u.y*i, u.y*u.z*i-u.x*s,
        u.z*u.x*i-u.y*s, u.z*u.y*i+u.x*s, c+u.z*u.z*i
        );
}

vec3 rotAxisAngle(vec3 position, vec3 axis, float angle)
{
    mat3 m = rotMat(axis, angle);
    return m * position;
}

// 00     00   0000000   000000000  
// 000   000  000   000     000     
// 000000000  000000000     000     
// 000 0 000  000   000     000     
// 000   000  000   000     000     

mat3 rMatX(float x)
{
     float r = deg2rad(x);
     float c = cos(r), s = sin(r);
     return mat3(1,0,0,0,c,-s,0,s,c);
}

mat3 rMatY(float y)
{
     float r = deg2rad(y);
     float c = cos(r), s = sin(r);
     return mat3(c,0,s,0,1,0,-s,0,c);
}

mat3 rMatZ(float z)
{
     float r = deg2rad(z);
     float c = cos(r), s = sin(r);
     return mat3(c,-s,0,s,c,0,0,0,1);
}

// 00000000  000   000  000      00000000  00000000   
// 000       000   000  000      000       000   000  
// 0000000   000   000  000      0000000   0000000    
// 000       000   000  000      000       000   000  
// 00000000   0000000   0000000  00000000  000   000  

mat3 euler(float x, float y, float z)
{
    return rMatY(y) * rMatX(x) * rMatZ(z);
}

void eulerPivot(inout pivot p, float x, float y, float z)
{
    p.m = euler(x,y,z);
    p.x = p.m * vx;
    p.y = p.m * vy;
    p.z = p.m * vz;
}

void concatPivotXY(inout pivot p, pivot o, float x, float y)
{
    p.m = o.m * euler(x,y,0.0);
    p.x = p.m * vx;
    p.y = p.m * vy;
    p.z = p.m * vz;
}

void concatPivotYZ(inout pivot p, pivot o, float y, float z)
{
    p.m = o.m * euler(0.0,y,z);
    p.x = p.m * vx;
    p.y = p.m * vy;
    p.z = p.m * vz;
}

vec3 posOnPlane(vec3 p, vec3 n)
{
    return p-dot(p,n)*n;
}

//  0000000   00000000   
// 000   000  000   000  
// 000   000  00000000   
// 000   000  000        
//  0000000   000        

float opUnion(float d1, float d2, float k) 
{
    float h = clamp(0.5 + 0.5*(d2-d1)/k, 0.0, 1.0);
    return mix(d2, d1, h) - k*h*(1.0-h);
}

float opDiff(float d1, float d2, float k) 
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
    vec3 c = a+clamp01(dot(ab,p-a)/dot(ab,ab))*ab;
    return length(p-c)-r;        
}

float sdTorus(vec3 p, vec3 a, vec3 n, vec2 r)
{
    vec3 q = p-a;
    return length(vec2(length(posOnPlane(q, n))-r.x,abs(dot(n, q))))-r.y;
}

float sdSphere(vec3 p, vec3 a, float r)
{
    return length(p-a)-r;
}

float sdPlane(vec3 p, vec3 a, vec3 n)
{   
    return dot(n, p-a);
}

// 00000000    0000000    0000000  00000000  
// 000   000  000   000  000       000       
// 00000000   000   000  0000000   0000000   
// 000        000   000       000  000       
// 000         0000000   0000000   00000000  

void poseNeutral()
{
    pivot p0 = pivot0;
    pHip    = p0;
    pTorso  = p0;
    pHead   = p0;
    pArmL   = p0;
    pArmR   = p0;
    pElbowL = p0;
    pElbowR = p0;
    pHandL  = p0;
    pHandR  = p0;
    pLegL   = p0;
    pLegR   = p0;
    pKneeL  = p0;
    pKneeR  = p0;
    pFootL  = p0;
    pFootR  = p0;
}

// 00000000  000       0000000    0000000   000000000  
// 000       000      000   000  000   000     000     
// 000000    000      000   000  000000000     000     
// 000       000      000   000  000   000     000     
// 000       0000000   0000000   000   000     000     

void poseFloating()
{    
    float s0 = sin(iTime*0.125);
    float s1 = sin(iTime*0.25);
    float s2 = sin(iTime*0.5);
    float s3 = sin(iTime*1.0);
    float s4 = sin(iTime*4.0);
    
    if (camrot)
    	eulerPivot(pHip, sin(iTime*0.1)*15.0, 0.0, sin(iTime*0.2)*25.0);
   	else
        pHip = pivot0;
    
    concatPivotXY(pTorso, pHip, s2*15.0, s1*35.0);
    
    float ht = iTime*0.6;
    vec3 hsh = mix(hash31(floor(ht)), hash31(floor(ht)+1.0), smoothstep(0.0,1.0,fract(ht)));
    
    concatPivotXY(pHead,   pTorso, 10.0-20.0*hsh.x, 20.0-40.0*hsh.y);
    concatPivotYZ(pArmL,   pTorso,  30.0-s3*20.0, -30.0-s1*20.0);
    concatPivotYZ(pArmR,   pTorso, -30.0-s3*20.0,  30.0-s1*20.0);
    
    concatPivotXY(pElbowL, pArmL,  -60.0+s1*30.0,  0.0);
    concatPivotXY(pElbowR, pArmR,  -60.0-s2*30.0,  0.0);
    
    concatPivotYZ(pHandL, pElbowL,  0.0, 0.0);
    concatPivotYZ(pHandR, pElbowR,  0.0, 0.0);

    concatPivotYZ(pLegL,   pHip,    s0*20.0, -20.0+s1*20.0);
    concatPivotYZ(pLegR,   pHip,    s2*20.0,  20.0+s1*20.0);
    
    concatPivotXY(pKneeL, pLegL,    60.0-s1*30.0,  0.0);
    concatPivotXY(pKneeR, pLegR,    60.0+s2*30.0,  0.0);
    
    concatPivotXY(pFootL, pKneeL,   0.0,  0.0);
    concatPivotXY(pFootR, pKneeR,   0.0,  0.0);
}

//  0000000   000   000  000  00     00  
// 000   000  0000  000  000  000   000  
// 000000000  000 0 000  000  000000000  
// 000   000  000  0000  000  000 0 000  
// 000   000  000   000  000  000   000  

void calcAnim()
{
    pHip.p   -= pHip.y;

    pLegL.p   = pHip.p + 0.3*pHip.x -0.1*pHip.y; 
    pLegR.p   = pHip.p - 0.3*pHip.x -0.1*pHip.y; 
    
    pTorsoB   = pHip.p+1.5*pHip.y;
    pTorsoT   = pTorsoB + pTorso.y *0.3;
    pArmR.p   = pTorsoT - pTorso.x *1.2; 
    pArmL.p   = pTorsoT + pTorso.x *1.2; 
    
    pHead.p   = pTorsoT + pTorso.y;
    
    pElbowL.p = pArmL.p   +0.45*pArmL.x -1.20*pArmL.y;
    pHandL.p  = pElbowL.p -1.15*pElbowL.y;    
    
    pElbowR.p = pArmR.p   -0.45*pArmR.x -1.20*pArmR.y;
    pHandR.p  = pElbowR.p -1.15*pElbowR.y;    

    pHandL.p -= 0.6 * pHandL.y;
    pHandR.p -= 0.6 * pHandR.y;

    pKneeL.p  = pLegL.p  +0.45*pLegL.x -1.20*pLegL.y;
    pFootL.p  = pKneeL.p -1.15*pKneeL.y;

    pKneeR.p  = pLegR.p  -0.45*pLegR.x -1.20*pLegR.y;
    pFootR.p  = pKneeR.p -1.15*pKneeR.y;    

    pHeelL    = pFootL.p -0.75 * pFootL.y;
    pToeL     = pHeelL -0.75 * pFootL.z;
    
    pHeelR    = pFootR.p -0.75 * pFootR.y;
    pToeR     = pHeelR -0.75 * pFootR.z;    
}

//  0000000   00000000   00     00  
// 000   000  000   000  000   000  
// 000000000  0000000    000000000  
// 000   000  000   000  000 0 000  
// 000   000  000   000  000   000  

float arm(vec3 pos, float side, vec3 elbow, vec3 ud, vec3 x)
{
    float d = sdCapsule(s.pos, pos-side*x*0.15, elbow, 0.45);
    return opUnion(d, sdCapsule(s.pos, elbow-0.2*ud, elbow-1.0*ud, 0.45), 0.2);
}

// 00000000   0000000    0000000   000000000  
// 000       000   000  000   000     000     
// 000000    000   000  000   000     000     
// 000       000   000  000   000     000     
// 000        0000000    0000000      000     

float foot(vec3 heel, vec3 toe, vec3 up)
{
    float d = sdCapsule(s.pos, heel, toe, 0.7);
    return opDiff(d, sdPlane(s.pos, heel-0.3*up, up), 0.3);
}

// 00     00   0000000    0000000   000   000  
// 000   000  000   000  000   000  0000  000  
// 000000000  000   000  000   000  000 0 000  
// 000 0 000  000   000  000   000  000  0000  
// 000   000   0000000    0000000   000   000  

void moon()
{
    if (length(uv+vec2(0.5,-0.25)) > 0.12) return;
    
    vec3 p = pCam.p+pCam.z*MAX_DIST/2.0+pCam.x*MAX_DIST/4.0+pCam.y*MAX_DIST/8.0;
    
    float r = MAX_DIST/20.0;
    float d = sdSphere(s.pos, p, r);
    
    if (d > s.dist) return;
    
    d = opDiff(d, sdSphere(s.pos, p-normalize(pCam.z+pCam.x/2.0)      *r*0.95, r/6.0), 0.3);
    d = opDiff(d, sdSphere(s.pos, p-normalize(pCam.z+pCam.x*2.0+pCam.y)*r*1.3,  r/2.0), 0.5);
    d = opDiff(d, sdSphere(s.pos, p-normalize(pCam.z-pCam.x+pCam.y)    *r*1.1,  r/3.0), 0.4);
    d = opDiff(d, sdSphere(s.pos, p-normalize(pCam.z+pCam.x-pCam.y)    *r*1.0,  r/4.0), 0.4);
    d = opDiff(d, sdSphere(s.pos, p-normalize(pCam.z+pCam.x+4.0*pCam.y)*r*1.2,  r/3.0), 0.4);
    d = opDiff(d, sdSphere(s.pos, p-normalize(pCam.z-0.75*pCam.x-0.75*pCam.y)*r*1.4,  r/1.5), 0.5);
    
    if (d < s.dist) { s.mat = MOON; s.dist = d; }
}

// 00     00   0000000   00000000   
// 000   000  000   000  000   000  
// 000000000  000000000  00000000   
// 000 0 000  000   000  000        
// 000   000  000   000  000        

float map(vec3 p)
{
    s = sdf(1000.0, p, NONE);
    
    moon();
    
    if (length(uv) > 0.44) return s.dist;
    
    float d = sdSphere(s.pos, pTorsoB, 1.3);
    
    if (option != 1 && d > s.dist-20.0)
    {
        return s.dist;
    }
    //if (d > 4.1 && p.z > 0.0)
    //{
    //    return s.dist;
    //}
    
    d = opDiff (d, sdTorus(s.pos, pTorsoB-1.27*pTorso.z, pTorso.z, vec2(0.45,0.07)), 0.15);
    d = opUnion(d, sdSphere(s.pos, pHip.p, 0.9), 0.15);
    d = opUnion(d, sdCapsule(s.pos, pArmL.p-0.0*pTorso.y, pArmR.p-0.0*pTorso.y, 0.7), 0.15);
        
    d = min(d, foot (pHeelR,  pToeR,  pFootR.y));
    d = min(d, foot (pHeelL,  pToeL,  pFootL.y));
    
    d =    min(d, sdSphere(s.pos, pHead.p+pHead.y, 1.6));
    d = opDiff(d, sdSphere(s.pos, pHead.p+pHead.y-(pHead.z-pHead.y*0.5)*0.5, 1.2), 0.5);
    
    d = min(d, sdSphere(s.pos, pHandR.p, 0.65));
    d = min(d, sdSphere(s.pos, pHandL.p, 0.65));

    d = opDiff(d, sdCapsule(s.pos, pHandR.p-pHandR.z-pHandR.y*0.2+pHandR.x*0.2, pHandR.p+pHandR.z-pHandR.y*0.2+pHandR.x*0.2, 0.37), 0.2);
    d = opDiff(d, sdCapsule(s.pos, pHandL.p-pHandL.z-pHandL.y*0.2-pHandL.x*0.2, pHandL.p+pHandL.z-pHandL.y*0.2-pHandL.x*0.2, 0.37), 0.2);
    
    if (d < s.dist) { s.mat = BODY; s.dist = d; }

    d = min(d, arm  (pArmR.p,  1.0, pElbowR.p, pElbowR.y, pArmR.x));
    d = min(d, arm  (pArmL.p, -1.0, pElbowL.p, pElbowL.y, pArmL.x));
    d = min(d, arm  (pLegR.p,  1.0, pKneeR.p,  pKneeR.y,  pLegR.x));
    d = min(d, arm  (pLegL.p, -1.0, pKneeL.p,  pKneeL.y,  pLegL.x));

    if (d < s.dist) { s.mat = BONE; s.dist = d; }
    
    
        
    d = min(d, sdSphere(s.pos, pHead.p+pHead.y, 1.3));
    
    if (d < s.dist) { s.mat = VISOR; s.dist = d; }
    
    return s.dist;
}

vec3 getNormal(vec3 p)
{
    vec3 n = v0;
    for (int i = ZERO; i < 4; i++)
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

float softShadow(vec3 ro, vec3 rd, float k)
{
    float shade = 1.;
    float dist = MIN_DIST;    
    float end = max(length(rd), MIN_DIST);
    float stepDist = end/25.0;
    rd /= end;
    for (int i = ZERO; i < 25; i++)
    {
        float h = map(ro+rd*dist);
        shade = min(shade, k*h/dist);
        dist += clamp(h, 0.02, stepDist*2.0);
        
        if (h < 0.0 || dist > end) break; 
    }

    return min(max(shade, 0.0) + SHADOW, 1.0); 
}

//  0000000    0000000   0000000  000      000   000   0000000  000   0000000   000   000  
// 000   000  000       000       000      000   000  000       000  000   000  0000  000  
// 000   000  000       000       000      000   000  0000000   000  000   000  000 0 000  
// 000   000  000       000       000      000   000       000  000  000   000  000  0000  
//  0000000    0000000   0000000  0000000   0000000   0000000   000   0000000   000   000  

float getOcclusion(vec3 p, vec3 n)
{
    float a = 0.0;
    float weight = .5;
    for (int i = ZERO; i <= 6; i++)
    {
        float d = (float(i) / 6.0) * 0.3;
        a += weight * (d - map(p + n*d));
        weight *= 0.9;
    }
    return clamp01(1.0-a);
}

// 000      000   0000000   000   000  000000000  
// 000      000  000        000   000     000     
// 000      000  000  0000  000000000     000     
// 000      000  000   000  000   000     000     
// 0000000  000   0000000   000   000     000     

float shiny(float rough, float NoH, const vec3 h) 
{
    float oneMinusNoHSquared = 1.0 - NoH * NoH;
    float a = NoH * rough;
    float k = rough / (oneMinusNoHSquared + a * a);
    float d = k * k * (1.0 / PI);
    return d;
}

vec3 getLight(vec3 p, vec3 n, vec3 col, int mat)
{
    if (mat == NONE) return col;
    
    vec3 vLight = normalize(pLight-p);
    
 
    float dif = clamp01(dot(n,vLight));
    
    if (mat == BODY)
    {
        float exp = 0.6;
        float smx = 0.0;
        
        vec3  n2c = normalize(pCam.p-p);
        vec3  bcl = normalize(n2c + vLight);
        float dnh = clamp01(dot(n, bcl));
        float shi = shiny(0.25, dnh, bcl);
        
        dif = clamp01(pow(dif, exp) + shi);
    }
    else if (mat == MOON)
    {
        dif = pow(dif, 2.0);
    }
    
    vec3 hl;
    if (mat == VISOR)
    {
        hl = vec3(pow(clamp01(smoothstep(0.95,1.0,dot(n, vLight))), 10.0));
    }
    else if (mat == BONE)
    {
        hl = vec3(clamp01(smoothstep(0.5,1.0, dot(n, vLight)))*0.05);
    }

    float shadow = softShadow(p, vLight, 8.0) * (soft ? getOcclusion(p, n) : 1.0);

    return (col * clamp01(dif) + hl) * shadow;
}

// 00     00   0000000   000  000   000  
// 000   000  000   000  000  0000  000  
// 000000000  000000000  000  000 0 000  
// 000 0 000  000   000  000  000  0000  
// 000   000  000   000  000  000   000  

const int KEY_LEFT  = 37;
const int KEY_UP    = 38;
const int KEY_RIGHT = 39;
const int KEY_DOWN  = 40;
const int KEY_SPACE = 32;
const int KEY_1     = 49;
const int KEY_9     = 57;

bool keyState(int key) { return texelFetch(iChannel0, ivec2(key, 2), 0).x < 0.5; }
bool keyDown(int key)  { return texelFetch(iChannel0, ivec2(key, 0), 0).x > 0.5; }

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    frag = fragCoord;
    
    bool dither =  keyState(KEY_LEFT);
         camrot =  keyState(KEY_RIGHT);
         soft   =  keyState(KEY_DOWN);
    bool animat =  keyState(KEY_UP);
    bool space  =  !keyState(KEY_SPACE);

    for (int i = KEY_1; i <= KEY_9; i++) 
    { 
        if (keyDown(i)) { option = i-KEY_1+1; break; }
    }
    
    if (animat) poseFloating();
    else        poseNeutral();
    
    calcAnim();

    float aspect = iResolution.x/iResolution.y;
    
    float mx = 2.0*(iMouse.x/iResolution.x-0.5);
    float my = 2.0*(iMouse.y/iResolution.y-0.5);
    float md = -12.5;
    
    if (iMouse.z <= 0.0) { mx = 0.0; my = 0.0; }
    
    camTgt = v0;
    
    eulerPivot(pCam, -180.0*my, -180.0*mx, 0.0);
    
    pCam.p = pCam.z*md;

    #ifndef TOY
        if (space)
        {
            camTgt = iCenter;
            pCam.p = iCamera;
            pCam.p.x *= -1.0;
            camTgt.x *= -1.0;
            pCam.z = camTgt-pCam.p;
            pCam.x = normalize(cross(vy, pCam.z));
            pCam.y = normalize(cross(pCam.x, pCam.z));
        }
    #endif
    
    pLight = pCam.p + 5.0*pCam.y + 10.0*pCam.x;
        
    // float AA = soft ? 2.0 : 1.0;
    float AA = 1.0;
    
    vec3 cols = v0;
    vec3 col, p, n, uu, vv, rd;
    vec2 ao = vec2(0);
    
    float d, am, an;
    int mat, mat0;
    /*
     for (am = float(ZERO); am < AA; am+=1.0)
     for (an = float(ZERO); an < AA; an+=1.0)
    */
    {
        if (AA > 1.0) ao = vec2(am,an)/AA-0.5;
    
        uv = (fragCoord+ao-0.5*iResolution.xy)/iResolution.y;
                
        uu = normalize(cross(pCam.z, pCam.y));
        vv = normalize(cross(uu, pCam.z));
        rd = normalize(uv.x*uu + uv.y*vv + pCam.z);
        
        d = rayMarch(pCam.p, rd);
        mat = s.mat;
        
        if (am == AA-1.0 && an == AA-1.0) mat0 = mat;
        
        p = pCam.p + d * rd;
        
        switch (mat)
        {
        case BODY: col = vec3(1.0);  break;
        case BONE: col = vec3(0.2);  break;
        case MOON: col = vec3(0.04); break;
        default:   col = v0;         break;
        }
        
        cols += getLight(p, getNormal(p), col, mat);
    }
    
    col = cols/(AA*AA);

    float hsh = hash12(frag);
    
    if (mat0 == NONE) // stars
    {
        col = vec3(pow(voronoi(vec3(uv*50.0,iResolution.y*0.0002)), iResolution.y/90.0) - length(uv)*0.7);
    }
    
    if (dither)
    {
        
        col -= vec3((hsh-0.25)*0.004);
        col *= 1.0-hsh*0.1;
        col = max(col, v0);
    }

    #ifndef TOY
    vec3 red    = vec3(0.8,0.0,0.0);
    vec3 green  = vec3(0.0,0.5,0.0);
    vec3 blue   = vec3(0.2,0.2,1.0);
    vec3 white  = vec3(1.0,1.0,1.0);
    vec3 yellow = vec3(1.0,1.0,0.0);
    
    vec2 muv = (iMouse.xy-0.5*iResolution.xy)/iResolution.y;
    
    col = mix(col, white,  digit(0,    0, iFrameRate,    2.0));
    col = mix(col, blue,   digit(0,   40, iTime,         4.1));
    col = mix(col, yellow, digit(0,   80, iCompile,      2.2));
    col = mix(col, red,    digit(0,  120, float(option), 1.0));
    col = mix(col, green,  digit(150,  0, iMouse.y,      5.0));
    col = mix(col, red,    digit(150, 40, iMouse.x,      5.0));
    col = mix(col, green,  digit(250,  0, muv.x,         2.2));
    col = mix(col, red,    digit(250, 40, muv.y,         2.2));
        
    if (frag.x >= 350. && frag.x < 500. && frag.y < 160.)
    {
        uv = (iMouse.xy-0.5*iResolution.xy)/iResolution.y;
        rd = normalize(uv.x*uu + uv.y*vv + pCam.z);
        d  = rayMarch(pCam.p, rd);
        if (d < MAX_DIST)
        {
            p = pCam.p + d * rd;
            col = mix(col, white, digit(350,   0, d,   3.2));
            col = mix(col, red,   digit(350, 120, p.x, 3.2));
            col = mix(col, green, digit(350,  80, p.y, 3.2));
            col = mix(col, blue,  digit(350,  40, p.z, 3.2));
        }
    }
   	#endif
    
    col = pow(col, vec3(1.0/2.2));
    fragColor = vec4(col, 1.0);
}
