// #define TOY
#define PI  3.141592653589
#define TAU 6.283185307178
#define E   2.718281828459
#define EPS 0.000000000001
#define PHI 1.618033988750

#define KEY_LEFT  37
#define KEY_UP    38
#define KEY_RIGHT 39
#define KEY_DOWN  40
#define KEY_SPACE 32
#define KEY_1     49
#define KEY_9     57
#define KEY_A     65
#define KEY_C     67
#define KEY_D     68
#define KEY_E     69
#define KEY_N     78
#define KEY_Q     81
#define KEY_R     82
#define KEY_S     83
#define KEY_W     87
#define KEY_X     88
#define KEY_Z     90

const vec3 v0 = vec3(0,0,0);
const vec3 vx = vec3(1,0,0);
const vec3 vy = vec3(0,1,0);
const vec3 vz = vec3(0,0,1);

const vec3 red   = vec3(0.8,0.0,0.0);
const vec3 green = vec3(0.0,0.5,0.0);
const vec3 blue  = vec3(0.2,0.2,1.0);
const vec3 white = vec3(1.0,1.0,1.0);
const vec3 black = vec3(0.0,0.0,0.0);
    
//  0000000   000       0000000   0000000     0000000   000      
// 000        000      000   000  000   000  000   000  000      
// 000  0000  000      000   000  0000000    000000000  000      
// 000   000  000      000   000  000   000  000   000  000      
//  0000000   0000000   0000000   0000000    000   000  0000000  

struct Text {
    ivec2 size;
    ivec2 adv;
} text;

struct SDF {
    float dist;
    vec3  pos;
    int   mat;
};

struct _gl {
    vec2  uv;
    vec2  frag;
    vec2  mouse;
    vec2  mp;
    ivec2 ifrag;
    float aspect;
    vec4  color;
    int   option;
    float time;
    vec3  light;
    int   zero;
    SDF   sdf;
} gl;

uniform sampler2D fontChannel;

void initGlobal(vec2 fragCoord, vec3 resolution, vec4 mouse, float time)
{
    text.size = ivec2(16,32)*2;
    text.adv  = ivec2(text.size.x,0);
    
    mouse.xy = min(mouse.xy,resolution.xy);
    if (mouse.z < 1.0)
    {
        if (mouse.z > -1.0)
        	gl.mouse = resolution.xy*0.5;
       	else
            gl.mouse = mouse.xy;
    }
    else gl.mouse = mouse.xy;
    
	gl.mp = (2.0*abs(gl.mouse)-vec2(resolution.xy))/resolution.y;    

    gl.aspect = resolution.x / resolution.y;
    gl.frag   = fragCoord;
    gl.ifrag  = ivec2(fragCoord);
    gl.uv     = (fragCoord+fragCoord-resolution.xy)/resolution.y;
}

float powi(int a, int b) { return pow(float(a), float(b)); }
float log10(float a) { return log(a)/log(10.0); }
float clamp01(float v) { return clamp(v, 0.0, 1.0); }

// 00000000   00000000   000  000   000  000000000  
// 000   000  000   000  000  0000  000     000     
// 00000000   0000000    000  000 0 000     000     
// 000        000   000  000  000  0000     000     
// 000        000   000  000  000   000     000     

#ifndef TOY
float print(ivec2 pos, int ch)
{
    ivec2 r = gl.ifrag-pos; bool i = r.y>0 && r.x>0 && r.x<=text.size.y && r.y<=text.size.y;
    return i ? texelFetch(iChannel2,ivec2((ch%16)*64,(1024-64-64*(ch/16)))+r*64/text.size.y,0).r : 0.0;
}

float print(ivec2 pos, float v)
{
    float c = 0.0; ivec2 a = text.adv; 
    float fv = fract(v);
    v = (fv > 0.995 || fv < 0.005) ? floor(v) : v;
    float f = abs(v);
    int i = (fv == 0.0) ? 1 : fract(v*10.0) == 0.0 ? -1 : -2;
    int ch, u = max(1,int(log10(f))+1);
    ivec2 p = pos+6*a;
    for (; i <= u; i++) {
        if (i == 0)     ch = 46;
        else if (i > 0) ch = 48+int(mod(f, powi(10,i))/powi(10,i-1));
        else            ch = 48+int(mod(f+0.005, powi(10,i+1))/powi(10,i));
        c = max(c, print(p-i*a, ch)*float(i+3)/30.0); }
    if (v < 0.0) c = max(c, print(p-i*a, 45)*float(i)/30.0);
    return c;
}

