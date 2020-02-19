###
 0000000  000   000   0000000   0000000    00000000  00000000   
000       000   000  000   000  000   000  000       000   000  
0000000   000000000  000000000  000   000  0000000   0000000    
     000  000   000  000   000  000   000  000       000   000  
0000000   000   000  000   000  0000000    00000000  000   000  
###

{ Effect, Engine, Mesh, MeshBuilder, RawTexture, RenderTargetTexture, ShaderMaterial, Texture, Vector2, Vector3, Vector4 } = require 'babylonjs'
{ performance } = require 'perf_hooks'
{ klog, slash } = require 'kxk'
        
class Shader
    
    @: (@world) ->

        @scene = @world.scene
        @bufferSize = width:256, height:256
        @frameRates = []

        @buffer = true
            
        @textures = 
            keys:   RawTexture.CreateRTexture @world.keys, 256, 3, @scene, false
            font:   new Texture("#{__dirname}/../img/font.png", @scene)
        
        if @buffer
            arr = new Float32Array 4*@bufferSize.width*@bufferSize.height
            @textures.buffer = new RawTexture arr, @bufferSize.width, @bufferSize.height, Engine.TEXTUREFORMAT_RGBA, @scene, false, false, Texture.BILINEAR_SAMPLINGMODE, Engine.TEXTURETYPE_FLOAT
            
        @iFrame = 0
        @vertexShader =  """
            precision highp float; attribute vec3 position; attribute vec2 uv; uniform mat4 worldViewProjection;
            void main(void) { gl_Position = worldViewProjection * vec4(position, 1.0); }
            """
        
        fragSource = slash.readText "#{__dirname}/../shader/snowmobile.frag"
        # fragSource    = slash.readText "#{__dirname}/../shader/voronoy.frag"
        if @buffer then bufferSource = slash.readText "#{__dirname}/../shader/snow_buffer.frag"
        @commonSource = slash.readText "#{__dirname}/../shader/snow_common.frag"
        # @commonSource = slash.readText "#{__dirname}/../shader/voronoy_common.frag"
        # @commonSource = ""
        
        Effect.ShadersStore.mainVertexShader   = @vertexShader
        Effect.ShadersStore.mainFragmentShader = @shaderCode fragSource 
        
        if @buffer 
            Effect.ShadersStore.bufferVertexShader = @vertexShader
            Effect.ShadersStore.bufferFragmentShader = @shaderCode bufferSource 
                    
        @shaderStart = performance.now()
        
        # 00     00   0000000   000000000  00000000  00000000   000   0000000   000      
        # 000   000  000   000     000     000       000   000  000  000   000  000      
        # 000000000  000000000     000     0000000   0000000    000  000000000  000      
        # 000 0 000  000   000     000     000       000   000  000  000   000  000      
        # 000   000  000   000     000     00000000  000   000  000  000   000  0000000  
        
        @shaderMaterial = @material 'main'
        @shaderMaterial.onCompiled = => 
            @iFrame = 0
            @compileTime = parseInt performance.now()-@shaderStart
            klog "shader compileTime #{@compileTime/1000}s" 

        if @buffer
            @bufferMaterial = @material 'buffer'
            @bufferMaterial.onCompiled = => 
                @iFrame = 0
                compileTime = parseInt performance.now()-@shaderStart
                klog "buffer compileTime #{compileTime/1000}s" 

            @plane2 = MeshBuilder.CreatePlane "plane2", { width: 10, height: 10 }, @scene
            @plane2.material = @bufferMaterial
            @plane2.billboardMode = Mesh.BILLBOARDMODE_ALL

        @plane = MeshBuilder.CreatePlane "plane" { width: 10, height: 10 } @scene
        @plane.material = @shaderMaterial
        @plane.billboardMode = Mesh.BILLBOARDMODE_ALL
        
        # 00000000           000000000   0000000   00000000    0000000   00000000  000000000  
        # 000   000             000     000   000  000   000  000        000          000     
        # 0000000    000000     000     000000000  0000000    000  0000  0000000      000     
        # 000   000             000     000   000  000   000  000   000  000          000     
        # 000   000             000     000   000  000   000   0000000   00000000     000     
        
        if @buffer
            
            @renderTarget = new RenderTargetTexture "buf", @bufferSize, @scene, false, false, Texture.BILINEAR_SAMPLINGMODE, Engine.TEXTURETYPE_FLOAT
            @renderTarget.renderList.push @plane2
            @scene.customRenderTargets.push @renderTarget
                                                         
            @renderTarget.onBeforeRender = () => 
                            
                @plane2.position.copyFrom @world.camera.position.add @world.camera.getDir().scale 2
                @materialData @bufferMaterial
        
        @scene.onBeforeRenderObservable.add => 
            
            @textures.keys.update @world.keys
            
            @iResolution = new Vector3 @world.canvas.width, @world.canvas.height, 1
            
            @iDelta = new Vector2(@world.camera.mouse.delta.x, @world.camera.mouse.delta.y) 
            
            if @world.camera.mouse.buttons
                @iMouse = new Vector4(
                    @world.camera.mouse.pos.x * (window.devicePixelRatio ? 0)
                    @iResolution.y - (@world.camera.mouse.pos.y * (window.devicePixelRatio ? @iResolution.y))
                    (@world.camera.mouse.buttons and 1 or -1) * @world.camera.mouse.down.x * (window.devicePixelRatio ? 0)
                    (@world.camera.mouse.buttons and 1 or -1) * (@iResolution.y - (@world.camera.mouse.down.y * (window.devicePixelRatio ? @iResolution.y))))
            else
                @iMouse = new Vector4(
                    @world.camera.mouse.up.x * (window.devicePixelRatio ? 0)
                    @iResolution.y - (@world.camera.mouse.up.y * (window.devicePixelRatio ? @iResolution.y))
                    (@world.camera.mouse.buttons and 1 or -1) * @world.camera.mouse.down.x * (window.devicePixelRatio ? 0)
                    (@world.camera.mouse.buttons and 1 or -1) * (@iResolution.y - (@world.camera.mouse.down.y * (window.devicePixelRatio ? @iResolution.y))))
                    
            @iCenter = new Vector3 -@world.camera.center.x, @world.camera.center.y, @world.camera.center.z
            @iCamera = new Vector3 -@world.camera.position.x, @world.camera.position.y, @world.camera.position.z
               
            @iTime      = performance.now()/1000
            @iTimeDelta = @world.engine.getDeltaTime()/1000
            
            @frameRates.push @world.engine.getFps()
            if @frameRates.length > 30 then @frameRates.shift()
            @fps = 0
            for r in @frameRates then @fps += r
            @fps /= @frameRates.length
            
        #  0000000   00000000  000000000  00000000  00000000   
        # 000   000  000          000     000       000   000  
        # 000000000  000000       000     0000000   0000000    
        # 000   000  000          000     000       000   000  
        # 000   000  000          000     00000000  000   000  
        
        @scene.onAfterRenderTargetsRenderObservable.add => 
            
            if @buffer then @textures.buffer.update @renderTarget.readPixels()
            
        @scene.onAfterRenderObservable.add =>
            
            @iFrame++
            for i in [256...512] 
                @world.keys[i] = 0
           
    # 00000000   00000000  000   000  0000000    00000000  00000000   
    # 000   000  000       0000  000  000   000  000       000   000  
    # 0000000    0000000   000 0 000  000   000  0000000   0000000    
    # 000   000  000       000  0000  000   000  000       000   000  
    # 000   000  00000000  000   000  0000000    00000000  000   000  
    
    render: ->

        @plane.position.copyFrom @world.camera.position.add @world.camera.getDir().scale 1.5
        
        @materialData @shaderMaterial
                
    # 0000000     0000000   000000000   0000000   
    # 000   000  000   000     000     000   000  
    # 000   000  000000000     000     000000000  
    # 000   000  000   000     000     000   000  
    # 0000000    000   000     000     000   000  
    
    materialData: (m) => 
        
        m.setTexture 'iChannel0'   @textures.keys 
        m.setTexture 'iChannel1'   @textures.buffer if @buffer
        m.setTexture 'iChannel2'   @textures.font
        m.setInt     'iFrame'      @iFrame
        m.setFloat   'iCompile'    @compileTime/1000
        m.setFloat   'iTime'       @iTime
        m.setFloat   'iTimeDelta'  @iTimeDelta
        m.setVector2 'iDelta'      @iDelta
        m.setVector4 'iMouse'      @iMouse
        m.setVector3 'iResolution' @iResolution
        m.setVector3 'iCenter'     @iCenter
        m.setVector3 'iCamera'     @iCamera
        m.setFloat   'iDist'       @world.camera.dist
        m.setFloat   'iMinDist'    @world.camera.minDist
        m.setFloat   'iMaxDist'    @world.camera.maxDist
        m.setFloat   'iRotate'     @world.camera.rotate
        m.setFloat   'iDegree'     @world.camera.degree
        m.setFloat   'iFrameRate'  Math.round @fps
        m.setFloat   'iMs'         @world.engine.getDeltaTime()
                
    #  0000000  000   000   0000000   0000000    00000000  00000000   
    # 000       000   000  000   000  000   000  000       000   000  
    # 0000000   000000000  000000000  000   000  0000000   0000000    
    #      000  000   000  000   000  000   000  000       000   000  
    # 0000000   000   000  000   000  0000000    00000000  000   000  
    
    material: (key) ->
        
        new ShaderMaterial "#{key}Shader", @scene,  
                vertex:   key
                fragment: key
            ,
                attributes: ['position' 'normal' 'uv']
                uniforms:   [
                    'worldViewProjection'
                    'iCamera' 'iCenter' 'iDist' 'iMaxDist' 'iMinDist'
                    'iFrameRate' 'iMs' 'iFrame' 
                    'iDelta' 'iTime' 'iTimeDelta' 
                    'iMouse' 'iResolution' 
                    'iRotate' 'iDegree' 
                    'iCompile'
                ]
        
    shaderCode: (fragSource) ->
        """
            precision highp float;
            uniform float     iTime;
            uniform float     iTimeDelta;
            uniform float     iFrameRate;
            uniform float     iMs;
            uniform float     iCompile;
            uniform float     iDist;
            uniform float     iMinDist;
            uniform float     iMaxDist;
            uniform float     iRotate;
            uniform float     iDegree;
            uniform vec2      iDelta;
            uniform vec4      iMouse;
            uniform vec3      iResolution;
            uniform vec3      iCenter;
            uniform vec3      iCamera;
            uniform int       iFrame;
            uniform sampler2D iChannel0;
            uniform sampler2D iChannel1;
            uniform sampler2D iChannel2;
            
            #{@commonSource}
            #{fragSource}
                                    
            void main(void) 
            {
                mainImage(gl_FragColor, gl_FragCoord.xy);
            }
            """
                    
module.exports = Shader
