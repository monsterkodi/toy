
#define KEYS \
vec4 keys(int x, int y) { return texelFetch(iChannel0, ivec2(x,y), 0); } \
bool keyState(int key)  { return keys(key, 2).x < 0.5; } \
bool keyDown(int key)   { return keys(key, 0).x > 0.5; }

// 000   000   0000000   00000000   00     00   0000000   000
// 0000  000  000   000  000   000  000   000  000   000  000
// 000 0 000  000   000  0000000    000000000  000000000  000
// 000  0000  000   000  000   000  000 0 000  000   000  000
// 000   000   0000000   000   000  000   000  000   000  0000000

#define NORMAL \
vec3 getNormal(vec3 p)                                                   \
{                                                                        \
    gl.pass = PASS_NORMAL;                                               \
    vec3 n = v0;                                                         \
    for (int i=gl.zero; i<4; i++)                                        \
    {                                                                    \
        vec3 e = 0.5773*(2.0*vec3((((i+3)>>1)&1),((i>>1)&1),(i&1))-1.0); \
        n += e*map(p+e*0.0001);                                          \
    }                                                                    \
    return normalize(n);                                                 \
}

// 00     00   0000000   00000000    0000000  000   000
// 000   000  000   000  000   000  000       000   000
// 000000000  000000000  0000000    000       000000000
// 000 0 000  000   000  000   000  000       000   000
// 000   000  000   000  000   000   0000000  000   000

#define MARCH \
void copyHit(float t, vec3 p)                          \
{                                                      \
    gl.hit.dist   = t;                                 \
    gl.hit.mat    = sdf.mat;                           \
    gl.hit.color  = sdf.color;                         \
    gl.hit.pos    = p;                                 \
    gl.hit.normal = getNormal(p);                      \
}                                                      \
void march(vec3 ro, vec2 uv)                           \
{                                                      \
    uv = (2.0*uv-gl.res)/gl.res.y;                     \
    vec3 rd = normalize(uv.x*cam.rgt + uv.y*cam.up + cam.fov*cam.dir); \
                                                       \
    gl.pass = PASS_MARCH;                              \
    float t = 0.0;                                     \
    for (int i = gl.zero; i < gl.maxSteps; i++)        \
    {                                                  \
        vec3 p = ro+t*rd;                              \
        float d = map(p);                              \
        t += d;                                        \
        if (d < gl.minDist) { copyHit(t, p); return; } \
        if (t > gl.maxDist) break;                     \
    }                                                  \
    gl.hit.mat  = NONE;                                \
    gl.hit.dist = gl.maxDist;                          \
}

#define PI   3.141592653589
#define PI2  1.570796326795
#define TAU  6.283185307178
#define E    2.718281828459
#define PHI  1.618033988750
#define EPS  0.000000000001
#define EPS1 1.00001

#define KEY_LEFT  37
#define KEY_UP    38
#define KEY_RIGHT 39
#define KEY_DOWN  40
#define KEY_SPACE 32
#define KEY_1     49
#define KEY_2     50
#define KEY_3     51
#define KEY_4     52
#define KEY_5     53
#define KEY_6     54
#define KEY_7     55
#define KEY_8     56
#define KEY_9     57
#define KEY_0     58
#define KEY_A     65
#define KEY_B     66
#define KEY_C     67
#define KEY_D     68
#define KEY_E     69
#define KEY_F     70
#define KEY_G     71
#define KEY_H     72
#define KEY_I     73
#define KEY_J     74
#define KEY_K     75
#define KEY_L     76
#define KEY_M     77
#define KEY_N     78
#define KEY_O     79
#define KEY_P     80
#define KEY_Q     81
#define KEY_R     82
#define KEY_S     83
#define KEY_T     84
#define KEY_U     85
#define KEY_V     86
#define KEY_W     87
#define KEY_X     88
#define KEY_Y     89
#define KEY_Z     90

#define PASS_MARCH   0
#define PASS_NORMAL  1
#define PASS_SHADOW  2
#define PASS_AO      3

