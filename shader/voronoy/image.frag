float aspect;

vec3 topLeft(vec2 uv)
{
    float md = 1.0;
    float id = -1.0;
    
    vec2 ar = vec2(iResolution.x/iResolution.y, 1);
    
    for (float i = 0.0; i < 100.0; i++)
    {
        vec2 n = hash22(vec2(i));
        vec2 p = sin(0.2*iTime*(n*2.0-1.0))*ar;
        float d = length(uv-p);
        if (d < md) 
        { 
            id = i;
            md = min(md, d);
        }
    }    
    
    return hsl(
        fract(iTime*0.1)+0.25*id/50.0, 
        0.75+0.25*sin(iTime*id*0.003), 
        0.5-md*0.5);    
}

vec3 topRight(vec2 uv)
{
    uv *= 15.0;
    vec4 hx = idHex(uv);
    float hf = pow(fract(iTime*0.25),7.0);
    return hsl(hf+0.005*hx.w*hx.z, 0.75+0.25*sin(iTime*hx.w*0.33), 0.5);
}

vec3 botLeft(vec2 uv)
{
    if (uv.y > 0.5)
        return hsl(floor(uv.x*6.0)/6.0, 1.0, uv.y*2.0-1.0);
    else
        return hsl(uv.x, 1.0, uv.y);
}

vec3 botRight(vec2 uv)
{
    return pow(botLeft(uv), vec3(1.0/2.2));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv  = (2.0*fragCoord-iResolution.xy)/iResolution.y;    

    aspect = iResolution.x / iResolution.y;
    vec3 col = v0;

    float b = 0.005;
         if (uv.x < -b && uv.y >  b) col = topLeft (uv*2.0+vec2( 1.0,-1.0));
    else if (uv.x >  b && uv.y >  b) col = topRight(uv*2.0+vec2(-1.0,-1.0));
    else if (uv.x < -b && uv.y < -b) col = botLeft (vec2(uv.x/aspect+1.0,uv.y+1.0));
    else if (uv.x >  b && uv.y < -b) col = botRight(vec2(uv.x/aspect+1.0,uv.y+1.0));

    // col = pow(col, vec3(1.0/2.2));
    fragColor = vec4(col,1.0);
}