
HEADER

Mat[4] material = Mat[4]( 
    //  hue    sat   lum   shiny  glossy
    Mat(HUE_Y, 1.0,  0.8,  0.05,  0.0 ), 
    Mat(HUE_Y, 0.8,  0.9,  0.10,  0.0 ), 
    Mat(0.5,   0.0,  1.0,  0.05,  0.0 ), 
    Mat(0.5,   0.0,  1.0,  0.05,  0.0 )
);

float map(vec3 p)
{
    sdStart(p);
    
    sdFloor(hsl(HUE_B,0.2,0.01), -2.45);
    sdAxes(0.1);
    
    sdf.pos.x = abs(sdf.pos.x);

    sdf.pos *= alignMatrix(vx, normal(0.0,1.0,-0.245));
    
    float d, h;
    
    d = sdEllipsoid(vy, vec3(5.5,5.5,5.0));                         // frontal
    d = opUnion(d, sdSphere( 2.0*vy -2.0*vz, 6.0), 1.0);            // parietal
    d = opDiff (d, sdPlane (-vy, vy), 1.5);                         // cranial cutoff
    d = opUnion(d, sdCone  ( 4.1*vz -2.5*vy, 2.5, 1.2, 3.5), 0.5);  // jaw
    d = opDiff (d, sdCone  ( 4.1*vz -2.5*vy, 1.6, 0.6, 3.5), 0.5);  // jaw hole
    d = opDiff (d, sdCone  ( 5.4*vz -0.1*vy, 1.0, 0.5, 1.5), 0.3);  // nose
    d = opDiff (d, sdPlane (-2.5*vy, vy), 0.5);                     // jaw cutoff
    d = opDiff (d, sdSphere( 2.7*vx +3.0*vy +3.6*vz, 2.0), 0.5);    // eye holes
    
    d = opDiff(d, sdBox(7.2*vx+3.5*vy-1.2*vz, normalize(vec3(1,-0.2,0.4)), vy, vec3(2.0,3.0,3.0), 1.0), 1.0);
    
    h = sdCapsule(-2.5*vy-1.5*vz, -2.5*vy-0.2*vz, 3.6);
    h = opUnion(h, sdCapsule(vy-2.0*vz, vy-0.5*vz, 3.6));
    d  = opDiff(d, h, 1.0);
    
    sdMat(1, d);
    
    sdMat(2, sdBox(0.47*vx-2.8*vy+6.1*vz, normalize(vec3(1,0,-0.2)), vy, vec3(0.50,0.70,0.3), 0.3));
    sdMat(2, sdBox(1.29*vx-2.8*vy+5.7*vz, normalize(vec3(1,0,-0.8)), vy, vec3(0.47,0.65,0.3), 0.3));
    sdMat(2, sdBox(1.80*vx-2.8*vy+5.0*vz, normalize(vec3(0.4,0,-1)), vy, vec3(0.47,0.65,0.3), 0.3));
    sdMat(2, sdBox(2.00*vx-2.8*vy+4.1*vz, normalize(vec3(0,  0,-1)), vy, vec3(0.47,0.65,0.3), 0.3));
    
    return sdf.dist;
}

void setup()
{
    cam.fov = PI;
    fog.color = hsl(HUE_B,0.2,0.01);
    gl.ambient = 0.005;
    gl.shadow.soft = 0.0;
    gl.shadow.bright = 0.7;
    gl.light1 = vec3(-5,10,5)*2.0;
}

SETUP
