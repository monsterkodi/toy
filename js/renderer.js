// koffee 1.6.0
var Renderer;

Renderer = (function() {
    function Renderer(mGL1) {
        var extensions, maxCubeSize, maxRenderbufferSize, maxTexSize, textureUnits, vertices;
        this.mGL = mGL1;
        this.iMouse = [0, 0, 0, 0];
        this.mFloat32Textures = true;
        this.mFloat32Filter = this.mGL.getExtension('OES_texture_float_linear');
        this.mFloat16Textures = true;
        this.mFloat16Filter = this.mGL.getExtension('OES_texture_half_float_linear');
        this.mDerivatives = true;
        this.mDrawBuffers = true;
        this.mDepthTextures = true;
        this.mAnisotropic = this.mGL.getExtension('EXT_texture_filter_anisotropic');
        this.mRenderToFloat32F = this.mGL.getExtension('EXT_color_buffer_float');
        maxTexSize = this.mGL.getParameter(this.mGL.MAX_TEXTURE_SIZE);
        maxCubeSize = this.mGL.getParameter(this.mGL.MAX_CUBE_MAP_TEXTURE_SIZE);
        maxRenderbufferSize = this.mGL.getParameter(this.mGL.MAX_RENDERBUFFER_SIZE);
        extensions = this.mGL.getSupportedExtensions();
        textureUnits = this.mGL.getParameter(this.mGL.MAX_TEXTURE_IMAGE_UNITS);
        console.log('WebGL:' + ' F32 Textures: ' + (this.mFloat32Textures !== null ? 'yes' : 'no') + ', Render to 32F: ' + (this.mRenderToFloat32F !== null ? 'yes' : 'no') + ', Max Texture Size: ' + maxTexSize + ', Max Render Buffer Size: ' + maxRenderbufferSize + ', Max Cubemap Size: ' + maxCubeSize);
        vertices = new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0]);
        this.mVBO_Quad = this.mGL.createBuffer();
        this.mGL.bindBuffer(this.mGL.ARRAY_BUFFER, this.mVBO_Quad);
        this.mGL.bufferData(this.mGL.ARRAY_BUFFER, vertices, this.mGL.STATIC_DRAW);
        this.mGL.bindBuffer(this.mGL.ARRAY_BUFFER, null);
        this.mVBO_Tri = this.mGL.createBuffer();
        this.mGL.bindBuffer(this.mGL.ARRAY_BUFFER, this.mVBO_Tri);
        this.mGL.bufferData(this.mGL.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, 3.0, -1.0, -1.0, 3.0]), this.mGL.STATIC_DRAW);
        this.mGL.bindBuffer(this.mGL.ARRAY_BUFFER, null);
        this.mVBO_CubePosNor = this.mGL.createBuffer();
        this.mGL.bindBuffer(this.mGL.ARRAY_BUFFER, this.mVBO_CubePosNor);
        this.mGL.bufferData(this.mGL.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, -1.0, -1.0, 0.0, 0.0, -1.0, -1.0, 1.0, -1.0, 0.0, 0.0, -1.0, 1.0, -1.0, -1.0, 0.0, 0.0, -1.0, 1.0, 1.0, -1.0, 0.0, 0.0, 1.0, 1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, -1.0, -1.0, 1.0, 0.0, 0.0, 1.0, -1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 1.0, -1.0, 0.0, 1.0, 0.0, -1.0, 1.0, 1.0, 0.0, 1.0, 0.0, -1.0, 1.0, -1.0, 0.0, 1.0, 0.0, 1.0, -1.0, -1.0, 0.0, -1.0, 0.0, 1.0, -1.0, 1.0, 0.0, -1.0, 0.0, -1.0, -1.0, -1.0, 0.0, -1.0, 0.0, -1.0, -1.0, 1.0, 0.0, -1.0, 0.0, -1.0, 1.0, 1.0, 0.0, 0.0, 1.0, -1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, -1.0, 1.0, 0.0, 0.0, 1.0, -1.0, -1.0, -1.0, 0.0, 0.0, -1.0, -1.0, 1.0, -1.0, 0.0, 0.0, -1.0, 1.0, -1.0, -1.0, 0.0, 0.0, -1.0, 1.0, 1.0, -1.0, 0.0, 0.0, -1.0]), this.mGL.STATIC_DRAW);
        this.mGL.bindBuffer(this.mGL.ARRAY_BUFFER, null);
        this.mVBO_CubePos = this.mGL.createBuffer();
        this.mGL.bindBuffer(this.mGL.ARRAY_BUFFER, this.mVBO_CubePos);
        this.mGL.bufferData(this.mGL.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0]), this.mGL.STATIC_DRAW);
        this.mGL.bindBuffer(this.mGL.ARRAY_BUFFER, null);
    }

    Renderer.CLEAR = {
        Color: 1,
        Zbuffer: 2,
        Stencil: 4
    };

    Renderer.TEXFMT = {
        C4I8: 0,
        C1I8: 1,
        C1F16: 2,
        C4F16: 3,
        C1F32: 4,
        C4F32: 5,
        Z16: 6,
        Z24: 7,
        Z32: 8,
        C3F32: 9
    };

    Renderer.TEXWRP = {
        CLAMP: 0,
        REPEAT: 1
    };

    Renderer.BUFTYPE = {
        STATIC: 0,
        DYNAMIC: 1
    };

    Renderer.PRIMTYPE = {
        POINTS: 0,
        LINES: 1,
        LINE_LOOP: 2,
        LINE_STRIP: 3,
        TRIANGLES: 4,
        TRIANGLE_STRIP: 5
    };

    Renderer.RENDSTGATE = {
        WIREFRAME: 0,
        FRONT_FACE: 1,
        CULL_FACE: 2,
        DEPTH_TEST: 3,
        ALPHA_TO_COVERAGE: 4
    };

    Renderer.TEXTYPE = {
        T2D: 0,
        T3D: 1,
        CUBEMAP: 2
    };

    Renderer.FILTER = {
        NONE: 0,
        LINEAR: 1,
        MIPMAP: 2,
        NONE_MIPMAP: 3
    };

    Renderer.TYPE = {
        UINT8: 0,
        UINT16: 1,
        UINT32: 2,
        FLOAT16: 3,
        FLOAT32: 4,
        FLOAT64: 5
    };

    Renderer.prototype.iFormatPI2GL = function(format) {
        switch (format) {
            case Renderer.TEXFMT.C4I8:
                return {
                    mGLFormat: this.mGL.RGBA8,
                    mGLExternal: this.mGL.RGBA,
                    mGLType: this.mGL.UNSIGNED_BYTE
                };
            case Renderer.TEXFMT.C1I8:
                return {
                    mGLFormat: this.mGL.R8,
                    mGLExternal: this.mGL.RED,
                    mGLType: this.mGL.UNSIGNED_BYTE
                };
            case Renderer.TEXFMT.C1F16:
                return {
                    mGLFormat: this.mGL.R16F,
                    mGLExternal: this.mGL.RED,
                    mGLType: this.mGL.FLOAT
                };
            case Renderer.TEXFMT.C4F16:
                return {
                    mGLFormat: this.mGL.RGBA16F,
                    mGLExternal: this.mGL.RGBA,
                    mGLType: this.mGL.FLOAT
                };
            case Renderer.TEXFMT.C1F32:
                return {
                    mGLFormat: this.mGL.R32F,
                    mGLExternal: this.mGL.RED,
                    mGLType: this.mGL.FLOAT
                };
            case Renderer.TEXFMT.C4F32:
                return {
                    mGLFormat: this.mGL.RGBA32F,
                    mGLExternal: this.mGL.RGBA,
                    mGLType: this.mGL.FLOAT
                };
            case Renderer.TEXFMT.C3F32:
                return {
                    mGLFormat: this.mGL.RGB32F,
                    mGLExternal: this.mGL.RGB,
                    mGLType: this.mGL.FLOAT
                };
            case Renderer.TEXFMT.Z16:
                return {
                    mGLFormat: this.mGL.DEPTH_COMPONENT16,
                    mGLExternal: this.mGL.DEPTH_COMPONENT,
                    mGLType: this.mGL.UNSIGNED_SHORT
                };
            case Renderer.TEXFMT.Z24:
                return {
                    mGLFormat: this.mGL.DEPTH_COMPONENT24,
                    mGLExternal: this.mGL.DEPTH_COMPONENT,
                    mGLType: this.mGL.UNSIGNED_SHORT
                };
            case Renderer.TEXFMT.Z32:
                return {
                    mGLFormat: this.mGL.DEPTH_COMPONENT32F,
                    mGLExternal: this.mGL.DEPTH_COMPONENT,
                    mGLType: this.mGL.UNSIGNED_SHORT
                };
            default:
                return null;
        }
    };

    Renderer.prototype.checkErrors = function() {
        var error, prop, results;
        error = this.mGL.getError();
        if (error !== this.mGL.NO_ERROR) {
            results = [];
            for (prop in this.mGL) {
                if (typeof this.mGL[prop] === 'number') {
                    if (this.mGL[prop] === error) {
                        console.log('GL Error ' + error + ': ' + prop);
                        break;
                    } else {
                        results.push(void 0);
                    }
                } else {
                    results.push(void 0);
                }
            }
            return results;
        }
    };

    Renderer.prototype.clear = function(flags, ccolor, cdepth, cstencil) {
        var mode;
        mode = 0;
        if (flags & 1) {
            mode |= this.mGL.COLOR_BUFFER_BIT;
            this.mGL.clearColor(ccolor[0], ccolor[1], ccolor[2], ccolor[3]);
        }
        if (flags & 2) {
            mode |= this.mGL.DEPTH_BUFFER_BIT;
            this.mGL.clearDepth(cdepth);
        }
        if (flags & 4) {
            mode |= this.mGL.STENCIL_BUFFER_BIT;
            this.mGL.clearStencil(cstencil);
        }
        return this.mGL.clear(mode);
    };

    Renderer.prototype.createTexture = function(type, xres, yres, format, filter, wrap, buffer) {
        var glFoTy, glWrap, id;
        if (!this.mGL) {
            return;
        }
        id = this.mGL.createTexture();
        glFoTy = this.iFormatPI2GL(format);
        glWrap = this.mGL.REPEAT;
        if (wrap === Renderer.TEXWRP.CLAMP) {
            glWrap = this.mGL.CLAMP_TO_EDGE;
        }
        if (type === Renderer.TEXTYPE.T2D) {
            this.mGL.bindTexture(this.mGL.TEXTURE_2D, id);
            this.mGL.texImage2D(this.mGL.TEXTURE_2D, 0, glFoTy.mGLFormat, xres, yres, 0, glFoTy.mGLExternal, glFoTy.mGLType, buffer);
            this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_WRAP_S, glWrap);
            this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_WRAP_T, glWrap);
            if (filter === Renderer.FILTER.NONE) {
                this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_MAG_FILTER, this.mGL.NEAREST);
                this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_MIN_FILTER, this.mGL.NEAREST);
            } else if (filter === Renderer.FILTER.LINEAR) {
                this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_MAG_FILTER, this.mGL.LINEAR);
                this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_MIN_FILTER, this.mGL.LINEAR);
            } else if (filter === Renderer.FILTER.MIPMAP) {
                this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_MAG_FILTER, this.mGL.LINEAR);
                this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_MIN_FILTER, this.mGL.LINEAR_MIPMAP_LINEAR);
                this.mGL.generateMipmap(this.mGL.TEXTURE_2D);
            } else {
                this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_MAG_FILTER, this.mGL.NEAREST);
                this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_MIN_FILTER, this.mGL.NEAREST_MIPMAP_LINEAR);
                this.mGL.generateMipmap(this.mGL.TEXTURE_2D);
            }
            this.mGL.bindTexture(this.mGL.TEXTURE_2D, null);
        } else if (type === Renderer.TEXTYPE.T3D) {
            this.mGL.bindTexture(this.mGL.TEXTURE_3D, id);
            this.mGL.texParameteri(this.mGL.TEXTURE_3D, this.mGL.TEXTURE_BASE_LEVEL, 0);
            this.mGL.texParameteri(this.mGL.TEXTURE_3D, this.mGL.TEXTURE_MAX_LEVEL, Math.log2(xres));
            if (filter === Renderer.FILTER.NONE) {
                this.mGL.texParameteri(this.mGL.TEXTURE_3D, this.mGL.TEXTURE_MAG_FILTER, this.mGL.NEAREST);
                this.mGL.texParameteri(this.mGL.TEXTURE_3D, this.mGL.TEXTURE_MIN_FILTER, this.mGL.NEAREST);
            } else if (filter === Renderer.FILTER.LINEAR) {
                this.mGL.texParameteri(this.mGL.TEXTURE_3D, this.mGL.TEXTURE_MAG_FILTER, this.mGL.LINEAR);
                this.mGL.texParameteri(this.mGL.TEXTURE_3D, this.mGL.TEXTURE_MIN_FILTER, this.mGL.LINEAR);
            } else if (filter === Renderer.FILTER.MIPMAP) {
                this.mGL.texParameteri(this.mGL.TEXTURE_3D, this.mGL.TEXTURE_MAG_FILTER, this.mGL.LINEAR);
                this.mGL.texParameteri(this.mGL.TEXTURE_3D, this.mGL.TEXTURE_MIN_FILTER, this.mGL.LINEAR_MIPMAP_LINEAR);
            } else {
                this.mGL.texParameteri(this.mGL.TEXTURE_3D, this.mGL.TEXTURE_MAG_FILTER, this.mGL.NEAREST);
                this.mGL.texParameteri(this.mGL.TEXTURE_3D, this.mGL.TEXTURE_MIN_FILTER, this.mGL.NEAREST_MIPMAP_LINEAR);
                this.mGL.generateMipmap(this.mGL.TEXTURE_3D);
            }
            this.mGL.texImage3D(this.mGL.TEXTURE_3D, 0, glFoTy.mGLFormat, xres, yres, yres, 0, glFoTy.mGLExternal, glFoTy.mGLType, buffer);
            this.mGL.texParameteri(this.mGL.TEXTURE_3D, this.mGL.TEXTURE_WRAP_R, glWrap);
            this.mGL.texParameteri(this.mGL.TEXTURE_3D, this.mGL.TEXTURE_WRAP_S, glWrap);
            this.mGL.texParameteri(this.mGL.TEXTURE_3D, this.mGL.TEXTURE_WRAP_T, glWrap);
            if (filter === Renderer.FILTER.MIPMAP) {
                this.mGL.generateMipmap(this.mGL.TEXTURE_3D);
            }
            this.mGL.bindTexture(this.mGL.TEXTURE_3D, null);
        } else {
            this.mGL.bindTexture(this.mGL.TEXTURE_CUBE_MAP, id);
            this.mGL.texImage2D(this.mGL.TEXTURE_CUBE_MAP_POSITIVE_X, 0, glFoTy.mGLFormat, xres, yres, 0, glFoTy.mGLExternal, glFoTy.mGLType, buffer);
            this.mGL.texImage2D(this.mGL.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, glFoTy.mGLFormat, xres, yres, 0, glFoTy.mGLExternal, glFoTy.mGLType, buffer);
            this.mGL.texImage2D(this.mGL.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, glFoTy.mGLFormat, xres, yres, 0, glFoTy.mGLExternal, glFoTy.mGLType, buffer);
            this.mGL.texImage2D(this.mGL.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, glFoTy.mGLFormat, xres, yres, 0, glFoTy.mGLExternal, glFoTy.mGLType, buffer);
            this.mGL.texImage2D(this.mGL.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, glFoTy.mGLFormat, xres, yres, 0, glFoTy.mGLExternal, glFoTy.mGLType, buffer);
            this.mGL.texImage2D(this.mGL.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, glFoTy.mGLFormat, xres, yres, 0, glFoTy.mGLExternal, glFoTy.mGLType, buffer);
            if (filter === Renderer.FILTER.NONE) {
                this.mGL.texParameteri(this.mGL.TEXTURE_CUBE_MAP, this.mGL.TEXTURE_MAG_FILTER, this.mGL.NEAREST);
                this.mGL.texParameteri(this.mGL.TEXTURE_CUBE_MAP, this.mGL.TEXTURE_MIN_FILTER, this.mGL.NEAREST);
            } else if (filter === Renderer.FILTER.LINEAR) {
                this.mGL.texParameteri(this.mGL.TEXTURE_CUBE_MAP, this.mGL.TEXTURE_MAG_FILTER, this.mGL.LINEAR);
                this.mGL.texParameteri(this.mGL.TEXTURE_CUBE_MAP, this.mGL.TEXTURE_MIN_FILTER, this.mGL.LINEAR);
            } else if (filter === Renderer.FILTER.MIPMAP) {
                this.mGL.texParameteri(this.mGL.TEXTURE_CUBE_MAP, this.mGL.TEXTURE_MAG_FILTER, this.mGL.LINEAR);
                this.mGL.texParameteri(this.mGL.TEXTURE_CUBE_MAP, this.mGL.TEXTURE_MIN_FILTER, this.mGL.LINEAR_MIPMAP_LINEAR);
            }
            if (filter === Renderer.FILTER.MIPMAP) {
                this.mGL.generateMipmap(this.mGL.TEXTURE_CUBE_MAP);
            }
            this.mGL.bindTexture(this.mGL.TEXTURE_CUBE_MAP, null);
        }
        return {
            mObjectID: id,
            mXres: xres,
            mYres: yres,
            mFormat: format,
            mType: type,
            mFilter: filter,
            mWrap: wrap
        };
    };

    Renderer.prototype.createTextureFromImage = function(type, image, format, filter, wrap, flipY) {
        var glFoTy, glWrap, id;
        if (this.mGL === null) {
            return null;
        }
        id = this.mGL.createTexture();
        glFoTy = this.iFormatPI2GL(format);
        glWrap = this.mGL.REPEAT;
        if (wrap === Renderer.TEXWRP.CLAMP) {
            glWrap = this.mGL.CLAMP_TO_EDGE;
        }
        if (type === Renderer.TEXTYPE.T2D) {
            this.mGL.bindTexture(this.mGL.TEXTURE_2D, id);
            this.mGL.pixelStorei(this.mGL.UNPACK_FLIP_Y_WEBGL, flipY);
            this.mGL.pixelStorei(this.mGL.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
            this.mGL.pixelStorei(this.mGL.UNPACK_COLORSPACE_CONVERSION_WEBGL, this.mGL.NONE);
            this.mGL.texImage2D(this.mGL.TEXTURE_2D, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, image);
            this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_WRAP_S, glWrap);
            this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_WRAP_T, glWrap);
            if (filter === Renderer.FILTER.NONE) {
                this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_MAG_FILTER, this.mGL.NEAREST);
                this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_MIN_FILTER, this.mGL.NEAREST);
            } else if (filter === Renderer.FILTER.LINEAR) {
                this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_MAG_FILTER, this.mGL.LINEAR);
                this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_MIN_FILTER, this.mGL.LINEAR);
            } else if (filter === Renderer.FILTER.MIPMAP) {
                this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_MAG_FILTER, this.mGL.LINEAR);
                this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_MIN_FILTER, this.mGL.LINEAR_MIPMAP_LINEAR);
                this.mGL.generateMipmap(this.mGL.TEXTURE_2D);
            } else {
                this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_MAG_FILTER, this.mGL.LINEAR);
                this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_MIN_FILTER, this.mGL.NEAREST_MIPMAP_LINEAR);
                this.mGL.generateMipmap(this.mGL.TEXTURE_2D);
            }
            this.mGL.bindTexture(this.mGL.TEXTURE_2D, null);
        } else if (type === Renderer.TEXTYPE.T3D) {
            return null;
        } else {
            this.mGL.bindTexture(this.mGL.TEXTURE_CUBE_MAP, id);
            this.mGL.pixelStorei(this.mGL.UNPACK_FLIP_Y_WEBGL, flipY);
            this.mGL.activeTexture(this.mGL.TEXTURE0);
            this.mGL.texImage2D(this.mGL.TEXTURE_CUBE_MAP_POSITIVE_X, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, image[0]);
            this.mGL.texImage2D(this.mGL.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, image[1]);
            this.mGL.texImage2D(this.mGL.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, flipY ? image[3] : image[2]);
            this.mGL.texImage2D(this.mGL.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, flipY ? image[2] : image[3]);
            this.mGL.texImage2D(this.mGL.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, image[4]);
            this.mGL.texImage2D(this.mGL.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, image[5]);
            if (filter === Renderer.FILTER.NONE) {
                this.mGL.texParameteri(this.mGL.TEXTURE_CUBE_MAP, this.mGL.TEXTURE_MAG_FILTER, this.mGL.NEAREST);
                this.mGL.texParameteri(this.mGL.TEXTURE_CUBE_MAP, this.mGL.TEXTURE_MIN_FILTER, this.mGL.NEAREST);
            } else if (filter === Renderer.FILTER.LINEAR) {
                this.mGL.texParameteri(this.mGL.TEXTURE_CUBE_MAP, this.mGL.TEXTURE_MAG_FILTER, this.mGL.LINEAR);
                this.mGL.texParameteri(this.mGL.TEXTURE_CUBE_MAP, this.mGL.TEXTURE_MIN_FILTER, this.mGL.LINEAR);
            } else if (filter === Renderer.FILTER.MIPMAP) {
                this.mGL.texParameteri(this.mGL.TEXTURE_CUBE_MAP, this.mGL.TEXTURE_MAG_FILTER, this.mGL.LINEAR);
                this.mGL.texParameteri(this.mGL.TEXTURE_CUBE_MAP, this.mGL.TEXTURE_MIN_FILTER, this.mGL.LINEAR_MIPMAP_LINEAR);
                this.mGL.generateMipmap(this.mGL.TEXTURE_CUBE_MAP);
            }
            this.mGL.bindTexture(this.mGL.TEXTURE_CUBE_MAP, null);
        }
        return {
            mObjectID: id,
            mXres: image.width,
            mYres: image.height,
            mFormat: format,
            mType: type,
            mFilter: filter,
            mWrap: wrap
        };
    };

    Renderer.prototype.setSamplerFilter = function(te, filter, doGenerateMipsIfNeeded) {
        if (te.mFilter === filter) {
            return;
        }
        if (te.mType === Renderer.TEXTYPE.T2D) {
            this.mGL.bindTexture(this.mGL.TEXTURE_2D, te.mObjectID);
            if (filter === Renderer.FILTER.NONE) {
                this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_MAG_FILTER, this.mGL.NEAREST);
                this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_MIN_FILTER, this.mGL.NEAREST);
            } else if (filter === Renderer.FILTER.LINEAR) {
                this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_MAG_FILTER, this.mGL.LINEAR);
                this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_MIN_FILTER, this.mGL.LINEAR);
            } else if (filter === Renderer.FILTER.MIPMAP) {
                this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_MAG_FILTER, this.mGL.LINEAR);
                this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_MIN_FILTER, this.mGL.LINEAR_MIPMAP_LINEAR);
                if (doGenerateMipsIfNeeded) {
                    this.mGL.generateMipmap(this.mGL.TEXTURE_2D);
                }
            } else {
                this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_MAG_FILTER, this.mGL.NEAREST);
                this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_MIN_FILTER, this.mGL.NEAREST_MIPMAP_LINEAR);
                if (doGenerateMipsIfNeeded) {
                    this.mGL.generateMipmap(this.mGL.TEXTURE_2D);
                }
            }
            this.mGL.bindTexture(this.mGL.TEXTURE_2D, null);
        } else if (te.mType === Renderer.TEXTYPE.T3D) {
            this.mGL.bindTexture(this.mGL.TEXTURE_3D, te.mObjectID);
            if (filter === Renderer.FILTER.NONE) {
                this.mGL.texParameteri(this.mGL.TEXTURE_3D, this.mGL.TEXTURE_MAG_FILTER, this.mGL.NEAREST);
                this.mGL.texParameteri(this.mGL.TEXTURE_3D, this.mGL.TEXTURE_MIN_FILTER, this.mGL.NEAREST);
            } else if (filter === Renderer.FILTER.LINEAR) {
                this.mGL.texParameteri(this.mGL.TEXTURE_3D, this.mGL.TEXTURE_MAG_FILTER, this.mGL.LINEAR);
                this.mGL.texParameteri(this.mGL.TEXTURE_3D, this.mGL.TEXTURE_MIN_FILTER, this.mGL.LINEAR);
            } else if (filter === Renderer.FILTER.MIPMAP) {
                this.mGL.texParameteri(this.mGL.TEXTURE_3D, this.mGL.TEXTURE_MAG_FILTER, this.mGL.LINEAR);
                this.mGL.texParameteri(this.mGL.TEXTURE_3D, this.mGL.TEXTURE_MIN_FILTER, this.mGL.LINEAR_MIPMAP_LINEAR);
                if (doGenerateMipsIfNeeded) {
                    this.mGL.generateMipmap(this.mGL.TEXTURE_3D);
                }
            } else {
                this.mGL.texParameteri(this.mGL.TEXTURE_3D, this.mGL.TEXTURE_MAG_FILTER, this.mGL.NEAREST);
                this.mGL.texParameteri(this.mGL.TEXTURE_3D, this.mGL.TEXTURE_MIN_FILTER, this.mGL.NEAREST_MIPMAP_LINEAR);
                if (doGenerateMipsIfNeeded) {
                    this.mGL.generateMipmap(this.mGL.TEXTURE_3D);
                }
            }
            this.mGL.bindTexture(this.mGL.TEXTURE_3D, null);
        } else {
            this.mGL.bindTexture(this.mGL.TEXTURE_CUBE_MAP, te.mObjectID);
            if (filter === Renderer.FILTER.NONE) {
                this.mGL.texParameteri(this.mGL.TEXTURE_CUBE_MAP, this.mGL.TEXTURE_MAG_FILTER, this.mGL.NEAREST);
                this.mGL.texParameteri(this.mGL.TEXTURE_CUBE_MAP, this.mGL.TEXTURE_MIN_FILTER, this.mGL.NEAREST);
            } else if (filter === Renderer.FILTER.LINEAR) {
                this.mGL.texParameteri(this.mGL.TEXTURE_CUBE_MAP, this.mGL.TEXTURE_MAG_FILTER, this.mGL.LINEAR);
                this.mGL.texParameteri(this.mGL.TEXTURE_CUBE_MAP, this.mGL.TEXTURE_MIN_FILTER, this.mGL.LINEAR);
            } else if (filter === Renderer.FILTER.MIPMAP) {
                this.mGL.texParameteri(this.mGL.TEXTURE_CUBE_MAP, this.mGL.TEXTURE_MAG_FILTER, this.mGL.LINEAR);
                this.mGL.texParameteri(this.mGL.TEXTURE_CUBE_MAP, this.mGL.TEXTURE_MIN_FILTER, this.mGL.LINEAR_MIPMAP_LINEAR);
                if (doGenerateMipsIfNeeded) {
                    this.mGL.generateMipmap(this.mGL.TEXTURE_CUBE_MAP);
                }
            } else {
                this.mGL.texParameteri(this.mGL.TEXTURE_CUBE_MAP, this.mGL.TEXTURE_MAG_FILTER, this.mGL.NEAREST);
                this.mGL.texParameteri(this.mGL.TEXTURE_CUBE_MAP, this.mGL.TEXTURE_MIN_FILTER, this.mGL.NEAREST_MIPMAP_LINEAR);
                if (doGenerateMipsIfNeeded) {
                    this.mGL.generateMipmap(this.mGL.TEXTURE_CUBE_MAP);
                }
            }
            this.mGL.bindTexture(this.mGL.TEXTURE_CUBE_MAP, null);
        }
        return te.mFilter = filter;
    };

    Renderer.prototype.setSamplerWrap = function(te, wrap) {
        var glWrap, id;
        if (te.mWrap === wrap) {
            return;
        }
        glWrap = this.mGL.REPEAT;
        if (wrap === Renderer.TEXWRP.CLAMP) {
            glWrap = this.mGL.CLAMP_TO_EDGE;
        }
        id = te.mObjectID;
        if (te.mType === Renderer.TEXTYPE.T2D) {
            this.mGL.bindTexture(this.mGL.TEXTURE_2D, id);
            this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_WRAP_S, glWrap);
            this.mGL.texParameteri(this.mGL.TEXTURE_2D, this.mGL.TEXTURE_WRAP_T, glWrap);
            this.mGL.bindTexture(this.mGL.TEXTURE_2D, null);
        } else if (te.mType === Renderer.TEXTYPE.T3D) {
            this.mGL.bindTexture(this.mGL.TEXTURE_3D, id);
            this.mGL.texParameteri(this.mGL.TEXTURE_3D, this.mGL.TEXTURE_WRAP_R, glWrap);
            this.mGL.texParameteri(this.mGL.TEXTURE_3D, this.mGL.TEXTURE_WRAP_S, glWrap);
            this.mGL.texParameteri(this.mGL.TEXTURE_3D, this.mGL.TEXTURE_WRAP_T, glWrap);
            this.mGL.bindTexture(this.mGL.TEXTURE_3D, null);
        }
        return te.mWrap = wrap;
    };

    Renderer.prototype.createMipmaps = function(te) {
        if (te.mType === Renderer.TEXTYPE.T2D) {
            this.mGL.activeTexture(this.mGL.TEXTURE0);
            this.mGL.bindTexture(this.mGL.TEXTURE_2D, te.mObjectID);
            this.mGL.generateMipmap(this.mGL.TEXTURE_2D);
            return this.mGL.bindTexture(this.mGL.TEXTURE_2D, null);
        } else if (te.mType === Renderer.TEXTYPE.CUBEMAP) {
            this.mGL.activeTexture(this.mGL.TEXTURE0);
            this.mGL.bindTexture(this.mGL.TEXTURE_CUBE_MAP, te.mObjectID);
            this.mGL.generateMipmap(this.mGL.TEXTURE_CUBE_MAP);
            return this.mGL.bindTexture(this.mGL.TEXTURE_CUBE_MAP, null);
        }
    };

    Renderer.prototype.updateTexture = function(tex, x0, y0, xres, yres, buffer) {
        var glFoTy;
        glFoTy = this.iFormatPI2GL(tex.mFormat);
        if (tex.mType === Renderer.TEXTYPE.T2D) {
            this.mGL.activeTexture(this.mGL.TEXTURE0);
            this.mGL.bindTexture(this.mGL.TEXTURE_2D, tex.mObjectID);
            this.mGL.pixelStorei(this.mGL.UNPACK_FLIP_Y_WEBGL, false);
            this.mGL.texSubImage2D(this.mGL.TEXTURE_2D, 0, x0, y0, xres, yres, glFoTy.mGLExternal, glFoTy.mGLType, buffer);
            return this.mGL.bindTexture(this.mGL.TEXTURE_2D, null);
        }
    };

    Renderer.prototype.updateTextureFromImage = function(tex, image) {
        var glFoTy;
        glFoTy = this.iFormatPI2GL(tex.mFormat);
        if (tex.mType === Renderer.TEXTYPE.T2D) {
            this.mGL.activeTexture(this.mGL.TEXTURE0);
            this.mGL.bindTexture(this.mGL.TEXTURE_2D, tex.mObjectID);
            this.mGL.pixelStorei(this.mGL.UNPACK_FLIP_Y_WEBGL, false);
            this.mGL.texImage2D(this.mGL.TEXTURE_2D, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, image);
            return this.mGL.bindTexture(this.mGL.TEXTURE_2D, null);
        }
    };

    Renderer.prototype.destroyTexture = function(te) {
        if (te != null ? te.mObjectID : void 0) {
            return this.mGL.deleteTexture(te.mObjectID);
        }
    };

    Renderer.prototype.attachTextures = function(num, t0, t1, t2, t3) {
        if (num > 0 && t0 !== null) {
            this.mGL.activeTexture(this.mGL.TEXTURE0);
            if (t0.mType === Renderer.TEXTYPE.T2D) {
                this.mGL.bindTexture(this.mGL.TEXTURE_2D, t0.mObjectID);
            } else if (t0.mType === Renderer.TEXTYPE.T3D) {
                this.mGL.bindTexture(this.mGL.TEXTURE_3D, t0.mObjectID);
            } else if (t0.mType === Renderer.TEXTYPE.CUBEMAP) {
                this.mGL.bindTexture(this.mGL.TEXTURE_CUBE_MAP, t0.mObjectID);
            }
        }
        if (num > 1 && t1 !== null) {
            this.mGL.activeTexture(this.mGL.TEXTURE1);
            if (t1.mType === Renderer.TEXTYPE.T2D) {
                this.mGL.bindTexture(this.mGL.TEXTURE_2D, t1.mObjectID);
            } else if (t1.mType === Renderer.TEXTYPE.T3D) {
                this.mGL.bindTexture(this.mGL.TEXTURE_3D, t1.mObjectID);
            } else if (t1.mType === Renderer.TEXTYPE.CUBEMAP) {
                this.mGL.bindTexture(this.mGL.TEXTURE_CUBE_MAP, t1.mObjectID);
            }
        }
        if (num > 2 && t2 !== null) {
            this.mGL.activeTexture(this.mGL.TEXTURE2);
            if (t2.mType === Renderer.TEXTYPE.T2D) {
                this.mGL.bindTexture(this.mGL.TEXTURE_2D, t2.mObjectID);
            } else if (t2.mType === Renderer.TEXTYPE.T3D) {
                this.mGL.bindTexture(this.mGL.TEXTURE_3D, t2.mObjectID);
            } else if (t2.mType === Renderer.TEXTYPE.CUBEMAP) {
                this.mGL.bindTexture(this.mGL.TEXTURE_CUBE_MAP, t2.mObjectID);
            }
        }
        if (num > 3 && t3 !== null) {
            this.mGL.activeTexture(this.mGL.TEXTURE3);
            if (t3.mType === Renderer.TEXTYPE.T2D) {
                this.mGL.bindTexture(this.mGL.TEXTURE_2D, t3.mObjectID);
            } else if (t3.mType === Renderer.TEXTYPE.T3D) {
                this.mGL.bindTexture(this.mGL.TEXTURE_3D, t3.mObjectID);
            } else if (t3.mType === Renderer.TEXTYPE.CUBEMAP) {
                this.mGL.bindTexture(this.mGL.TEXTURE_CUBE_MAP, t3.mObjectID);
            }
        }
    };

    Renderer.prototype.dettachTextures = function() {
        this.mGL.activeTexture(this.mGL.TEXTURE0);
        this.mGL.bindTexture(this.mGL.TEXTURE_2D, null);
        this.mGL.bindTexture(this.mGL.TEXTURE_CUBE_MAP, null);
        this.mGL.activeTexture(this.mGL.TEXTURE1);
        this.mGL.bindTexture(this.mGL.TEXTURE_2D, null);
        this.mGL.bindTexture(this.mGL.TEXTURE_CUBE_MAP, null);
        this.mGL.activeTexture(this.mGL.TEXTURE2);
        this.mGL.bindTexture(this.mGL.TEXTURE_2D, null);
        this.mGL.bindTexture(this.mGL.TEXTURE_CUBE_MAP, null);
        this.mGL.activeTexture(this.mGL.TEXTURE3);
        this.mGL.bindTexture(this.mGL.TEXTURE_2D, null);
        return this.mGL.bindTexture(this.mGL.TEXTURE_CUBE_MAP, null);
    };

    Renderer.prototype.createRenderTarget = function(color0) {
        var id;
        id = this.mGL.createFramebuffer();
        this.mGL.bindFramebuffer(this.mGL.FRAMEBUFFER, id);
        if (color0) {
            this.mGL.framebufferTexture2D(this.mGL.FRAMEBUFFER, this.mGL.COLOR_ATTACHMENT0, this.mGL.TEXTURE_2D, color0.mObjectID, 0);
        }
        if (this.mGL.checkFramebufferStatus(this.mGL.FRAMEBUFFER) !== this.mGL.FRAMEBUFFER_COMPLETE) {
            return null;
        }
        this.mGL.bindRenderbuffer(this.mGL.RENDERBUFFER, null);
        this.mGL.bindFramebuffer(this.mGL.FRAMEBUFFER, null);
        return {
            mObjectID: id,
            mTex0: color0
        };
    };

    Renderer.prototype.destroyRenderTarget = function(tex) {
        return this.mGL.deleteFramebuffer(tex.mObjectID);
    };

    Renderer.prototype.setRenderTarget = function(tex) {
        return this.mGL.bindFramebuffer(this.mGL.FRAMEBUFFER, tex != null ? tex.mObjectID : void 0);
    };

    Renderer.prototype.createRenderTargetNew = function(wantColor0, wantZbuffer, xres, yres, samples) {
        var cb, id, zb;
        id = this.mGL.createFramebuffer();
        this.mGL.bindFramebuffer(this.mGL.FRAMEBUFFER, id);
        if (wantZbuffer === true) {
            zb = this.mGL.createRenderbuffer();
            this.mGL.bindRenderbuffer(this.mGL.RENDERBUFFER, zb);
            if (samples === 1) {
                this.mGL.renderbufferStorage(this.mGL.RENDERBUFFER, this.mGL.DEPTH_COMPONENT16, xres, yres);
            } else {
                this.mGL.renderbufferStorageMultisample(this.mGL.RENDERBUFFER, samples, this.mGL.DEPTH_COMPONENT16, xres, yres);
            }
            this.mGL.framebufferRenderbuffer(this.mGL.FRAMEBUFFER, this.mGL.DEPTH_ATTACHMENT, this.mGL.RENDERBUFFER, zb);
        }
        if (wantColor0) {
            cb = this.mGL.createRenderbuffer();
            this.mGL.bindRenderbuffer(this.mGL.RENDERBUFFER, cb);
            if (samples === 1) {
                this.mGL.renderbufferStorage(this.mGL.RENDERBUFFER, this.mGL.RGBA8, xres, yres);
            } else {
                this.mGL.renderbufferStorageMultisample(this.mGL.RENDERBUFFER, samples, this.mGL.RGBA8, xres, yres);
            }
            this.mGL.framebufferRenderbuffer(this.mGL.FRAMEBUFFER, this.mGL.COLOR_ATTACHMENT0, this.mGL.RENDERBUFFER, cb);
        }
        if (this.mGL.checkFramebufferStatus(mGL.FRAMEBUFFER) !== this.mGL.FRAMEBUFFER_COMPLETE) {
            return null;
        }
        this.mGL.bindRenderbuffer(this.mGL.RENDERBUFFER, null);
        this.mGL.bindFramebuffer(this.mGL.FRAMEBUFFER, null);
        return {
            mObjectID: id,
            mXres: xres,
            mYres: yres,
            mTex0: color0
        };
    };

    Renderer.prototype.createRenderTargetCubeMap = function(color0) {
        var id;
        id = this.mGL.createFramebuffer();
        this.mGL.bindFramebuffer(this.mGL.FRAMEBUFFER, id);
        this.mGL.framebufferTexture2D(this.mGL.FRAMEBUFFER, this.mGL.DEPTH_ATTACHMENT, this.mGL.TEXTURE_2D, depth.mObjectID, 0);
        if (color0 !== null) {
            this.mGL.framebufferTexture2D(this.mGL.FRAMEBUFFER, this.mGL.COLOR_ATTACHMENT0, this.mGL.TEXTURE_CUBE_MAP_POSITIVE_X, color0.mObjectID, 0);
        }
        if (this.mGL.checkFramebufferStatus(mGL.FRAMEBUFFER) !== this.mGL.FRAMEBUFFER_COMPLETE) {
            return null;
        }
        this.mGL.bindRenderbuffer(this.mGL.RENDERBUFFER, null);
        this.mGL.bindFramebuffer(this.mGL.FRAMEBUFFER, null);
        return {
            mObjectID: id,
            mTex0: color0
        };
    };

    Renderer.prototype.setRenderTargetCubeMap = function(fbo, face) {
        if (fbo === null) {
            return this.mGL.bindFramebuffer(this.mGL.FRAMEBUFFER, null);
        } else {
            this.mGL.bindFramebuffer(this.mGL.FRAMEBUFFER, fbo.mObjectID);
            return this.mGL.framebufferTexture2D(this.mGL.FRAMEBUFFER, this.mGL.COLOR_ATTACHMENT0, this.mGL.TEXTURE_CUBE_MAP_POSITIVE_X + face, fbo.mTex0.mObjectID, 0);
        }
    };

    Renderer.prototype.blitRenderTarget = function(dst, src) {
        this.mGL.bindFramebuffer(this.mGL.READ_FRAMEBUFFER, src.mObjectID);
        this.mGL.bindFramebuffer(this.mGL.DRAW_FRAMEBUFFER, dst.mObjectID);
        this.mGL.clearBufferfv(this.mGL.COLOR, 0, [0, 0, 0, 1]);
        return this.mGL.blitFramebuffer(0, 0, src.mXres, src.mYres, 0, 0, src.mXres, src.mYres, this.mGL.COLOR_BUFFER_BIT, this.mGL.LINEAR);
    };

    Renderer.prototype.setViewport = function(vp) {
        return this.mGL.viewport(vp[0], vp[1], vp[2], vp[3]);
    };

    Renderer.prototype.setWriteMask = function(c0, c1, c2, c3, z) {
        this.mGL.depthMask(z);
        return this.mGL.colorMask(c0, c0, c0, c0);
    };

    Renderer.prototype.setState = function(stateName, stateValue) {
        if (stateName === Renderer.RENDSTGATE.WIREFRAME) {
            if (stateValue) {
                return this.mGL.polygonMode(this.mGL.FRONT_AND_BACK, this.mGL.LINE);
            } else {
                return this.mGL.polygonMode(this.mGL.FRONT_AND_BACK, this.mGL.FILL);
            }
        } else if (stateName === Renderer.RENDSTGATE.FRONT_FACE) {
            if (stateValue) {
                return this.mGL.cullFace(this.mGL.BACK);
            } else {
                return this.mGL.cullFace(this.mGL.FRONT);
            }
        } else if (stateName === Renderer.RENDSTGATE.CULL_FACE) {
            if (stateValue) {
                return this.mGL.enable(this.mGL.CULL_FACE);
            } else {
                return this.mGL.disable(this.mGL.CULL_FACE);
            }
        } else if (stateName === Renderer.RENDSTGATE.DEPTH_TEST) {
            if (stateValue) {
                return this.mGL.enable(this.mGL.DEPTH_TEST);
            } else {
                return this.mGL.disable(this.mGL.DEPTH_TEST);
            }
        } else if (stateName === Renderer.RENDSTGATE.ALPHA_TO_COVERAGE) {
            if (stateValue) {
                return this.mGL.enable(this.mGL.SAMPLE_ALPHA_TO_COVERAGE);
            } else {
                return this.mGL.disable(this.mGL.SAMPLE_ALPHA_TO_COVERAGE);
            }
        }
    };

    Renderer.prototype.setMultisample = function(v) {
        if (v === true) {
            this.mGL.enable(this.mGL.SAMPLE_COVERAGE);
            return this.mGL.sampleCoverage(1.0, false);
        } else {
            return this.mGL.disable(this.mGL.SAMPLE_COVERAGE);
        }
    };

    Renderer.prototype.createShader = function(vsSource, fsSource) {
        var fs, infoLog, mShaderHeader, te, vs;
        if (this.mGL === null) {
            return {
                mProgram: null,
                mResult: false,
                mInfo: 'No WebGL',
                mHeaderLines: 0
            };
        }
        te = {
            mProgram: null,
            mResult: true,
            mInfo: 'Shader compiled successfully',
            mHeaderLines: 0,
            mErrorType: 0
        };
        vs = this.mGL.createShader(this.mGL.VERTEX_SHADER);
        fs = this.mGL.createShader(this.mGL.FRAGMENT_SHADER);
        mShaderHeader = '#version 300 es\n' + '#ifdef GL_ES\n' + 'precision highp float;\n' + 'precision highp int;\n' + 'precision mediump sampler3D;\n' + '#endif\n';
        this.mGL.shaderSource(vs, mShaderHeader + vsSource);
        this.mGL.shaderSource(fs, mShaderHeader + fsSource);
        this.mGL.compileShader(vs);
        this.mGL.compileShader(fs);
        if (!this.mGL.getShaderParameter(vs, this.mGL.COMPILE_STATUS)) {
            infoLog = this.mGL.getShaderInfoLog(vs);
            te.mInfo = infoLog;
            te.mErrorType = 0;
            te.mResult = false;
            return te;
        }
        if (!this.mGL.getShaderParameter(fs, this.mGL.COMPILE_STATUS)) {
            infoLog = this.mGL.getShaderInfoLog(fs);
            te.mInfo = infoLog;
            te.mErrorType = 1;
            te.mResult = false;
            return te;
        }
        te.mProgram = this.mGL.createProgram();
        this.mGL.attachShader(te.mProgram, vs);
        this.mGL.attachShader(te.mProgram, fs);
        this.mGL.linkProgram(te.mProgram);
        if (!this.mGL.getProgramParameter(te.mProgram, this.mGL.LINK_STATUS)) {
            infoLog = this.mGL.getProgramInfoLog(te.mProgram);
            this.mGL.deleteProgram(te.mProgram);
            te.mInfo = infoLog;
            te.mErrorType = 2;
            te.mResult = false;
        }
        return te;
    };

    Renderer.prototype.attachShader = function(shader) {
        this.mBindedShader = shader;
        return this.mGL.useProgram(shader != null ? shader.mProgram : void 0);
    };

    Renderer.prototype.detachShader = function() {
        return this.mGL.useProgram(null);
    };

    Renderer.prototype.destroyShader = function(tex) {
        return this.mGL.deleteProgram(tex.mProgram);
    };

    Renderer.prototype.getAttribLocation = function(shader, name) {
        return this.mGL.getAttribLocation(shader.mProgram, name);
    };

    Renderer.prototype.setShaderConstantLocation = function(shader, name) {
        return this.mGL.getUniformLocation(shader.mProgram, name);
    };

    Renderer.prototype.setShaderConstant1F_Pos = function(pos, x) {
        this.mGL.uniform1f(pos, x);
        return true;
    };

    Renderer.prototype.setShaderConstant1FV_Pos = function(pos, x) {
        this.mGL.uniform1fv(pos, x);
        return true;
    };

    Renderer.prototype.setShaderConstant1F = function(uname, x) {
        var pos;
        pos = this.mGL.getUniformLocation(this.mBindedShader.mProgram, uname);
        if (pos === null) {
            return false;
        }
        this.mGL.uniform1f(pos, x);
        return true;
    };

    Renderer.prototype.setShaderConstant1I = function(uname, x) {
        var pos;
        pos = this.mGL.getUniformLocation(this.mBindedShader.mProgram, uname);
        if (pos === null) {
            return false;
        }
        this.mGL.uniform1i(pos, x);
        return true;
    };

    Renderer.prototype.setShaderConstant2F = function(uname, x) {
        var pos;
        pos = this.mGL.getUniformLocation(this.mBindedShader.mProgram, uname);
        if (pos === null) {
            return false;
        }
        this.mGL.uniform2fv(pos, x);
        return true;
    };

    Renderer.prototype.setShaderConstant3F = function(uname, x, y, z) {
        var pos;
        pos = this.mGL.getUniformLocation(this.mBindedShader.mProgram, uname);
        if (pos === null) {
            return false;
        }
        this.mGL.uniform3f(pos, x, y, z);
        return true;
    };

    Renderer.prototype.setShaderConstant1FV = function(uname, x) {
        var pos;
        pos = this.mGL.getUniformLocation(this.mBindedShader.mProgram, uname);
        if (pos === null) {
            return false;
        }
        this.mGL.uniform1fv(pos, new Float32Array(x));
        return true;
    };

    Renderer.prototype.setShaderConstant3FV = function(uname, x) {
        var pos;
        pos = this.mGL.getUniformLocation(this.mBindedShader.mProgram, uname);
        if (pos === null) {
            return false;
        }
        this.mGL.uniform3fv(pos, new Float32Array(x));
        return true;
    };

    Renderer.prototype.setShaderConstant4FV = function(uname, x) {
        var pos;
        pos = this.mGL.getUniformLocation(this.mBindedShader.mProgram, uname);
        if (pos === null) {
            return false;
        }
        this.mGL.uniform4fv(pos, new Float32Array(x));
        return true;
    };

    Renderer.prototype.setShaderTextureUnit = function(uname, unit) {
        var pos, program;
        program = this.mBindedShader;
        pos = this.mGL.getUniformLocation(program.mProgram, uname);
        if (pos === null) {
            return false;
        }
        this.mGL.uniform1i(pos, unit);
        return true;
    };

    Renderer.prototype.createVertexArray = function(data, mode) {
        var id;
        id = this.mGL.createBuffer();
        this.mGL.bindBuffer(this.mGL.ARRAY_BUFFER, id);
        if (mode === me.BUFTYPE.STATIC) {
            this.mGL.bufferData(this.mGL.ARRAY_BUFFER, data, this.mGL.STATIC_DRAW);
        } else {
            this.mGL.bufferData(this.mGL.ARRAY_BUFFER, data, this.mGL.DYNAMIC_DRAW);
        }
        return {
            mObject: id
        };
    };

    Renderer.prototype.createIndexArray = function(data, mode) {
        var id;
        id = this.mGL.createBuffer();
        this.mGL.bindBuffer(this.mGL.ELEMENT_ARRAY_BUFFER, id);
        if (mode === me.BUFTYPE.STATIC) {
            this.mGL.bufferData(this.mGL.ELEMENT_ARRAY_BUFFER, data, this.mGL.STATIC_DRAW);
        } else {
            this.mGL.bufferData(this.mGL.ELEMENT_ARRAY_BUFFER, data, this.mGL.DYNAMIC_DRAW);
        }
        return {
            mObject: id
        };
    };

    Renderer.prototype.destroyArray = function(tex) {
        return this.mGL.destroyBuffer(tex.mObject);
    };

    Renderer.prototype.attachVertexArray = function(tex, attribs, pos) {
        var dsize, dtype, i, id, num, offset, results, shader, stride;
        shader = this.mBindedShader;
        this.mGL.bindBuffer(this.mGL.ARRAY_BUFFER, tex.mObject);
        num = attribs.mChannels.length;
        stride = attribs.mStride;
        offset = 0;
        i = 0;
        results = [];
        while (i < num) {
            id = pos[i];
            this.mGL.enableVertexAttribArray(id);
            dtype = this.mGL.FLOAT;
            dsize = 4;
            if (attribs.mChannels[i].mType === me.TYPE.UINT8) {
                dtype = this.mGL.UNSIGNED_BYTE;
                dsize = 1;
            } else if (attribs.mChannels[i].mType === me.TYPE.UINT16) {
                dtype = this.mGL.UNSIGNED_SHORT;
                dsize = 2;
            } else if (attribs.mChannels[i].mType === me.TYPE.FLOAT32) {
                dtype = this.mGL.FLOAT;
                dsize = 4;
            }
            this.mGL.vertexAttribPointer(id, attribs.mChannels[i].mNumComponents, dtype, attribs.mChannels[i].mNormalize, stride, offset);
            offset += attribs.mChannels[i].mNumComponents * dsize;
            results.push(i++);
        }
        return results;
    };

    Renderer.prototype.attachIndexArray = function(tex) {
        return this.mGL.bindBuffer(this.mGL.ELEMENT_ARRAY_BUFFER, tex.mObject);
    };

    Renderer.prototype.detachVertexArray = function(tex, attribs) {
        var i, num;
        num = attribs.mChannels.length;
        i = 0;
        while (i < num) {
            this.mGL.disableVertexAttribArray(i);
            i++;
        }
        return this.mGL.bindBuffer(this.mGL.ARRAY_BUFFER, null);
    };

    Renderer.prototype.detachIndexArray = function(tex) {
        return this.mGL.bindBuffer(this.mGL.ELEMENT_ARRAY_BUFFER, null);
    };

    Renderer.prototype.drawPrimitive = function(typeOfPrimitive, num, useIndexArray, numInstances) {
        var glType;
        glType = this.mGL.POINTS;
        if (typeOfPrimitive === me.PRIMTYPE.POINTS) {
            glType = this.mGL.POINTS;
        }
        if (typeOfPrimitive === me.PRIMTYPE.LINES) {
            glType = this.mGL.LINES;
        }
        if (typeOfPrimitive === me.PRIMTYPE.LINE_LOOP) {
            glType = this.mGL.LINE_LOOP;
        }
        if (typeOfPrimitive === me.PRIMTYPE.LINE_STRIP) {
            glType = this.mGL.LINE_STRIP;
        }
        if (typeOfPrimitive === me.PRIMTYPE.TRIANGLES) {
            glType = this.mGL.TRIANGLES;
        }
        if (typeOfPrimitive === me.PRIMTYPE.TRIANGLE_STRIP) {
            glType = this.mGL.TRIANGLE_STRIP;
        }
        if (numInstances <= 1) {
            if (useIndexArray) {
                return this.mGL.drawElements(glType, num, this.mGL.UNSIGNED_SHORT, 0);
            } else {
                return this.mGL.drawArrays(glType, 0, num);
            }
        } else {
            this.mGL.drawArraysInstanced(glType, 0, num, numInstances);
            return this.mGL.drawElementsInstanced(glType, num, this.mGL.UNSIGNED_SHORT, 0, numInstances);
        }
    };

    Renderer.prototype.drawFullScreenTriangle_XY = function(vpos) {
        this.mGL.bindBuffer(this.mGL.ARRAY_BUFFER, this.mVBO_Tri);
        this.mGL.vertexAttribPointer(vpos, 2, this.mGL.FLOAT, false, 0, 0);
        this.mGL.enableVertexAttribArray(vpos);
        this.mGL.drawArrays(this.mGL.TRIANGLES, 0, 3);
        this.mGL.disableVertexAttribArray(vpos);
        return this.mGL.bindBuffer(this.mGL.ARRAY_BUFFER, null);
    };

    Renderer.prototype.drawUnitQuad_XY = function(vpos) {
        this.mGL.bindBuffer(this.mGL.ARRAY_BUFFER, this.mVBO_Quad);
        this.mGL.vertexAttribPointer(vpos, 2, this.mGL.FLOAT, false, 0, 0);
        this.mGL.enableVertexAttribArray(vpos);
        this.mGL.drawArrays(this.mGL.TRIANGLES, 0, 6);
        this.mGL.disableVertexAttribArray(vpos);
        return this.mGL.bindBuffer(this.mGL.ARRAY_BUFFER, null);
    };

    Renderer.prototype.setBlend = function(enabled) {
        if (enabled) {
            this.mGL.enable(this.mGL.BLEND);
            this.mGL.blendEquationSeparate(this.mGL.FUNC_ADD, this.mGL.FUNC_ADD);
            return this.mGL.blendFuncSeparate(this.mGL.SRC_ALPHA, this.mGL.ONE_MINUS_SRC_ALPHA, this.mGL.ONE, this.mGL.ONE_MINUS_SRC_ALPHA);
        } else {
            return this.mGL.disable(this.mGL.BLEND);
        }
    };

    Renderer.prototype.getPixelData = function(data, offset, xres, yres) {
        return this.mGL.readPixels(0, 0, xres, yres, this.mGL.RGBA, this.mGL.UNSIGNED_BYTE, data, offset);
    };

    Renderer.prototype.getPixelDataRenderTarget = function(obj, data, xres, yres) {
        this.mGL.bindFramebuffer(this.mGL.FRAMEBUFFER, obj.mObjectID);
        this.mGL.readBuffer(this.mGL.COLOR_ATTACHMENT0);
        this.mGL.readPixels(0, 0, xres, yres, this.mGL.RGBA, this.mGL.FLOAT, data, 0);
        return this.mGL.bindFramebuffer(this.mGL.FRAMEBUFFER, null);
    };

    Renderer.createGlContext = function(cv) {
        return cv.getContext('webgl2', {
            alpha: false,
            depth: false,
            stencil: false,
            premultipliedAlpha: false,
            antialias: false,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance'
        });
    };

    return Renderer;

})();

