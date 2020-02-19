// #define TOY  1

#define MAX_STEPS 128
#define MIN_DIST  0.01
#define MAX_DIST  30.0

#define PI 3.1415926535897
#define ZERO min(iFrame,0)

#define NONE   0
#define RED    1
#define GREEN  2
#define BLUE   3
#define HEAD   4

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
int mat;
vec2 frag;
bool animat;
vec3 camPos;
vec3 camTgt;
vec3 camDir;

vec3 v0 = vec3(0,0,0);
vec3 vx = vec3(1,0,0);
vec3 vy = vec3(0,1,0);
vec3 vz = vec3(0,0,1);

vec3 red   = vec3(0.8,0.0,0.0);
vec3 green = vec3(0.0,0.5,0.0);
vec3 blue  = vec3(0.2,0.2,1.0);
vec3 white = vec3(1.0,1.0,1.0);

float rad2deg(float r) { return 180.0 * r / PI; }
float deg2rad(float d) { return PI * d / 180.0; }

vec3 hash33(vec3 p3)
{
    p3 = fract(p3 * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yxz+33.33);
    return fract((p3.xxy + p3.yxx)*p3.zyx);
}

vec3 hash31(float p)
{
   vec3 p3 = fract(vec3(p) * vec3(.1031, .1030, .0973));
   p3 += dot(p3, p3.yzx+33.33);
   return fract((p3.xxy+p3.yzz)*p3.zyx); 
}

float clamp01(float v) { return clamp(v, 0.0, 1.0); }

float gradientNoise(vec2 uv)
{
    return fract(52.9829189 * fract(dot(uv, vec2(0.06711056, 0.00583715))));
}

vec3 posOnPlane(vec3 p, vec3 a, vec3 n)
{
    return p-dot(p-a,n)*n;
}

vec3 posOnPlane(vec3 p, vec3 n)
{
    return p-dot(p,n)*n;
}

float iRange(float l, float h, float f) { return l+(h-l)*(sin(iTime)*0.5+0.5); }
float iRange(float l, float h) { return iRange(l,h,1.0); }

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

float opInter(float d1, float d2, float k) 
{
    float h = clamp(0.5 - 0.5*(d2-d1)/k, 0.0, 1.0);
    return mix(d2, d1, h) + k*h*(1.0-h);
}

//  0000000  0000000    
// 000       000   000  
// 0000000   000   000  
//      000  000   000  
// 0000000   0000000    

float sdSphere(vec3 p, vec3 a, float r)
{
    return length(p-a)-r;
}

float sdPlane(vec3 p, vec3 a, vec3 n)
{   
    return dot(n, p-a);
}

float sdPlane(vec3 p, vec3 n)
{   
    return dot(n, p);
}

float sdCone(vec3 p, vec3 a, vec3 b, float r1, float r2)
{
    vec3 ab = b-a;
    vec3 ap = p-a;
    float t = dot(ab,ap) / dot(ab,ab);
    t = clamp(t, 0.0, 1.0);
    vec3 c = a + t*ab;
    return length(p-c)-(t*r2+(1.0-t)*r1);      
}

float sdTorus(vec3 p, vec3 a, vec3 n, vec2 r)
{
    vec3 q = p-a;
    return length(vec2(length(posOnPlane(q, n))-r.x,abs(dot(n, q))))-r.y;
}

float sdEllipsoid(vec3 p, vec3 r)
{
    float k0 = length(p/r);
    float k1 = length(p/(r*r));
    return k0*(k0-1.0)/k1;
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float r)
{
    vec3 ab = b-a;
    vec3 ap = p-a;
    float t = dot(ab,ap) / dot(ab,ab);
    t = clamp(t, 0.0, 1.0);
    vec3 c = a + t*ab;
    return length(p-c)-r;        
}

void coords()
{
    float d = MAX_DIST;
    float r = 0.04;
    
    d = sdCapsule(s.pos, v0, vx*MAX_DIST, r);
    if (s.pos.x > 0.5) d = min(d, sdSphere(vec3(-0.5+fract(s.pos.x-0.5), s.pos.y, s.pos.z), v0, r*2.0));
    if (d < s.dist) { s.mat = RED; s.dist = d; }
    
    d = sdCapsule(s.pos, v0, vy*MAX_DIST, r);
    if (s.pos.y > 0.5) d = min(d, sdSphere(vec3(s.pos.x, -0.5+fract(s.pos.y-0.5), s.pos.z), v0, r*2.0));
    if (d < s.dist) { s.mat = GREEN; s.dist = d; }

    d = sdCapsule(s.pos, v0, vz*MAX_DIST, r);
    if (s.pos.z > 0.5) d = min(d, sdSphere(vec3(s.pos.x, s.pos.y, -0.5+fract(s.pos.z-0.5)), v0, r*2.0));
    if (d < s.dist) { s.mat = BLUE; s.dist = d; }
}