const vec3 v0 = vec3(0,0,0);
const vec3 vx = vec3(1,0,0);
const vec3 vy = vec3(0,1,0);
const vec3 vz = vec3(0,0,1);

const vec3 red    = vec3(0.8,0.0,0.0);
const vec3 green  = vec3(0.0,0.5,0.0);
const vec3 blue   = vec3(0.2,0.2,1.0);
const vec3 yellow = vec3(1.0,1.0,0.0);
const vec3 orange = vec3(1.0,0.5,0.0);
const vec3 white  = vec3(1.0);
const vec3 gray   = vec3(0.1);
const vec3 black  = vec3(0.0);

// 000000000  00000000  000   000  000000000
//    000     000        000 000      000
//    000     0000000     00000       000
//    000     000        000 000      000
//    000     00000000  000   000     000

struct Text {
    ivec2 size;
    ivec2 adv;
} text;

//  0000000   00000000   000000000
// 000   000  000   000     000
// 000   000  00000000      000
// 000   000  000           000
//  0000000   000           000

struct Opt {
    bool axes;
    bool info;
    bool help;
    bool space;
    bool anim;
    bool soft;
    bool occl;
    bool shadow;
    bool colors;
    bool dither;
    bool gamma;
    bool foggy;
    bool rotate;
    bool normal;
    bool depthb;
    bool vignette;
} opt;

//  0000000   0000000   00     00
// 000       000   000  000   000
// 000       000000000  000000000
// 000       000   000  000 0 000
//  0000000  000   000  000   000

struct Cam {
    vec3  tgt;
    vec3  pos;
    vec3  pos2tgt;
    vec3  dir;
    vec3  up;
    vec3  rgt;
    float dist;
    float fov;
} cam;

//  0000000  000   000   0000000   0000000     0000000   000   000
// 000       000   000  000   000  000   000  000   000  000 0 000
// 0000000   000000000  000000000  000   000  000   000  000000000
//      000  000   000  000   000  000   000  000   000  000   000
// 0000000   000   000  000   000  0000000     0000000   00     00

struct Shadow {
    float soft;
    float power;
    float bright;
};

struct Fog {
    float near;
    float far;
    vec3  color;
} fog;

// 00     00   0000000   000000000
// 000   000  000   000     000
// 000000000  000000000     000
// 000 0 000  000   000     000
// 000   000  000   000     000

struct Mat {
    float hue;
    float sat;
    float lum;
    float shiny;
    float glossy;
};

//  0000000  0000000    00000000
// 000       000   000  000
// 0000000   000   000  000000
//      000  000   000  000
// 0000000   0000000    000

struct SDF {
    vec3  pos;
    vec3  color;
    vec3  normal;
    float dist;
    int   mat;
} sdf;

//  0000000   000       0000000   0000000     0000000   000
// 000        000      000   000  000   000  000   000  000
// 000  0000  000      000   000  0000000    000000000  000
// 000   000  000      000   000  000   000  000   000  000
//  0000000   0000000   0000000   0000000    000   000  0000000

struct Global {
    vec2   uv;
    vec3   tuv;
    vec2   frag;
    vec2   res;
    vec2   mouse;
    vec2   mp;
    ivec2  ifrag;
    ivec2  ires;
    float  aspect;
    vec4   color;
    int    frame;
    float  time;
    vec3   light1;
    vec3   light2;
    vec3   light3;
    vec3   rd;
    float  ambient;
    int    zero;
    int    pass;
    int    maxSteps;
    float  minDist;
    float  maxDist;
    Shadow shadow;
    SDF    hit;
} gl;

// 000  000   000  000  000000000
// 000  0000  000  000     000
// 000  000 0 000  000     000
// 000  000  0000  000     000
// 000  000   000  000     000

