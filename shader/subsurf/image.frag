
HEADER

Mat[6] material = Mat[6]( 
    //  hue    sat   lum   shiny  metal glossy emit
    Mat(HUE_B, 1.0,  0.7,   1.0,  0.9,  1.0,   0.0  ), 
    Mat(HUE_R, 1.0,  0.5,   1.0,  0.9,  1.0,   0.0  ),
    Mat(0.5,   0.0,  1.0,   0.5,  0.5,  1.0,   0.1  ), 
    Mat(0.5,   0.0,  1.0,   0.0,  0.0,  0.0,   1.0  ),
    Mat(0.5,   0.0,  1.0,   0.0,  0.0,  0.0,   1.0  ),
    Mat(0.5,   0.0,  1.0,   0.0,  0.0,  0.0,   1.0  )
);

//  0000000  000   000  000   000  000      000      
// 000       000  000   000   000  000      000      
// 0000000   0000000    000   000  000      000      
//      000  000  000   000   000  000      000      
// 0000000   000   000   0000000   0000000  0000000  

void skull()
{
    sdf.pos.x = abs(sdf.pos.x);
    sdf.pos.y -= 0.15;
    sdf.pos *= alignMatrix(vx, normal(0.0,1.0,-0.5));
    
    float d, h;
    
    d = sdEllipsoid(vy, vec3(5.5,5.5,5.0)); // frontal
    
    // if (d > 15.0) {
        // sdf.dist = min(sdf.dist, d);
        // return;
    // }
    
    d = opUnion(d, sdSphere( 2.0*vy -2.0*vz, 6.0), 1.0);            // parietal
    d = opDiff (d, sdPlane (-vy, vy), 1.5);                         // cranial cutoff
    d = opUnion(d, sdCone  ( 4.1*vz -2.5*vy, 2.5, 1.8, 3.5), 0.5);  // jaw
    d = opDiff (d, sdCone  ( 4.1*vz -2.5*vy, 1.6, 0.6, 3.5), 0.5);  // jaw hole
    d = opDiff (d, sdCone  ( 5.8*vz -0.1*vy, 1.0, 0.5, 1.5), 0.3);  // nose
    d = opDiff (d, sdPlane (-2.5*vy, vy), 0.5);                     // jaw cutoff
    d = opDiff (d, sdSphere( 2.7*vx +3.0*vy +3.6*vz, 2.0), 0.5);    // eye holes
    
    d = opDiff(d, sdBox(7.2*vx+3.5*vy-1.2*vz, normalize(vec3(1,-0.2,0.4)), vy, vec3(2.0,3.0,3.0), 1.0), 1.0);
    
    h = sdCapsule(-2.5*vy-1.5*vz, -2.5*vy-0.2*vz, 3.6);
    h = opUnion(h, sdCapsule(vy-2.0*vz, vy-0.5*vz, 3.6));
    d = opDiff(d, h, 1.0);
    
    sdMat(0, d);
    
    sdMat(2, sdBox(0.47*vx-2.8*vy+6.1*vz, normalize(vec3(1,0,-0.2)), vy, vec3(0.50,0.70,0.3), 0.3));
    sdMat(2, sdBox(1.29*vx-2.8*vy+5.7*vz, normalize(vec3(1,0,-0.8)), vy, vec3(0.47,0.65,0.3), 0.3));
    sdMat(2, sdBox(1.80*vx-2.8*vy+5.0*vz, normalize(vec3(0.4,0,-1)), vy, vec3(0.47,0.65,0.3), 0.3));
    sdMat(2, sdBox(2.00*vx-2.8*vy+4.1*vz, normalize(vec3(0,  0,-1)), vy, vec3(0.47,0.65,0.3), 0.3));
}

// 0000000     0000000   000   000  00000000  
// 000   000  000   000  0000  000  000       
// 0000000    000   000  000 0 000  0000000   
// 000   000  000   000  000  0000  000       
// 0000000     0000000   000   000  00000000  

void bone()
{
    sdf.pos.x = abs(sdf.pos.x);
    
    float d;
    vec3 ctr = 5.0*vz - 1.8*vy;
    vec3 rgt =  7.0*vx +ctr+3.0*vz;
    d = sdCapsule(ctr, rgt, 0.9);
    d = opUnion(d, sdSphere(rgt+vz, 1.7), 0.5);
    d = opUnion(d, sdSphere(rgt-vz-vx, 1.5), 0.5);
    
    rgt -= 6.0*vz;
    rgt += (rgt-ctr)*0.3;
    d = min(d, sdCapsule(ctr, rgt, 0.9));
    d = opUnion(d, sdSphere(rgt-vz, 1.7), 0.5);
    d = opUnion(d, sdSphere(rgt+vz-vx, 1.5), 0.5);
    
    sdMat(1, d);
}

// 00     00   0000000   00000000   
// 000   000  000   000  000   000  
// 000000000  000000000  00000000   
// 000 0 000  000   000  000        
// 000   000  000   000  000        

float map(vec3 p)
{
    sdStart(p);
    
    sdFlex(vec3(0.04), -3.6);
    sdAxes(0.1);
    
    if (true && gl.pass != PASS_SHADOW)
    {
        sdMat(3, sdSphere(gl.light[0].pos, gl.light[0].bright)); 
        sdMat(4, sdSphere(gl.light[1].pos, gl.light[1].bright)); 
        sdMat(5, sdSphere(gl.light[2].pos, gl.light[2].bright)); 
    }
    
    bone();
    skull();
    
    return sdf.dist;
}

NORMAL   
MARCH    
OCCLUSION
SHADOW

// 000      000   0000000   000   000  000000000  
// 000      000  000        000   000     000     
// 000      000  000  0000  000000000     000     
// 000      000  000   000  000   000     000     
// 0000000  000   0000000   000   000     000     

