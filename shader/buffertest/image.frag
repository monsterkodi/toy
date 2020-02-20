#define keys(x,y) texelFetch(iChannel0, ivec2(x,y), 0)
#define load(x)   texelFetch(iChannel1, x, 0)
#define font(x,y) texelFetch(iChannel2, ivec2(x,y), 0)
bool keyState(int key) { return keys(key, 2).x < 0.5; }
bool keyDown(int key)  { return keys(key, 0).x > 0.5; }

float spark(float x, float y, float r)
{
    return pow(r/length(gl.uv-vec2(x,y)), 3.0);
}

float powi(int a, int b) { return pow(float(a), float(b)); }
float log10(float a) { return log(a)/log(10.0); }

float print(ivec2 pos, int ch)
{
    ivec2 r = gl.ifrag-pos; bool i = r.y>0 && r.x>0 && r.x<=text.size.y && r.y<=text.size.y;
    return i ? texelFetch(iChannel2,ivec2((ch%16)*64,(1024-64-64*(ch/16)))+r*64/text.size.y,0).r : 0.0;
}

float print(ivec2 pos, float v)
{
    float c = 0.0; ivec2 a = text.adv; float f = abs(v);
    int i = fract(v) == 0.0 ? 1 : fract(v*10.0) == 0.0 ? -1 : -2;
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

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    initGlobal(fragCoord, iResolution, iMouse);
    for (int i = KEY_1; i <= KEY_9; i++) { if (keyDown(i)) { gl.option = i-KEY_1+1; break; } }
    
    bool dither = keyState(KEY_LEFT);
    bool dmpclr = keyState(KEY_RIGHT);
    
    vec3 col = vec3(0.0);
    // col = load(ivec2(fragCoord)).rgb;
    
    col += print(ivec2(0,0), vec2(round(iFrameRate), iTime));
    col += print(ivec2(0,text.size.y*5), load(ivec2(fragCoord)).rgb);
    col += print(ivec2(0,text.size.y*4),  iChannelResolution[0]);
    col += print(ivec2(0,text.size.y*3),  iChannelResolution[1]);
    col += print(ivec2(0,text.size.y*2),  iChannelResolution[2]);
    col += print(ivec2(0,text.size.y*1),  iMouse);
    
    col += spark(gl.mp.x, gl.mp.y, 0.02);

    if (dither)
    {
        col -= vec3(hash12(gl.frag)*0.002);
        col = max(col, v0);
    }
    
    col = pow(col, vec3(1.0/2.2));
    fragColor = vec4(col,1.0);
}