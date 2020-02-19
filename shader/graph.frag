#define PI 3.1415

float scale = 25.0;
#define offset (0.003 * scale)

float func1(float x, float p) 
{    
    return 5.*sin(x*p);
}

float func2(float x, float p)
{
    return 10.*smoothstep(0., p, x);
}

float func3(float x, float p)
{
    return p;
}

float map(vec2 uv, float f0, float f1, float f2) 
{
    float s  = 0.003 * scale;
    float y0 = f0 - uv.y;
    float m  = (f2-f1)/offset;
    float w = scale/200.0; // line width
    
    if (abs(m) > 1.2) 
    {
        if ((m >  1.2 && uv.y < f2 && uv.y > f1) || 
            (m < -1.2 && uv.y > f2 && uv.y < f1))
        {
            return (abs(y0) / w) * (1.2/abs(m));
        }
    }

    return smoothstep(0., w, abs(y0));
}

vec3 checker(vec2 uv) 
{
    float xd = floor(10.0 * uv.x);
    float yd = floor(10.0 * uv.y);
    float xi = floor(uv.x);
    float yi = floor(uv.y);

    vec3 c2 = vec3((mod(xi + yi, 2.0)==0.0) ? 0.15 : 0.08);
    return mod(xd + yd, 2.0)==0.0 ? vec3(0.1) : c2;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) 
{
    vec2 uv = (fragCoord-.5*iResolution.xy)/iResolution.y;

    uv *= scale;
    
    float q = sin(0.2 * PI * iTime);
    float p = 10.0*q;
    
    float f0 = func1(uv.x,   p);
    float f1 = func1(uv.x-offset, p);
    float f2 = func1(uv.x+offset, p);
        
    float d1 = map(uv, f0, f1, f2);

    f0 = func2(uv.x,   p);
	f1 = func2(uv.x-offset, p);
	f2 = func2(uv.x+offset, p);
    
    float d2 = map(uv, f0, f1, f2);

    f0 = func3(uv.x,   p);
	f1 = func3(uv.x-offset, p);
	f2 = func3(uv.x+offset, p);
    
    float d3 = map(uv, f0, f1, f2);
    
    float d = min(d1, min(d2, d3));

    vec3 gc;
	if (d1 < min(d2,d3))
        gc = vec3(1.0,0.5,0.5);
   	else if (d2 < min(d3,d1))
        gc = vec3(1.0,1.0,0.2);
    else
        gc = vec3(0.5,0.5,1.0);
    
    vec3 col;
    col = mix(checker(uv), gc, 1.0-d);
    
    float s = atan(uv.x,uv.y) - sqrt(length(uv)) - max(sin(iTime),0.0);    
    col = vec3(s);
    col = vec3(fract(atan(uv.y, uv.x)/6.3 + 10.*length(uv) - max(0.0,sin(iTime))));
    fragColor = vec4(col, 1.0);
}
