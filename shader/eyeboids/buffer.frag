#define keys(x,y) texelFetch(iChannel0, ivec2(x,y), 0)
#define save(a,c) if(gl.ifrag.x==(a)&&gl.ifrag.y==0){gl.color=(c);}
#define load(x) texelFetch(iChannel1, ivec2(x,0), 0)

bool keyState(int key) { return keys(key, 2).x < 0.5; }

int  id = -1;
int  num = 0;
vec4 val;

#define SPEED    0.05
#define DAMP     0.5
#define MAX_FISH 18.

vec2 hash(int n) { return fract(sin(vec2(float(n),float(n)*7.))*43758.5); }

vec2 repulse(vec4 fish, vec2 target, float dist, float a)
{
    vec2 w = target-fish.xy;
    float x = length(w);
    if (x < EPSILON) return a*0.5*(hash31(float(id))-vec3(0.5)).xy;
    return w*a*(smoothstep(0.0, dist, x)-1.0)/x;
}

vec2 attract(vec4 fish, vec2 target, float dist, float a, float s2, float s3)
{
    vec2  w = target-fish.xy;
    float x = length(w);
    float k = dist+s2;
    float d = (2.0*dist+s2)*0.5;
    float xkd = (x-d)/(k-d);
    float l = min(max(-1.0, -abs(x-d)/(k-d)), xkd*exp(1.0+xkd));
    float r = max(-1.0, xkd*exp(1.0-xkd)-max(0.0,(1.0-s3)*(1.0-exp(1.0-x/k))));
    float f = a*max(r,l)*0.5+0.5;
    return w*f;
}

vec2 swirl(vec4 fish, vec2 center, float a, float k)
{
    vec2 w = center-fish.xy;
    w = vec2(-w.y,w.x);
    return sign(k)*w*a/pow(length(w),abs(k));
}

void boid()
{
    vec2 vel, acc, w, u = vec2(0.0);
    vec4 fish = load(id);
    
    if (!keyState(KEY_RIGHT)) { save(id, fish); return; }
    
    float d, v, a;
      
    for (int i = 1; i <= num; i++) 
    {
        if (i == id) continue;
    	acc += repulse(fish, load(i).xy, 0.55, 4.0);
	}

    acc += attract(fish, gl.mp, 0.025, 0.01, 0.2, 0.1);
    acc += repulse(fish, gl.mp, 0.45, 20.0);
    acc += swirl  (fish, gl.mp, iTimeDelta/6.0, 6.0*sin(iTime*0.25));
    
    //acc = normalize(acc)*min(0.5,length(acc));
    vel = fish.zw + acc*SPEED;

   	vel *= pow(DAMP, SPEED);
    
    w = fish.xy+vel*SPEED;
    
    float b = 0.175;
    val.x  = clamp(w.x,-1.0*gl.aspect+b,1.0*gl.aspect-b);
    val.y  = clamp(w.y,-1.0+b,1.0-b);
    val.zw = vel;
    
    save(id, val);
}

void initFish(int id)
{
   float r = 2.0*hash11(float(id))-1.0;
   save(id, 0.5*vec4(r, 2.0*fract(r*123.0)-1.0, 0.0, 0.0)); 
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    initGlobal(fragCoord, iResolution, iMouse, iTime);
    
    if (iFrame == 0) 
    {
		save(0,vec4(1,0,0,0));
        initFish(1);
        fragColor = gl.color;
        return;
    }

    ivec2 mem = ivec2(fragCoord);
    if (mem.y > 0) return;
    id = mem.x;

    val = load(id);
	num = int(load(0).x);
    
    if (id == 0)
    {
        save(id,vec4(clamp(floor(iTime*20.0)+1.0, 1.0, MAX_FISH),0,0,0));
    }
    else
    {
        if (id > num) initFish(id);
        else boid();
    }
    
    fragColor = gl.color;
}