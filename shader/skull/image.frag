
HEADER

Mat[4] material = Mat[4]( 
    //  hue   sat  lum    shiny  glossy
    Mat(0.5, 0.0,  1.0,  0.01,  0.1 ), 
    Mat(HUE_R, 1.0,  0.5,  0.02,  1.0 ), 
    Mat(HUE_B, 1.0,  0.6,  0.02,  1.0 ), 
    Mat(HUE_Y, 1.0,  0.5,  0.02,  1.0 )
);

float map(vec3 p)
{
    sdStart(p);
    
    gl.shadow.soft = 1.0;
    sdFloor(vec3(0.02), -4.0);
    sdAxes(0.1);
    
    sdf.pos.x = abs(sdf.pos.x);
    float d = sdEllipsoid(vy, vec3(5.5,5.5,5.0)); // frontal
    d = opUnion(d, sdSphere(2.0*vy-2.0*vz, 6.0), 1.0); // parietal
    d = opDiff (d, sdPlane(-1.0*vy, vy), 1.5); // cranial cutoff
    d = opUnion(d, sdCone(4.1*vz -2.5*vy, 2.5, 1.2, 3.5), 0.5); // jaw
    d = opDiff (d, sdCone(4.1*vz -2.5*vy, 1.6, 0.6, 3.5), 0.5); // jaw hole
    d = opDiff (d, sdCone(0.0*vx + vz*5.4 -0.1*vy, 1.0, 0.5, 1.5), 0.3); // nose hole
    d = opDiff (d, sdPlane(-2.5*vy, vy), 0.5); // jaw cutoff
    d = opDiff (d, sdSphere(2.7*vx+3.0*vy+3.6*vz, 2.0), 0.5); // eye holes
    
    d = opDiff(d, sdBox(7.2*vx+3.5*vy-1.2*vz, normalize(vec3(1,-0.2,0.4)), vy, vec3(2.0,3.0,3.0), 1.0), 1.0);
    
    float hd = sdCapsule(-2.5*vy-1.5*vz, -2.5*vy-0.2*vz, 3.6);
    hd = opUnion(hd, sdCapsule(vy-2.0*vz, vy-0.5*vz, 3.6));
    
    d = opDiff(d, hd, 1.0);
    
    sdMat(1, d);
    
    // d = sdCapsule(-2.5*vy-2.0*vz, -2.5*vy-0.5*vz, 3.6);
    // sdMat(2, d);
    
    return sdf.dist;
}

void setup()
{
    gl.light1 = vec3(-5,10,5);
}

SETUP