void initGlobal(vec2 fragCoord, vec3 resolution, vec4 mouse, float time, int frame)
{
    gl.maxSteps = 128;
    gl.minDist  = 0.001;
    gl.maxDist  = 100.0;

    gl.ambient       = 0.03;
    gl.shadow.bright = 0.6;
    gl.shadow.power  = 4.0;
    gl.shadow.soft   = 0.0;

    gl.res    = resolution.xy;
    gl.ires   = ivec2(gl.res);
    gl.frag   = fragCoord;
    gl.ifrag  = ivec2(fragCoord);
    gl.aspect = gl.res.x / gl.res.y;
    gl.frame  = frame;
    gl.time   = time;
    gl.uv     = (fragCoord+fragCoord-gl.res)/gl.res.y;
    gl.zero   = min(frame,0);

    mouse.xy = min(mouse.xy,resolution.xy);
    if (mouse.z < 1.0)
    {
        if (mouse.z > -1.0)
            gl.mouse = resolution.xy*0.5;
        else
            gl.mouse = mouse.xy;
    }
    else gl.mouse = mouse.xy;

    gl.mp     = (2.0*abs(gl.mouse)-vec2(gl.res))/gl.res.y;

    int tw    = 4*clamp(gl.ires.y/256,1,8);
    text.size = ivec2(tw,tw*2);
    text.adv  = ivec2(text.size.x,0);

    gl.light1 = (vy*2.0 + vx + vz)*10.0;

    fog.color = vec3(0.5);
    fog.near  = 0.5;
    fog.far   = 1.0;

    cam.fov = PI2;
}

float iRange(float l, float h, float f) { return l+(h-l)*(opt.anim ? 1.0-(cos(gl.time*f)*0.5+0.5) : 0.0); }
float iRange(float l, float h) { return iRange(l, h, 1.0); }

#define sdMat(m,d)   if (d < sdf.dist) { sdf.dist = d; sdf.mat = m; }
#define sdColor(c,d) if (d < sdf.dist) { sdf.dist = d; sdf.mat = -2; sdf.color = c; }

void sdStart(vec3 p)
{
    sdf.dist  = gl.maxDist;
    sdf.pos   = p;
    sdf.mat   = -1;
    sdf.color = black;
}

float powi(int a, int b) { return pow(float(a), float(b)); }
float log10(float a) { return log(a)/log(10.0); }
float clamp01(float v) { return clamp(v, 0.0, 1.0); }
vec3  clamp01(vec3 v) { return clamp(v, 0.0, 1.0); }

// 00000000   00000000   000  000   000  000000000
// 000   000  000   000  000  0000  000     000
// 00000000   0000000    000  000 0 000     000
// 000        000   000  000  000  0000     000
// 000        000   000  000  000   000     000

#define PRINT \
float print(ivec2 pos, int ch)                                                  \
{                                                                               \
    pos *= text.size;                                                           \
    pos.y = gl.ires.y - pos.y - text.size.y;                                    \
    ivec2 r = gl.ifrag-pos;                                                     \
    bool i = r.y>0 && r.x>0 && r.x<=text.size.y && r.y<=text.size.y;            \
    return i ? texelFetch(iChannel2,                                            \
        ivec2((ch%16)*64,(1024-64-64*(ch/16)))+r*64/text.size.y,0).r : 0.0;     \
}                                                                               \
                                                                                \
float print(ivec2 pos, float v)                                                 \
{                                                                               \
    float c = 0.0;                                                              \
    float fv = fract(v);                                                        \
    v = (fv > 0.995 || fv < 0.005) ? round(v) : v;                              \
    float f = abs(v);                                                           \
    int i = (fv == 0.0) ? 1 : fract(v*10.0) == 0.0 ? -1 : -2;                   \
    int ch, u = max(1,int(log10(f))+1);                                         \
    pos.x += 6;                                                                 \
    for (; i <= u; i++) {                                                       \
        if (i == 0)     ch = 46;                                                \
        else if (i > 0) ch = 48+int(mod(f, powi(10,i))/powi(10,i-1));           \
        else            ch = 48+int(mod(f+0.005, powi(10,i+1))/powi(10,i));     \
        c = max(c, print(pos-ivec2(i,0), ch)); }                                \
    if (v < 0.0) c = max(c, print(pos-ivec2(i,0), 45));                         \
    return c;                                                                   \
}                                                                               \
                                                                                \