// 000000000  000   000  000   0000000  000000000  
//    000     000 0 000  000  000          000     
//    000     000000000  000  00 00000      000     
//    000     000   000  000       000     000     
//    000     00     00  000  0000000      000     

void twist()
{
    vec3 r = vec3( 0, 0, 1);
    vec3 n = vec3( -1, 0, 0); 
    vec3 p = s.pos;
    
    float d = 1000.0;
    
    vec3 p1 = v0;
    vec3 p2 = p1 + n;
    
    float lf = 1.0;
    float sf = 1.0;
    float a = 12.0; // sin(iTime)*30.0;
    
    for (int i = 0; i < 25; i++)
    {
        d = min(d, sdCone(p, p1, p2, 0.5*sf, 0.5*sf*0.9));
        p1 = p2;
        n  = rotAxisAngle(n, r, a) * lf;
        sf *= 0.9;
        lf *= 0.991;
        p2 += n;
    }
    
    if (d < s.dist) { s.mat = HEAD; s.dist = d; }
}

//  0000000   00000000    0000000  
// 000   000  000   000  000       
// 000000000  0000000    000       
// 000   000  000   000  000       
// 000   000  000   000   0000000  

struct Arc {
  vec2 p0;
  vec2 p1;
  float d; // (-1.0, 1.0) 0.0 = straight line, 1.0 = semi-circle
};

vec2 perpendicular (const vec2 v) {
  return vec2 (-v.y, v.x);
}

float tan2atan (float d) {
  return 2. * d / (1. - d * d);
}

vec2 computeArcCenter (const Arc a) {
  return mix (a.p0, a.p1, .5) +
	 perpendicular (a.p1 - a.p0) / (2. * tan2atan(a.d));
}

float sdArcWedge (Arc a, const vec2 p) {
  vec2 c = computeArcCenter (a);
  return abs(distance(a.p0, c) - distance(p, c));
}

bool isPointInsideArcWedge (const Arc a, const vec2 p) {
  float d2 = tan2atan(a.d);
  return dot (p - a.p0, (a.p1 - a.p0) * mat2(1,  d2, -d2, 1)) >= 0. &&
	     dot (p - a.p1, (a.p1 - a.p0) * mat2(1, -d2,  d2, 1)) <= 0.;
}

float sdSegment( vec3 a, vec3 b, vec3 p )
{
	vec3 pa = p - a;
	vec3 ba = b - a;
	float t = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*t );
}

float sdArc(Arc arc, vec2 p) 
{
 	if (abs(arc.d) < 0.01)
       	return sdSegment(vec3(arc.p0,0.0), vec3(arc.p1,0.0), vec3(p,0.0));
  
  	if (isPointInsideArcWedge(arc, p))
 		return sdArcWedge(arc, p);
  
  	return min(distance (p, arc.p0), distance (p, arc.p1));
}

void arc()
{
    Arc a;
    a.p0 = vec2(-4.0, 0.0);
    a.p1 = vec2( 4.0, 0.0);
    a.d = cos( iTime*0.6 );
    
    s.pos.z = abs(s.pos.z);
    float pd = sdPlane(s.pos, vz);
    float ad = sdArc(a, s.pos.xy);
    float d = opInter(pd-1.0, ad, 0.5)-0.5;
    
    if (d < s.dist) { s.mat = HEAD; s.dist = d; }
}

// 00     00   0000000   00000000   
// 000   000  000   000  000   000  
// 000000000  000000000  00000000   
// 000 0 000  000   000  000        
// 000   000  000   000  000        

float map(vec3 p)
{
    s = sdf(1000.0, p, NONE);
    
    coords();
     
    twist();
    arc();

    return s.dist;
}