vec3 calcLight(vec3 p, vec3 n)                    
{                                                 
    vec3 col;                                     
    Mat  mat;                                     
    switch (gl.hit.mat)                           
    {                                             
        case -2: col = gl.hit.color; break;       
        case NONE:
        {                                         
           vec2   guv = gl.frag.xy - gl.res / 2.; 
           float  grid = dot(step(mod(guv.xyxy, vec4(10,10,100,100)), vec4(1)), vec4(.5, .5, 1, 1)); 
           return mix(vec3(.001), vec3(0.01,0.01,0.01), grid); 
        }                                                      
        default:                                               
        {                                                      
            mat = material[gl.hit.mat];                      
            col = hsl(mat.hue, mat.sat, mat.lum);              
        }                                                      
    }                                                          
    col = (opt.colors) ? desat(col) : col;                     
    if (opt.normal || opt.depthb)                              
    {                                                          
        vec3 nc = opt.normal ? gl.hit.dist >= gl.maxDist ? black : n : white;      
        vec3 zc = opt.depthb ? vec3(pow(1.0-gl.hit.dist/gl.maxDist, 4.0)) : white; 
        col = nc*zc;                                           
    }                                                          
    else                                                       
    {   
        vec3 sum   = v0;
        vec3 gloss = v0;
        float bsum = 0.0;
        float mbr  = 0.0;
        float occl = occlusion(p,n);
        for (int i = gl.zero; i < 3; i++)
        {
            float br  = gl.light[i].bright;
            vec3  ld  = normalize(gl.light[i].pos-p);
            vec3  vn  = normalize(ld-cam.dir);
            float shd = shadow(p,n,i);
            float dvn = dot(n,vn);
            float dld = dot(n,ld);
            float dcd = dot(n,-cam.dir);
            
            gloss += br*gl.light[i].color*mix(mat.glossy*0.1,pow(mat.glossy,4.0),mat.glossy)*pow(smoothstep(
                mat.glossy*(0.992-env.specs*0.6*0.01), 
                1.0-env.specs*0.45*0.01, dvn), 
                4.0+36.0*mat.glossy);
            
            float shiny, metal;
            
            shiny  = pow(dld*dld, 5.0);
            shiny += pow(dvn,2.0)*0.2;
            shiny += pow(1.0-dcd, 2.0);
            
            metal  = smoothstep(mat.metal*0.5, 0.52, dot(n,normalize(vy+ld)));
            
            float shf = 1.0-mat.shiny*(1.0-shiny);
            float mtf = 1.0-mat.metal*(1.0-metal);
            
            sum  += gl.light[i].color * (max(dld,0.0) * br * shd * occl * shf * mtf);
            
            bsum += br;
            mbr = max(mbr, br);
        }
        sum /= bsum/mbr;
        
        col = mix(col * sum, col, mat.emit);
        col += gloss*env.gloss;
        
        col = max(col, env.ambient);
    } 
    return col; 
}

//  0000000  00000000  000000000  000   000  00000000   
// 000       000          000     000   000  000   000  
// 0000000   0000000      000     000   000  00000000   
//      000  000          000     000   000  000        
// 0000000   00000000     000      0000000   000        

void setMatColor(int i, vec3 c)
{
    vec3 hc = rgb2hsl(c);
    material[i].hue = hc.x;
    material[i].sat = hc.y;
    material[i].lum = hc.z;
}

void setup()
{
    cam.fov     = PI;
    fog.near    = 0.9;
    fog.color   = hsl(HUE_B, 0.5, 0.2);
    env.ambient = white*0.005;
    env.gloss   = 0.005;
    env.specs   = 1.0;
    
    gl.maxSteps = 128;
    gl.minDist  = 0.02;
    gl.maxDist  = 200.0;
    
    vec3 lp = vec3(22,10,0); 
    float soft = 0.5; 
    float dark = 0.07; 
    float lsat = 1.0; 
    float lrot = 5.0;
    float ljmp = 5.0;
    gl.light[0].color       = hsl(HUE_R, 1.0, lsat);
    gl.light[0].bright      = 1.0;
    gl.light[0].shadow.soft = soft;
    gl.light[0].shadow.dark = dark;
    gl.light[0].pos = rotAxisAngle(lp, vy, 120.0-iTime*lrot)+iRange(ljmp,0.0)*vy;
    
    gl.light[1].color       = hsl(HUE_G, 1.0, lsat);
    gl.light[1].bright      = 1.0;
    gl.light[1].shadow.soft = soft;
    gl.light[1].shadow.dark = dark;
    gl.light[1].pos = rotAxisAngle(lp, vy, -120.0-iTime*lrot)+iRange(ljmp,0.0)*vy;
    
    gl.light[2].color       = hsl(HUE_B, 1.0, lsat);
    gl.light[2].bright      = 1.0;
    gl.light[2].shadow.soft = soft;
    gl.light[2].shadow.dark = dark;
    gl.light[2].pos = rotAxisAngle(lp, vy, -iTime*lrot)+iRange(ljmp,0.0)*vy;
    
    for (int i = 0; i < 3; i++)
    {
        setMatColor(3+i, gl.light[i].bright*gl.light[i].color);
    }
    
    // material[0].shiny  = iRange(0.0,1.0,1.0);
    // material[2].shiny  = iRange(0.0,1.0,1.0);
    // material[0].glossy = iRange(1.0,0.0,2.0);
    // material[2].glossy = iRange(1.0,0.0,2.0);
    // material[0].metal = iRange(0.0,1.0,1.0);
    // material[1].metal = iRange(0.0,1.0,1.0);
}

SETUP
