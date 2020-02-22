
HEADER

Mat[4] material = Mat[4]( 
    //  hue   sat  lum    shiny  glossy
    Mat(HUE_G, 1.0,  0.4,  0.02,  1.0 ), 
    Mat(HUE_R, 1.0,  0.5,  0.02,  1.0 ), 
    Mat(HUE_B, 1.0,  0.6,  0.02,  1.0 ), 
    Mat(HUE_Y, 1.0,  0.5,  0.02,  1.0 )
);

float map(vec3 p)
{
    sdStart(p);
    
    sdFloor(vec3(0.02), -2.0);
    
    float rt = gl.time*30.0;
    sdUni(4, iRange(0.0, 2.0, 1.0), sdCube(v0, iRange(2.0, 3.5, 0.5), iRange(0.1, 3.5, 0.5)));
    sdDif(1, iRange(1.0, 0.3, 0.5), sdBox( vx*3.0, vx, rotAxisAngle(vy, vx,-rt),     vec3(1), iRange(1.0, 0.0, 0.5)));
    sdUni(2, iRange(1.0, 0.1, 0.5), sdBox( vy*3.0,     rotAxisAngle(vx, vy,-rt), vy, vec3(1), iRange(1.0, 0.1, 0.5)));
    sdEmb(3, iRange(0.2, 0.7, 0.5), sdBox( vz*3.0, vz, rotAxisAngle(vy, vz, rt),     vec3(1), iRange(1.0, 0.0, 0.5)));
    sdInt(1, iRange(0.8, 0.0, 0.5), sdBox(-vx*3.0, vx, rotAxisAngle(vy, vx, rt),     vec3(1), iRange(1.0, 0.0, 0.5)));
    sdExt(3, iRange(0.2, 0.5, 0.5), sdBox(-vz*3.0, vz, rotAxisAngle(vy, vz,-rt),     vec3(1), iRange(1.0, 0.0, 0.5)));
    
    sdAxes(0.1);
    
    return sdf.dist;
}

FOOTER