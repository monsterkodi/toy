###
00000000    0000000    0000000   0000000  
000   000  000   000  000       000       
00000000   000000000  0000000   0000000   
000        000   000       000       000  
000        000   000  0000000   0000000   
###

{ filter, klog } = require 'kxk'
Renderer = require './renderer'

class Pass
    
    @: (@mRenderer, @mID, @mEffect) ->
        
        @mInputs  = [ null null null null ]
        @mOutput  = null
        @mSource  = null
        @mType    = 'image'
        @mName    = 'none'
        @mCompile = 0
        @mFrame   = 0
                
    # 000   000  00000000   0000000   0000000    00000000  00000000   
    # 000   000  000       000   000  000   000  000       000   000  
    # 000000000  0000000   000000000  000   000  0000000   0000000    
    # 000   000  000       000   000  000   000  000       000   000  
    # 000   000  00000000  000   000  0000000    00000000  000   000  
    
    commonHeader: ->
        
        h = """
            #define HW_PERFORMANCE 1
            uniform vec3  iResolution;
            uniform float iTime;
            uniform float iChannelTime[4];
            uniform vec4  iMouse;
            uniform vec4  iDate;
            uniform float iSampleRate;
            uniform vec3  iChannelResolution[4];
            uniform int   iFrame;
            uniform float iTimeDelta;
            uniform float iFrameRate;
            """
        for i in [0...@mInputs.length]
            h += "uniform sampler#{ @mInputs[i]?.mInfo.mType == 'cubemap' and 'Cube' or '2D' } iChannel#{i};\n"
        h

    makeHeaderImage: ->
        
        @header  = @commonHeader()
        @header += """
            struct Channel
            {
                vec3  resolution;
                float time;
            };
            uniform Channel iChannel[4];
            
            void mainImage(out vec4 c, in vec2 f);
            """
                        
        @footer = """
            out vec4 outColor;
            void main( void )
            {
                vec4 color = vec4(0.0,0.0,0.0,1.0);
                mainImage(color, gl_FragCoord.xy);
                color.w = 1.0;
                outColor = color;
            }
            """
    
    makeHeaderBuffer: ->
        
        @header  = @commonHeader()
        @header += 'void mainImage(out vec4 c, in vec2 f);\n'
        
        @footer = """
            out vec4 outColor;
            void main( void )
            {
                vec4 color = vec4(0.0,0.0,0.0,1.0);
                mainImage( color, gl_FragCoord.xy );
                outColor = color;
            }
            """
    
    makeHeaderCubemap: ->
        
        @header  = @commonHeader()
        @header += 'void mainCubemap( out vec4 c, in vec2 f, in vec3 ro, in vec3 rd );\n'
        
        @footer  = """
            uniform vec4 unViewport;
            uniform vec3 unCorners[5];
            out vec4 outColor;
            void main(void)
            {
                vec4 color = vec4(0.0,0.0,0.0,1.0);
                vec3 ro = unCorners[4];
                vec2 uv = (gl_FragCoord.xy - unViewport.xy)/unViewport.zw;
                vec3 rd = normalize( mix( mix( unCorners[0], unCorners[1], uv.x ), mix( unCorners[3], unCorners[2], uv.x ), uv.y ) - ro);
                mainCubemap(color, gl_FragCoord.xy-unViewport.xy, ro, rd);
                outColor = color; 
            }
            """
    
    makeHeaderCommon: ->
        @header = """
            uniform vec4      iDate;
            uniform float     iSampleRate;
            """
        @footer  = """
            out vec4 outColor;
            void main(void)
            {
                outColor = vec4(0.0);
            }
            """
    
    makeHeader: ->
        switch @mType 
            when 'image'   then @makeHeaderImage()
            when 'buffer'  then @makeHeaderBuffer()
            when 'common'  then @makeHeaderCommon()
            when 'cubemap' then @makeHeaderCubemap()
        
    create: (@mType, @mName) ->
        @mSource = null
        @makeHeader()
        if @mType in ['image' 'buffer' 'cubemap']
            @mProgram = null
    
    destroy: -> @mSource = null
    
    #  0000000  000   000   0000000   0000000    00000000  00000000   
    # 000       000   000  000   000  000   000  000       000   000  
    # 0000000   000000000  000000000  000   000  0000000   0000000    
    #      000  000   000  000   000  000   000  000       000   000  
    # 0000000   000   000  000   000  0000000    00000000  000   000  
    
    newShader: (shaderCode, commonSourceCodes) ->
        return if not @mRenderer
            
        timeStart = performance.now()

        switch @mType
            when 'image' 'buffer'
                err = @newShaderImage shaderCode, commonSourceCodes
            when 'common'
                err = @newShaderCommon shaderCode
            when 'cubemap'
                err = @newShaderCubemap shaderCode, commonSourceCodes
            when 'keyboard'
                err = null
            else
                err = "unknown type #{@mType}"
                error err
        if not err
            @mCompile = performance.now() - timeStart
        @mSource = shaderCode
        err
    
    # 000  00     00   0000000    0000000   00000000  
    # 000  000   000  000   000  000        000       
    # 000  000000000  000000000  000  0000  0000000   
    # 000  000 0 000  000   000  000   000  000       
    # 000  000   000  000   000   0000000   00000000  
    
    newShaderImage: (shaderCode, commonShaderCodes) ->
        
        vs = 'layout(location = 0) in vec2 pos; void main() { gl_Position = vec4(pos.xy,0.0,1.0); }'
        fr = @header
        for i in [0...commonShaderCodes.length]
            fr += '\n' + commonShaderCodes[i]
        fr += '\n' + shaderCode
        fr += '\n' + @footer
        res = @mRenderer.createShader vs, fr
        if res.mResult == false
            return res.mInfo
        if @mProgram != null
            @mRenderer.destroyShader @mProgram
        @mProgram = res
        null
    
    #  0000000  000   000  0000000    00000000  00     00   0000000   00000000   
    # 000       000   000  000   000  000       000   000  000   000  000   000  
    # 000       000   000  0000000    0000000   000000000  000000000  00000000   
    # 000       000   000  000   000  000       000 0 000  000   000  000        
    #  0000000   0000000   0000000    00000000  000   000  000   000  000        
    
    newShaderCubemap: (shaderCode, commonShaderCodes) ->
        
        vs = 'layout(location = 0) in vec2 pos; void main() { gl_Position = vec4(pos.xy,0.0,1.0); }'
        fr = @header
        i = 0
        while i < commonShaderCodes.length
            fr += commonShaderCodes[i] + '\n'
            i++
        fr += shaderCode
        fr += @footer
        res = @mRenderer.createShader(vs, fr)
        if res.mResult == false
            return res.mInfo
        if @mProgram != null
            @mRenderer.destroyShader @mProgram
        @mProgram = res
        null
    
    #  0000000   0000000   00     00  00     00   0000000   000   000  
    # 000       000   000  000   000  000   000  000   000  0000  000  
    # 000       000   000  000000000  000000000  000   000  000 0 000  
    # 000       000   000  000 0 000  000 0 000  000   000  000  0000  
    #  0000000   0000000   000   000  000   000   0000000   000   000  
    
    newShaderCommon: (shaderCode) ->
        
        vs = 'layout(location = 0) in vec2 pos; void main() { gl_Position = vec4(pos.xy,0.0,1.0); }'
        fr = @header + shaderCode + @footer
        res = @mRenderer.createShader(vs, fr)
        if res.mResult == false
            return res.mInfo
        if @mProgram != null
            @mRenderer.destroyShader @mProgram
        @mProgram = res
        null
        
    destroyInput: (id) ->
        
        if @mInputs[id]
            if @mInputs[id].mInfo.mType in ['texture' 'cubemap']
                @mRenderer.destroyTexture @mInputs[id].globject
            @mInputs[id] = null
    
    sampler2Renderer: (sampler) ->
        
        filter = Renderer.FILTER.NONE
        if sampler?.filter == 'linear' then filter = Renderer.FILTER.LINEAR
        if sampler?.filter == 'mipmap' then filter = Renderer.FILTER.MIPMAP
        return
            mFilter: filter
            mWrap:   sampler?.wrap != 'clamp' and Renderer.TEXWRP.REPEAT or Renderer.TEXWRP.CLAMP
    
    # 00000000  000  000      000000000  00000000  00000000   
    # 000       000  000         000     000       000   000  
    # 000000    000  000         000     0000000   0000000    
    # 000       000  000         000     000       000   000  
    # 000       000  0000000     000     00000000  000   000  
    
    setSamplerFilter: (id, str, buffers, cubeBuffers) ->
        
        inp = @mInputs[id]
        filter = Renderer.FILTER.NONE
        if str == 'linear'
            filter = Renderer.FILTER.LINEAR
        if str == 'mipmap'
            filter = Renderer.FILTER.MIPMAP
        if inp == null
        else if inp.mInfo.mType == 'texture'
            if inp.loaded
                @mRenderer.setSamplerFilter inp.globject, filter, true
        else if inp.mInfo.mType == 'cubemap'
            if inp.loaded
                if @mEffect.assetID_to_cubemapBuferID(inp.mInfo.mID) == 0
                    @mRenderer.setSamplerFilter cubeBuffers[id].mTexture[0], filter, true
                    @mRenderer.setSamplerFilter cubeBuffers[id].mTexture[1], filter, true
                else
                    @mRenderer.setSamplerFilter inp.globject, filter, true
        else if inp.mInfo.mType == 'buffer'
            @mRenderer.setSamplerFilter buffers[inp.id].mTexture[0], filter, true
            @mRenderer.setSamplerFilter buffers[inp.id].mTexture[1], filter, true
    
    # 000   000  00000000    0000000   00000000   
    # 000 0 000  000   000  000   000  000   000  
    # 000000000  0000000    000000000  00000000   
    # 000   000  000   000  000   000  000        
    # 00     00  000   000  000   000  000        
    
    setSamplerWrap: (id, str, buffers) ->
        
        inp = @mInputs[id]
        restr = Renderer.TEXWRP.REPEAT
        if str == 'clamp'
            restr = Renderer.TEXWRP.CLAMP
        if inp?.mInfo.mType == 'texture'
            if inp.loaded
                @mRenderer.setSamplerWrap inp.globject, restr
        else if inp?.mInfo.mType == 'cubemap'
            if inp.loaded
                @mRenderer.setSamplerWrap inp.globject, restr
        else if inp?.mInfo.mType == 'buffer'
            @mRenderer.setSamplerWrap buffers[inp.id].mTexture[0], restr
            @mRenderer.setSamplerWrap buffers[inp.id].mTexture[1], restr
    
    setSamplerVFlip: (id, flip) ->

        inp = @mInputs[id]
        if inp?.loaded and inp?.mInfo.mType in ['texture' 'cubemap']
            @mRenderer.setSamplerVFlip inp.globject, flip, inp.image
            
    getTexture: (slot) -> @mInputs[slot]?.mInfo
    
    # 000000000  00000000  000   000  000000000  000   000  00000000   00000000  
    #    000     000        000 000      000     000   000  000   000  000       
    #    000     0000000     00000       000     000   000  0000000    0000000   
    #    000     000        000 000      000     000   000  000   000  000       
    #    000     00000000  000   000     000      0000000   000   000  00000000  
    
    newTexture: (slot, url, buffers, cubeBuffers, keyboard) ->
        
        texture = null
        
        if not url?.mType
            @destroyInput slot
            @mInputs[slot] = null
            @makeHeader()
            return 
                mFailed: false
                mNeedsShaderCompile: false
                
        else if url.mType == 'texture'
            # klog "newTexture 'texture' #{slot}" url
            texture = {}
            texture.mInfo = url
            texture.globject = null
            texture.loaded = false
            texture.image = new Image
            texture.image.crossOrigin = ''
    
            texture.image.onload = =>
                rti = @sampler2Renderer url.mSampler
                texture.globject = @mRenderer.createTextureFromImage Renderer.TEXTYPE.T2D, texture.image, Renderer.TEXFMT.C4I8, rti.mFilter, rti.mWrap
                texture.loaded = true
                @setSamplerVFlip slot, true
                return
    
            # klog "texture.image.src #{url.mSrc}"
                
            texture.image.src = url.mSrc
            returnValue = 
                mFailed: false
                mNeedsShaderCompile: @mInputs[slot] == null or @mInputs[slot].mInfo.mType != 'texture' and @mInputs[slot].mInfo.mType != 'keyboard'
            @destroyInput slot
            @mInputs[slot] = texture
            
            @makeHeader()
            return returnValue
            
        else if url.mType == 'cubemap'
            texture = {}
            texture.mInfo = url
            texture.globject = null
            texture.loaded = false
            rti = @sampler2Renderer url.mSampler
            
            if @mEffect.assetID_to_cubemapBuferID(url.mID) != -1
                texture.mImage = new Image
    
                texture.mImage.onload = ->
                    texture.loaded = true
                    return
    
                @mEffect.resizeCubemapBuffer 0 1024 1024
            else
                texture.image = [
                    new Image
                    new Image
                    new Image
                    new Image
                    new Image
                    new Image
                ]
                numLoaded = 0
                i = 0
                while i < 6
                    texture.image[i].mId = i
                    texture.image[i].crossOrigin = ''
    
                    texture.image[i].onload = =>
                        id = @mId
                        numLoaded++
                        if numLoaded == 6
                            texture.globject = @mRenderer.createTextureFromImage(Renderer.TEXTYPE.CUBEMAP, texture.image, Renderer.TEXFMT.C4I8, rti.mFilter, rti.mWrap)
                            texture.loaded = true
                        return
    
                    if i == 0
                        texture.image[i].src = url.mSrc
                    else
                        n = url.mSrc.lastIndexOf('.')
                        texture.image[i].src = url.mSrc.substring(0, n) + '_' + i + url.mSrc.substring(n, url.mSrc.length)
                    i++
            returnValue = 
                mFailed: false
                mNeedsShaderCompile: @mInputs[slot] == null or @mInputs[slot].mInfo.mType != 'cubemap'
            @destroyInput slot
            @mInputs[slot] = texture
            @makeHeader()
            return returnValue
            
        else if url.mType == 'keyboard'
            texture = {}
            texture.mInfo = url
            texture.globject = null
            texture.loaded = true
            texture.keyboard = {}
            returnValue = 
                mFailed: false
                mNeedsShaderCompile: @mInputs[slot] == null or @mInputs[slot].mInfo.mType != 'texture' and @mInputs[slot].mInfo.mType != 'keyboard'
            @destroyInput slot
            @mInputs[slot] = texture
            @makeHeader()
            return returnValue
            
        else if url.mType == 'buffer'
            texture = {}
            texture.mInfo = url
            texture.image = new Image
            texture.image.src = url.mSrc
            texture.id = @mEffect.assetID_to_bufferID(url.mID)
            klog "newTexture 'buffer' #{slot}" url, texture.id
            texture.loaded = true
            returnValue = 
                mFailed: false
                mNeedsShaderCompile: @mInputs[slot] == null or @mInputs[slot].mInfo.mType != 'texture' and @mInputs[slot].mInfo.mType != 'keyboard'
                
            klog "newTexture 'buffer' #{slot}" returnValue
            @destroyInput slot
            @mInputs[slot] = texture
            @mEffect.resizeBuffer texture.id, @mEffect.mXres, @mEffect.mYres, false

            # @setSamplerFilter slot, 'linear' buffers, cubeBuffers, true
            # @setSamplerVFlip slot, true
            # @setSamplerWrap slot, 'clamp' buffers
            @makeHeader()
            
            # klog "newTexture 'buffer' #{slot}" @header, @footer
            
            return returnValue
            
        error "input type error: #{url.mType}"
        return mFailed:true
    
    # 000  00     00   0000000    0000000   00000000  
    # 000  000   000  000   000  000        000       
    # 000  000000000  000000000  000  0000  0000000   
    # 000  000 0 000  000   000  000   000  000       
    # 000  000   000  000   000   0000000   00000000  
    
    paintImage: (da, time, dtime, fps, xres, yres, buffers, cubeBuffers, keyboard) ->
        
        times = [ 0 0 0 0 ]
        dates = [
            da.getFullYear()
            da.getMonth()
            da.getDate()
            da.getHours() * 60.0 * 60 + da.getMinutes() * 60 + da.getSeconds() + da.getMilliseconds() / 1000.0
        ]
        resos = [ 0 0 0 0 0 0 0 0 0 0 0 0 ]
        texID = [ null null null null ]
        i = 0
        while i < @mInputs.length
            inp = @mInputs[i]
            if inp == null
            else if inp.mInfo.mType == 'texture'
                if inp.loaded == true
                    texID[i] = inp.globject
                    resos[3 * i + 0] = inp.image.width
                    resos[3 * i + 1] = inp.image.height
                    resos[3 * i + 2] = 1
            else if inp.mInfo.mType == 'keyboard'
                texID[i] = keyboard.mTexture
            else if inp.mInfo.mType == 'cubemap'
                if inp.loaded == true
                    id = @mEffect.assetID_to_cubemapBuferID(inp.mInfo.mID)
                    if id != -1
                        texID[i] = cubeBuffers[id].mTexture[cubeBuffers[id].mLastRenderDone]
                        resos[3 * i + 0] = cubeBuffers[id].mResolution[0]
                        resos[3 * i + 1] = cubeBuffers[id].mResolution[1]
                        resos[3 * i + 2] = 1
                        @mRenderer.setSamplerFilter texID[i], inp.mInfo.mSampler?.filter ? Renderer.FILTER.MIPMAP, false
                    else
                        texID[i] = inp.globject
            else if inp.mInfo.mType == 'buffer'
                if inp.loaded == true
                    id = inp.id
                    texID[i] = buffers[id].mTexture[buffers[id].mLastRenderDone]
                    resos[3 * i + 0] = xres
                    resos[3 * i + 1] = yres
                    resos[3 * i + 2] = 1
                    @mRenderer.setSamplerFilter texID[i], inp.mInfo.mSampler?.filter ? Renderer.FILTER.LINEAR, false
            i++
        @mRenderer.attachTextures 4, texID[0], texID[1], texID[2], texID[3]
        prog = @mProgram
        @mRenderer.attachShader prog
        @mRenderer.setShaderConstant1F  'iTime' time
        @mRenderer.setShaderConstant3F  'iResolution' xres, yres, 1.0
        @mRenderer.setShaderConstant4FV 'iMouse' @mRenderer.iMouse
        @mRenderer.setShaderConstant4FV 'iDate' dates
        @mRenderer.setShaderConstant1F  'iSampleRate' @mSampleRate
        @mRenderer.setShaderTextureUnit 'iChannel0' 0
        @mRenderer.setShaderTextureUnit 'iChannel1' 1
        @mRenderer.setShaderTextureUnit 'iChannel2' 2
        @mRenderer.setShaderTextureUnit 'iChannel3' 3
        @mRenderer.setShaderConstant1I  'iFrame' @mFrame
        @mRenderer.setShaderConstant1F  'iTimeDelta' dtime
        @mRenderer.setShaderConstant1F  'iFrameRate' fps
        @mRenderer.setShaderConstant1FV 'iChannelTime' times
        @mRenderer.setShaderConstant3FV 'iChannelResolution' resos
        ###
        @mRenderer.setShaderConstant1F  'iChannel[0].time' times[0]
        @mRenderer.setShaderConstant1F  'iChannel[1].time' times[1]
        @mRenderer.setShaderConstant1F  'iChannel[2].time' times[2]
        @mRenderer.setShaderConstant1F  'iChannel[3].time' times[3]
        @mRenderer.setShaderConstant3F  'iChannel[0].resolution' resos[0], resos[1],  resos[2]
        @mRenderer.setShaderConstant3F  'iChannel[1].resolution' resos[3], resos[4],  resos[5]
        @mRenderer.setShaderConstant3F  'iChannel[2].resolution' resos[6], resos[7],  resos[8]
        @mRenderer.setShaderConstant3F  'iChannel[3].resolution' resos[9], resos[10], resos[11]
        ###
        l1 = @mRenderer.getAttribLocation(@mProgram, 'pos')
        @mRenderer.setViewport [ 0, 0, xres, yres ]
        @mRenderer.drawFullScreenTriangle_XY l1
        @mRenderer.dettachTextures()
        return
    
    # 000   000  000   000  000  00000000   0000000   00000000   00     00   0000000  
    # 000   000  0000  000  000  000       000   000  000   000  000   000  000       
    # 000   000  000 0 000  000  000000    000   000  0000000    000000000  0000000   
    # 000   000  000  0000  000  000       000   000  000   000  000 0 000       000  
    #  0000000   000   000  000  000        0000000   000   000  000   000  0000000   
    
    setUniforms: (da, time, dtime, fps, xres, yres, buffers, cubeBuffers, keyboard) ->
        times = [ 0 0 0 0 ]
        dates = [
            da.getFullYear()
            da.getMonth()
            da.getDate()
            da.getHours() * 60 * 60 + da.getMinutes() * 60 + da.getSeconds() + da.getMilliseconds() / 1000
        ]
        resos = [ 0 0 0 0 0 0 0 0 0 0 0 0 ]
        texID = [ null null null null ]
        
        for i in [0...@mInputs.length]
            inp = @mInputs[i]
            if inp?.mInfo.mType == 'texture'
                if inp.loaded == true
                    texID[i] = inp.globject
                    resos[3 * i + 0] = inp.image.width
                    resos[3 * i + 1] = inp.image.height
                    resos[3 * i + 2] = 1
            else if inp?.mInfo.mType == 'keyboard'
                texID[i] = keyboard.mTexture
            else if inp?.mInfo.mType == 'cubemap'
                if inp.loaded == true
                    id = @mEffect.assetID_to_cubemapBuferID(inp.mInfo.mID)
                    if id != -1
                        texID[i] = cubeBuffers[id].mTexture[cubeBuffers[id].mLastRenderDone]
                        resos[3 * i + 0] = cubeBuffers[id].mResolution[0]
                        resos[3 * i + 1] = cubeBuffers[id].mResolution[1]
                        resos[3 * i + 2] = 1
                        # hack. in webgl2.0 we have samplers, so we don't need this crap here
                        filter = Renderer.FILTER.NONE
                        if inp.mInfo.mSampler.filter == 'linear'
                            filter = Renderer.FILTER.LINEAR
                        else if inp.mInfo.mSampler.filter == 'mipmap'
                            filter = Renderer.FILTER.MIPMAP
                        @mRenderer.setSamplerFilter texID[i], filter, false
                    else
                        texID[i] = inp.globject
            else if inp?.mInfo.mType == 'buffer'
                if inp.loaded == true
                    texID[i] = buffers[inp.id].mTexture[buffers[inp.id].mLastRenderDone]
                    resos[3 * i + 0] = xres
                    resos[3 * i + 1] = yres
                    resos[3 * i + 2] = 1

        @mRenderer.attachTextures 4, texID[0], texID[1], texID[2], texID[3]
        @mRenderer.attachShader @mProgram
        @mRenderer.setShaderConstant1F  'iTime' time
        @mRenderer.setShaderConstant3F  'iResolution' xres, yres, 1.0
        @mRenderer.setShaderConstant4FV 'iMouse' @mRenderer.iMouse
        @mRenderer.setShaderConstant4FV 'iDate' dates
        @mRenderer.setShaderConstant1F  'iSampleRate' @mSampleRate
        @mRenderer.setShaderTextureUnit 'iChannel0' 0
        @mRenderer.setShaderTextureUnit 'iChannel1' 1
        @mRenderer.setShaderTextureUnit 'iChannel2' 2
        @mRenderer.setShaderTextureUnit 'iChannel3' 3
        @mRenderer.setShaderConstant1I  'iFrame' @mFrame
        @mRenderer.setShaderConstant1F  'iTimeDelta' dtime
        @mRenderer.setShaderConstant1F  'iFrameRate' fps
        @mRenderer.setShaderConstant1FV 'iChannelTime' times
        @mRenderer.setShaderConstant3FV 'iChannelResolution' resos
        ###       
        @mRenderer.setShaderConstant1F  'iChannel[0].time' times[0]
        @mRenderer.setShaderConstant1F  'iChannel[1].time' times[1]
        @mRenderer.setShaderConstant1F  'iChannel[2].time' times[2]
        @mRenderer.setShaderConstant1F  'iChannel[3].time' times[3]
        @mRenderer.setShaderConstant3F  'iChannel[0].resolution' resos[0], resos[1], resos[2]
        @mRenderer.setShaderConstant3F  'iChannel[1].resolution' resos[3], resos[4], resos[5]
        @mRenderer.setShaderConstant3F  'iChannel[2].resolution' resos[6], resos[7], resos[8]
        @mRenderer.setShaderConstant3F  'iChannel[3].resolution' resos[9], resos[10], resos[11]
        ###
    
    # 000  000   000  00000000   000   000  000000000   0000000  
    # 000  0000  000  000   000  000   000     000     000       
    # 000  000 0 000  00000000   000   000     000     0000000   
    # 000  000  0000  000        000   000     000          000  
    # 000  000   000  000         0000000      000     0000000   
    
    processInputs: (time, dtime, fps, xres, yres, buffers, cubeBuffers, keyboard) ->
        i = 0
        while i < @mInputs.length
            inp = @mInputs[i]
            if inp == null
            else
            if inp.mInfo.mType == 'buffer'
                if inp.loaded == true
                    id = inp.id
                    texID = buffers[id].mTexture[buffers[id].mLastRenderDone]
                    # hack. in webgl2.0 we have samplers, so we don't need this crap here
                    filter = Renderer.FILTER.NONE
                    if inp.mInfo.mSampler.filter == 'linear'
                        filter = Renderer.FILTER.LINEAR
                    else if inp.mInfo.mSampler.filter == 'mipmap'
                        filter = Renderer.FILTER.MIPMAP
                    @mRenderer.setSamplerFilter texID, filter, false
            i++
        return
    
    #  0000000  000   000  0000000    00000000  00     00   0000000   00000000   
    # 000       000   000  000   000  000       000   000  000   000  000   000  
    # 000       000   000  0000000    0000000   000000000  000000000  00000000   
    # 000       000   000  000   000  000       000 0 000  000   000  000        
    #  0000000   0000000   0000000    00000000  000   000  000   000  000        
    
    paintCubemap: (da, time, dtime, fps, xres, yres, buffers, cubeBuffers, keyboard, face) ->
        
        @processInputs da, time, dtime, fps, xres, yres, buffers, cubeBuffers, keyboard, face
        @setUniforms   da, time, dtime, fps, xres, yres, buffers, cubeBuffers, keyboard
        l1 = @mRenderer.getAttribLocation @mProgram, 'pos'
        vp = [ 0, 0, xres, yres ]
        @mRenderer.setViewport vp
        C = switch face
            when 0 then [  1  1  1  1  1 -1  1 -1 -1  1 -1  1 0 0 0]
            when 1 then [ -1  1 -1 -1  1  1 -1 -1  1 -1 -1 -1 0 0 0]
            when 2 then [ -1  1 -1  1  1 -1  1  1  1 -1  1  1 0 0 0]
            when 3 then [ -1 -1  1  1 -1  1  1 -1 -1 -1 -1 -1 0 0 0]
            when 4 then [ -1  1  1  1  1  1  1 -1  1 -1 -1  1 0 0 0]
            else        [  1  1 -1 -1  1 -1 -1 -1 -1  1 -1 -1 0 0 0]
                
        @mRenderer.setShaderConstant3FV 'unCorners' C
        @mRenderer.setShaderConstant4FV 'unViewport' vp
        @mRenderer.drawUnitQuad_XY l1
        @mRenderer.dettachTextures()
    
    # 00000000    0000000   000  000   000  000000000  
    # 000   000  000   000  000  0000  000     000     
    # 00000000   000000000  000  000 0 000     000     
    # 000        000   000  000  000  0000     000     
    # 000        000   000  000  000   000     000     
    
    paint: (da, time, dtime, fps, xres, yres, isPaused, bufferID, bufferNeedsMimaps, buffers, cubeBuffers, keyboard, effect) ->
        
        if @mType == 'image'
            @mRenderer.setRenderTarget null
            @paintImage da, time, dtime, fps, xres, yres, buffers, cubeBuffers, keyboard
            @mFrame++
        else if @mType == 'common'
            #console.log("rendering common");
        else if @mType == 'buffer'
            @mEffect.resizeBuffer bufferID, @mEffect.mXres, @mEffect.mYres, false
            buffer = buffers[bufferID]
            dstID = 1 - (buffer.mLastRenderDone)
            @mRenderer.setRenderTarget buffer.mTarget[dstID]
            @paintImage da, time, dtime, fps, xres, yres, buffers, cubeBuffers, keyboard

            if bufferNeedsMimaps
                @mRenderer.createMipmaps buffer.mTexture[dstID]
            buffers[bufferID].mLastRenderDone = 1 - (buffers[bufferID].mLastRenderDone)
            @mFrame++
        else if @mType == 'cubemap'
            @mEffect.resizeCubemapBuffer bufferID, 1024, 1024, false
            buffer = cubeBuffers[bufferID]
            xres = buffer.mResolution[0]
            yres = buffer.mResolution[1]
            dstID = 1 - (buffer.mLastRenderDone)
            face = 0
            while face < 6
                @mRenderer.setRenderTargetCubeMap buffer.mTarget[dstID], face
                @paintCubemap da, time, dtime, fps, xres, yres, buffers, cubeBuffers, keyboard, face
                face++
            @mRenderer.setRenderTargetCubeMap null, 0
            if bufferNeedsMimaps
                @mRenderer.createMipmaps buffer.mTexture[dstID]
            cubeBuffers[bufferID].mLastRenderDone = 1 - (cubeBuffers[bufferID].mLastRenderDone)
            @mFrame++
        return
    
module.exports = Pass