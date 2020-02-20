#define save(a,c) if(gl.ifrag.x==(a.x)&&gl.ifrag.y==a.y){gl.color=(c);}
#define load(a) texelFetch(iChannel1, a, 0)

vec2 hash(int n) { return fract(sin(vec2(float(n),float(n)*7.))*43758.5); }

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    initGlobal(fragCoord, iResolution, iMouse);
    
    ivec2 iv = ivec2(fragCoord);
    
    if (iFrame < 100) 
    {
        save(iv,vec4(1,0,0,0));
        fragColor = gl.color;
        return;
    }

    vec4 d = load(iv);
    
    //save(iv,vec4(clamp(floor(iTime*100.0)+1.0, 1.0, 3.0),0,0,0));
    save(iv,vec4(d.x+0.01,d.y-0.01,0,1));
    
    fragColor = gl.color;
}