module.exports = Renderer;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFNQSxJQUFBOztBQUFNO0lBRUMsa0JBQUMsSUFBRDtBQUVDLFlBQUE7UUFGQSxJQUFDLENBQUEsTUFBRDtRQUVBLElBQUMsQ0FBQSxNQUFELEdBQVUsQ0FBQyxDQUFELEVBQUcsQ0FBSCxFQUFLLENBQUwsRUFBTyxDQUFQO1FBQ1YsSUFBQyxDQUFBLGdCQUFELEdBQW9CO1FBQ3BCLElBQUMsQ0FBQSxjQUFELEdBQWtCLElBQUMsQ0FBQSxHQUFHLENBQUMsWUFBTCxDQUFrQiwwQkFBbEI7UUFDbEIsSUFBQyxDQUFBLGdCQUFELEdBQW9CO1FBQ3BCLElBQUMsQ0FBQSxjQUFELEdBQWtCLElBQUMsQ0FBQSxHQUFHLENBQUMsWUFBTCxDQUFrQiwrQkFBbEI7UUFDbEIsSUFBQyxDQUFBLFlBQUQsR0FBZ0I7UUFDaEIsSUFBQyxDQUFBLFlBQUQsR0FBZ0I7UUFDaEIsSUFBQyxDQUFBLGNBQUQsR0FBa0I7UUFDbEIsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsSUFBQyxDQUFBLEdBQUcsQ0FBQyxZQUFMLENBQWtCLGdDQUFsQjtRQUNoQixJQUFDLENBQUEsaUJBQUQsR0FBcUIsSUFBQyxDQUFBLEdBQUcsQ0FBQyxZQUFMLENBQWtCLHdCQUFsQjtRQUNyQixVQUFBLEdBQWEsSUFBQyxDQUFBLEdBQUcsQ0FBQyxZQUFMLENBQWtCLElBQUMsQ0FBQSxHQUFHLENBQUMsZ0JBQXZCO1FBQ2IsV0FBQSxHQUFjLElBQUMsQ0FBQSxHQUFHLENBQUMsWUFBTCxDQUFrQixJQUFDLENBQUEsR0FBRyxDQUFDLHlCQUF2QjtRQUNkLG1CQUFBLEdBQXNCLElBQUMsQ0FBQSxHQUFHLENBQUMsWUFBTCxDQUFrQixJQUFDLENBQUEsR0FBRyxDQUFDLHFCQUF2QjtRQUN0QixVQUFBLEdBQWEsSUFBQyxDQUFBLEdBQUcsQ0FBQyxzQkFBTCxDQUFBO1FBQ2IsWUFBQSxHQUFlLElB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TSxDQUFDLFNBQTVELEVBQXVFLElBQXZFLEVBQTZFLElBQTdFLEVBQW1GLENBQW5GLEVBQXNGLE1BQU0sQ0FBQyxXQUE3RixFQUEwRyxNQUFNLENBQUMsT0FBakgsRUFBMEgsTUFBMUg7WUFDQSxJQUFDLENBQUEsR0FBRyxDQUFDLFVBQUwsQ0FBZ0IsSUFBQyxDQUFBLEdBQUcsQ0FBQywyQkFBckIsRUFBa0QsQ0FBbEQsRUFBcUQsTUFBTSxDQUFDLFNBQTVELEVBQXVFLElBQXZFLEVBQTZFLElBQTdFLEVBQW1GLENBQW5GLEVBQXNGLE1BQU0sQ0FBQyxXQUE3RixFQUEwRyxNQUFNLENBQUMsT0FBakgsRUFBMEgsTUFBMUg7WUFDQSxJQUFDLENBQUEsR0FBRyxDQUFDLFVBQUwsQ0FBZ0IsSUFBQyxDQUFBLEdBQUcsQ0FBQywyQkFBckIsRUFBa0QsQ0FBbEQsRUFBcUQsTUFBTSxDQUFDLFNBQTVELEVBQXVFLElBQXZFLEVBQTZFLElBQTdFLEVBQW1GLENBQW5GLEVBQXNGLE1BQU0sQ0FBQyxXQUE3RixFQUEwRyxNQUFNLENBQUMsT0FBakgsRUFBMEgsTUFBMUg7WUFDQSxJQUFDLENBQUEsR0FBRyxDQUFDLFVBQUwsQ0FBZ0IsSUFBQyxDQUFBLEdBQUcsQ0FBQywyQkFBckIsRUFBa0QsQ0FBbEQsRUFBcUQsTUFBTSxDQUFDLFNBQTVELEVBQXVFLElBQXZFLEVBQTZFLElBQTdFLEVBQW1GLENBQW5GLEVBQXNGLE1BQU0sQ0FBQyxXQUE3RixFQUEwRyxNQUFNLENBQUMsT0FBakgsRUFBMEgsTUFBMUg7WUFDQSxJQUFDLENBQUEsR0FBRyxDQUFDLFVBQUwsQ0FBZ0IsSUFBQyxDQUFBLEdBQUcsQ0FBQywyQkFBckIsRUFBa0QsQ0FBbEQsRUFBcUQsTUFBTSxDQUFDLFNBQTVELEVBQXVFLElBQXZFLEVBQTZFLElBQTdFLEVBQW1GLENBQW5GLEVBQXNGLE1BQU0sQ0FBQyxXQUE3RixFQUEwRyxNQUFNLENBQUMsT0FBakgsRUFBMEgsTUFBMUg7WUFDQSxJQUFDLENBQUEsR0FBRyxDQUFDLFVBQUwsQ0FBZ0IsSUFB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QUFHLENBQUMsYUFBbEQsRUFBaUUsSUFBakUsRUFBdUUsTUFBdkU7SUFEVTs7dUJBR2Qsd0JBQUEsR0FBMEIsU0FBQyxHQUFELEVBQU0sSUFBTixFQUFZLElBQVosRUFBa0IsSUFBbEI7UUFDdEIsSUFBQyxDQUFBLEdBQUcsQ0FBQyxlQUFMLENBQXFCLElBQUMsQ0FBQSxHQUFHLENBQUMsV0FBMUIsRUFBdUMsR0FBRyxDQUFDLFNBQTNDO1FBQ0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxVQUFMLENBQWdCLElBQUMsQ0FBQSxHQUFHLENBQUMsaUJBQXJCO1FBQ0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxVQUFMLENBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLElBQXRCLEVBQTRCLElBQTVCLEVBQWtDLElBQUMsQ0FBQSxHQUFHLENBQUMsSUFBdkMsRUFBNkMsSUFBQyxDQUFBLEdBQUcsQ0FBQyxLQUFsRCxFQUF5RCxJQUF6RCxFQUErRCxDQUEvRDtlQUNBLElBQUMsQ0FBQSxHQUFHLENBQUMsZUFBTCxDQUFxQixJQUFDLENBQUEsR0FBRyxDQUFDLFdBQTFCLEVBQXVDLElBQXZDO0lBSnNCOztJQU0xQixRQUFDLENBQUEsZUFBRCxHQUFrQixTQUFDLEVBQUQ7ZUFDZCxFQUFFLENBQUMsVUFBSCxDQUFjLFFBQWQsRUFDSTtZQUFBLEtBQUEsRUFBTyxLQUFQO1lBQ0EsS0FBQSxFQUFPLEtBRFA7WUFFQSxPQUFBLEVBQVMsS0FGVDtZQUdBLGtCQUFBLEVBQW9CLEtBSHBCO1lBSUEsU0FBQSxFQUFXLEtBSlg7WUFLQSxxQkFBQSxFQUF1QixLQUx2QjtZQU1BLGVBQUEsRUFBaUIsa0JBTmpCO1NBREo7SUFEYzs7Ozs7O0FBV3RCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuI1xuIyBwaUxpYnMgMjAxNC0yMDE3IC0gaHR0cDovL3d3dy5pcXVpbGV6bGVzLm9yZy93d3cvbWF0ZXJpYWwvcGlMaWJzL3BpTGlicy5odG1cbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuY2xhc3MgUmVuZGVyZXIgXG4gICAgXG4gICAgQDogKEBtR0wpIC0+XG5cbiAgICAgICAgQGlNb3VzZSA9IFswIDAgMCAwXVxuICAgICAgICBAbUZsb2F0MzJUZXh0dXJlcyA9IHRydWVcbiAgICAgICAgQG1GbG9hdDMyRmlsdGVyID0gQG1HTC5nZXRFeHRlbnNpb24oJ09FU190ZXh0dXJlX2Zsb2F0X2xpbmVhcicpXG4gICAgICAgIEBtRmxvYXQxNlRleHR1cmVzID0gdHJ1ZVxuICAgICAgICBAbUZsb2F0MTZGaWx0ZXIgPSBAbUdMLmdldEV4dGVuc2lvbignT0VTX3RleHR1cmVfaGFsZl9mbG9hdF9saW5lYXInKVxuICAgICAgICBAbURlcml2YXRpdmVzID0gdHJ1ZVxuICAgICAgICBAbURyYXdCdWZmZXJzID0gdHJ1ZVxuICAgICAgICBAbURlcHRoVGV4dHVyZXMgPSB0cnVlXG4gICAgICAgIEBtQW5pc290cm9waWMgPSBAbUdMLmdldEV4dGVuc2lvbignRVhUX3RleHR1cmVfZmlsdGVyX2FuaXNvdHJvcGljJylcbiAgICAgICAgQG1SZW5kZXJUb0Zsb2F0MzJGID0gQG1HTC5nZXRFeHRlbnNpb24oJ0VYVF9jb2xvcl9idWZmZXJfZmxvYXQnKVxuICAgICAgICBtYXhUZXhTaXplID0gQG1HTC5nZXRQYXJhbWV0ZXIoQG1HTC5NQVhfVEVYVFVSRV9TSVpFKVxuICAgICAgICBtYXhDdWJlU2l6ZSA9IEBtR0wuZ2V0UGFyYW1ldGVyKEBtR0wuTUFYX0NVQkVfTUFQX1RFWFRVUkVfU0laRSlcbiAgICAgICAgbWF4UmVuZGVyYnVmZmVyU2l6ZSA9IEBtR0wuZ2V0UGFyYW1ldGVyKEBtR0wuTUFYX1JFTkRFUkJVRkZFUl9TSVpFKVxuICAgICAgICBleHRlbnNpb25zID0gQG1HTC5nZXRTdXBwb3J0ZWRFeHRlbnNpb25zKClcbiAgICAgICAgdGV4dHVyZVVuaXRzID0gQG1HTC5nZXRQYXJhbWV0ZXIoQG1HTC5NQVhfVEVYVFVSRV9JTUFHRV9VTklUUylcbiAgICAgICAgY29uc29sZS5sb2cgJ1dlYkdMOicgKyAnIEYzMiBUZXh0dXJlczogJyArIChpZiBAbUZsb2F0MzJUZXh0dXJlcyAhPSBudWxsIHRoZW4gJ3llcycgZWxzZSAnbm8nKSArICcsIFJlbmRlciB0byAzMkY6ICcgKyAoaWYgQG1SZW5kZXJUb0Zsb2F0MzJGICE9IG51bGwgdGhlbiAneWVzJyBlbHNlICdubycpICsgJywgTWF4IFRleHR1cmUgU2l6ZTogJyArIG1heFRleFNpemUgKyAnLCBNYXggUmVuZGVyIEJ1ZmZlciBTaXplOiAnICsgbWF4UmVuZGVyYnVmZmVyU2l6ZSArICcsIE1heCBDdWJlbWFwIFNpemU6ICcgKyBtYXhDdWJlU2l6ZVxuXG4gICAgICAgIHZlcnRpY2VzID0gbmV3IEZsb2F0MzJBcnJheSBbIC0xLjAgLTEuMCAxLjAgLTEuMCAtMS4wIDEuMCAxLjAgLTEuMCAxLjAgMS4wIC0xLjAgMS4wIF1cbiAgICAgICAgQG1WQk9fUXVhZCA9IEBtR0wuY3JlYXRlQnVmZmVyKClcbiAgICAgICAgQG1HTC5iaW5kQnVmZmVyIEBtR0wuQVJSQVlfQlVGRkVSLCBAbVZCT19RdWFkXG4gICAgICAgIEBtR0wuYnVmZmVyRGF0YSBAbUdMLkFSUkFZX0JVRkZFUiwgdmVydGljZXMsIEBtR0wuU1RBVElDX0RSQVdcbiAgICAgICAgQG1HTC5iaW5kQnVmZmVyIEBtR0wuQVJSQVlfQlVGRkVSLCBudWxsXG4gICAgICAgICMgY3JlYXRlIGEgMkQgdHJpYW5nbGUgVmVydGV4IEJ1ZmZlclxuICAgICAgICBAbVZCT19UcmkgPSBAbUdMLmNyZWF0ZUJ1ZmZlcigpXG4gICAgICAgIEBtR0wuYmluZEJ1ZmZlciBAbUdMLkFSUkFZX0JVRkZFUiwgQG1WQk9fVHJpXG4gICAgICAgIEBtR0wuYnVmZmVyRGF0YSBAbUdMLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheShbIC0xLjAgLTEuMCAzLjAgLTEuMCAtMS4wIDMuMCBdKSwgQG1HTC5TVEFUSUNfRFJBV1xuICAgICAgICBAbUdMLmJpbmRCdWZmZXIgQG1HTC5BUlJBWV9CVUZGRVIsIG51bGxcbiAgICAgICAgIyBjcmVhdGUgYSAzRCBjdWJlIFZlcnRleCBCdWZmZXJcbiAgICAgICAgQG1WQk9fQ3ViZVBvc05vciA9IEBtR0wuY3JlYXRlQnVmZmVyKClcbiAgICAgICAgQG1HTC5iaW5kQnVmZmVyIEBtR0wuQVJSQVlfQlVGRkVSLCBAbVZCT19DdWJlUG9zTm9yXG4gICAgICAgIEBtR0wuYnVmZmVyRGF0YSBAbUdMLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheShbXG4gICAgICAgICAgICAtMS4wIC0xLjAgLTEuMCAtMS4wIDAuMCAwLjAgLTEuMCAtMS4wIDEuMCAtMS4wIDAuMCAwLjAgLTEuMCAxLjAgLTEuMCAtMS4wIDAuMCAwLjAgLTEuMCAxLjAgMS4wIC0xLjAgMC4wIDAuMCAxLjAgMS4wIC0xLjAgMS4wIDAuMCAwLjAgMS4wXG4gICAgICAgICAgICAxLjAgMS4wIDEuMCAwLjAgMC4wIDEuMCAtMS4wIC0xLjAgMS4wIDAuMCAwLjAgMS4wIC0xLjAgMS4wIDEuMCAwLjAgMC4wIDEuMCAxLjAgMS4wIDAuMCAxLjAgMC4wIDEuMCAxLjAgLTEuMCAwLjAgMS4wXG4gICAgICAgICAgICAwLjAgLTEuMCAxLjAgMS4wIDAuMCAxLjAgMC4wIC0xLjAgMS4wIC0xLjAgMC4wIDEuMCAwLjAgMS4wIC0xLjAgLTEuMCAwLjAgLTEuMCAwLjAgMS4wIC0xLjAgMS4wIDAuMCAtMS4wIDAuMCAtMS4wIC0xLjBcbiAgICAgICAgICAgIC0xLjAgMC4wIC0xLjAgMC4wIC0xLjAgLTEuMCAxLjAgMC4wIC0xLjAgMC4wIC0xLjAgMS4wIDEuMCAwLjAgMC4wIDEuMCAtMS4wIC0xLjAgMS4wIDAuMCAwLjAgMS4wIDEuMCAxLjAgMS4wIDAuMCAwLjAgMS4wXG4gICAgICAgICAgICAxLjAgLTEuMCAxLjAgMC4wIDAuMCAxLjAgLTEuMCAtMS4wIC0xLjAgMC4wIDAuMCAtMS4wIC0xLjAgMS4wIC0xLjAgMC4wIDAuMCAtMS4wIDEuMCAtMS4wIC0xLjAgMC4wIDAuMCAtMS4wIDEuMCAxLjAgLTEuMCAwLjAgMC4wIC0xLjBcbiAgICAgICAgXSksIEBtR0wuU1RBVElDX0RSQVdcbiAgICAgICAgQG1HTC5iaW5kQnVmZmVyIEBtR0wuQVJSQVlfQlVGRkVSLCBudWxsXG4gICAgICAgIEBtVkJPX0N1YmVQb3MgPSBAbUdMLmNyZWF0ZUJ1ZmZlcigpXG4gICAgICAgIEBtR0wuYmluZEJ1ZmZlciBAbUdMLkFSUkFZX0JVRkZFUiwgQG1WQk9fQ3ViZVBvc1xuICAgICAgICBAbUdMLmJ1ZmZlckRhdGEgQG1HTC5BUlJBWV9CVUZGRVIsIG5ldyBGbG9hdDMyQXJyYXkoW1xuICAgICAgICAgICAgLTEuMCAtMS4wIC0xLjAgLTEuMCAtMS4wIDEuMCAtMS4wIDEuMCAtMS4wIC0xLjAgMS4wIDEuMCAxLjAgMS4wIC0xLjAgMS4wIDEuMCAxLjAgMS4wIC0xLjAgLTEuMCAxLjAgLTEuMCAxLjAgMS4wIDEuMCAxLjAgMS4wXG4gICAgICAgICAgICAxLjAgLTEuMCAtMS4wIDEuMCAxLjAgLTEuMCAxLjAgLTEuMCAxLjAgLTEuMCAtMS4wIDEuMCAtMS4wIDEuMCAtMS4wIC0xLjAgLTEuMCAtMS4wIC0xLjAgMS4wIC0xLjAgMS4wIDEuMCAtMS4wIC0xLjAgMS4wIDEuMCAxLjBcbiAgICAgICAgICAgIDEuMCAxLjAgLTEuMCAxLjAgLTEuMCAtMS4wIC0xLjAgLTEuMCAxLjAgLTEuMCAxLjAgLTEuMCAtMS4wIDEuMCAxLjAgLTEuMFxuICAgICAgICBdKSwgQG1HTC5TVEFUSUNfRFJBV1xuICAgICAgICBAbUdMLmJpbmRCdWZmZXIgQG1HTC5BUlJBWV9CVUZGRVIsIG51bGxcblxuICAgIEBDTEVBUiAgICAgID0gQ29sb3I6MSBaYnVmZmVyOjIgU3RlbmNpbDo0XG4gICAgQFRFWEZNVCAgICAgPSBDNEk4OjAgQzFJODoxIEMxRjE2OjIgQzRGMTY6MyBDMUYzMjo0IEM0RjMyOjUgWjE2OjYgWjI0OjcgWjMyOjggQzNGMzI6OVxuICAgIEBURVhXUlAgICAgID0gQ0xBTVA6MCBSRVBFQVQ6MVxuICAgIEBCVUZUWVBFICAgID0gU1RBVElDOjAgRFlOQU1JQzoxXG4gICAgQFBSSU1UWVBFICAgPSBQT0lOVFM6MCBMSU5FUzoxIExJTkVfTE9PUDoyIExJTkVfU1RSSVA6MyBUUklBTkdMRVM6NCBUUklBTkdMRV9TVFJJUDo1XG4gICAgQFJFTkRTVEdBVEUgPSBXSVJFRlJBTUU6MCBGUk9OVF9GQUNFOjEgQ1VMTF9GQUNFOjIgREVQVEhfVEVTVDozIEFMUEhBX1RPX0NPVkVSQUdFOjRcbiAgICBAVEVYVFlQRSAgICA9IFQyRDowIFQzRDoxIENVQkVNQVA6MlxuICAgIEBGSUxURVIgICAgID0gTk9ORTowIExJTkVBUjoxIE1JUE1BUDoyIE5PTkVfTUlQTUFQOjNcbiAgICBAVFlQRSAgICAgICA9IFVJTlQ4OjAgVUlOVDE2OjEgVUlOVDMyOjIgRkxPQVQxNjozIEZMT0FUMzI6NCBGTE9BVDY0OjVcblxuICAgIGlGb3JtYXRQSTJHTDogKGZvcm1hdCkgLT5cbiAgICAgICAgcmV0dXJuIHN3aXRjaCBmb3JtYXRcbiAgICAgICAgICAgIHdoZW4gUmVuZGVyZXIuVEVYRk1ULkM0SThcbiAgICAgICAgICAgICAgICAgICAgbUdMRm9ybWF0OiAgIEBtR0wuUkdCQThcbiAgICAgICAgICAgICAgICAgICAgbUdMRXh0ZXJuYWw6IEBtR0wuUkdCQVxuICAgICAgICAgICAgICAgICAgICBtR0xUeXBlOiAgICAgQG1HTC5VTlNJR05FRF9CWVRFXG4gICAgICAgICAgICB3aGVuIFJlbmRlcmVyLlRFWEZNVC5DMUk4XG4gICAgICAgICAgICAgICAgICAgIG1HTEZvcm1hdDogQG1HTC5SOFxuICAgICAgICAgICAgICAgICAgICBtR0xFeHRlcm5hbDogQG1HTC5SRURcbiAgICAgICAgICAgICAgICAgICAgbUdMVHlwZTogQG1HTC5VTlNJR05FRF9CWVRFXG4gICAgICAgICAgICB3aGVuIFJlbmRlcmVyLlRFWEZNVC5DMUYxNlxuICAgICAgICAgICAgICAgICAgICBtR0xGb3JtYXQ6IEBtR0wuUjE2RlxuICAgICAgICAgICAgICAgICAgICBtR0xFeHRlcm5hbDogQG1HTC5SRURcbiAgICAgICAgICAgICAgICAgICAgbUdMVHlwZTogQG1HTC5GTE9BVFxuICAgICAgICAgICAgd2hlbiBSZW5kZXJlci5URVhGTVQuQzRGMTZcbiAgICAgICAgICAgICAgICAgICAgbUdMRm9ybWF0OiBAbUdMLlJHQkExNkZcbiAgICAgICAgICAgICAgICAgICAgbUdMRXh0ZXJuYWw6IEBtR0wuUkdCQVxuICAgICAgICAgICAgICAgICAgICBtR0xUeXBlOiBAbUdMLkZMT0FUXG4gICAgICAgICAgICB3aGVuIFJlbmRlcmVyLlRFWEZNVC5DMUYzMlxuICAgICAgICAgICAgICAgICAgICBtR0xGb3JtYXQ6IEBtR0wuUjMyRlxuICAgICAgICAgICAgICAgICAgICBtR0xFeHRlcm5hbDogQG1HTC5SRURcbiAgICAgICAgICAgICAgICAgICAgbUdMVHlwZTogQG1HTC5GTE9BVFxuICAgICAgICAgICAgd2hlbiBSZW5kZXJlci5URVhGTVQuQzRGMzJcbiAgICAgICAgICAgICAgICAgICAgbUdMRm9ybWF0OiBAbUdMLlJHQkEzMkZcbiAgICAgICAgICAgICAgICAgICAgbUdMRXh0ZXJuYWw6IEBtR0wuUkdCQVxuICAgICAgICAgICAgICAgICAgICBtR0xUeXBlOiBAbUdMLkZMT0FUXG4gICAgICAgICAgICB3aGVuIFJlbmRlcmVyLlRFWEZNVC5DM0YzMlxuICAgICAgICAgICAgICAgICAgICBtR0xGb3JtYXQ6IEBtR0wuUkdCMzJGXG4gICAgICAgICAgICAgICAgICAgIG1HTEV4dGVybmFsOiBAbUdMLlJHQlxuICAgICAgICAgICAgICAgICAgICBtR0xUeXBlOiBAbUdMLkZMT0FUXG4gICAgICAgICAgICB3aGVuIFJlbmRlcmVyLlRFWEZNVC5aMTZcbiAgICAgICAgICAgICAgICAgICAgbUdMRm9ybWF0OiBAbUdMLkRFUFRIX0NPTVBPTkVOVDE2XG4gICAgICAgICAgICAgICAgICAgIG1HTEV4dGVybmFsOiBAbUdMLkRFUFRIX0NPTVBPTkVOVFxuICAgICAgICAgICAgICAgICAgICBtR0xUeXBlOiBAbUdMLlVOU0lHTkVEX1NIT1JUXG4gICAgICAgICAgICB3aGVuIFJlbmRlcmVyLlRFWEZNVC5aMjRcbiAgICAgICAgICAgICAgICAgICAgbUdMRm9ybWF0OiBAbUdMLkRFUFRIX0NPTVBPTkVOVDI0XG4gICAgICAgICAgICAgICAgICAgIG1HTEV4dGVybmFsOiBAbUdMLkRFUFRIX0NPTVBPTkVOVFxuICAgICAgICAgICAgICAgICAgICBtR0xUeXBlOiBAbUdMLlVOU0lHTkVEX1NIT1JUXG4gICAgICAgICAgICB3aGVuIFJlbmRlcmVyLlRFWEZNVC5aMzJcbiAgICAgICAgICAgICAgICAgICAgbUdMRm9ybWF0OiBAbUdMLkRFUFRIX0NPTVBPTkVOVDMyRlxuICAgICAgICAgICAgICAgICAgICBtR0xFeHRlcm5hbDogQG1HTC5ERVBUSF9DT01QT05FTlRcbiAgICAgICAgICAgICAgICAgICAgbUdMVHlwZTogQG1HTC5VTlNJR05FRF9TSE9SVFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIG51bGxcblxuICAgIGNoZWNrRXJyb3JzOiAtPlxuICAgICAgICBlcnJvciA9IEBtR0wuZ2V0RXJyb3IoKVxuICAgICAgICBpZiBlcnJvciAhPSBAbUdMLk5PX0VSUk9SXG4gICAgICAgICAgICBmb3IgcHJvcCBvZiBAbUdMXG4gICAgICAgICAgICAgICAgaWYgdHlwZW9mIEBtR0xbcHJvcF0gPT0gJ251bWJlcidcbiAgICAgICAgICAgICAgICAgICAgaWYgQG1HTFtwcm9wXSA9PSBlcnJvclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cgJ0dMIEVycm9yICcgKyBlcnJvciArICc6ICcgKyBwcm9wXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgY2xlYXI6IChmbGFncywgY2NvbG9yLCBjZGVwdGgsIGNzdGVuY2lsKSAtPlxuICAgICAgICBtb2RlID0gMFxuICAgICAgICBpZiBmbGFncyAmIDFcbiAgICAgICAgICAgIG1vZGUgfD0gQG1HTC5DT0xPUl9CVUZGRVJfQklUXG4gICAgICAgICAgICBAbUdMLmNsZWFyQ29sb3IgY2NvbG9yWzBdLCBjY29sb3JbMV0sIGNjb2xvclsyXSwgY2NvbG9yWzNdXG4gICAgICAgIGlmIGZsYWdzICYgMlxuICAgICAgICAgICAgbW9kZSB8PSBAbUdMLkRFUFRIX0JVRkZFUl9CSVRcbiAgICAgICAgICAgIEBtR0wuY2xlYXJEZXB0aCBjZGVwdGhcbiAgICAgICAgaWYgZmxhZ3MgJiA0XG4gICAgICAgICAgICBtb2RlIHw9IEBtR0wuU1RFTkNJTF9CVUZGRVJfQklUXG4gICAgICAgICAgICBAbUdMLmNsZWFyU3RlbmNpbCBjc3RlbmNpbFxuICAgICAgICBAbUdMLmNsZWFyIG1vZGVcblxuICAgIGNyZWF0ZVRleHR1cmU6ICh0eXBlLCB4cmVzLCB5cmVzLCBmb3JtYXQsIGZpbHRlciwgd3JhcCwgYnVmZmVyKSAtPlxuICAgICAgICBpZiBub3QgQG1HTCB0aGVuIHJldHVyblxuICAgICAgICBpZCA9IEBtR0wuY3JlYXRlVGV4dHVyZSgpXG4gICAgICAgIGdsRm9UeSA9IEBpRm9ybWF0UEkyR0woZm9ybWF0KVxuICAgICAgICBnbFdyYXAgPSBAbUdMLlJFUEVBVFxuICAgICAgICBpZiB3cmFwID09IFJlbmRlcmVyLlRFWFdSUC5DTEFNUFxuICAgICAgICAgICAgZ2xXcmFwID0gQG1HTC5DTEFNUF9UT19FREdFXG4gICAgICAgIGlmIHR5cGUgPT0gUmVuZGVyZXIuVEVYVFlQRS5UMkRcbiAgICAgICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFXzJELCBpZFxuICAgICAgICAgICAgQG1HTC50ZXhJbWFnZTJEIEBtR0wuVEVYVFVSRV8yRCwgMCwgZ2xGb1R5Lm1HTEZvcm1hdCwgeHJlcywgeXJlcywgMCwgZ2xGb1R5Lm1HTEV4dGVybmFsLCBnbEZvVHkubUdMVHlwZSwgYnVmZmVyXG4gICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzJELCBAbUdMLlRFWFRVUkVfV1JBUF9TLCBnbFdyYXBcbiAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfMkQsIEBtR0wuVEVYVFVSRV9XUkFQX1QsIGdsV3JhcFxuICAgICAgICAgICAgaWYgZmlsdGVyID09IFJlbmRlcmVyLkZJTFRFUi5OT05FXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8yRCwgQG1HTC5URVhUVVJFX01BR19GSUxURVIsIEBtR0wuTkVBUkVTVFxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfMkQsIEBtR0wuVEVYVFVSRV9NSU5fRklMVEVSLCBAbUdMLk5FQVJFU1RcbiAgICAgICAgICAgIGVsc2UgaWYgZmlsdGVyID09IFJlbmRlcmVyLkZJTFRFUi5MSU5FQVJcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzJELCBAbUdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgQG1HTC5MSU5FQVJcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzJELCBAbUdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgQG1HTC5MSU5FQVJcbiAgICAgICAgICAgIGVsc2UgaWYgZmlsdGVyID09IFJlbmRlcmVyLkZJTFRFUi5NSVBNQVBcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzJELCBAbUdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgQG1HTC5MSU5FQVJcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzJELCBAbUdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgQG1HTC5MSU5FQVJfTUlQTUFQX0xJTkVBUlxuICAgICAgICAgICAgICAgIEBtR0wuZ2VuZXJhdGVNaXBtYXAgQG1HTC5URVhUVVJFXzJEXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8yRCwgQG1HTC5URVhUVVJFX01BR19GSUxURVIsIEBtR0wuTkVBUkVTVFxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfMkQsIEBtR0wuVEVYVFVSRV9NSU5fRklMVEVSLCBAbUdMLk5FQVJFU1RfTUlQTUFQX0xJTkVBUlxuICAgICAgICAgICAgICAgIEBtR0wuZ2VuZXJhdGVNaXBtYXAgQG1HTC5URVhUVVJFXzJEXG4gICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV8yRCwgbnVsbFxuICAgICAgICBlbHNlIGlmIHR5cGUgPT0gUmVuZGVyZXIuVEVYVFlQRS5UM0RcbiAgICAgICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFXzNELCBpZFxuICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8zRCwgQG1HTC5URVhUVVJFX0JBU0VfTEVWRUwsIDBcbiAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfM0QsIEBtR0wuVEVYVFVSRV9NQVhfTEVWRUwsIE1hdGgubG9nMih4cmVzKVxuICAgICAgICAgICAgaWYgZmlsdGVyID09IFJlbmRlcmVyLkZJTFRFUi5OT05FXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8zRCwgQG1HTC5URVhUVVJFX01BR19GSUxURVIsIEBtR0wuTkVBUkVTVFxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfM0QsIEBtR0wuVEVYVFVSRV9NSU5fRklMVEVSLCBAbUdMLk5FQVJFU1RcbiAgICAgICAgICAgIGVsc2UgaWYgZmlsdGVyID09IFJlbmRlcmVyLkZJTFRFUi5MSU5FQVJcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzNELCBAbUdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgQG1HTC5MSU5FQVJcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzNELCBAbUdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgQG1HTC5MSU5FQVJcbiAgICAgICAgICAgIGVsc2UgaWYgZmlsdGVyID09IFJlbmRlcmVyLkZJTFRFUi5NSVBNQVBcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzNELCBAbUdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgQG1HTC5MSU5FQVJcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzNELCBAbUdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgQG1HTC5MSU5FQVJfTUlQTUFQX0xJTkVBUlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfM0QsIEBtR0wuVEVYVFVSRV9NQUdfRklMVEVSLCBAbUdMLk5FQVJFU1RcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzNELCBAbUdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgQG1HTC5ORUFSRVNUX01JUE1BUF9MSU5FQVJcbiAgICAgICAgICAgICAgICBAbUdMLmdlbmVyYXRlTWlwbWFwIEBtR0wuVEVYVFVSRV8zRFxuICAgICAgICAgICAgQG1HTC50ZXhJbWFnZTNEIEBtR0wuVEVYVFVSRV8zRCwgMCwgZ2xGb1R5Lm1HTEZvcm1hdCwgeHJlcywgeXJlcywgeXJlcywgMCwgZ2xGb1R5Lm1HTEV4dGVybmFsLCBnbEZvVHkubUdMVHlwZSwgYnVmZmVyXG4gICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzNELCBAbUdMLlRFWFRVUkVfV1JBUF9SLCBnbFdyYXBcbiAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfM0QsIEBtR0wuVEVYVFVSRV9XUkFQX1MsIGdsV3JhcFxuICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8zRCwgQG1HTC5URVhUVVJFX1dSQVBfVCwgZ2xXcmFwXG4gICAgICAgICAgICBpZiBmaWx0ZXIgPT0gUmVuZGVyZXIuRklMVEVSLk1JUE1BUFxuICAgICAgICAgICAgICAgIEBtR0wuZ2VuZXJhdGVNaXBtYXAgQG1HTC5URVhUVVJFXzNEXG4gICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV8zRCwgbnVsbFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV9DVUJFX01BUCwgaWRcbiAgICAgICAgICAgIEBtR0wudGV4SW1hZ2UyRCBAbUdMLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWCwgMCwgZ2xGb1R5Lm1HTEZvcm1hdCwgeHJlcywgeXJlcywgMCwgZ2xGb1R5Lm1HTEV4dGVybmFsLCBnbEZvVHkubUdMVHlwZSwgYnVmZmVyXG4gICAgICAgICAgICBAbUdMLnRleEltYWdlMkQgQG1HTC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1gsIDAsIGdsRm9UeS5tR0xGb3JtYXQsIHhyZXMsIHlyZXMsIDAsIGdsRm9UeS5tR0xFeHRlcm5hbCwgZ2xGb1R5Lm1HTFR5cGUsIGJ1ZmZlclxuICAgICAgICAgICAgQG1HTC50ZXhJbWFnZTJEIEBtR0wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9ZLCAwLCBnbEZvVHkubUdMRm9ybWF0LCB4cmVzLCB5cmVzLCAwLCBnbEZvVHkubUdMRXh0ZXJuYWwsIGdsRm9UeS5tR0xUeXBlLCBidWZmZXJcbiAgICAgICAgICAgIEBtR0wudGV4SW1hZ2UyRCBAbUdMLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWSwgMCwgZ2xGb1R5Lm1HTEZvcm1hdCwgeHJlcywgeXJlcywgMCwgZ2xGb1R5Lm1HTEV4dGVybmFsLCBnbEZvVHkubUdMVHlwZSwgYnVmZmVyXG4gICAgICAgICAgICBAbUdMLnRleEltYWdlMkQgQG1HTC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1osIDAsIGdsRm9UeS5tR0xGb3JtYXQsIHhyZXMsIHlyZXMsIDAsIGdsRm9UeS5tR0xFeHRlcm5hbCwgZ2xGb1R5Lm1HTFR5cGUsIGJ1ZmZlclxuICAgICAgICAgICAgQG1HTC50ZXhJbWFnZTJEIEBtR0wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9aLCAwLCBnbEZvVHkubUdMRm9ybWF0LCB4cmVzLCB5cmVzLCAwLCBnbEZvVHkubUdMRXh0ZXJuYWwsIGdsRm9UeS5tR0xUeXBlLCBidWZmZXJcbiAgICAgICAgICAgIGlmIGZpbHRlciA9PSBSZW5kZXJlci5GSUxURVIuTk9ORVxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfQ1VCRV9NQVAsIEBtR0wuVEVYVFVSRV9NQUdfRklMVEVSLCBAbUdMLk5FQVJFU1RcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCBAbUdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgQG1HTC5ORUFSRVNUXG4gICAgICAgICAgICBlbHNlIGlmIGZpbHRlciA9PSBSZW5kZXJlci5GSUxURVIuTElORUFSXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV9DVUJFX01BUCwgQG1HTC5URVhUVVJFX01BR19GSUxURVIsIEBtR0wuTElORUFSXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV9DVUJFX01BUCwgQG1HTC5URVhUVVJFX01JTl9GSUxURVIsIEBtR0wuTElORUFSXG4gICAgICAgICAgICBlbHNlIGlmIGZpbHRlciA9PSBSZW5kZXJlci5GSUxURVIuTUlQTUFQXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV9DVUJFX01BUCwgQG1HTC5URVhUVVJFX01BR19GSUxURVIsIEBtR0wuTElORUFSXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV9DVUJFX01BUCwgQG1HTC5URVhUVVJFX01JTl9GSUxURVIsIEBtR0wuTElORUFSX01JUE1BUF9MSU5FQVJcbiAgICAgICAgICAgIGlmIGZpbHRlciA9PSBSZW5kZXJlci5GSUxURVIuTUlQTUFQXG4gICAgICAgICAgICAgICAgQG1HTC5nZW5lcmF0ZU1pcG1hcCBAbUdMLlRFWFRVUkVfQ1VCRV9NQVBcbiAgICAgICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCBudWxsXG5cbiAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBtT2JqZWN0SUQ6IGlkXG4gICAgICAgICAgICBtWHJlczogeHJlc1xuICAgICAgICAgICAgbVlyZXM6IHlyZXNcbiAgICAgICAgICAgIG1Gb3JtYXQ6IGZvcm1hdFxuICAgICAgICAgICAgbVR5cGU6IHR5cGVcbiAgICAgICAgICAgIG1GaWx0ZXI6IGZpbHRlclxuICAgICAgICAgICAgbVdyYXA6IHdyYXBcblxuICAgIGNyZWF0ZVRleHR1cmVGcm9tSW1hZ2U6ICh0eXBlLCBpbWFnZSwgZm9ybWF0LCBmaWx0ZXIsIHdyYXAsIGZsaXBZKSAtPlxuICAgICAgICBpZiBAbUdMID09IG51bGxcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIGlkID0gQG1HTC5jcmVhdGVUZXh0dXJlKClcbiAgICAgICAgZ2xGb1R5ID0gQGlGb3JtYXRQSTJHTChmb3JtYXQpXG4gICAgICAgIGdsV3JhcCA9IEBtR0wuUkVQRUFUXG4gICAgICAgIGlmIHdyYXAgPT0gUmVuZGVyZXIuVEVYV1JQLkNMQU1QXG4gICAgICAgICAgICBnbFdyYXAgPSBAbUdMLkNMQU1QX1RPX0VER0VcbiAgICAgICAgaWYgdHlwZSA9PSBSZW5kZXJlci5URVhUWVBFLlQyRFxuICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfMkQsIGlkXG4gICAgICAgICAgICBAbUdMLnBpeGVsU3RvcmVpIEBtR0wuVU5QQUNLX0ZMSVBfWV9XRUJHTCwgZmxpcFlcbiAgICAgICAgICAgIEBtR0wucGl4ZWxTdG9yZWkgQG1HTC5VTlBBQ0tfUFJFTVVMVElQTFlfQUxQSEFfV0VCR0wsIGZhbHNlXG4gICAgICAgICAgICBAbUdMLnBpeGVsU3RvcmVpIEBtR0wuVU5QQUNLX0NPTE9SU1BBQ0VfQ09OVkVSU0lPTl9XRUJHTCwgQG1HTC5OT05FXG4gICAgICAgICAgICBAbUdMLnRleEltYWdlMkQgQG1HTC5URVhUVVJFXzJELCAwLCBnbEZvVHkubUdMRm9ybWF0LCBnbEZvVHkubUdMRXh0ZXJuYWwsIGdsRm9UeS5tR0xUeXBlLCBpbWFnZVxuICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8yRCwgQG1HTC5URVhUVVJFX1dSQVBfUywgZ2xXcmFwXG4gICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzJELCBAbUdMLlRFWFRVUkVfV1JBUF9ULCBnbFdyYXBcbiAgICAgICAgICAgIGlmIGZpbHRlciA9PSBSZW5kZXJlci5GSUxURVIuTk9ORVxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfMkQsIEBtR0wuVEVYVFVSRV9NQUdfRklMVEVSLCBAbUdMLk5FQVJFU1RcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzJELCBAbUdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgQG1HTC5ORUFSRVNUXG4gICAgICAgICAgICBlbHNlIGlmIGZpbHRlciA9PSBSZW5kZXJlci5GSUxURVIuTElORUFSXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8yRCwgQG1HTC5URVhUVVJFX01BR19GSUxURVIsIEBtR0wuTElORUFSXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8yRCwgQG1HTC5URVhUVVJFX01JTl9GSUxURVIsIEBtR0wuTElORUFSXG4gICAgICAgICAgICBlbHNlIGlmIGZpbHRlciA9PSBSZW5kZXJlci5GSUxURVIuTUlQTUFQXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8yRCwgQG1HTC5URVhUVVJFX01BR19GSUxURVIsIEBtR0wuTElORUFSXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8yRCwgQG1HTC5URVhUVVJFX01JTl9GSUxURVIsIEBtR0wuTElORUFSX01JUE1BUF9MSU5FQVJcbiAgICAgICAgICAgICAgICBAbUdMLmdlbmVyYXRlTWlwbWFwIEBtR0wuVEVYVFVSRV8yRFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfMkQsIEBtR0wuVEVYVFVSRV9NQUdfRklMVEVSLCBAbUdMLkxJTkVBUlxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfMkQsIEBtR0wuVEVYVFVSRV9NSU5fRklMVEVSLCBAbUdMLk5FQVJFU1RfTUlQTUFQX0xJTkVBUlxuICAgICAgICAgICAgICAgIEBtR0wuZ2VuZXJhdGVNaXBtYXAgQG1HTC5URVhUVVJFXzJEXG4gICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV8yRCwgbnVsbFxuICAgICAgICBlbHNlIGlmIHR5cGUgPT0gUmVuZGVyZXIuVEVYVFlQRS5UM0RcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCBpZFxuICAgICAgICAgICAgQG1HTC5waXhlbFN0b3JlaSBAbUdMLlVOUEFDS19GTElQX1lfV0VCR0wsIGZsaXBZXG4gICAgICAgICAgICBAbUdMLmFjdGl2ZVRleHR1cmUgQG1HTC5URVhUVVJFMFxuICAgICAgICAgICAgQG1HTC50ZXhJbWFnZTJEIEBtR0wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YLCAwLCBnbEZvVHkubUdMRm9ybWF0LCBnbEZvVHkubUdMRXh0ZXJuYWwsIGdsRm9UeS5tR0xUeXBlLCBpbWFnZVswXVxuICAgICAgICAgICAgQG1HTC50ZXhJbWFnZTJEIEBtR0wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9YLCAwLCBnbEZvVHkubUdMRm9ybWF0LCBnbEZvVHkubUdMRXh0ZXJuYWwsIGdsRm9UeS5tR0xUeXBlLCBpbWFnZVsxXVxuICAgICAgICAgICAgQG1HTC50ZXhJbWFnZTJEIEBtR0wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9ZLCAwLCBnbEZvVHkubUdMRm9ybWF0LCBnbEZvVHkubUdMRXh0ZXJuYWwsIGdsRm9UeS5tR0xUeXBlLCBpZiBmbGlwWSB0aGVuIGltYWdlWzNdIGVsc2UgaW1hZ2VbMl1cbiAgICAgICAgICAgIEBtR0wudGV4SW1hZ2UyRCBAbUdMLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWSwgMCwgZ2xGb1R5Lm1HTEZvcm1hdCwgZ2xGb1R5Lm1HTEV4dGVybmFsLCBnbEZvVHkubUdMVHlwZSwgaWYgZmxpcFkgdGhlbiBpbWFnZVsyXSBlbHNlIGltYWdlWzNdXG4gICAgICAgICAgICBAbUdMLnRleEltYWdlMkQgQG1HTC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1osIDAsIGdsRm9UeS5tR0xGb3JtYXQsIGdsRm9UeS5tR0xFeHRlcm5hbCwgZ2xGb1R5Lm1HTFR5cGUsIGltYWdlWzRdXG4gICAgICAgICAgICBAbUdMLnRleEltYWdlMkQgQG1HTC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1osIDAsIGdsRm9UeS5tR0xGb3JtYXQsIGdsRm9UeS5tR0xFeHRlcm5hbCwgZ2xGb1R5Lm1HTFR5cGUsIGltYWdlWzVdXG4gICAgICAgICAgICBpZiBmaWx0ZXIgPT0gUmVuZGVyZXIuRklMVEVSLk5PTkVcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCBAbUdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgQG1HTC5ORUFSRVNUXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV9DVUJFX01BUCwgQG1HTC5URVhUVVJFX01JTl9GSUxURVIsIEBtR0wuTkVBUkVTVFxuICAgICAgICAgICAgZWxzZSBpZiBmaWx0ZXIgPT0gUmVuZGVyZXIuRklMVEVSLkxJTkVBUlxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfQ1VCRV9NQVAsIEBtR0wuVEVYVFVSRV9NQUdfRklMVEVSLCBAbUdMLkxJTkVBUlxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfQ1VCRV9NQVAsIEBtR0wuVEVYVFVSRV9NSU5fRklMVEVSLCBAbUdMLkxJTkVBUlxuICAgICAgICAgICAgZWxzZSBpZiBmaWx0ZXIgPT0gUmVuZGVyZXIuRklMVEVSLk1JUE1BUFxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfQ1VCRV9NQVAsIEBtR0wuVEVYVFVSRV9NQUdfRklMVEVSLCBAbUdMLkxJTkVBUlxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfQ1VCRV9NQVAsIEBtR0wuVEVYVFVSRV9NSU5fRklMVEVSLCBAbUdMLkxJTkVBUl9NSVBNQVBfTElORUFSXG4gICAgICAgICAgICAgICAgQG1HTC5nZW5lcmF0ZU1pcG1hcCBAbUdMLlRFWFRVUkVfQ1VCRV9NQVBcbiAgICAgICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCBudWxsXG4gICAgICAgIHJldHVyblxuICAgICAgICAgICAgbU9iamVjdElEOiBpZFxuICAgICAgICAgICAgbVhyZXM6IGltYWdlLndpZHRoXG4gICAgICAgICAgICBtWXJlczogaW1hZ2UuaGVpZ2h0XG4gICAgICAgICAgICBtRm9ybWF0OiBmb3JtYXRcbiAgICAgICAgICAgIG1UeXBlOiB0eXBlXG4gICAgICAgICAgICBtRmlsdGVyOiBmaWx0ZXJcbiAgICAgICAgICAgIG1XcmFwOiB3cmFwXG5cbiAgICBzZXRTYW1wbGVyRmlsdGVyOiAodGUsIGZpbHRlciwgZG9HZW5lcmF0ZU1pcHNJZk5lZWRlZCkgLT5cbiAgICAgICAgaWYgdGUubUZpbHRlciA9PSBmaWx0ZXJcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBpZiB0ZS5tVHlwZSA9PSBSZW5kZXJlci5URVhUWVBFLlQyRFxuICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfMkQsIHRlLm1PYmplY3RJRFxuICAgICAgICAgICAgaWYgZmlsdGVyID09IFJlbmRlcmVyLkZJTFRFUi5OT05FXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8yRCwgQG1HTC5URVhUVVJFX01BR19GSUxURVIsIEBtR0wuTkVBUkVTVFxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfMkQsIEBtR0wuVEVYVFVSRV9NSU5fRklMVEVSLCBAbUdMLk5FQVJFU1RcbiAgICAgICAgICAgIGVsc2UgaWYgZmlsdGVyID09IFJlbmRlcmVyLkZJTFRFUi5MSU5FQVJcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzJELCBAbUdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgQG1HTC5MSU5FQVJcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzJELCBAbUdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgQG1HTC5MSU5FQVJcbiAgICAgICAgICAgIGVsc2UgaWYgZmlsdGVyID09IFJlbmRlcmVyLkZJTFRFUi5NSVBNQVBcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzJELCBAbUdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgQG1HTC5MSU5FQVJcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzJELCBAbUdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgQG1HTC5MSU5FQVJfTUlQTUFQX0xJTkVBUlxuICAgICAgICAgICAgICAgIGlmIGRvR2VuZXJhdGVNaXBzSWZOZWVkZWRcbiAgICAgICAgICAgICAgICAgICAgQG1HTC5nZW5lcmF0ZU1pcG1hcCBAbUdMLlRFWFRVUkVfMkRcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzJELCBAbUdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgQG1HTC5ORUFSRVNUXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8yRCwgQG1HTC5URVhUVVJFX01JTl9GSUxURVIsIEBtR0wuTkVBUkVTVF9NSVBNQVBfTElORUFSXG4gICAgICAgICAgICAgICAgaWYgZG9HZW5lcmF0ZU1pcHNJZk5lZWRlZFxuICAgICAgICAgICAgICAgICAgICBAbUdMLmdlbmVyYXRlTWlwbWFwIEBtR0wuVEVYVFVSRV8yRFxuICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfMkQsIG51bGxcbiAgICAgICAgZWxzZSBpZiB0ZS5tVHlwZSA9PSBSZW5kZXJlci5URVhUWVBFLlQzRFxuICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfM0QsIHRlLm1PYmplY3RJRFxuICAgICAgICAgICAgaWYgZmlsdGVyID09IFJlbmRlcmVyLkZJTFRFUi5OT05FXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8zRCwgQG1HTC5URVhUVVJFX01BR19GSUxURVIsIEBtR0wuTkVBUkVTVFxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfM0QsIEBtR0wuVEVYVFVSRV9NSU5fRklMVEVSLCBAbUdMLk5FQVJFU1RcbiAgICAgICAgICAgIGVsc2UgaWYgZmlsdGVyID09IFJlbmRlcmVyLkZJTFRFUi5MSU5FQVJcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzNELCBAbUdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgQG1HTC5MSU5FQVJcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzNELCBAbUdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgQG1HTC5MSU5FQVJcbiAgICAgICAgICAgIGVsc2UgaWYgZmlsdGVyID09IFJlbmRlcmVyLkZJTFRFUi5NSVBNQVBcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzNELCBAbUdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgQG1HTC5MSU5FQVJcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzNELCBAbUdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgQG1HTC5MSU5FQVJfTUlQTUFQX0xJTkVBUlxuICAgICAgICAgICAgICAgIGlmIGRvR2VuZXJhdGVNaXBzSWZOZWVkZWRcbiAgICAgICAgICAgICAgICAgICAgQG1HTC5nZW5lcmF0ZU1pcG1hcCBAbUdMLlRFWFRVUkVfM0RcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzNELCBAbUdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgQG1HTC5ORUFSRVNUXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8zRCwgQG1HTC5URVhUVVJFX01JTl9GSUxURVIsIEBtR0wuTkVBUkVTVF9NSVBNQVBfTElORUFSXG4gICAgICAgICAgICAgICAgaWYgZG9HZW5lcmF0ZU1pcHNJZk5lZWRlZFxuICAgICAgICAgICAgICAgICAgICBAbUdMLmdlbmVyYXRlTWlwbWFwIEBtR0wuVEVYVFVSRV8zRFxuICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfM0QsIG51bGxcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfQ1VCRV9NQVAsIHRlLm1PYmplY3RJRFxuICAgICAgICAgICAgaWYgZmlsdGVyID09IFJlbmRlcmVyLkZJTFRFUi5OT05FXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV9DVUJFX01BUCwgQG1HTC5URVhUVVJFX01BR19GSUxURVIsIEBtR0wuTkVBUkVTVFxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfQ1VCRV9NQVAsIEBtR0wuVEVYVFVSRV9NSU5fRklMVEVSLCBAbUdMLk5FQVJFU1RcbiAgICAgICAgICAgIGVsc2UgaWYgZmlsdGVyID09IFJlbmRlcmVyLkZJTFRFUi5MSU5FQVJcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCBAbUdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgQG1HTC5MSU5FQVJcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCBAbUdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgQG1HTC5MSU5FQVJcbiAgICAgICAgICAgIGVsc2UgaWYgZmlsdGVyID09IFJlbmRlcmVyLkZJTFRFUi5NSVBNQVBcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCBAbUdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgQG1HTC5MSU5FQVJcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCBAbUdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgQG1HTC5MSU5FQVJfTUlQTUFQX0xJTkVBUlxuICAgICAgICAgICAgICAgIGlmIGRvR2VuZXJhdGVNaXBzSWZOZWVkZWRcbiAgICAgICAgICAgICAgICAgICAgQG1HTC5nZW5lcmF0ZU1pcG1hcCBAbUdMLlRFWFRVUkVfQ1VCRV9NQVBcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCBAbUdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgQG1HTC5ORUFSRVNUXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV9DVUJFX01BUCwgQG1HTC5URVhUVVJFX01JTl9GSUxURVIsIEBtR0wuTkVBUkVTVF9NSVBNQVBfTElORUFSXG4gICAgICAgICAgICAgICAgaWYgZG9HZW5lcmF0ZU1pcHNJZk5lZWRlZFxuICAgICAgICAgICAgICAgICAgICBAbUdMLmdlbmVyYXRlTWlwbWFwIEBtR0wuVEVYVFVSRV9DVUJFX01BUFxuICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfQ1VCRV9NQVAsIG51bGxcbiAgICAgICAgdGUubUZpbHRlciA9IGZpbHRlclxuXG4gICAgc2V0U2FtcGxlcldyYXA6ICh0ZSwgd3JhcCkgLT5cbiAgICAgICAgaWYgdGUubVdyYXAgPT0gd3JhcFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIGdsV3JhcCA9IEBtR0wuUkVQRUFUXG4gICAgICAgIGlmIHdyYXAgPT0gUmVuZGVyZXIuVEVYV1JQLkNMQU1QXG4gICAgICAgICAgICBnbFdyYXAgPSBAbUdMLkNMQU1QX1RPX0VER0VcbiAgICAgICAgaWQgPSB0ZS5tT2JqZWN0SURcbiAgICAgICAgaWYgdGUubVR5cGUgPT0gUmVuZGVyZXIuVEVYVFlQRS5UMkRcbiAgICAgICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFXzJELCBpZFxuICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8yRCwgQG1HTC5URVhUVVJFX1dSQVBfUywgZ2xXcmFwXG4gICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzJELCBAbUdMLlRFWFRVUkVfV1JBUF9ULCBnbFdyYXBcbiAgICAgICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFXzJELCBudWxsXG4gICAgICAgIGVsc2UgaWYgdGUubVR5cGUgPT0gUmVuZGVyZXIuVEVYVFlQRS5UM0RcbiAgICAgICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFXzNELCBpZFxuICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8zRCwgQG1HTC5URVhUVVJFX1dSQVBfUiwgZ2xXcmFwXG4gICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzNELCBAbUdMLlRFWFRVUkVfV1JBUF9TLCBnbFdyYXBcbiAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfM0QsIEBtR0wuVEVYVFVSRV9XUkFQX1QsIGdsV3JhcFxuICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfM0QsIG51bGxcbiAgICAgICAgdGUubVdyYXAgPSB3cmFwXG5cbiAgICBjcmVhdGVNaXBtYXBzOiAodGUpIC0+XG4gICAgICAgIGlmIHRlLm1UeXBlID09IFJlbmRlcmVyLlRFWFRZUEUuVDJEXG4gICAgICAgICAgICBAbUdMLmFjdGl2ZVRleHR1cmUgQG1HTC5URVhUVVJFMFxuICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfMkQsIHRlLm1PYmplY3RJRFxuICAgICAgICAgICAgQG1HTC5nZW5lcmF0ZU1pcG1hcCBAbUdMLlRFWFRVUkVfMkRcbiAgICAgICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFXzJELCBudWxsXG4gICAgICAgIGVsc2UgaWYgdGUubVR5cGUgPT0gUmVuZGVyZXIuVEVYVFlQRS5DVUJFTUFQXG4gICAgICAgICAgICBAbUdMLmFjdGl2ZVRleHR1cmUgQG1HTC5URVhUVVJFMFxuICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfQ1VCRV9NQVAsIHRlLm1PYmplY3RJRFxuICAgICAgICAgICAgQG1HTC5nZW5lcmF0ZU1pcG1hcCBAbUdMLlRFWFRVUkVfQ1VCRV9NQVBcbiAgICAgICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCBudWxsXG5cbiAgICB1cGRhdGVUZXh0dXJlOiAodGV4LCB4MCwgeTAsIHhyZXMsIHlyZXMsIGJ1ZmZlcikgLT5cbiAgICAgICAgZ2xGb1R5ID0gQGlGb3JtYXRQSTJHTCh0ZXgubUZvcm1hdClcbiAgICAgICAgaWYgdGV4Lm1UeXBlID09IFJlbmRlcmVyLlRFWFRZUEUuVDJEXG4gICAgICAgICAgICBAbUdMLmFjdGl2ZVRleHR1cmUgQG1HTC5URVhUVVJFMFxuICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfMkQsIHRleC5tT2JqZWN0SURcbiAgICAgICAgICAgIEBtR0wucGl4ZWxTdG9yZWkgQG1HTC5VTlBBQ0tfRkxJUF9ZX1dFQkdMLCBmYWxzZVxuICAgICAgICAgICAgQG1HTC50ZXhTdWJJbWFnZTJEIEBtR0wuVEVYVFVSRV8yRCwgMCwgeDAsIHkwLCB4cmVzLCB5cmVzLCBnbEZvVHkubUdMRXh0ZXJuYWwsIGdsRm9UeS5tR0xUeXBlLCBidWZmZXJcbiAgICAgICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFXzJELCBudWxsXG5cbiAgICB1cGRhdGVUZXh0dXJlRnJvbUltYWdlOiAodGV4LCBpbWFnZSkgLT5cbiAgICAgICAgZ2xGb1R5ID0gQGlGb3JtYXRQSTJHTCh0ZXgubUZvcm1hdClcbiAgICAgICAgaWYgdGV4Lm1UeXBlID09IFJlbmRlcmVyLlRFWFRZUEUuVDJEXG4gICAgICAgICAgICBAbUdMLmFjdGl2ZVRleHR1cmUgQG1HTC5URVhUVVJFMFxuICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfMkQsIHRleC5tT2JqZWN0SURcbiAgICAgICAgICAgIEBtR0wucGl4ZWxTdG9yZWkgQG1HTC5VTlBBQ0tfRkxJUF9ZX1dFQkdMLCBmYWxzZVxuICAgICAgICAgICAgQG1HTC50ZXhJbWFnZTJEIEBtR0wuVEVYVFVSRV8yRCwgMCwgZ2xGb1R5Lm1HTEZvcm1hdCwgZ2xGb1R5Lm1HTEV4dGVybmFsLCBnbEZvVHkubUdMVHlwZSwgaW1hZ2VcbiAgICAgICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFXzJELCBudWxsXG5cbiAgICBkZXN0cm95VGV4dHVyZTogKHRlKSAtPiBpZiB0ZT8ubU9iamVjdElEIHRoZW4gQG1HTC5kZWxldGVUZXh0dXJlIHRlLm1PYmplY3RJRFxuXG4gICAgYXR0YWNoVGV4dHVyZXM6IChudW0sIHQwLCB0MSwgdDIsIHQzKSAtPlxuICAgICAgICBpZiBudW0gPiAwIGFuZCB0MCAhPSBudWxsXG4gICAgICAgICAgICBAbUdMLmFjdGl2ZVRleHR1cmUgQG1HTC5URVhUVVJFMFxuICAgICAgICAgICAgaWYgdDAubVR5cGUgPT0gUmVuZGVyZXIuVEVYVFlQRS5UMkRcbiAgICAgICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV8yRCwgdDAubU9iamVjdElEXG4gICAgICAgICAgICBlbHNlIGlmIHQwLm1UeXBlID09IFJlbmRlcmVyLlRFWFRZUEUuVDNEXG4gICAgICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfM0QsIHQwLm1PYmplY3RJRFxuICAgICAgICAgICAgZWxzZSBpZiB0MC5tVHlwZSA9PSBSZW5kZXJlci5URVhUWVBFLkNVQkVNQVBcbiAgICAgICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV9DVUJFX01BUCwgdDAubU9iamVjdElEXG4gICAgICAgIGlmIG51bSA+IDEgYW5kIHQxICE9IG51bGxcbiAgICAgICAgICAgIEBtR0wuYWN0aXZlVGV4dHVyZSBAbUdMLlRFWFRVUkUxXG4gICAgICAgICAgICBpZiB0MS5tVHlwZSA9PSBSZW5kZXJlci5URVhUWVBFLlQyRFxuICAgICAgICAgICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFXzJELCB0MS5tT2JqZWN0SURcbiAgICAgICAgICAgIGVsc2UgaWYgdDEubVR5cGUgPT0gUmVuZGVyZXIuVEVYVFlQRS5UM0RcbiAgICAgICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV8zRCwgdDEubU9iamVjdElEXG4gICAgICAgICAgICBlbHNlIGlmIHQxLm1UeXBlID09IFJlbmRlcmVyLlRFWFRZUEUuQ1VCRU1BUFxuICAgICAgICAgICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCB0MS5tT2JqZWN0SURcbiAgICAgICAgaWYgbnVtID4gMiBhbmQgdDIgIT0gbnVsbFxuICAgICAgICAgICAgQG1HTC5hY3RpdmVUZXh0dXJlIEBtR0wuVEVYVFVSRTJcbiAgICAgICAgICAgIGlmIHQyLm1UeXBlID09IFJlbmRlcmVyLlRFWFRZUEUuVDJEXG4gICAgICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfMkQsIHQyLm1PYmplY3RJRFxuICAgICAgICAgICAgZWxzZSBpZiB0Mi5tVHlwZSA9PSBSZW5kZXJlci5URVhUWVBFLlQzRFxuICAgICAgICAgICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFXzNELCB0Mi5tT2JqZWN0SURcbiAgICAgICAgICAgIGVsc2UgaWYgdDIubVR5cGUgPT0gUmVuZGVyZXIuVEVYVFlQRS5DVUJFTUFQXG4gICAgICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfQ1VCRV9NQVAsIHQyLm1PYmplY3RJRFxuICAgICAgICBpZiBudW0gPiAzIGFuZCB0MyAhPSBudWxsXG4gICAgICAgICAgICBAbUdMLmFjdGl2ZVRleHR1cmUgQG1HTC5URVhUVVJFM1xuICAgICAgICAgICAgaWYgdDMubVR5cGUgPT0gUmVuZGVyZXIuVEVYVFlQRS5UMkRcbiAgICAgICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV8yRCwgdDMubU9iamVjdElEXG4gICAgICAgICAgICBlbHNlIGlmIHQzLm1UeXBlID09IFJlbmRlcmVyLlRFWFRZUEUuVDNEXG4gICAgICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfM0QsIHQzLm1PYmplY3RJRFxuICAgICAgICAgICAgZWxzZSBpZiB0My5tVHlwZSA9PSBSZW5kZXJlci5URVhUWVBFLkNVQkVNQVBcbiAgICAgICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV9DVUJFX01BUCwgdDMubU9iamVjdElEXG4gICAgICAgIHJldHVyblxuXG4gICAgZGV0dGFjaFRleHR1cmVzOiAtPlxuICAgICAgICBAbUdMLmFjdGl2ZVRleHR1cmUgQG1HTC5URVhUVVJFMFxuICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV8yRCwgbnVsbFxuICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV9DVUJFX01BUCwgbnVsbFxuICAgICAgICBAbUdMLmFjdGl2ZVRleHR1cmUgQG1HTC5URVhUVVJFMVxuICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV8yRCwgbnVsbFxuICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV9DVUJFX01BUCwgbnVsbFxuICAgICAgICBAbUdMLmFjdGl2ZVRleHR1cmUgQG1HTC5URVhUVVJFMlxuICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV8yRCwgbnVsbFxuICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV9DVUJFX01BUCwgbnVsbFxuICAgICAgICBAbUdMLmFjdGl2ZVRleHR1cmUgQG1HTC5URVhUVVJFM1xuICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV8yRCwgbnVsbFxuICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV9DVUJFX01BUCwgbnVsbFxuXG4gICAgY3JlYXRlUmVuZGVyVGFyZ2V0OiAoY29sb3IwKSAtPlxuICAgICAgICBcbiAgICAgICAgaWQgPSBAbUdMLmNyZWF0ZUZyYW1lYnVmZmVyKClcbiAgICAgICAgQG1HTC5iaW5kRnJhbWVidWZmZXIgQG1HTC5GUkFNRUJVRkZFUiwgaWRcbiAgICAgICAgIyBAbUdMLmZyYW1lYnVmZmVyVGV4dHVyZTJEIEBtR0wuRlJBTUVCVUZGRVIsIEBtR0wuREVQVEhfQVRUQUNITUVOVCwgQG1HTC5URVhUVVJFXzJELCBkZXB0aC5tT2JqZWN0SUQsIDBcbiAgICAgICAgaWYgY29sb3IwXG4gICAgICAgICAgICBAbUdMLmZyYW1lYnVmZmVyVGV4dHVyZTJEIEBtR0wuRlJBTUVCVUZGRVIsIEBtR0wuQ09MT1JfQVRUQUNITUVOVDAsIEBtR0wuVEVYVFVSRV8yRCwgY29sb3IwLm1PYmplY3RJRCwgMFxuICAgICAgICBpZiBAbUdMLmNoZWNrRnJhbWVidWZmZXJTdGF0dXMoQG1HTC5GUkFNRUJVRkZFUikgIT0gQG1HTC5GUkFNRUJVRkZFUl9DT01QTEVURVxuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgQG1HTC5iaW5kUmVuZGVyYnVmZmVyIEBtR0wuUkVOREVSQlVGRkVSLCBudWxsXG4gICAgICAgIEBtR0wuYmluZEZyYW1lYnVmZmVyICBAbUdMLkZSQU1FQlVGRkVSLCBudWxsXG4gICAgICAgIHJldHVyblxuICAgICAgICAgICAgbU9iamVjdElEOiBpZFxuICAgICAgICAgICAgbVRleDA6IGNvbG9yMFxuXG4gICAgZGVzdHJveVJlbmRlclRhcmdldDogKHRleCkgLT5cbiAgICAgICAgQG1HTC5kZWxldGVGcmFtZWJ1ZmZlciB0ZXgubU9iamVjdElEXG5cbiAgICBzZXRSZW5kZXJUYXJnZXQ6ICh0ZXgpIC0+IEBtR0wuYmluZEZyYW1lYnVmZmVyIEBtR0wuRlJBTUVCVUZGRVIsIHRleD8ubU9iamVjdElEXG5cbiAgICBjcmVhdGVSZW5kZXJUYXJnZXROZXc6ICh3YW50Q29sb3IwLCB3YW50WmJ1ZmZlciwgeHJlcywgeXJlcywgc2FtcGxlcykgLT5cbiAgICAgICAgaWQgPSBAbUdMLmNyZWF0ZUZyYW1lYnVmZmVyKClcbiAgICAgICAgQG1HTC5iaW5kRnJhbWVidWZmZXIgQG1HTC5GUkFNRUJVRkZFUiwgaWRcbiAgICAgICAgaWYgd2FudFpidWZmZXIgPT0gdHJ1ZVxuICAgICAgICAgICAgemIgPSBAbUdMLmNyZWF0ZVJlbmRlcmJ1ZmZlcigpXG4gICAgICAgICAgICBAbUdMLmJpbmRSZW5kZXJidWZmZXIgQG1HTC5SRU5ERVJCVUZGRVIsIHpiXG4gICAgICAgICAgICBpZiBzYW1wbGVzID09IDFcbiAgICAgICAgICAgICAgICBAbUdMLnJlbmRlcmJ1ZmZlclN0b3JhZ2UgQG1HTC5SRU5ERVJCVUZGRVIsIEBtR0wuREVQVEhfQ09NUE9ORU5UMTYsIHhyZXMsIHlyZXNcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAbUdMLnJlbmRlcmJ1ZmZlclN0b3JhZ2VNdWx0aXNhbXBsZSBAbUdMLlJFTkRFUkJVRkZFUiwgc2FtcGxlcywgQG1HTC5ERVBUSF9DT01QT05FTlQxNiwgeHJlcywgeXJlc1xuICAgICAgICAgICAgQG1HTC5mcmFtZWJ1ZmZlclJlbmRlcmJ1ZmZlciBAbUdMLkZSQU1FQlVGRkVSLCBAbUdMLkRFUFRIX0FUVEFDSE1FTlQsIEBtR0wuUkVOREVSQlVGRkVSLCB6YlxuICAgICAgICBpZiB3YW50Q29sb3IwXG4gICAgICAgICAgICBjYiA9IEBtR0wuY3JlYXRlUmVuZGVyYnVmZmVyKClcbiAgICAgICAgICAgIEBtR0wuYmluZFJlbmRlcmJ1ZmZlciBAbUdMLlJFTkRFUkJVRkZFUiwgY2JcbiAgICAgICAgICAgIGlmIHNhbXBsZXMgPT0gMVxuICAgICAgICAgICAgICAgIEBtR0wucmVuZGVyYnVmZmVyU3RvcmFnZSBAbUdMLlJFTkRFUkJVRkZFUiwgQG1HTC5SR0JBOCwgeHJlcywgeXJlc1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBtR0wucmVuZGVyYnVmZmVyU3RvcmFnZU11bHRpc2FtcGxlIEBtR0wuUkVOREVSQlVGRkVSLCBzYW1wbGVzLCBAbUdMLlJHQkE4LCB4cmVzLCB5cmVzXG4gICAgICAgICAgICBAbUdMLmZyYW1lYnVmZmVyUmVuZGVyYnVmZmVyIEBtR0wuRlJBTUVCVUZGRVIsIEBtR0wuQ09MT1JfQVRUQUNITUVOVDAsIEBtR0wuUkVOREVSQlVGRkVSLCBjYlxuICAgICAgICBpZiBAbUdMLmNoZWNrRnJhbWVidWZmZXJTdGF0dXMobUdMLkZSQU1FQlVGRkVSKSAhPSBAbUdMLkZSQU1FQlVGRkVSX0NPTVBMRVRFXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICBAbUdMLmJpbmRSZW5kZXJidWZmZXIgQG1HTC5SRU5ERVJCVUZGRVIsIG51bGxcbiAgICAgICAgQG1HTC5iaW5kRnJhbWVidWZmZXIgQG1HTC5GUkFNRUJVRkZFUiwgbnVsbFxuICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIG1PYmplY3RJRDogaWRcbiAgICAgICAgICAgIG1YcmVzOiB4cmVzXG4gICAgICAgICAgICBtWXJlczogeXJlc1xuICAgICAgICAgICAgbVRleDA6IGNvbG9yMFxuXG4gICAgY3JlYXRlUmVuZGVyVGFyZ2V0Q3ViZU1hcDogKGNvbG9yMCkgLT5cbiAgICAgICAgaWQgPSBAbUdMLmNyZWF0ZUZyYW1lYnVmZmVyKClcbiAgICAgICAgQG1HTC5iaW5kRnJhbWVidWZmZXIgQG1HTC5GUkFNRUJVRkZFUiwgaWRcbiAgICAgICAgQG1HTC5mcmFtZWJ1ZmZlclRleHR1cmUyRCBAbUdMLkZSQU1FQlVGRkVSLCBAbUdMLkRFUFRIX0FUVEFDSE1FTlQsIEBtR0wuVEVYVFVSRV8yRCwgZGVwdGgubU9iamVjdElELCAwXG4gICAgICAgIGlmIGNvbG9yMCAhPSBudWxsXG4gICAgICAgICAgICBAbUdMLmZyYW1lYnVmZmVyVGV4dHVyZTJEIEBtR0wuRlJBTUVCVUZGRVIsIEBtR0wuQ09MT1JfQVRUQUNITUVOVDAsIEBtR0wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YLCBjb2xvcjAubU9iamVjdElELCAwXG4gICAgICAgIGlmIEBtR0wuY2hlY2tGcmFtZWJ1ZmZlclN0YXR1cyhtR0wuRlJBTUVCVUZGRVIpICE9IEBtR0wuRlJBTUVCVUZGRVJfQ09NUExFVEVcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIEBtR0wuYmluZFJlbmRlcmJ1ZmZlciBAbUdMLlJFTkRFUkJVRkZFUiwgbnVsbFxuICAgICAgICBAbUdMLmJpbmRGcmFtZWJ1ZmZlciBAbUdMLkZSQU1FQlVGRkVSLCBudWxsXG4gICAgICAgIHJldHVyblxuICAgICAgICAgICAgbU9iamVjdElEOiBpZFxuICAgICAgICAgICAgbVRleDA6IGNvbG9yMFxuXG4gICAgc2V0UmVuZGVyVGFyZ2V0Q3ViZU1hcDogKGZibywgZmFjZSkgLT5cbiAgICAgICAgaWYgZmJvID09IG51bGxcbiAgICAgICAgICAgIEBtR0wuYmluZEZyYW1lYnVmZmVyIEBtR0wuRlJBTUVCVUZGRVIsIG51bGxcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQG1HTC5iaW5kRnJhbWVidWZmZXIgQG1HTC5GUkFNRUJVRkZFUiwgZmJvLm1PYmplY3RJRFxuICAgICAgICAgICAgQG1HTC5mcmFtZWJ1ZmZlclRleHR1cmUyRCBAbUdMLkZSQU1FQlVGRkVSLCBAbUdMLkNPTE9SX0FUVEFDSE1FTlQwLCBAbUdMLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWCArIGZhY2UsIGZiby5tVGV4MC5tT2JqZWN0SUQsIDBcblxuICAgIGJsaXRSZW5kZXJUYXJnZXQ6IChkc3QsIHNyYykgLT5cbiAgICAgICAgQG1HTC5iaW5kRnJhbWVidWZmZXIgQG1HTC5SRUFEX0ZSQU1FQlVGRkVSLCBzcmMubU9iamVjdElEXG4gICAgICAgIEBtR0wuYmluZEZyYW1lYnVmZmVyIEBtR0wuRFJBV19GUkFNRUJVRkZFUiwgZHN0Lm1PYmplY3RJRFxuICAgICAgICBAbUdMLmNsZWFyQnVmZmVyZnYgQG1HTC5DT0xPUiwgMCwgWyAwIDAgMCAxIF1cbiAgICAgICAgQG1HTC5ibGl0RnJhbWVidWZmZXIgMCwgMCwgc3JjLm1YcmVzLCBzcmMubVlyZXMsIDAsIDAsIHNyYy5tWHJlcywgc3JjLm1ZcmVzLCBAbUdMLkNPTE9SX0JVRkZFUl9CSVQsIEBtR0wuTElORUFSXG5cbiAgICBzZXRWaWV3cG9ydDogKHZwKSAtPlxuICAgICAgICBAbUdMLnZpZXdwb3J0IHZwWzBdLCB2cFsxXSwgdnBbMl0sIHZwWzNdXG5cbiAgICBzZXRXcml0ZU1hc2s6IChjMCwgYzEsIGMyLCBjMywgeikgLT5cbiAgICAgICAgQG1HTC5kZXB0aE1hc2sgelxuICAgICAgICBAbUdMLmNvbG9yTWFzayBjMCwgYzAsIGMwLCBjMFxuXG4gICAgc2V0U3RhdGU6IChzdGF0ZU5hbWUsIHN0YXRlVmFsdWUpIC0+XG4gICAgICAgIGlmIHN0YXRlTmFtZSA9PSBSZW5kZXJlci5SRU5EU1RHQVRFLldJUkVGUkFNRVxuICAgICAgICAgICAgaWYgc3RhdGVWYWx1ZVxuICAgICAgICAgICAgICAgIEBtR0wucG9seWdvbk1vZGUgQG1HTC5GUk9OVF9BTkRfQkFDSywgQG1HTC5MSU5FXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQG1HTC5wb2x5Z29uTW9kZSBAbUdMLkZST05UX0FORF9CQUNLLCBAbUdMLkZJTExcbiAgICAgICAgZWxzZSBpZiBzdGF0ZU5hbWUgPT0gUmVuZGVyZXIuUkVORFNUR0FURS5GUk9OVF9GQUNFXG4gICAgICAgICAgICBpZiBzdGF0ZVZhbHVlXG4gICAgICAgICAgICAgICAgQG1HTC5jdWxsRmFjZSBAbUdMLkJBQ0tcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAbUdMLmN1bGxGYWNlIEBtR0wuRlJPTlRcbiAgICAgICAgZWxzZSBpZiBzdGF0ZU5hbWUgPT0gUmVuZGVyZXIuUkVORFNUR0FURS5DVUxMX0ZBQ0VcbiAgICAgICAgICAgIGlmIHN0YXRlVmFsdWVcbiAgICAgICAgICAgICAgICBAbUdMLmVuYWJsZSBAbUdMLkNVTExfRkFDRVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBtR0wuZGlzYWJsZSBAbUdMLkNVTExfRkFDRVxuICAgICAgICBlbHNlIGlmIHN0YXRlTmFtZSA9PSBSZW5kZXJlci5SRU5EU1RHQVRFLkRFUFRIX1RFU1RcbiAgICAgICAgICAgIGlmIHN0YXRlVmFsdWVcbiAgICAgICAgICAgICAgICBAbUdMLmVuYWJsZSBAbUdMLkRFUFRIX1RFU1RcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAbUdMLmRpc2FibGUgQG1HTC5ERVBUSF9URVNUXG4gICAgICAgIGVsc2UgaWYgc3RhdGVOYW1lID09IFJlbmRlcmVyLlJFTkRTVEdBVEUuQUxQSEFfVE9fQ09WRVJBR0VcbiAgICAgICAgICAgIGlmIHN0YXRlVmFsdWVcbiAgICAgICAgICAgICAgICBAbUdMLmVuYWJsZSBAbUdMLlNBTVBMRV9BTFBIQV9UT19DT1ZFUkFHRVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBtR0wuZGlzYWJsZSBAbUdMLlNBTVBMRV9BTFBIQV9UT19DT1ZFUkFHRVxuXG4gICAgc2V0TXVsdGlzYW1wbGU6ICh2KSAtPlxuICAgICAgICBpZiB2ID09IHRydWVcbiAgICAgICAgICAgIEBtR0wuZW5hYmxlIEBtR0wuU0FNUExFX0NPVkVSQUdFXG4gICAgICAgICAgICBAbUdMLnNhbXBsZUNvdmVyYWdlIDEuMCwgZmFsc2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQG1HTC5kaXNhYmxlIEBtR0wuU0FNUExFX0NPVkVSQUdFXG5cbiAgICBjcmVhdGVTaGFkZXI6ICh2c1NvdXJjZSwgZnNTb3VyY2UpIC0+XG4gICAgICAgIGlmIEBtR0wgPT0gbnVsbFxuICAgICAgICAgICAgcmV0dXJuIFxuICAgICAgICAgICAgICAgIG1Qcm9ncmFtOiBudWxsXG4gICAgICAgICAgICAgICAgbVJlc3VsdDogZmFsc2VcbiAgICAgICAgICAgICAgICBtSW5mbzogJ05vIFdlYkdMJ1xuICAgICAgICAgICAgICAgIG1IZWFkZXJMaW5lczogMFxuICAgICAgICB0ZSA9IFxuICAgICAgICAgICAgbVByb2dyYW06IG51bGxcbiAgICAgICAgICAgIG1SZXN1bHQ6IHRydWVcbiAgICAgICAgICAgIG1JbmZvOiAnU2hhZGVyIGNvbXBpbGVkIHN1Y2Nlc3NmdWxseSdcbiAgICAgICAgICAgIG1IZWFkZXJMaW5lczogMFxuICAgICAgICAgICAgbUVycm9yVHlwZTogMFxuICAgICAgICB2cyA9IEBtR0wuY3JlYXRlU2hhZGVyKEBtR0wuVkVSVEVYX1NIQURFUilcbiAgICAgICAgZnMgPSBAbUdMLmNyZWF0ZVNoYWRlcihAbUdMLkZSQUdNRU5UX1NIQURFUilcbiAgICAgICAgbVNoYWRlckhlYWRlciA9ICcjdmVyc2lvbiAzMDAgZXNcXG4nICsgJyNpZmRlZiBHTF9FU1xcbicgKyAncHJlY2lzaW9uIGhpZ2hwIGZsb2F0O1xcbicgKyAncHJlY2lzaW9uIGhpZ2hwIGludDtcXG4nICsgJ3ByZWNpc2lvbiBtZWRpdW1wIHNhbXBsZXIzRDtcXG4nICsgJyNlbmRpZlxcbidcbiAgICAgICAgQG1HTC5zaGFkZXJTb3VyY2UgdnMsIG1TaGFkZXJIZWFkZXIgKyB2c1NvdXJjZVxuICAgICAgICBAbUdMLnNoYWRlclNvdXJjZSBmcywgbVNoYWRlckhlYWRlciArIGZzU291cmNlXG4gICAgICAgIEBtR0wuY29tcGlsZVNoYWRlciB2c1xuICAgICAgICBAbUdMLmNvbXBpbGVTaGFkZXIgZnNcbiAgICAgICAgaWYgbm90IEBtR0wuZ2V0U2hhZGVyUGFyYW1ldGVyKHZzLCBAbUdMLkNPTVBJTEVfU1RBVFVTKVxuICAgICAgICAgICAgaW5mb0xvZyA9IEBtR0wuZ2V0U2hhZGVySW5mb0xvZyh2cylcbiAgICAgICAgICAgIHRlLm1JbmZvID0gaW5mb0xvZ1xuICAgICAgICAgICAgdGUubUVycm9yVHlwZSA9IDBcbiAgICAgICAgICAgIHRlLm1SZXN1bHQgPSBmYWxzZVxuICAgICAgICAgICAgcmV0dXJuIHRlXG4gICAgICAgIGlmIG5vdCBAbUdMLmdldFNoYWRlclBhcmFtZXRlcihmcywgQG1HTC5DT01QSUxFX1NUQVRVUylcbiAgICAgICAgICAgIGluZm9Mb2cgPSBAbUdMLmdldFNoYWRlckluZm9Mb2coZnMpXG4gICAgICAgICAgICB0ZS5tSW5mbyA9IGluZm9Mb2dcbiAgICAgICAgICAgIHRlLm1FcnJvclR5cGUgPSAxXG4gICAgICAgICAgICB0ZS5tUmVzdWx0ID0gZmFsc2VcbiAgICAgICAgICAgIHJldHVybiB0ZVxuICAgICAgICB0ZS5tUHJvZ3JhbSA9IEBtR0wuY3JlYXRlUHJvZ3JhbSgpXG4gICAgICAgIEBtR0wuYXR0YWNoU2hhZGVyIHRlLm1Qcm9ncmFtLCB2c1xuICAgICAgICBAbUdMLmF0dGFjaFNoYWRlciB0ZS5tUHJvZ3JhbSwgZnNcbiAgICAgICAgQG1HTC5saW5rUHJvZ3JhbSB0ZS5tUHJvZ3JhbVxuICAgICAgICBpZiBub3QgQG1HTC5nZXRQcm9ncmFtUGFyYW1ldGVyKHRlLm1Qcm9ncmFtLCBAbUdMLkxJTktfU1RBVFVTKVxuICAgICAgICAgICAgaW5mb0xvZyA9IEBtR0wuZ2V0UHJvZ3JhbUluZm9Mb2codGUubVByb2dyYW0pXG4gICAgICAgICAgICBAbUdMLmRlbGV0ZVByb2dyYW0gdGUubVByb2dyYW1cbiAgICAgICAgICAgIHRlLm1JbmZvID0gaW5mb0xvZ1xuICAgICAgICAgICAgdGUubUVycm9yVHlwZSA9IDJcbiAgICAgICAgICAgIHRlLm1SZXN1bHQgPSBmYWxzZVxuICAgICAgICB0ZVxuXG4gICAgYXR0YWNoU2hhZGVyOiAoc2hhZGVyKSAtPlxuICAgICAgICBAbUJpbmRlZFNoYWRlciA9IHNoYWRlclxuICAgICAgICBAbUdMLnVzZVByb2dyYW0gc2hhZGVyPy5tUHJvZ3JhbVxuXG4gICAgZGV0YWNoU2hhZGVyOiAtPiBAbUdMLnVzZVByb2dyYW0gbnVsbFxuXG4gICAgZGVzdHJveVNoYWRlcjogKHRleCkgLT4gQG1HTC5kZWxldGVQcm9ncmFtIHRleC5tUHJvZ3JhbVxuXG4gICAgZ2V0QXR0cmliTG9jYXRpb246IChzaGFkZXIsIG5hbWUpIC0+XG4gICAgICAgIEBtR0wuZ2V0QXR0cmliTG9jYXRpb24gc2hhZGVyLm1Qcm9ncmFtLCBuYW1lXG5cbiAgICBzZXRTaGFkZXJDb25zdGFudExvY2F0aW9uOiAoc2hhZGVyLCBuYW1lKSAtPlxuICAgICAgICBAbUdMLmdldFVuaWZvcm1Mb2NhdGlvbiBzaGFkZXIubVByb2dyYW0sIG5hbWVcblxuICAgIHNldFNoYWRlckNvbnN0YW50MUZfUG9zOiAocG9zLCB4KSAtPlxuICAgICAgICBAbUdMLnVuaWZvcm0xZiBwb3MsIHhcbiAgICAgICAgdHJ1ZVxuXG4gICAgc2V0U2hhZGVyQ29uc3RhbnQxRlZfUG9zOiAocG9zLCB4KSAtPlxuICAgICAgICBAbUdMLnVuaWZvcm0xZnYgcG9zLCB4XG4gICAgICAgIHRydWVcblxuICAgIHNldFNoYWRlckNvbnN0YW50MUY6ICh1bmFtZSwgeCkgLT5cbiAgICAgICAgcG9zID0gQG1HTC5nZXRVbmlmb3JtTG9jYXRpb24oQG1CaW5kZWRTaGFkZXIubVByb2dyYW0sIHVuYW1lKVxuICAgICAgICBpZiBwb3MgPT0gbnVsbFxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIEBtR0wudW5pZm9ybTFmIHBvcywgeFxuICAgICAgICB0cnVlXG5cbiAgICBzZXRTaGFkZXJDb25zdGFudDFJOiAodW5hbWUsIHgpIC0+XG4gICAgICAgIHBvcyA9IEBtR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKEBtQmluZGVkU2hhZGVyLm1Qcm9ncmFtLCB1bmFtZSlcbiAgICAgICAgaWYgcG9zID09IG51bGxcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICBAbUdMLnVuaWZvcm0xaSBwb3MsIHhcbiAgICAgICAgdHJ1ZVxuXG4gICAgc2V0U2hhZGVyQ29uc3RhbnQyRjogKHVuYW1lLCB4KSAtPlxuICAgICAgICBwb3MgPSBAbUdMLmdldFVuaWZvcm1Mb2NhdGlvbihAbUJpbmRlZFNoYWRlci5tUHJvZ3JhbSwgdW5hbWUpXG4gICAgICAgIGlmIHBvcyA9PSBudWxsXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgQG1HTC51bmlmb3JtMmZ2IHBvcywgeFxuICAgICAgICB0cnVlXG5cbiAgICBzZXRTaGFkZXJDb25zdGFudDNGOiAodW5hbWUsIHgsIHksIHopIC0+XG4gICAgICAgIHBvcyA9IEBtR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKEBtQmluZGVkU2hhZGVyLm1Qcm9ncmFtLCB1bmFtZSlcbiAgICAgICAgaWYgcG9zID09IG51bGxcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICBAbUdMLnVuaWZvcm0zZiBwb3MsIHgsIHksIHpcbiAgICAgICAgdHJ1ZVxuXG4gICAgc2V0U2hhZGVyQ29uc3RhbnQxRlY6ICh1bmFtZSwgeCkgLT5cbiAgICAgICAgcG9zID0gQG1HTC5nZXRVbmlmb3JtTG9jYXRpb24oQG1CaW5kZWRTaGFkZXIubVByb2dyYW0sIHVuYW1lKVxuICAgICAgICBpZiBwb3MgPT0gbnVsbFxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIEBtR0wudW5pZm9ybTFmdiBwb3MsIG5ldyBGbG9hdDMyQXJyYXkoeClcbiAgICAgICAgdHJ1ZVxuXG4gICAgc2V0U2hhZGVyQ29uc3RhbnQzRlY6ICh1bmFtZSwgeCkgLT5cbiAgICAgICAgcG9zID0gQG1HTC5nZXRVbmlmb3JtTG9jYXRpb24oQG1CaW5kZWRTaGFkZXIubVByb2dyYW0sIHVuYW1lKVxuICAgICAgICBpZiBwb3MgPT0gbnVsbFxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIEBtR0wudW5pZm9ybTNmdiBwb3MsIG5ldyBGbG9hdDMyQXJyYXkoeClcbiAgICAgICAgdHJ1ZVxuXG4gICAgc2V0U2hhZGVyQ29uc3RhbnQ0RlY6ICh1bmFtZSwgeCkgLT5cbiAgICAgICAgcG9zID0gQG1HTC5nZXRVbmlmb3JtTG9jYXRpb24oQG1CaW5kZWRTaGFkZXIubVByb2dyYW0sIHVuYW1lKVxuICAgICAgICBpZiBwb3MgPT0gbnVsbFxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIEBtR0wudW5pZm9ybTRmdiBwb3MsIG5ldyBGbG9hdDMyQXJyYXkoeClcbiAgICAgICAgdHJ1ZVxuXG4gICAgc2V0U2hhZGVyVGV4dHVyZVVuaXQ6ICh1bmFtZSwgdW5pdCkgLT5cbiAgICAgICAgcHJvZ3JhbSA9IEBtQmluZGVkU2hhZGVyXG4gICAgICAgIHBvcyA9IEBtR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0ubVByb2dyYW0sIHVuYW1lKVxuICAgICAgICBpZiBwb3MgPT0gbnVsbFxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIEBtR0wudW5pZm9ybTFpIHBvcywgdW5pdFxuICAgICAgICB0cnVlXG5cbiAgICBjcmVhdGVWZXJ0ZXhBcnJheTogKGRhdGEsIG1vZGUpIC0+XG4gICAgICAgIGlkID0gQG1HTC5jcmVhdGVCdWZmZXIoKVxuICAgICAgICBAbUdMLmJpbmRCdWZmZXIgQG1HTC5BUlJBWV9CVUZGRVIsIGlkXG4gICAgICAgIGlmIG1vZGUgPT0gbWUuQlVGVFlQRS5TVEFUSUNcbiAgICAgICAgICAgIEBtR0wuYnVmZmVyRGF0YSBAbUdMLkFSUkFZX0JVRkZFUiwgZGF0YSwgQG1HTC5TVEFUSUNfRFJBV1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbUdMLmJ1ZmZlckRhdGEgQG1HTC5BUlJBWV9CVUZGRVIsIGRhdGEsIEBtR0wuRFlOQU1JQ19EUkFXXG4gICAgICAgIHJldHVybiBtT2JqZWN0OmlkXG5cbiAgICBjcmVhdGVJbmRleEFycmF5OiAoZGF0YSwgbW9kZSkgLT5cbiAgICAgICAgaWQgPSBAbUdMLmNyZWF0ZUJ1ZmZlcigpXG4gICAgICAgIEBtR0wuYmluZEJ1ZmZlciBAbUdMLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBpZFxuICAgICAgICBpZiBtb2RlID09IG1lLkJVRlRZUEUuU1RBVElDXG4gICAgICAgICAgICBAbUdMLmJ1ZmZlckRhdGEgQG1HTC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgZGF0YSwgQG1HTC5TVEFUSUNfRFJBV1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbUdMLmJ1ZmZlckRhdGEgQG1HTC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgZGF0YSwgQG1HTC5EWU5BTUlDX0RSQVdcbiAgICAgICAgcmV0dXJuIG1PYmplY3Q6aWRcblxuICAgIGRlc3Ryb3lBcnJheTogKHRleCkgLT4gQG1HTC5kZXN0cm95QnVmZmVyIHRleC5tT2JqZWN0XG5cbiAgICBhdHRhY2hWZXJ0ZXhBcnJheTogKHRleCwgYXR0cmlicywgcG9zKSAtPlxuICAgICAgICBzaGFkZXIgPSBAbUJpbmRlZFNoYWRlclxuICAgICAgICBAbUdMLmJpbmRCdWZmZXIgQG1HTC5BUlJBWV9CVUZGRVIsIHRleC5tT2JqZWN0XG4gICAgICAgIG51bSA9IGF0dHJpYnMubUNoYW5uZWxzLmxlbmd0aFxuICAgICAgICBzdHJpZGUgPSBhdHRyaWJzLm1TdHJpZGVcbiAgICAgICAgb2Zmc2V0ID0gMFxuICAgICAgICBpID0gMFxuICAgICAgICB3aGlsZSBpIDwgbnVtXG4gICAgICAgICAgICBpZCA9IHBvc1tpXVxuICAgICAgICAgICAgQG1HTC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSBpZFxuICAgICAgICAgICAgZHR5cGUgPSBAbUdMLkZMT0FUXG4gICAgICAgICAgICBkc2l6ZSA9IDRcbiAgICAgICAgICAgIGlmIGF0dHJpYnMubUNoYW5uZWxzW2ldLm1UeXBlID09IG1lLlRZUEUuVUlOVDhcbiAgICAgICAgICAgICAgICBkdHlwZSA9IEBtR0wuVU5TSUdORURfQllURVxuICAgICAgICAgICAgICAgIGRzaXplID0gMVxuICAgICAgICAgICAgZWxzZSBpZiBhdHRyaWJzLm1DaGFubmVsc1tpXS5tVHlwZSA9PSBtZS5UWVBFLlVJTlQxNlxuICAgICAgICAgICAgICAgIGR0eXBlID0gQG1HTC5VTlNJR05FRF9TSE9SVFxuICAgICAgICAgICAgICAgIGRzaXplID0gMlxuICAgICAgICAgICAgZWxzZSBpZiBhdHRyaWJzLm1DaGFubmVsc1tpXS5tVHlwZSA9PSBtZS5UWVBFLkZMT0FUMzJcbiAgICAgICAgICAgICAgICBkdHlwZSA9IEBtR0wuRkxPQVRcbiAgICAgICAgICAgICAgICBkc2l6ZSA9IDRcbiAgICAgICAgICAgIEBtR0wudmVydGV4QXR0cmliUG9pbnRlciBpZCwgYXR0cmlicy5tQ2hhbm5lbHNbaV0ubU51bUNvbXBvbmVudHMsIGR0eXBlLCBhdHRyaWJzLm1DaGFubmVsc1tpXS5tTm9ybWFsaXplLCBzdHJpZGUsIG9mZnNldFxuICAgICAgICAgICAgb2Zmc2V0ICs9IGF0dHJpYnMubUNoYW5uZWxzW2ldLm1OdW1Db21wb25lbnRzICogZHNpemVcbiAgICAgICAgICAgIGkrK1xuXG4gICAgYXR0YWNoSW5kZXhBcnJheTogKHRleCkgLT5cbiAgICAgICAgQG1HTC5iaW5kQnVmZmVyIEBtR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIHRleC5tT2JqZWN0XG5cbiAgICBkZXRhY2hWZXJ0ZXhBcnJheTogKHRleCwgYXR0cmlicykgLT5cbiAgICAgICAgbnVtID0gYXR0cmlicy5tQ2hhbm5lbHMubGVuZ3RoXG4gICAgICAgIGkgPSAwXG4gICAgICAgIHdoaWxlIGkgPCBudW1cbiAgICAgICAgICAgIEBtR0wuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5IGlcbiAgICAgICAgICAgIGkrK1xuICAgICAgICBAbUdMLmJpbmRCdWZmZXIgQG1HTC5BUlJBWV9CVUZGRVIsIG51bGxcblxuICAgIGRldGFjaEluZGV4QXJyYXk6ICh0ZXgpIC0+XG4gICAgICAgIEBtR0wuYmluZEJ1ZmZlciBAbUdMLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBudWxsXG5cbiAgICBkcmF3UHJpbWl0aXZlOiAodHlwZU9mUHJpbWl0aXZlLCBudW0sIHVzZUluZGV4QXJyYXksIG51bUluc3RhbmNlcykgLT5cbiAgICAgICAgZ2xUeXBlID0gQG1HTC5QT0lOVFNcbiAgICAgICAgaWYgdHlwZU9mUHJpbWl0aXZlID09IG1lLlBSSU1UWVBFLlBPSU5UU1xuICAgICAgICAgICAgZ2xUeXBlID0gQG1HTC5QT0lOVFNcbiAgICAgICAgaWYgdHlwZU9mUHJpbWl0aXZlID09IG1lLlBSSU1UWVBFLkxJTkVTXG4gICAgICAgICAgICBnbFR5cGUgPSBAbUdMLkxJTkVTXG4gICAgICAgIGlmIHR5cGVPZlByaW1pdGl2ZSA9PSBtZS5QUklNVFlQRS5MSU5FX0xPT1BcbiAgICAgICAgICAgIGdsVHlwZSA9IEBtR0wuTElORV9MT09QXG4gICAgICAgIGlmIHR5cGVPZlByaW1pdGl2ZSA9PSBtZS5QUklNVFlQRS5MSU5FX1NUUklQXG4gICAgICAgICAgICBnbFR5cGUgPSBAbUdMLkxJTkVfU1RSSVBcbiAgICAgICAgaWYgdHlwZU9mUHJpbWl0aXZlID09IG1lLlBSSU1UWVBFLlRSSUFOR0xFU1xuICAgICAgICAgICAgZ2xUeXBlID0gQG1HTC5UUklBTkdMRVNcbiAgICAgICAgaWYgdHlwZU9mUHJpbWl0aXZlID09IG1lLlBSSU1UWVBFLlRSSUFOR0xFX1NUUklQXG4gICAgICAgICAgICBnbFR5cGUgPSBAbUdMLlRSSUFOR0xFX1NUUklQXG4gICAgICAgIGlmIG51bUluc3RhbmNlcyA8PSAxXG4gICAgICAgICAgICBpZiB1c2VJbmRleEFycmF5XG4gICAgICAgICAgICAgICAgQG1HTC5kcmF3RWxlbWVudHMgZ2xUeXBlLCBudW0sIEBtR0wuVU5TSUdORURfU0hPUlQsIDBcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAbUdMLmRyYXdBcnJheXMgZ2xUeXBlLCAwLCBudW1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQG1HTC5kcmF3QXJyYXlzSW5zdGFuY2VkIGdsVHlwZSwgMCwgbnVtLCBudW1JbnN0YW5jZXNcbiAgICAgICAgICAgIEBtR0wuZHJhd0VsZW1lbnRzSW5zdGFuY2VkIGdsVHlwZSwgbnVtLCBAbUdMLlVOU0lHTkVEX1NIT1JULCAwLCBudW1JbnN0YW5jZXNcblxuICAgIGRyYXdGdWxsU2NyZWVuVHJpYW5nbGVfWFk6ICh2cG9zKSAtPlxuICAgICAgICBAbUdMLmJpbmRCdWZmZXIgQG1HTC5BUlJBWV9CVUZGRVIsIEBtVkJPX1RyaVxuICAgICAgICBAbUdMLnZlcnRleEF0dHJpYlBvaW50ZXIgdnBvcywgMiwgQG1HTC5GTE9BVCwgZmFsc2UsIDAsIDBcbiAgICAgICAgQG1HTC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSB2cG9zXG4gICAgICAgIEBtR0wuZHJhd0FycmF5cyBAbUdMLlRSSUFOR0xFUywgMCwgM1xuICAgICAgICBAbUdMLmRpc2FibGVWZXJ0ZXhBdHRyaWJBcnJheSB2cG9zXG4gICAgICAgIEBtR0wuYmluZEJ1ZmZlciBAbUdMLkFSUkFZX0JVRkZFUiwgbnVsbFxuXG4gICAgZHJhd1VuaXRRdWFkX1hZOiAodnBvcykgLT5cbiAgICAgICAgQG1HTC5iaW5kQnVmZmVyIEBtR0wuQVJSQVlfQlVGRkVSLCBAbVZCT19RdWFkXG4gICAgICAgIEBtR0wudmVydGV4QXR0cmliUG9pbnRlciB2cG9zLCAyLCBAbUdMLkZMT0FULCBmYWxzZSwgMCwgMFxuICAgICAgICBAbUdMLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5IHZwb3NcbiAgICAgICAgQG1HTC5kcmF3QXJyYXlzIEBtR0wuVFJJQU5HTEVTLCAwLCA2XG4gICAgICAgIEBtR0wuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5IHZwb3NcbiAgICAgICAgQG1HTC5iaW5kQnVmZmVyIEBtR0wuQVJSQVlfQlVGRkVSLCBudWxsXG5cbiAgICBzZXRCbGVuZDogKGVuYWJsZWQpIC0+XG4gICAgICAgIGlmIGVuYWJsZWRcbiAgICAgICAgICAgIEBtR0wuZW5hYmxlIEBtR0wuQkxFTkRcbiAgICAgICAgICAgIEBtR0wuYmxlbmRFcXVhdGlvblNlcGFyYXRlIEBtR0wuRlVOQ19BREQsIEBtR0wuRlVOQ19BRERcbiAgICAgICAgICAgIEBtR0wuYmxlbmRGdW5jU2VwYXJhdGUgQG1HTC5TUkNfQUxQSEEsIEBtR0wuT05FX01JTlVTX1NSQ19BTFBIQSwgQG1HTC5PTkUsIEBtR0wuT05FX01JTlVTX1NSQ19BTFBIQVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbUdMLmRpc2FibGUgQG1HTC5CTEVORFxuXG4gICAgZ2V0UGl4ZWxEYXRhOiAoZGF0YSwgb2Zmc2V0LCB4cmVzLCB5cmVzKSAtPlxuICAgICAgICBAbUdMLnJlYWRQaXhlbHMgMCwgMCwgeHJlcywgeXJlcywgQG1HTC5SR0JBLCBAbUdMLlVOU0lHTkVEX0JZVEUsIGRhdGEsIG9mZnNldFxuXG4gICAgZ2V0UGl4ZWxEYXRhUmVuZGVyVGFyZ2V0OiAob2JqLCBkYXRhLCB4cmVzLCB5cmVzKSAtPlxuICAgICAgICBAbUdMLmJpbmRGcmFtZWJ1ZmZlciBAbUdMLkZSQU1FQlVGRkVSLCBvYmoubU9iamVjdElEXG4gICAgICAgIEBtR0wucmVhZEJ1ZmZlciBAbUdMLkNPTE9SX0FUVEFDSE1FTlQwXG4gICAgICAgIEBtR0wucmVhZFBpeGVscyAwLCAwLCB4cmVzLCB5cmVzLCBAbUdMLlJHQkEsIEBtR0wuRkxPQVQsIGRhdGEsIDBcbiAgICAgICAgQG1HTC5iaW5kRnJhbWVidWZmZXIgQG1HTC5GUkFNRUJVRkZFUiwgbnVsbFxuXG4gICAgQGNyZWF0ZUdsQ29udGV4dDogKGN2KSAtPlxuICAgICAgICBjdi5nZXRDb250ZXh0ICd3ZWJnbDInLCBcbiAgICAgICAgICAgIGFscGhhOiBmYWxzZVxuICAgICAgICAgICAgZGVwdGg6IGZhbHNlXG4gICAgICAgICAgICBzdGVuY2lsOiBmYWxzZVxuICAgICAgICAgICAgcHJlbXVsdGlwbGllZEFscGhhOiBmYWxzZVxuICAgICAgICAgICAgYW50aWFsaWFzOiBmYWxzZVxuICAgICAgICAgICAgcHJlc2VydmVEcmF3aW5nQnVmZmVyOiBmYWxzZVxuICAgICAgICAgICAgcG93ZXJQcmVmZXJlbmNlOiAnaGlnaC1wZXJmb3JtYW5jZScgXG4gICAgICAgICAgICAjIFwibG93X3Bvd2VyXCIsIFwiaGlnaF9wZXJmb3JtYW5jZVwiLCBcImRlZmF1bHRcIlxuICAgICAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmVyIl19
//# sourceURL=../coffee/renderer.coffee