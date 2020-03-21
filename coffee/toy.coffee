###
000000000   0000000   000   000  
   000     000   000   000 000   
   000     000   000    00000    
   000     000   000     000     
   000      0000000      000     
###

{ empty, slash } = require 'kxk'

Renderer = require './renderer'
Effect   = require './effect'

class Toy

    @instance = null
    
    @: (@mCanvas) ->

        @mCreated    = false
        @mGLContext  = null
        @mEffect     = null
        @mStartTime         = null
        @mIsPaused   = false
        @mForceFrame = false
        @mPass       = []
        @fpsCache    = []
        @mActiveDoc  = 0
    
        devicePixelRatio = window.devicePixelRatio or 1
    
        @mCanvas.width  = @mCanvas.offsetWidth * devicePixelRatio
        @mCanvas.height = @mCanvas.offsetHeight * devicePixelRatio
    
        @mStartTime        = performance.now()
        @mFrameTime        = 0
        @mIsRendering = false
    
        @mGLContext = Renderer.createGlContext @mCanvas
        
        if not @mGLContext
            error 'no gl context'
    
        @mErrors = new Array()
        
        @mEffect = new Effect @mGLContext, @mCanvas.width, @mCanvas.height
        if not @mEffect.mCreated
            error 'no effect'
            return
    
        @mCanvas.addEventListener 'webglcontextlost' (event) ->
            error 'webgl context lost'
            event.preventDefault()
        
        # @loadNew()
        # @load 'gloworm'
        # @load 'kalamari'
        # @load 'veyerus'
        # @load 'hexisle'
        # @load 'voronoy'
        # @load 'krap'
        # @load 'kerl'
        # @load 'army'
        # @load 'astro'
        # @load 'boids'
        # @load 'eyeboids'
        # @load 'buffertest'
        # @load 'snowmobile'
        # @load 'common'
        # @load 'skull'
        # @load 'knighty'
        @load 'konrad'

    # 00000000   00000000  000   000  0000000    00000000  00000000   
    # 000   000  000       0000  000  000   000  000       000   000  
    # 0000000    0000000   000 0 000  000   000  0000000   0000000    
    # 000   000  000       000  0000  000   000  000       000   000  
    # 000   000  00000000  000   000  0000000    00000000  000   000  
    
    startRendering: ->

        @mIsRendering = true
        @renderLoop()
    
    renderLoop: =>
        
        if not @mGLContext then return

        requestAnimationFrame @renderLoop

        if @mIsPaused and not @mForceFrame
            return
            
        @mForceFrame = false

        time = performance.now()

        relTime = 0.0
        deltaTime = 0.0
        if @mIsPaused
            relTime = @mFrameTime
            deltaTime = 1000.0 / 60.0
        else
            relTime = time - @mStartTime
            deltaTime = relTime - @mFrameTime 
            @mFrameTime = relTime

        @fpsCache.push 1000.0/deltaTime
        if @fpsCache.length > 60 then @fpsCache.shift()
        
        fps = 0
        @fpsCache.map (f) -> fps += f
        fps /= @fpsCache.length
        @mEffect.paint relTime/1000.0, deltaTime/1000.0, fps, @mIsPaused 

    # 00000000   00000000   0000000  000  0000000  00000000  
    # 000   000  000       000       000     000   000       
    # 0000000    0000000   0000000   000    000    0000000   
    # 000   000  000            000  000   000     000       
    # 000   000  00000000  0000000   000  0000000  00000000  
    
    resize: =>
        
        if @mCanvas
            dpr = window.devicePixelRatio
            @mCanvas.width  = @mCanvas.offsetWidth  * dpr
            @mCanvas.height = @mCanvas.offsetHeight * dpr
            @mEffect.setSize @mCanvas.width, @mCanvas.height
            @mForceFrame = true

    logErrors: (result) -> log result if result

    # 000000000  00000000  000   000  000000000  000   000  00000000   00000000  
    #    000     000        000 000      000     000   000  000   000  000       
    #    000     0000000     00000       000     000   000  0000000    0000000   
    #    000     000        000 000      000     000   000  000   000  000       
    #    000     00000000  000   000     000      0000000   000   000  00000000  
    
    setTexture: (slot, url) ->

        res = @mEffect.newTexture @mActiveDoc, slot, url
        if not res.mFailed
            @mPass[@mActiveDoc].mDirty = res.mNeedsShaderCompile

    getTexture: (slot) ->
        @mEffect.getTexture( @mActiveDoc, slot )

    setShaderFromEditor: (forceall) ->

        anyErrors = false

        num = @mEffect.getNumPasses()

        recompileAll = false
        for i in [0...num]
            if @mEffect.getPassType(i) == 'common' and (@mPass[i].mDirty or forceall)
                recompileAll = true
                break

        for j in [0...4]
            for i in [0...num]
                if j == 0 and @mEffect.getPassType(i) != 'common'   then continue
                if j == 1 and @mEffect.getPassType(i) != 'buffer'   then continue
                if j == 2 and @mEffect.getPassType(i) != 'cubemap'  then continue
                if j == 3 and @mEffect.getPassType(i) != 'image'    then continue

                if recompileAll or @mPass[i].mDirty or forceall
                    shaderCode = @mPass[i].mCode
                    result = @mEffect.newShader shaderCode, i
                    if result
                        anyErrors = true
                    @mPass[i].mError = result
                    @mPass[i].mDirty = false

        @logErrors @mPass[@mActiveDoc].mError

        if not anyErrors
            if not @mIsRendering
                gToy.startRendering()
            @mForceFrame = true

    # 000   000  00000000  000   000  
    # 0000  000  000       000 0 000  
    # 000 0 000  0000000   000000000  
    # 000  0000  000       000   000  
    # 000   000  00000000  00     00  
    
    loadNew: ->
        @loadPasses [{
            inputs:  []
            type:    'image'
            code: """
                void mainImage( out vec4 fragColor, in vec2 fragCoord )
                {
                    vec2 uv = fragCoord/iResolution.xy;
                    vec3 col = 0.1 + 0.1*cos(0.1*iTime+uv.xyx+vec3(0,2,4));
                    fragColor = vec4(col,1.0);
                }
                """
        }]
    
    loadPasses: (passes) ->
        
        res = @mEffect.newScriptJSON passes
        
        # klog 'passes' passes
        
        @mPass = []
        
        for i in [0...res.length]
            @mPass[i] = 
                mCode:   res[i].mShader
                mFailed: res[i].mFailed
                mError:  res[i].mError
                mDirty:  false
                
        @logErrors @mPass[0].mError
        @startRendering()
        
    # 000       0000000    0000000   0000000    
    # 000      000   000  000   000  000   000  
    # 000      000   000  000000000  000   000  
    # 000      000   000  000   000  000   000  
    # 0000000   0000000   000   000  0000000    
    
    load: (dir) ->
        shaderDir = slash.resolve "#{__dirname}/../shader/#{dir}"
        imageFile = "#{shaderDir}/image.frag"
        if not slash.fileExists imageFile
            error "missing #{imageFile}"
            return
        shader = image:imageFile
        for file in ['common' 'buffer']
            if slash.fileExists "#{shaderDir}/#{file}.frag"
                shader[file] = "#{shaderDir}/#{file}.frag"
                
        # klog 'loading shader dir' shader
        @loadShader shader
    
    loadShader: (image:, common:, buffer:, keyboard:true, font:true) ->
        
        passes = []
        
        imageCode = slash.readText image
        if empty imageCode
            return error "no image code in #{image}?"
        
        passes.push
            type:    'image'
            code:    imageCode
            inputs:  []
            
        if common
            passes.push
                type: 'common'
                code: slash.readText common
            
        if keyboard
            passes[0].inputs.push channel:0 id:0 type:'keyboard'
            passes.push 
                type: 'image'
                url: mType: 'keyboard'
                
        if buffer
            passes[0].inputs.push channel:1 id:'bufferA' type:'buffer'
            passes.push
                type:   'buffer'
                output: 'bufferA'
                inputs: [channel:1 id:'bufferA' type:'buffer']
                code:  slash.readText buffer
                
            if keyboard
                passes[-1].inputs.push channel:0 id:0 type:'keyboard'
                
        if font
            passes[0].inputs.push channel:2 id:2 type:'texture' src:slash.fileUrl "../img/font.png"
            passes.push 
                type:  'image'
                url:
                    type: 'texture'
                    src:  slash.fileUrl "../img/font.png"
                
        @loadPasses passes
        
    module.exports = Toy
    