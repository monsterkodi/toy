###
000000000   0000000   000   000  
   000     000   000   000 000   
   000     000   000    00000    
   000     000   000     000     
   000      0000000      000     
###

{ slash } = require 'kxk'

Renderer = require './renderer'
Effect   = require './effect'

class Toy

    @instance = null
    
    @: (@mCanvas) ->

        @mCreated    = false
        @mGLContext  = null
        @mEffect     = null
        @mTo         = null
        @mIsPaused   = false
        @mForceFrame = false
        @mPass       = []
        @mActiveDoc  = 0
    
        devicePixelRatio = window.devicePixelRatio or 1
    
        # @mCanvas.tabIndex = '0'
        @mCanvas.width  = @mCanvas.offsetWidth * devicePixelRatio
        @mCanvas.height = @mCanvas.offsetHeight * devicePixelRatio
    
        @mTo        = performance.now()
        @mTf        = 0
        @mRestarted = true
        @mIsRendering = false
    
        @mGLContext = Renderer.createGlContext @mCanvas
        
        if not @mGLContext
            log 'no gl context'
    
        @mErrors = new Array()
        
        @mEffect = new Effect @mGLContext, @mCanvas.width, @mCanvas.height
        if not @mEffect.mCreated
            log 'no effect'
            return
    
        @mCanvas.addEventListener 'webglcontextlost' (event) ->
            log 'webglcontextlost'
            event.preventDefault()
        
        # @loadNew()
        @load main:'gloworm' common:'gloworm/common'

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

        ltime = 0.0
        dtime = 0.0
        if @mIsPaused
            ltime = @mTf
            dtime = 1000.0 / 60.0
        else
            ltime = time - @mTo
            if @mRestarted
                dtime = 1000.0/60.0
            else
                dtime = ltime - @mTf 
            @mTf = ltime
        @mRestarted = false

        @mEffect.paint ltime/1000.0, dtime/1000.0, 60, @mIsPaused 

    # 00000000   00000000   0000000  000  0000000  00000000  
    # 000   000  000       000       000     000   000       
    # 0000000    0000000   0000000   000    000    0000000   
    # 000   000  000            000  000   000     000       
    # 000   000  00000000  0000000   000  0000000  00000000  
    
    resize: (xres, yres) =>

        if @mCanvas
            @mCanvas.width  = @mCanvas.offsetWidth
            @mCanvas.height = @mCanvas.offsetHeight
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
            outputs: [ {channel:0, id:'default' } ]
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
    
    load: (main:, common:, buffer:, keyboard:true, font:true) ->
        
        passes = []
        
        passes.push
            type:  'image'
            code:  slash.readText "#{__dirname}/../shader/#{main}.frag"
            inputs:  [ {channel:0 id:0 type:'keyboard'}, {channel:1 id:'bufferA' type:'buffer'}, 
                {channel:2 id:2 type:'texture' src:slash.fileUrl "../img/font.png"} ]
            outputs: [ {channel:0, id:main } ]
            
        if common
            passes.push
                type: 'common'
                code: slash.readText "#{__dirname}/../shader/#{common}.frag"
            
        if keyboard
            passes.push 
                type: 'image'
                outputs: [channel:0]
                url: mType: 'keyboard'
        if font
            passes.push 
                type:  'image'
                outputs: [channel:2]
                url:
                    type: 'texture'
                    src:  slash.fileUrl "../img/font.png"

        if buffer
            passes.push
                type:  'buffer'
                outputs: [channel:1]
                code:  slash.readText "../shader/#{buffer}.frag"
                
            
        @loadPasses passes
        
    module.exports = Toy
    