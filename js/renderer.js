// koffee 1.6.0
var Renderer, filter, fs, ref;

ref = require('kxk'), filter = ref.filter, fs = ref.fs;

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

    Renderer.prototype.setSamplerVFlip = function(te, vflip, image) {
        var glFoTy, id;
        if (te.mVFlip === vflip) {
            return;
        }
        id = te.mObjectID;
        if (te.mType === Renderer.TEXTYPE.T2D) {
            if (image !== null) {
                this.mGL.activeTexture(this.mGL.TEXTURE0);
                this.mGL.bindTexture(this.mGL.TEXTURE_2D, id);
                this.mGL.pixelStorei(this.mGL.UNPACK_FLIP_Y_WEBGL, vflip);
                glFoTy = this.iFormatPI2GL(te.mFormat);
                this.mGL.texImage2D(this.mGL.TEXTURE_2D, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, image);
                this.mGL.bindTexture(this.mGL.TEXTURE_2D, null);
            }
        } else if (te.mType === Renderer.TEXTYPE.CUBEMAP) {
            if (image !== null) {
                glFoTy = this.iFormatPI2GL(te.mFormat);
                this.mGL.activeTexture(this.mGL.TEXTURE0);
                this.mGL.bindTexture(this.mGL.TEXTURE_CUBE_MAP, id);
                this.mGL.pixelStorei(this.mGL.UNPACK_FLIP_Y_WEBGL, vflip);
                this.mGL.texImage2D(this.mGL.TEXTURE_CUBE_MAP_POSITIVE_X, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, image[0]);
                this.mGL.texImage2D(this.mGL.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, image[1]);
                this.mGL.texImage2D(this.mGL.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, vflip ? image[3] : image[2]);
                this.mGL.texImage2D(this.mGL.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, vflip ? image[2] : image[3]);
                this.mGL.texImage2D(this.mGL.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, image[4]);
                this.mGL.texImage2D(this.mGL.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, glFoTy.mGLFormat, glFoTy.mGLExternal, glFoTy.mGLType, image[5]);
                this.mGL.bindTexture(this.mGL.TEXTURE_CUBE_MAP, null);
            }
        }
        return te.mVFlip = vflip;
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
        var infoLog, mShaderHeader, te, vs;
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

    Renderer.prototype.destroyShader = function(program) {
        return this.mGL.deleteProgram(program);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFNQSxJQUFBOztBQUFBLE1BQWlCLE9BQUEsQ0FBUSxLQUFSLENBQWpCLEVBQUUsbUJBQUYsRUFBVTs7QUFFSjtJQUVDLGtCQUFDLElBQUQ7QUFFQyxZQUFBO1FBRkEsSUFBQyxDQUFBLE1BQUQ7UUFFQSxJQUFDLENBQUEsTUFBRCxHQUFVLENBQUMsQ0FBRCxFQUFHLENBQUgsRUFBSyxDQUFMLEVBQU8sQ0FBUDtRQUNWLElBQUMsQ0FBQSxnQkFBRCxHQUFvQjtRQUNwQixJQUFDLENBQUEsY0FBRCxHQUFrQixJQUFDLENBQUEsR0FBRyxDQUFDLFlBQUwsQ0FBa0IsMEJBQWxCO1FBQ2xCLElBQUMsQ0FBQSxnQkFBRCxHQUFvQjtRQUNwQixJQUFDLENBQUEsY0FBRCxHQUFrQixJQUFDLENBQUEsR0FBRyxDQUFDLFlBQUwsQ0FBa0IsK0JBQWxCO1FBQ2xCLElBQUMsQ0FBQSxZQUFELEdBQWdCO1FBQ2hCLElBQUMsQ0FBQSxZQUFELEdBQWdCO1FBQ2hCLElBQUMsQ0FBQSxjQUFELEdBQWtCO1FBQ2xCLElBQUMsQ0FBQSxZQUFELEdBQWdCLElBQUMsQ0FBQSxHQUFHLENBQUMsWUFBTCxDQUFrQixnQ0FBbEI7UUFDaEIsSUFBQyxDQUFBLGlCQUFELEdBQXFCLElBQUMsQ0FBQSxHQUFHLENBQUMsWUFBTCxDQUFrQix3QkFBbEI7UUFDckIsVUFBQSxHQUFhLElBQUMsQ0FBQSxHQUFHLENBQUMsWUFBTCxDQUFrQixJQUFDLENBQUEsR0FBRyxDQUFDLGdCQUF2QjtRQUNiLFdBQUEsR0FBYyxJQUFDLENBQUEsR0FBRyxDQUFDLFlBQUwsQ0FBa0IsSUFBQyxDQUFBLEdBQUcsQ0FBQyx5QkFBdkI7UUFDZCxtQkFBQSxHQUFzQixJQUFDLENBQUEsR0FBRyxDQUFDLFlBQUwsQ0FBa0IsSUFBQyxDQUFBLEdBQUcsQ0FBQyxxQkFBdkI7UUFDdEIsVUFBQSxHQUFh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LElBQUMsQ0FBQSxHQUFHLENBQUMsMkJBQXJCLEVBQWtELENBQWxELEVBQXFELE1BQU0sQ0FBQyxTQUE1RCxFQUF1RSxJQUF2RSxFQUE2RSxJQUE3RSxFQUFtRixDQUFuRixFQUFzRixNQUFNLENBQUMsV0FBN0YsRUFBMEcsTUFBTSxDQUFDLE9BQWpILEVBQTBILE1BQTFIO1lBQ0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxVQUFMLENBQWdCLElBQUMsQ0FBQSxHQUFHLENBQUMsMkJBQXJCLEVBQWtELENBQWxELEVBQXFELE1BQU0sQ0FBQyxTQUE1RCxFQUF1RSxJQUF2RSxFQUE2RSxJQUE3RSxFQUFtRixDQUFuRixFQUFzRixNQUFNLENBQUMsV0FBN0YsRUFBMEcsTUFBTSxDQUFDLE9BQWpILEVBQTBILE1BQTFIO1lBQ0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxVQUFMLENBQWdCLElBQUMsQ0FBQSxHQUFHLENBQUMsMkJBQXJCLEVBQWtELENBQWxELEVBQXFELE1BQU0sQ0FBQyxTQUE1RCxFQUF1RSxJQUF2RSxFQUE2RSxJQUE3RSxFQUFtRixDQUFuRixFQUFzRixNQUFNLENBQUMsV0FBN0YsRUFBMEcsTUFBTSxDQUFDLE9BQWpILEVBQTBILE1BQTFIO1lBQ0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxVQUFMLENBQWdCLElBQUMsQ0FBQSxHQUFHLENBQUMsMkJBQXJCLEVBQWtELENBQWxELEVBQXFELE1BQU0sQ0FBQyxTQUE1RCxFQUF1RSxJQUF2RSxFQUE2RSxJQUE3RSxFQUFtRixDQUFuRixFQUFzRixNQUFNLENBQUMsV0FBN0YsRUFBMEcsTUFBTSxDQUFDLE9BQWpILEVBQTBILE1BQTFIO1lBQ0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxVQUFMLENBQWdCLElBQUMsQ0FBQSxHQUFHLENBQUMsMkJBQXJCLEVBQWtELENBQWxELEVBQXFELE1BQU0sQ0FBQyxTQUE1RCxFQUF1RSxJQUF2RSxFQUE2RSxJQUE3RSxFQUFtRixDQUFuRixFQUFzRixNQUFNLENBQUMsV0FBN0YsRUFBMEcsTUFBTSxDQUFDLE9BQWpILEVB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Q0FBQyxLQUFsRCxFQUF5RCxJQUF6RCxFQUErRCxDQUEvRDtlQUNBLElBQUMsQ0FBQSxHQUFHLENBQUMsZUFBTCxDQUFxQixJQUFDLENBQUEsR0FBRyxDQUFDLFdBQTFCLEVBQXVDLElBQXZDO0lBSnNCOztJQU0xQixRQUFDLENBQUEsZUFBRCxHQUFrQixTQUFDLEVBQUQ7ZUFDZCxFQUFFLENBQUMsVUFBSCxDQUFjLFFBQWQsRUFDSTtZQUFBLEtBQUEsRUFBTyxLQUFQO1lBQ0EsS0FBQSxFQUFPLEtBRFA7WUFFQSxPQUFBLEVBQVMsS0FGVDtZQUdBLGtCQUFBLEVBQW9CLEtBSHBCO1lBSUEsU0FBQSxFQUFXLEtBSlg7WUFLQSxxQkFBQSxFQUF1QixLQUx2QjtZQU1BLGVBQUEsRUFBaUIsa0JBTmpCO1NBREo7SUFEYzs7Ozs7O0FBV3RCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuI1xuIyBwaUxpYnMgMjAxNC0yMDE3IC0gaHR0cDovL3d3dy5pcXVpbGV6bGVzLm9yZy93d3cvbWF0ZXJpYWwvcGlMaWJzL3BpTGlicy5odG1cbiNcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxueyBmaWx0ZXIsIGZzIH0gPSByZXF1aXJlICdreGsnXG4gICAgXG5jbGFzcyBSZW5kZXJlciBcbiAgICBcbiAgICBAOiAoQG1HTCkgLT5cblxuICAgICAgICBAaU1vdXNlID0gWzAgMCAwIDBdXG4gICAgICAgIEBtRmxvYXQzMlRleHR1cmVzID0gdHJ1ZVxuICAgICAgICBAbUZsb2F0MzJGaWx0ZXIgPSBAbUdMLmdldEV4dGVuc2lvbignT0VTX3RleHR1cmVfZmxvYXRfbGluZWFyJylcbiAgICAgICAgQG1GbG9hdDE2VGV4dHVyZXMgPSB0cnVlXG4gICAgICAgIEBtRmxvYXQxNkZpbHRlciA9IEBtR0wuZ2V0RXh0ZW5zaW9uKCdPRVNfdGV4dHVyZV9oYWxmX2Zsb2F0X2xpbmVhcicpXG4gICAgICAgIEBtRGVyaXZhdGl2ZXMgPSB0cnVlXG4gICAgICAgIEBtRHJhd0J1ZmZlcnMgPSB0cnVlXG4gICAgICAgIEBtRGVwdGhUZXh0dXJlcyA9IHRydWVcbiAgICAgICAgQG1Bbmlzb3Ryb3BpYyA9IEBtR0wuZ2V0RXh0ZW5zaW9uKCdFWFRfdGV4dHVyZV9maWx0ZXJfYW5pc290cm9waWMnKVxuICAgICAgICBAbVJlbmRlclRvRmxvYXQzMkYgPSBAbUdMLmdldEV4dGVuc2lvbignRVhUX2NvbG9yX2J1ZmZlcl9mbG9hdCcpXG4gICAgICAgIG1heFRleFNpemUgPSBAbUdMLmdldFBhcmFtZXRlcihAbUdMLk1BWF9URVhUVVJFX1NJWkUpXG4gICAgICAgIG1heEN1YmVTaXplID0gQG1HTC5nZXRQYXJhbWV0ZXIoQG1HTC5NQVhfQ1VCRV9NQVBfVEVYVFVSRV9TSVpFKVxuICAgICAgICBtYXhSZW5kZXJidWZmZXJTaXplID0gQG1HTC5nZXRQYXJhbWV0ZXIoQG1HTC5NQVhfUkVOREVSQlVGRkVSX1NJWkUpXG4gICAgICAgIGV4dGVuc2lvbnMgPSBAbUdMLmdldFN1cHBvcnRlZEV4dGVuc2lvbnMoKVxuICAgICAgICB0ZXh0dXJlVW5pdHMgPSBAbUdMLmdldFBhcmFtZXRlcihAbUdMLk1BWF9URVhUVVJFX0lNQUdFX1VOSVRTKVxuICAgICAgICBjb25zb2xlLmxvZyAnV2ViR0w6JyArICcgRjMyIFRleHR1cmVzOiAnICsgKGlmIEBtRmxvYXQzMlRleHR1cmVzICE9IG51bGwgdGhlbiAneWVzJyBlbHNlICdubycpICsgJywgUmVuZGVyIHRvIDMyRjogJyArIChpZiBAbVJlbmRlclRvRmxvYXQzMkYgIT0gbnVsbCB0aGVuICd5ZXMnIGVsc2UgJ25vJykgKyAnLCBNYXggVGV4dHVyZSBTaXplOiAnICsgbWF4VGV4U2l6ZSArICcsIE1heCBSZW5kZXIgQnVmZmVyIFNpemU6ICcgKyBtYXhSZW5kZXJidWZmZXJTaXplICsgJywgTWF4IEN1YmVtYXAgU2l6ZTogJyArIG1heEN1YmVTaXplXG5cbiAgICAgICAgdmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5IFsgLTEuMCAtMS4wIDEuMCAtMS4wIC0xLjAgMS4wIDEuMCAtMS4wIDEuMCAxLjAgLTEuMCAxLjAgXVxuICAgICAgICBAbVZCT19RdWFkID0gQG1HTC5jcmVhdGVCdWZmZXIoKVxuICAgICAgICBAbUdMLmJpbmRCdWZmZXIgQG1HTC5BUlJBWV9CVUZGRVIsIEBtVkJPX1F1YWRcbiAgICAgICAgQG1HTC5idWZmZXJEYXRhIEBtR0wuQVJSQVlfQlVGRkVSLCB2ZXJ0aWNlcywgQG1HTC5TVEFUSUNfRFJBV1xuICAgICAgICBAbUdMLmJpbmRCdWZmZXIgQG1HTC5BUlJBWV9CVUZGRVIsIG51bGxcbiAgICAgICAgIyBjcmVhdGUgYSAyRCB0cmlhbmdsZSBWZXJ0ZXggQnVmZmVyXG4gICAgICAgIEBtVkJPX1RyaSA9IEBtR0wuY3JlYXRlQnVmZmVyKClcbiAgICAgICAgQG1HTC5iaW5kQnVmZmVyIEBtR0wuQVJSQVlfQlVGRkVSLCBAbVZCT19UcmlcbiAgICAgICAgQG1HTC5idWZmZXJEYXRhIEBtR0wuQVJSQVlfQlVGRkVSLCBuZXcgRmxvYXQzMkFycmF5KFsgLTEuMCAtMS4wIDMuMCAtMS4wIC0xLjAgMy4wIF0pLCBAbUdMLlNUQVRJQ19EUkFXXG4gICAgICAgIEBtR0wuYmluZEJ1ZmZlciBAbUdMLkFSUkFZX0JVRkZFUiwgbnVsbFxuICAgICAgICAjIGNyZWF0ZSBhIDNEIGN1YmUgVmVydGV4IEJ1ZmZlclxuICAgICAgICBAbVZCT19DdWJlUG9zTm9yID0gQG1HTC5jcmVhdGVCdWZmZXIoKVxuICAgICAgICBAbUdMLmJpbmRCdWZmZXIgQG1HTC5BUlJBWV9CVUZGRVIsIEBtVkJPX0N1YmVQb3NOb3JcbiAgICAgICAgQG1HTC5idWZmZXJEYXRhIEBtR0wuQVJSQVlfQlVGRkVSLCBuZXcgRmxvYXQzMkFycmF5KFtcbiAgICAgICAgICAgIC0xLjAgLTEuMCAtMS4wIC0xLjAgMC4wIDAuMCAtMS4wIC0xLjAgMS4wIC0xLjAgMC4wIDAuMCAtMS4wIDEuMCAtMS4wIC0xLjAgMC4wIDAuMCAtMS4wIDEuMCAxLjAgLTEuMCAwLjAgMC4wIDEuMCAxLjAgLTEuMCAxLjAgMC4wIDAuMCAxLjBcbiAgICAgICAgICAgIDEuMCAxLjAgMS4wIDAuMCAwLjAgMS4wIC0xLjAgLTEuMCAxLjAgMC4wIDAuMCAxLjAgLTEuMCAxLjAgMS4wIDAuMCAwLjAgMS4wIDEuMCAxLjAgMC4wIDEuMCAwLjAgMS4wIDEuMCAtMS4wIDAuMCAxLjBcbiAgICAgICAgICAgIDAuMCAtMS4wIDEuMCAxLjAgMC4wIDEuMCAwLjAgLTEuMCAxLjAgLTEuMCAwLjAgMS4wIDAuMCAxLjAgLTEuMCAtMS4wIDAuMCAtMS4wIDAuMCAxLjAgLTEuMCAxLjAgMC4wIC0xLjAgMC4wIC0xLjAgLTEuMFxuICAgICAgICAgICAgLTEuMCAwLjAgLTEuMCAwLjAgLTEuMCAtMS4wIDEuMCAwLjAgLTEuMCAwLjAgLTEuMCAxLjAgMS4wIDAuMCAwLjAgMS4wIC0xLjAgLTEuMCAxLjAgMC4wIDAuMCAxLjAgMS4wIDEuMCAxLjAgMC4wIDAuMCAxLjBcbiAgICAgICAgICAgIDEuMCAtMS4wIDEuMCAwLjAgMC4wIDEuMCAtMS4wIC0xLjAgLTEuMCAwLjAgMC4wIC0xLjAgLTEuMCAxLjAgLTEuMCAwLjAgMC4wIC0xLjAgMS4wIC0xLjAgLTEuMCAwLjAgMC4wIC0xLjAgMS4wIDEuMCAtMS4wIDAuMCAwLjAgLTEuMFxuICAgICAgICBdKSwgQG1HTC5TVEFUSUNfRFJBV1xuICAgICAgICBAbUdMLmJpbmRCdWZmZXIgQG1HTC5BUlJBWV9CVUZGRVIsIG51bGxcbiAgICAgICAgQG1WQk9fQ3ViZVBvcyA9IEBtR0wuY3JlYXRlQnVmZmVyKClcbiAgICAgICAgQG1HTC5iaW5kQnVmZmVyIEBtR0wuQVJSQVlfQlVGRkVSLCBAbVZCT19DdWJlUG9zXG4gICAgICAgIEBtR0wuYnVmZmVyRGF0YSBAbUdMLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheShbXG4gICAgICAgICAgICAtMS4wIC0xLjAgLTEuMCAtMS4wIC0xLjAgMS4wIC0xLjAgMS4wIC0xLjAgLTEuMCAxLjAgMS4wIDEuMCAxLjAgLTEuMCAxLjAgMS4wIDEuMCAxLjAgLTEuMCAtMS4wIDEuMCAtMS4wIDEuMCAxLjAgMS4wIDEuMCAxLjBcbiAgICAgICAgICAgIDEuMCAtMS4wIC0xLjAgMS4wIDEuMCAtMS4wIDEuMCAtMS4wIDEuMCAtMS4wIC0xLjAgMS4wIC0xLjAgMS4wIC0xLjAgLTEuMCAtMS4wIC0xLjAgLTEuMCAxLjAgLTEuMCAxLjAgMS4wIC0xLjAgLTEuMCAxLjAgMS4wIDEuMFxuICAgICAgICAgICAgMS4wIDEuMCAtMS4wIDEuMCAtMS4wIC0xLjAgLTEuMCAtMS4wIDEuMCAtMS4wIDEuMCAtMS4wIC0xLjAgMS4wIDEuMCAtMS4wXG4gICAgICAgIF0pLCBAbUdMLlNUQVRJQ19EUkFXXG4gICAgICAgIEBtR0wuYmluZEJ1ZmZlciBAbUdMLkFSUkFZX0JVRkZFUiwgbnVsbFxuXG4gICAgQENMRUFSICAgICAgPSBDb2xvcjoxIFpidWZmZXI6MiBTdGVuY2lsOjRcbiAgICBAVEVYRk1UICAgICA9IEM0STg6MCBDMUk4OjEgQzFGMTY6MiBDNEYxNjozIEMxRjMyOjQgQzRGMzI6NSBaMTY6NiBaMjQ6NyBaMzI6OCBDM0YzMjo5XG4gICAgQFRFWFdSUCAgICAgPSBDTEFNUDowIFJFUEVBVDoxXG4gICAgQEJVRlRZUEUgICAgPSBTVEFUSUM6MCBEWU5BTUlDOjFcbiAgICBAUFJJTVRZUEUgICA9IFBPSU5UUzowIExJTkVTOjEgTElORV9MT09QOjIgTElORV9TVFJJUDozIFRSSUFOR0xFUzo0IFRSSUFOR0xFX1NUUklQOjVcbiAgICBAUkVORFNUR0FURSA9IFdJUkVGUkFNRTowIEZST05UX0ZBQ0U6MSBDVUxMX0ZBQ0U6MiBERVBUSF9URVNUOjMgQUxQSEFfVE9fQ09WRVJBR0U6NFxuICAgIEBURVhUWVBFICAgID0gVDJEOjAgVDNEOjEgQ1VCRU1BUDoyXG4gICAgQEZJTFRFUiAgICAgPSBOT05FOjAgTElORUFSOjEgTUlQTUFQOjIgTk9ORV9NSVBNQVA6M1xuICAgIEBUWVBFICAgICAgID0gVUlOVDg6MCBVSU5UMTY6MSBVSU5UMzI6MiBGTE9BVDE2OjMgRkxPQVQzMjo0IEZMT0FUNjQ6NVxuXG4gICAgaUZvcm1hdFBJMkdMOiAoZm9ybWF0KSAtPlxuICAgICAgICByZXR1cm4gc3dpdGNoIGZvcm1hdFxuICAgICAgICAgICAgd2hlbiBSZW5kZXJlci5URVhGTVQuQzRJOFxuICAgICAgICAgICAgICAgICAgICBtR0xGb3JtYXQ6ICAgQG1HTC5SR0JBOFxuICAgICAgICAgICAgICAgICAgICBtR0xFeHRlcm5hbDogQG1HTC5SR0JBXG4gICAgICAgICAgICAgICAgICAgIG1HTFR5cGU6ICAgICBAbUdMLlVOU0lHTkVEX0JZVEVcbiAgICAgICAgICAgIHdoZW4gUmVuZGVyZXIuVEVYRk1ULkMxSThcbiAgICAgICAgICAgICAgICAgICAgbUdMRm9ybWF0OiBAbUdMLlI4XG4gICAgICAgICAgICAgICAgICAgIG1HTEV4dGVybmFsOiBAbUdMLlJFRFxuICAgICAgICAgICAgICAgICAgICBtR0xUeXBlOiBAbUdMLlVOU0lHTkVEX0JZVEVcbiAgICAgICAgICAgIHdoZW4gUmVuZGVyZXIuVEVYRk1ULkMxRjE2XG4gICAgICAgICAgICAgICAgICAgIG1HTEZvcm1hdDogQG1HTC5SMTZGXG4gICAgICAgICAgICAgICAgICAgIG1HTEV4dGVybmFsOiBAbUdMLlJFRFxuICAgICAgICAgICAgICAgICAgICBtR0xUeXBlOiBAbUdMLkZMT0FUXG4gICAgICAgICAgICB3aGVuIFJlbmRlcmVyLlRFWEZNVC5DNEYxNlxuICAgICAgICAgICAgICAgICAgICBtR0xGb3JtYXQ6IEBtR0wuUkdCQTE2RlxuICAgICAgICAgICAgICAgICAgICBtR0xFeHRlcm5hbDogQG1HTC5SR0JBXG4gICAgICAgICAgICAgICAgICAgIG1HTFR5cGU6IEBtR0wuRkxPQVRcbiAgICAgICAgICAgIHdoZW4gUmVuZGVyZXIuVEVYRk1ULkMxRjMyXG4gICAgICAgICAgICAgICAgICAgIG1HTEZvcm1hdDogQG1HTC5SMzJGXG4gICAgICAgICAgICAgICAgICAgIG1HTEV4dGVybmFsOiBAbUdMLlJFRFxuICAgICAgICAgICAgICAgICAgICBtR0xUeXBlOiBAbUdMLkZMT0FUXG4gICAgICAgICAgICB3aGVuIFJlbmRlcmVyLlRFWEZNVC5DNEYzMlxuICAgICAgICAgICAgICAgICAgICBtR0xGb3JtYXQ6IEBtR0wuUkdCQTMyRlxuICAgICAgICAgICAgICAgICAgICBtR0xFeHRlcm5hbDogQG1HTC5SR0JBXG4gICAgICAgICAgICAgICAgICAgIG1HTFR5cGU6IEBtR0wuRkxPQVRcbiAgICAgICAgICAgIHdoZW4gUmVuZGVyZXIuVEVYRk1ULkMzRjMyXG4gICAgICAgICAgICAgICAgICAgIG1HTEZvcm1hdDogQG1HTC5SR0IzMkZcbiAgICAgICAgICAgICAgICAgICAgbUdMRXh0ZXJuYWw6IEBtR0wuUkdCXG4gICAgICAgICAgICAgICAgICAgIG1HTFR5cGU6IEBtR0wuRkxPQVRcbiAgICAgICAgICAgIHdoZW4gUmVuZGVyZXIuVEVYRk1ULloxNlxuICAgICAgICAgICAgICAgICAgICBtR0xGb3JtYXQ6IEBtR0wuREVQVEhfQ09NUE9ORU5UMTZcbiAgICAgICAgICAgICAgICAgICAgbUdMRXh0ZXJuYWw6IEBtR0wuREVQVEhfQ09NUE9ORU5UXG4gICAgICAgICAgICAgICAgICAgIG1HTFR5cGU6IEBtR0wuVU5TSUdORURfU0hPUlRcbiAgICAgICAgICAgIHdoZW4gUmVuZGVyZXIuVEVYRk1ULloyNFxuICAgICAgICAgICAgICAgICAgICBtR0xGb3JtYXQ6IEBtR0wuREVQVEhfQ09NUE9ORU5UMjRcbiAgICAgICAgICAgICAgICAgICAgbUdMRXh0ZXJuYWw6IEBtR0wuREVQVEhfQ09NUE9ORU5UXG4gICAgICAgICAgICAgICAgICAgIG1HTFR5cGU6IEBtR0wuVU5TSUdORURfU0hPUlRcbiAgICAgICAgICAgIHdoZW4gUmVuZGVyZXIuVEVYRk1ULlozMlxuICAgICAgICAgICAgICAgICAgICBtR0xGb3JtYXQ6IEBtR0wuREVQVEhfQ09NUE9ORU5UMzJGXG4gICAgICAgICAgICAgICAgICAgIG1HTEV4dGVybmFsOiBAbUdMLkRFUFRIX0NPTVBPTkVOVFxuICAgICAgICAgICAgICAgICAgICBtR0xUeXBlOiBAbUdMLlVOU0lHTkVEX1NIT1JUXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgbnVsbFxuXG4gICAgY2hlY2tFcnJvcnM6IC0+XG4gICAgICAgIGVycm9yID0gQG1HTC5nZXRFcnJvcigpXG4gICAgICAgIGlmIGVycm9yICE9IEBtR0wuTk9fRVJST1JcbiAgICAgICAgICAgIGZvciBwcm9wIG9mIEBtR0xcbiAgICAgICAgICAgICAgICBpZiB0eXBlb2YgQG1HTFtwcm9wXSA9PSAnbnVtYmVyJ1xuICAgICAgICAgICAgICAgICAgICBpZiBAbUdMW3Byb3BdID09IGVycm9yXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyAnR0wgRXJyb3IgJyArIGVycm9yICsgJzogJyArIHByb3BcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICBjbGVhcjogKGZsYWdzLCBjY29sb3IsIGNkZXB0aCwgY3N0ZW5jaWwpIC0+XG4gICAgICAgIG1vZGUgPSAwXG4gICAgICAgIGlmIGZsYWdzICYgMVxuICAgICAgICAgICAgbW9kZSB8PSBAbUdMLkNPTE9SX0JVRkZFUl9CSVRcbiAgICAgICAgICAgIEBtR0wuY2xlYXJDb2xvciBjY29sb3JbMF0sIGNjb2xvclsxXSwgY2NvbG9yWzJdLCBjY29sb3JbM11cbiAgICAgICAgaWYgZmxhZ3MgJiAyXG4gICAgICAgICAgICBtb2RlIHw9IEBtR0wuREVQVEhfQlVGRkVSX0JJVFxuICAgICAgICAgICAgQG1HTC5jbGVhckRlcHRoIGNkZXB0aFxuICAgICAgICBpZiBmbGFncyAmIDRcbiAgICAgICAgICAgIG1vZGUgfD0gQG1HTC5TVEVOQ0lMX0JVRkZFUl9CSVRcbiAgICAgICAgICAgIEBtR0wuY2xlYXJTdGVuY2lsIGNzdGVuY2lsXG4gICAgICAgIEBtR0wuY2xlYXIgbW9kZVxuXG4gICAgY3JlYXRlVGV4dHVyZTogKHR5cGUsIHhyZXMsIHlyZXMsIGZvcm1hdCwgZmlsdGVyLCB3cmFwLCBidWZmZXIpIC0+XG4gICAgICAgIGlmIG5vdCBAbUdMIHRoZW4gcmV0dXJuXG4gICAgICAgIGlkID0gQG1HTC5jcmVhdGVUZXh0dXJlKClcbiAgICAgICAgZ2xGb1R5ID0gQGlGb3JtYXRQSTJHTChmb3JtYXQpXG4gICAgICAgIGdsV3JhcCA9IEBtR0wuUkVQRUFUXG4gICAgICAgIGlmIHdyYXAgPT0gUmVuZGVyZXIuVEVYV1JQLkNMQU1QXG4gICAgICAgICAgICBnbFdyYXAgPSBAbUdMLkNMQU1QX1RPX0VER0VcbiAgICAgICAgaWYgdHlwZSA9PSBSZW5kZXJlci5URVhUWVBFLlQyRFxuICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfMkQsIGlkXG4gICAgICAgICAgICBAbUdMLnRleEltYWdlMkQgQG1HTC5URVhUVVJFXzJELCAwLCBnbEZvVHkubUdMRm9ybWF0LCB4cmVzLCB5cmVzLCAwLCBnbEZvVHkubUdMRXh0ZXJuYWwsIGdsRm9UeS5tR0xUeXBlLCBidWZmZXJcbiAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfMkQsIEBtR0wuVEVYVFVSRV9XUkFQX1MsIGdsV3JhcFxuICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8yRCwgQG1HTC5URVhUVVJFX1dSQVBfVCwgZ2xXcmFwXG4gICAgICAgICAgICBpZiBmaWx0ZXIgPT0gUmVuZGVyZXIuRklMVEVSLk5PTkVcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzJELCBAbUdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgQG1HTC5ORUFSRVNUXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8yRCwgQG1HTC5URVhUVVJFX01JTl9GSUxURVIsIEBtR0wuTkVBUkVTVFxuICAgICAgICAgICAgZWxzZSBpZiBmaWx0ZXIgPT0gUmVuZGVyZXIuRklMVEVSLkxJTkVBUlxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfMkQsIEBtR0wuVEVYVFVSRV9NQUdfRklMVEVSLCBAbUdMLkxJTkVBUlxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfMkQsIEBtR0wuVEVYVFVSRV9NSU5fRklMVEVSLCBAbUdMLkxJTkVBUlxuICAgICAgICAgICAgZWxzZSBpZiBmaWx0ZXIgPT0gUmVuZGVyZXIuRklMVEVSLk1JUE1BUFxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfMkQsIEBtR0wuVEVYVFVSRV9NQUdfRklMVEVSLCBAbUdMLkxJTkVBUlxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfMkQsIEBtR0wuVEVYVFVSRV9NSU5fRklMVEVSLCBAbUdMLkxJTkVBUl9NSVBNQVBfTElORUFSXG4gICAgICAgICAgICAgICAgQG1HTC5nZW5lcmF0ZU1pcG1hcCBAbUdMLlRFWFRVUkVfMkRcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzJELCBAbUdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgQG1HTC5ORUFSRVNUXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8yRCwgQG1HTC5URVhUVVJFX01JTl9GSUxURVIsIEBtR0wuTkVBUkVTVF9NSVBNQVBfTElORUFSXG4gICAgICAgICAgICAgICAgQG1HTC5nZW5lcmF0ZU1pcG1hcCBAbUdMLlRFWFRVUkVfMkRcbiAgICAgICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFXzJELCBudWxsXG4gICAgICAgIGVsc2UgaWYgdHlwZSA9PSBSZW5kZXJlci5URVhUWVBFLlQzRFxuICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfM0QsIGlkXG4gICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzNELCBAbUdMLlRFWFRVUkVfQkFTRV9MRVZFTCwgMFxuICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8zRCwgQG1HTC5URVhUVVJFX01BWF9MRVZFTCwgTWF0aC5sb2cyKHhyZXMpXG4gICAgICAgICAgICBpZiBmaWx0ZXIgPT0gUmVuZGVyZXIuRklMVEVSLk5PTkVcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzNELCBAbUdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgQG1HTC5ORUFSRVNUXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8zRCwgQG1HTC5URVhUVVJFX01JTl9GSUxURVIsIEBtR0wuTkVBUkVTVFxuICAgICAgICAgICAgZWxzZSBpZiBmaWx0ZXIgPT0gUmVuZGVyZXIuRklMVEVSLkxJTkVBUlxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfM0QsIEBtR0wuVEVYVFVSRV9NQUdfRklMVEVSLCBAbUdMLkxJTkVBUlxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfM0QsIEBtR0wuVEVYVFVSRV9NSU5fRklMVEVSLCBAbUdMLkxJTkVBUlxuICAgICAgICAgICAgZWxzZSBpZiBmaWx0ZXIgPT0gUmVuZGVyZXIuRklMVEVSLk1JUE1BUFxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfM0QsIEBtR0wuVEVYVFVSRV9NQUdfRklMVEVSLCBAbUdMLkxJTkVBUlxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfM0QsIEBtR0wuVEVYVFVSRV9NSU5fRklMVEVSLCBAbUdMLkxJTkVBUl9NSVBNQVBfTElORUFSXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8zRCwgQG1HTC5URVhUVVJFX01BR19GSUxURVIsIEBtR0wuTkVBUkVTVFxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfM0QsIEBtR0wuVEVYVFVSRV9NSU5fRklMVEVSLCBAbUdMLk5FQVJFU1RfTUlQTUFQX0xJTkVBUlxuICAgICAgICAgICAgICAgIEBtR0wuZ2VuZXJhdGVNaXBtYXAgQG1HTC5URVhUVVJFXzNEXG4gICAgICAgICAgICBAbUdMLnRleEltYWdlM0QgQG1HTC5URVhUVVJFXzNELCAwLCBnbEZvVHkubUdMRm9ybWF0LCB4cmVzLCB5cmVzLCB5cmVzLCAwLCBnbEZvVHkubUdMRXh0ZXJuYWwsIGdsRm9UeS5tR0xUeXBlLCBidWZmZXJcbiAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfM0QsIEBtR0wuVEVYVFVSRV9XUkFQX1IsIGdsV3JhcFxuICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8zRCwgQG1HTC5URVhUVVJFX1dSQVBfUywgZ2xXcmFwXG4gICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzNELCBAbUdMLlRFWFRVUkVfV1JBUF9ULCBnbFdyYXBcbiAgICAgICAgICAgIGlmIGZpbHRlciA9PSBSZW5kZXJlci5GSUxURVIuTUlQTUFQXG4gICAgICAgICAgICAgICAgQG1HTC5nZW5lcmF0ZU1pcG1hcCBAbUdMLlRFWFRVUkVfM0RcbiAgICAgICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFXzNELCBudWxsXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCBpZFxuICAgICAgICAgICAgQG1HTC50ZXhJbWFnZTJEIEBtR0wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YLCAwLCBnbEZvVHkubUdMRm9ybWF0LCB4cmVzLCB5cmVzLCAwLCBnbEZvVHkubUdMRXh0ZXJuYWwsIGdsRm9UeS5tR0xUeXBlLCBidWZmZXJcbiAgICAgICAgICAgIEBtR0wudGV4SW1hZ2UyRCBAbUdMLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWCwgMCwgZ2xGb1R5Lm1HTEZvcm1hdCwgeHJlcywgeXJlcywgMCwgZ2xGb1R5Lm1HTEV4dGVybmFsLCBnbEZvVHkubUdMVHlwZSwgYnVmZmVyXG4gICAgICAgICAgICBAbUdMLnRleEltYWdlMkQgQG1HTC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1ksIDAsIGdsRm9UeS5tR0xGb3JtYXQsIHhyZXMsIHlyZXMsIDAsIGdsRm9UeS5tR0xFeHRlcm5hbCwgZ2xGb1R5Lm1HTFR5cGUsIGJ1ZmZlclxuICAgICAgICAgICAgQG1HTC50ZXhJbWFnZTJEIEBtR0wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9ZLCAwLCBnbEZvVHkubUdMRm9ybWF0LCB4cmVzLCB5cmVzLCAwLCBnbEZvVHkubUdMRXh0ZXJuYWwsIGdsRm9UeS5tR0xUeXBlLCBidWZmZXJcbiAgICAgICAgICAgIEBtR0wudGV4SW1hZ2UyRCBAbUdMLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWiwgMCwgZ2xGb1R5Lm1HTEZvcm1hdCwgeHJlcywgeXJlcywgMCwgZ2xGb1R5Lm1HTEV4dGVybmFsLCBnbEZvVHkubUdMVHlwZSwgYnVmZmVyXG4gICAgICAgICAgICBAbUdMLnRleEltYWdlMkQgQG1HTC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1osIDAsIGdsRm9UeS5tR0xGb3JtYXQsIHhyZXMsIHlyZXMsIDAsIGdsRm9UeS5tR0xFeHRlcm5hbCwgZ2xGb1R5Lm1HTFR5cGUsIGJ1ZmZlclxuICAgICAgICAgICAgaWYgZmlsdGVyID09IFJlbmRlcmVyLkZJTFRFUi5OT05FXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV9DVUJFX01BUCwgQG1HTC5URVhUVVJFX01BR19GSUxURVIsIEBtR0wuTkVBUkVTVFxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfQ1VCRV9NQVAsIEBtR0wuVEVYVFVSRV9NSU5fRklMVEVSLCBAbUdMLk5FQVJFU1RcbiAgICAgICAgICAgIGVsc2UgaWYgZmlsdGVyID09IFJlbmRlcmVyLkZJTFRFUi5MSU5FQVJcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCBAbUdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgQG1HTC5MSU5FQVJcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCBAbUdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgQG1HTC5MSU5FQVJcbiAgICAgICAgICAgIGVsc2UgaWYgZmlsdGVyID09IFJlbmRlcmVyLkZJTFRFUi5NSVBNQVBcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCBAbUdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgQG1HTC5MSU5FQVJcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCBAbUdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgQG1HTC5MSU5FQVJfTUlQTUFQX0xJTkVBUlxuICAgICAgICAgICAgaWYgZmlsdGVyID09IFJlbmRlcmVyLkZJTFRFUi5NSVBNQVBcbiAgICAgICAgICAgICAgICBAbUdMLmdlbmVyYXRlTWlwbWFwIEBtR0wuVEVYVFVSRV9DVUJFX01BUFxuICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfQ1VCRV9NQVAsIG51bGxcblxuICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIG1PYmplY3RJRDogaWRcbiAgICAgICAgICAgIG1YcmVzOiB4cmVzXG4gICAgICAgICAgICBtWXJlczogeXJlc1xuICAgICAgICAgICAgbUZvcm1hdDogZm9ybWF0XG4gICAgICAgICAgICBtVHlwZTogdHlwZVxuICAgICAgICAgICAgbUZpbHRlcjogZmlsdGVyXG4gICAgICAgICAgICBtV3JhcDogd3JhcFxuXG4gICAgY3JlYXRlVGV4dHVyZUZyb21JbWFnZTogKHR5cGUsIGltYWdlLCBmb3JtYXQsIGZpbHRlciwgd3JhcCwgZmxpcFkpIC0+XG4gICAgICAgIGlmIEBtR0wgPT0gbnVsbFxuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgaWQgPSBAbUdMLmNyZWF0ZVRleHR1cmUoKVxuICAgICAgICBnbEZvVHkgPSBAaUZvcm1hdFBJMkdMKGZvcm1hdClcbiAgICAgICAgZ2xXcmFwID0gQG1HTC5SRVBFQVRcbiAgICAgICAgaWYgd3JhcCA9PSBSZW5kZXJlci5URVhXUlAuQ0xBTVBcbiAgICAgICAgICAgIGdsV3JhcCA9IEBtR0wuQ0xBTVBfVE9fRURHRVxuICAgICAgICBpZiB0eXBlID09IFJlbmRlcmVyLlRFWFRZUEUuVDJEXG4gICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV8yRCwgaWRcbiAgICAgICAgICAgIEBtR0wucGl4ZWxTdG9yZWkgQG1HTC5VTlBBQ0tfRkxJUF9ZX1dFQkdMLCBmbGlwWVxuICAgICAgICAgICAgQG1HTC5waXhlbFN0b3JlaSBAbUdMLlVOUEFDS19QUkVNVUxUSVBMWV9BTFBIQV9XRUJHTCwgZmFsc2VcbiAgICAgICAgICAgIEBtR0wucGl4ZWxTdG9yZWkgQG1HTC5VTlBBQ0tfQ09MT1JTUEFDRV9DT05WRVJTSU9OX1dFQkdMLCBAbUdMLk5PTkVcbiAgICAgICAgICAgIEBtR0wudGV4SW1hZ2UyRCBAbUdMLlRFWFRVUkVfMkQsIDAsIGdsRm9UeS5tR0xGb3JtYXQsIGdsRm9UeS5tR0xFeHRlcm5hbCwgZ2xGb1R5Lm1HTFR5cGUsIGltYWdlXG4gICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzJELCBAbUdMLlRFWFRVUkVfV1JBUF9TLCBnbFdyYXBcbiAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfMkQsIEBtR0wuVEVYVFVSRV9XUkFQX1QsIGdsV3JhcFxuICAgICAgICAgICAgaWYgZmlsdGVyID09IFJlbmRlcmVyLkZJTFRFUi5OT05FXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8yRCwgQG1HTC5URVhUVVJFX01BR19GSUxURVIsIEBtR0wuTkVBUkVTVFxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfMkQsIEBtR0wuVEVYVFVSRV9NSU5fRklMVEVSLCBAbUdMLk5FQVJFU1RcbiAgICAgICAgICAgIGVsc2UgaWYgZmlsdGVyID09IFJlbmRlcmVyLkZJTFRFUi5MSU5FQVJcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzJELCBAbUdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgQG1HTC5MSU5FQVJcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzJELCBAbUdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgQG1HTC5MSU5FQVJcbiAgICAgICAgICAgIGVsc2UgaWYgZmlsdGVyID09IFJlbmRlcmVyLkZJTFRFUi5NSVBNQVBcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzJELCBAbUdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgQG1HTC5MSU5FQVJcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzJELCBAbUdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgQG1HTC5MSU5FQVJfTUlQTUFQX0xJTkVBUlxuICAgICAgICAgICAgICAgIEBtR0wuZ2VuZXJhdGVNaXBtYXAgQG1HTC5URVhUVVJFXzJEXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8yRCwgQG1HTC5URVhUVVJFX01BR19GSUxURVIsIEBtR0wuTElORUFSXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8yRCwgQG1HTC5URVhUVVJFX01JTl9GSUxURVIsIEBtR0wuTkVBUkVTVF9NSVBNQVBfTElORUFSXG4gICAgICAgICAgICAgICAgQG1HTC5nZW5lcmF0ZU1pcG1hcCBAbUdMLlRFWFRVUkVfMkRcbiAgICAgICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFXzJELCBudWxsXG4gICAgICAgIGVsc2UgaWYgdHlwZSA9PSBSZW5kZXJlci5URVhUWVBFLlQzRFxuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfQ1VCRV9NQVAsIGlkXG4gICAgICAgICAgICBAbUdMLnBpeGVsU3RvcmVpIEBtR0wuVU5QQUNLX0ZMSVBfWV9XRUJHTCwgZmxpcFlcbiAgICAgICAgICAgIEBtR0wuYWN0aXZlVGV4dHVyZSBAbUdMLlRFWFRVUkUwXG4gICAgICAgICAgICBAbUdMLnRleEltYWdlMkQgQG1HTC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1gsIDAsIGdsRm9UeS5tR0xGb3JtYXQsIGdsRm9UeS5tR0xFeHRlcm5hbCwgZ2xGb1R5Lm1HTFR5cGUsIGltYWdlWzBdXG4gICAgICAgICAgICBAbUdMLnRleEltYWdlMkQgQG1HTC5URVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1gsIDAsIGdsRm9UeS5tR0xGb3JtYXQsIGdsRm9UeS5tR0xFeHRlcm5hbCwgZ2xGb1R5Lm1HTFR5cGUsIGltYWdlWzFdXG4gICAgICAgICAgICBAbUdMLnRleEltYWdlMkQgQG1HTC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1ksIDAsIGdsRm9UeS5tR0xGb3JtYXQsIGdsRm9UeS5tR0xFeHRlcm5hbCwgZ2xGb1R5Lm1HTFR5cGUsIGlmIGZsaXBZIHRoZW4gaW1hZ2VbM10gZWxzZSBpbWFnZVsyXVxuICAgICAgICAgICAgQG1HTC50ZXhJbWFnZTJEIEBtR0wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9ZLCAwLCBnbEZvVHkubUdMRm9ybWF0LCBnbEZvVHkubUdMRXh0ZXJuYWwsIGdsRm9UeS5tR0xUeXBlLCBpZiBmbGlwWSB0aGVuIGltYWdlWzJdIGVsc2UgaW1hZ2VbM11cbiAgICAgICAgICAgIEBtR0wudGV4SW1hZ2UyRCBAbUdMLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWiwgMCwgZ2xGb1R5Lm1HTEZvcm1hdCwgZ2xGb1R5Lm1HTEV4dGVybmFsLCBnbEZvVHkubUdMVHlwZSwgaW1hZ2VbNF1cbiAgICAgICAgICAgIEBtR0wudGV4SW1hZ2UyRCBAbUdMLlRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWiwgMCwgZ2xGb1R5Lm1HTEZvcm1hdCwgZ2xGb1R5Lm1HTEV4dGVybmFsLCBnbEZvVHkubUdMVHlwZSwgaW1hZ2VbNV1cbiAgICAgICAgICAgIGlmIGZpbHRlciA9PSBSZW5kZXJlci5GSUxURVIuTk9ORVxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfQ1VCRV9NQVAsIEBtR0wuVEVYVFVSRV9NQUdfRklMVEVSLCBAbUdMLk5FQVJFU1RcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCBAbUdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgQG1HTC5ORUFSRVNUXG4gICAgICAgICAgICBlbHNlIGlmIGZpbHRlciA9PSBSZW5kZXJlci5GSUxURVIuTElORUFSXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV9DVUJFX01BUCwgQG1HTC5URVhUVVJFX01BR19GSUxURVIsIEBtR0wuTElORUFSXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV9DVUJFX01BUCwgQG1HTC5URVhUVVJFX01JTl9GSUxURVIsIEBtR0wuTElORUFSXG4gICAgICAgICAgICBlbHNlIGlmIGZpbHRlciA9PSBSZW5kZXJlci5GSUxURVIuTUlQTUFQXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV9DVUJFX01BUCwgQG1HTC5URVhUVVJFX01BR19GSUxURVIsIEBtR0wuTElORUFSXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV9DVUJFX01BUCwgQG1HTC5URVhUVVJFX01JTl9GSUxURVIsIEBtR0wuTElORUFSX01JUE1BUF9MSU5FQVJcbiAgICAgICAgICAgICAgICBAbUdMLmdlbmVyYXRlTWlwbWFwIEBtR0wuVEVYVFVSRV9DVUJFX01BUFxuICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfQ1VCRV9NQVAsIG51bGxcbiAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBtT2JqZWN0SUQ6IGlkXG4gICAgICAgICAgICBtWHJlczogaW1hZ2Uud2lkdGhcbiAgICAgICAgICAgIG1ZcmVzOiBpbWFnZS5oZWlnaHRcbiAgICAgICAgICAgIG1Gb3JtYXQ6IGZvcm1hdFxuICAgICAgICAgICAgbVR5cGU6IHR5cGVcbiAgICAgICAgICAgIG1GaWx0ZXI6IGZpbHRlclxuICAgICAgICAgICAgbVdyYXA6IHdyYXBcblxuICAgIHNldFNhbXBsZXJGaWx0ZXI6ICh0ZSwgZmlsdGVyLCBkb0dlbmVyYXRlTWlwc0lmTmVlZGVkKSAtPlxuICAgICAgICBpZiB0ZS5tRmlsdGVyID09IGZpbHRlclxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIGlmIHRlLm1UeXBlID09IFJlbmRlcmVyLlRFWFRZUEUuVDJEXG4gICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV8yRCwgdGUubU9iamVjdElEXG4gICAgICAgICAgICBpZiBmaWx0ZXIgPT0gUmVuZGVyZXIuRklMVEVSLk5PTkVcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzJELCBAbUdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgQG1HTC5ORUFSRVNUXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8yRCwgQG1HTC5URVhUVVJFX01JTl9GSUxURVIsIEBtR0wuTkVBUkVTVFxuICAgICAgICAgICAgZWxzZSBpZiBmaWx0ZXIgPT0gUmVuZGVyZXIuRklMVEVSLkxJTkVBUlxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfMkQsIEBtR0wuVEVYVFVSRV9NQUdfRklMVEVSLCBAbUdMLkxJTkVBUlxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfMkQsIEBtR0wuVEVYVFVSRV9NSU5fRklMVEVSLCBAbUdMLkxJTkVBUlxuICAgICAgICAgICAgZWxzZSBpZiBmaWx0ZXIgPT0gUmVuZGVyZXIuRklMVEVSLk1JUE1BUFxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfMkQsIEBtR0wuVEVYVFVSRV9NQUdfRklMVEVSLCBAbUdMLkxJTkVBUlxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfMkQsIEBtR0wuVEVYVFVSRV9NSU5fRklMVEVSLCBAbUdMLkxJTkVBUl9NSVBNQVBfTElORUFSXG4gICAgICAgICAgICAgICAgaWYgZG9HZW5lcmF0ZU1pcHNJZk5lZWRlZFxuICAgICAgICAgICAgICAgICAgICBAbUdMLmdlbmVyYXRlTWlwbWFwIEBtR0wuVEVYVFVSRV8yRFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfMkQsIEBtR0wuVEVYVFVSRV9NQUdfRklMVEVSLCBAbUdMLk5FQVJFU1RcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzJELCBAbUdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgQG1HTC5ORUFSRVNUX01JUE1BUF9MSU5FQVJcbiAgICAgICAgICAgICAgICBpZiBkb0dlbmVyYXRlTWlwc0lmTmVlZGVkXG4gICAgICAgICAgICAgICAgICAgIEBtR0wuZ2VuZXJhdGVNaXBtYXAgQG1HTC5URVhUVVJFXzJEXG4gICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV8yRCwgbnVsbFxuICAgICAgICBlbHNlIGlmIHRlLm1UeXBlID09IFJlbmRlcmVyLlRFWFRZUEUuVDNEXG4gICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV8zRCwgdGUubU9iamVjdElEXG4gICAgICAgICAgICBpZiBmaWx0ZXIgPT0gUmVuZGVyZXIuRklMVEVSLk5PTkVcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzNELCBAbUdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgQG1HTC5ORUFSRVNUXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8zRCwgQG1HTC5URVhUVVJFX01JTl9GSUxURVIsIEBtR0wuTkVBUkVTVFxuICAgICAgICAgICAgZWxzZSBpZiBmaWx0ZXIgPT0gUmVuZGVyZXIuRklMVEVSLkxJTkVBUlxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfM0QsIEBtR0wuVEVYVFVSRV9NQUdfRklMVEVSLCBAbUdMLkxJTkVBUlxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfM0QsIEBtR0wuVEVYVFVSRV9NSU5fRklMVEVSLCBAbUdMLkxJTkVBUlxuICAgICAgICAgICAgZWxzZSBpZiBmaWx0ZXIgPT0gUmVuZGVyZXIuRklMVEVSLk1JUE1BUFxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfM0QsIEBtR0wuVEVYVFVSRV9NQUdfRklMVEVSLCBAbUdMLkxJTkVBUlxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfM0QsIEBtR0wuVEVYVFVSRV9NSU5fRklMVEVSLCBAbUdMLkxJTkVBUl9NSVBNQVBfTElORUFSXG4gICAgICAgICAgICAgICAgaWYgZG9HZW5lcmF0ZU1pcHNJZk5lZWRlZFxuICAgICAgICAgICAgICAgICAgICBAbUdMLmdlbmVyYXRlTWlwbWFwIEBtR0wuVEVYVFVSRV8zRFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfM0QsIEBtR0wuVEVYVFVSRV9NQUdfRklMVEVSLCBAbUdMLk5FQVJFU1RcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzNELCBAbUdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgQG1HTC5ORUFSRVNUX01JUE1BUF9MSU5FQVJcbiAgICAgICAgICAgICAgICBpZiBkb0dlbmVyYXRlTWlwc0lmTmVlZGVkXG4gICAgICAgICAgICAgICAgICAgIEBtR0wuZ2VuZXJhdGVNaXBtYXAgQG1HTC5URVhUVVJFXzNEXG4gICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV8zRCwgbnVsbFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV9DVUJFX01BUCwgdGUubU9iamVjdElEXG4gICAgICAgICAgICBpZiBmaWx0ZXIgPT0gUmVuZGVyZXIuRklMVEVSLk5PTkVcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCBAbUdMLlRFWFRVUkVfTUFHX0ZJTFRFUiwgQG1HTC5ORUFSRVNUXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV9DVUJFX01BUCwgQG1HTC5URVhUVVJFX01JTl9GSUxURVIsIEBtR0wuTkVBUkVTVFxuICAgICAgICAgICAgZWxzZSBpZiBmaWx0ZXIgPT0gUmVuZGVyZXIuRklMVEVSLkxJTkVBUlxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfQ1VCRV9NQVAsIEBtR0wuVEVYVFVSRV9NQUdfRklMVEVSLCBAbUdMLkxJTkVBUlxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfQ1VCRV9NQVAsIEBtR0wuVEVYVFVSRV9NSU5fRklMVEVSLCBAbUdMLkxJTkVBUlxuICAgICAgICAgICAgZWxzZSBpZiBmaWx0ZXIgPT0gUmVuZGVyZXIuRklMVEVSLk1JUE1BUFxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfQ1VCRV9NQVAsIEBtR0wuVEVYVFVSRV9NQUdfRklMVEVSLCBAbUdMLkxJTkVBUlxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfQ1VCRV9NQVAsIEBtR0wuVEVYVFVSRV9NSU5fRklMVEVSLCBAbUdMLkxJTkVBUl9NSVBNQVBfTElORUFSXG4gICAgICAgICAgICAgICAgaWYgZG9HZW5lcmF0ZU1pcHNJZk5lZWRlZFxuICAgICAgICAgICAgICAgICAgICBAbUdMLmdlbmVyYXRlTWlwbWFwIEBtR0wuVEVYVFVSRV9DVUJFX01BUFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfQ1VCRV9NQVAsIEBtR0wuVEVYVFVSRV9NQUdfRklMVEVSLCBAbUdMLk5FQVJFU1RcbiAgICAgICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCBAbUdMLlRFWFRVUkVfTUlOX0ZJTFRFUiwgQG1HTC5ORUFSRVNUX01JUE1BUF9MSU5FQVJcbiAgICAgICAgICAgICAgICBpZiBkb0dlbmVyYXRlTWlwc0lmTmVlZGVkXG4gICAgICAgICAgICAgICAgICAgIEBtR0wuZ2VuZXJhdGVNaXBtYXAgQG1HTC5URVhUVVJFX0NVQkVfTUFQXG4gICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV9DVUJFX01BUCwgbnVsbFxuICAgICAgICB0ZS5tRmlsdGVyID0gZmlsdGVyXG5cbiAgICBzZXRTYW1wbGVyV3JhcDogKHRlLCB3cmFwKSAtPlxuICAgICAgICBpZiB0ZS5tV3JhcCA9PSB3cmFwXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgZ2xXcmFwID0gQG1HTC5SRVBFQVRcbiAgICAgICAgaWYgd3JhcCA9PSBSZW5kZXJlci5URVhXUlAuQ0xBTVBcbiAgICAgICAgICAgIGdsV3JhcCA9IEBtR0wuQ0xBTVBfVE9fRURHRVxuICAgICAgICBpZCA9IHRlLm1PYmplY3RJRFxuICAgICAgICBpZiB0ZS5tVHlwZSA9PSBSZW5kZXJlci5URVhUWVBFLlQyRFxuICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfMkQsIGlkXG4gICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzJELCBAbUdMLlRFWFRVUkVfV1JBUF9TLCBnbFdyYXBcbiAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfMkQsIEBtR0wuVEVYVFVSRV9XUkFQX1QsIGdsV3JhcFxuICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfMkQsIG51bGxcbiAgICAgICAgZWxzZSBpZiB0ZS5tVHlwZSA9PSBSZW5kZXJlci5URVhUWVBFLlQzRFxuICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfM0QsIGlkXG4gICAgICAgICAgICBAbUdMLnRleFBhcmFtZXRlcmkgQG1HTC5URVhUVVJFXzNELCBAbUdMLlRFWFRVUkVfV1JBUF9SLCBnbFdyYXBcbiAgICAgICAgICAgIEBtR0wudGV4UGFyYW1ldGVyaSBAbUdMLlRFWFRVUkVfM0QsIEBtR0wuVEVYVFVSRV9XUkFQX1MsIGdsV3JhcFxuICAgICAgICAgICAgQG1HTC50ZXhQYXJhbWV0ZXJpIEBtR0wuVEVYVFVSRV8zRCwgQG1HTC5URVhUVVJFX1dSQVBfVCwgZ2xXcmFwXG4gICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV8zRCwgbnVsbFxuICAgICAgICB0ZS5tV3JhcCA9IHdyYXBcblxuICAgIHNldFNhbXBsZXJWRmxpcDogKHRlLCB2ZmxpcCwgaW1hZ2UpIC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIHRlLm1WRmxpcCA9PSB2ZmxpcFxuICAgICAgICBpZCA9IHRlLm1PYmplY3RJRFxuICAgICAgICBpZiB0ZS5tVHlwZSA9PSBSZW5kZXJlci5URVhUWVBFLlQyRFxuICAgICAgICAgICAgaWYgaW1hZ2UgIT0gbnVsbFxuICAgICAgICAgICAgICAgIEBtR0wuYWN0aXZlVGV4dHVyZSBAbUdMLlRFWFRVUkUwXG4gICAgICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfMkQsIGlkXG4gICAgICAgICAgICAgICAgQG1HTC5waXhlbFN0b3JlaSBAbUdMLlVOUEFDS19GTElQX1lfV0VCR0wsIHZmbGlwXG4gICAgICAgICAgICAgICAgZ2xGb1R5ID0gQGlGb3JtYXRQSTJHTCh0ZS5tRm9ybWF0KVxuICAgICAgICAgICAgICAgIEBtR0wudGV4SW1hZ2UyRCBAbUdMLlRFWFRVUkVfMkQsIDAsIGdsRm9UeS5tR0xGb3JtYXQsIGdsRm9UeS5tR0xFeHRlcm5hbCwgZ2xGb1R5Lm1HTFR5cGUsIGltYWdlXG4gICAgICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfMkQsIG51bGxcbiAgICAgICAgZWxzZSBpZiB0ZS5tVHlwZSA9PSBSZW5kZXJlci5URVhUWVBFLkNVQkVNQVBcbiAgICAgICAgICAgIGlmIGltYWdlICE9IG51bGxcbiAgICAgICAgICAgICAgICBnbEZvVHkgPSBAaUZvcm1hdFBJMkdMKHRlLm1Gb3JtYXQpXG4gICAgICAgICAgICAgICAgQG1HTC5hY3RpdmVUZXh0dXJlIEBtR0wuVEVYVFVSRTBcbiAgICAgICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV9DVUJFX01BUCwgaWRcbiAgICAgICAgICAgICAgICBAbUdMLnBpeGVsU3RvcmVpIEBtR0wuVU5QQUNLX0ZMSVBfWV9XRUJHTCwgdmZsaXBcbiAgICAgICAgICAgICAgICBAbUdMLnRleEltYWdlMkQgQG1HTC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1gsIDAsIGdsRm9UeS5tR0xGb3JtYXQsIGdsRm9UeS5tR0xFeHRlcm5hbCwgZ2xGb1R5Lm1HTFR5cGUsIGltYWdlWzBdXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhJbWFnZTJEIEBtR0wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9YLCAwLCBnbEZvVHkubUdMRm9ybWF0LCBnbEZvVHkubUdMRXh0ZXJuYWwsIGdsRm9UeS5tR0xUeXBlLCBpbWFnZVsxXVxuICAgICAgICAgICAgICAgIEBtR0wudGV4SW1hZ2UyRCBAbUdMLlRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWSwgMCwgZ2xGb1R5Lm1HTEZvcm1hdCwgZ2xGb1R5Lm1HTEV4dGVybmFsLCBnbEZvVHkubUdMVHlwZSwgaWYgdmZsaXAgdGhlbiBpbWFnZVszXSBlbHNlIGltYWdlWzJdXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhJbWFnZTJEIEBtR0wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9ZLCAwLCBnbEZvVHkubUdMRm9ybWF0LCBnbEZvVHkubUdMRXh0ZXJuYWwsIGdsRm9UeS5tR0xUeXBlLCBpZiB2ZmxpcCB0aGVuIGltYWdlWzJdIGVsc2UgaW1hZ2VbM11cbiAgICAgICAgICAgICAgICBAbUdMLnRleEltYWdlMkQgQG1HTC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1osIDAsIGdsRm9UeS5tR0xGb3JtYXQsIGdsRm9UeS5tR0xFeHRlcm5hbCwgZ2xGb1R5Lm1HTFR5cGUsIGltYWdlWzRdXG4gICAgICAgICAgICAgICAgQG1HTC50ZXhJbWFnZTJEIEBtR0wuVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9aLCAwLCBnbEZvVHkubUdMRm9ybWF0LCBnbEZvVHkubUdMRXh0ZXJuYWwsIGdsRm9UeS5tR0xUeXBlLCBpbWFnZVs1XVxuICAgICAgICAgICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCBudWxsXG4gICAgICAgIHRlLm1WRmxpcCA9IHZmbGlwXG4gICAgICAgIFxuICAgIGNyZWF0ZU1pcG1hcHM6ICh0ZSkgLT5cbiAgICAgICAgaWYgdGUubVR5cGUgPT0gUmVuZGVyZXIuVEVYVFlQRS5UMkRcbiAgICAgICAgICAgIEBtR0wuYWN0aXZlVGV4dHVyZSBAbUdMLlRFWFRVUkUwXG4gICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV8yRCwgdGUubU9iamVjdElEXG4gICAgICAgICAgICBAbUdMLmdlbmVyYXRlTWlwbWFwIEBtR0wuVEVYVFVSRV8yRFxuICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfMkQsIG51bGxcbiAgICAgICAgZWxzZSBpZiB0ZS5tVHlwZSA9PSBSZW5kZXJlci5URVhUWVBFLkNVQkVNQVBcbiAgICAgICAgICAgIEBtR0wuYWN0aXZlVGV4dHVyZSBAbUdMLlRFWFRVUkUwXG4gICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV9DVUJFX01BUCwgdGUubU9iamVjdElEXG4gICAgICAgICAgICBAbUdMLmdlbmVyYXRlTWlwbWFwIEBtR0wuVEVYVFVSRV9DVUJFX01BUFxuICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfQ1VCRV9NQVAsIG51bGxcblxuICAgIHVwZGF0ZVRleHR1cmU6ICh0ZXgsIHgwLCB5MCwgeHJlcywgeXJlcywgYnVmZmVyKSAtPlxuICAgICAgICBnbEZvVHkgPSBAaUZvcm1hdFBJMkdMKHRleC5tRm9ybWF0KVxuICAgICAgICBpZiB0ZXgubVR5cGUgPT0gUmVuZGVyZXIuVEVYVFlQRS5UMkRcbiAgICAgICAgICAgIEBtR0wuYWN0aXZlVGV4dHVyZSBAbUdMLlRFWFRVUkUwXG4gICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV8yRCwgdGV4Lm1PYmplY3RJRFxuICAgICAgICAgICAgQG1HTC5waXhlbFN0b3JlaSBAbUdMLlVOUEFDS19GTElQX1lfV0VCR0wsIGZhbHNlXG4gICAgICAgICAgICBAbUdMLnRleFN1YkltYWdlMkQgQG1HTC5URVhUVVJFXzJELCAwLCB4MCwgeTAsIHhyZXMsIHlyZXMsIGdsRm9UeS5tR0xFeHRlcm5hbCwgZ2xGb1R5Lm1HTFR5cGUsIGJ1ZmZlclxuICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfMkQsIG51bGxcblxuICAgIHVwZGF0ZVRleHR1cmVGcm9tSW1hZ2U6ICh0ZXgsIGltYWdlKSAtPlxuICAgICAgICBnbEZvVHkgPSBAaUZvcm1hdFBJMkdMKHRleC5tRm9ybWF0KVxuICAgICAgICBpZiB0ZXgubVR5cGUgPT0gUmVuZGVyZXIuVEVYVFlQRS5UMkRcbiAgICAgICAgICAgIEBtR0wuYWN0aXZlVGV4dHVyZSBAbUdMLlRFWFRVUkUwXG4gICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV8yRCwgdGV4Lm1PYmplY3RJRFxuICAgICAgICAgICAgQG1HTC5waXhlbFN0b3JlaSBAbUdMLlVOUEFDS19GTElQX1lfV0VCR0wsIGZhbHNlXG4gICAgICAgICAgICBAbUdMLnRleEltYWdlMkQgQG1HTC5URVhUVVJFXzJELCAwLCBnbEZvVHkubUdMRm9ybWF0LCBnbEZvVHkubUdMRXh0ZXJuYWwsIGdsRm9UeS5tR0xUeXBlLCBpbWFnZVxuICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfMkQsIG51bGxcblxuICAgIGRlc3Ryb3lUZXh0dXJlOiAodGUpIC0+IGlmIHRlPy5tT2JqZWN0SUQgdGhlbiBAbUdMLmRlbGV0ZVRleHR1cmUgdGUubU9iamVjdElEXG5cbiAgICBhdHRhY2hUZXh0dXJlczogKG51bSwgdDAsIHQxLCB0MiwgdDMpIC0+XG4gICAgICAgIGlmIG51bSA+IDAgYW5kIHQwICE9IG51bGxcbiAgICAgICAgICAgIEBtR0wuYWN0aXZlVGV4dHVyZSBAbUdMLlRFWFRVUkUwXG4gICAgICAgICAgICBpZiB0MC5tVHlwZSA9PSBSZW5kZXJlci5URVhUWVBFLlQyRFxuICAgICAgICAgICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFXzJELCB0MC5tT2JqZWN0SURcbiAgICAgICAgICAgIGVsc2UgaWYgdDAubVR5cGUgPT0gUmVuZGVyZXIuVEVYVFlQRS5UM0RcbiAgICAgICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV8zRCwgdDAubU9iamVjdElEXG4gICAgICAgICAgICBlbHNlIGlmIHQwLm1UeXBlID09IFJlbmRlcmVyLlRFWFRZUEUuQ1VCRU1BUFxuICAgICAgICAgICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCB0MC5tT2JqZWN0SURcbiAgICAgICAgaWYgbnVtID4gMSBhbmQgdDEgIT0gbnVsbFxuICAgICAgICAgICAgQG1HTC5hY3RpdmVUZXh0dXJlIEBtR0wuVEVYVFVSRTFcbiAgICAgICAgICAgIGlmIHQxLm1UeXBlID09IFJlbmRlcmVyLlRFWFRZUEUuVDJEXG4gICAgICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfMkQsIHQxLm1PYmplY3RJRFxuICAgICAgICAgICAgZWxzZSBpZiB0MS5tVHlwZSA9PSBSZW5kZXJlci5URVhUWVBFLlQzRFxuICAgICAgICAgICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFXzNELCB0MS5tT2JqZWN0SURcbiAgICAgICAgICAgIGVsc2UgaWYgdDEubVR5cGUgPT0gUmVuZGVyZXIuVEVYVFlQRS5DVUJFTUFQXG4gICAgICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfQ1VCRV9NQVAsIHQxLm1PYmplY3RJRFxuICAgICAgICBpZiBudW0gPiAyIGFuZCB0MiAhPSBudWxsXG4gICAgICAgICAgICBAbUdMLmFjdGl2ZVRleHR1cmUgQG1HTC5URVhUVVJFMlxuICAgICAgICAgICAgaWYgdDIubVR5cGUgPT0gUmVuZGVyZXIuVEVYVFlQRS5UMkRcbiAgICAgICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV8yRCwgdDIubU9iamVjdElEXG4gICAgICAgICAgICBlbHNlIGlmIHQyLm1UeXBlID09IFJlbmRlcmVyLlRFWFRZUEUuVDNEXG4gICAgICAgICAgICAgICAgQG1HTC5iaW5kVGV4dHVyZSBAbUdMLlRFWFRVUkVfM0QsIHQyLm1PYmplY3RJRFxuICAgICAgICAgICAgZWxzZSBpZiB0Mi5tVHlwZSA9PSBSZW5kZXJlci5URVhUWVBFLkNVQkVNQVBcbiAgICAgICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV9DVUJFX01BUCwgdDIubU9iamVjdElEXG4gICAgICAgIGlmIG51bSA+IDMgYW5kIHQzICE9IG51bGxcbiAgICAgICAgICAgIEBtR0wuYWN0aXZlVGV4dHVyZSBAbUdMLlRFWFRVUkUzXG4gICAgICAgICAgICBpZiB0My5tVHlwZSA9PSBSZW5kZXJlci5URVhUWVBFLlQyRFxuICAgICAgICAgICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFXzJELCB0My5tT2JqZWN0SURcbiAgICAgICAgICAgIGVsc2UgaWYgdDMubVR5cGUgPT0gUmVuZGVyZXIuVEVYVFlQRS5UM0RcbiAgICAgICAgICAgICAgICBAbUdMLmJpbmRUZXh0dXJlIEBtR0wuVEVYVFVSRV8zRCwgdDMubU9iamVjdElEXG4gICAgICAgICAgICBlbHNlIGlmIHQzLm1UeXBlID09IFJlbmRlcmVyLlRFWFRZUEUuQ1VCRU1BUFxuICAgICAgICAgICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCB0My5tT2JqZWN0SURcbiAgICAgICAgcmV0dXJuXG5cbiAgICBkZXR0YWNoVGV4dHVyZXM6IC0+XG4gICAgICAgIEBtR0wuYWN0aXZlVGV4dHVyZSBAbUdMLlRFWFRVUkUwXG4gICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFXzJELCBudWxsXG4gICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCBudWxsXG4gICAgICAgIEBtR0wuYWN0aXZlVGV4dHVyZSBAbUdMLlRFWFRVUkUxXG4gICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFXzJELCBudWxsXG4gICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCBudWxsXG4gICAgICAgIEBtR0wuYWN0aXZlVGV4dHVyZSBAbUdMLlRFWFRVUkUyXG4gICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFXzJELCBudWxsXG4gICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCBudWxsXG4gICAgICAgIEBtR0wuYWN0aXZlVGV4dHVyZSBAbUdMLlRFWFRVUkUzXG4gICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFXzJELCBudWxsXG4gICAgICAgIEBtR0wuYmluZFRleHR1cmUgQG1HTC5URVhUVVJFX0NVQkVfTUFQLCBudWxsXG5cbiAgICBjcmVhdGVSZW5kZXJUYXJnZXQ6IChjb2xvcjApIC0+XG4gICAgICAgIFxuICAgICAgICBpZCA9IEBtR0wuY3JlYXRlRnJhbWVidWZmZXIoKVxuICAgICAgICBAbUdMLmJpbmRGcmFtZWJ1ZmZlciBAbUdMLkZSQU1FQlVGRkVSLCBpZFxuICAgICAgICAjIEBtR0wuZnJhbWVidWZmZXJUZXh0dXJlMkQgQG1HTC5GUkFNRUJVRkZFUiwgQG1HTC5ERVBUSF9BVFRBQ0hNRU5ULCBAbUdMLlRFWFRVUkVfMkQsIGRlcHRoLm1PYmplY3RJRCwgMFxuICAgICAgICBpZiBjb2xvcjBcbiAgICAgICAgICAgIEBtR0wuZnJhbWVidWZmZXJUZXh0dXJlMkQgQG1HTC5GUkFNRUJVRkZFUiwgQG1HTC5DT0xPUl9BVFRBQ0hNRU5UMCwgQG1HTC5URVhUVVJFXzJELCBjb2xvcjAubU9iamVjdElELCAwXG4gICAgICAgIGlmIEBtR0wuY2hlY2tGcmFtZWJ1ZmZlclN0YXR1cyhAbUdMLkZSQU1FQlVGRkVSKSAhPSBAbUdMLkZSQU1FQlVGRkVSX0NPTVBMRVRFXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICBAbUdMLmJpbmRSZW5kZXJidWZmZXIgQG1HTC5SRU5ERVJCVUZGRVIsIG51bGxcbiAgICAgICAgQG1HTC5iaW5kRnJhbWVidWZmZXIgIEBtR0wuRlJBTUVCVUZGRVIsIG51bGxcbiAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBtT2JqZWN0SUQ6IGlkXG4gICAgICAgICAgICBtVGV4MDogY29sb3IwXG5cbiAgICBkZXN0cm95UmVuZGVyVGFyZ2V0OiAodGV4KSAtPlxuICAgICAgICBAbUdMLmRlbGV0ZUZyYW1lYnVmZmVyIHRleC5tT2JqZWN0SURcblxuICAgIHNldFJlbmRlclRhcmdldDogKHRleCkgLT4gQG1HTC5iaW5kRnJhbWVidWZmZXIgQG1HTC5GUkFNRUJVRkZFUiwgdGV4Py5tT2JqZWN0SURcblxuICAgIGNyZWF0ZVJlbmRlclRhcmdldE5ldzogKHdhbnRDb2xvcjAsIHdhbnRaYnVmZmVyLCB4cmVzLCB5cmVzLCBzYW1wbGVzKSAtPlxuICAgICAgICBpZCA9IEBtR0wuY3JlYXRlRnJhbWVidWZmZXIoKVxuICAgICAgICBAbUdMLmJpbmRGcmFtZWJ1ZmZlciBAbUdMLkZSQU1FQlVGRkVSLCBpZFxuICAgICAgICBpZiB3YW50WmJ1ZmZlciA9PSB0cnVlXG4gICAgICAgICAgICB6YiA9IEBtR0wuY3JlYXRlUmVuZGVyYnVmZmVyKClcbiAgICAgICAgICAgIEBtR0wuYmluZFJlbmRlcmJ1ZmZlciBAbUdMLlJFTkRFUkJVRkZFUiwgemJcbiAgICAgICAgICAgIGlmIHNhbXBsZXMgPT0gMVxuICAgICAgICAgICAgICAgIEBtR0wucmVuZGVyYnVmZmVyU3RvcmFnZSBAbUdMLlJFTkRFUkJVRkZFUiwgQG1HTC5ERVBUSF9DT01QT05FTlQxNiwgeHJlcywgeXJlc1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBtR0wucmVuZGVyYnVmZmVyU3RvcmFnZU11bHRpc2FtcGxlIEBtR0wuUkVOREVSQlVGRkVSLCBzYW1wbGVzLCBAbUdMLkRFUFRIX0NPTVBPTkVOVDE2LCB4cmVzLCB5cmVzXG4gICAgICAgICAgICBAbUdMLmZyYW1lYnVmZmVyUmVuZGVyYnVmZmVyIEBtR0wuRlJBTUVCVUZGRVIsIEBtR0wuREVQVEhfQVRUQUNITUVOVCwgQG1HTC5SRU5ERVJCVUZGRVIsIHpiXG4gICAgICAgIGlmIHdhbnRDb2xvcjBcbiAgICAgICAgICAgIGNiID0gQG1HTC5jcmVhdGVSZW5kZXJidWZmZXIoKVxuICAgICAgICAgICAgQG1HTC5iaW5kUmVuZGVyYnVmZmVyIEBtR0wuUkVOREVSQlVGRkVSLCBjYlxuICAgICAgICAgICAgaWYgc2FtcGxlcyA9PSAxXG4gICAgICAgICAgICAgICAgQG1HTC5yZW5kZXJidWZmZXJTdG9yYWdlIEBtR0wuUkVOREVSQlVGRkVSLCBAbUdMLlJHQkE4LCB4cmVzLCB5cmVzXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQG1HTC5yZW5kZXJidWZmZXJTdG9yYWdlTXVsdGlzYW1wbGUgQG1HTC5SRU5ERVJCVUZGRVIsIHNhbXBsZXMsIEBtR0wuUkdCQTgsIHhyZXMsIHlyZXNcbiAgICAgICAgICAgIEBtR0wuZnJhbWVidWZmZXJSZW5kZXJidWZmZXIgQG1HTC5GUkFNRUJVRkZFUiwgQG1HTC5DT0xPUl9BVFRBQ0hNRU5UMCwgQG1HTC5SRU5ERVJCVUZGRVIsIGNiXG4gICAgICAgIGlmIEBtR0wuY2hlY2tGcmFtZWJ1ZmZlclN0YXR1cyhtR0wuRlJBTUVCVUZGRVIpICE9IEBtR0wuRlJBTUVCVUZGRVJfQ09NUExFVEVcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIEBtR0wuYmluZFJlbmRlcmJ1ZmZlciBAbUdMLlJFTkRFUkJVRkZFUiwgbnVsbFxuICAgICAgICBAbUdMLmJpbmRGcmFtZWJ1ZmZlciBAbUdMLkZSQU1FQlVGRkVSLCBudWxsXG4gICAgICAgIHJldHVyblxuICAgICAgICAgICAgbU9iamVjdElEOiBpZFxuICAgICAgICAgICAgbVhyZXM6IHhyZXNcbiAgICAgICAgICAgIG1ZcmVzOiB5cmVzXG4gICAgICAgICAgICBtVGV4MDogY29sb3IwXG5cbiAgICBjcmVhdGVSZW5kZXJUYXJnZXRDdWJlTWFwOiAoY29sb3IwKSAtPlxuICAgICAgICBpZCA9IEBtR0wuY3JlYXRlRnJhbWVidWZmZXIoKVxuICAgICAgICBAbUdMLmJpbmRGcmFtZWJ1ZmZlciBAbUdMLkZSQU1FQlVGRkVSLCBpZFxuICAgICAgICBAbUdMLmZyYW1lYnVmZmVyVGV4dHVyZTJEIEBtR0wuRlJBTUVCVUZGRVIsIEBtR0wuREVQVEhfQVRUQUNITUVOVCwgQG1HTC5URVhUVVJFXzJELCBkZXB0aC5tT2JqZWN0SUQsIDBcbiAgICAgICAgaWYgY29sb3IwICE9IG51bGxcbiAgICAgICAgICAgIEBtR0wuZnJhbWVidWZmZXJUZXh0dXJlMkQgQG1HTC5GUkFNRUJVRkZFUiwgQG1HTC5DT0xPUl9BVFRBQ0hNRU5UMCwgQG1HTC5URVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1gsIGNvbG9yMC5tT2JqZWN0SUQsIDBcbiAgICAgICAgaWYgQG1HTC5jaGVja0ZyYW1lYnVmZmVyU3RhdHVzKG1HTC5GUkFNRUJVRkZFUikgIT0gQG1HTC5GUkFNRUJVRkZFUl9DT01QTEVURVxuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgQG1HTC5iaW5kUmVuZGVyYnVmZmVyIEBtR0wuUkVOREVSQlVGRkVSLCBudWxsXG4gICAgICAgIEBtR0wuYmluZEZyYW1lYnVmZmVyIEBtR0wuRlJBTUVCVUZGRVIsIG51bGxcbiAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBtT2JqZWN0SUQ6IGlkXG4gICAgICAgICAgICBtVGV4MDogY29sb3IwXG5cbiAgICBzZXRSZW5kZXJUYXJnZXRDdWJlTWFwOiAoZmJvLCBmYWNlKSAtPlxuICAgICAgICBpZiBmYm8gPT0gbnVsbFxuICAgICAgICAgICAgQG1HTC5iaW5kRnJhbWVidWZmZXIgQG1HTC5GUkFNRUJVRkZFUiwgbnVsbFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbUdMLmJpbmRGcmFtZWJ1ZmZlciBAbUdMLkZSQU1FQlVGRkVSLCBmYm8ubU9iamVjdElEXG4gICAgICAgICAgICBAbUdMLmZyYW1lYnVmZmVyVGV4dHVyZTJEIEBtR0wuRlJBTUVCVUZGRVIsIEBtR0wuQ09MT1JfQVRUQUNITUVOVDAsIEBtR0wuVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YICsgZmFjZSwgZmJvLm1UZXgwLm1PYmplY3RJRCwgMFxuXG4gICAgYmxpdFJlbmRlclRhcmdldDogKGRzdCwgc3JjKSAtPlxuICAgICAgICBAbUdMLmJpbmRGcmFtZWJ1ZmZlciBAbUdMLlJFQURfRlJBTUVCVUZGRVIsIHNyYy5tT2JqZWN0SURcbiAgICAgICAgQG1HTC5iaW5kRnJhbWVidWZmZXIgQG1HTC5EUkFXX0ZSQU1FQlVGRkVSLCBkc3QubU9iamVjdElEXG4gICAgICAgIEBtR0wuY2xlYXJCdWZmZXJmdiBAbUdMLkNPTE9SLCAwLCBbIDAgMCAwIDEgXVxuICAgICAgICBAbUdMLmJsaXRGcmFtZWJ1ZmZlciAwLCAwLCBzcmMubVhyZXMsIHNyYy5tWXJlcywgMCwgMCwgc3JjLm1YcmVzLCBzcmMubVlyZXMsIEBtR0wuQ09MT1JfQlVGRkVSX0JJVCwgQG1HTC5MSU5FQVJcblxuICAgIHNldFZpZXdwb3J0OiAodnApIC0+XG4gICAgICAgIEBtR0wudmlld3BvcnQgdnBbMF0sIHZwWzFdLCB2cFsyXSwgdnBbM11cblxuICAgIHNldFdyaXRlTWFzazogKGMwLCBjMSwgYzIsIGMzLCB6KSAtPlxuICAgICAgICBAbUdMLmRlcHRoTWFzayB6XG4gICAgICAgIEBtR0wuY29sb3JNYXNrIGMwLCBjMCwgYzAsIGMwXG5cbiAgICBzZXRTdGF0ZTogKHN0YXRlTmFtZSwgc3RhdGVWYWx1ZSkgLT5cbiAgICAgICAgaWYgc3RhdGVOYW1lID09IFJlbmRlcmVyLlJFTkRTVEdBVEUuV0lSRUZSQU1FXG4gICAgICAgICAgICBpZiBzdGF0ZVZhbHVlXG4gICAgICAgICAgICAgICAgQG1HTC5wb2x5Z29uTW9kZSBAbUdMLkZST05UX0FORF9CQUNLLCBAbUdMLkxJTkVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAbUdMLnBvbHlnb25Nb2RlIEBtR0wuRlJPTlRfQU5EX0JBQ0ssIEBtR0wuRklMTFxuICAgICAgICBlbHNlIGlmIHN0YXRlTmFtZSA9PSBSZW5kZXJlci5SRU5EU1RHQVRFLkZST05UX0ZBQ0VcbiAgICAgICAgICAgIGlmIHN0YXRlVmFsdWVcbiAgICAgICAgICAgICAgICBAbUdMLmN1bGxGYWNlIEBtR0wuQkFDS1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBtR0wuY3VsbEZhY2UgQG1HTC5GUk9OVFxuICAgICAgICBlbHNlIGlmIHN0YXRlTmFtZSA9PSBSZW5kZXJlci5SRU5EU1RHQVRFLkNVTExfRkFDRVxuICAgICAgICAgICAgaWYgc3RhdGVWYWx1ZVxuICAgICAgICAgICAgICAgIEBtR0wuZW5hYmxlIEBtR0wuQ1VMTF9GQUNFXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQG1HTC5kaXNhYmxlIEBtR0wuQ1VMTF9GQUNFXG4gICAgICAgIGVsc2UgaWYgc3RhdGVOYW1lID09IFJlbmRlcmVyLlJFTkRTVEdBVEUuREVQVEhfVEVTVFxuICAgICAgICAgICAgaWYgc3RhdGVWYWx1ZVxuICAgICAgICAgICAgICAgIEBtR0wuZW5hYmxlIEBtR0wuREVQVEhfVEVTVFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBtR0wuZGlzYWJsZSBAbUdMLkRFUFRIX1RFU1RcbiAgICAgICAgZWxzZSBpZiBzdGF0ZU5hbWUgPT0gUmVuZGVyZXIuUkVORFNUR0FURS5BTFBIQV9UT19DT1ZFUkFHRVxuICAgICAgICAgICAgaWYgc3RhdGVWYWx1ZVxuICAgICAgICAgICAgICAgIEBtR0wuZW5hYmxlIEBtR0wuU0FNUExFX0FMUEhBX1RPX0NPVkVSQUdFXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQG1HTC5kaXNhYmxlIEBtR0wuU0FNUExFX0FMUEhBX1RPX0NPVkVSQUdFXG5cbiAgICBzZXRNdWx0aXNhbXBsZTogKHYpIC0+XG4gICAgICAgIGlmIHYgPT0gdHJ1ZVxuICAgICAgICAgICAgQG1HTC5lbmFibGUgQG1HTC5TQU1QTEVfQ09WRVJBR0VcbiAgICAgICAgICAgIEBtR0wuc2FtcGxlQ292ZXJhZ2UgMS4wLCBmYWxzZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAbUdMLmRpc2FibGUgQG1HTC5TQU1QTEVfQ09WRVJBR0VcblxuICAgIGNyZWF0ZVNoYWRlcjogKHZzU291cmNlLCBmc1NvdXJjZSkgLT5cbiAgICAgICAgaWYgQG1HTCA9PSBudWxsXG4gICAgICAgICAgICByZXR1cm4gXG4gICAgICAgICAgICAgICAgbVByb2dyYW06IG51bGxcbiAgICAgICAgICAgICAgICBtUmVzdWx0OiBmYWxzZVxuICAgICAgICAgICAgICAgIG1JbmZvOiAnTm8gV2ViR0wnXG4gICAgICAgICAgICAgICAgbUhlYWRlckxpbmVzOiAwXG4gICAgICAgIHRlID0gXG4gICAgICAgICAgICBtUHJvZ3JhbTogbnVsbFxuICAgICAgICAgICAgbVJlc3VsdDogdHJ1ZVxuICAgICAgICAgICAgbUluZm86ICdTaGFkZXIgY29tcGlsZWQgc3VjY2Vzc2Z1bGx5J1xuICAgICAgICAgICAgbUhlYWRlckxpbmVzOiAwXG4gICAgICAgICAgICBtRXJyb3JUeXBlOiAwXG4gICAgICAgIHZzID0gQG1HTC5jcmVhdGVTaGFkZXIoQG1HTC5WRVJURVhfU0hBREVSKVxuICAgICAgICBmcyA9IEBtR0wuY3JlYXRlU2hhZGVyKEBtR0wuRlJBR01FTlRfU0hBREVSKVxuICAgICAgICBtU2hhZGVySGVhZGVyID0gJyN2ZXJzaW9uIDMwMCBlc1xcbicgKyAnI2lmZGVmIEdMX0VTXFxuJyArICdwcmVjaXNpb24gaGlnaHAgZmxvYXQ7XFxuJyArICdwcmVjaXNpb24gaGlnaHAgaW50O1xcbicgKyAncHJlY2lzaW9uIG1lZGl1bXAgc2FtcGxlcjNEO1xcbicgKyAnI2VuZGlmXFxuJ1xuICAgICAgICBAbUdMLnNoYWRlclNvdXJjZSB2cywgbVNoYWRlckhlYWRlciArIHZzU291cmNlXG4gICAgICAgIEBtR0wuc2hhZGVyU291cmNlIGZzLCBtU2hhZGVySGVhZGVyICsgZnNTb3VyY2VcbiAgICAgICAgQG1HTC5jb21waWxlU2hhZGVyIHZzXG4gICAgICAgIEBtR0wuY29tcGlsZVNoYWRlciBmc1xuICAgICAgICBpZiBub3QgQG1HTC5nZXRTaGFkZXJQYXJhbWV0ZXIodnMsIEBtR0wuQ09NUElMRV9TVEFUVVMpXG4gICAgICAgICAgICBpbmZvTG9nID0gQG1HTC5nZXRTaGFkZXJJbmZvTG9nKHZzKVxuICAgICAgICAgICAgdGUubUluZm8gPSBpbmZvTG9nXG4gICAgICAgICAgICB0ZS5tRXJyb3JUeXBlID0gMFxuICAgICAgICAgICAgdGUubVJlc3VsdCA9IGZhbHNlXG4gICAgICAgICAgICByZXR1cm4gdGVcbiAgICAgICAgaWYgbm90IEBtR0wuZ2V0U2hhZGVyUGFyYW1ldGVyKGZzLCBAbUdMLkNPTVBJTEVfU1RBVFVTKVxuICAgICAgICAgICAgaW5mb0xvZyA9IEBtR0wuZ2V0U2hhZGVySW5mb0xvZyhmcylcbiAgICAgICAgICAgIHRlLm1JbmZvID0gaW5mb0xvZ1xuICAgICAgICAgICAgdGUubUVycm9yVHlwZSA9IDFcbiAgICAgICAgICAgIHRlLm1SZXN1bHQgPSBmYWxzZVxuICAgICAgICAgICAgcmV0dXJuIHRlXG4gICAgICAgIHRlLm1Qcm9ncmFtID0gQG1HTC5jcmVhdGVQcm9ncmFtKClcbiAgICAgICAgQG1HTC5hdHRhY2hTaGFkZXIgdGUubVByb2dyYW0sIHZzXG4gICAgICAgIEBtR0wuYXR0YWNoU2hhZGVyIHRlLm1Qcm9ncmFtLCBmc1xuICAgICAgICBAbUdMLmxpbmtQcm9ncmFtIHRlLm1Qcm9ncmFtXG4gICAgICAgIGlmIG5vdCBAbUdMLmdldFByb2dyYW1QYXJhbWV0ZXIodGUubVByb2dyYW0sIEBtR0wuTElOS19TVEFUVVMpXG4gICAgICAgICAgICBpbmZvTG9nID0gQG1HTC5nZXRQcm9ncmFtSW5mb0xvZyh0ZS5tUHJvZ3JhbSlcbiAgICAgICAgICAgIEBtR0wuZGVsZXRlUHJvZ3JhbSB0ZS5tUHJvZ3JhbVxuICAgICAgICAgICAgdGUubUluZm8gPSBpbmZvTG9nXG4gICAgICAgICAgICB0ZS5tRXJyb3JUeXBlID0gMlxuICAgICAgICAgICAgdGUubVJlc3VsdCA9IGZhbHNlXG4gICAgICAgIHRlXG5cbiAgICBhdHRhY2hTaGFkZXI6IChzaGFkZXIpIC0+XG4gICAgICAgIEBtQmluZGVkU2hhZGVyID0gc2hhZGVyXG4gICAgICAgIEBtR0wudXNlUHJvZ3JhbSBzaGFkZXI/Lm1Qcm9ncmFtXG5cbiAgICBkZXRhY2hTaGFkZXI6IC0+IEBtR0wudXNlUHJvZ3JhbSBudWxsXG5cbiAgICBkZXN0cm95U2hhZGVyOiAocHJvZ3JhbSkgLT4gQG1HTC5kZWxldGVQcm9ncmFtIHByb2dyYW1cblxuICAgIGdldEF0dHJpYkxvY2F0aW9uOiAoc2hhZGVyLCBuYW1lKSAtPlxuICAgICAgICBAbUdMLmdldEF0dHJpYkxvY2F0aW9uIHNoYWRlci5tUHJvZ3JhbSwgbmFtZVxuXG4gICAgc2V0U2hhZGVyQ29uc3RhbnRMb2NhdGlvbjogKHNoYWRlciwgbmFtZSkgLT5cbiAgICAgICAgQG1HTC5nZXRVbmlmb3JtTG9jYXRpb24gc2hhZGVyLm1Qcm9ncmFtLCBuYW1lXG5cbiAgICBzZXRTaGFkZXJDb25zdGFudDFGX1BvczogKHBvcywgeCkgLT5cbiAgICAgICAgQG1HTC51bmlmb3JtMWYgcG9zLCB4XG4gICAgICAgIHRydWVcblxuICAgIHNldFNoYWRlckNvbnN0YW50MUZWX1BvczogKHBvcywgeCkgLT5cbiAgICAgICAgQG1HTC51bmlmb3JtMWZ2IHBvcywgeFxuICAgICAgICB0cnVlXG5cbiAgICBzZXRTaGFkZXJDb25zdGFudDFGOiAodW5hbWUsIHgpIC0+XG4gICAgICAgIHBvcyA9IEBtR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKEBtQmluZGVkU2hhZGVyLm1Qcm9ncmFtLCB1bmFtZSlcbiAgICAgICAgaWYgcG9zID09IG51bGxcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICBAbUdMLnVuaWZvcm0xZiBwb3MsIHhcbiAgICAgICAgdHJ1ZVxuXG4gICAgc2V0U2hhZGVyQ29uc3RhbnQxSTogKHVuYW1lLCB4KSAtPlxuICAgICAgICBwb3MgPSBAbUdMLmdldFVuaWZvcm1Mb2NhdGlvbihAbUJpbmRlZFNoYWRlci5tUHJvZ3JhbSwgdW5hbWUpXG4gICAgICAgIGlmIHBvcyA9PSBudWxsXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgQG1HTC51bmlmb3JtMWkgcG9zLCB4XG4gICAgICAgIHRydWVcblxuICAgIHNldFNoYWRlckNvbnN0YW50MkY6ICh1bmFtZSwgeCkgLT5cbiAgICAgICAgcG9zID0gQG1HTC5nZXRVbmlmb3JtTG9jYXRpb24oQG1CaW5kZWRTaGFkZXIubVByb2dyYW0sIHVuYW1lKVxuICAgICAgICBpZiBwb3MgPT0gbnVsbFxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIEBtR0wudW5pZm9ybTJmdiBwb3MsIHhcbiAgICAgICAgdHJ1ZVxuXG4gICAgc2V0U2hhZGVyQ29uc3RhbnQzRjogKHVuYW1lLCB4LCB5LCB6KSAtPlxuICAgICAgICBwb3MgPSBAbUdMLmdldFVuaWZvcm1Mb2NhdGlvbihAbUJpbmRlZFNoYWRlci5tUHJvZ3JhbSwgdW5hbWUpXG4gICAgICAgIGlmIHBvcyA9PSBudWxsXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgQG1HTC51bmlmb3JtM2YgcG9zLCB4LCB5LCB6XG4gICAgICAgIHRydWVcblxuICAgIHNldFNoYWRlckNvbnN0YW50MUZWOiAodW5hbWUsIHgpIC0+XG4gICAgICAgIHBvcyA9IEBtR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKEBtQmluZGVkU2hhZGVyLm1Qcm9ncmFtLCB1bmFtZSlcbiAgICAgICAgaWYgcG9zID09IG51bGxcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICBAbUdMLnVuaWZvcm0xZnYgcG9zLCBuZXcgRmxvYXQzMkFycmF5KHgpXG4gICAgICAgIHRydWVcblxuICAgIHNldFNoYWRlckNvbnN0YW50M0ZWOiAodW5hbWUsIHgpIC0+XG4gICAgICAgIHBvcyA9IEBtR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKEBtQmluZGVkU2hhZGVyLm1Qcm9ncmFtLCB1bmFtZSlcbiAgICAgICAgaWYgcG9zID09IG51bGxcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICBAbUdMLnVuaWZvcm0zZnYgcG9zLCBuZXcgRmxvYXQzMkFycmF5KHgpXG4gICAgICAgIHRydWVcblxuICAgIHNldFNoYWRlckNvbnN0YW50NEZWOiAodW5hbWUsIHgpIC0+XG4gICAgICAgIHBvcyA9IEBtR0wuZ2V0VW5pZm9ybUxvY2F0aW9uKEBtQmluZGVkU2hhZGVyLm1Qcm9ncmFtLCB1bmFtZSlcbiAgICAgICAgaWYgcG9zID09IG51bGxcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICBAbUdMLnVuaWZvcm00ZnYgcG9zLCBuZXcgRmxvYXQzMkFycmF5KHgpXG4gICAgICAgIHRydWVcblxuICAgIHNldFNoYWRlclRleHR1cmVVbml0OiAodW5hbWUsIHVuaXQpIC0+XG4gICAgICAgIHByb2dyYW0gPSBAbUJpbmRlZFNoYWRlclxuICAgICAgICBwb3MgPSBAbUdMLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLm1Qcm9ncmFtLCB1bmFtZSlcbiAgICAgICAgaWYgcG9zID09IG51bGxcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICBAbUdMLnVuaWZvcm0xaSBwb3MsIHVuaXRcbiAgICAgICAgdHJ1ZVxuXG4gICAgY3JlYXRlVmVydGV4QXJyYXk6IChkYXRhLCBtb2RlKSAtPlxuICAgICAgICBpZCA9IEBtR0wuY3JlYXRlQnVmZmVyKClcbiAgICAgICAgQG1HTC5iaW5kQnVmZmVyIEBtR0wuQVJSQVlfQlVGRkVSLCBpZFxuICAgICAgICBpZiBtb2RlID09IG1lLkJVRlRZUEUuU1RBVElDXG4gICAgICAgICAgICBAbUdMLmJ1ZmZlckRhdGEgQG1HTC5BUlJBWV9CVUZGRVIsIGRhdGEsIEBtR0wuU1RBVElDX0RSQVdcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQG1HTC5idWZmZXJEYXRhIEBtR0wuQVJSQVlfQlVGRkVSLCBkYXRhLCBAbUdMLkRZTkFNSUNfRFJBV1xuICAgICAgICByZXR1cm4gbU9iamVjdDppZFxuXG4gICAgY3JlYXRlSW5kZXhBcnJheTogKGRhdGEsIG1vZGUpIC0+XG4gICAgICAgIGlkID0gQG1HTC5jcmVhdGVCdWZmZXIoKVxuICAgICAgICBAbUdMLmJpbmRCdWZmZXIgQG1HTC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgaWRcbiAgICAgICAgaWYgbW9kZSA9PSBtZS5CVUZUWVBFLlNUQVRJQ1xuICAgICAgICAgICAgQG1HTC5idWZmZXJEYXRhIEBtR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGRhdGEsIEBtR0wuU1RBVElDX0RSQVdcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQG1HTC5idWZmZXJEYXRhIEBtR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGRhdGEsIEBtR0wuRFlOQU1JQ19EUkFXXG4gICAgICAgIHJldHVybiBtT2JqZWN0OmlkXG5cbiAgICBkZXN0cm95QXJyYXk6ICh0ZXgpIC0+IEBtR0wuZGVzdHJveUJ1ZmZlciB0ZXgubU9iamVjdFxuXG4gICAgYXR0YWNoVmVydGV4QXJyYXk6ICh0ZXgsIGF0dHJpYnMsIHBvcykgLT5cbiAgICAgICAgc2hhZGVyID0gQG1CaW5kZWRTaGFkZXJcbiAgICAgICAgQG1HTC5iaW5kQnVmZmVyIEBtR0wuQVJSQVlfQlVGRkVSLCB0ZXgubU9iamVjdFxuICAgICAgICBudW0gPSBhdHRyaWJzLm1DaGFubmVscy5sZW5ndGhcbiAgICAgICAgc3RyaWRlID0gYXR0cmlicy5tU3RyaWRlXG4gICAgICAgIG9mZnNldCA9IDBcbiAgICAgICAgaSA9IDBcbiAgICAgICAgd2hpbGUgaSA8IG51bVxuICAgICAgICAgICAgaWQgPSBwb3NbaV1cbiAgICAgICAgICAgIEBtR0wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkgaWRcbiAgICAgICAgICAgIGR0eXBlID0gQG1HTC5GTE9BVFxuICAgICAgICAgICAgZHNpemUgPSA0XG4gICAgICAgICAgICBpZiBhdHRyaWJzLm1DaGFubmVsc1tpXS5tVHlwZSA9PSBtZS5UWVBFLlVJTlQ4XG4gICAgICAgICAgICAgICAgZHR5cGUgPSBAbUdMLlVOU0lHTkVEX0JZVEVcbiAgICAgICAgICAgICAgICBkc2l6ZSA9IDFcbiAgICAgICAgICAgIGVsc2UgaWYgYXR0cmlicy5tQ2hhbm5lbHNbaV0ubVR5cGUgPT0gbWUuVFlQRS5VSU5UMTZcbiAgICAgICAgICAgICAgICBkdHlwZSA9IEBtR0wuVU5TSUdORURfU0hPUlRcbiAgICAgICAgICAgICAgICBkc2l6ZSA9IDJcbiAgICAgICAgICAgIGVsc2UgaWYgYXR0cmlicy5tQ2hhbm5lbHNbaV0ubVR5cGUgPT0gbWUuVFlQRS5GTE9BVDMyXG4gICAgICAgICAgICAgICAgZHR5cGUgPSBAbUdMLkZMT0FUXG4gICAgICAgICAgICAgICAgZHNpemUgPSA0XG4gICAgICAgICAgICBAbUdMLnZlcnRleEF0dHJpYlBvaW50ZXIgaWQsIGF0dHJpYnMubUNoYW5uZWxzW2ldLm1OdW1Db21wb25lbnRzLCBkdHlwZSwgYXR0cmlicy5tQ2hhbm5lbHNbaV0ubU5vcm1hbGl6ZSwgc3RyaWRlLCBvZmZzZXRcbiAgICAgICAgICAgIG9mZnNldCArPSBhdHRyaWJzLm1DaGFubmVsc1tpXS5tTnVtQ29tcG9uZW50cyAqIGRzaXplXG4gICAgICAgICAgICBpKytcblxuICAgIGF0dGFjaEluZGV4QXJyYXk6ICh0ZXgpIC0+XG4gICAgICAgIEBtR0wuYmluZEJ1ZmZlciBAbUdMLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCB0ZXgubU9iamVjdFxuXG4gICAgZGV0YWNoVmVydGV4QXJyYXk6ICh0ZXgsIGF0dHJpYnMpIC0+XG4gICAgICAgIG51bSA9IGF0dHJpYnMubUNoYW5uZWxzLmxlbmd0aFxuICAgICAgICBpID0gMFxuICAgICAgICB3aGlsZSBpIDwgbnVtXG4gICAgICAgICAgICBAbUdMLmRpc2FibGVWZXJ0ZXhBdHRyaWJBcnJheSBpXG4gICAgICAgICAgICBpKytcbiAgICAgICAgQG1HTC5iaW5kQnVmZmVyIEBtR0wuQVJSQVlfQlVGRkVSLCBudWxsXG5cbiAgICBkZXRhY2hJbmRleEFycmF5OiAodGV4KSAtPlxuICAgICAgICBAbUdMLmJpbmRCdWZmZXIgQG1HTC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbnVsbFxuXG4gICAgZHJhd1ByaW1pdGl2ZTogKHR5cGVPZlByaW1pdGl2ZSwgbnVtLCB1c2VJbmRleEFycmF5LCBudW1JbnN0YW5jZXMpIC0+XG4gICAgICAgIGdsVHlwZSA9IEBtR0wuUE9JTlRTXG4gICAgICAgIGlmIHR5cGVPZlByaW1pdGl2ZSA9PSBtZS5QUklNVFlQRS5QT0lOVFNcbiAgICAgICAgICAgIGdsVHlwZSA9IEBtR0wuUE9JTlRTXG4gICAgICAgIGlmIHR5cGVPZlByaW1pdGl2ZSA9PSBtZS5QUklNVFlQRS5MSU5FU1xuICAgICAgICAgICAgZ2xUeXBlID0gQG1HTC5MSU5FU1xuICAgICAgICBpZiB0eXBlT2ZQcmltaXRpdmUgPT0gbWUuUFJJTVRZUEUuTElORV9MT09QXG4gICAgICAgICAgICBnbFR5cGUgPSBAbUdMLkxJTkVfTE9PUFxuICAgICAgICBpZiB0eXBlT2ZQcmltaXRpdmUgPT0gbWUuUFJJTVRZUEUuTElORV9TVFJJUFxuICAgICAgICAgICAgZ2xUeXBlID0gQG1HTC5MSU5FX1NUUklQXG4gICAgICAgIGlmIHR5cGVPZlByaW1pdGl2ZSA9PSBtZS5QUklNVFlQRS5UUklBTkdMRVNcbiAgICAgICAgICAgIGdsVHlwZSA9IEBtR0wuVFJJQU5HTEVTXG4gICAgICAgIGlmIHR5cGVPZlByaW1pdGl2ZSA9PSBtZS5QUklNVFlQRS5UUklBTkdMRV9TVFJJUFxuICAgICAgICAgICAgZ2xUeXBlID0gQG1HTC5UUklBTkdMRV9TVFJJUFxuICAgICAgICBpZiBudW1JbnN0YW5jZXMgPD0gMVxuICAgICAgICAgICAgaWYgdXNlSW5kZXhBcnJheVxuICAgICAgICAgICAgICAgIEBtR0wuZHJhd0VsZW1lbnRzIGdsVHlwZSwgbnVtLCBAbUdMLlVOU0lHTkVEX1NIT1JULCAwXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQG1HTC5kcmF3QXJyYXlzIGdsVHlwZSwgMCwgbnVtXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBtR0wuZHJhd0FycmF5c0luc3RhbmNlZCBnbFR5cGUsIDAsIG51bSwgbnVtSW5zdGFuY2VzXG4gICAgICAgICAgICBAbUdMLmRyYXdFbGVtZW50c0luc3RhbmNlZCBnbFR5cGUsIG51bSwgQG1HTC5VTlNJR05FRF9TSE9SVCwgMCwgbnVtSW5zdGFuY2VzXG5cbiAgICBkcmF3RnVsbFNjcmVlblRyaWFuZ2xlX1hZOiAodnBvcykgLT5cbiAgICAgICAgQG1HTC5iaW5kQnVmZmVyIEBtR0wuQVJSQVlfQlVGRkVSLCBAbVZCT19UcmlcbiAgICAgICAgQG1HTC52ZXJ0ZXhBdHRyaWJQb2ludGVyIHZwb3MsIDIsIEBtR0wuRkxPQVQsIGZhbHNlLCAwLCAwXG4gICAgICAgIEBtR0wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkgdnBvc1xuICAgICAgICBAbUdMLmRyYXdBcnJheXMgQG1HTC5UUklBTkdMRVMsIDAsIDNcbiAgICAgICAgQG1HTC5kaXNhYmxlVmVydGV4QXR0cmliQXJyYXkgdnBvc1xuICAgICAgICBAbUdMLmJpbmRCdWZmZXIgQG1HTC5BUlJBWV9CVUZGRVIsIG51bGxcblxuICAgIGRyYXdVbml0UXVhZF9YWTogKHZwb3MpIC0+XG4gICAgICAgIEBtR0wuYmluZEJ1ZmZlciBAbUdMLkFSUkFZX0JVRkZFUiwgQG1WQk9fUXVhZFxuICAgICAgICBAbUdMLnZlcnRleEF0dHJpYlBvaW50ZXIgdnBvcywgMiwgQG1HTC5GTE9BVCwgZmFsc2UsIDAsIDBcbiAgICAgICAgQG1HTC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSB2cG9zXG4gICAgICAgIEBtR0wuZHJhd0FycmF5cyBAbUdMLlRSSUFOR0xFUywgMCwgNlxuICAgICAgICBAbUdMLmRpc2FibGVWZXJ0ZXhBdHRyaWJBcnJheSB2cG9zXG4gICAgICAgIEBtR0wuYmluZEJ1ZmZlciBAbUdMLkFSUkFZX0JVRkZFUiwgbnVsbFxuXG4gICAgc2V0QmxlbmQ6IChlbmFibGVkKSAtPlxuICAgICAgICBpZiBlbmFibGVkXG4gICAgICAgICAgICBAbUdMLmVuYWJsZSBAbUdMLkJMRU5EXG4gICAgICAgICAgICBAbUdMLmJsZW5kRXF1YXRpb25TZXBhcmF0ZSBAbUdMLkZVTkNfQURELCBAbUdMLkZVTkNfQUREXG4gICAgICAgICAgICBAbUdMLmJsZW5kRnVuY1NlcGFyYXRlIEBtR0wuU1JDX0FMUEhBLCBAbUdMLk9ORV9NSU5VU19TUkNfQUxQSEEsIEBtR0wuT05FLCBAbUdMLk9ORV9NSU5VU19TUkNfQUxQSEFcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQG1HTC5kaXNhYmxlIEBtR0wuQkxFTkRcblxuICAgIGdldFBpeGVsRGF0YTogKGRhdGEsIG9mZnNldCwgeHJlcywgeXJlcykgLT5cbiAgICAgICAgQG1HTC5yZWFkUGl4ZWxzIDAsIDAsIHhyZXMsIHlyZXMsIEBtR0wuUkdCQSwgQG1HTC5VTlNJR05FRF9CWVRFLCBkYXRhLCBvZmZzZXRcblxuICAgIGdldFBpeGVsRGF0YVJlbmRlclRhcmdldDogKG9iaiwgZGF0YSwgeHJlcywgeXJlcykgLT5cbiAgICAgICAgQG1HTC5iaW5kRnJhbWVidWZmZXIgQG1HTC5GUkFNRUJVRkZFUiwgb2JqLm1PYmplY3RJRFxuICAgICAgICBAbUdMLnJlYWRCdWZmZXIgQG1HTC5DT0xPUl9BVFRBQ0hNRU5UMFxuICAgICAgICBAbUdMLnJlYWRQaXhlbHMgMCwgMCwgeHJlcywgeXJlcywgQG1HTC5SR0JBLCBAbUdMLkZMT0FULCBkYXRhLCAwXG4gICAgICAgIEBtR0wuYmluZEZyYW1lYnVmZmVyIEBtR0wuRlJBTUVCVUZGRVIsIG51bGxcblxuICAgIEBjcmVhdGVHbENvbnRleHQ6IChjdikgLT5cbiAgICAgICAgY3YuZ2V0Q29udGV4dCAnd2ViZ2wyJywgXG4gICAgICAgICAgICBhbHBoYTogZmFsc2VcbiAgICAgICAgICAgIGRlcHRoOiBmYWxzZVxuICAgICAgICAgICAgc3RlbmNpbDogZmFsc2VcbiAgICAgICAgICAgIHByZW11bHRpcGxpZWRBbHBoYTogZmFsc2VcbiAgICAgICAgICAgIGFudGlhbGlhczogZmFsc2VcbiAgICAgICAgICAgIHByZXNlcnZlRHJhd2luZ0J1ZmZlcjogZmFsc2VcbiAgICAgICAgICAgIHBvd2VyUHJlZmVyZW5jZTogJ2hpZ2gtcGVyZm9ybWFuY2UnIFxuICAgICAgICAgICAgIyBcImxvd19wb3dlclwiLCBcImhpZ2hfcGVyZm9ybWFuY2VcIiwgXCJkZWZhdWx0XCJcbiAgICAgICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJlciJdfQ==
//# sourceURL=../coffee/renderer.coffee