float print(ivec2 pos, vec4 v)                                                  \
{                                                                               \
    float c = 0.0;                                                              \
    for (int i = 0; i < 4; i++) { c = max(c, print(pos, v[i])); pos.x += 8; }   \
    return c;                                                                   \
}                                                                               \
                                                                                \
float print(ivec2 pos, vec3 v)                                                  \
{                                                                               \
    float c = 0.0;                                                              \
    for (int i = 0; i < 3; i++) { c = max(c, print(pos, v[i])); pos.x += 8; }   \
    return c;                                                                   \
}                                                                               \
                                                                                \
float print(ivec2 pos, vec2 v)                                                  \
{                                                                               \
    float c = 0.0;                                                              \
    for (int i = 0; i < 2; i++) { c = max(c, print(pos, v[i]));pos.x += 8; }    \
    return c;                                                                   \
}                                                                               \
                                                                                \
float print(int x, int y, float v) { return print(ivec2(x,y), v); }             \
float print(int x, int y, int v)   { return print(ivec2(x,y), float(v)); }      \
float print(int x, int y, vec4 v)  { return print(ivec2(x,y), v); }             \
float print(int x, int y, vec3 v)  { return print(ivec2(x,y), v); }             \
float print(int x, int y, vec2 v)  { return print(ivec2(x,y), v); }             \
float print(int x, int y, ivec3 v) { return print(ivec2(x,y), vec3(v)); }       \
float print(int x, int y, ivec2 v) { return print(ivec2(x,y), vec2(v)); }       \
float print(int x, int y, bool v)  { return print(ivec2(x,y), float(v)); }

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

vec3 rgb2hsl(vec3 col)
{
    float minc = min( col.r, min(col.g, col.b) );
    float maxc = max( col.r, max(col.g, col.b) );
    vec3  mask = step(col.grr,col.rgb) * step(col.bbg,col.rgb);
    vec3 h = mask * (vec3(0.0,2.0,4.0) + (col.gbr-col.brg)/(maxc-minc + EPS)) / 6.0;
    return vec3( fract( 1.0 + h.x + h.y + h.z ),
                 (maxc-minc)/(1.0-abs(minc+maxc-1.0) + EPS),
                 (minc+maxc)*0.5);
}

vec3 setsat(vec3 col, float sat)
{
    vec3 h = rgb2hsl(col);
    return hsl(h.x,sat,h.z);
}

