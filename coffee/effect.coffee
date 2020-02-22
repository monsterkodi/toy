# 00000000  00000000  00000000  00000000   0000000  000000000  
# 000       000       000       000       000          000     
# 0000000   000000    000000    0000000   000          000     
# 000       000       000       000       000          000     
# 00000000  000       000       00000000   0000000     000     

{ klog } = require 'kxk'
Pass     = require './pass'
Renderer = require './renderer'

class Effect 
    
    @: (@mGLContext, @mXres, @mYres) ->
        
        @mCreated           = false
        @mRenderer          = null
        @mPasses            = []
        @mFrame             = 0
        @mMaxBuffers        = 4
        @mMaxCubeBuffers    = 1
        @mMaxPasses         = @mMaxBuffers + 3
        @mBuffers           = []
        @mCubeBuffers       = []
        @mRenderer          = new Renderer @mGLContext
        
        vs = 'layout(location = 0) in vec2 pos; void main() { gl_Position = vec4(pos.xy,0.0,1.0); }'
        fr = 'uniform vec4 v; uniform sampler2D t; out vec4 outColor; void main() { outColor = textureLod(t, gl_FragCoord.xy / v.zw, 0.0); }'
        @mProgramCopy = @mRenderer.createShader vs, fr
        if @mProgramCopy.mResult == false
            error 'Failed to compile shader to copy buffers:' res.mInfo
            return
        
        vs = 'layout(location = 0) in vec2 pos; void main() { gl_Position = vec4(pos.xy,0.0,1.0); }'
        fr = 'uniform vec4 v; uniform sampler2D t; out vec4 outColor; void main() { vec2 uv = gl_FragCoord.xy / v.zw; outColor = texture(t, vec2(uv.x,1.0-uv.y)); }'
        res = @mRenderer.createShader vs, fr
        if res.mResult == false
            error 'Failed to compile shader to downscale buffers:' res
            return

        for i in [0...@mMaxBuffers]
            @mBuffers[i] =
                mTexture: [ null null ]
                mTarget:  [ null null ]
                mResolution: [ 0 0 ]
                mLastRenderDone: 0
        for i in [0...@mMaxCubeBuffers]
            @mCubeBuffers[i] =
                mTexture: [ null null ]
                mTarget:  [ null null ]
                mResolution: [ 0 0 ]
                mLastRenderDone: 0
                mThumbnailRenderTarget: null

        keyboardData = new Uint8Array 256*3
        for j in [0...256*3]
            keyboardData[j] = 0
            
        keyboardTexture = @mRenderer.createTexture(Renderer.TEXTYPE.T2D, 256, 3, Renderer.TEXFMT.C1I8, Renderer.FILTER.NONE, Renderer.TEXWRP.CLAMP, null)
        keyboardImage = new Image
        @mKeyboard =
            mData:    keyboardData
            mTexture: keyboardTexture
            mIcon:    keyboardImage
        @mCreated = true

    #  0000000    0000000   0000000  00000000  000000000  000  0000000    
    # 000   000  000       000       000          000     000  000   000  
    # 000000000  0000000   0000000   0000000      000     000  000   000  
    # 000   000       000       000  000          000     000  000   000  
    # 000   000  0000000   0000000   00000000     000     000  0000000    
    
    bufferID_to_assetID: (id) ->
        return switch id
            when 0 then 'bufferA' #'4dXGR8'
            when 1 then 'bufferB' #'XsXGR8'
            when 2 then 'bufferC' #'4sXGR8'
            when 3 then 'bufferD' #'XdfGR8'
            else
                klog "bufferID_to_assetID #{id} -> none"
                'none'
    
    assetID_to_bufferID: (id) ->
        return switch id
            when 'bufferA' then 0
            when 'bufferB' then 1
            when 'bufferC' then 2
            when 'bufferD' then 3
            else 
                klog "assetID_to_bufferID #{id} -> -1"
                -1
    
    assetID_to_cubemapBuferID: (id) -> id != '4dX3Rr' and -1 or 0
    cubamepBufferID_to_assetID: (id) -> id == 0 and '4dX3Rr' or 'none'
        
    # 00000000   00000000   0000000  000  0000000  00000000  
    # 000   000  000       000       000     000   000       
    # 0000000    0000000   0000000   000    000    0000000   
    # 000   000  000            000  000   000     000       
    # 000   000  00000000  0000000   000  0000000  00000000  
    
    resizeCubemapBuffer: (i, xres, yres) ->
        
        oldXres = @mCubeBuffers[i].mResolution[0]
        oldYres = @mCubeBuffers[i].mResolution[1]
        
        if @mCubeBuffers[i].mTexture[0] == null or oldXres != xres or oldYres != yres
            
            texture1 = @mRenderer.createTexture(Renderer.TEXTYPE.CUBEMAP, xres, yres, Renderer.TEXFMT.C4F16, Renderer.FILTER.LINEAR, Renderer.TEXWRP.CLAMP, null)
            target1  = @mRenderer.createRenderTargetCubeMap texture1
            texture2 = @mRenderer.createTexture(Renderer.TEXTYPE.CUBEMAP, xres, yres, Renderer.TEXFMT.C4F16, Renderer.FILTER.LINEAR, Renderer.TEXWRP.CLAMP, null)
            target2  = @mRenderer.createRenderTargetCubeMap texture2

            @mCubeBuffers[i].mTexture = [ texture1, texture2 ]
            @mCubeBuffers[i].mTarget  = [ target1, target2 ]
            @mCubeBuffers[i].mLastRenderDone = 0
            @mCubeBuffers[i].mResolution[0] = xres
            @mCubeBuffers[i].mResolution[1] = yres

    # 0000000    000   000  00000000  00000000  00000000  00000000   
    # 000   000  000   000  000       000       000       000   000  
    # 0000000    000   000  000000    000000    0000000   0000000    
    # 000   000  000   000  000       000       000       000   000  
    # 0000000     0000000   000       000       00000000  000   000  
    
    resizeBuffer: (i, xres, yres, skipIfNotExists) ->
        
        if skipIfNotExists and not @mBuffers[i].mTexture[0]
            return
            
        # klog "resizeBuffer #{i}" 
        
        oldXres = @mBuffers[i].mResolution[0]
        oldYres = @mBuffers[i].mResolution[1]
        
        if oldXres != xres or oldYres != yres
            
            # klog "resizeBuffer #{i}" oldXres, oldYres, @mBuffers[i].mResolution
            
            needCopy = @mBuffers[i].mTexture[0] != null
            texture1 = @mRenderer.createTexture(Renderer.TEXTYPE.T2D, xres, yres, Renderer.TEXFMT.C4F32, (if needCopy then @mBuffers[i].mTexture[0].mFilter else Renderer.FILTER.NONE), (if needCopy then @mBuffers[i].mTexture[0].mWrap else Renderer.TEXWRP.CLAMP), null)
            texture2 = @mRenderer.createTexture(Renderer.TEXTYPE.T2D, xres, yres, Renderer.TEXFMT.C4F32, (if needCopy then @mBuffers[i].mTexture[1].mFilter else Renderer.FILTER.NONE), (if needCopy then @mBuffers[i].mTexture[1].mWrap else Renderer.TEXWRP.CLAMP), null)
            target1  = @mRenderer.createRenderTarget texture1
            target2  = @mRenderer.createRenderTarget texture2
            if needCopy
                v = [ 0, 0, Math.min(xres, oldXres), Math.min(yres, oldYres) ]
                @mRenderer.setBlend false
                @mRenderer.setViewport v
                @mRenderer.attachShader @mProgramCopy
                l1 = @mRenderer.getAttribLocation @mProgramCopy, 'pos'
                vOld = [ 0, 0, oldXres, oldYres ]
                @mRenderer.setShaderConstant4FV 'v' vOld

                @mRenderer.setRenderTarget target1
                @mRenderer.attachTextures 1, @mBuffers[i].mTexture[0], null, null, null
                @mRenderer.drawUnitQuad_XY l1

                @mRenderer.setRenderTarget target2
                @mRenderer.attachTextures 1, @mBuffers[i].mTexture[1], null, null, null
                @mRenderer.drawUnitQuad_XY l1

                @mRenderer.destroyTexture @mBuffers[i].mTexture[0]
                @mRenderer.destroyRenderTarget @mBuffers[i].mTarget[0]
                @mRenderer.destroyTexture @mBuffers[i].mTexture[1]
                @mRenderer.destroyRenderTarget @mBuffers[i].mTarget[1]

            @mBuffers[i].mTexture = [ texture1, texture2 ]
            @mBuffers[i].mTarget  = [ target1,  target2  ]
            @mBuffers[i].mLastRenderDone = 0
            @mBuffers[i].mResolution[0] = xres
            @mBuffers[i].mResolution[1] = yres

    resizeBuffers: (xres, yres) ->
        
        for i in [0...@mMaxBuffers]
            @resizeBuffer i, xres, yres, true
        @

    # 000000000  00000000  000   000  000000000  000   000  00000000   00000000  
    #    000     000        000 000      000     000   000  000   000  000       
    #    000     0000000     00000       000     000   000  0000000    0000000   
    #    000     000        000 000      000     000   000  000   000  000       
    #    000     00000000  000   000     000      0000000   000   000  00000000  
    
    getTexture: (passid, slot) -> @mPasses[passid].getTexture slot
    newTexture: (passid, slot, url) -> @mPasses[passid].newTexture slot, url, @mBuffers, @mCubeBuffers, @mKeyboard
            
    # 000   000  00000000  000   000  
    # 000  000   000        000 000   
    # 0000000    0000000     00000    
    # 000  000   000          000     
    # 000   000  00000000     000     
    
    setKeyDown: (k) ->
        return if @mKeyboard.mData[k + 0 * 256] == 255
        # klog "setKeyDown #{k}"
        @mKeyboard.mData[k + 0 * 256] = 255
        @mKeyboard.mData[k + 1 * 256] = 255
        @mKeyboard.mData[k + 2 * 256] = 255 - (@mKeyboard.mData[k + 2 * 256])
        @mRenderer.updateTexture @mKeyboard.mTexture, 0, 0, 256, 3, @mKeyboard.mData
    
    setKeyUp: (k) ->
        # klog "setKeyUp #{k}"
        @mKeyboard.mData[k + 0 * 256] = 0
        @mKeyboard.mData[k + 1 * 256] = 0
        @mRenderer.updateTexture @mKeyboard.mTexture, 0, 0, 256, 3, @mKeyboard.mData
    
    #  0000000  000  0000000  00000000  
    # 000       000     000   000       
    # 0000000   000    000    0000000   
    #      000  000   000     000       
    # 0000000   000  0000000  00000000  
    
    setSize: (xres, yres) ->
        if xres != @mXres or yres != @mYres
            oldXres = @mXres
            oldYres = @mYres
            @mXres = xres
            @mYres = yres
            @resizeBuffers xres, yres
            return true
        false
        
    # 000000000  000  00     00  00000000  
    #    000     000  000   000  000       
    #    000     000  000000000  0000000   
    #    000     000  000 0 000  000       
    #    000     000  000   000  00000000  
    
    resetTime: ->
        @mFrame = 0
        for i in [0...@mPasses.length]
            @mPasses[i].mFrame = 0
        @
    
    # 00000000    0000000   000  000   000  000000000  
    # 000   000  000   000  000  0000  000     000     
    # 00000000   000000000  000  000 0 000     000     
    # 000        000   000  000  000  0000     000     
    # 000        000   000  000  000   000     000     
    
    paint: (time, dtime, fps, isPaused) ->
        
        da   = new Date
        xres = @mXres / 1
        yres = @mYres / 1
        
        if @mFrame == 0
            
            for i in [0...@mMaxBuffers]
                if @mBuffers[i].mTexture[0] != null
                    @mRenderer.setRenderTarget @mBuffers[i].mTarget[0]
                    @mRenderer.clear Renderer.CLEAR.Color, [ 0 0 0 0 ], 1 0
                    @mRenderer.setRenderTarget @mBuffers[i].mTarget[1]
                    @mRenderer.clear Renderer.CLEAR.Color, [ 0 0 0 0 ], 1 0
                    
            for i in [0...@mMaxCubeBuffers]
                if @mCubeBuffers[i].mTexture[0] != null
                    for face in [0..5]
                        @mRenderer.setRenderTargetCubeMap @mCubeBuffers[i].mTarget[0], face
                        @mRenderer.clear Renderer.CLEAR.Color, [ 0 0 0 0 ], 1.0, 0
                        @mRenderer.setRenderTargetCubeMap @mCubeBuffers[i].mTarget[1], face
                        @mRenderer.clear Renderer.CLEAR.Color, [ 0 0 0 0 ], 1.0, 0

        num = @mPasses.length
        
        for i in [0...num] # render buffers second
            if @mPasses[i].mType != 'buffer' then continue
            if @mPasses[i].mProgram == null  then continue
            bufferID = @assetID_to_bufferID @mPasses[i].mOutput

            needMipMaps = false # check if any downstream pass needs mipmaps
            for j in [0...num]
                for k in [0...@mPasses[j].mInputs.length]
                    inp = @mPasses[j].mInputs[k]
                    if inp != null and inp.mInfo.mType == 'buffer' and inp.id == bufferID and inp.mInfo.mSampler?.filter == 'mipmap'
                        needMipMaps = true
                        break
            @mPasses[i].paint da, time, dtime, fps, xres, yres, isPaused, bufferID, needMipMaps, @mBuffers, @mCubeBuffers, @mKeyboard, @
        
        for i in [0...num] # render cubemap buffers second
            if @mPasses[i].mType != 'cubemap' then continue
            if @mPasses[i].mProgram == null   then continue
            bufferID = 0

            needMipMaps = false # check if any downstream pass needs mipmaps
            for j in [0...num]
                for k in [0...@mPasses[j].mInputs.length]
                    inp = @mPasses[j].mInputs[k]
                    if inp != null and inp.mInfo.mType == 'cubemap'
                        if @assetID_to_cubemapBuferID(inp.mInfo.mID) == 0 and inp.mInfo.mSampler.filter == 'mipmap'
                            needMipMaps = true
                            break
            @mPasses[i].paint da, time, dtime, fps, xres, yres, isPaused, bufferID, needMipMaps, @mBuffers, @mCubeBuffers, @mKeyboard, @

        for i in [0...num] # render image last
            if @mPasses[i].mType != 'image' then continue
            if @mPasses[i].mProgram == null then continue
            @mPasses[i].paint da, time, dtime, fps, xres, yres, isPaused, null, false, @mBuffers, @mCubeBuffers, @mKeyboard, @

        k = 0
        while k < 256
            @mKeyboard.mData[k + 1 * 256] = 0
            k++
        @mRenderer.updateTexture @mKeyboard.mTexture, 0, 0, 256, 3, @mKeyboard.mData
        @mFrame++
        return
    
    # 000   000  00000000  000   000  
    # 0000  000  000       000 0 000  
    # 000 0 000  0000000   000000000  
    # 000  0000  000       000   000  
    # 000   000  00000000  00     00  
    
    newShader: (shaderCode, passid) ->
        commonSourceCodes = []
        i = 0
        while i < @mPasses.length
            if @mPasses[i].mType == 'common'
                commonSourceCodes.push @mPasses[i].mSource
            i++
        @mPasses[passid].newShader shaderCode, commonSourceCodes
    
    # 00000000    0000000    0000000   0000000  00000000   0000000  
    # 000   000  000   000  000       000       000       000       
    # 00000000   000000000  0000000   0000000   0000000   0000000   
    # 000        000   000       000       000  000            000  
    # 000        000   000  0000000   0000000   00000000  0000000   
    
    getNumPasses: ->
        @mPasses.length
    
    getNumOfType: (passtype) ->
        id = 0
        j = 0
        while j < @mPasses.length
            if @mPasses[j].mType == passtype
                id++
            j++
        id
    
    getPassType: (id) ->
        @mPasses[id].mType
    
    getPassName: (id) ->
        @mPasses[id].mName
    
    #       000   0000000   0000000   000   000  
    #       000  000       000   000  0000  000  
    #       000  0000000   000   000  000 0 000  
    # 000   000       000  000   000  000  0000  
    #  0000000   0000000    0000000   000   000  
    
    newScriptJSON: (passes) ->
        if passes.length < 1 or passes.length > @mMaxPasses
            return
                mFailed: true
                mError: 'Incorrect number of passes, wrong shader format'
                mShader: null
                
        res = []
        res.mFailed = false
        
        for j in [0...passes.length]
            
            rpass = passes[j]
            
            rpass.inputs ?= []
            
            @mPasses[j] = new Pass @mRenderer, j, @
            
            for i in [0..3]
                @mPasses[j].newTexture i
                
            for i in [0...rpass.inputs.length]
                @mPasses[j].newTexture rpass.inputs[i].channel,
                    mType:      rpass.inputs[i].type
                    mID:        rpass.inputs[i].id
                    mSrc:       rpass.inputs[i].src
                    mSampler:   rpass.inputs[i].sampler
                , @mBuffers, @mCubeBuffers, @mKeyboard

            @mPasses[j].mOutput = rpass.output if rpass.output

            rpassName = switch rpass.type
                when 'common'  then 'Common'
                when 'image'   then 'Image'
                when 'buffer'  then 'Buffer ' + String.fromCharCode(65 + @assetID_to_bufferID(@mPasses[j].mOutput))
                when 'cubemap' then 'Cube'
            @mPasses[j].create rpass.type, rpassName
            
        for passType in ['common' 'buffer' 'image' 'cubemap']
            
            for j in [0...passes.length]
                rpass = passes[j]
                if rpass.type != passType  then continue
                shaderStr = rpass.code
                result = @newShader shaderStr, j
                if result != null
                    res.mFailed = true
                    res[j] =
                        mFailed: true
                        mError:  result
                        mShader: shaderStr
                else
                    res[j] =
                        mFailed: false
                        mError:  null
                        mShader: shaderStr
        res
        
    module.exports = Effect