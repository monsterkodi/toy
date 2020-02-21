// koffee 1.6.0

/*
00000000    0000000    0000000   0000000  
000   000  000   000  000       000       
00000000   000000000  0000000   0000000   
000        000   000       000       000  
000        000   000  0000000   0000000
 */
var Pass, Renderer, filter;

filter = require('kxk').filter;

Renderer = require('./renderer');

Pass = (function() {
    function Pass(mRenderer, mID, mEffect) {
        this.mRenderer = mRenderer;
        this.mID = mID;
        this.mEffect = mEffect;
        this.mInputs = [null, null, null, null];
        this.mOutput = null;
        this.mSource = null;
        this.mType = 'image';
        this.mName = 'none';
        this.mCompile = 0;
        this.mFrame = 0;
    }

    Pass.prototype.commonHeader = function() {
        var h, i, j, ref, ref1;
        h = "#define HW_PERFORMANCE 1\nuniform vec3  iResolution;\nuniform float iTime;\nuniform float iChannelTime[4];\nuniform vec4  iMouse;\nuniform vec4  iDate;\nuniform float iSampleRate;\nuniform vec3  iChannelResolution[4];\nuniform int   iFrame;\nuniform float iTimeDelta;\nuniform float iFrameRate;";
        for (i = j = 0, ref = this.mInputs.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
            h += "uniform sampler" + (((ref1 = this.mInputs[i]) != null ? ref1.mInfo.mType : void 0) === 'cubemap' && 'Cube' || '2D') + " iChannel" + i + ";\n";
        }
        return h;
    };

    Pass.prototype.makeHeaderImage = function() {
        this.header = this.commonHeader();
        this.header += "struct Channel\n{\n    vec3  resolution;\n    float time;\n};\nuniform Channel iChannel[4];\n\nvoid mainImage(out vec4 c, in vec2 f);";
        return this.footer = "out vec4 outColor;\nvoid main( void )\n{\n    vec4 color = vec4(0.0,0.0,0.0,1.0);\n    mainImage(color, gl_FragCoord.xy);\n    color.w = 1.0;\n    outColor = color;\n}";
    };

    Pass.prototype.makeHeaderBuffer = function() {
        this.header = this.commonHeader();
        this.header += 'void mainImage(out vec4 c, in vec2 f);\n';
        return this.footer = "out vec4 outColor;\nvoid main( void )\n{\n    vec4 color = vec4(0.0,0.0,0.0,1.0);\n    mainImage( color, gl_FragCoord.xy );\n    outColor = color;\n}";
    };

    Pass.prototype.makeHeaderCubemap = function() {
        this.header = this.commonHeader();
        this.header += 'void mainCubemap( out vec4 c, in vec2 f, in vec3 ro, in vec3 rd );\n';
        return this.footer = "uniform vec4 unViewport;\nuniform vec3 unCorners[5];\nout vec4 outColor;\nvoid main(void)\n{\n    vec4 color = vec4(0.0,0.0,0.0,1.0);\n    vec3 ro = unCorners[4];\n    vec2 uv = (gl_FragCoord.xy - unViewport.xy)/unViewport.zw;\n    vec3 rd = normalize( mix( mix( unCorners[0], unCorners[1], uv.x ), mix( unCorners[3], unCorners[2], uv.x ), uv.y ) - ro);\n    mainCubemap(color, gl_FragCoord.xy-unViewport.xy, ro, rd);\n    outColor = color; \n}";
    };

    Pass.prototype.makeHeaderCommon = function() {
        this.header = "uniform vec4      iDate;\nuniform float     iSampleRate;";
        return this.footer = "out vec4 outColor;\nvoid main(void)\n{\n    outColor = vec4(0.0);\n}";
    };

    Pass.prototype.makeHeader = function() {
        switch (this.mType) {
            case 'image':
                return this.makeHeaderImage();
            case 'buffer':
                return this.makeHeaderBuffer();
            case 'common':
                return this.makeHeaderCommon();
            case 'cubemap':
                return this.makeHeaderCubemap();
        }
    };

    Pass.prototype.create = function(mType, mName) {
        var ref;
        this.mType = mType;
        this.mName = mName;
        this.mSource = null;
        this.makeHeader();
        if ((ref = this.mType) === 'image' || ref === 'buffer' || ref === 'cubemap') {
            return this.mProgram = null;
        }
    };

    Pass.prototype.destroy = function() {
        return this.mSource = null;
    };

    Pass.prototype.newShader = function(shaderCode, commonSourceCodes) {
        var err, timeStart;
        if (!this.mRenderer) {
            return;
        }
        timeStart = performance.now();
        switch (this.mType) {
            case 'image':
            case 'buffer':
                err = this.newShaderImage(shaderCode, commonSourceCodes);
                break;
            case 'common':
                err = this.newShaderCommon(shaderCode);
                break;
            case 'cubemap':
                err = this.newShaderCubemap(shaderCode, commonSourceCodes);
                break;
            case 'keyboard':
                err = null;
                break;
            default:
                err = "unknown type " + this.mType;
                console.error(err);
        }
        if (!err) {
            this.mCompile = performance.now() - timeStart;
        }
        this.mSource = shaderCode;
        return err;
    };

    Pass.prototype.newShaderImage = function(shaderCode, commonShaderCodes) {
        var fr, i, j, ref, res, vs;
        vs = 'layout(location = 0) in vec2 pos; void main() { gl_Position = vec4(pos.xy,0.0,1.0); }';
        fr = this.header;
        for (i = j = 0, ref = commonShaderCodes.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
            fr += '\n' + commonShaderCodes[i];
        }
        fr += '\n' + shaderCode;
        fr += '\n' + this.footer;
        res = this.mRenderer.createShader(vs, fr);
        if (res.mResult === false) {
            return res.mInfo;
        }
        if (this.mProgram !== null) {
            this.mRenderer.destroyShader(this.mProgram);
        }
        this.mProgram = res;
        return null;
    };

    Pass.prototype.newShaderCubemap = function(shaderCode, commonShaderCodes) {
        var fr, i, res, vs;
        vs = 'layout(location = 0) in vec2 pos; void main() { gl_Position = vec4(pos.xy,0.0,1.0); }';
        fr = this.header;
        i = 0;
        while (i < commonShaderCodes.length) {
            fr += commonShaderCodes[i] + '\n';
            i++;
        }
        fr += shaderCode;
        fr += this.footer;
        res = this.mRenderer.createShader(vs, fr);
        if (res.mResult === false) {
            return res.mInfo;
        }
        if (this.mProgram !== null) {
            this.mRenderer.destroyShader(this.mProgram);
        }
        this.mProgram = res;
        return null;
    };

    Pass.prototype.newShaderCommon = function(shaderCode) {
        var fr, res, vs;
        vs = 'layout(location = 0) in vec2 pos; void main() { gl_Position = vec4(pos.xy,0.0,1.0); }';
        fr = this.header + shaderCode + this.footer;
        res = this.mRenderer.createShader(vs, fr);
        if (res.mResult === false) {
            return res.mInfo;
        }
        if (this.mProgram !== null) {
            this.mRenderer.destroyShader(this.mProgram);
        }
        this.mProgram = res;
        return null;
    };

    Pass.prototype.destroyInput = function(id) {
        var ref;
        if (this.mInputs[id]) {
            if ((ref = this.mInputs[id].mInfo.mType) === 'texture' || ref === 'cubemap') {
                this.mRenderer.destroyTexture(this.mInputs[id].globject);
            }
            return this.mInputs[id] = null;
        }
    };

    Pass.prototype.sampler2Renderer = function(sampler) {
        filter = Renderer.FILTER.NONE;
        if ((sampler != null ? sampler.filter : void 0) === 'linear') {
            filter = Renderer.FILTER.LINEAR;
        }
        if ((sampler != null ? sampler.filter : void 0) === 'mipmap') {
            filter = Renderer.FILTER.MIPMAP;
        }
        return {
            mFilter: filter,
            mWrap: (sampler != null ? sampler.wrap : void 0) !== 'clamp' && Renderer.TEXWRP.REPEAT || Renderer.TEXWRP.CLAMP
        };
    };

    Pass.prototype.setSamplerFilter = function(id, str, buffers, cubeBuffers) {
        var inp;
        filter = (function() {
            switch (str) {
                case 'linear':
                    return Renderer.FILTER.LINEAR;
                case 'mipmap':
                    return Renderer.FILTER.MIPMAP;
                default:
                    return Renderer.FILTER.NONE;
            }
        })();
        inp = this.mInputs[id];
        if ((inp != null ? inp.mInfo.mType : void 0) === 'texture') {
            if (inp.loaded) {
                return this.mRenderer.setSamplerFilter(inp.globject, filter, true);
            }
        } else if ((inp != null ? inp.mInfo.mType : void 0) === 'cubemap') {
            if (inp.loaded) {
                if (this.mEffect.assetID_to_cubemapBuferID(inp.mInfo.mID) === 0) {
                    this.mRenderer.setSamplerFilter(cubeBuffers[id].mTexture[0], filter, true);
                    return this.mRenderer.setSamplerFilter(cubeBuffers[id].mTexture[1], filter, true);
                } else {
                    return this.mRenderer.setSamplerFilter(inp.globject, filter, true);
                }
            }
        } else if ((inp != null ? inp.mInfo.mType : void 0) === 'buffer') {
            this.mRenderer.setSamplerFilter(buffers[inp.id].mTexture[0], filter, true);
            return this.mRenderer.setSamplerFilter(buffers[inp.id].mTexture[1], filter, true);
        }
    };

    Pass.prototype.setSamplerWrap = function(id, str, buffers) {
        var inp, restr;
        inp = this.mInputs[id];
        restr = Renderer.TEXWRP.REPEAT;
        if (str === 'clamp') {
            restr = Renderer.TEXWRP.CLAMP;
        }
        if ((inp != null ? inp.mInfo.mType : void 0) === 'texture') {
            if (inp.loaded) {
                return this.mRenderer.setSamplerWrap(inp.globject, restr);
            }
        } else if ((inp != null ? inp.mInfo.mType : void 0) === 'cubemap') {
            if (inp.loaded) {
                return this.mRenderer.setSamplerWrap(inp.globject, restr);
            }
        } else if ((inp != null ? inp.mInfo.mType : void 0) === 'buffer') {
            this.mRenderer.setSamplerWrap(buffers[inp.id].mTexture[0], restr);
            return this.mRenderer.setSamplerWrap(buffers[inp.id].mTexture[1], restr);
        }
    };

    Pass.prototype.setSamplerVFlip = function(id, flip) {
        var inp, ref;
        inp = this.mInputs[id];
        if ((inp != null ? inp.loaded : void 0) && ((ref = inp != null ? inp.mInfo.mType : void 0) === 'texture' || ref === 'cubemap')) {
            return this.mRenderer.setSamplerVFlip(inp.globject, flip, inp.image);
        }
    };

    Pass.prototype.getTexture = function(slot) {
        var ref;
        return (ref = this.mInputs[slot]) != null ? ref.mInfo : void 0;
    };

    Pass.prototype.newTexture = function(slot, url, buffers, cubeBuffers, keyboard) {
        var i, n, numLoaded, returnValue, rti, texture;
        texture = null;
        if (!(url != null ? url.mType : void 0)) {
            this.destroyInput(slot);
            this.mInputs[slot] = null;
            this.makeHeader();
            return {
                mFailed: false,
                mNeedsShaderCompile: false
            };
        } else if (url.mType === 'texture') {
            texture = {};
            texture.mInfo = url;
            texture.globject = null;
            texture.loaded = false;
            texture.image = new Image;
            texture.image.crossOrigin = '';
            texture.image.onload = (function(_this) {
                return function() {
                    var rti;
                    rti = _this.sampler2Renderer(url.mSampler);
                    texture.globject = _this.mRenderer.createTextureFromImage(Renderer.TEXTYPE.T2D, texture.image, Renderer.TEXFMT.C4I8, rti.mFilter, rti.mWrap);
                    texture.loaded = true;
                    _this.setSamplerVFlip(slot, true);
                };
            })(this);
            texture.image.src = url.mSrc;
            returnValue = {
                mFailed: false,
                mNeedsShaderCompile: this.mInputs[slot] === null || this.mInputs[slot].mInfo.mType !== 'texture' && this.mInputs[slot].mInfo.mType !== 'keyboard'
            };
            this.destroyInput(slot);
            this.mInputs[slot] = texture;
            this.makeHeader();
            return returnValue;
        } else if (url.mType === 'cubemap') {
            texture = {};
            texture.mInfo = url;
            texture.globject = null;
            texture.loaded = false;
            rti = this.sampler2Renderer(url.mSampler);
            if (this.mEffect.assetID_to_cubemapBuferID(url.mID) !== -1) {
                texture.mImage = new Image;
                texture.mImage.onload = function() {
                    texture.loaded = true;
                };
                this.mEffect.resizeCubemapBuffer(0, 1024, 1024);
            } else {
                texture.image = [new Image, new Image, new Image, new Image, new Image, new Image];
                numLoaded = 0;
                i = 0;
                while (i < 6) {
                    texture.image[i].mId = i;
                    texture.image[i].crossOrigin = '';
                    texture.image[i].onload = (function(_this) {
                        return function() {
                            var id;
                            id = _this.mId;
                            numLoaded++;
                            if (numLoaded === 6) {
                                texture.globject = _this.mRenderer.createTextureFromImage(Renderer.TEXTYPE.CUBEMAP, texture.image, Renderer.TEXFMT.C4I8, rti.mFilter, rti.mWrap);
                                texture.loaded = true;
                            }
                        };
                    })(this);
                    if (i === 0) {
                        texture.image[i].src = url.mSrc;
                    } else {
                        n = url.mSrc.lastIndexOf('.');
                        texture.image[i].src = url.mSrc.substring(0, n) + '_' + i + url.mSrc.substring(n, url.mSrc.length);
                    }
                    i++;
                }
            }
            returnValue = {
                mFailed: false,
                mNeedsShaderCompile: this.mInputs[slot] === null || this.mInputs[slot].mInfo.mType !== 'cubemap'
            };
            this.destroyInput(slot);
            this.mInputs[slot] = texture;
            this.makeHeader();
            return returnValue;
        } else if (url.mType === 'keyboard') {
            texture = {};
            texture.mInfo = url;
            texture.globject = null;
            texture.loaded = true;
            texture.keyboard = {};
            returnValue = {
                mFailed: false,
                mNeedsShaderCompile: this.mInputs[slot] === null || this.mInputs[slot].mInfo.mType !== 'texture' && this.mInputs[slot].mInfo.mType !== 'keyboard'
            };
            this.destroyInput(slot);
            this.mInputs[slot] = texture;
            this.makeHeader();
            return returnValue;
        } else if (url.mType === 'buffer') {
            texture = {};
            texture.mInfo = url;
            texture.image = new Image;
            texture.image.src = url.mSrc;
            texture.id = this.mEffect.assetID_to_bufferID(url.mID);
            texture.loaded = true;
            returnValue = {
                mFailed: false,
                mNeedsShaderCompile: this.mInputs[slot] === null || this.mInputs[slot].mInfo.mType !== 'texture' && this.mInputs[slot].mInfo.mType !== 'keyboard'
            };
            this.destroyInput(slot);
            this.mInputs[slot] = texture;
            this.mEffect.resizeBuffer(texture.id, this.mEffect.mXres, this.mEffect.mYres, false);
            this.makeHeader();
            return returnValue;
        }
        console.error("input type error: " + url.mType);
        return {
            mFailed: true
        };
    };

    Pass.prototype.paintImage = function(da, time, dtime, fps, xres, yres, buffers, cubeBuffers, keyboard) {
        var dates, i, id, inp, l1, prog, ref, ref1, ref2, ref3, resos, texID, times;
        times = [0, 0, 0, 0];
        dates = [da.getFullYear(), da.getMonth(), da.getDate(), da.getHours() * 60.0 * 60 + da.getMinutes() * 60 + da.getSeconds() + da.getMilliseconds() / 1000.0];
        resos = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        texID = [null, null, null, null];
        i = 0;
        while (i < this.mInputs.length) {
            inp = this.mInputs[i];
            if (inp === null) {

            } else if (inp.mInfo.mType === 'texture') {
                if (inp.loaded === true) {
                    texID[i] = inp.globject;
                    resos[3 * i + 0] = inp.image.width;
                    resos[3 * i + 1] = inp.image.height;
                    resos[3 * i + 2] = 1;
                }
            } else if (inp.mInfo.mType === 'keyboard') {
                texID[i] = keyboard.mTexture;
            } else if (inp.mInfo.mType === 'cubemap') {
                if (inp.loaded === true) {
                    id = this.mEffect.assetID_to_cubemapBuferID(inp.mInfo.mID);
                    if (id !== -1) {
                        texID[i] = cubeBuffers[id].mTexture[cubeBuffers[id].mLastRenderDone];
                        resos[3 * i + 0] = cubeBuffers[id].mResolution[0];
                        resos[3 * i + 1] = cubeBuffers[id].mResolution[1];
                        resos[3 * i + 2] = 1;
                        this.mRenderer.setSamplerFilter(texID[i], (ref = (ref1 = inp.mInfo.mSampler) != null ? ref1.filter : void 0) != null ? ref : Renderer.FILTER.MIPMAP, false);
                    } else {
                        texID[i] = inp.globject;
                    }
                }
            } else if (inp.mInfo.mType === 'buffer') {
                if (inp.loaded === true) {
                    id = inp.id;
                    texID[i] = buffers[id].mTexture[buffers[id].mLastRenderDone];
                    resos[3 * i + 0] = xres;
                    resos[3 * i + 1] = yres;
                    resos[3 * i + 2] = 1;
                    this.mRenderer.setSamplerFilter(texID[i], (ref2 = (ref3 = inp.mInfo.mSampler) != null ? ref3.filter : void 0) != null ? ref2 : Renderer.FILTER.LINEAR, false);
                }
            }
            i++;
        }
        this.mRenderer.attachTextures(4, texID[0], texID[1], texID[2], texID[3]);
        prog = this.mProgram;
        this.mRenderer.attachShader(prog);
        this.mRenderer.setShaderConstant1F('iTime', time);
        this.mRenderer.setShaderConstant3F('iResolution', xres, yres, 1.0);
        this.mRenderer.setShaderConstant4FV('iMouse', this.mRenderer.iMouse);
        this.mRenderer.setShaderConstant4FV('iDate', dates);
        this.mRenderer.setShaderConstant1F('iSampleRate', this.mSampleRate);
        this.mRenderer.setShaderTextureUnit('iChannel0', 0);
        this.mRenderer.setShaderTextureUnit('iChannel1', 1);
        this.mRenderer.setShaderTextureUnit('iChannel2', 2);
        this.mRenderer.setShaderTextureUnit('iChannel3', 3);
        this.mRenderer.setShaderConstant1I('iFrame', this.mFrame);
        this.mRenderer.setShaderConstant1F('iTimeDelta', dtime);
        this.mRenderer.setShaderConstant1F('iFrameRate', fps);
        this.mRenderer.setShaderConstant1FV('iChannelTime', times);
        this.mRenderer.setShaderConstant3FV('iChannelResolution', resos);
        l1 = this.mRenderer.getAttribLocation(this.mProgram, 'pos');
        this.mRenderer.setViewport([0, 0, xres, yres]);
        this.mRenderer.drawFullScreenTriangle_XY(l1);
        this.mRenderer.dettachTextures();
    };

    Pass.prototype.setUniforms = function(da, time, dtime, fps, xres, yres, buffers, cubeBuffers, keyboard) {
        var dates, i, id, inp, j, ref, resos, texID, times;
        times = [0, 0, 0, 0];
        dates = [da.getFullYear(), da.getMonth(), da.getDate(), da.getHours() * 60 * 60 + da.getMinutes() * 60 + da.getSeconds() + da.getMilliseconds() / 1000];
        resos = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        texID = [null, null, null, null];
        for (i = j = 0, ref = this.mInputs.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
            inp = this.mInputs[i];
            if ((inp != null ? inp.mInfo.mType : void 0) === 'texture') {
                if (inp.loaded === true) {
                    texID[i] = inp.globject;
                    resos[3 * i + 0] = inp.image.width;
                    resos[3 * i + 1] = inp.image.height;
                    resos[3 * i + 2] = 1;
                }
            } else if ((inp != null ? inp.mInfo.mType : void 0) === 'keyboard') {
                texID[i] = keyboard.mTexture;
            } else if ((inp != null ? inp.mInfo.mType : void 0) === 'cubemap') {
                if (inp.loaded === true) {
                    id = this.mEffect.assetID_to_cubemapBuferID(inp.mInfo.mID);
                    if (id !== -1) {
                        texID[i] = cubeBuffers[id].mTexture[cubeBuffers[id].mLastRenderDone];
                        resos[3 * i + 0] = cubeBuffers[id].mResolution[0];
                        resos[3 * i + 1] = cubeBuffers[id].mResolution[1];
                        resos[3 * i + 2] = 1;
                        filter = Renderer.FILTER.NONE;
                        if (inp.mInfo.mSampler.filter === 'linear') {
                            filter = Renderer.FILTER.LINEAR;
                        } else if (inp.mInfo.mSampler.filter === 'mipmap') {
                            filter = Renderer.FILTER.MIPMAP;
                        }
                        this.mRenderer.setSamplerFilter(texID[i], filter, false);
                    } else {
                        texID[i] = inp.globject;
                    }
                }
            } else if ((inp != null ? inp.mInfo.mType : void 0) === 'buffer') {
                if (inp.loaded === true) {
                    texID[i] = buffers[inp.id].mTexture[buffers[inp.id].mLastRenderDone];
                    resos[3 * i + 0] = xres;
                    resos[3 * i + 1] = yres;
                    resos[3 * i + 2] = 1;
                }
            }
        }
        this.mRenderer.attachTextures(4, texID[0], texID[1], texID[2], texID[3]);
        this.mRenderer.attachShader(this.mProgram);
        this.mRenderer.setShaderConstant1F('iTime', time);
        this.mRenderer.setShaderConstant3F('iResolution', xres, yres, 1.0);
        this.mRenderer.setShaderConstant4FV('iMouse', this.mRenderer.iMouse);
        this.mRenderer.setShaderConstant4FV('iDate', dates);
        this.mRenderer.setShaderConstant1F('iSampleRate', this.mSampleRate);
        this.mRenderer.setShaderTextureUnit('iChannel0', 0);
        this.mRenderer.setShaderTextureUnit('iChannel1', 1);
        this.mRenderer.setShaderTextureUnit('iChannel2', 2);
        this.mRenderer.setShaderTextureUnit('iChannel3', 3);
        this.mRenderer.setShaderConstant1I('iFrame', this.mFrame);
        this.mRenderer.setShaderConstant1F('iTimeDelta', dtime);
        this.mRenderer.setShaderConstant1F('iFrameRate', fps);
        this.mRenderer.setShaderConstant1FV('iChannelTime', times);
        return this.mRenderer.setShaderConstant3FV('iChannelResolution', resos);
    };

    Pass.prototype.processInputs = function(time, dtime, fps, xres, yres, buffers, cubeBuffers, keyboard) {
        var i, id, inp, texID;
        i = 0;
        while (i < this.mInputs.length) {
            inp = this.mInputs[i];
            if (inp === null) {

            } else {

            }
            if (inp.mInfo.mType === 'buffer') {
                if (inp.loaded === true) {
                    id = inp.id;
                    texID = buffers[id].mTexture[buffers[id].mLastRenderDone];
                    filter = Renderer.FILTER.NONE;
                    if (inp.mInfo.mSampler.filter === 'linear') {
                        filter = Renderer.FILTER.LINEAR;
                    } else if (inp.mInfo.mSampler.filter === 'mipmap') {
                        filter = Renderer.FILTER.MIPMAP;
                    }
                    this.mRenderer.setSamplerFilter(texID, filter, false);
                }
            }
            i++;
        }
    };

    Pass.prototype.paintCubemap = function(da, time, dtime, fps, xres, yres, buffers, cubeBuffers, keyboard, face) {
        var C, l1, vp;
        this.processInputs(da, time, dtime, fps, xres, yres, buffers, cubeBuffers, keyboard, face);
        this.setUniforms(da, time, dtime, fps, xres, yres, buffers, cubeBuffers, keyboard);
        l1 = this.mRenderer.getAttribLocation(this.mProgram, 'pos');
        vp = [0, 0, xres, yres];
        this.mRenderer.setViewport(vp);
        C = (function() {
            switch (face) {
                case 0:
                    return [1, 1, 1, 1, 1, -1, 1, -1, -1, 1, -1, 1, 0, 0, 0];
                case 1:
                    return [-1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 0, 0, 0];
                case 2:
                    return [-1, 1, -1, 1, 1, -1, 1, 1, 1, -1, 1, 1, 0, 0, 0];
                case 3:
                    return [-1, -1, 1, 1, -1, 1, 1, -1, -1, -1, -1, -1, 0, 0, 0];
                case 4:
                    return [-1, 1, 1, 1, 1, 1, 1, -1, 1, -1, -1, 1, 0, 0, 0];
                default:
                    return [1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 0, 0, 0];
            }
        })();
        this.mRenderer.setShaderConstant3FV('unCorners', C);
        this.mRenderer.setShaderConstant4FV('unViewport', vp);
        this.mRenderer.drawUnitQuad_XY(l1);
        return this.mRenderer.dettachTextures();
    };

    Pass.prototype.paint = function(da, time, dtime, fps, xres, yres, isPaused, bufferID, bufferNeedsMimaps, buffers, cubeBuffers, keyboard, effect) {
        var buffer, dstID, face;
        if (this.mType === 'image') {
            this.mRenderer.setRenderTarget(null);
            this.paintImage(da, time, dtime, fps, xres, yres, buffers, cubeBuffers, keyboard);
            this.mFrame++;
        } else if (this.mType === 'common') {

        } else if (this.mType === 'buffer') {
            this.mEffect.resizeBuffer(bufferID, this.mEffect.mXres, this.mEffect.mYres, false);
            buffer = buffers[bufferID];
            dstID = 1 - buffer.mLastRenderDone;
            this.mRenderer.setRenderTarget(buffer.mTarget[dstID]);
            this.paintImage(da, time, dtime, fps, xres, yres, buffers, cubeBuffers, keyboard);
            if (bufferNeedsMimaps) {
                this.mRenderer.createMipmaps(buffer.mTexture[dstID]);
            }
            buffers[bufferID].mLastRenderDone = 1 - buffers[bufferID].mLastRenderDone;
            this.mFrame++;
        } else if (this.mType === 'cubemap') {
            this.mEffect.resizeCubemapBuffer(bufferID, 1024, 1024, false);
            buffer = cubeBuffers[bufferID];
            xres = buffer.mResolution[0];
            yres = buffer.mResolution[1];
            dstID = 1 - buffer.mLastRenderDone;
            face = 0;
            while (face < 6) {
                this.mRenderer.setRenderTargetCubeMap(buffer.mTarget[dstID], face);
                this.paintCubemap(da, time, dtime, fps, xres, yres, buffers, cubeBuffers, keyboard, face);
                face++;
            }
            this.mRenderer.setRenderTargetCubeMap(null, 0);
            if (bufferNeedsMimaps) {
                this.mRenderer.createMipmaps(buffer.mTexture[dstID]);
            }
            cubeBuffers[bufferID].mLastRenderDone = 1 - cubeBuffers[bufferID].mLastRenderDone;
            this.mFrame++;
        }
    };

    return Pass;

})();

