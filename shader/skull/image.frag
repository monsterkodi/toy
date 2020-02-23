
HEADER

Mat[4] material = Mat[4]( 
    //  hue    sat   lum   shiny  glossy
    Mat(HUE_Y, 1.0,  0.8,  0.05,  0.6 ), 
    Mat(HUE_Y, 0.8,  0.9,  0.05,  1.0 ), 
    Mat(HUE_Y, 1.0,  0.8,  0.05,  0.6 ), 
    Mat(0.5,   0.0,  1.0,  0.05,  0.0 )
);

float map(vec3 p)
{
    sdStart(p);
    
    sdFloor(vec3(1), -2.45);
    sdAxes(0.1);
    
    vec3 sp = sdf.pos;
    
    sdf.pos.x = abs(sdf.pos.x);
    sdf.pos *= alignMatrix(vx, normal(0.0,1.0,-0.245));
    
    float d, h;
    
    d = sdEllipsoid(vy, vec3(5.5,5.5,5.0));                         // frontal
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
    
    sdMat(1, d);
    
    sdMat(2, sdBox(0.47*vx-2.8*vy+6.1*vz, normalize(vec3(1,0,-0.2)), vy, vec3(0.50,0.70,0.3), 0.3));
    sdMat(2, sdBox(1.29*vx-2.8*vy+5.7*vz, normalize(vec3(1,0,-0.8)), vy, vec3(0.47,0.65,0.3), 0.3));
    sdMat(2, sdBox(1.80*vx-2.8*vy+5.0*vz, normalize(vec3(0.4,0,-1)), vy, vec3(0.47,0.65,0.3), 0.3));
    sdMat(2, sdBox(2.00*vx-2.8*vy+4.1*vz, normalize(vec3(0,  0,-1)), vy, vec3(0.47,0.65,0.3), 0.3));
    
    sdf.pos = sp;
    
    float r = 2.0;
    vec3 pp = vec3(0,r-2.45,12.0);
    sdCol(red,   sdSphere(rotAxisAngle(pp, vy, 9.0*iTime), r));
    sdCol(green, sdSphere(rotAxisAngle(pp, vy, 9.0*iTime+90.0), r));
    sdCol(blue,  sdSphere(rotAxisAngle(pp, vy, 9.0*iTime+180.0), r));
    sdCol(white, sdSphere(rotAxisAngle(pp, vy, 9.0*iTime+270.0), r));
    
    if (gl.pass != PASS_SHADOW) sdCol(gl.light[0].color,sdSphere(gl.light[0].pos, 1.0)); 
    if (gl.pass != PASS_SHADOW) sdCol(gl.light[1].color,sdSphere(gl.light[1].pos, 1.0)); 
    if (gl.pass != PASS_SHADOW) sdCol(gl.light[2].color,sdSphere(gl.light[2].pos, 1.0)); 
    
    return sdf.dist;
}

NORMAL   
MARCH    

float shadow(vec3 ro, vec3 n, int lid)                   
{     
    vec3 lp = gl.light[lid].pos;
    float soft = gl.light[lid].shadow.soft;
    gl.pass = PASS_SHADOW;                               
                                                         
    if (!opt.shadow) return 1.0;                         
                                                         
    ro += n*gl.minDist*2.0;                              
    vec3 rd = lp-ro;                                     
    float far = max(length(rd), gl.minDist);             
    rd = normalize(rd);                                  
                                                         
    float shade = 1.0;                                   
    float sd = 0.0;                                      
    for (float t=float(gl.zero); t<far;)                 
    {                                                    
        float d = map(ro+rd*t);                          
        if (d < gl.minDist) { shade = 0.0; break; }      
                                                         
        if (soft > 0.01)                       
        {                                                
            float newShade = d/(t*soft*0.1);   
            if (newShade < shade)                        
            {                                            
                sd = t;                                  
                shade = newShade;                        
            }                                            
            // t += min(d, far/10.0);                            
            t += d;                            
        }                                                
        else                                             
        {                                                
            t += d;                                      
        }                                                
    }      
    
    float power = gl.light[lid].shadow.power;
    shade = max(1.0-pow(1.0-sd/gl.maxDist, power*soft), shade); 
    float dark = gl.light[lid].shadow.dark;
    return dark + shade * (1.0-dark);                      
}

OCCLUSION

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
            mat = material[gl.hit.mat-1];                      
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
        vec3 sum;
        for (int i = gl.zero; i < 3; i++)
        {
            float dl = dot(n,normalize(gl.light[i].pos-p));  
            sum += gl.light[i].color * dl * shadow(p, n, i);
        }
        sum /= 3.0;
        col *= sum*occlusion(p, n);           
        //col += pow(mat.glossy, 3.0)*vec3(pow(smoothstep(0.0+mat.glossy*0.9, 1.0, dnl), 1.0+40.0*mat.glossy)); 
    } 
    return col; 
}

void setup()
{
    cam.fov    = PI;
    fog.color  = vec3(0.01);
    fog.near   = 0.9;
    gl.ambient = 0.01;
    
    gl.maxSteps = 128;
    gl.minDist  = 0.02;
    gl.maxDist  = 100.0;
    
    vec3 lp = vec3(iRange(0.0,15.0),12,0);
    float soft = 1.0;
    float dark = 0.1;
    gl.light[0].color = vec3(1,0,0);
    gl.light[0].shadow.soft = soft;
    gl.light[0].shadow.dark = dark;
    gl.light[0].pos = rotAxisAngle(lp, vy, 120.0+iTime*30.0);
    
    gl.light[1].color = vec3(0,1,0);
    gl.light[1].shadow.soft = soft;
    gl.light[1].shadow.dark = dark;
    gl.light[1].pos = rotAxisAngle(lp, vy, -120.0+iTime*30.0);
    
    gl.light[2].color = vec3(0,0,1);
    gl.light[2].shadow.soft = soft;
    gl.light[2].shadow.dark = dark;
    gl.light[2].pos = rotAxisAngle(lp, vy, iTime*30.0);
}

SETUP