float print(ivec2 pos, vec4 v)
{
    float c = 0.0;
    for (int i = 0; i < 4; i++) {
        c = max(c, print(pos, v[i]));
        pos += text.adv*8; }
    return c;
}

float print(ivec2 pos, vec3 v)
{
    float c = 0.0;
    for (int i = 0; i < 3; i++) {
        c = max(c, print(pos, v[i]));
        pos += text.adv*8; }
    return c;
}

float print(ivec2 pos, vec2 v)
{
    float c = 0.0;
    for (int i = 0; i < 2; i++) {
        c = max(c, print(pos, v[i]));
        pos += text.adv*8; }
    return c;
}

float print(int x, int y, int v)   { return print(ivec2(text.size.x*x,text.size.y*y), float(v)); }
float print(int x, int y, float v) { return print(ivec2(text.size.x*x,text.size.y*y), v); }
float print(int x, int y, vec4 v)  { return print(ivec2(text.size.x*x,text.size.y*y), v); }
float print(int x, int y, vec3 v)  { return print(ivec2(text.size.x*x,text.size.y*y), v); }
float print(int x, int y, vec2 v)  { return print(ivec2(text.size.x*x,text.size.y*y), v); }
float print(int x, int y, ivec3 v) { return print(ivec2(text.size.x*x,text.size.y*y), vec3(v)); }
#endif

// 000   000   0000000    0000000  000   000  
// 000   000  000   000  000       000   000  
// 000000000  000000000  0000000   000000000  
// 000   000  000   000       000  000   000  
// 000   000  000   000  0000000   000   000  