module.exports = Pass;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFzcy5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUUsU0FBVyxPQUFBLENBQVEsS0FBUjs7QUFDYixRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBRUw7SUFFQyxjQUFDLFNBQUQsRUFBYSxHQUFiLEVBQW1CLE9BQW5CO1FBQUMsSUFBQyxDQUFBLFlBQUQ7UUFBWSxJQUFDLENBQUEsTUFBRDtRQUFNLElBQUMsQ0FBQSxVQUFEO1FBRWxCLElBQUMsQ0FBQSxPQUFELEdBQVksQ0FBRSxJQUFGLEVBQU8sSUFBUCxFQUFZLElBQVosRUFBaUIsSUFBakI7UUFDWixJQUFDLENBQUEsT0FBRCxHQUFZO1FBQ1osSUFBQyxDQUFBLE9BQUQsR0FBWTtRQUNaLElBQUMsQ0FBQSxLQUFELEdBQVk7UUFDWixJQUFDLENBQUEsS0FBRCxHQUFZO1FBQ1osSUFBQyxDQUFBLFFBQUQsR0FBWTtRQUNaLElBQUMsQ0FBQSxNQUFELEdBQVk7SUFSYjs7bUJBZ0JILFlBQUEsR0FBYyxTQUFBO0FBRVYsWUFBQTtRQUFBLENBQUEsR0FBSTtBQWFKLGFBQVMsNEZBQVQ7WUFDSSxDQUFBLElBQUssaUJBQUEsR0FBaUIseUNBQWEsQ0FBRSxLQUFLLENBQUMsZUFBbkIsS0FBNEIsU0FBNUIsSUFBMEMsTUFBMUMsSUFBb0QsSUFBdEQsQ0FBakIsR0FBNkUsV0FBN0UsR0FBd0YsQ0FBeEYsR0FBMEY7QUFEbkc7ZUFFQTtJQWpCVTs7bUJBbUJkLGVBQUEsR0FBaUIsU0FBQTtRQUViLElBQUMsQ0FBQSxNQUFELEdBQVcsSUFBQyxDQUFBLFlBQUQsQ0FBQTtRQUNYLElBQUMsQ0FBQSxNQUFELElBQVc7ZUFXWCxJQUFDLENBQUEsTUFBRCxHQUFVO0lBZEc7O21CQXlCakIsZ0JBQUEsR0FBa0IsU0FBQTtRQUVkLElBQUMsQ0FBQSxNQUFELEdBQVcsSUFBQyxDQUFBLFlBQUQsQ0FBQTtRQUNYLElB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LEVBQXVDLElBQXZDLEVBQTZDLElBQTdDLEVBQW1ELEtBQW5EO1lBQ0EsTUFBQSxHQUFTLFdBQVksQ0FBQSxRQUFBO1lBQ3JCLElBQUEsR0FBTyxNQUFNLENBQUMsV0FBWSxDQUFBLENBQUE7WUFDMUIsSUFBQSxHQUFPLE1BQU0sQ0FBQyxXQUFZLENBQUEsQ0FBQTtZQUMxQixLQUFBLEdBQVEsQ0FBQSxHQUFLLE1BQU0sQ0FBQztZQUNwQixJQUFBLEdBQU87QUFDUCxtQkFBTSxJQUFBLEdBQU8sQ0FBYjtnQkFDSSxJQUFDLENBQUEsU0FBUyxDQUFDLHNCQUFYLENBQWtDLE1BQU0sQ0FBQyxPQUFRLENBQUEsS0FBQSxDQUFqRCxFQUF5RCxJQUF6RDtnQkFDQSxJQUFDLENBQUEsWUFBRCxDQUFjLEVBQWQsRUFBa0IsSUFBbEIsRUFBd0IsS0FBeEIsRUFBK0IsR0FBL0IsRUFBb0MsSUFBcEMsRUFBMEMsSUFBMUMsRUFBZ0QsT0FBaEQsRUFBeUQsV0FBekQsRUFBc0UsUUFBdEUsRUFBZ0YsSUFBaEY7Z0JBQ0EsSUFBQTtZQUhKO1lBSUEsSUFBQyxDQUFBLFNBQVMsQ0FBQyxzQkFBWCxDQUFrQyxJQUFsQyxFQUF3QyxDQUF4QztZQUNBLElBQUcsaUJBQUg7Z0JBQ0ksSUFBQyxDQUFBLFNBQVMsQ0FBQyxhQUFYLENBQXlCLE1BQU0sQ0FBQyxRQUFTLENBQUEsS0FBQSxDQUF6QyxFQURKOztZQUVBLFdBQVksQ0FBQSxRQUFBLENBQVMsQ0FBQyxlQUF0QixHQUF3QyxDQUFBLEdBQUssV0FBWSxDQUFBLFFBQUEsQ0FBUyxDQUFDO1lBQ25FLElBQUMsQ0FBQSxNQUFELEdBZkM7O0lBbkJGOzs7Ozs7QUFxQ1gsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4wMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbjAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIFxuMDAwICAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4jIyNcblxueyBmaWx0ZXIgfSA9IHJlcXVpcmUgJ2t4aydcblJlbmRlcmVyID0gcmVxdWlyZSAnLi9yZW5kZXJlcidcblxuY2xhc3MgUGFzc1xuICAgIFxuICAgIEA6IChAbVJlbmRlcmVyLCBAbUlELCBAbUVmZmVjdCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBtSW5wdXRzICA9IFsgbnVsbCBudWxsIG51bGwgbnVsbCBdXG4gICAgICAgIEBtT3V0cHV0ICA9IG51bGxcbiAgICAgICAgQG1Tb3VyY2UgID0gbnVsbFxuICAgICAgICBAbVR5cGUgICAgPSAnaW1hZ2UnXG4gICAgICAgIEBtTmFtZSAgICA9ICdub25lJ1xuICAgICAgICBAbUNvbXBpbGUgPSAwXG4gICAgICAgIEBtRnJhbWUgICA9IDBcbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBjb21tb25IZWFkZXI6IC0+XG4gICAgICAgIFxuICAgICAgICBoID0gXCJcIlwiXG4gICAgICAgICAgICAjZGVmaW5lIEhXX1BFUkZPUk1BTkNFIDFcbiAgICAgICAgICAgIHVuaWZvcm0gdmVjMyAgaVJlc29sdXRpb247XG4gICAgICAgICAgICB1bmlmb3JtIGZsb2F0IGlUaW1lO1xuICAgICAgICAgICAgdW5pZm9ybSBmbG9hdCBpQ2hhbm5lbFRpbWVbNF07XG4gICAgICAgICAgICB1bmlmb3JtIHZlYzQgIGlNb3VzZTtcbiAgICAgICAgICAgIHVuaWZvcm0gdmVjNCAgaURhdGU7XG4gICAgICAgICAgICB1bmlmb3JtIGZsb2F0IGlTYW1wbGVSYXRlO1xuICAgICAgICAgICAgdW5pZm9ybSB2ZWMzICBpQ2hhbm5lbFJlc29sdXRpb25bNF07XG4gICAgICAgICAgICB1bmlmb3JtIGludCAgIGlGcmFtZTtcbiAgICAgICAgICAgIHVuaWZvcm0gZmxvYXQgaVRpbWVEZWx0YTtcbiAgICAgICAgICAgIHVuaWZvcm0gZmxvYXQgaUZyYW1lUmF0ZTtcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICBmb3IgaSBpbiBbMC4uLkBtSW5wdXRzLmxlbmd0aF1cbiAgICAgICAgICAgIGggKz0gXCJ1bmlmb3JtIHNhbXBsZXIjeyBAbUlucHV0c1tpXT8ubUluZm8ubVR5cGUgPT0gJ2N1YmVtYXAnIGFuZCAnQ3ViZScgb3IgJzJEJyB9IGlDaGFubmVsI3tpfTtcXG5cIlxuICAgICAgICBoXG5cbiAgICBtYWtlSGVhZGVySW1hZ2U6IC0+XG4gICAgICAgIFxuICAgICAgICBAaGVhZGVyICA9IEBjb21tb25IZWFkZXIoKVxuICAgICAgICBAaGVhZGVyICs9IFwiXCJcIlxuICAgICAgICAgICAgc3RydWN0IENoYW5uZWxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB2ZWMzICByZXNvbHV0aW9uO1xuICAgICAgICAgICAgICAgIGZsb2F0IHRpbWU7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdW5pZm9ybSBDaGFubmVsIGlDaGFubmVsWzRdO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2b2lkIG1haW5JbWFnZShvdXQgdmVjNCBjLCBpbiB2ZWMyIGYpO1xuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgQGZvb3RlciA9IFwiXCJcIlxuICAgICAgICAgICAgb3V0IHZlYzQgb3V0Q29sb3I7XG4gICAgICAgICAgICB2b2lkIG1haW4oIHZvaWQgKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHZlYzQgY29sb3IgPSB2ZWM0KDAuMCwwLjAsMC4wLDEuMCk7XG4gICAgICAgICAgICAgICAgbWFpbkltYWdlKGNvbG9yLCBnbF9GcmFnQ29vcmQueHkpO1xuICAgICAgICAgICAgICAgIGNvbG9yLncgPSAxLjA7XG4gICAgICAgICAgICAgICAgb3V0Q29sb3IgPSBjb2xvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFwiXCJcIlxuICAgIFxuICAgIG1ha2VIZWFkZXJCdWZmZXI6IC0+XG4gICAgICAgIFxuICAgICAgICBAaGVhZGVyICA9IEBjb21tb25IZWFkZXIoKVxuICAgICAgICBAaGVhZGVyICs9ICd2b2lkIG1haW5JbWFnZShvdXQgdmVjNCBjLCBpbiB2ZWMyIGYpO1xcbidcbiAgICAgICAgXG4gICAgICAgIEBmb290ZXIgPSBcIlwiXCJcbiAgICAgICAgICAgIG91dCB2ZWM0IG91dENvbG9yO1xuICAgICAgICAgICAgdm9pZCBtYWluKCB2b2lkIClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB2ZWM0IGNvbG9yID0gdmVjNCgwLjAsMC4wLDAuMCwxLjApO1xuICAgICAgICAgICAgICAgIG1haW5JbWFnZSggY29sb3IsIGdsX0ZyYWdDb29yZC54eSApO1xuICAgICAgICAgICAgICAgIG91dENvbG9yID0gY29sb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcIlwiXCJcbiAgICBcbiAgICBtYWtlSGVhZGVyQ3ViZW1hcDogLT5cbiAgICAgICAgXG4gICAgICAgIEBoZWFkZXIgID0gQGNvbW1vbkhlYWRlcigpXG4gICAgICAgIEBoZWFkZXIgKz0gJ3ZvaWQgbWFpbkN1YmVtYXAoIG91dCB2ZWM0IGMsIGluIHZlYzIgZiwgaW4gdmVjMyBybywgaW4gdmVjMyByZCApO1xcbidcbiAgICAgICAgXG4gICAgICAgIEBmb290ZXIgID0gXCJcIlwiXG4gICAgICAgICAgICB1bmlmb3JtIHZlYzQgdW5WaWV3cG9ydDtcbiAgICAgICAgICAgIHVuaWZvcm0gdmVjMyB1bkNvcm5lcnNbNV07XG4gICAgICAgICAgICBvdXQgdmVjNCBvdXRDb2xvcjtcbiAgICAgICAgICAgIHZvaWQgbWFpbih2b2lkKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHZlYzQgY29sb3IgPSB2ZWM0KDAuMCwwLjAsMC4wLDEuMCk7XG4gICAgICAgICAgICAgICAgdmVjMyBybyA9IHVuQ29ybmVyc1s0XTtcbiAgICAgICAgICAgICAgICB2ZWMyIHV2ID0gKGdsX0ZyYWdDb29yZC54eSAtIHVuVmlld3BvcnQueHkpL3VuVmlld3BvcnQuenc7XG4gICAgICAgICAgICAgICAgdmVjMyByZCA9IG5vcm1hbGl6ZSggbWl4KCBtaXgoIHVuQ29ybmVyc1swXSwgdW5Db3JuZXJzWzFdLCB1di54ICksIG1peCggdW5Db3JuZXJzWzNdLCB1bkNvcm5lcnNbMl0sIHV2LnggKSwgdXYueSApIC0gcm8pO1xuICAgICAgICAgICAgICAgIG1haW5DdWJlbWFwKGNvbG9yLCBnbF9GcmFnQ29vcmQueHktdW5WaWV3cG9ydC54eSwgcm8sIHJkKTtcbiAgICAgICAgICAgICAgICBvdXRDb2xvciA9IGNvbG9yOyBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFwiXCJcIlxuICAgIFxuICAgIG1ha2VIZWFkZXJDb21tb246IC0+XG4gICAgICAgIEBoZWFkZXIgPSBcIlwiXCJcbiAgICAgICAgICAgIHVuaWZvcm0gdmVjNCAgICAgIGlEYXRlO1xuICAgICAgICAgICAgdW5pZm9ybSBmbG9hdCAgICAgaVNhbXBsZVJhdGU7XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgQGZvb3RlciAgPSBcIlwiXCJcbiAgICAgICAgICAgIG91dCB2ZWM0IG91dENvbG9yO1xuICAgICAgICAgICAgdm9pZCBtYWluKHZvaWQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgb3V0Q29sb3IgPSB2ZWM0KDAuMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcIlwiXCJcbiAgICBcbiAgICBtYWtlSGVhZGVyOiAtPlxuICAgICAgICBzd2l0Y2ggQG1UeXBlIFxuICAgICAgICAgICAgd2hlbiAnaW1hZ2UnICAgdGhlbiBAbWFrZUhlYWRlckltYWdlKClcbiAgICAgICAgICAgIHdoZW4gJ2J1ZmZlcicgIHRoZW4gQG1ha2VIZWFkZXJCdWZmZXIoKVxuICAgICAgICAgICAgd2hlbiAnY29tbW9uJyAgdGhlbiBAbWFrZUhlYWRlckNvbW1vbigpXG4gICAgICAgICAgICB3aGVuICdjdWJlbWFwJyB0aGVuIEBtYWtlSGVhZGVyQ3ViZW1hcCgpXG4gICAgICAgIFxuICAgIGNyZWF0ZTogKEBtVHlwZSwgQG1OYW1lKSAtPlxuICAgICAgICBAbVNvdXJjZSA9IG51bGxcbiAgICAgICAgQG1ha2VIZWFkZXIoKVxuICAgICAgICBpZiBAbVR5cGUgaW4gWydpbWFnZScgJ2J1ZmZlcicgJ2N1YmVtYXAnXVxuICAgICAgICAgICAgQG1Qcm9ncmFtID0gbnVsbFxuICAgIFxuICAgIGRlc3Ryb3k6IC0+IEBtU291cmNlID0gbnVsbFxuICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG5ld1NoYWRlcjogKHNoYWRlckNvZGUsIGNvbW1vblNvdXJjZUNvZGVzKSAtPlxuICAgICAgICByZXR1cm4gaWYgbm90IEBtUmVuZGVyZXJcbiAgICAgICAgICAgIFxuICAgICAgICB0aW1lU3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKVxuXG4gICAgICAgIHN3aXRjaCBAbVR5cGVcbiAgICAgICAgICAgIHdoZW4gJ2ltYWdlJyAnYnVmZmVyJ1xuICAgICAgICAgICAgICAgIGVyciA9IEBuZXdTaGFkZXJJbWFnZSBzaGFkZXJDb2RlLCBjb21tb25Tb3VyY2VDb2Rlc1xuICAgICAgICAgICAgd2hlbiAnY29tbW9uJ1xuICAgICAgICAgICAgICAgIGVyciA9IEBuZXdTaGFkZXJDb21tb24gc2hhZGVyQ29kZVxuICAgICAgICAgICAgd2hlbiAnY3ViZW1hcCdcbiAgICAgICAgICAgICAgICBlcnIgPSBAbmV3U2hhZGVyQ3ViZW1hcCBzaGFkZXJDb2RlLCBjb21tb25Tb3VyY2VDb2Rlc1xuICAgICAgICAgICAgd2hlbiAna2V5Ym9hcmQnXG4gICAgICAgICAgICAgICAgZXJyID0gbnVsbFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGVyciA9IFwidW5rbm93biB0eXBlICN7QG1UeXBlfVwiXG4gICAgICAgICAgICAgICAgZXJyb3IgZXJyXG4gICAgICAgIGlmIG5vdCBlcnJcbiAgICAgICAgICAgIEBtQ29tcGlsZSA9IHBlcmZvcm1hbmNlLm5vdygpIC0gdGltZVN0YXJ0XG4gICAgICAgIEBtU291cmNlID0gc2hhZGVyQ29kZVxuICAgICAgICBlcnJcbiAgICBcbiAgICAjIDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgbmV3U2hhZGVySW1hZ2U6IChzaGFkZXJDb2RlLCBjb21tb25TaGFkZXJDb2RlcykgLT5cbiAgICAgICAgXG4gICAgICAgIHZzID0gJ2xheW91dChsb2NhdGlvbiA9IDApIGluIHZlYzIgcG9zOyB2b2lkIG1haW4oKSB7IGdsX1Bvc2l0aW9uID0gdmVjNChwb3MueHksMC4wLDEuMCk7IH0nXG4gICAgICAgIGZyID0gQGhlYWRlclxuICAgICAgICBmb3IgaSBpbiBbMC4uLmNvbW1vblNoYWRlckNvZGVzLmxlbmd0aF1cbiAgICAgICAgICAgIGZyICs9ICdcXG4nICsgY29tbW9uU2hhZGVyQ29kZXNbaV1cbiAgICAgICAgZnIgKz0gJ1xcbicgKyBzaGFkZXJDb2RlXG4gICAgICAgIGZyICs9ICdcXG4nICsgQGZvb3RlclxuICAgICAgICByZXMgPSBAbVJlbmRlcmVyLmNyZWF0ZVNoYWRlciB2cywgZnJcbiAgICAgICAgaWYgcmVzLm1SZXN1bHQgPT0gZmFsc2VcbiAgICAgICAgICAgIHJldHVybiByZXMubUluZm9cbiAgICAgICAgaWYgQG1Qcm9ncmFtICE9IG51bGxcbiAgICAgICAgICAgIEBtUmVuZGVyZXIuZGVzdHJveVNoYWRlciBAbVByb2dyYW1cbiAgICAgICAgQG1Qcm9ncmFtID0gcmVzXG4gICAgICAgIG51bGxcbiAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgXG4gICAgbmV3U2hhZGVyQ3ViZW1hcDogKHNoYWRlckNvZGUsIGNvbW1vblNoYWRlckNvZGVzKSAtPlxuICAgICAgICBcbiAgICAgICAgdnMgPSAnbGF5b3V0KGxvY2F0aW9uID0gMCkgaW4gdmVjMiBwb3M7IHZvaWQgbWFpbigpIHsgZ2xfUG9zaXRpb24gPSB2ZWM0KHBvcy54eSwwLjAsMS4wKTsgfSdcbiAgICAgICAgZnIgPSBAaGVhZGVyXG4gICAgICAgIGkgPSAwXG4gICAgICAgIHdoaWxlIGkgPCBjb21tb25TaGFkZXJDb2Rlcy5sZW5ndGhcbiAgICAgICAgICAgIGZyICs9IGNvbW1vblNoYWRlckNvZGVzW2ldICsgJ1xcbidcbiAgICAgICAgICAgIGkrK1xuICAgICAgICBmciArPSBzaGFkZXJDb2RlXG4gICAgICAgIGZyICs9IEBmb290ZXJcbiAgICAgICAgcmVzID0gQG1SZW5kZXJlci5jcmVhdGVTaGFkZXIodnMsIGZyKVxuICAgICAgICBpZiByZXMubVJlc3VsdCA9PSBmYWxzZVxuICAgICAgICAgICAgcmV0dXJuIHJlcy5tSW5mb1xuICAgICAgICBpZiBAbVByb2dyYW0gIT0gbnVsbFxuICAgICAgICAgICAgQG1SZW5kZXJlci5kZXN0cm95U2hhZGVyIEBtUHJvZ3JhbVxuICAgICAgICBAbVByb2dyYW0gPSByZXNcbiAgICAgICAgbnVsbFxuICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgbmV3U2hhZGVyQ29tbW9uOiAoc2hhZGVyQ29kZSkgLT5cbiAgICAgICAgXG4gICAgICAgIHZzID0gJ2xheW91dChsb2NhdGlvbiA9IDApIGluIHZlYzIgcG9zOyB2b2lkIG1haW4oKSB7IGdsX1Bvc2l0aW9uID0gdmVjNChwb3MueHksMC4wLDEuMCk7IH0nXG4gICAgICAgIGZyID0gQGhlYWRlciArIHNoYWRlckNvZGUgKyBAZm9vdGVyXG4gICAgICAgIHJlcyA9IEBtUmVuZGVyZXIuY3JlYXRlU2hhZGVyKHZzLCBmcilcbiAgICAgICAgaWYgcmVzLm1SZXN1bHQgPT0gZmFsc2VcbiAgICAgICAgICAgIHJldHVybiByZXMubUluZm9cbiAgICAgICAgaWYgQG1Qcm9ncmFtICE9IG51bGxcbiAgICAgICAgICAgIEBtUmVuZGVyZXIuZGVzdHJveVNoYWRlciBAbVByb2dyYW1cbiAgICAgICAgQG1Qcm9ncmFtID0gcmVzXG4gICAgICAgIG51bGxcbiAgICAgICAgXG4gICAgZGVzdHJveUlucHV0OiAoaWQpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAbUlucHV0c1tpZF1cbiAgICAgICAgICAgIGlmIEBtSW5wdXRzW2lkXS5tSW5mby5tVHlwZSBpbiBbJ3RleHR1cmUnICdjdWJlbWFwJ11cbiAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLmRlc3Ryb3lUZXh0dXJlIEBtSW5wdXRzW2lkXS5nbG9iamVjdFxuICAgICAgICAgICAgQG1JbnB1dHNbaWRdID0gbnVsbFxuICAgIFxuICAgIHNhbXBsZXIyUmVuZGVyZXI6IChzYW1wbGVyKSAtPlxuICAgICAgICBcbiAgICAgICAgZmlsdGVyID0gUmVuZGVyZXIuRklMVEVSLk5PTkVcbiAgICAgICAgaWYgc2FtcGxlcj8uZmlsdGVyID09ICdsaW5lYXInIHRoZW4gZmlsdGVyID0gUmVuZGVyZXIuRklMVEVSLkxJTkVBUlxuICAgICAgICBpZiBzYW1wbGVyPy5maWx0ZXIgPT0gJ21pcG1hcCcgdGhlbiBmaWx0ZXIgPSBSZW5kZXJlci5GSUxURVIuTUlQTUFQXG4gICAgICAgIHJldHVyblxuICAgICAgICAgICAgbUZpbHRlcjogZmlsdGVyXG4gICAgICAgICAgICBtV3JhcDogICBzYW1wbGVyPy53cmFwICE9ICdjbGFtcCcgYW5kIFJlbmRlcmVyLlRFWFdSUC5SRVBFQVQgb3IgUmVuZGVyZXIuVEVYV1JQLkNMQU1QXG4gICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBzZXRTYW1wbGVyRmlsdGVyOiAoaWQsIHN0ciwgYnVmZmVycywgY3ViZUJ1ZmZlcnMpIC0+XG4gICAgICAgIFxuICAgICAgICBmaWx0ZXIgPSBzd2l0Y2ggc3RyXG4gICAgICAgICAgICB3aGVuICdsaW5lYXInIHRoZW4gUmVuZGVyZXIuRklMVEVSLkxJTkVBUlxuICAgICAgICAgICAgd2hlbiAnbWlwbWFwJyB0aGVuIFJlbmRlcmVyLkZJTFRFUi5NSVBNQVBcbiAgICAgICAgICAgIGVsc2UgICAgICAgICAgICAgICBSZW5kZXJlci5GSUxURVIuTk9ORVxuICAgICAgICAgICAgXG4gICAgICAgIGlucCA9IEBtSW5wdXRzW2lkXVxuICAgICAgICBpZiBpbnA/Lm1JbmZvLm1UeXBlID09ICd0ZXh0dXJlJ1xuICAgICAgICAgICAgaWYgaW5wLmxvYWRlZFxuICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0U2FtcGxlckZpbHRlciBpbnAuZ2xvYmplY3QsIGZpbHRlciwgdHJ1ZVxuICAgICAgICBlbHNlIGlmIGlucD8ubUluZm8ubVR5cGUgPT0gJ2N1YmVtYXAnXG4gICAgICAgICAgICBpZiBpbnAubG9hZGVkXG4gICAgICAgICAgICAgICAgaWYgQG1FZmZlY3QuYXNzZXRJRF90b19jdWJlbWFwQnVmZXJJRChpbnAubUluZm8ubUlEKSA9PSAwXG4gICAgICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0U2FtcGxlckZpbHRlciBjdWJlQnVmZmVyc1tpZF0ubVRleHR1cmVbMF0sIGZpbHRlciwgdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLnNldFNhbXBsZXJGaWx0ZXIgY3ViZUJ1ZmZlcnNbaWRdLm1UZXh0dXJlWzFdLCBmaWx0ZXIsIHRydWVcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0U2FtcGxlckZpbHRlciBpbnAuZ2xvYmplY3QsIGZpbHRlciwgdHJ1ZVxuICAgICAgICBlbHNlIGlmIGlucD8ubUluZm8ubVR5cGUgPT0gJ2J1ZmZlcidcbiAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0U2FtcGxlckZpbHRlciBidWZmZXJzW2lucC5pZF0ubVRleHR1cmVbMF0sIGZpbHRlciwgdHJ1ZVxuICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRTYW1wbGVyRmlsdGVyIGJ1ZmZlcnNbaW5wLmlkXS5tVGV4dHVyZVsxXSwgZmlsdGVyLCB0cnVlXG4gICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgMDAgICAgIDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICBcbiAgICBzZXRTYW1wbGVyV3JhcDogKGlkLCBzdHIsIGJ1ZmZlcnMpIC0+XG4gICAgICAgIFxuICAgICAgICBpbnAgPSBAbUlucHV0c1tpZF1cbiAgICAgICAgcmVzdHIgPSBSZW5kZXJlci5URVhXUlAuUkVQRUFUXG4gICAgICAgIGlmIHN0ciA9PSAnY2xhbXAnXG4gICAgICAgICAgICByZXN0ciA9IFJlbmRlcmVyLlRFWFdSUC5DTEFNUFxuICAgICAgICBpZiBpbnA/Lm1JbmZvLm1UeXBlID09ICd0ZXh0dXJlJ1xuICAgICAgICAgICAgaWYgaW5wLmxvYWRlZFxuICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0U2FtcGxlcldyYXAgaW5wLmdsb2JqZWN0LCByZXN0clxuICAgICAgICBlbHNlIGlmIGlucD8ubUluZm8ubVR5cGUgPT0gJ2N1YmVtYXAnXG4gICAgICAgICAgICBpZiBpbnAubG9hZGVkXG4gICAgICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRTYW1wbGVyV3JhcCBpbnAuZ2xvYmplY3QsIHJlc3RyXG4gICAgICAgIGVsc2UgaWYgaW5wPy5tSW5mby5tVHlwZSA9PSAnYnVmZmVyJ1xuICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRTYW1wbGVyV3JhcCBidWZmZXJzW2lucC5pZF0ubVRleHR1cmVbMF0sIHJlc3RyXG4gICAgICAgICAgICBAbVJlbmRlcmVyLnNldFNhbXBsZXJXcmFwIGJ1ZmZlcnNbaW5wLmlkXS5tVGV4dHVyZVsxXSwgcmVzdHJcbiAgICBcbiAgICBzZXRTYW1wbGVyVkZsaXA6IChpZCwgZmxpcCkgLT5cblxuICAgICAgICBpbnAgPSBAbUlucHV0c1tpZF1cbiAgICAgICAgaWYgaW5wPy5sb2FkZWQgYW5kIGlucD8ubUluZm8ubVR5cGUgaW4gWyd0ZXh0dXJlJyAnY3ViZW1hcCddXG4gICAgICAgICAgICBAbVJlbmRlcmVyLnNldFNhbXBsZXJWRmxpcCBpbnAuZ2xvYmplY3QsIGZsaXAsIGlucC5pbWFnZVxuICAgICAgICAgICAgXG4gICAgZ2V0VGV4dHVyZTogKHNsb3QpIC0+IEBtSW5wdXRzW3Nsb3RdPy5tSW5mb1xuICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBuZXdUZXh0dXJlOiAoc2xvdCwgdXJsLCBidWZmZXJzLCBjdWJlQnVmZmVycywga2V5Ym9hcmQpIC0+XG4gICAgICAgIFxuICAgICAgICB0ZXh0dXJlID0gbnVsbFxuICAgICAgICBcbiAgICAgICAgaWYgbm90IHVybD8ubVR5cGVcbiAgICAgICAgICAgIEBkZXN0cm95SW5wdXQgc2xvdFxuICAgICAgICAgICAgQG1JbnB1dHNbc2xvdF0gPSBudWxsXG4gICAgICAgICAgICBAbWFrZUhlYWRlcigpXG4gICAgICAgICAgICByZXR1cm4gXG4gICAgICAgICAgICAgICAgbUZhaWxlZDogZmFsc2VcbiAgICAgICAgICAgICAgICBtTmVlZHNTaGFkZXJDb21waWxlOiBmYWxzZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBlbHNlIGlmIHVybC5tVHlwZSA9PSAndGV4dHVyZSdcbiAgICAgICAgICAgICMga2xvZyBcIm5ld1RleHR1cmUgJ3RleHR1cmUnICN7c2xvdH1cIiB1cmxcbiAgICAgICAgICAgIHRleHR1cmUgPSB7fVxuICAgICAgICAgICAgdGV4dHVyZS5tSW5mbyA9IHVybFxuICAgICAgICAgICAgdGV4dHVyZS5nbG9iamVjdCA9IG51bGxcbiAgICAgICAgICAgIHRleHR1cmUubG9hZGVkID0gZmFsc2VcbiAgICAgICAgICAgIHRleHR1cmUuaW1hZ2UgPSBuZXcgSW1hZ2VcbiAgICAgICAgICAgIHRleHR1cmUuaW1hZ2UuY3Jvc3NPcmlnaW4gPSAnJ1xuICAgIFxuICAgICAgICAgICAgdGV4dHVyZS5pbWFnZS5vbmxvYWQgPSA9PlxuICAgICAgICAgICAgICAgIHJ0aSA9IEBzYW1wbGVyMlJlbmRlcmVyIHVybC5tU2FtcGxlclxuICAgICAgICAgICAgICAgIHRleHR1cmUuZ2xvYmplY3QgPSBAbVJlbmRlcmVyLmNyZWF0ZVRleHR1cmVGcm9tSW1hZ2UgUmVuZGVyZXIuVEVYVFlQRS5UMkQsIHRleHR1cmUuaW1hZ2UsIFJlbmRlcmVyLlRFWEZNVC5DNEk4LCBydGkubUZpbHRlciwgcnRpLm1XcmFwXG4gICAgICAgICAgICAgICAgdGV4dHVyZS5sb2FkZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgQHNldFNhbXBsZXJWRmxpcCBzbG90LCB0cnVlXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgXG4gICAgICAgICAgICAjIGtsb2cgXCJ0ZXh0dXJlLmltYWdlLnNyYyAje3VybC5tU3JjfVwiXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB0ZXh0dXJlLmltYWdlLnNyYyA9IHVybC5tU3JjXG4gICAgICAgICAgICByZXR1cm5WYWx1ZSA9IFxuICAgICAgICAgICAgICAgIG1GYWlsZWQ6IGZhbHNlXG4gICAgICAgICAgICAgICAgbU5lZWRzU2hhZGVyQ29tcGlsZTogQG1JbnB1dHNbc2xvdF0gPT0gbnVsbCBvciBAbUlucHV0c1tzbG90XS5tSW5mby5tVHlwZSAhPSAndGV4dHVyZScgYW5kIEBtSW5wdXRzW3Nsb3RdLm1JbmZvLm1UeXBlICE9ICdrZXlib2FyZCdcbiAgICAgICAgICAgIEBkZXN0cm95SW5wdXQgc2xvdFxuICAgICAgICAgICAgQG1JbnB1dHNbc2xvdF0gPSB0ZXh0dXJlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBtYWtlSGVhZGVyKClcbiAgICAgICAgICAgIHJldHVybiByZXR1cm5WYWx1ZVxuICAgICAgICAgICAgXG4gICAgICAgIGVsc2UgaWYgdXJsLm1UeXBlID09ICdjdWJlbWFwJ1xuICAgICAgICAgICAgdGV4dHVyZSA9IHt9XG4gICAgICAgICAgICB0ZXh0dXJlLm1JbmZvID0gdXJsXG4gICAgICAgICAgICB0ZXh0dXJlLmdsb2JqZWN0ID0gbnVsbFxuICAgICAgICAgICAgdGV4dHVyZS5sb2FkZWQgPSBmYWxzZVxuICAgICAgICAgICAgcnRpID0gQHNhbXBsZXIyUmVuZGVyZXIgdXJsLm1TYW1wbGVyXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIEBtRWZmZWN0LmFzc2V0SURfdG9fY3ViZW1hcEJ1ZmVySUQodXJsLm1JRCkgIT0gLTFcbiAgICAgICAgICAgICAgICB0ZXh0dXJlLm1JbWFnZSA9IG5ldyBJbWFnZVxuICAgIFxuICAgICAgICAgICAgICAgIHRleHR1cmUubUltYWdlLm9ubG9hZCA9IC0+XG4gICAgICAgICAgICAgICAgICAgIHRleHR1cmUubG9hZGVkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICBcbiAgICAgICAgICAgICAgICBAbUVmZmVjdC5yZXNpemVDdWJlbWFwQnVmZmVyIDAgMTAyNCAxMDI0XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdGV4dHVyZS5pbWFnZSA9IFtcbiAgICAgICAgICAgICAgICAgICAgbmV3IEltYWdlXG4gICAgICAgICAgICAgICAgICAgIG5ldyBJbWFnZVxuICAgICAgICAgICAgICAgICAgICBuZXcgSW1hZ2VcbiAgICAgICAgICAgICAgICAgICAgbmV3IEltYWdlXG4gICAgICAgICAgICAgICAgICAgIG5ldyBJbWFnZVxuICAgICAgICAgICAgICAgICAgICBuZXcgSW1hZ2VcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgbnVtTG9hZGVkID0gMFxuICAgICAgICAgICAgICAgIGkgPSAwXG4gICAgICAgICAgICAgICAgd2hpbGUgaSA8IDZcbiAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS5pbWFnZVtpXS5tSWQgPSBpXG4gICAgICAgICAgICAgICAgICAgIHRleHR1cmUuaW1hZ2VbaV0uY3Jvc3NPcmlnaW4gPSAnJ1xuICAgIFxuICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlLmltYWdlW2ldLm9ubG9hZCA9ID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IEBtSWRcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bUxvYWRlZCsrXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBudW1Mb2FkZWQgPT0gNlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHR1cmUuZ2xvYmplY3QgPSBAbVJlbmRlcmVyLmNyZWF0ZVRleHR1cmVGcm9tSW1hZ2UoUmVuZGVyZXIuVEVYVFlQRS5DVUJFTUFQLCB0ZXh0dXJlLmltYWdlLCBSZW5kZXJlci5URVhGTVQuQzRJOCwgcnRpLm1GaWx0ZXIsIHJ0aS5tV3JhcClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlLmxvYWRlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiBpID09IDBcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHR1cmUuaW1hZ2VbaV0uc3JjID0gdXJsLm1TcmNcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgbiA9IHVybC5tU3JjLmxhc3RJbmRleE9mKCcuJylcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHR1cmUuaW1hZ2VbaV0uc3JjID0gdXJsLm1TcmMuc3Vic3RyaW5nKDAsIG4pICsgJ18nICsgaSArIHVybC5tU3JjLnN1YnN0cmluZyhuLCB1cmwubVNyYy5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgIGkrK1xuICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSBcbiAgICAgICAgICAgICAgICBtRmFpbGVkOiBmYWxzZVxuICAgICAgICAgICAgICAgIG1OZWVkc1NoYWRlckNvbXBpbGU6IEBtSW5wdXRzW3Nsb3RdID09IG51bGwgb3IgQG1JbnB1dHNbc2xvdF0ubUluZm8ubVR5cGUgIT0gJ2N1YmVtYXAnXG4gICAgICAgICAgICBAZGVzdHJveUlucHV0IHNsb3RcbiAgICAgICAgICAgIEBtSW5wdXRzW3Nsb3RdID0gdGV4dHVyZVxuICAgICAgICAgICAgQG1ha2VIZWFkZXIoKVxuICAgICAgICAgICAgcmV0dXJuIHJldHVyblZhbHVlXG4gICAgICAgICAgICBcbiAgICAgICAgZWxzZSBpZiB1cmwubVR5cGUgPT0gJ2tleWJvYXJkJ1xuICAgICAgICAgICAgdGV4dHVyZSA9IHt9XG4gICAgICAgICAgICB0ZXh0dXJlLm1JbmZvID0gdXJsXG4gICAgICAgICAgICB0ZXh0dXJlLmdsb2JqZWN0ID0gbnVsbFxuICAgICAgICAgICAgdGV4dHVyZS5sb2FkZWQgPSB0cnVlXG4gICAgICAgICAgICB0ZXh0dXJlLmtleWJvYXJkID0ge31cbiAgICAgICAgICAgIHJldHVyblZhbHVlID0gXG4gICAgICAgICAgICAgICAgbUZhaWxlZDogZmFsc2VcbiAgICAgICAgICAgICAgICBtTmVlZHNTaGFkZXJDb21waWxlOiBAbUlucHV0c1tzbG90XSA9PSBudWxsIG9yIEBtSW5wdXRzW3Nsb3RdLm1JbmZvLm1UeXBlICE9ICd0ZXh0dXJlJyBhbmQgQG1JbnB1dHNbc2xvdF0ubUluZm8ubVR5cGUgIT0gJ2tleWJvYXJkJ1xuICAgICAgICAgICAgQGRlc3Ryb3lJbnB1dCBzbG90XG4gICAgICAgICAgICBAbUlucHV0c1tzbG90XSA9IHRleHR1cmVcbiAgICAgICAgICAgIEBtYWtlSGVhZGVyKClcbiAgICAgICAgICAgIHJldHVybiByZXR1cm5WYWx1ZVxuICAgICAgICAgICAgXG4gICAgICAgIGVsc2UgaWYgdXJsLm1UeXBlID09ICdidWZmZXInXG4gICAgICAgICAgICB0ZXh0dXJlID0ge31cbiAgICAgICAgICAgIHRleHR1cmUubUluZm8gPSB1cmxcbiAgICAgICAgICAgIHRleHR1cmUuaW1hZ2UgPSBuZXcgSW1hZ2VcbiAgICAgICAgICAgIHRleHR1cmUuaW1hZ2Uuc3JjID0gdXJsLm1TcmNcbiAgICAgICAgICAgIHRleHR1cmUuaWQgPSBAbUVmZmVjdC5hc3NldElEX3RvX2J1ZmZlcklEKHVybC5tSUQpXG4gICAgICAgICAgICAjIGtsb2cgXCJuZXdUZXh0dXJlICdidWZmZXInICN7c2xvdH1cIiB1cmwsIHRleHR1cmUuaWRcbiAgICAgICAgICAgIHRleHR1cmUubG9hZGVkID0gdHJ1ZVxuICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSBcbiAgICAgICAgICAgICAgICBtRmFpbGVkOiBmYWxzZVxuICAgICAgICAgICAgICAgIG1OZWVkc1NoYWRlckNvbXBpbGU6IEBtSW5wdXRzW3Nsb3RdID09IG51bGwgb3IgQG1JbnB1dHNbc2xvdF0ubUluZm8ubVR5cGUgIT0gJ3RleHR1cmUnIGFuZCBAbUlucHV0c1tzbG90XS5tSW5mby5tVHlwZSAhPSAna2V5Ym9hcmQnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAjIGtsb2cgXCJuZXdUZXh0dXJlICdidWZmZXInICN7c2xvdH1cIiByZXR1cm5WYWx1ZVxuICAgICAgICAgICAgQGRlc3Ryb3lJbnB1dCBzbG90XG4gICAgICAgICAgICBAbUlucHV0c1tzbG90XSA9IHRleHR1cmVcbiAgICAgICAgICAgIEBtRWZmZWN0LnJlc2l6ZUJ1ZmZlciB0ZXh0dXJlLmlkLCBAbUVmZmVjdC5tWHJlcywgQG1FZmZlY3QubVlyZXMsIGZhbHNlXG5cbiAgICAgICAgICAgICMgQHNldFNhbXBsZXJGaWx0ZXIgc2xvdCwgJ2xpbmVhcicgYnVmZmVycywgY3ViZUJ1ZmZlcnMsIHRydWVcbiAgICAgICAgICAgICMgQHNldFNhbXBsZXJWRmxpcCBzbG90LCB0cnVlXG4gICAgICAgICAgICAjIEBzZXRTYW1wbGVyV3JhcCBzbG90LCAnY2xhbXAnIGJ1ZmZlcnNcbiAgICAgICAgICAgIEBtYWtlSGVhZGVyKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgIyBrbG9nIFwibmV3VGV4dHVyZSAnYnVmZmVyJyAje3Nsb3R9XCIgQGhlYWRlciwgQGZvb3RlclxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4gcmV0dXJuVmFsdWVcbiAgICAgICAgICAgIFxuICAgICAgICBlcnJvciBcImlucHV0IHR5cGUgZXJyb3I6ICN7dXJsLm1UeXBlfVwiXG4gICAgICAgIHJldHVybiBtRmFpbGVkOnRydWVcbiAgICBcbiAgICAjIDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgcGFpbnRJbWFnZTogKGRhLCB0aW1lLCBkdGltZSwgZnBzLCB4cmVzLCB5cmVzLCBidWZmZXJzLCBjdWJlQnVmZmVycywga2V5Ym9hcmQpIC0+XG4gICAgICAgIFxuICAgICAgICB0aW1lcyA9IFsgMCAwIDAgMCBdXG4gICAgICAgIGRhdGVzID0gW1xuICAgICAgICAgICAgZGEuZ2V0RnVsbFllYXIoKVxuICAgICAgICAgICAgZGEuZ2V0TW9udGgoKVxuICAgICAgICAgICAgZGEuZ2V0RGF0ZSgpXG4gICAgICAgICAgICBkYS5nZXRIb3VycygpICogNjAuMCAqIDYwICsgZGEuZ2V0TWludXRlcygpICogNjAgKyBkYS5nZXRTZWNvbmRzKCkgKyBkYS5nZXRNaWxsaXNlY29uZHMoKSAvIDEwMDAuMFxuICAgICAgICBdXG4gICAgICAgIHJlc29zID0gWyAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCBdXG4gICAgICAgIHRleElEID0gWyBudWxsIG51bGwgbnVsbCBudWxsIF1cbiAgICAgICAgaSA9IDBcbiAgICAgICAgd2hpbGUgaSA8IEBtSW5wdXRzLmxlbmd0aFxuICAgICAgICAgICAgaW5wID0gQG1JbnB1dHNbaV1cbiAgICAgICAgICAgIGlmIGlucCA9PSBudWxsXG4gICAgICAgICAgICBlbHNlIGlmIGlucC5tSW5mby5tVHlwZSA9PSAndGV4dHVyZSdcbiAgICAgICAgICAgICAgICBpZiBpbnAubG9hZGVkID09IHRydWVcbiAgICAgICAgICAgICAgICAgICAgdGV4SURbaV0gPSBpbnAuZ2xvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAwXSA9IGlucC5pbWFnZS53aWR0aFxuICAgICAgICAgICAgICAgICAgICByZXNvc1szICogaSArIDFdID0gaW5wLmltYWdlLmhlaWdodFxuICAgICAgICAgICAgICAgICAgICByZXNvc1szICogaSArIDJdID0gMVxuICAgICAgICAgICAgZWxzZSBpZiBpbnAubUluZm8ubVR5cGUgPT0gJ2tleWJvYXJkJ1xuICAgICAgICAgICAgICAgIHRleElEW2ldID0ga2V5Ym9hcmQubVRleHR1cmVcbiAgICAgICAgICAgIGVsc2UgaWYgaW5wLm1JbmZvLm1UeXBlID09ICdjdWJlbWFwJ1xuICAgICAgICAgICAgICAgIGlmIGlucC5sb2FkZWQgPT0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBpZCA9IEBtRWZmZWN0LmFzc2V0SURfdG9fY3ViZW1hcEJ1ZmVySUQoaW5wLm1JbmZvLm1JRClcbiAgICAgICAgICAgICAgICAgICAgaWYgaWQgIT0gLTFcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleElEW2ldID0gY3ViZUJ1ZmZlcnNbaWRdLm1UZXh0dXJlW2N1YmVCdWZmZXJzW2lkXS5tTGFzdFJlbmRlckRvbmVdXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvc1szICogaSArIDBdID0gY3ViZUJ1ZmZlcnNbaWRdLm1SZXNvbHV0aW9uWzBdXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvc1szICogaSArIDFdID0gY3ViZUJ1ZmZlcnNbaWRdLm1SZXNvbHV0aW9uWzFdXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvc1szICogaSArIDJdID0gMVxuICAgICAgICAgICAgICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRTYW1wbGVyRmlsdGVyIHRleElEW2ldLCBpbnAubUluZm8ubVNhbXBsZXI/LmZpbHRlciA/IFJlbmRlcmVyLkZJTFRFUi5NSVBNQVAsIGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleElEW2ldID0gaW5wLmdsb2JqZWN0XG4gICAgICAgICAgICBlbHNlIGlmIGlucC5tSW5mby5tVHlwZSA9PSAnYnVmZmVyJ1xuICAgICAgICAgICAgICAgIGlmIGlucC5sb2FkZWQgPT0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBpZCA9IGlucC5pZFxuICAgICAgICAgICAgICAgICAgICB0ZXhJRFtpXSA9IGJ1ZmZlcnNbaWRdLm1UZXh0dXJlW2J1ZmZlcnNbaWRdLm1MYXN0UmVuZGVyRG9uZV1cbiAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAwXSA9IHhyZXNcbiAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAxXSA9IHlyZXNcbiAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAyXSA9IDFcbiAgICAgICAgICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRTYW1wbGVyRmlsdGVyIHRleElEW2ldLCBpbnAubUluZm8ubVNhbXBsZXI/LmZpbHRlciA/IFJlbmRlcmVyLkZJTFRFUi5MSU5FQVIsIGZhbHNlXG4gICAgICAgICAgICBpKytcbiAgICAgICAgQG1SZW5kZXJlci5hdHRhY2hUZXh0dXJlcyA0LCB0ZXhJRFswXSwgdGV4SURbMV0sIHRleElEWzJdLCB0ZXhJRFszXVxuICAgICAgICBwcm9nID0gQG1Qcm9ncmFtXG4gICAgICAgIEBtUmVuZGVyZXIuYXR0YWNoU2hhZGVyIHByb2dcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDFGICAnaVRpbWUnIHRpbWVcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDNGICAnaVJlc29sdXRpb24nIHhyZXMsIHlyZXMsIDEuMFxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50NEZWICdpTW91c2UnIEBtUmVuZGVyZXIuaU1vdXNlXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQ0RlYgJ2lEYXRlJyBkYXRlc1xuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpU2FtcGxlUmF0ZScgQG1TYW1wbGVSYXRlXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyVGV4dHVyZVVuaXQgJ2lDaGFubmVsMCcgMFxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlclRleHR1cmVVbml0ICdpQ2hhbm5lbDEnIDFcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJUZXh0dXJlVW5pdCAnaUNoYW5uZWwyJyAyXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyVGV4dHVyZVVuaXQgJ2lDaGFubmVsMycgM1xuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUkgICdpRnJhbWUnIEBtRnJhbWVcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDFGICAnaVRpbWVEZWx0YScgZHRpbWVcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDFGICAnaUZyYW1lUmF0ZScgZnBzXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQxRlYgJ2lDaGFubmVsVGltZScgdGltZXNcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDNGViAnaUNoYW5uZWxSZXNvbHV0aW9uJyByZXNvc1xuXG4gICAgICAgIGwxID0gQG1SZW5kZXJlci5nZXRBdHRyaWJMb2NhdGlvbihAbVByb2dyYW0sICdwb3MnKVxuICAgICAgICBAbVJlbmRlcmVyLnNldFZpZXdwb3J0IFsgMCwgMCwgeHJlcywgeXJlcyBdXG4gICAgICAgIEBtUmVuZGVyZXIuZHJhd0Z1bGxTY3JlZW5UcmlhbmdsZV9YWSBsMVxuICAgICAgICBAbVJlbmRlcmVyLmRldHRhY2hUZXh0dXJlcygpXG4gICAgICAgIHJldHVyblxuICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMCAgICAgMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgc2V0VW5pZm9ybXM6IChkYSwgdGltZSwgZHRpbWUsIGZwcywgeHJlcywgeXJlcywgYnVmZmVycywgY3ViZUJ1ZmZlcnMsIGtleWJvYXJkKSAtPlxuICAgICAgICB0aW1lcyA9IFsgMCAwIDAgMCBdXG4gICAgICAgIGRhdGVzID0gW1xuICAgICAgICAgICAgZGEuZ2V0RnVsbFllYXIoKVxuICAgICAgICAgICAgZGEuZ2V0TW9udGgoKVxuICAgICAgICAgICAgZGEuZ2V0RGF0ZSgpXG4gICAgICAgICAgICBkYS5nZXRIb3VycygpICogNjAgKiA2MCArIGRhLmdldE1pbnV0ZXMoKSAqIDYwICsgZGEuZ2V0U2Vjb25kcygpICsgZGEuZ2V0TWlsbGlzZWNvbmRzKCkgLyAxMDAwXG4gICAgICAgIF1cbiAgICAgICAgcmVzb3MgPSBbIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIF1cbiAgICAgICAgdGV4SUQgPSBbIG51bGwgbnVsbCBudWxsIG51bGwgXVxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5AbUlucHV0cy5sZW5ndGhdXG4gICAgICAgICAgICBpbnAgPSBAbUlucHV0c1tpXVxuICAgICAgICAgICAgaWYgaW5wPy5tSW5mby5tVHlwZSA9PSAndGV4dHVyZSdcbiAgICAgICAgICAgICAgICBpZiBpbnAubG9hZGVkID09IHRydWVcbiAgICAgICAgICAgICAgICAgICAgdGV4SURbaV0gPSBpbnAuZ2xvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAwXSA9IGlucC5pbWFnZS53aWR0aFxuICAgICAgICAgICAgICAgICAgICByZXNvc1szICogaSArIDFdID0gaW5wLmltYWdlLmhlaWdodFxuICAgICAgICAgICAgICAgICAgICByZXNvc1szICogaSArIDJdID0gMVxuICAgICAgICAgICAgZWxzZSBpZiBpbnA/Lm1JbmZvLm1UeXBlID09ICdrZXlib2FyZCdcbiAgICAgICAgICAgICAgICB0ZXhJRFtpXSA9IGtleWJvYXJkLm1UZXh0dXJlXG4gICAgICAgICAgICBlbHNlIGlmIGlucD8ubUluZm8ubVR5cGUgPT0gJ2N1YmVtYXAnXG4gICAgICAgICAgICAgICAgaWYgaW5wLmxvYWRlZCA9PSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGlkID0gQG1FZmZlY3QuYXNzZXRJRF90b19jdWJlbWFwQnVmZXJJRChpbnAubUluZm8ubUlEKVxuICAgICAgICAgICAgICAgICAgICBpZiBpZCAhPSAtMVxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4SURbaV0gPSBjdWJlQnVmZmVyc1tpZF0ubVRleHR1cmVbY3ViZUJ1ZmZlcnNbaWRdLm1MYXN0UmVuZGVyRG9uZV1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29zWzMgKiBpICsgMF0gPSBjdWJlQnVmZmVyc1tpZF0ubVJlc29sdXRpb25bMF1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29zWzMgKiBpICsgMV0gPSBjdWJlQnVmZmVyc1tpZF0ubVJlc29sdXRpb25bMV1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29zWzMgKiBpICsgMl0gPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICAjIGhhY2suIGluIHdlYmdsMi4wIHdlIGhhdmUgc2FtcGxlcnMsIHNvIHdlIGRvbid0IG5lZWQgdGhpcyBjcmFwIGhlcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlciA9IFJlbmRlcmVyLkZJTFRFUi5OT05FXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBpbnAubUluZm8ubVNhbXBsZXIuZmlsdGVyID09ICdsaW5lYXInXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyID0gUmVuZGVyZXIuRklMVEVSLkxJTkVBUlxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBpbnAubUluZm8ubVNhbXBsZXIuZmlsdGVyID09ICdtaXBtYXAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyID0gUmVuZGVyZXIuRklMVEVSLk1JUE1BUFxuICAgICAgICAgICAgICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRTYW1wbGVyRmlsdGVyIHRleElEW2ldLCBmaWx0ZXIsIGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleElEW2ldID0gaW5wLmdsb2JqZWN0XG4gICAgICAgICAgICBlbHNlIGlmIGlucD8ubUluZm8ubVR5cGUgPT0gJ2J1ZmZlcidcbiAgICAgICAgICAgICAgICBpZiBpbnAubG9hZGVkID09IHRydWVcbiAgICAgICAgICAgICAgICAgICAgdGV4SURbaV0gPSBidWZmZXJzW2lucC5pZF0ubVRleHR1cmVbYnVmZmVyc1tpbnAuaWRdLm1MYXN0UmVuZGVyRG9uZV1cbiAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAwXSA9IHhyZXNcbiAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAxXSA9IHlyZXNcbiAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAyXSA9IDFcblxuICAgICAgICBAbVJlbmRlcmVyLmF0dGFjaFRleHR1cmVzIDQsIHRleElEWzBdLCB0ZXhJRFsxXSwgdGV4SURbMl0sIHRleElEWzNdXG4gICAgICAgIEBtUmVuZGVyZXIuYXR0YWNoU2hhZGVyIEBtUHJvZ3JhbVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpVGltZScgdGltZVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50M0YgICdpUmVzb2x1dGlvbicgeHJlcywgeXJlcywgMS4wXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQ0RlYgJ2lNb3VzZScgQG1SZW5kZXJlci5pTW91c2VcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDRGViAnaURhdGUnIGRhdGVzXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQxRiAgJ2lTYW1wbGVSYXRlJyBAbVNhbXBsZVJhdGVcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJUZXh0dXJlVW5pdCAnaUNoYW5uZWwwJyAwXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyVGV4dHVyZVVuaXQgJ2lDaGFubmVsMScgMVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlclRleHR1cmVVbml0ICdpQ2hhbm5lbDInIDJcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJUZXh0dXJlVW5pdCAnaUNoYW5uZWwzJyAzXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQxSSAgJ2lGcmFtZScgQG1GcmFtZVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpVGltZURlbHRhJyBkdGltZVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpRnJhbWVSYXRlJyBmcHNcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDFGViAnaUNoYW5uZWxUaW1lJyB0aW1lc1xuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50M0ZWICdpQ2hhbm5lbFJlc29sdXRpb24nIHJlc29zXG4gICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBwcm9jZXNzSW5wdXRzOiAodGltZSwgZHRpbWUsIGZwcywgeHJlcywgeXJlcywgYnVmZmVycywgY3ViZUJ1ZmZlcnMsIGtleWJvYXJkKSAtPlxuICAgICAgICBpID0gMFxuICAgICAgICB3aGlsZSBpIDwgQG1JbnB1dHMubGVuZ3RoXG4gICAgICAgICAgICBpbnAgPSBAbUlucHV0c1tpXVxuICAgICAgICAgICAgaWYgaW5wID09IG51bGxcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIGlucC5tSW5mby5tVHlwZSA9PSAnYnVmZmVyJ1xuICAgICAgICAgICAgICAgIGlmIGlucC5sb2FkZWQgPT0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBpZCA9IGlucC5pZFxuICAgICAgICAgICAgICAgICAgICB0ZXhJRCA9IGJ1ZmZlcnNbaWRdLm1UZXh0dXJlW2J1ZmZlcnNbaWRdLm1MYXN0UmVuZGVyRG9uZV1cbiAgICAgICAgICAgICAgICAgICAgIyBoYWNrLiBpbiB3ZWJnbDIuMCB3ZSBoYXZlIHNhbXBsZXJzLCBzbyB3ZSBkb24ndCBuZWVkIHRoaXMgY3JhcCBoZXJlXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlciA9IFJlbmRlcmVyLkZJTFRFUi5OT05FXG4gICAgICAgICAgICAgICAgICAgIGlmIGlucC5tSW5mby5tU2FtcGxlci5maWx0ZXIgPT0gJ2xpbmVhcidcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlciA9IFJlbmRlcmVyLkZJTFRFUi5MSU5FQVJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBpbnAubUluZm8ubVNhbXBsZXIuZmlsdGVyID09ICdtaXBtYXAnXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXIgPSBSZW5kZXJlci5GSUxURVIuTUlQTUFQXG4gICAgICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0U2FtcGxlckZpbHRlciB0ZXhJRCwgZmlsdGVyLCBmYWxzZVxuICAgICAgICAgICAgaSsrXG4gICAgICAgIHJldHVyblxuICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICBcbiAgICBwYWludEN1YmVtYXA6IChkYSwgdGltZSwgZHRpbWUsIGZwcywgeHJlcywgeXJlcywgYnVmZmVycywgY3ViZUJ1ZmZlcnMsIGtleWJvYXJkLCBmYWNlKSAtPlxuICAgICAgICBcbiAgICAgICAgQHByb2Nlc3NJbnB1dHMgZGEsIHRpbWUsIGR0aW1lLCBmcHMsIHhyZXMsIHlyZXMsIGJ1ZmZlcnMsIGN1YmVCdWZmZXJzLCBrZXlib2FyZCwgZmFjZVxuICAgICAgICBAc2V0VW5pZm9ybXMgICBkYSwgdGltZSwgZHRpbWUsIGZwcywgeHJlcywgeXJlcywgYnVmZmVycywgY3ViZUJ1ZmZlcnMsIGtleWJvYXJkXG4gICAgICAgIGwxID0gQG1SZW5kZXJlci5nZXRBdHRyaWJMb2NhdGlvbiBAbVByb2dyYW0sICdwb3MnXG4gICAgICAgIHZwID0gWyAwLCAwLCB4cmVzLCB5cmVzIF1cbiAgICAgICAgQG1SZW5kZXJlci5zZXRWaWV3cG9ydCB2cFxuICAgICAgICBDID0gc3dpdGNoIGZhY2VcbiAgICAgICAgICAgIHdoZW4gMCB0aGVuIFsgIDEgIDEgIDEgIDEgIDEgLTEgIDEgLTEgLTEgIDEgLTEgIDEgMCAwIDBdXG4gICAgICAgICAgICB3aGVuIDEgdGhlbiBbIC0xICAxIC0xIC0xICAxICAxIC0xIC0xICAxIC0xIC0xIC0xIDAgMCAwXVxuICAgICAgICAgICAgd2hlbiAyIHRoZW4gWyAtMSAgMSAtMSAgMSAgMSAtMSAgMSAgMSAgMSAtMSAgMSAgMSAwIDAgMF1cbiAgICAgICAgICAgIHdoZW4gMyB0aGVuIFsgLTEgLTEgIDEgIDEgLTEgIDEgIDEgLTEgLTEgLTEgLTEgLTEgMCAwIDBdXG4gICAgICAgICAgICB3aGVuIDQgdGhlbiBbIC0xICAxICAxICAxICAxICAxICAxIC0xICAxIC0xIC0xICAxIDAgMCAwXVxuICAgICAgICAgICAgZWxzZSAgICAgICAgWyAgMSAgMSAtMSAtMSAgMSAtMSAtMSAtMSAtMSAgMSAtMSAtMSAwIDAgMF1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDNGViAndW5Db3JuZXJzJyBDXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQ0RlYgJ3VuVmlld3BvcnQnIHZwXG4gICAgICAgIEBtUmVuZGVyZXIuZHJhd1VuaXRRdWFkX1hZIGwxXG4gICAgICAgIEBtUmVuZGVyZXIuZGV0dGFjaFRleHR1cmVzKClcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBwYWludDogKGRhLCB0aW1lLCBkdGltZSwgZnBzLCB4cmVzLCB5cmVzLCBpc1BhdXNlZCwgYnVmZmVySUQsIGJ1ZmZlck5lZWRzTWltYXBzLCBidWZmZXJzLCBjdWJlQnVmZmVycywga2V5Ym9hcmQsIGVmZmVjdCkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBtVHlwZSA9PSAnaW1hZ2UnXG4gICAgICAgICAgICBAbVJlbmRlcmVyLnNldFJlbmRlclRhcmdldCBudWxsXG4gICAgICAgICAgICBAcGFpbnRJbWFnZSBkYSwgdGltZSwgZHRpbWUsIGZwcywgeHJlcywgeXJlcywgYnVmZmVycywgY3ViZUJ1ZmZlcnMsIGtleWJvYXJkXG4gICAgICAgICAgICBAbUZyYW1lKytcbiAgICAgICAgZWxzZSBpZiBAbVR5cGUgPT0gJ2NvbW1vbidcbiAgICAgICAgICAgICNjb25zb2xlLmxvZyhcInJlbmRlcmluZyBjb21tb25cIik7XG4gICAgICAgIGVsc2UgaWYgQG1UeXBlID09ICdidWZmZXInXG4gICAgICAgICAgICBAbUVmZmVjdC5yZXNpemVCdWZmZXIgYnVmZmVySUQsIEBtRWZmZWN0Lm1YcmVzLCBAbUVmZmVjdC5tWXJlcywgZmFsc2VcbiAgICAgICAgICAgIGJ1ZmZlciA9IGJ1ZmZlcnNbYnVmZmVySURdXG4gICAgICAgICAgICBkc3RJRCA9IDEgLSAoYnVmZmVyLm1MYXN0UmVuZGVyRG9uZSlcbiAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0UmVuZGVyVGFyZ2V0IGJ1ZmZlci5tVGFyZ2V0W2RzdElEXVxuICAgICAgICAgICAgQHBhaW50SW1hZ2UgZGEsIHRpbWUsIGR0aW1lLCBmcHMsIHhyZXMsIHlyZXMsIGJ1ZmZlcnMsIGN1YmVCdWZmZXJzLCBrZXlib2FyZFxuXG4gICAgICAgICAgICBpZiBidWZmZXJOZWVkc01pbWFwc1xuICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuY3JlYXRlTWlwbWFwcyBidWZmZXIubVRleHR1cmVbZHN0SURdXG4gICAgICAgICAgICBidWZmZXJzW2J1ZmZlcklEXS5tTGFzdFJlbmRlckRvbmUgPSAxIC0gKGJ1ZmZlcnNbYnVmZmVySURdLm1MYXN0UmVuZGVyRG9uZSlcbiAgICAgICAgICAgIEBtRnJhbWUrK1xuICAgICAgICBlbHNlIGlmIEBtVHlwZSA9PSAnY3ViZW1hcCdcbiAgICAgICAgICAgIEBtRWZmZWN0LnJlc2l6ZUN1YmVtYXBCdWZmZXIgYnVmZmVySUQsIDEwMjQsIDEwMjQsIGZhbHNlXG4gICAgICAgICAgICBidWZmZXIgPSBjdWJlQnVmZmVyc1tidWZmZXJJRF1cbiAgICAgICAgICAgIHhyZXMgPSBidWZmZXIubVJlc29sdXRpb25bMF1cbiAgICAgICAgICAgIHlyZXMgPSBidWZmZXIubVJlc29sdXRpb25bMV1cbiAgICAgICAgICAgIGRzdElEID0gMSAtIChidWZmZXIubUxhc3RSZW5kZXJEb25lKVxuICAgICAgICAgICAgZmFjZSA9IDBcbiAgICAgICAgICAgIHdoaWxlIGZhY2UgPCA2XG4gICAgICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRSZW5kZXJUYXJnZXRDdWJlTWFwIGJ1ZmZlci5tVGFyZ2V0W2RzdElEXSwgZmFjZVxuICAgICAgICAgICAgICAgIEBwYWludEN1YmVtYXAgZGEsIHRpbWUsIGR0aW1lLCBmcHMsIHhyZXMsIHlyZXMsIGJ1ZmZlcnMsIGN1YmVCdWZmZXJzLCBrZXlib2FyZCwgZmFjZVxuICAgICAgICAgICAgICAgIGZhY2UrK1xuICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRSZW5kZXJUYXJnZXRDdWJlTWFwIG51bGwsIDBcbiAgICAgICAgICAgIGlmIGJ1ZmZlck5lZWRzTWltYXBzXG4gICAgICAgICAgICAgICAgQG1SZW5kZXJlci5jcmVhdGVNaXBtYXBzIGJ1ZmZlci5tVGV4dHVyZVtkc3RJRF1cbiAgICAgICAgICAgIGN1YmVCdWZmZXJzW2J1ZmZlcklEXS5tTGFzdFJlbmRlckRvbmUgPSAxIC0gKGN1YmVCdWZmZXJzW2J1ZmZlcklEXS5tTGFzdFJlbmRlckRvbmUpXG4gICAgICAgICAgICBAbUZyYW1lKytcbiAgICAgICAgcmV0dXJuXG4gICAgXG5tb2R1bGUuZXhwb3J0cyA9IFBhc3MiXX0=
//# sourceURL=../coffee/pass.coffee