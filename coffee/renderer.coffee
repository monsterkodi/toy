#==============================================================================
#
# piLibs 2014-2017 - http://www.iquilezles.org/www/material/piLibs/piLibs.htm
#
#==============================================================================

{ filter, fs } = require 'kxk'
    
class Renderer 
    
    @: (@mGL) ->

        @iMouse = [0 0 0 0]
        @mFloat32Textures = true
        @mFloat32Filter = @mGL.getExtension('OES_texture_float_linear')
        @mFloat16Textures = true
        @mFloat16Filter = @mGL.getExtension('OES_texture_half_float_linear')
        @mDerivatives = true
        @mDrawBuffers = true
        @mDepthTextures = true
        @mAnisotropic = @mGL.getExtension('EXT_texture_filter_anisotropic')
        @mRenderToFloat32F = @mGL.getExtension('EXT_color_buffer_float')
        maxTexSize = @mGL.getParameter(@mGL.MAX_TEXTURE_SIZE)
        maxCubeSize = @mGL.getParameter(@mGL.MAX_CUBE_MAP_TEXTURE_SIZE)
        maxRenderbufferSize = @mGL.getParameter(@mGL.MAX_RENDERBUFFER_SIZE)
        extensions = @mGL.getSupportedExtensions()
        textureUnits = @mGL.getParameter(@mGL.MAX_TEXTURE_IMAGE_UNITS)
        console.log 'WebGL:' + ' F32 Textures: ' + (if @mFloat32Textures != null then 'yes' else 'no') + ', Render to 32F: ' + (if @mRenderToFloat32F != null then 'yes' else 'no') + ', Max Texture Size: ' + maxTexSize + ', Max Render Buffer Size: ' + maxRenderbufferSize + ', Max Cubemap Size: ' + maxCubeSize

        vertices = new Float32Array [ -1.0 -1.0 1.0 -1.0 -1.0 1.0 1.0 -1.0 1.0 1.0 -1.0 1.0 ]
        @mVBO_Quad = @mGL.createBuffer()
        @mGL.bindBuffer @mGL.ARRAY_BUFFER, @mVBO_Quad
        @mGL.bufferData @mGL.ARRAY_BUFFER, vertices, @mGL.STATIC_DRAW
        @mGL.bindBuffer @mGL.ARRAY_BUFFER, null
        # create a 2D triangle Vertex Buffer
        @mVBO_Tri = @mGL.createBuffer()
        @mGL.bindBuffer @mGL.ARRAY_BUFFER, @mVBO_Tri
        @mGL.bufferData @mGL.ARRAY_BUFFER, new Float32Array([ -1.0 -1.0 3.0 -1.0 -1.0 3.0 ]), @mGL.STATIC_DRAW
        @mGL.bindBuffer @mGL.ARRAY_BUFFER, null
        # create a 3D cube Vertex Buffer
        @mVBO_CubePosNor = @mGL.createBuffer()
        @mGL.bindBuffer @mGL.ARRAY_BUFFER, @mVBO_CubePosNor
        @mGL.bufferData @mGL.ARRAY_BUFFER, new Float32Array([
            -1.0 -1.0 -1.0 -1.0 0.0 0.0 -1.0 -1.0 1.0 -1.0 0.0 0.0 -1.0 1.0 -1.0 -1.0 0.0 0.0 -1.0 1.0 1.0 -1.0 0.0 0.0 1.0 1.0 -1.0 1.0 0.0 0.0 1.0
            1.0 1.0 1.0 0.0 0.0 1.0 -1.0 -1.0 1.0 0.0 0.0 1.0 -1.0 1.0 1.0 0.0 0.0 1.0 1.0 1.0 0.0 1.0 0.0 1.0 1.0 -1.0 0.0 1.0
            0.0 -1.0 1.0 1.0 0.0 1.0 0.0 -1.0 1.0 -1.0 0.0 1.0 0.0 1.0 -1.0 -1.0 0.0 -1.0 0.0 1.0 -1.0 1.0 0.0 -1.0 0.0 -1.0 -1.0
            -1.0 0.0 -1.0 0.0 -1.0 -1.0 1.0 0.0 -1.0 0.0 -1.0 1.0 1.0 0.0 0.0 1.0 -1.0 -1.0 1.0 0.0 0.0 1.0 1.0 1.0 1.0 0.0 0.0 1.0
            1.0 -1.0 1.0 0.0 0.0 1.0 -1.0 -1.0 -1.0 0.0 0.0 -1.0 -1.0 1.0 -1.0 0.0 0.0 -1.0 1.0 -1.0 -1.0 0.0 0.0 -1.0 1.0 1.0 -1.0 0.0 0.0 -1.0
        ]), @mGL.STATIC_DRAW
        @mGL.bindBuffer @mGL.ARRAY_BUFFER, null
        @mVBO_CubePos = @mGL.createBuffer()
        @mGL.bindBuffer @mGL.ARRAY_BUFFER, @mVBO_CubePos
        @mGL.bufferData @mGL.ARRAY_BUFFER, new Float32Array([
            -1.0 -1.0 -1.0 -1.0 -1.0 1.0 -1.0 1.0 -1.0 -1.0 1.0 1.0 1.0 1.0 -1.0 1.0 1.0 1.0 1.0 -1.0 -1.0 1.0 -1.0 1.0 1.0 1.0 1.0 1.0
            1.0 -1.0 -1.0 1.0 1.0 -1.0 1.0 -1.0 1.0 -1.0 -1.0 1.0 -1.0 1.0 -1.0 -1.0 -1.0 -1.0 -1.0 1.0 -1.0 1.0 1.0 -1.0 -1.0 1.0 1.0 1.0
            1.0 1.0 -1.0 1.0 -1.0 -1.0 -1.0 -1.0 1.0 -1.0 1.0 -1.0 -1.0 1.0 1.0 -1.0
        ]), @mGL.STATIC_DRAW
        @mGL.bindBuffer @mGL.ARRAY_BUFFER, null

    @CLEAR      = Color:1 Zbuffer:2 Stencil:4
    @TEXFMT     = C4I8:0 C1I8:1 C1F16:2 C4F16:3 C1F32:4 C4F32:5 Z16:6 Z24:7 Z32:8 C3F32:9
    @TEXWRP     = CLAMP:0 REPEAT:1
    @BUFTYPE    = STATIC:0 DYNAMIC:1
    @PRIMTYPE   = POINTS:0 LINES:1 LINE_LOOP:2 LINE_STRIP:3 TRIANGLES:4 TRIANGLE_STRIP:5
    @RENDSTGATE = WIREFRAME:0 FRONT_FACE:1 CULL_FACE:2 DEPTH_TEST:3 ALPHA_TO_COVERAGE:4
    @TEXTYPE    = T2D:0 T3D:1 CUBEMAP:2
    @FILTER     = NONE:0 LINEAR:1 MIPMAP:2 NONE_MIPMAP:3
    @TYPE       = UINT8:0 UINT16:1 UINT32:2 FLOAT16:3 FLOAT32:4 FLOAT64:5

    iFormatPI2GL: (format) ->
        return switch format
            when Renderer.TEXFMT.C4I8
                    mGLFormat:   @mGL.RGBA8
                    mGLExternal: @mGL.RGBA
                    mGLType:     @mGL.UNSIGNED_BYTE
            when Renderer.TEXFMT.C1I8
                    mGLFormat: @mGL.R8
                    mGLExternal: @mGL.RED
                    mGLType: @mGL.UNSIGNED_BYTE
            when Renderer.TEXFMT.C1F16
                    mGLFormat: @mGL.R16F
                    mGLExternal: @mGL.RED
                    mGLType: @mGL.FLOAT
            when Renderer.TEXFMT.C4F16
                    mGLFormat: @mGL.RGBA16F
                    mGLExternal: @mGL.RGBA
                    mGLType: @mGL.FLOAT
            when Renderer.TEXFMT.C1F32
                    mGLFormat: @mGL.R32F
                    mGLExternal: @mGL.RED
                    mGLType: @mGL.FLOAT
            when Renderer.TEXFMT.C4F32
                    mGLFormat: @mGL.RGBA32F
                    mGLExternal: @mGL.RGBA
                    mGLType: @mGL.FLOAT
            when Renderer.TEXFMT.C3F32
                    mGLFormat: @mGL.RGB32F
                    mGLExternal: @mGL.RGB
                    mGLType: @mGL.FLOAT
            when Renderer.TEXFMT.Z16
                    mGLFormat: @mGL.DEPTH_COMPONENT16
                    mGLExternal: @mGL.DEPTH_COMPONENT
                    mGLType: @mGL.UNSIGNED_SHORT
            when Renderer.TEXFMT.Z24
                    mGLFormat: @mGL.DEPTH_COMPONENT24
                    mGLExternal: @mGL.DEPTH_COMPONENT
                    mGLType: @mGL.UNSIGNED_SHORT
            when Renderer.TEXFMT.Z32
                    mGLFormat: @mGL.DEPTH_COMPONENT32F
                    mGLExternal: @mGL.DEPTH_COMPONENT
                    mGLType: @mGL.UNSIGNED_SHORT
            else
                null

    checkErrors: ->
        error = @mGL.getError()
        if error != @mGL.NO_ERROR
            for prop of @mGL
                if typeof @mGL[prop] == 'number'
                    if @mGL[prop] == error
                        console.log 'GL Error ' + error + ': ' + prop
                        break

    clear: (flags, ccolor, cdepth, cstencil) ->
        mode = 0
        if flags & 1
            mode |= @mGL.COLOR_BUFFER_BIT
            @mGL.clearColor ccolor[0], ccolor[1], ccolor[2], ccolor[3]
        if flags & 2
            mode |= @mGL.DEPTH_BUFFER_BIT
            @mGL.clearDepth cdepth
        if flags & 4
            mode |= @mGL.STENCIL_BUFFER_BIT
            @mGL.clearStencil cstencil
        @mGL.clear mode

    createTexture: (type, xres, yres, format, filter, wrap, buffer) ->
        if not @mGL then return
        id = @mGL.createTexture()
        glFoTy = @iFormatPI2GL(format)
        glWrap = @mGL.REPEAT
        if wrap == Renderer.TEXWRP.CLAMP
            glWrap = @mGL.CLAMP_TO_EDGE
        if type == Renderer.TEXTYPE.T2D
            @mGL.bindTexture @mGL.TEXTURE_2D, id
            @mGL.texImage2D @mGL.TEXTURE_2D, 0, glFoTy.mGLFormat, xres, yres, 0, glFoTy.mGLExternal, glFoTy.mGLType, buffer
            @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_WRAP_S, glWrap
            @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_WRAP_T, glWrap
            if filter == Renderer.FILTER.NONE
                @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_MAG_FILTER, @mGL.NEAREST
                @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_MIN_FILTER, @mGL.NEAREST
            else if filter == Renderer.FILTER.LINEAR
                @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_MAG_FILTER, @mGL.LINEAR
                @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_MIN_FILTER, @mGL.LINEAR
            else if filter == Renderer.FILTER.MIPMAP
                @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_MAG_FILTER, @mGL.LINEAR
                @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_MIN_FILTER, @mGL.LINEAR_MIPMAP_LINEAR
                @mGL.generateMipmap @mGL.TEXTURE_2D
            else
                @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_MAG_FILTER, @mGL.NEAREST
                @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_MIN_FILTER, @mGL.NEAREST_MIPMAP_LINEAR
                @mGL.generateMipmap @mGL.TEXTURE_2D
            @mGL.bindTexture @mGL.TEXTURE_2D, null
        else if type == Renderer.TEXTYPE.T3D
            @mGL.bindTexture @mGL.TEXTURE_3D, id
            @mGL.texParameteri @mGL.TEXTURE_3D, @mGL.TEXTURE_BASE_LEVEL, 0
            @mGL.texParameteri @mGL.TEXTURE_3D, @mGL.TEXTURE_MAX_LEVEL, Math.log2(xres)
            if filter == Renderer.FILTER.NONE
                @mGL.texParameteri @mGL.TEXTURE_3D, @mGL.TEXTURE_MAG_FILTER, @mGL.NEAREST
                @mGL.texParameteri @mGL.TEXTURE_3D, @mGL.TEXTURE_MIN_FILTER, @mGL.NEAREST
            else if filter == Renderer.FILTER.LINEAR
                @mGL.texParameteri @mGL.TEXTURE_3D, @mGL.TEXTURE_MAG_FILTER, @mGL.LINEAR
                @mGL.texParameteri @mGL.TEXTURE_3D, @mGL.TEXTURE_MIN_FILTER, @mGL.LINEAR
            else if filter == Renderer.FILTER.MIPMAP
                @mGL.texParameteri @mGL.TEXTURE_3D, @mGL.TEXTURE_MAG_FILTER, @mGL.LINEAR
                @mGL.texParameteri @mGL.TEXTURE_3D, @mGL.TEXTURE_MIN_FILTER, @mGL.LINEAR_MIPMAP_LINEAR
            else
                @mGL.texParameteri @mGL.TEXTURE_3D, @mGL.TEXTURE_MAG_FILTER, @mGL.NEAREST
                @mGL.texParameteri @mGL.TEXTURE_3D, @mGL.TEXTURE_MIN_FILTER, @mGL.NEAREST_MIPMAP_LINEAR
                @mGL.generateMipmap @mGL.TEXTURE_3D
            @mGL.texImage3D @mGL.TEXTURE_3D, 0, glFoTy.mGLFormat, xres, yres, yres, 0, glFoTy.mGLExternal, glFoTy.mGLType, buffer
            @mGL.texParameteri @mGL.TEXTURE_3D, @mGL.TEXTURE_WRAP_R, glWrap
            @mGL.texParameteri @mGL.TEXTURE_3D, @mGL.TEXTURE_WRAP_S, glWrap
            @mGL.texParameteri @mGL.TEXTURE_3D, @mGL.TEXTURE_WRAP_T, glWrap
            if filter == Renderer.FILTER.MIPMAP
                @mGL.generateMipmap @mGL.TEXTURE_3D
            @mGL.bindTexture @mGL.TEXTURE_3D, null
        else
            @mGL.bindTexture @mGL.TEXTURE_CUBE_MAP, id
            @mGL.texImage2D @mGL.TEXTURE_CUBE_MAP_POSITIVE_X, 0, glFoTy.mGLFormat, xres, yres, 0, glFoTy.mGLExternal, glFoTy.mGLType, buffer
            @mGL.texImage2D @mGL.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, glFoTy.mGLFormat, xres, yres, 0, glFoTy.mGLExternal, glFoTy.mGLType, buffer
            @mGL.texImage2D @mGL.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, glFoTy.mGLFormat, xres, yres, 0, glFoTy.mGLExternal, glFoTy.mGLType, buffer
            @mGL.texImage2D @mGL.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, glFoTy.mGLFormat, xres, yres, 0, glFoTy.mGLExternal, glFoTy.mGLType, buffer
            @mGL.texImage2D @mGL.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, glFoTy.mGLFormat, xres, yres, 0, glFoTy.mGLExternal, glFoTy.mGLType, buffer
            @mGL.texImage2D @mGL.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, glFoTy.mGLFormat, xres, yres, 0, glFoTy.mGLExternal, glFoTy.mGLType, buffer
            if filter == Renderer.FILTER.NONE
                @mGL.texParameteri @mGL.TEXTURE_CUBE_MAP, @mGL.TEXTURE_MAG_FILTER, @mGL.NEAREST
                @mGL.texParameteri @mGL.TEXTURE_CUBE_MAP, @mGL.TEXTURE_MIN_FILTER, @mGL.NEAREST
            else if filter == Renderer.FILTER.LINEAR
                @mGL.texParameteri @mGL.TEXTURE_CUBE_MAP, @mGL.TEXTURE_MAG_FILTER, @mGL.LINEAR
                @mGL.texParameteri @mGL.TEXTURE_CUBE_MAP, @mGL.TEXTURE_MIN_FILTER, @mGL.LINEAR
            else if filter == Renderer.FILTER.MIPMAP
                @mGL.texParameteri @mGL.TEXTURE_CUBE_MAP, @mGL.TEXTURE_MAG_FILTER, @mGL.LINEAR
                @mGL.texParameteri @mGL.TEXTURE_CUBE_MAP, @mGL.TEXTURE_MIN_FILTER, @mGL.LINEAR_MIPMAP_LINEAR
            if filter == Renderer.FILTER.MIPMAP
                @mGL.generateMipmap @mGL.TEXTURE_CUBE_MAP
            @mGL.bindTexture @mGL.TEXTURE_CUBE_MAP, null

        return
            mObjectID: id
            mXres: xres
            mYres: yres
            mFormat: format
            mType: type
            mFilter: filter
            mWrap: wrap

    createTextureFromImage: (type, image, format, filter, wrap, flipY) ->
        if @mGL == null
            return null
        id = @mGL.createTexture()
        glFoTy = @iFormatPI2GL(format)
        glWrap = @mGL.REPEAT
        if wrap == Renderer.TEXWRP.CLAMP
            glWrap = @mGL.CLAMP_TO_EDGE
        if type == Renderer.TEXTYPE.T2D
            @mGL.bindTexture @mGL.TEXTURE_2D, id
            @mGL.pixelStorei @mGL.UNPACK_FLIP_Y_WEBGL, flipY
            @mGL.pixelStorei @mGL.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false
            @mGL.pixelStorei @mGL.UNPACK_COLORSPACE_CONVERSION_WEBGL, @mGL.NONE
            @mGL.texImage2D @mGL.TEXTURE_2D, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, image
            @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_WRAP_S, glWrap
            @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_WRAP_T, glWrap
            if filter == Renderer.FILTER.NONE
                @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_MAG_FILTER, @mGL.NEAREST
                @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_MIN_FILTER, @mGL.NEAREST
            else if filter == Renderer.FILTER.LINEAR
                @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_MAG_FILTER, @mGL.LINEAR
                @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_MIN_FILTER, @mGL.LINEAR
            else if filter == Renderer.FILTER.MIPMAP
                @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_MAG_FILTER, @mGL.LINEAR
                @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_MIN_FILTER, @mGL.LINEAR_MIPMAP_LINEAR
                @mGL.generateMipmap @mGL.TEXTURE_2D
            else
                @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_MAG_FILTER, @mGL.LINEAR
                @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_MIN_FILTER, @mGL.NEAREST_MIPMAP_LINEAR
                @mGL.generateMipmap @mGL.TEXTURE_2D
            @mGL.bindTexture @mGL.TEXTURE_2D, null
        else if type == Renderer.TEXTYPE.T3D
            return null
        else
            @mGL.bindTexture @mGL.TEXTURE_CUBE_MAP, id
            @mGL.pixelStorei @mGL.UNPACK_FLIP_Y_WEBGL, flipY
            @mGL.activeTexture @mGL.TEXTURE0
            @mGL.texImage2D @mGL.TEXTURE_CUBE_MAP_POSITIVE_X, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, image[0]
            @mGL.texImage2D @mGL.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, image[1]
            @mGL.texImage2D @mGL.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, if flipY then image[3] else image[2]
            @mGL.texImage2D @mGL.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, if flipY then image[2] else image[3]
            @mGL.texImage2D @mGL.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, image[4]
            @mGL.texImage2D @mGL.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, image[5]
            if filter == Renderer.FILTER.NONE
                @mGL.texParameteri @mGL.TEXTURE_CUBE_MAP, @mGL.TEXTURE_MAG_FILTER, @mGL.NEAREST
                @mGL.texParameteri @mGL.TEXTURE_CUBE_MAP, @mGL.TEXTURE_MIN_FILTER, @mGL.NEAREST
            else if filter == Renderer.FILTER.LINEAR
                @mGL.texParameteri @mGL.TEXTURE_CUBE_MAP, @mGL.TEXTURE_MAG_FILTER, @mGL.LINEAR
                @mGL.texParameteri @mGL.TEXTURE_CUBE_MAP, @mGL.TEXTURE_MIN_FILTER, @mGL.LINEAR
            else if filter == Renderer.FILTER.MIPMAP
                @mGL.texParameteri @mGL.TEXTURE_CUBE_MAP, @mGL.TEXTURE_MAG_FILTER, @mGL.LINEAR
                @mGL.texParameteri @mGL.TEXTURE_CUBE_MAP, @mGL.TEXTURE_MIN_FILTER, @mGL.LINEAR_MIPMAP_LINEAR
                @mGL.generateMipmap @mGL.TEXTURE_CUBE_MAP
            @mGL.bindTexture @mGL.TEXTURE_CUBE_MAP, null
        return
            mObjectID: id
            mXres: image.width
            mYres: image.height
            mFormat: format
            mType: type
            mFilter: filter
            mWrap: wrap

    setSamplerFilter: (te, filter, doGenerateMipsIfNeeded) ->
        if te.mFilter == filter
            return
        if te.mType == Renderer.TEXTYPE.T2D
            @mGL.bindTexture @mGL.TEXTURE_2D, te.mObjectID
            if filter == Renderer.FILTER.NONE
                @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_MAG_FILTER, @mGL.NEAREST
                @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_MIN_FILTER, @mGL.NEAREST
            else if filter == Renderer.FILTER.LINEAR
                @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_MAG_FILTER, @mGL.LINEAR
                @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_MIN_FILTER, @mGL.LINEAR
            else if filter == Renderer.FILTER.MIPMAP
                @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_MAG_FILTER, @mGL.LINEAR
                @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_MIN_FILTER, @mGL.LINEAR_MIPMAP_LINEAR
                if doGenerateMipsIfNeeded
                    @mGL.generateMipmap @mGL.TEXTURE_2D
            else
                @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_MAG_FILTER, @mGL.NEAREST
                @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_MIN_FILTER, @mGL.NEAREST_MIPMAP_LINEAR
                if doGenerateMipsIfNeeded
                    @mGL.generateMipmap @mGL.TEXTURE_2D
            @mGL.bindTexture @mGL.TEXTURE_2D, null
        else if te.mType == Renderer.TEXTYPE.T3D
            @mGL.bindTexture @mGL.TEXTURE_3D, te.mObjectID
            if filter == Renderer.FILTER.NONE
                @mGL.texParameteri @mGL.TEXTURE_3D, @mGL.TEXTURE_MAG_FILTER, @mGL.NEAREST
                @mGL.texParameteri @mGL.TEXTURE_3D, @mGL.TEXTURE_MIN_FILTER, @mGL.NEAREST
            else if filter == Renderer.FILTER.LINEAR
                @mGL.texParameteri @mGL.TEXTURE_3D, @mGL.TEXTURE_MAG_FILTER, @mGL.LINEAR
                @mGL.texParameteri @mGL.TEXTURE_3D, @mGL.TEXTURE_MIN_FILTER, @mGL.LINEAR
            else if filter == Renderer.FILTER.MIPMAP
                @mGL.texParameteri @mGL.TEXTURE_3D, @mGL.TEXTURE_MAG_FILTER, @mGL.LINEAR
                @mGL.texParameteri @mGL.TEXTURE_3D, @mGL.TEXTURE_MIN_FILTER, @mGL.LINEAR_MIPMAP_LINEAR
                if doGenerateMipsIfNeeded
                    @mGL.generateMipmap @mGL.TEXTURE_3D
            else
                @mGL.texParameteri @mGL.TEXTURE_3D, @mGL.TEXTURE_MAG_FILTER, @mGL.NEAREST
                @mGL.texParameteri @mGL.TEXTURE_3D, @mGL.TEXTURE_MIN_FILTER, @mGL.NEAREST_MIPMAP_LINEAR
                if doGenerateMipsIfNeeded
                    @mGL.generateMipmap @mGL.TEXTURE_3D
            @mGL.bindTexture @mGL.TEXTURE_3D, null
        else
            @mGL.bindTexture @mGL.TEXTURE_CUBE_MAP, te.mObjectID
            if filter == Renderer.FILTER.NONE
                @mGL.texParameteri @mGL.TEXTURE_CUBE_MAP, @mGL.TEXTURE_MAG_FILTER, @mGL.NEAREST
                @mGL.texParameteri @mGL.TEXTURE_CUBE_MAP, @mGL.TEXTURE_MIN_FILTER, @mGL.NEAREST
            else if filter == Renderer.FILTER.LINEAR
                @mGL.texParameteri @mGL.TEXTURE_CUBE_MAP, @mGL.TEXTURE_MAG_FILTER, @mGL.LINEAR
                @mGL.texParameteri @mGL.TEXTURE_CUBE_MAP, @mGL.TEXTURE_MIN_FILTER, @mGL.LINEAR
            else if filter == Renderer.FILTER.MIPMAP
                @mGL.texParameteri @mGL.TEXTURE_CUBE_MAP, @mGL.TEXTURE_MAG_FILTER, @mGL.LINEAR
                @mGL.texParameteri @mGL.TEXTURE_CUBE_MAP, @mGL.TEXTURE_MIN_FILTER, @mGL.LINEAR_MIPMAP_LINEAR
                if doGenerateMipsIfNeeded
                    @mGL.generateMipmap @mGL.TEXTURE_CUBE_MAP
            else
                @mGL.texParameteri @mGL.TEXTURE_CUBE_MAP, @mGL.TEXTURE_MAG_FILTER, @mGL.NEAREST
                @mGL.texParameteri @mGL.TEXTURE_CUBE_MAP, @mGL.TEXTURE_MIN_FILTER, @mGL.NEAREST_MIPMAP_LINEAR
                if doGenerateMipsIfNeeded
                    @mGL.generateMipmap @mGL.TEXTURE_CUBE_MAP
            @mGL.bindTexture @mGL.TEXTURE_CUBE_MAP, null
        te.mFilter = filter

    setSamplerWrap: (te, wrap) ->
        if te.mWrap == wrap
            return
        glWrap = @mGL.REPEAT
        if wrap == Renderer.TEXWRP.CLAMP
            glWrap = @mGL.CLAMP_TO_EDGE
        id = te.mObjectID
        if te.mType == Renderer.TEXTYPE.T2D
            @mGL.bindTexture @mGL.TEXTURE_2D, id
            @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_WRAP_S, glWrap
            @mGL.texParameteri @mGL.TEXTURE_2D, @mGL.TEXTURE_WRAP_T, glWrap
            @mGL.bindTexture @mGL.TEXTURE_2D, null
        else if te.mType == Renderer.TEXTYPE.T3D
            @mGL.bindTexture @mGL.TEXTURE_3D, id
            @mGL.texParameteri @mGL.TEXTURE_3D, @mGL.TEXTURE_WRAP_R, glWrap
            @mGL.texParameteri @mGL.TEXTURE_3D, @mGL.TEXTURE_WRAP_S, glWrap
            @mGL.texParameteri @mGL.TEXTURE_3D, @mGL.TEXTURE_WRAP_T, glWrap
            @mGL.bindTexture @mGL.TEXTURE_3D, null
        te.mWrap = wrap

    setSamplerVFlip: (te, vflip, image) ->

        return if te.mVFlip == vflip
        id = te.mObjectID
        if te.mType == Renderer.TEXTYPE.T2D
            if image != null
                @mGL.activeTexture @mGL.TEXTURE0
                @mGL.bindTexture @mGL.TEXTURE_2D, id
                @mGL.pixelStorei @mGL.UNPACK_FLIP_Y_WEBGL, vflip
                glFoTy = @iFormatPI2GL(te.mFormat)
                @mGL.texImage2D @mGL.TEXTURE_2D, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, image
                @mGL.bindTexture @mGL.TEXTURE_2D, null
        else if te.mType == Renderer.TEXTYPE.CUBEMAP
            if image != null
                glFoTy = @iFormatPI2GL(te.mFormat)
                @mGL.activeTexture @mGL.TEXTURE0
                @mGL.bindTexture @mGL.TEXTURE_CUBE_MAP, id
                @mGL.pixelStorei @mGL.UNPACK_FLIP_Y_WEBGL, vflip
                @mGL.texImage2D @mGL.TEXTURE_CUBE_MAP_POSITIVE_X, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, image[0]
                @mGL.texImage2D @mGL.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, image[1]
                @mGL.texImage2D @mGL.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, if vflip then image[3] else image[2]
                @mGL.texImage2D @mGL.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, if vflip then image[2] else image[3]
                @mGL.texImage2D @mGL.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, image[4]
                @mGL.texImage2D @mGL.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, image[5]
                @mGL.bindTexture @mGL.TEXTURE_CUBE_MAP, null
        te.mVFlip = vflip
        
    createMipmaps: (te) ->
        if te.mType == Renderer.TEXTYPE.T2D
            @mGL.activeTexture @mGL.TEXTURE0
            @mGL.bindTexture @mGL.TEXTURE_2D, te.mObjectID
            @mGL.generateMipmap @mGL.TEXTURE_2D
            @mGL.bindTexture @mGL.TEXTURE_2D, null
        else if te.mType == Renderer.TEXTYPE.CUBEMAP
            @mGL.activeTexture @mGL.TEXTURE0
            @mGL.bindTexture @mGL.TEXTURE_CUBE_MAP, te.mObjectID
            @mGL.generateMipmap @mGL.TEXTURE_CUBE_MAP
            @mGL.bindTexture @mGL.TEXTURE_CUBE_MAP, null

    updateTexture: (tex, x0, y0, xres, yres, buffer) ->
        glFoTy = @iFormatPI2GL(tex.mFormat)
        if tex.mType == Renderer.TEXTYPE.T2D
            @mGL.activeTexture @mGL.TEXTURE0
            @mGL.bindTexture @mGL.TEXTURE_2D, tex.mObjectID
            @mGL.pixelStorei @mGL.UNPACK_FLIP_Y_WEBGL, false
            @mGL.texSubImage2D @mGL.TEXTURE_2D, 0, x0, y0, xres, yres, glFoTy.mGLExternal, glFoTy.mGLType, buffer
            @mGL.bindTexture @mGL.TEXTURE_2D, null

    updateTextureFromImage: (tex, image) ->
        glFoTy = @iFormatPI2GL(tex.mFormat)
        if tex.mType == Renderer.TEXTYPE.T2D
            @mGL.activeTexture @mGL.TEXTURE0
            @mGL.bindTexture @mGL.TEXTURE_2D, tex.mObjectID
            @mGL.pixelStorei @mGL.UNPACK_FLIP_Y_WEBGL, false
            @mGL.texImage2D @mGL.TEXTURE_2D, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, image
            @mGL.bindTexture @mGL.TEXTURE_2D, null

    destroyTexture: (te) -> if te?.mObjectID then @mGL.deleteTexture te.mObjectID

    attachTextures: (num, t0, t1, t2, t3) ->
        if num > 0 and t0 != null
            @mGL.activeTexture @mGL.TEXTURE0
            if t0.mType == Renderer.TEXTYPE.T2D
                @mGL.bindTexture @mGL.TEXTURE_2D, t0.mObjectID
            else if t0.mType == Renderer.TEXTYPE.T3D
                @mGL.bindTexture @mGL.TEXTURE_3D, t0.mObjectID
            else if t0.mType == Renderer.TEXTYPE.CUBEMAP
                @mGL.bindTexture @mGL.TEXTURE_CUBE_MAP, t0.mObjectID
        if num > 1 and t1 != null
            @mGL.activeTexture @mGL.TEXTURE1
            if t1.mType == Renderer.TEXTYPE.T2D
                @mGL.bindTexture @mGL.TEXTURE_2D, t1.mObjectID
            else if t1.mType == Renderer.TEXTYPE.T3D
                @mGL.bindTexture @mGL.TEXTURE_3D, t1.mObjectID
            else if t1.mType == Renderer.TEXTYPE.CUBEMAP
                @mGL.bindTexture @mGL.TEXTURE_CUBE_MAP, t1.mObjectID
        if num > 2 and t2 != null
            @mGL.activeTexture @mGL.TEXTURE2
            if t2.mType == Renderer.TEXTYPE.T2D
                @mGL.bindTexture @mGL.TEXTURE_2D, t2.mObjectID
            else if t2.mType == Renderer.TEXTYPE.T3D
                @mGL.bindTexture @mGL.TEXTURE_3D, t2.mObjectID
            else if t2.mType == Renderer.TEXTYPE.CUBEMAP
                @mGL.bindTexture @mGL.TEXTURE_CUBE_MAP, t2.mObjectID
        if num > 3 and t3 != null
            @mGL.activeTexture @mGL.TEXTURE3
            if t3.mType == Renderer.TEXTYPE.T2D
                @mGL.bindTexture @mGL.TEXTURE_2D, t3.mObjectID
            else if t3.mType == Renderer.TEXTYPE.T3D
                @mGL.bindTexture @mGL.TEXTURE_3D, t3.mObjectID
            else if t3.mType == Renderer.TEXTYPE.CUBEMAP
                @mGL.bindTexture @mGL.TEXTURE_CUBE_MAP, t3.mObjectID
        return

    dettachTextures: ->
        @mGL.activeTexture @mGL.TEXTURE0
        @mGL.bindTexture @mGL.TEXTURE_2D, null
        @mGL.bindTexture @mGL.TEXTURE_CUBE_MAP, null
        @mGL.activeTexture @mGL.TEXTURE1
        @mGL.bindTexture @mGL.TEXTURE_2D, null
        @mGL.bindTexture @mGL.TEXTURE_CUBE_MAP, null
        @mGL.activeTexture @mGL.TEXTURE2
        @mGL.bindTexture @mGL.TEXTURE_2D, null
        @mGL.bindTexture @mGL.TEXTURE_CUBE_MAP, null
        @mGL.activeTexture @mGL.TEXTURE3
        @mGL.bindTexture @mGL.TEXTURE_2D, null
        @mGL.bindTexture @mGL.TEXTURE_CUBE_MAP, null

    createRenderTarget: (color0) ->
        
        id = @mGL.createFramebuffer()
        @mGL.bindFramebuffer @mGL.FRAMEBUFFER, id
        # @mGL.framebufferTexture2D @mGL.FRAMEBUFFER, @mGL.DEPTH_ATTACHMENT, @mGL.TEXTURE_2D, depth.mObjectID, 0
        if color0
            @mGL.framebufferTexture2D @mGL.FRAMEBUFFER, @mGL.COLOR_ATTACHMENT0, @mGL.TEXTURE_2D, color0.mObjectID, 0
        if @mGL.checkFramebufferStatus(@mGL.FRAMEBUFFER) != @mGL.FRAMEBUFFER_COMPLETE
            return null
        @mGL.bindRenderbuffer @mGL.RENDERBUFFER, null
        @mGL.bindFramebuffer  @mGL.FRAMEBUFFER, null
        return
            mObjectID: id
            mTex0: color0

    destroyRenderTarget: (tex) ->
        @mGL.deleteFramebuffer tex.mObjectID

    setRenderTarget: (tex) -> @mGL.bindFramebuffer @mGL.FRAMEBUFFER, tex?.mObjectID

    createRenderTargetNew: (wantColor0, wantZbuffer, xres, yres, samples) ->
        id = @mGL.createFramebuffer()
        @mGL.bindFramebuffer @mGL.FRAMEBUFFER, id
        if wantZbuffer == true
            zb = @mGL.createRenderbuffer()
            @mGL.bindRenderbuffer @mGL.RENDERBUFFER, zb
            if samples == 1
                @mGL.renderbufferStorage @mGL.RENDERBUFFER, @mGL.DEPTH_COMPONENT16, xres, yres
            else
                @mGL.renderbufferStorageMultisample @mGL.RENDERBUFFER, samples, @mGL.DEPTH_COMPONENT16, xres, yres
            @mGL.framebufferRenderbuffer @mGL.FRAMEBUFFER, @mGL.DEPTH_ATTACHMENT, @mGL.RENDERBUFFER, zb
        if wantColor0
            cb = @mGL.createRenderbuffer()
            @mGL.bindRenderbuffer @mGL.RENDERBUFFER, cb
            if samples == 1
                @mGL.renderbufferStorage @mGL.RENDERBUFFER, @mGL.RGBA8, xres, yres
            else
                @mGL.renderbufferStorageMultisample @mGL.RENDERBUFFER, samples, @mGL.RGBA8, xres, yres
            @mGL.framebufferRenderbuffer @mGL.FRAMEBUFFER, @mGL.COLOR_ATTACHMENT0, @mGL.RENDERBUFFER, cb
        if @mGL.checkFramebufferStatus(mGL.FRAMEBUFFER) != @mGL.FRAMEBUFFER_COMPLETE
            return null
        @mGL.bindRenderbuffer @mGL.RENDERBUFFER, null
        @mGL.bindFramebuffer @mGL.FRAMEBUFFER, null
        return
            mObjectID: id
            mXres: xres
            mYres: yres
            mTex0: color0

    createRenderTargetCubeMap: (color0) ->
        id = @mGL.createFramebuffer()
        @mGL.bindFramebuffer @mGL.FRAMEBUFFER, id
        @mGL.framebufferTexture2D @mGL.FRAMEBUFFER, @mGL.DEPTH_ATTACHMENT, @mGL.TEXTURE_2D, depth.mObjectID, 0
        if color0 != null
            @mGL.framebufferTexture2D @mGL.FRAMEBUFFER, @mGL.COLOR_ATTACHMENT0, @mGL.TEXTURE_CUBE_MAP_POSITIVE_X, color0.mObjectID, 0
        if @mGL.checkFramebufferStatus(mGL.FRAMEBUFFER) != @mGL.FRAMEBUFFER_COMPLETE
            return null
        @mGL.bindRenderbuffer @mGL.RENDERBUFFER, null
        @mGL.bindFramebuffer @mGL.FRAMEBUFFER, null
        return
            mObjectID: id
            mTex0: color0

    setRenderTargetCubeMap: (fbo, face) ->
        if fbo == null
            @mGL.bindFramebuffer @mGL.FRAMEBUFFER, null
        else
            @mGL.bindFramebuffer @mGL.FRAMEBUFFER, fbo.mObjectID
            @mGL.framebufferTexture2D @mGL.FRAMEBUFFER, @mGL.COLOR_ATTACHMENT0, @mGL.TEXTURE_CUBE_MAP_POSITIVE_X + face, fbo.mTex0.mObjectID, 0

    blitRenderTarget: (dst, src) ->
        @mGL.bindFramebuffer @mGL.READ_FRAMEBUFFER, src.mObjectID
        @mGL.bindFramebuffer @mGL.DRAW_FRAMEBUFFER, dst.mObjectID
        @mGL.clearBufferfv @mGL.COLOR, 0, [ 0 0 0 1 ]
        @mGL.blitFramebuffer 0, 0, src.mXres, src.mYres, 0, 0, src.mXres, src.mYres, @mGL.COLOR_BUFFER_BIT, @mGL.LINEAR

    setViewport: (vp) ->
        @mGL.viewport vp[0], vp[1], vp[2], vp[3]

    setWriteMask: (c0, c1, c2, c3, z) ->
        @mGL.depthMask z
        @mGL.colorMask c0, c0, c0, c0

    setState: (stateName, stateValue) ->
        if stateName == Renderer.RENDSTGATE.WIREFRAME
            if stateValue
                @mGL.polygonMode @mGL.FRONT_AND_BACK, @mGL.LINE
            else
                @mGL.polygonMode @mGL.FRONT_AND_BACK, @mGL.FILL
        else if stateName == Renderer.RENDSTGATE.FRONT_FACE
            if stateValue
                @mGL.cullFace @mGL.BACK
            else
                @mGL.cullFace @mGL.FRONT
        else if stateName == Renderer.RENDSTGATE.CULL_FACE
            if stateValue
                @mGL.enable @mGL.CULL_FACE
            else
                @mGL.disable @mGL.CULL_FACE
        else if stateName == Renderer.RENDSTGATE.DEPTH_TEST
            if stateValue
                @mGL.enable @mGL.DEPTH_TEST
            else
                @mGL.disable @mGL.DEPTH_TEST
        else if stateName == Renderer.RENDSTGATE.ALPHA_TO_COVERAGE
            if stateValue
                @mGL.enable @mGL.SAMPLE_ALPHA_TO_COVERAGE
            else
                @mGL.disable @mGL.SAMPLE_ALPHA_TO_COVERAGE

    setMultisample: (v) ->
        if v == true
            @mGL.enable @mGL.SAMPLE_COVERAGE
            @mGL.sampleCoverage 1.0, false
        else
            @mGL.disable @mGL.SAMPLE_COVERAGE

    createShader: (vsSource, fsSource) ->
        if @mGL == null
            return 
                mProgram: null
                mResult: false
                mInfo: 'No WebGL'
                mHeaderLines: 0
        te = 
            mProgram: null
            mResult: true
            mInfo: 'Shader compiled successfully'
            mHeaderLines: 0
            mErrorType: 0
        vs = @mGL.createShader(@mGL.VERTEX_SHADER)
        fs = @mGL.createShader(@mGL.FRAGMENT_SHADER)
        mShaderHeader = '#version 300 es\n' + '#ifdef GL_ES\n' + 'precision highp float;\n' + 'precision highp int;\n' + 'precision mediump sampler3D;\n' + '#endif\n'
        @mGL.shaderSource vs, mShaderHeader + vsSource
        @mGL.shaderSource fs, mShaderHeader + fsSource
        @mGL.compileShader vs
        @mGL.compileShader fs
        if not @mGL.getShaderParameter(vs, @mGL.COMPILE_STATUS)
            infoLog = @mGL.getShaderInfoLog(vs)
            te.mInfo = infoLog
            te.mErrorType = 0
            te.mResult = false
            return te
        if not @mGL.getShaderParameter(fs, @mGL.COMPILE_STATUS)
            infoLog = @mGL.getShaderInfoLog(fs)
            te.mInfo = infoLog
            te.mErrorType = 1
            te.mResult = false
            return te
        te.mProgram = @mGL.createProgram()
        @mGL.attachShader te.mProgram, vs
        @mGL.attachShader te.mProgram, fs
        @mGL.linkProgram te.mProgram
        if not @mGL.getProgramParameter(te.mProgram, @mGL.LINK_STATUS)
            infoLog = @mGL.getProgramInfoLog(te.mProgram)
            @mGL.deleteProgram te.mProgram
            te.mInfo = infoLog
            te.mErrorType = 2
            te.mResult = false
        te

    attachShader: (shader) ->
        @mBindedShader = shader
        @mGL.useProgram shader?.mProgram

    detachShader: -> @mGL.useProgram null

    destroyShader: (program) -> @mGL.deleteProgram program

    getAttribLocation: (shader, name) ->
        @mGL.getAttribLocation shader.mProgram, name

    setShaderConstantLocation: (shader, name) ->
        @mGL.getUniformLocation shader.mProgram, name

    setShaderConstant1F_Pos: (pos, x) ->
        @mGL.uniform1f pos, x
        true

    setShaderConstant1FV_Pos: (pos, x) ->
        @mGL.uniform1fv pos, x
        true

    setShaderConstant1F: (uname, x) ->
        pos = @mGL.getUniformLocation(@mBindedShader.mProgram, uname)
        if pos == null
            return false
        @mGL.uniform1f pos, x
        true

    setShaderConstant1I: (uname, x) ->
        pos = @mGL.getUniformLocation(@mBindedShader.mProgram, uname)
        if pos == null
            return false
        @mGL.uniform1i pos, x
        true

    setShaderConstant2F: (uname, x) ->
        pos = @mGL.getUniformLocation(@mBindedShader.mProgram, uname)
        if pos == null
            return false
        @mGL.uniform2fv pos, x
        true

    setShaderConstant3F: (uname, x, y, z) ->
        pos = @mGL.getUniformLocation(@mBindedShader.mProgram, uname)
        if pos == null
            return false
        @mGL.uniform3f pos, x, y, z
        true

    setShaderConstant1FV: (uname, x) ->
        pos = @mGL.getUniformLocation(@mBindedShader.mProgram, uname)
        if pos == null
            return false
        @mGL.uniform1fv pos, new Float32Array(x)
        true

    setShaderConstant3FV: (uname, x) ->
        pos = @mGL.getUniformLocation(@mBindedShader.mProgram, uname)
        if pos == null
            return false
        @mGL.uniform3fv pos, new Float32Array(x)
        true

    setShaderConstant4FV: (uname, x) ->
        pos = @mGL.getUniformLocation(@mBindedShader.mProgram, uname)
        if pos == null
            return false
        @mGL.uniform4fv pos, new Float32Array(x)
        true

    setShaderTextureUnit: (uname, unit) ->
        program = @mBindedShader
        pos = @mGL.getUniformLocation(program.mProgram, uname)
        if pos == null
            return false
        @mGL.uniform1i pos, unit
        true

    createVertexArray: (data, mode) ->
        id = @mGL.createBuffer()
        @mGL.bindBuffer @mGL.ARRAY_BUFFER, id
        if mode == me.BUFTYPE.STATIC
            @mGL.bufferData @mGL.ARRAY_BUFFER, data, @mGL.STATIC_DRAW
        else
            @mGL.bufferData @mGL.ARRAY_BUFFER, data, @mGL.DYNAMIC_DRAW
        return mObject:id

    createIndexArray: (data, mode) ->
        id = @mGL.createBuffer()
        @mGL.bindBuffer @mGL.ELEMENT_ARRAY_BUFFER, id
        if mode == me.BUFTYPE.STATIC
            @mGL.bufferData @mGL.ELEMENT_ARRAY_BUFFER, data, @mGL.STATIC_DRAW
        else
            @mGL.bufferData @mGL.ELEMENT_ARRAY_BUFFER, data, @mGL.DYNAMIC_DRAW
        return mObject:id

    destroyArray: (tex) -> @mGL.destroyBuffer tex.mObject

    attachVertexArray: (tex, attribs, pos) ->
        shader = @mBindedShader
        @mGL.bindBuffer @mGL.ARRAY_BUFFER, tex.mObject
        num = attribs.mChannels.length
        stride = attribs.mStride
        offset = 0
        i = 0
        while i < num
            id = pos[i]
            @mGL.enableVertexAttribArray id
            dtype = @mGL.FLOAT
            dsize = 4
            if attribs.mChannels[i].mType == me.TYPE.UINT8
                dtype = @mGL.UNSIGNED_BYTE
                dsize = 1
            else if attribs.mChannels[i].mType == me.TYPE.UINT16
                dtype = @mGL.UNSIGNED_SHORT
                dsize = 2
            else if attribs.mChannels[i].mType == me.TYPE.FLOAT32
                dtype = @mGL.FLOAT
                dsize = 4
            @mGL.vertexAttribPointer id, attribs.mChannels[i].mNumComponents, dtype, attribs.mChannels[i].mNormalize, stride, offset
            offset += attribs.mChannels[i].mNumComponents * dsize
            i++

    attachIndexArray: (tex) ->
        @mGL.bindBuffer @mGL.ELEMENT_ARRAY_BUFFER, tex.mObject

    detachVertexArray: (tex, attribs) ->
        num = attribs.mChannels.length
        i = 0
        while i < num
            @mGL.disableVertexAttribArray i
            i++
        @mGL.bindBuffer @mGL.ARRAY_BUFFER, null

    detachIndexArray: (tex) ->
        @mGL.bindBuffer @mGL.ELEMENT_ARRAY_BUFFER, null

    drawPrimitive: (typeOfPrimitive, num, useIndexArray, numInstances) ->
        glType = @mGL.POINTS
        if typeOfPrimitive == me.PRIMTYPE.POINTS
            glType = @mGL.POINTS
        if typeOfPrimitive == me.PRIMTYPE.LINES
            glType = @mGL.LINES
        if typeOfPrimitive == me.PRIMTYPE.LINE_LOOP
            glType = @mGL.LINE_LOOP
        if typeOfPrimitive == me.PRIMTYPE.LINE_STRIP
            glType = @mGL.LINE_STRIP
        if typeOfPrimitive == me.PRIMTYPE.TRIANGLES
            glType = @mGL.TRIANGLES
        if typeOfPrimitive == me.PRIMTYPE.TRIANGLE_STRIP
            glType = @mGL.TRIANGLE_STRIP
        if numInstances <= 1
            if useIndexArray
                @mGL.drawElements glType, num, @mGL.UNSIGNED_SHORT, 0
            else
                @mGL.drawArrays glType, 0, num
        else
            @mGL.drawArraysInstanced glType, 0, num, numInstances
            @mGL.drawElementsInstanced glType, num, @mGL.UNSIGNED_SHORT, 0, numInstances

    drawFullScreenTriangle_XY: (vpos) ->
        @mGL.bindBuffer @mGL.ARRAY_BUFFER, @mVBO_Tri
        @mGL.vertexAttribPointer vpos, 2, @mGL.FLOAT, false, 0, 0
        @mGL.enableVertexAttribArray vpos
        @mGL.drawArrays @mGL.TRIANGLES, 0, 3
        @mGL.disableVertexAttribArray vpos
        @mGL.bindBuffer @mGL.ARRAY_BUFFER, null

    drawUnitQuad_XY: (vpos) ->
        @mGL.bindBuffer @mGL.ARRAY_BUFFER, @mVBO_Quad
        @mGL.vertexAttribPointer vpos, 2, @mGL.FLOAT, false, 0, 0
        @mGL.enableVertexAttribArray vpos
        @mGL.drawArrays @mGL.TRIANGLES, 0, 6
        @mGL.disableVertexAttribArray vpos
        @mGL.bindBuffer @mGL.ARRAY_BUFFER, null

    setBlend: (enabled) ->
        if enabled
            @mGL.enable @mGL.BLEND
            @mGL.blendEquationSeparate @mGL.FUNC_ADD, @mGL.FUNC_ADD
            @mGL.blendFuncSeparate @mGL.SRC_ALPHA, @mGL.ONE_MINUS_SRC_ALPHA, @mGL.ONE, @mGL.ONE_MINUS_SRC_ALPHA
        else
            @mGL.disable @mGL.BLEND

    getPixelData: (data, offset, xres, yres) ->
        @mGL.readPixels 0, 0, xres, yres, @mGL.RGBA, @mGL.UNSIGNED_BYTE, data, offset

    getPixelDataRenderTarget: (obj, data, xres, yres) ->
        @mGL.bindFramebuffer @mGL.FRAMEBUFFER, obj.mObjectID
        @mGL.readBuffer @mGL.COLOR_ATTACHMENT0
        @mGL.readPixels 0, 0, xres, yres, @mGL.RGBA, @mGL.FLOAT, data, 0
        @mGL.bindFramebuffer @mGL.FRAMEBUFFER, null

    @createGlContext: (cv) ->
        cv.getContext 'webgl2', 
            alpha: false
            depth: false
            stencil: false
            premultipliedAlpha: false
            antialias: false
            preserveDrawingBuffer: false
            powerPreference: 'high-performance' 
            # "low_power", "high_performance", "default"
            
module.exports = Renderer