float hash11(float p)
{
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

vec3 hash33(vec3 p3)
{
    p3 = fract(p3 * vec3(12.3,456.7,8912.3));
    p3 += dot(p3, p3.yxz+33.33);
    return fract((p3.xxy + p3.yxx)*p3.zyx);
}

vec3 hash31(float p)
{
   return hash33(vec3(p));
}

float hash12(vec2 p)
{
    vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float gradientNoise(vec2 v)
{
    return fract(52.9829189 * fract(dot(v, vec2(0.06711056, 0.00583715))));
}

// 000   000   0000000  000      
// 000   000  000       000      
// 000000000  0000000   000      
// 000   000       000  000      
// 000   000  0000000   0000000  

vec3 hsl2rgb( in vec3 c )
{
    vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
    return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
}

vec3 hsl(float h, float s, float l) { return hsl2rgb(vec3(h,s,l)); }

vec3 rgb2hsl( vec3 col )
{
    float minc = min( col.r, min(col.g, col.b) );
    float maxc = max( col.r, max(col.g, col.b) );
    vec3  mask = step(col.grr,col.rgb) * step(col.bbg,col.rgb);
    vec3 h = mask * (vec3(0.0,2.0,4.0) + (col.gbr-col.brg)/(maxc-minc + EPS)) / 6.0;
    return vec3( fract( 1.0 + h.x + h.y + h.z ),              
                 (maxc-minc)/(1.0-abs(minc+maxc-1.0) + EPS),  
                 (minc+maxc)*0.5);
}

vec3 colsat(vec3 col, float sat)
{
    vec3 h = rgb2hsl(col);
    return hsl(h.x,sat,h.z);
}

vec3 gray(vec3 col)
{
    return colsat(col, 0.0);
}

// 00     00   0000000   000000000  00000000   000  000   000  
// 000   000  000   000     000     000   000  000   000 000   
// 000000000  000000000     000     0000000    000    00000    
// 000 0 000  000   000     000     000   000  000   000 000   
// 000   000  000   000     000     000   000  000  000   000  

mat3 alignMatrix(vec3 dir) 
{
    vec3 f = normalize(dir);
    vec3 s = normalize(cross(f, vec3(0.48, 0.6, 0.64)));
    vec3 u = cross(s, f);
    return mat3(u, s, f);
}

// 00000000    0000000   000000000  
// 000   000  000   000     000     
// 0000000    000   000     000     
// 000   000  000   000     000     
// 000   000   0000000      000     

float rad2deg(float r) { return 180.0 * r / PI; }
float deg2rad(float d) { return PI * d / 180.0; }

vec3 rad2deg(vec3 v) { return 180.0 * v / PI; }
vec3 deg2rad(vec3 v) { return PI * v / 180.0; }

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

// 00000000    0000000   000       0000000   00000000   
// 000   000  000   000  000      000   000  000   000  
// 00000000   000   000  000      000000000  0000000    
// 000        000   000  000      000   000  000   000  
// 000         0000000   0000000  000   000  000   000  

vec3 polar(vec3 v)
{
    float radius = length(v);
    float phi    = atan(v.y, v.x);
    float rho    = acos(v.z/radius);
    return vec3(phi, rho, radius);
}

vec3 unpolar(vec3 v)
{
    float s = sin(v.y);
    float x = s * cos(v.x);
    float y = s * sin(v.x);
    float z =     cos(v.y);
    return vec3(x, y, z)*v.z;
}

vec3 polar2(vec3 v)
{
    float radius = length(v);
    float phi    = atan(v.z, v.x);
    float rho    = acos(v.y/radius);
    return vec3(phi, rho, radius);
}

vec3 unpolar2(vec3 v)
{
    float s = sin(v.y);
    float x = s * cos(v.x);
    float z = s * sin(v.x);
    float y =     cos(v.y);
    return vec3(x, y, z)*v.z;
}

//  0000000   000   000   0000000   000000000  
// 000   000  000   000  000   000     000     
// 000 00 00  000   000  000000000     000     
// 000 0000   000   000  000   000     000     
//  00000 00   0000000   000   000     000     

vec4 quatAxisAngle(vec3 axis, float angle)
{ 
    float half_angle = deg2rad(angle*0.5);
    return vec4(axis*sin(half_angle), cos(half_angle));
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

vec3 rotAxisAngleQuat(vec3 p, vec3 axis, float angle)
{ 
    vec4 qr = quatAxisAngle(axis, angle);
    return quatMul(quatMul(qr, vec4(p, 0)), quatConj(qr)).xyz;
}

vec3 rotRayAngle(vec3 p, vec3 ro, vec3 rd, float angle)
{ 
    return rotAxisAngle(p-ro, rd-ro, angle)+ro;
}

vec3 rotY(vec3 v, float d)
{
    float r = deg2rad(d);
    float c = cos(r);
    float s = sin(r);
    return vec3(v.x*c+v.z*s, v.y, v.z*c+v.x*s);
}

vec3 rotX(vec3 v, float d)
{
    float r = deg2rad(d);
    float c = cos(r);
    float s = sin(r);
    return vec3(v.x, v.y*c+v.z*s, v.z*c+v.y*s);
}

vec3 rotZ(vec3 v, float d)
{
    float r = deg2rad(d);
    float c = cos(r);
    float s = sin(r);
    return vec3(v.x*c+v.y*s, v.y*c+v.x*s, v.z);
}

//  0000000   00000000   0000000   00     00    
// 000        000       000   000  000   000    
// 000  0000  0000000   000   000  000000000    
// 000   000  000       000   000  000 0 000    
//  0000000   00000000   0000000   000   000    

vec3 posOnPlane(vec3 p, vec3 a, vec3 n)
{
    return p-dot(p-a,n)*n;
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

float opUnion(float d1, float d2, float k)
{
    float h = clamp(0.5 + 0.5*(d2-d1)/k, 0.0, 1.0);
    return mix(d2, d1, h) - k*h*(1.0-h);
}

float opDiff(float d1, float d2, float k) 
{
    float h = clamp(0.5 - 0.5*(d2+d1)/k, 0.0, 1.0);
    return mix(d1, -d2, h) - k*h*(1.0-h);
}

float opInter(float d1, float d2, float k) 
{    
    float h = clamp(0.5 - 0.5*(d2-d1)/k, 0.0, 1.0);
    return mix(d2, d1, h) + k*h*(1.0-h);
}

float opDiff (float d1, float d2) { return opDiff (d1, d2, 0.0); }
float opUnion(float d1, float d2) { return opUnion(d1, d2, 0.5); }
float opInter(float d1, float d2) { return opInter(d1, d2, 0.2); }

//  0000000  0000000    
// 000       000   000  
// 0000000   000   000  
//      000  000   000  
// 0000000   0000000    


float sdSphere(vec3 a, float r)
{
    return length(gl.sdf.pos-a)-r;
}

float sdPill(vec3 a, float r, vec3 n)
{
    vec3 p = gl.sdf.pos-a;
    float d = abs(dot(normalize(n),normalize(p)));
    float f = smoothstep(0.0, 1.3, d);
    return length(p) - r + f * length(n);
}

float sdPlane(vec3 a, vec3 n)
{   
    return dot(n, gl.sdf.pos-a);
}

float sdPlane(vec3 n)
{   
    return dot(n, gl.sdf.pos);
}

float sdEllipsoid(vec3 a, vec3 r)
{
    vec3 p = gl.sdf.pos-a;
    float k0 = length(p/r);
    float k1 = length(p/(r*r));
    return k0*(k0-1.0)/k1;
}

float sdCone(vec3 a, vec3 b, float r1, float r2)
{
    vec3 ab = b-a;
    vec3 ap = gl.sdf.pos-a;
    float t = dot(ab,ap) / dot(ab,ab);
    t = clamp(t, 0.0, 1.0);
    vec3 c = a + t*ab;
    return length(gl.sdf.pos-c)-(t*r2+(1.0-t)*r1);      
}

float sdLine(vec3 a, vec3 d, float r)
{
    vec3 p = gl.sdf.pos-a;
    return length(p.xz-d.xy)-r;
}

float sdCapsule(vec3 a, vec3 b, float r)
{
    vec3 ab = b-a;
    vec3 ap = gl.sdf.pos-a;
    float t = dot(ab,ap) / dot(ab,ab);
    t = clamp(t, 0.0, 1.0);
    vec3 c = a + t*ab;
    return length(gl.sdf.pos-c)-r;        
}

float sdCylinder(vec3 a, vec3 b, float r)
{
  vec3  ba = b - a;
  vec3  pa = gl.sdf.pos - a;
  float baba = dot(ba,ba);
  float paba = dot(pa,ba);
  float x = length(pa*baba-ba*paba) - r*baba;
  float y = abs(paba-baba*0.5)-baba*0.5;
  float x2 = x*x;
  float y2 = y*y*baba;
  float d = (max(x,y)<0.0)?-min(x2,y2):(((x>0.0)?x2:0.0)+((y>0.0)?y2:0.0));
  return sign(d)*sqrt(abs(d))/baba;
}

vec3 posOnPlane(vec3 p, vec3 n)
{
    return p-dot(p,n)*n;
}

float sdTorus(vec3 p, vec3 a, vec3 n, float rl, float rs)
{
    vec3 q = p-a;
    return length(vec2(length(posOnPlane(q, n))-rl,abs(dot(n, q))))-rs;
}

// 0000000     0000000    0000000  000   0000000  
// 000   000  000   000  000       000  000       
// 0000000    000000000  0000000   000  0000000   
// 000   000  000   000       000  000       000  
// 0000000    000   000  0000000   000  0000000   

void basis(vec3 n, out vec3 right, out vec3 front) 
{
    if (n.y < -0.999999)
    {
        right = -vz;
        front = -vx;
    } 
    else 
    {
        float a = 1.0/(1.0+n.y);
        float b = -n.x*n.z*a;
        right = vec3(1.0-n.x*n.x*a,-n.x,b);
        front = vec3(b,-n.z,1.0-n.z*n.z*a);
    }
}
// 00     00   0000000   00000000     
// 000   000  000   000  000   000    
// 000000000  000000000  00000000     
// 000 0 000  000   000  000          
// 000   000  000   000  000          

const vec3 cubo[32] = vec3[32](
    normalize(vec3( 0, 0, 1)),
    normalize(vec3( 0, 0,-1)),
    normalize(vec3( 0, 1, 0)),
    normalize(vec3( 0,-1, 0)),
    normalize(vec3( 1, 0, 0)),

    normalize(vec3(-1, 0, 0)),
    normalize(vec3( 1, 1, 0)),
    normalize(vec3( 1,-1, 0)),
    normalize(vec3(-1, 1, 0)),
    normalize(vec3(-1,-1, 0)),
    normalize(vec3( 1, 0, 1)),
    normalize(vec3( 1, 0,-1)),
    normalize(vec3(-1, 0, 1)),
    normalize(vec3(-1, 0,-1)),
    normalize(vec3( 0, 1, 1)),
    normalize(vec3( 0, 1,-1)),
    normalize(vec3( 0,-1, 1)),
    normalize(vec3( 0,-1,-1)),
    
    normalize(vec3( 1, 1, 1)),
    normalize(vec3( 1, 1,-1)),
    normalize(vec3( 1,-1, 1)),
    normalize(vec3(-1, 1, 1)),
    normalize(vec3( 1,-1,-1)),
    normalize(vec3(-1, 1,-1)),
    normalize(vec3(-1,-1, 1)),
    normalize(vec3(-1,-1,-1)),
    v0, v0, v0, v0, v0, v0
);

const vec3 dodeca[32] = vec3[32](
    normalize(vec3(0, 1, PHI)),
    normalize(vec3(0,-1, PHI)),
    normalize(vec3(0,-1,-PHI)),
    normalize(vec3(0, 1,-PHI)),
    normalize(vec3( 1, PHI,0)),
    normalize(vec3(-1, PHI,0)),
    normalize(vec3(-1,-PHI,0)),
    normalize(vec3( 1,-PHI,0)),
    normalize(vec3( PHI, 0,  1)),
    normalize(vec3( PHI, 0, -1)),
    normalize(vec3(-PHI, 0, -1)),
    normalize(vec3(-PHI, 0,  1)),
    v0, v0, v0, v0, v0, v0, v0,
    v0, v0, v0, v0, v0, v0, v0,
    v0, v0, v0, v0, v0, v0
);

const vec3 icosa[32] = vec3[32](
    normalize(vec3( 1, 1,-1)),
    normalize(vec3( 1, 1, 1)),
    normalize(vec3( 1,-1,-1)),
    normalize(vec3( 1,-1, 1)),
    normalize(vec3(-1, 1,-1)),
    normalize(vec3(-1, 1, 1)),
    normalize(vec3(-1,-1,-1)),
    normalize(vec3(-1,-1, 1)),
    normalize(vec3(0, PHI,  1.0/PHI)),
    normalize(vec3(0, PHI, -1.0/PHI)),
    normalize(vec3(0,-PHI, -1.0/PHI)),
    normalize(vec3(0,-PHI,  1.0/PHI)),
    normalize(vec3( PHI,  1.0/PHI, 0)),
    normalize(vec3( PHI, -1.0/PHI, 0)),
    normalize(vec3(-PHI, -1.0/PHI, 0)),
    normalize(vec3(-PHI,  1.0/PHI, 0)),
    normalize(vec3( 1.0/PHI, 0, PHI)),
    normalize(vec3(-1.0/PHI, 0, PHI)),
    normalize(vec3(-1.0/PHI, 0,-PHI)),
    normalize(vec3( 1.0/PHI, 0,-PHI)),
    v0, v0, v0, v0, v0, v0,
    v0, v0, v0, v0, v0, v0
);

const vec3 dodecaicosa[32] = vec3[32](
    normalize(vec3(0, 1, PHI)),
    normalize(vec3(0,-1, PHI)),
    normalize(vec3(0,-1,-PHI)),
    normalize(vec3(0, 1,-PHI)),
    normalize(vec3( 1, PHI,0)),
    normalize(vec3(-1, PHI,0)),
    normalize(vec3(-1,-PHI,0)),
    normalize(vec3( 1,-PHI,0)),
    normalize(vec3( PHI, 0,  1)),
    normalize(vec3( PHI, 0, -1)),
    normalize(vec3(-PHI, 0, -1)),
    normalize(vec3(-PHI, 0,  1)),
    normalize(vec3( 1, 1,-1)),
    normalize(vec3( 1, 1, 1)),
    normalize(vec3( 1,-1,-1)),
    normalize(vec3( 1,-1, 1)),
    normalize(vec3(-1, 1,-1)),
    normalize(vec3(-1, 1, 1)),
    normalize(vec3(-1,-1,-1)),
    normalize(vec3(-1,-1, 1)),
    normalize(vec3(0, PHI,  1.0/PHI)),
    normalize(vec3(0, PHI, -1.0/PHI)),
    normalize(vec3(0,-PHI, -1.0/PHI)),
    normalize(vec3(0,-PHI,  1.0/PHI)),
    normalize(vec3( PHI,  1.0/PHI, 0)),
    normalize(vec3( PHI, -1.0/PHI, 0)),
    normalize(vec3(-PHI, -1.0/PHI, 0)),
    normalize(vec3(-PHI,  1.0/PHI, 0)),
    normalize(vec3( 1.0/PHI, 0, PHI)),
    normalize(vec3(-1.0/PHI, 0, PHI)),
    normalize(vec3(-1.0/PHI, 0,-PHI)),
    normalize(vec3( 1.0/PHI, 0,-PHI))
);

const vec3 weirdo[32] = vec3[32](
    normalize(vec3( 0,  1, 0)),
    normalize(vec3( 1, -1, 0.5)),
    normalize(vec3(-1, -1, 0.5)),
    normalize(vec3( 0, -1, -1)),
    normalize(vec3( 0, -0.9, 1)),
    normalize(vec3( 1, -0.9, -0.5)),
    normalize(vec3(-1, -0.9, -0.5)),
    normalize(vec3(-0.4, 0.5, 1)),
    normalize(vec3( 0.4, 0.5, 1)),
    normalize(vec3( 0,  0.2, -1)),
    normalize(vec3( 0.5,  0.5, -0.7)),
    normalize(vec3(-0.5,  0.5, -0.7)),
    v0, v0, v0, v0, v0, v0, v0,
    v0, v0, v0, v0, v0, v0, v0,
    v0, v0, v0, v0, v0, v0
);

struct VecMap {
    vec3[32] vecs;
    int num;
};

VecMap[5] vecMap = VecMap[5](
    VecMap(cubo,   26),
    VecMap(dodeca, 12),
    VecMap(icosa,  20),
    VecMap(weirdo, 12),
    VecMap(dodecaicosa, 32)
);

vec4 choose(vec3 p, int mapIndex)
{
    float d = 0.0;
    int id = -1;
    vec3 n = normalize(p);
    for (int i = gl.zero; i < vecMap[mapIndex].num; i++)
    {
        float dt = dot(n,vecMap[mapIndex].vecs[i]);
        if (dt > d)
        {
            d = dt;
            id = i;
        }
    }
    return vec4(vecMap[mapIndex].vecs[id], float(id));
}

vec4 chooseMap(vec3 p, int mapIndex)
{
    vec4 m = choose(p, mapIndex);
    vec3 q = p-m.xyz;
    vec3 r, f;
    basis(m.xyz,r,f);
    return vec4(dot(r,q),dot(m.xyz,q),dot(f,q), m.w);
}

// 00000000  000  0000000    
// 000       000  000   000  
// 000000    000  0000000    
// 000       000  000   000  
// 000       000  0000000    

vec4 sphericalFibonacci(vec3 p, float num)
{
    float m   = 1.0-1.0/num;
    float phi = min(atan(p.y,p.x),PI);
    float k   = max(2.0, floor(log(num*PI*sqrt(5.0)*(1.0-p.z*p.z))/log(PHI+1.0)));
    float Fk  = pow(PHI,k)/sqrt(5.0);
    vec2  F   = vec2(round(Fk), round(Fk*PHI));
    vec2  ka  = 2.0*F/num;
    vec2  kb  = 2.0*PI*(fract((F+1.0)*PHI)-(PHI-1.0));    
    mat2  iB  = mat2(ka.y,-ka.x, kb.y,-kb.x)/(ka.y*kb.x-ka.x*kb.y);
    
    vec2  c   = floor(iB*vec2(phi, p.z-m));
    float d   = 0.0;
    vec4  res = vec4(0);
    
    for (int s=0; s<4; s++)
    {
        vec2  uv  = vec2(s&1,s>>1);
        float i   = dot(F,uv+c); 
        float phi = 2.0*PI*fract(i*PHI);
        float cot = m-2.0*i/num; 
        float sit = sqrt(1.0-cot*cot); 
        vec3  q   = vec3(cos(phi)*sit, sin(phi)*sit, cot);
        float d1  = dot(p,q);
        if (d1 > d)
        {
            d   = d1;
            res = vec4(q,i);
        }
    }
    return res;
}

vec4 mapFib(vec3 p, int num)
{
    vec4 fib = sphericalFibonacci(normalize(p),float(num));
    vec3 q = p-fib.xyz;
    vec3 n = normalize(fib.xyz);
    vec3 r,f;
    basis(n,r,f);
    return vec4(dot(r,q),dot(n,q),dot(f,q), fib.w);
}