vec3 getNormal(vec3 p)
{
    vec3 n = v0;
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

float softShadow(vec3 ro, vec3 lp, float k)
{
    const int maxIterationsShad = 24; 
    
    vec3 rd = (lp-ro);

    float shade = 1.;
    float dist = .0035;    
    float end = max(length(rd), .001);
    float stepDist = end/float(maxIterationsShad);
    
    rd /= end;

    for (int i=0; i<maxIterationsShad; i++)
    {
        float h = map(ro + rd*dist);
        shade = min(shade, k*h/dist);
        dist += clamp(h, .02, stepDist*2.);
        
        if (h<.0001 || dist > end) break; 
    }

    return min(max(shade, 0.) + .05, 1.); 
}

// 000      000   0000000   000   000  000000000  
// 000      000  000        000   000     000     
// 000      000  000  0000  000000000     000     
// 000      000  000   000  000   000     000     
// 0000000  000   0000000   000   000     000     

float getLight(vec3 p, vec3 n)
{
    vec3 cr = cross(camDir, vec3(0,1,0));
    vec3 up = normalize(cross(cr,camDir));
    vec3 lp = camPos + vec3(0,2.0,0) + up*5.0; 
    lp *= 5.0;
    vec3 l = normalize(lp-p);
 
    float ambient = 0.005;
    float dif = clamp(dot(n,l), 0.0, 1.0);
    if (mat == HEAD)
    {
        dif = pow(dif, 4.0);
    }
    //dif *= hardShadow(p, normalize(lp-p), MIN_DIST, 100.0, 0.2);
    // dif *= softShadow(p, lp, 1.4);        
    return clamp(dif, ambient, 1.0);
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

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{    
    frag = fragCoord;
    bool dither = true;
    bool camrot = texelFetch(iChannel0, ivec2(KEY_RIGHT, 2), 0).x > 0.5;
    bool scroll = texelFetch(iChannel0, ivec2(KEY_DOWN,  2), 0).x > 0.5;
    bool space  = texelFetch(iChannel0, ivec2(KEY_SPACE, 2), 0).x < 0.5;
         animat = texelFetch(iChannel0, ivec2(KEY_UP,    2), 0).x > 0.5;
            
    vec2 uv = (fragCoord-.5*iResolution.xy)/iResolution.y;
    vec3 ct;
    
    float aspect = iResolution.x/iResolution.y;
    
    float md = 5.5;
    float mx = 2.0*(iMouse.x/iResolution.x-0.5);
    float my = 2.0*(iMouse.y/iResolution.y-0.5);
    
    if (iMouse.z <= 0.0 && camrot)
    {
        float ts = 276.2;
        mx = 0.3*sin(ts+iTime/12.0);
        my = -0.20-0.10*cos(ts+iTime/8.0);
    }
    
    camTgt = vec3(0,1.2,0); 

    camPos = rotAxisAngle(rotAxisAngle(vec3(0,0,-md), vx, 89.0*my), vy, -180.0*mx);
    
    #ifndef TOY
        if (space)
        {
            camTgt = iCenter;
            camPos = iCamera;
            camPos.x *= -1.0;
            camTgt.x *= -1.0;
        }
    #endif
    
    camDir = normalize(camTgt-camPos);
    
    vec3 ww = normalize(camTgt-camPos);
    vec3 uu = normalize(cross(ww, vec3(0,1,0)));
    vec3 vv = normalize(cross(uu, ww));
        
    vec3 rd = normalize(uv.x*uu + uv.y*vv + ww);

    float d = rayMarch(camPos, rd);
    mat = s.mat;
    
    vec3  p = camPos + d * rd;
    vec3  n = getNormal(p);
        
    vec3 col;
    
    if (mat == NONE)  
    {
        vec2 guv = fragCoord.xy - iResolution.xy / 2.;
        float grid = dot(step(mod(guv.xyxy, vec4(10,10,100,100)), vec4(1)), vec4(.5, .5, 1., 1.));
        col = mix(vec3(.001), vec3(0.02,0.02,0.02), grid);
    }
    else 
    {
        switch (mat) 
        {
         case RED:   col = red;   break;
         case GREEN: col = green; break;
         case BLUE:  col = blue;  break;
         case HEAD:  col = vec3(0.1); break;
        }
        col *= getLight(p,n);
    }

    if (dither)
    {
        float dit = gradientNoise(fragCoord.xy);
        col += vec3(dit/1024.0);
    }
    
    col = mix(col, white, digit(0,   0,  iFrameRate, 2.0));
    col = mix(col, blue,  digit(0,  40,  iTime,      4.1));
    col = mix(col, green, digit(150, 0,  iMouse.y,   5.0));
    col = mix(col, red,   digit(150, 40, iMouse.x,   5.0));
    col = mix(col, green, digit(250, 0,  my,         3.2));
    col = mix(col, red,   digit(250, 40, mx,         3.2));
        
    if (frag.x >= 350. && frag.x < 500. && frag.y < 160.)
    {
        uv = (iMouse.xy-.5*iResolution.xy)/iResolution.y;
        rd = normalize(uv.x*uu + uv.y*vv + ww);
        d  = rayMarch(camPos, rd);
        if (d < MAX_DIST)
        {
            p = camPos + d * rd;
            col = mix(col, white, digit(350,   0, d,   3.2));
            col = mix(col, red,   digit(350, 120, p.x, 3.2));
            col = mix(col, green, digit(350,  80, p.y, 3.2));
            col = mix(col, blue,  digit(350,  40, p.z, 3.2));
        }
    }
    
    col = pow(col, vec3(1.0/2.2));
    fragColor = vec4(col, 1.0);
}
