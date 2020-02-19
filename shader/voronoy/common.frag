
#define PI  3.141592653589
#define TAU 6.283185307178
#define E   2.718281828459
#define EPS 0.000000000001
#define PHI 1.618033988750

const vec3 v0 = vec3(0,0,0);
const vec3 vx = vec3(1,0,0);
const vec3 vy = vec3(0,1,0);
const vec3 vz = vec3(0,0,1);

const vec3 red   = vec3(0.8,0.0,0.0);
const vec3 green = vec3(0.0,0.5,0.0);
const vec3 blue  = vec3(0.2,0.2,1.0);
const vec3 white = vec3(1.0,1.0,1.0);
const vec3 black = vec3(0.0,0.0,0.0);

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

// 000   000   0000000    0000000  000   000  
// 000   000  000   000  000       000   000  
// 000000000  000000000  0000000   000000000  
// 000   000  000   000       000  000   000  
// 000   000  000   000  0000000   000   000  

vec2 hash22(vec2 p)
{
    vec3 a = fract(p.xyx*vec3(123.4, 234.5, 345.6));
    a += dot(a, a+34.45);
    return fract(vec2(a.x*a.y, a.y*a.z));   
}

float sdHex(vec2 p)
{
    p = abs(p);
    float c = dot(p, normalize(vec2(1.0, 1.73)));
    return max(c, p.x);
}

vec4 idHex(vec2 p)
{
    vec2 r  = vec2(1.0,1.73);
    vec2 r2 = r*0.5;
    vec2 a  = mod(p, r)-r2;
    vec2 b  = mod(p+r2, r)-r2;
    vec2 gv = length(a) < length(b) ? a : b;
    vec2 id = p-gv;
    return vec4(sdHex(gv),
                atan(gv.x, gv.y),
                id.x, id.y);
}