vec3 desat(vec3 col)
{
    return setsat(col, 0.0);
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

mat3 alignMatrix(vec3 right, vec3 up)
{
    // vec3 f = normalize(dir);
    // vec3 s = normalize(cross(f, vec3(0.48, 0.6, 0.64)));
    // vec3 u = cross(s, f);
    return mat3(right, up, cross(right,up));
}

// 00000000    0000000   000000000
// 000   000  000   000     000
// 0000000    000   000     000
// 000   000  000   000     000
// 000   000   0000000      000

float rad2deg(float r) { return 180.0 * r / PI; }
float deg2rad(float d) { return PI * d / 180.0; }

vec3  rad2deg(vec3 v) { return 180.0 * v / PI; }
vec3  deg2rad(vec3 v) { return PI * v / 180.0; }

mat3  rotMat(vec3 u, float angle)
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

vec3 posOnPlane(vec3 p, vec3 n)
{
    return p-dot(p,n)*n;
}

vec3 posOnRay(vec3 p, vec3 n)
{
    return max(0.0, dot(p, n) / dot(n, n)) * n;
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
    return mix(d1, -d2, h) + k*h*(1.0-h);
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
    return length(sdf.pos-a)-r;
}

float sdPill(vec3 a, float r, vec3 n)
{
    vec3 p = sdf.pos-a;
    float d = abs(dot(normalize(n),normalize(p)));
    float f = smoothstep(0.0, 1.3, d);
    return length(p) - r + f * length(n);
}

float sdPlane(vec3 a, vec3 n)
{
    return dot(n, sdf.pos-a);
}

float sdPlane(vec3 n)
{
    return dot(n, sdf.pos);
}

float sdHalfSphere(vec3 a, vec3 n, float r, float k)
{
    return opInter(sdPlane(a, -n), sdSphere(a, r), k);
}

float sdBox(vec3 a, vec3 b, float r)
{
    vec3 q = abs(sdf.pos-a)-(b-r);
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}

float sdCube(vec3 a, float s, float r)
{
    return sdBox(a, vec3(s), r);
}

float sdBox(vec3 a, vec3 right, vec3 up, vec3 dim)
{
  vec3  q = sdf.pos-a;
  float x = abs(dot(right, q))-dim.x;
  float y = abs(dot(up,    q))-dim.y;
  float z = abs(dot(cross(right,up), q))-dim.z;
  return max(x,max(y,z));
}

float sdBox(vec3 a, vec3 right, vec3 up, vec3 dim, float r)
{
  vec3 p = sdf.pos;
  sdf.pos -= a;
  sdf.pos *= alignMatrix(right, up);
  float d = sdBox(v0, dim, r);
  sdf.pos = p;
  return d;
}

float sdEllipsoid(vec3 a, vec3 r)
{
    vec3 p = sdf.pos-a;
    float k0 = length(p/r);
    float k1 = length(p/(r*r));
    return k0*(k0-1.0)/k1;
}

float sdCone(vec3 a, vec3 b, float r1, float r2)
{
    vec3 ab = b-a;
    vec3 ap = sdf.pos-a;
    float t = dot(ab,ap) / dot(ab,ab);
    t = clamp(t, 0.0, 1.0);
    vec3 c = a + t*ab;
    return length(sdf.pos-c)-(t*r2+(1.0-t)*r1);
}

float sdLine(vec3 a, vec3 n, float r)
{
    vec3 p = sdf.pos-a;
    return length(p-n*dot(p,n))-r;
}

float sdLine(vec2 p, vec2 a, vec2 b)
{
    vec2 n = b-a;
    vec2 nc = n.yx; nc.x *= -1.0;
    return dot(p-a,nc) <= 0.0 ? 0.0 : length((p-a)-n*dot(p-a,n)/dot(n,n));
}

float sdLine2(vec2 p, vec2 a, vec2 b)
{
    vec2 n = b-a;
    return length((p-a)-n*dot(p-a,n)/dot(n,n));
}

float sdCapsule(vec3 a, vec3 b, float r)
{
    vec3 ab = b-a;
    vec3 ap = sdf.pos-a;
    float t = dot(ab,ap) / dot(ab,ab);
    t = clamp(t, 0.0, 1.0);
    vec3 c = a + t*ab;
    return length(sdf.pos-c)-r;
}

float sdCylinder(vec3 a, vec3 b, float r, float cr)
{
  vec3  ba = b - a;
  vec3  pa = sdf.pos - a;
  float baba = dot(ba,ba);
  float paba = dot(pa,ba);
  float x = length(pa*baba-ba*paba) - r*baba;
  float y = abs(paba-baba*0.5)-baba*0.5;
  float x2 = x*x;
  float y2 = y*y*baba;
  float d = (max(x,y)<0.0)?-min(x2,y2):(((x>0.0)?x2:0.0)+((y>0.0)?y2:0.0));
  return sign(d)*sqrt(abs(d))/baba - cr;
}

float sdHexagon(vec3 p, vec3 a, vec3 r) // r: (radius, height, bevel)
{
    vec3 k = vec3(-0.8660254, 0.5, 0.57735);
    p = abs(p - a);
    p.xz -= 2.0*min(dot(k.xy, p.xz), 0.0)*k.xy;
    float hr = r.x-r.z;
    float hh = r.y-r.z;
    vec2 d = vec2(length(p.xz-vec2(clamp(p.x,-k.z*hr,k.z*hr), hr))*sign(p.z-hr), p.y-hh);
    return min(max(d.x,d.y),0.0) + length(max(d,0.0)) - r.z;
}

float sdHexagon(vec3 a, vec3 r) // r: (radius, height, bevel)
{
    return sdHexagon(sdf.pos, a, r);
}

float sdTorus(vec3 p, vec3 a, vec3 n, float rl, float rs)
{
    vec3 q = p-a;
    return length(vec2(length(posOnPlane(q, n))-rl,abs(dot(n, q))))-rs;
}

float sdLink(vec3 p, float le, float r1, float r2)
{
    vec3 q = vec3(p.x, max(abs(p.y)-le,0.0), p.z);
    return length(vec2(length(q.xy)-r1,q.z)) - r2;
}

float sdLink(vec3 a, vec3 b, vec3 n, vec3 r, float uvz)
{
    vec3 ab = normalize(b-a);
    float lab = length(ab);
    vec3 p = sdf.pos - (b+a)*0.5; // center
    p *= mat3(cross(n, ab), ab, n); // orientate
    p -= vec3(0,0,clamp(p.z,-r.y, r.y)); // elongate
    vec3 q = vec3(p.x, max(abs(p.y)-lab,0.0), p.z); // stretch up
    float d = length(vec2(length(q.xy)-r.x,q.z)) - r.z;
    if (d < sdf.dist && gl.pass == PASS_MARCH)
    {
        float uvy = abs(length(q.xy)-r.x)/r.z;
        if (q.y == 0.0)
            gl.tuv = vec3(fract(sign(p.x)*p.y/lab), uvy, uvz);
        else
            gl.tuv = vec3(fract(sign(p.x)*sign(p.y)*(1.0-acos(dot(normalize(q.xy), vec2(0,1)))/PI2)), uvy, uvz);
    }
    return d;
}

void sdAxes(float r)
{
    if (!opt.axes || gl.pass == PASS_SHADOW) return;
    sdColor(red,   sdCapsule(v0, vx*gl.maxDist, r));
    sdColor(green, sdCapsule(v0, vy*gl.maxDist, r));
    sdColor(blue,  sdCapsule(v0, vz*gl.maxDist, r));
}

void sdFloor(vec3 color, float h)
{
    if (cam.pos.y > h) sdColor(color, sdPlane(vy*h, vy));
}

// 000   000   0000000   000   0000000  00000000
// 0000  000  000   000  000  000       000
// 000 0 000  000   000  000  0000000   0000000
// 000  0000  000   000  000       000  000
// 000   000   0000000   000  0000000   00000000

float noise3D(in vec3 p)
{
    const vec3 s = vec3(7, 157, 113);
    vec3 ip = floor(p); p -= ip;
    vec4 h = vec4(0., s.yz, s.y + s.z) + dot(ip, s);
    p = p*p*(3. - 2.*p);
    h = mix(fract(sin(h)*43758.5453), fract(sin(h + s.x)*43758.5453), p.x);
    h.xy = mix(h.xz, h.yw, p.y);
    return mix(h.x, h.y, p.z);
}

// 0000000    000   000  00     00  00000000
// 000   000  000   000  000   000  000   000
// 0000000    000   000  000000000  00000000
// 000   000  000   000  000 0 000  000
// 0000000     0000000   000   000  000

float drawSphere(in vec3 p)
{
    p = fract(p)-.5; return dot(p, p);
}

float cellTile(in vec3 p)
{
    vec4 d;
    d.x = drawSphere(p - vec3(.81, .62, .53)); p.xy = vec2(p.y-p.x, p.y + p.x)*.7071;
    d.y = drawSphere(p - vec3(.39, .2,  .11)); p.yz = vec2(p.z-p.y, p.z + p.y)*.7071;
    d.z = drawSphere(p - vec3(.62, .24, .06)); p.xz = vec2(p.z-p.x, p.z + p.x)*.7071;
    d.w = drawSphere(p - vec3(.2,  .82, .64));
    d.xy = min(d.xz, d.yw);
    return min(d.x, d.y)*2.66;
}

float bumpSurf(vec3 p, float factor)
{
    return 0.2*noise3D(p*15.0) - 0.05*noise3D(p*10.0/factor);
}

vec3 bumpMap(vec3 p, vec3 nor, float factor)
{
    const vec2 e = vec2(0.001, 0);
    vec3 grad = (vec3(bumpSurf(p - e.xyy, factor),
                      bumpSurf(p - e.yxy, factor),
                      bumpSurf(p - e.yyx, factor))-bumpSurf(p, factor))/e.x;
    grad -= nor*dot(nor, grad);
    return normalize(nor - grad*factor * clamp01(1.0-length(cam.pos-p)/4.0));
}

//  0000000   0000000   00     00  00000000  00000000    0000000
// 000       000   000  000   000  000       000   000  000   000
// 000       000000000  000000000  0000000   0000000    000000000
// 000       000   000  000 0 000  000       000   000  000   000
//  0000000  000   000  000   000  00000000  000   000  000   000

void lookAtFrom(vec3 tgt, vec3 pos)
{
    cam.tgt     = tgt;
    cam.pos     = pos;
    cam.pos2tgt = cam.tgt-cam.pos;
    cam.dir     = normalize(cam.pos2tgt);
    cam.rgt     = normalize(cross(cam.dir, vy));
    cam.up      = normalize(cross(cam.rgt,cam.dir));
    cam.dist    = length(cam.pos2tgt);
}

void lookAt  (vec3 tgt) { lookAtFrom(tgt, cam.pos); }
void lookFrom(vec3 pos) { lookAtFrom(cam.tgt, pos); }
void lookPan (vec3 pan) { lookAtFrom(cam.tgt+pan, cam.pos+pan); }
void lookPitch(float ang) {
    cam.pos2tgt = rotAxisAngle(cam.pos2tgt, cam.rgt, ang);
    cam.tgt     = cam.pos + cam.pos2tgt;
    cam.dir     = normalize(cam.pos2tgt);
    cam.up      = normalize(cross(cam.rgt,cam.dir));
}

void orbitPitch(float pitch)
{
    cam.pos2tgt = rotAxisAngle(cam.pos2tgt, cam.rgt, pitch);
    cam.pos     = cam.tgt - cam.pos2tgt;
    cam.dir     = normalize(cam.pos2tgt);
    cam.up      = normalize(cross(cam.rgt,cam.dir));
}

void orbitYaw(float yaw)
{
    cam.pos2tgt = rotAxisAngle(cam.pos2tgt, vy, yaw);
    cam.pos     = cam.tgt - cam.pos2tgt;
    cam.dir     = normalize(cam.pos2tgt);
    cam.rgt     = normalize(cross(cam.dir, vy));
    cam.up      = normalize(cross(cam.rgt,cam.dir));
}

void orbit(float pitch, float yaw)
{
    orbitYaw(yaw);
    orbitPitch(pitch);
}

void initCam(vec3 lookAt, float dist, float rotx, float roty)
{
    lookAtFrom(lookAt, rotAxisAngle(rotAxisAngle(vec3(0,0,-dist), vx, 89.0*roty), vy, 180.0*rotx));
}

// 00000000    0000000    0000000  000000000
// 000   000  000   000  000          000
// 00000000   000   000  0000000      000
// 000        000   000       000     000
// 000         0000000   0000000      000

vec4 postProc(vec3 col, bool dither, bool gamma, bool vignette)
{
    if (dither)   col -= vec3(gradientNoise(gl.frag)/256.0);
    if (gamma)    col  = pow(col, vec3(1.0/2.2));
    if (vignette) col *= vec3(smoothstep(1.8, 0.5, length(gl.uv)/max(gl.aspect,1.0)));
    return vec4(col, 1.0);
}