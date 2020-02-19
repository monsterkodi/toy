// koffee 1.6.0

/*
00000000    0000000    0000000   0000000  
000   000  000   000  000       000       
00000000   000000000  0000000   0000000   
000        000   000       000       000  
000        000   000  0000000   0000000
 */
var Pass, Renderer, filter, klog, ref;

ref = require('kxk'), filter = ref.filter, klog = ref.klog;

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
        var h, i, j, ref1, ref2;
        h = "#define HW_PERFORMANCE 1\nuniform vec3  iResolution;\nuniform float iTime;\nuniform float iChannelTime[4];\nuniform vec4  iMouse;\nuniform vec4  iDate;\nuniform float iSampleRate;\nuniform vec3  iChannelResolution[4];\nuniform int   iFrame;\nuniform float iTimeDelta;\nuniform float iFrameRate;";
        for (i = j = 0, ref1 = this.mInputs.length; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
            h += "uniform sampler" + (((ref2 = this.mInputs[i]) != null ? ref2.mInfo.mType : void 0) === 'cubemap' && 'Cube' || '2D') + " iChannel" + i + ";\n";
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
        var ref1;
        this.mType = mType;
        this.mName = mName;
        this.mSource = null;
        this.makeHeader();
        if ((ref1 = this.mType) === 'image' || ref1 === 'buffer' || ref1 === 'cubemap') {
            return this.mProgram = null;
        }
    };

    Pass.prototype.destroy = function() {
        return this.mSource = null;
    };

    Pass.prototype.newShader = function(shaderCode, commonSourceCodes) {
        var res, timeStart;
        if (this.mRenderer === null) {
            return null;
        }
        timeStart = performance.now();
        res = null;
        if (this.mType === 'image') {
            res = this.newShaderImage(shaderCode, commonSourceCodes);
        } else if (this.mType === 'buffer') {
            res = this.newShaderImage(shaderCode, commonSourceCodes);
        } else if (this.mType === 'common') {
            res = this.newShaderCommon(shaderCode);
        } else if (this.mType === 'cubemap') {
            res = this.newShaderCubemap(shaderCode, commonSourceCodes);
        } else if (this.mType === 'keyboard') {
            res = null;
        } else {
            console.error("unknown type " + this.mType);
        }
        if (res === null) {
            this.mCompile = performance.now() - timeStart;
        }
        this.mSource = shaderCode;
        return res;
    };

    Pass.prototype.newShaderImage = function(shaderCode, commonShaderCodes) {
        var fr, i, j, ref1, res, vs;
        vs = 'layout(location = 0) in vec2 pos; void main() { gl_Position = vec4(pos.xy,0.0,1.0); }';
        fr = this.header;
        for (i = j = 0, ref1 = commonShaderCodes.length; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
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
        var ref1;
        if (this.mInputs[id]) {
            if ((ref1 = this.mInputs[id].mInfo.mType) === 'texture' || ref1 === 'cubemap') {
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
        inp = this.mInputs[id];
        filter = Renderer.FILTER.NONE;
        if (str === 'linear') {
            filter = Renderer.FILTER.LINEAR;
        }
        if (str === 'mipmap') {
            filter = Renderer.FILTER.MIPMAP;
        }
        if (inp === null) {

        } else if (inp.mInfo.mType === 'texture') {
            if (inp.loaded) {
                return this.mRenderer.setSamplerFilter(inp.globject, filter, true);
            }
        } else if (inp.mInfo.mType === 'cubemap') {
            if (inp.loaded) {
                if (this.mEffect.assetID_to_cubemapBuferID(inp.mInfo.mID) === 0) {
                    this.mRenderer.setSamplerFilter(cubeBuffers[id].mTexture[0], filter, true);
                    return this.mRenderer.setSamplerFilter(cubeBuffers[id].mTexture[1], filter, true);
                } else {
                    return this.mRenderer.setSamplerFilter(inp.globject, filter, true);
                }
            }
        } else if (inp.mInfo.mType === 'buffer') {
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
        var inp, ref1;
        inp = this.mInputs[id];
        if ((inp != null ? inp.loaded : void 0) && ((ref1 = inp != null ? inp.mInfo.mType : void 0) === 'texture' || ref1 === 'cubemap')) {
            return this.mRenderer.setSamplerVFlip(inp.globject, flip, inp.image);
        }
    };

    Pass.prototype.getTexture = function(slot) {
        var ref1;
        return (ref1 = this.mInputs[slot]) != null ? ref1.mInfo : void 0;
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
            klog("newTexture 'buffer' " + slot, url);
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
            this.setSamplerFilter(slot, 'linear', buffers, cubeBuffers, true);
            this.setSamplerVFlip(slot, true);
            this.setSamplerWrap(slot, 'clamp', buffers);
            this.makeHeader();
            return returnValue;
        }
        console.error("input type error: " + url.mType);
        return {
            mFailed: true
        };
    };

    Pass.prototype.paintImage = function(da, time, dtime, fps, xres, yres, buffers, cubeBuffers, keyboard) {
        var dates, i, id, inp, l1, prog, ref1, ref2, ref3, ref4, resos, texID, times;
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
                        this.mRenderer.setSamplerFilter(texID[i], (ref1 = (ref2 = inp.mInfo.mSampler) != null ? ref2.filter : void 0) != null ? ref1 : Renderer.FILTER.MIPMAP, false);
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
                    this.mRenderer.setSamplerFilter(texID[i], (ref3 = (ref4 = inp.mInfo.mSampler) != null ? ref4.filter : void 0) != null ? ref3 : Renderer.FILTER.LINEAR, false);
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
        this.mRenderer.setShaderConstant1F('iChannel[0].time', times[0]);
        this.mRenderer.setShaderConstant1F('iChannel[1].time', times[1]);
        this.mRenderer.setShaderConstant1F('iChannel[2].time', times[2]);
        this.mRenderer.setShaderConstant1F('iChannel[3].time', times[3]);
        this.mRenderer.setShaderConstant3F('iChannel[0].resolution', resos[0], resos[1], resos[2]);
        this.mRenderer.setShaderConstant3F('iChannel[1].resolution', resos[3], resos[4], resos[5]);
        this.mRenderer.setShaderConstant3F('iChannel[2].resolution', resos[6], resos[7], resos[8]);
        this.mRenderer.setShaderConstant3F('iChannel[3].resolution', resos[9], resos[10], resos[11]);
        l1 = this.mRenderer.getAttribLocation(this.mProgram, 'pos');
        this.mRenderer.setViewport([0, 0, xres, yres]);
        this.mRenderer.drawFullScreenTriangle_XY(l1);
        this.mRenderer.dettachTextures();
    };

    Pass.prototype.setUniforms = function(da, time, dtime, fps, xres, yres, buffers, cubeBuffers, keyboard) {
        var dates, i, id, inp, j, ref1, resos, texID, times;
        times = [0, 0, 0, 0];
        dates = [da.getFullYear(), da.getMonth(), da.getDate(), da.getHours() * 60 * 60 + da.getMinutes() * 60 + da.getSeconds() + da.getMilliseconds() / 1000];
        resos = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        texID = [null, null, null, null];
        for (i = j = 0, ref1 = this.mInputs.length; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
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
        this.mRenderer.setShaderConstant1F('iChannel[0].time', times[0]);
        this.mRenderer.setShaderConstant1F('iChannel[1].time', times[1]);
        this.mRenderer.setShaderConstant1F('iChannel[2].time', times[2]);
        this.mRenderer.setShaderConstant1F('iChannel[3].time', times[3]);
        this.mRenderer.setShaderConstant3F('iChannel[0].resolution', resos[0], resos[1], resos[2]);
        this.mRenderer.setShaderConstant3F('iChannel[1].resolution', resos[3], resos[4], resos[5]);
        this.mRenderer.setShaderConstant3F('iChannel[2].resolution', resos[6], resos[7], resos[8]);
        return this.mRenderer.setShaderConstant3F('iChannel[3].resolution', resos[9], resos[10], resos[11]);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFzcy5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBbUIsT0FBQSxDQUFRLEtBQVIsQ0FBbkIsRUFBRSxtQkFBRixFQUFVOztBQUNWLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFFTDtJQUVDLGNBQUMsU0FBRCxFQUFhLEdBQWIsRUFBbUIsT0FBbkI7UUFBQyxJQUFDLENBQUEsWUFBRDtRQUFZLElBQUMsQ0FBQSxNQUFEO1FBQU0sSUFBQyxDQUFBLFVBQUQ7UUFFbEIsSUFBQyxDQUFBLE9BQUQsR0FBWSxDQUFFLElBQUYsRUFBTyxJQUFQLEVBQVksSUFBWixFQUFpQixJQUFqQjtRQUNaLElBQUMsQ0FBQSxPQUFELEdBQVk7UUFDWixJQUFDLENBQUEsT0FBRCxHQUFZO1FBQ1osSUFBQyxDQUFBLEtBQUQsR0FBWTtRQUNaLElBQUMsQ0FBQSxLQUFELEdBQVk7UUFDWixJQUFDLENBQUEsUUFBRCxHQUFZO1FBQ1osSUFBQyxDQUFBLE1BQUQsR0FBWTtJQVJiOzttQkFnQkgsWUFBQSxHQUFjLFNBQUE7QUFFVixZQUFBO1FBQUEsQ0FBQSxHQUFJO0FBYUosYUFBUyxpR0FBVDtZQUNJLENBQUEsSUFBSyxpQkFBQSxHQUFpQix5Q0FBYSxDQUFFLEtBQUssQ0FBQyxlQUFuQixLQUE0QixTQUE1QixJQUEwQyxNQUExQyxJQUFvRCxJQUF0RCxDQUFqQixHQUE2RSxXQUE3RSxHQUF3RixDQUF4RixHQUEwRjtBQURuRztlQUVBO0lBakJVOzttQkFtQmQsZUFBQSxHQUFpQixTQUFBO1FBRWIsSUFBQyxDQUFBLE1BQUQsR0FBVyxJQUFDLENBQUEsWUFBRCxDQUFBO1FBQ1gsSUFBQyxDQUFBLE1BQUQsSUFBVztlQVdYLElBQUMsQ0FBQSxNQUFELEdBQVU7SUFkRzs7bUJBeUJqQixnQkFBQSxHQUFrQixTQUFBO1FBRWQsSUFBQyxDQUFBLE1BQUQsR0FBVyxJQUFD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UUFBN0IsRUFBdUMsSUFBdkMsRUFBNkMsSUFBN0MsRUFBbUQsS0FBbkQ7WUFDQSxNQUFBLEdBQVMsV0FBWSxDQUFBLFFBQUE7WUFDckIsSUFBQSxHQUFPLE1BQU0sQ0FBQyxXQUFZLENBQUEsQ0FBQTtZQUMxQixJQUFBLEdBQU8sTUFBTSxDQUFDLFdBQVksQ0FBQSxDQUFBO1lBQzFCLEtBQUEsR0FBUSxDQUFBLEdBQUssTUFBTSxDQUFDO1lBQ3BCLElBQUEsR0FBTztBQUNQLG1CQUFNLElBQUEsR0FBTyxDQUFiO2dCQUNJLElBQUMsQ0FBQSxTQUFTLENBQUMsc0JBQVgsQ0FBa0MsTUFBTSxDQUFDLE9BQVEsQ0FBQSxLQUFBLENBQWpELEVBQXlELElBQXpEO2dCQUNBLElBQUMsQ0FBQSxZQUFELENBQWMsRUFBZCxFQUFrQixJQUFsQixFQUF3QixLQUF4QixFQUErQixHQUEvQixFQUFvQyxJQUFwQyxFQUEwQyxJQUExQyxFQUFnRCxPQUFoRCxFQUF5RCxXQUF6RCxFQUFzRSxRQUF0RSxFQUFnRixJQUFoRjtnQkFDQSxJQUFBO1lBSEo7WUFJQSxJQUFDLENBQUEsU0FBUyxDQUFDLHNCQUFYLENBQWtDLElBQWxDLEVBQXdDLENBQXhDO1lBQ0EsSUFBRyxpQkFBSDtnQkFDSSxJQUFDLENBQUEsU0FBUyxDQUFDLGFBQVgsQ0FBeUIsTUFBTSxDQUFDLFFBQVMsQ0FBQSxLQUFBLENBQXpDLEVBREo7O1lBRUEsV0FBWSxDQUFBLFFBQUEsQ0FBUyxDQUFDLGVBQXRCLEdBQXdDLENBQUEsR0FBSyxXQUFZLENBQUEsUUFBQSxDQUFTLENBQUM7WUFDbkUsSUFBQyxDQUFBLE1BQUQsR0FmQzs7SUFsQkY7Ozs7OztBQW9DWCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbjAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgXG4wMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiMjI1xuXG57IGZpbHRlciwga2xvZyB9ID0gcmVxdWlyZSAna3hrJ1xuUmVuZGVyZXIgPSByZXF1aXJlICcuL3JlbmRlcmVyJ1xuXG5jbGFzcyBQYXNzXG4gICAgXG4gICAgQDogKEBtUmVuZGVyZXIsIEBtSUQsIEBtRWZmZWN0KSAtPlxuICAgICAgICBcbiAgICAgICAgQG1JbnB1dHMgID0gWyBudWxsIG51bGwgbnVsbCBudWxsIF1cbiAgICAgICAgQG1PdXRwdXQgID0gbnVsbFxuICAgICAgICBAbVNvdXJjZSAgPSBudWxsXG4gICAgICAgIEBtVHlwZSAgICA9ICdpbWFnZSdcbiAgICAgICAgQG1OYW1lICAgID0gJ25vbmUnXG4gICAgICAgIEBtQ29tcGlsZSA9IDBcbiAgICAgICAgQG1GcmFtZSAgID0gMFxuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGNvbW1vbkhlYWRlcjogLT5cbiAgICAgICAgXG4gICAgICAgIGggPSBcIlwiXCJcbiAgICAgICAgICAgICNkZWZpbmUgSFdfUEVSRk9STUFOQ0UgMVxuICAgICAgICAgICAgdW5pZm9ybSB2ZWMzICBpUmVzb2x1dGlvbjtcbiAgICAgICAgICAgIHVuaWZvcm0gZmxvYXQgaVRpbWU7XG4gICAgICAgICAgICB1bmlmb3JtIGZsb2F0IGlDaGFubmVsVGltZVs0XTtcbiAgICAgICAgICAgIHVuaWZvcm0gdmVjNCAgaU1vdXNlO1xuICAgICAgICAgICAgdW5pZm9ybSB2ZWM0ICBpRGF0ZTtcbiAgICAgICAgICAgIHVuaWZvcm0gZmxvYXQgaVNhbXBsZVJhdGU7XG4gICAgICAgICAgICB1bmlmb3JtIHZlYzMgIGlDaGFubmVsUmVzb2x1dGlvbls0XTtcbiAgICAgICAgICAgIHVuaWZvcm0gaW50ICAgaUZyYW1lO1xuICAgICAgICAgICAgdW5pZm9ybSBmbG9hdCBpVGltZURlbHRhO1xuICAgICAgICAgICAgdW5pZm9ybSBmbG9hdCBpRnJhbWVSYXRlO1xuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgIGZvciBpIGluIFswLi4uQG1JbnB1dHMubGVuZ3RoXVxuICAgICAgICAgICAgaCArPSBcInVuaWZvcm0gc2FtcGxlciN7IEBtSW5wdXRzW2ldPy5tSW5mby5tVHlwZSA9PSAnY3ViZW1hcCcgYW5kICdDdWJlJyBvciAnMkQnIH0gaUNoYW5uZWwje2l9O1xcblwiXG4gICAgICAgIGhcblxuICAgIG1ha2VIZWFkZXJJbWFnZTogLT5cbiAgICAgICAgXG4gICAgICAgIEBoZWFkZXIgID0gQGNvbW1vbkhlYWRlcigpXG4gICAgICAgIEBoZWFkZXIgKz0gXCJcIlwiXG4gICAgICAgICAgICBzdHJ1Y3QgQ2hhbm5lbFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHZlYzMgIHJlc29sdXRpb247XG4gICAgICAgICAgICAgICAgZmxvYXQgdGltZTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB1bmlmb3JtIENoYW5uZWwgaUNoYW5uZWxbNF07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZvaWQgbWFpbkltYWdlKG91dCB2ZWM0IGMsIGluIHZlYzIgZik7XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBAZm9vdGVyID0gXCJcIlwiXG4gICAgICAgICAgICBvdXQgdmVjNCBvdXRDb2xvcjtcbiAgICAgICAgICAgIHZvaWQgbWFpbiggdm9pZCApXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdmVjNCBjb2xvciA9IHZlYzQoMC4wLDAuMCwwLjAsMS4wKTtcbiAgICAgICAgICAgICAgICBtYWluSW1hZ2UoY29sb3IsIGdsX0ZyYWdDb29yZC54eSk7XG4gICAgICAgICAgICAgICAgY29sb3IudyA9IDEuMDtcbiAgICAgICAgICAgICAgICBvdXRDb2xvciA9IGNvbG9yO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXCJcIlwiXG4gICAgXG4gICAgbWFrZUhlYWRlckJ1ZmZlcjogLT5cbiAgICAgICAgXG4gICAgICAgIEBoZWFkZXIgID0gQGNvbW1vbkhlYWRlcigpXG4gICAgICAgIEBoZWFkZXIgKz0gJ3ZvaWQgbWFpbkltYWdlKG91dCB2ZWM0IGMsIGluIHZlYzIgZik7XFxuJ1xuICAgICAgICBcbiAgICAgICAgQGZvb3RlciA9IFwiXCJcIlxuICAgICAgICAgICAgb3V0IHZlYzQgb3V0Q29sb3I7XG4gICAgICAgICAgICB2b2lkIG1haW4oIHZvaWQgKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHZlYzQgY29sb3IgPSB2ZWM0KDAuMCwwLjAsMC4wLDEuMCk7XG4gICAgICAgICAgICAgICAgbWFpbkltYWdlKCBjb2xvciwgZ2xfRnJhZ0Nvb3JkLnh5ICk7XG4gICAgICAgICAgICAgICAgb3V0Q29sb3IgPSBjb2xvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFwiXCJcIlxuICAgIFxuICAgIG1ha2VIZWFkZXJDdWJlbWFwOiAtPlxuICAgICAgICBcbiAgICAgICAgQGhlYWRlciAgPSBAY29tbW9uSGVhZGVyKClcbiAgICAgICAgQGhlYWRlciArPSAndm9pZCBtYWluQ3ViZW1hcCggb3V0IHZlYzQgYywgaW4gdmVjMiBmLCBpbiB2ZWMzIHJvLCBpbiB2ZWMzIHJkICk7XFxuJ1xuICAgICAgICBcbiAgICAgICAgQGZvb3RlciAgPSBcIlwiXCJcbiAgICAgICAgICAgIHVuaWZvcm0gdmVjNCB1blZpZXdwb3J0O1xuICAgICAgICAgICAgdW5pZm9ybSB2ZWMzIHVuQ29ybmVyc1s1XTtcbiAgICAgICAgICAgIG91dCB2ZWM0IG91dENvbG9yO1xuICAgICAgICAgICAgdm9pZCBtYWluKHZvaWQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdmVjNCBjb2xvciA9IHZlYzQoMC4wLDAuMCwwLjAsMS4wKTtcbiAgICAgICAgICAgICAgICB2ZWMzIHJvID0gdW5Db3JuZXJzWzRdO1xuICAgICAgICAgICAgICAgIHZlYzIgdXYgPSAoZ2xfRnJhZ0Nvb3JkLnh5IC0gdW5WaWV3cG9ydC54eSkvdW5WaWV3cG9ydC56dztcbiAgICAgICAgICAgICAgICB2ZWMzIHJkID0gbm9ybWFsaXplKCBtaXgoIG1peCggdW5Db3JuZXJzWzBdLCB1bkNvcm5lcnNbMV0sIHV2LnggKSwgbWl4KCB1bkNvcm5lcnNbM10sIHVuQ29ybmVyc1syXSwgdXYueCApLCB1di55ICkgLSBybyk7XG4gICAgICAgICAgICAgICAgbWFpbkN1YmVtYXAoY29sb3IsIGdsX0ZyYWdDb29yZC54eS11blZpZXdwb3J0Lnh5LCBybywgcmQpO1xuICAgICAgICAgICAgICAgIG91dENvbG9yID0gY29sb3I7IFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXCJcIlwiXG4gICAgXG4gICAgbWFrZUhlYWRlckNvbW1vbjogLT5cbiAgICAgICAgQGhlYWRlciA9IFwiXCJcIlxuICAgICAgICAgICAgdW5pZm9ybSB2ZWM0ICAgICAgaURhdGU7XG4gICAgICAgICAgICB1bmlmb3JtIGZsb2F0ICAgICBpU2FtcGxlUmF0ZTtcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICBAZm9vdGVyICA9IFwiXCJcIlxuICAgICAgICAgICAgb3V0IHZlYzQgb3V0Q29sb3I7XG4gICAgICAgICAgICB2b2lkIG1haW4odm9pZClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBvdXRDb2xvciA9IHZlYzQoMC4wKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFwiXCJcIlxuICAgIFxuICAgIG1ha2VIZWFkZXI6IC0+XG4gICAgICAgIHN3aXRjaCBAbVR5cGUgXG4gICAgICAgICAgICB3aGVuICdpbWFnZScgICB0aGVuIEBtYWtlSGVhZGVySW1hZ2UoKVxuICAgICAgICAgICAgd2hlbiAnYnVmZmVyJyAgdGhlbiBAbWFrZUhlYWRlckJ1ZmZlcigpXG4gICAgICAgICAgICB3aGVuICdjb21tb24nICB0aGVuIEBtYWtlSGVhZGVyQ29tbW9uKClcbiAgICAgICAgICAgIHdoZW4gJ2N1YmVtYXAnIHRoZW4gQG1ha2VIZWFkZXJDdWJlbWFwKClcbiAgICAgICAgXG4gICAgY3JlYXRlOiAoQG1UeXBlLCBAbU5hbWUpIC0+XG4gICAgICAgIEBtU291cmNlID0gbnVsbFxuICAgICAgICBAbWFrZUhlYWRlcigpXG4gICAgICAgIGlmIEBtVHlwZSBpbiBbJ2ltYWdlJyAnYnVmZmVyJyAnY3ViZW1hcCddXG4gICAgICAgICAgICBAbVByb2dyYW0gPSBudWxsXG4gICAgXG4gICAgZGVzdHJveTogLT4gQG1Tb3VyY2UgPSBudWxsXG4gICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgbmV3U2hhZGVyOiAoc2hhZGVyQ29kZSwgY29tbW9uU291cmNlQ29kZXMpIC0+XG4gICAgICAgIGlmIEBtUmVuZGVyZXIgPT0gbnVsbFxuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgdGltZVN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KClcbiAgICAgICAgcmVzID0gbnVsbFxuICAgICAgICBpZiBAbVR5cGUgPT0gJ2ltYWdlJ1xuICAgICAgICAgICAgcmVzID0gQG5ld1NoYWRlckltYWdlIHNoYWRlckNvZGUsIGNvbW1vblNvdXJjZUNvZGVzXG4gICAgICAgIGVsc2UgaWYgQG1UeXBlID09ICdidWZmZXInXG4gICAgICAgICAgICByZXMgPSBAbmV3U2hhZGVySW1hZ2Ugc2hhZGVyQ29kZSwgY29tbW9uU291cmNlQ29kZXNcbiAgICAgICAgZWxzZSBpZiBAbVR5cGUgPT0gJ2NvbW1vbidcbiAgICAgICAgICAgIHJlcyA9IEBuZXdTaGFkZXJDb21tb24gc2hhZGVyQ29kZVxuICAgICAgICBlbHNlIGlmIEBtVHlwZSA9PSAnY3ViZW1hcCdcbiAgICAgICAgICAgIHJlcyA9IEBuZXdTaGFkZXJDdWJlbWFwIHNoYWRlckNvZGUsIGNvbW1vblNvdXJjZUNvZGVzXG4gICAgICAgIGVsc2UgaWYgQG1UeXBlID09ICdrZXlib2FyZCdcbiAgICAgICAgICAgIHJlcyA9IG51bGxcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZXJyb3IgXCJ1bmtub3duIHR5cGUgI3tAbVR5cGV9XCJcbiAgICAgICAgaWYgcmVzID09IG51bGxcbiAgICAgICAgICAgIEBtQ29tcGlsZSA9IHBlcmZvcm1hbmNlLm5vdygpIC0gdGltZVN0YXJ0XG4gICAgICAgIEBtU291cmNlID0gc2hhZGVyQ29kZVxuICAgICAgICByZXNcbiAgICBcbiAgICAjIDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgbmV3U2hhZGVySW1hZ2U6IChzaGFkZXJDb2RlLCBjb21tb25TaGFkZXJDb2RlcykgLT5cbiAgICAgICAgXG4gICAgICAgIHZzID0gJ2xheW91dChsb2NhdGlvbiA9IDApIGluIHZlYzIgcG9zOyB2b2lkIG1haW4oKSB7IGdsX1Bvc2l0aW9uID0gdmVjNChwb3MueHksMC4wLDEuMCk7IH0nXG4gICAgICAgIGZyID0gQGhlYWRlclxuICAgICAgICBmb3IgaSBpbiBbMC4uLmNvbW1vblNoYWRlckNvZGVzLmxlbmd0aF1cbiAgICAgICAgICAgIGZyICs9ICdcXG4nICsgY29tbW9uU2hhZGVyQ29kZXNbaV1cbiAgICAgICAgZnIgKz0gJ1xcbicgKyBzaGFkZXJDb2RlXG4gICAgICAgIGZyICs9ICdcXG4nICsgQGZvb3RlclxuICAgICAgICByZXMgPSBAbVJlbmRlcmVyLmNyZWF0ZVNoYWRlciB2cywgZnJcbiAgICAgICAgaWYgcmVzLm1SZXN1bHQgPT0gZmFsc2VcbiAgICAgICAgICAgIHJldHVybiByZXMubUluZm9cbiAgICAgICAgaWYgQG1Qcm9ncmFtICE9IG51bGxcbiAgICAgICAgICAgIEBtUmVuZGVyZXIuZGVzdHJveVNoYWRlciBAbVByb2dyYW1cbiAgICAgICAgQG1Qcm9ncmFtID0gcmVzXG4gICAgICAgIG51bGxcbiAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgXG4gICAgbmV3U2hhZGVyQ3ViZW1hcDogKHNoYWRlckNvZGUsIGNvbW1vblNoYWRlckNvZGVzKSAtPlxuICAgICAgICBcbiAgICAgICAgdnMgPSAnbGF5b3V0KGxvY2F0aW9uID0gMCkgaW4gdmVjMiBwb3M7IHZvaWQgbWFpbigpIHsgZ2xfUG9zaXRpb24gPSB2ZWM0KHBvcy54eSwwLjAsMS4wKTsgfSdcbiAgICAgICAgZnIgPSBAaGVhZGVyXG4gICAgICAgIGkgPSAwXG4gICAgICAgIHdoaWxlIGkgPCBjb21tb25TaGFkZXJDb2Rlcy5sZW5ndGhcbiAgICAgICAgICAgIGZyICs9IGNvbW1vblNoYWRlckNvZGVzW2ldICsgJ1xcbidcbiAgICAgICAgICAgIGkrK1xuICAgICAgICBmciArPSBzaGFkZXJDb2RlXG4gICAgICAgIGZyICs9IEBmb290ZXJcbiAgICAgICAgcmVzID0gQG1SZW5kZXJlci5jcmVhdGVTaGFkZXIodnMsIGZyKVxuICAgICAgICBpZiByZXMubVJlc3VsdCA9PSBmYWxzZVxuICAgICAgICAgICAgcmV0dXJuIHJlcy5tSW5mb1xuICAgICAgICBpZiBAbVByb2dyYW0gIT0gbnVsbFxuICAgICAgICAgICAgQG1SZW5kZXJlci5kZXN0cm95U2hhZGVyIEBtUHJvZ3JhbVxuICAgICAgICBAbVByb2dyYW0gPSByZXNcbiAgICAgICAgbnVsbFxuICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgbmV3U2hhZGVyQ29tbW9uOiAoc2hhZGVyQ29kZSkgLT5cbiAgICAgICAgXG4gICAgICAgIHZzID0gJ2xheW91dChsb2NhdGlvbiA9IDApIGluIHZlYzIgcG9zOyB2b2lkIG1haW4oKSB7IGdsX1Bvc2l0aW9uID0gdmVjNChwb3MueHksMC4wLDEuMCk7IH0nXG4gICAgICAgIGZyID0gQGhlYWRlciArIHNoYWRlckNvZGUgKyBAZm9vdGVyXG4gICAgICAgIHJlcyA9IEBtUmVuZGVyZXIuY3JlYXRlU2hhZGVyKHZzLCBmcilcbiAgICAgICAgaWYgcmVzLm1SZXN1bHQgPT0gZmFsc2VcbiAgICAgICAgICAgIHJldHVybiByZXMubUluZm9cbiAgICAgICAgaWYgQG1Qcm9ncmFtICE9IG51bGxcbiAgICAgICAgICAgIEBtUmVuZGVyZXIuZGVzdHJveVNoYWRlciBAbVByb2dyYW1cbiAgICAgICAgQG1Qcm9ncmFtID0gcmVzXG4gICAgICAgIG51bGxcbiAgICAgICAgXG4gICAgZGVzdHJveUlucHV0OiAoaWQpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAbUlucHV0c1tpZF1cbiAgICAgICAgICAgIGlmIEBtSW5wdXRzW2lkXS5tSW5mby5tVHlwZSBpbiBbJ3RleHR1cmUnICdjdWJlbWFwJ11cbiAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLmRlc3Ryb3lUZXh0dXJlIEBtSW5wdXRzW2lkXS5nbG9iamVjdFxuICAgICAgICAgICAgQG1JbnB1dHNbaWRdID0gbnVsbFxuICAgIFxuICAgIHNhbXBsZXIyUmVuZGVyZXI6IChzYW1wbGVyKSAtPlxuICAgICAgICBcbiAgICAgICAgZmlsdGVyID0gUmVuZGVyZXIuRklMVEVSLk5PTkVcbiAgICAgICAgaWYgc2FtcGxlcj8uZmlsdGVyID09ICdsaW5lYXInIHRoZW4gZmlsdGVyID0gUmVuZGVyZXIuRklMVEVSLkxJTkVBUlxuICAgICAgICBpZiBzYW1wbGVyPy5maWx0ZXIgPT0gJ21pcG1hcCcgdGhlbiBmaWx0ZXIgPSBSZW5kZXJlci5GSUxURVIuTUlQTUFQXG4gICAgICAgIHJldHVyblxuICAgICAgICAgICAgbUZpbHRlcjogZmlsdGVyXG4gICAgICAgICAgICBtV3JhcDogICBzYW1wbGVyPy53cmFwICE9ICdjbGFtcCcgYW5kIFJlbmRlcmVyLlRFWFdSUC5SRVBFQVQgb3IgUmVuZGVyZXIuVEVYV1JQLkNMQU1QXG4gICAgXG4gICAgIyAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBzZXRTYW1wbGVyRmlsdGVyOiAoaWQsIHN0ciwgYnVmZmVycywgY3ViZUJ1ZmZlcnMpIC0+XG4gICAgICAgIFxuICAgICAgICBpbnAgPSBAbUlucHV0c1tpZF1cbiAgICAgICAgZmlsdGVyID0gUmVuZGVyZXIuRklMVEVSLk5PTkVcbiAgICAgICAgaWYgc3RyID09ICdsaW5lYXInXG4gICAgICAgICAgICBmaWx0ZXIgPSBSZW5kZXJlci5GSUxURVIuTElORUFSXG4gICAgICAgIGlmIHN0ciA9PSAnbWlwbWFwJ1xuICAgICAgICAgICAgZmlsdGVyID0gUmVuZGVyZXIuRklMVEVSLk1JUE1BUFxuICAgICAgICBpZiBpbnAgPT0gbnVsbFxuICAgICAgICBlbHNlIGlmIGlucC5tSW5mby5tVHlwZSA9PSAndGV4dHVyZSdcbiAgICAgICAgICAgIGlmIGlucC5sb2FkZWRcbiAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLnNldFNhbXBsZXJGaWx0ZXIgaW5wLmdsb2JqZWN0LCBmaWx0ZXIsIHRydWVcbiAgICAgICAgZWxzZSBpZiBpbnAubUluZm8ubVR5cGUgPT0gJ2N1YmVtYXAnXG4gICAgICAgICAgICBpZiBpbnAubG9hZGVkXG4gICAgICAgICAgICAgICAgaWYgQG1FZmZlY3QuYXNzZXRJRF90b19jdWJlbWFwQnVmZXJJRChpbnAubUluZm8ubUlEKSA9PSAwXG4gICAgICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0U2FtcGxlckZpbHRlciBjdWJlQnVmZmVyc1tpZF0ubVRleHR1cmVbMF0sIGZpbHRlciwgdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLnNldFNhbXBsZXJGaWx0ZXIgY3ViZUJ1ZmZlcnNbaWRdLm1UZXh0dXJlWzFdLCBmaWx0ZXIsIHRydWVcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0U2FtcGxlckZpbHRlciBpbnAuZ2xvYmplY3QsIGZpbHRlciwgdHJ1ZVxuICAgICAgICBlbHNlIGlmIGlucC5tSW5mby5tVHlwZSA9PSAnYnVmZmVyJ1xuICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRTYW1wbGVyRmlsdGVyIGJ1ZmZlcnNbaW5wLmlkXS5tVGV4dHVyZVswXSwgZmlsdGVyLCB0cnVlXG4gICAgICAgICAgICBAbVJlbmRlcmVyLnNldFNhbXBsZXJGaWx0ZXIgYnVmZmVyc1tpbnAuaWRdLm1UZXh0dXJlWzFdLCBmaWx0ZXIsIHRydWVcbiAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMCAgICAgMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgIFxuICAgIHNldFNhbXBsZXJXcmFwOiAoaWQsIHN0ciwgYnVmZmVycykgLT5cbiAgICAgICAgXG4gICAgICAgIGlucCA9IEBtSW5wdXRzW2lkXVxuICAgICAgICByZXN0ciA9IFJlbmRlcmVyLlRFWFdSUC5SRVBFQVRcbiAgICAgICAgaWYgc3RyID09ICdjbGFtcCdcbiAgICAgICAgICAgIHJlc3RyID0gUmVuZGVyZXIuVEVYV1JQLkNMQU1QXG4gICAgICAgIGlmIGlucD8ubUluZm8ubVR5cGUgPT0gJ3RleHR1cmUnXG4gICAgICAgICAgICBpZiBpbnAubG9hZGVkXG4gICAgICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRTYW1wbGVyV3JhcCBpbnAuZ2xvYmplY3QsIHJlc3RyXG4gICAgICAgIGVsc2UgaWYgaW5wPy5tSW5mby5tVHlwZSA9PSAnY3ViZW1hcCdcbiAgICAgICAgICAgIGlmIGlucC5sb2FkZWRcbiAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLnNldFNhbXBsZXJXcmFwIGlucC5nbG9iamVjdCwgcmVzdHJcbiAgICAgICAgZWxzZSBpZiBpbnA/Lm1JbmZvLm1UeXBlID09ICdidWZmZXInXG4gICAgICAgICAgICBAbVJlbmRlcmVyLnNldFNhbXBsZXJXcmFwIGJ1ZmZlcnNbaW5wLmlkXS5tVGV4dHVyZVswXSwgcmVzdHJcbiAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0U2FtcGxlcldyYXAgYnVmZmVyc1tpbnAuaWRdLm1UZXh0dXJlWzFdLCByZXN0clxuICAgIFxuICAgIHNldFNhbXBsZXJWRmxpcDogKGlkLCBmbGlwKSAtPlxuXG4gICAgICAgIGlucCA9IEBtSW5wdXRzW2lkXVxuICAgICAgICBpZiBpbnA/LmxvYWRlZCBhbmQgaW5wPy5tSW5mby5tVHlwZSBpbiBbJ3RleHR1cmUnICdjdWJlbWFwJ11cbiAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0U2FtcGxlclZGbGlwIGlucC5nbG9iamVjdCwgZmxpcCwgaW5wLmltYWdlXG4gICAgICAgICAgICBcbiAgICBnZXRUZXh0dXJlOiAoc2xvdCkgLT4gQG1JbnB1dHNbc2xvdF0/Lm1JbmZvXG4gICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG5ld1RleHR1cmU6IChzbG90LCB1cmwsIGJ1ZmZlcnMsIGN1YmVCdWZmZXJzLCBrZXlib2FyZCkgLT5cbiAgICAgICAgXG4gICAgICAgIHRleHR1cmUgPSBudWxsXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgdXJsPy5tVHlwZVxuICAgICAgICAgICAgQGRlc3Ryb3lJbnB1dCBzbG90XG4gICAgICAgICAgICBAbUlucHV0c1tzbG90XSA9IG51bGxcbiAgICAgICAgICAgIEBtYWtlSGVhZGVyKClcbiAgICAgICAgICAgIHJldHVybiBcbiAgICAgICAgICAgICAgICBtRmFpbGVkOiBmYWxzZVxuICAgICAgICAgICAgICAgIG1OZWVkc1NoYWRlckNvbXBpbGU6IGZhbHNlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGVsc2UgaWYgdXJsLm1UeXBlID09ICd0ZXh0dXJlJ1xuICAgICAgICAgICAgIyBrbG9nIFwibmV3VGV4dHVyZSAndGV4dHVyZScgI3tzbG90fVwiIHVybFxuICAgICAgICAgICAgdGV4dHVyZSA9IHt9XG4gICAgICAgICAgICB0ZXh0dXJlLm1JbmZvID0gdXJsXG4gICAgICAgICAgICB0ZXh0dXJlLmdsb2JqZWN0ID0gbnVsbFxuICAgICAgICAgICAgdGV4dHVyZS5sb2FkZWQgPSBmYWxzZVxuICAgICAgICAgICAgdGV4dHVyZS5pbWFnZSA9IG5ldyBJbWFnZVxuICAgICAgICAgICAgdGV4dHVyZS5pbWFnZS5jcm9zc09yaWdpbiA9ICcnXG4gICAgXG4gICAgICAgICAgICB0ZXh0dXJlLmltYWdlLm9ubG9hZCA9ID0+XG4gICAgICAgICAgICAgICAgcnRpID0gQHNhbXBsZXIyUmVuZGVyZXIgdXJsLm1TYW1wbGVyXG4gICAgICAgICAgICAgICAgdGV4dHVyZS5nbG9iamVjdCA9IEBtUmVuZGVyZXIuY3JlYXRlVGV4dHVyZUZyb21JbWFnZSBSZW5kZXJlci5URVhUWVBFLlQyRCwgdGV4dHVyZS5pbWFnZSwgUmVuZGVyZXIuVEVYRk1ULkM0STgsIHJ0aS5tRmlsdGVyLCBydGkubVdyYXBcbiAgICAgICAgICAgICAgICB0ZXh0dXJlLmxvYWRlZCA9IHRydWVcbiAgICAgICAgICAgICAgICBAc2V0U2FtcGxlclZGbGlwIHNsb3QsIHRydWVcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICBcbiAgICAgICAgICAgICMga2xvZyBcInRleHR1cmUuaW1hZ2Uuc3JjICN7dXJsLm1TcmN9XCJcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHRleHR1cmUuaW1hZ2Uuc3JjID0gdXJsLm1TcmNcbiAgICAgICAgICAgIHJldHVyblZhbHVlID0gXG4gICAgICAgICAgICAgICAgbUZhaWxlZDogZmFsc2VcbiAgICAgICAgICAgICAgICBtTmVlZHNTaGFkZXJDb21waWxlOiBAbUlucHV0c1tzbG90XSA9PSBudWxsIG9yIEBtSW5wdXRzW3Nsb3RdLm1JbmZvLm1UeXBlICE9ICd0ZXh0dXJlJyBhbmQgQG1JbnB1dHNbc2xvdF0ubUluZm8ubVR5cGUgIT0gJ2tleWJvYXJkJ1xuICAgICAgICAgICAgQGRlc3Ryb3lJbnB1dCBzbG90XG4gICAgICAgICAgICBAbUlucHV0c1tzbG90XSA9IHRleHR1cmVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQG1ha2VIZWFkZXIoKVxuICAgICAgICAgICAgcmV0dXJuIHJldHVyblZhbHVlXG4gICAgICAgICAgICBcbiAgICAgICAgZWxzZSBpZiB1cmwubVR5cGUgPT0gJ2N1YmVtYXAnXG4gICAgICAgICAgICB0ZXh0dXJlID0ge31cbiAgICAgICAgICAgIHRleHR1cmUubUluZm8gPSB1cmxcbiAgICAgICAgICAgIHRleHR1cmUuZ2xvYmplY3QgPSBudWxsXG4gICAgICAgICAgICB0ZXh0dXJlLmxvYWRlZCA9IGZhbHNlXG4gICAgICAgICAgICBydGkgPSBAc2FtcGxlcjJSZW5kZXJlciB1cmwubVNhbXBsZXJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgQG1FZmZlY3QuYXNzZXRJRF90b19jdWJlbWFwQnVmZXJJRCh1cmwubUlEKSAhPSAtMVxuICAgICAgICAgICAgICAgIHRleHR1cmUubUltYWdlID0gbmV3IEltYWdlXG4gICAgXG4gICAgICAgICAgICAgICAgdGV4dHVyZS5tSW1hZ2Uub25sb2FkID0gLT5cbiAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS5sb2FkZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgIFxuICAgICAgICAgICAgICAgIEBtRWZmZWN0LnJlc2l6ZUN1YmVtYXBCdWZmZXIgMCAxMDI0IDEwMjRcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0ZXh0dXJlLmltYWdlID0gW1xuICAgICAgICAgICAgICAgICAgICBuZXcgSW1hZ2VcbiAgICAgICAgICAgICAgICAgICAgbmV3IEltYWdlXG4gICAgICAgICAgICAgICAgICAgIG5ldyBJbWFnZVxuICAgICAgICAgICAgICAgICAgICBuZXcgSW1hZ2VcbiAgICAgICAgICAgICAgICAgICAgbmV3IEltYWdlXG4gICAgICAgICAgICAgICAgICAgIG5ldyBJbWFnZVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICBudW1Mb2FkZWQgPSAwXG4gICAgICAgICAgICAgICAgaSA9IDBcbiAgICAgICAgICAgICAgICB3aGlsZSBpIDwgNlxuICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlLmltYWdlW2ldLm1JZCA9IGlcbiAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS5pbWFnZVtpXS5jcm9zc09yaWdpbiA9ICcnXG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHRleHR1cmUuaW1hZ2VbaV0ub25sb2FkID0gPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gQG1JZFxuICAgICAgICAgICAgICAgICAgICAgICAgbnVtTG9hZGVkKytcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG51bUxvYWRlZCA9PSA2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS5nbG9iamVjdCA9IEBtUmVuZGVyZXIuY3JlYXRlVGV4dHVyZUZyb21JbWFnZShSZW5kZXJlci5URVhUWVBFLkNVQkVNQVAsIHRleHR1cmUuaW1hZ2UsIFJlbmRlcmVyLlRFWEZNVC5DNEk4LCBydGkubUZpbHRlciwgcnRpLm1XcmFwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHR1cmUubG9hZGVkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIGkgPT0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS5pbWFnZVtpXS5zcmMgPSB1cmwubVNyY1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBuID0gdXJsLm1TcmMubGFzdEluZGV4T2YoJy4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS5pbWFnZVtpXS5zcmMgPSB1cmwubVNyYy5zdWJzdHJpbmcoMCwgbikgKyAnXycgKyBpICsgdXJsLm1TcmMuc3Vic3RyaW5nKG4sIHVybC5tU3JjLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgaSsrXG4gICAgICAgICAgICByZXR1cm5WYWx1ZSA9IFxuICAgICAgICAgICAgICAgIG1GYWlsZWQ6IGZhbHNlXG4gICAgICAgICAgICAgICAgbU5lZWRzU2hhZGVyQ29tcGlsZTogQG1JbnB1dHNbc2xvdF0gPT0gbnVsbCBvciBAbUlucHV0c1tzbG90XS5tSW5mby5tVHlwZSAhPSAnY3ViZW1hcCdcbiAgICAgICAgICAgIEBkZXN0cm95SW5wdXQgc2xvdFxuICAgICAgICAgICAgQG1JbnB1dHNbc2xvdF0gPSB0ZXh0dXJlXG4gICAgICAgICAgICBAbWFrZUhlYWRlcigpXG4gICAgICAgICAgICByZXR1cm4gcmV0dXJuVmFsdWVcbiAgICAgICAgICAgIFxuICAgICAgICBlbHNlIGlmIHVybC5tVHlwZSA9PSAna2V5Ym9hcmQnXG4gICAgICAgICAgICB0ZXh0dXJlID0ge31cbiAgICAgICAgICAgIHRleHR1cmUubUluZm8gPSB1cmxcbiAgICAgICAgICAgIHRleHR1cmUuZ2xvYmplY3QgPSBudWxsXG4gICAgICAgICAgICB0ZXh0dXJlLmxvYWRlZCA9IHRydWVcbiAgICAgICAgICAgIHRleHR1cmUua2V5Ym9hcmQgPSB7fVxuICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSBcbiAgICAgICAgICAgICAgICBtRmFpbGVkOiBmYWxzZVxuICAgICAgICAgICAgICAgIG1OZWVkc1NoYWRlckNvbXBpbGU6IEBtSW5wdXRzW3Nsb3RdID09IG51bGwgb3IgQG1JbnB1dHNbc2xvdF0ubUluZm8ubVR5cGUgIT0gJ3RleHR1cmUnIGFuZCBAbUlucHV0c1tzbG90XS5tSW5mby5tVHlwZSAhPSAna2V5Ym9hcmQnXG4gICAgICAgICAgICBAZGVzdHJveUlucHV0IHNsb3RcbiAgICAgICAgICAgIEBtSW5wdXRzW3Nsb3RdID0gdGV4dHVyZVxuICAgICAgICAgICAgQG1ha2VIZWFkZXIoKVxuICAgICAgICAgICAgcmV0dXJuIHJldHVyblZhbHVlXG4gICAgICAgICAgICBcbiAgICAgICAgZWxzZSBpZiB1cmwubVR5cGUgPT0gJ2J1ZmZlcidcbiAgICAgICAgICAgIGtsb2cgXCJuZXdUZXh0dXJlICdidWZmZXInICN7c2xvdH1cIiB1cmxcbiAgICAgICAgICAgIHRleHR1cmUgPSB7fVxuICAgICAgICAgICAgdGV4dHVyZS5tSW5mbyA9IHVybFxuICAgICAgICAgICAgdGV4dHVyZS5pbWFnZSA9IG5ldyBJbWFnZVxuICAgICAgICAgICAgdGV4dHVyZS5pbWFnZS5zcmMgPSB1cmwubVNyY1xuICAgICAgICAgICAgdGV4dHVyZS5pZCA9IEBtRWZmZWN0LmFzc2V0SURfdG9fYnVmZmVySUQodXJsLm1JRClcbiAgICAgICAgICAgIHRleHR1cmUubG9hZGVkID0gdHJ1ZVxuICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSBcbiAgICAgICAgICAgICAgICBtRmFpbGVkOiBmYWxzZVxuICAgICAgICAgICAgICAgIG1OZWVkc1NoYWRlckNvbXBpbGU6IEBtSW5wdXRzW3Nsb3RdID09IG51bGwgb3IgQG1JbnB1dHNbc2xvdF0ubUluZm8ubVR5cGUgIT0gJ3RleHR1cmUnIGFuZCBAbUlucHV0c1tzbG90XS5tSW5mby5tVHlwZSAhPSAna2V5Ym9hcmQnXG4gICAgICAgICAgICBAZGVzdHJveUlucHV0IHNsb3RcbiAgICAgICAgICAgIEBtSW5wdXRzW3Nsb3RdID0gdGV4dHVyZVxuICAgICAgICAgICAgQG1FZmZlY3QucmVzaXplQnVmZmVyIHRleHR1cmUuaWQsIEBtRWZmZWN0Lm1YcmVzLCBAbUVmZmVjdC5tWXJlcywgZmFsc2VcblxuICAgICAgICAgICAgQHNldFNhbXBsZXJGaWx0ZXIgc2xvdCwgJ2xpbmVhcicgYnVmZmVycywgY3ViZUJ1ZmZlcnMsIHRydWVcbiAgICAgICAgICAgIEBzZXRTYW1wbGVyVkZsaXAgc2xvdCwgdHJ1ZVxuICAgICAgICAgICAgQHNldFNhbXBsZXJXcmFwIHNsb3QsICdjbGFtcCcgYnVmZmVyc1xuICAgICAgICAgICAgQG1ha2VIZWFkZXIoKVxuICAgICAgICAgICAgcmV0dXJuIHJldHVyblZhbHVlXG4gICAgICAgICAgICBcbiAgICAgICAgZXJyb3IgXCJpbnB1dCB0eXBlIGVycm9yOiAje3VybC5tVHlwZX1cIlxuICAgICAgICByZXR1cm4gbUZhaWxlZDp0cnVlXG4gICAgXG4gICAgIyAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIHBhaW50SW1hZ2U6IChkYSwgdGltZSwgZHRpbWUsIGZwcywgeHJlcywgeXJlcywgYnVmZmVycywgY3ViZUJ1ZmZlcnMsIGtleWJvYXJkKSAtPlxuICAgICAgICBcbiAgICAgICAgdGltZXMgPSBbIDAgMCAwIDAgXVxuICAgICAgICBkYXRlcyA9IFtcbiAgICAgICAgICAgIGRhLmdldEZ1bGxZZWFyKClcbiAgICAgICAgICAgIGRhLmdldE1vbnRoKClcbiAgICAgICAgICAgIGRhLmdldERhdGUoKVxuICAgICAgICAgICAgZGEuZ2V0SG91cnMoKSAqIDYwLjAgKiA2MCArIGRhLmdldE1pbnV0ZXMoKSAqIDYwICsgZGEuZ2V0U2Vjb25kcygpICsgZGEuZ2V0TWlsbGlzZWNvbmRzKCkgLyAxMDAwLjBcbiAgICAgICAgXVxuICAgICAgICByZXNvcyA9IFsgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgXVxuICAgICAgICB0ZXhJRCA9IFsgbnVsbCBudWxsIG51bGwgbnVsbCBdXG4gICAgICAgIGkgPSAwXG4gICAgICAgIHdoaWxlIGkgPCBAbUlucHV0cy5sZW5ndGhcbiAgICAgICAgICAgIGlucCA9IEBtSW5wdXRzW2ldXG4gICAgICAgICAgICBpZiBpbnAgPT0gbnVsbFxuICAgICAgICAgICAgZWxzZSBpZiBpbnAubUluZm8ubVR5cGUgPT0gJ3RleHR1cmUnXG4gICAgICAgICAgICAgICAgaWYgaW5wLmxvYWRlZCA9PSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIHRleElEW2ldID0gaW5wLmdsb2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIHJlc29zWzMgKiBpICsgMF0gPSBpbnAuaW1hZ2Uud2lkdGhcbiAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAxXSA9IGlucC5pbWFnZS5oZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAyXSA9IDFcbiAgICAgICAgICAgIGVsc2UgaWYgaW5wLm1JbmZvLm1UeXBlID09ICdrZXlib2FyZCdcbiAgICAgICAgICAgICAgICB0ZXhJRFtpXSA9IGtleWJvYXJkLm1UZXh0dXJlXG4gICAgICAgICAgICBlbHNlIGlmIGlucC5tSW5mby5tVHlwZSA9PSAnY3ViZW1hcCdcbiAgICAgICAgICAgICAgICBpZiBpbnAubG9hZGVkID09IHRydWVcbiAgICAgICAgICAgICAgICAgICAgaWQgPSBAbUVmZmVjdC5hc3NldElEX3RvX2N1YmVtYXBCdWZlcklEKGlucC5tSW5mby5tSUQpXG4gICAgICAgICAgICAgICAgICAgIGlmIGlkICE9IC0xXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXhJRFtpXSA9IGN1YmVCdWZmZXJzW2lkXS5tVGV4dHVyZVtjdWJlQnVmZmVyc1tpZF0ubUxhc3RSZW5kZXJEb25lXVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAwXSA9IGN1YmVCdWZmZXJzW2lkXS5tUmVzb2x1dGlvblswXVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAxXSA9IGN1YmVCdWZmZXJzW2lkXS5tUmVzb2x1dGlvblsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAyXSA9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0U2FtcGxlckZpbHRlciB0ZXhJRFtpXSwgaW5wLm1JbmZvLm1TYW1wbGVyPy5maWx0ZXIgPyBSZW5kZXJlci5GSUxURVIuTUlQTUFQLCBmYWxzZVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXhJRFtpXSA9IGlucC5nbG9iamVjdFxuICAgICAgICAgICAgZWxzZSBpZiBpbnAubUluZm8ubVR5cGUgPT0gJ2J1ZmZlcidcbiAgICAgICAgICAgICAgICBpZiBpbnAubG9hZGVkID09IHRydWVcbiAgICAgICAgICAgICAgICAgICAgaWQgPSBpbnAuaWRcbiAgICAgICAgICAgICAgICAgICAgdGV4SURbaV0gPSBidWZmZXJzW2lkXS5tVGV4dHVyZVtidWZmZXJzW2lkXS5tTGFzdFJlbmRlckRvbmVdXG4gICAgICAgICAgICAgICAgICAgIHJlc29zWzMgKiBpICsgMF0gPSB4cmVzXG4gICAgICAgICAgICAgICAgICAgIHJlc29zWzMgKiBpICsgMV0gPSB5cmVzXG4gICAgICAgICAgICAgICAgICAgIHJlc29zWzMgKiBpICsgMl0gPSAxXG4gICAgICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0U2FtcGxlckZpbHRlciB0ZXhJRFtpXSwgaW5wLm1JbmZvLm1TYW1wbGVyPy5maWx0ZXIgPyBSZW5kZXJlci5GSUxURVIuTElORUFSLCBmYWxzZVxuICAgICAgICAgICAgaSsrXG4gICAgICAgIEBtUmVuZGVyZXIuYXR0YWNoVGV4dHVyZXMgNCwgdGV4SURbMF0sIHRleElEWzFdLCB0ZXhJRFsyXSwgdGV4SURbM11cbiAgICAgICAgcHJvZyA9IEBtUHJvZ3JhbVxuICAgICAgICBAbVJlbmRlcmVyLmF0dGFjaFNoYWRlciBwcm9nXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQxRiAgJ2lUaW1lJyB0aW1lXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQzRiAgJ2lSZXNvbHV0aW9uJyB4cmVzLCB5cmVzLCAxLjBcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDRGViAnaU1vdXNlJyBAbVJlbmRlcmVyLmlNb3VzZVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50NEZWICdpRGF0ZScgZGF0ZXNcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDFGICAnaVNhbXBsZVJhdGUnIEBtU2FtcGxlUmF0ZVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlclRleHR1cmVVbml0ICdpQ2hhbm5lbDAnIDBcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJUZXh0dXJlVW5pdCAnaUNoYW5uZWwxJyAxXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyVGV4dHVyZVVuaXQgJ2lDaGFubmVsMicgMlxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlclRleHR1cmVVbml0ICdpQ2hhbm5lbDMnIDNcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDFJICAnaUZyYW1lJyBAbUZyYW1lXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQxRiAgJ2lUaW1lRGVsdGEnIGR0aW1lXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQxRiAgJ2lGcmFtZVJhdGUnIGZwc1xuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpQ2hhbm5lbFswXS50aW1lJyB0aW1lc1swXVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpQ2hhbm5lbFsxXS50aW1lJyB0aW1lc1sxXVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpQ2hhbm5lbFsyXS50aW1lJyB0aW1lc1syXVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpQ2hhbm5lbFszXS50aW1lJyB0aW1lc1szXVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50M0YgICdpQ2hhbm5lbFswXS5yZXNvbHV0aW9uJyByZXNvc1swXSwgcmVzb3NbMV0sIHJlc29zWzJdXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQzRiAgJ2lDaGFubmVsWzFdLnJlc29sdXRpb24nIHJlc29zWzNdLCByZXNvc1s0XSwgcmVzb3NbNV1cbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDNGICAnaUNoYW5uZWxbMl0ucmVzb2x1dGlvbicgcmVzb3NbNl0sIHJlc29zWzddLCByZXNvc1s4XVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50M0YgICdpQ2hhbm5lbFszXS5yZXNvbHV0aW9uJyByZXNvc1s5XSwgcmVzb3NbMTBdLCByZXNvc1sxMV1cbiAgICAgICAgbDEgPSBAbVJlbmRlcmVyLmdldEF0dHJpYkxvY2F0aW9uKEBtUHJvZ3JhbSwgJ3BvcycpXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0Vmlld3BvcnQgWyAwLCAwLCB4cmVzLCB5cmVzIF1cbiAgICAgICAgQG1SZW5kZXJlci5kcmF3RnVsbFNjcmVlblRyaWFuZ2xlX1hZIGwxXG4gICAgICAgIEBtUmVuZGVyZXIuZGV0dGFjaFRleHR1cmVzKClcbiAgICAgICAgcmV0dXJuXG4gICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwICAgICAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBzZXRVbmlmb3JtczogKGRhLCB0aW1lLCBkdGltZSwgZnBzLCB4cmVzLCB5cmVzLCBidWZmZXJzLCBjdWJlQnVmZmVycywga2V5Ym9hcmQpIC0+XG4gICAgICAgIHRpbWVzID0gWyAwIDAgMCAwIF1cbiAgICAgICAgZGF0ZXMgPSBbXG4gICAgICAgICAgICBkYS5nZXRGdWxsWWVhcigpXG4gICAgICAgICAgICBkYS5nZXRNb250aCgpXG4gICAgICAgICAgICBkYS5nZXREYXRlKClcbiAgICAgICAgICAgIGRhLmdldEhvdXJzKCkgKiA2MCAqIDYwICsgZGEuZ2V0TWludXRlcygpICogNjAgKyBkYS5nZXRTZWNvbmRzKCkgKyBkYS5nZXRNaWxsaXNlY29uZHMoKSAvIDEwMDBcbiAgICAgICAgXVxuICAgICAgICByZXNvcyA9IFsgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgXVxuICAgICAgICB0ZXhJRCA9IFsgbnVsbCBudWxsIG51bGwgbnVsbCBdXG4gICAgICAgIFxuICAgICAgICBmb3IgaSBpbiBbMC4uLkBtSW5wdXRzLmxlbmd0aF1cbiAgICAgICAgICAgIGlucCA9IEBtSW5wdXRzW2ldXG4gICAgICAgICAgICBpZiBpbnA/Lm1JbmZvLm1UeXBlID09ICd0ZXh0dXJlJ1xuICAgICAgICAgICAgICAgIGlmIGlucC5sb2FkZWQgPT0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB0ZXhJRFtpXSA9IGlucC5nbG9iamVjdFxuICAgICAgICAgICAgICAgICAgICByZXNvc1szICogaSArIDBdID0gaW5wLmltYWdlLndpZHRoXG4gICAgICAgICAgICAgICAgICAgIHJlc29zWzMgKiBpICsgMV0gPSBpbnAuaW1hZ2UuaGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgIHJlc29zWzMgKiBpICsgMl0gPSAxXG4gICAgICAgICAgICBlbHNlIGlmIGlucD8ubUluZm8ubVR5cGUgPT0gJ2tleWJvYXJkJ1xuICAgICAgICAgICAgICAgIHRleElEW2ldID0ga2V5Ym9hcmQubVRleHR1cmVcbiAgICAgICAgICAgIGVsc2UgaWYgaW5wPy5tSW5mby5tVHlwZSA9PSAnY3ViZW1hcCdcbiAgICAgICAgICAgICAgICBpZiBpbnAubG9hZGVkID09IHRydWVcbiAgICAgICAgICAgICAgICAgICAgaWQgPSBAbUVmZmVjdC5hc3NldElEX3RvX2N1YmVtYXBCdWZlcklEKGlucC5tSW5mby5tSUQpXG4gICAgICAgICAgICAgICAgICAgIGlmIGlkICE9IC0xXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXhJRFtpXSA9IGN1YmVCdWZmZXJzW2lkXS5tVGV4dHVyZVtjdWJlQnVmZmVyc1tpZF0ubUxhc3RSZW5kZXJEb25lXVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAwXSA9IGN1YmVCdWZmZXJzW2lkXS5tUmVzb2x1dGlvblswXVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAxXSA9IGN1YmVCdWZmZXJzW2lkXS5tUmVzb2x1dGlvblsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAyXSA9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgICMgaGFjay4gaW4gd2ViZ2wyLjAgd2UgaGF2ZSBzYW1wbGVycywgc28gd2UgZG9uJ3QgbmVlZCB0aGlzIGNyYXAgaGVyZVxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyID0gUmVuZGVyZXIuRklMVEVSLk5PTkVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGlucC5tSW5mby5tU2FtcGxlci5maWx0ZXIgPT0gJ2xpbmVhcidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXIgPSBSZW5kZXJlci5GSUxURVIuTElORUFSXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGlucC5tSW5mby5tU2FtcGxlci5maWx0ZXIgPT0gJ21pcG1hcCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXIgPSBSZW5kZXJlci5GSUxURVIuTUlQTUFQXG4gICAgICAgICAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLnNldFNhbXBsZXJGaWx0ZXIgdGV4SURbaV0sIGZpbHRlciwgZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4SURbaV0gPSBpbnAuZ2xvYmplY3RcbiAgICAgICAgICAgIGVsc2UgaWYgaW5wPy5tSW5mby5tVHlwZSA9PSAnYnVmZmVyJ1xuICAgICAgICAgICAgICAgIGlmIGlucC5sb2FkZWQgPT0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB0ZXhJRFtpXSA9IGJ1ZmZlcnNbaW5wLmlkXS5tVGV4dHVyZVtidWZmZXJzW2lucC5pZF0ubUxhc3RSZW5kZXJEb25lXVxuICAgICAgICAgICAgICAgICAgICByZXNvc1szICogaSArIDBdID0geHJlc1xuICAgICAgICAgICAgICAgICAgICByZXNvc1szICogaSArIDFdID0geXJlc1xuICAgICAgICAgICAgICAgICAgICByZXNvc1szICogaSArIDJdID0gMVxuXG4gICAgICAgIEBtUmVuZGVyZXIuYXR0YWNoVGV4dHVyZXMgNCwgdGV4SURbMF0sIHRleElEWzFdLCB0ZXhJRFsyXSwgdGV4SURbM11cbiAgICAgICAgQG1SZW5kZXJlci5hdHRhY2hTaGFkZXIgQG1Qcm9ncmFtXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQxRiAgJ2lUaW1lJyB0aW1lXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQzRiAgJ2lSZXNvbHV0aW9uJyB4cmVzLCB5cmVzLCAxLjBcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDRGViAnaU1vdXNlJyBAbVJlbmRlcmVyLmlNb3VzZVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50NEZWICdpRGF0ZScgZGF0ZXNcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDFGICAnaVNhbXBsZVJhdGUnIEBtU2FtcGxlUmF0ZVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlclRleHR1cmVVbml0ICdpQ2hhbm5lbDAnIDBcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJUZXh0dXJlVW5pdCAnaUNoYW5uZWwxJyAxXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyVGV4dHVyZVVuaXQgJ2lDaGFubmVsMicgMlxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlclRleHR1cmVVbml0ICdpQ2hhbm5lbDMnIDNcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDFJICAnaUZyYW1lJyBAbUZyYW1lXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQxRiAgJ2lUaW1lRGVsdGEnIGR0aW1lXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQxRiAgJ2lGcmFtZVJhdGUnIGZwc1xuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpQ2hhbm5lbFswXS50aW1lJyB0aW1lc1swXVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpQ2hhbm5lbFsxXS50aW1lJyB0aW1lc1sxXVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpQ2hhbm5lbFsyXS50aW1lJyB0aW1lc1syXVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpQ2hhbm5lbFszXS50aW1lJyB0aW1lc1szXVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50M0YgICdpQ2hhbm5lbFswXS5yZXNvbHV0aW9uJyByZXNvc1swXSwgcmVzb3NbMV0sIHJlc29zWzJdXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQzRiAgJ2lDaGFubmVsWzFdLnJlc29sdXRpb24nIHJlc29zWzNdLCByZXNvc1s0XSwgcmVzb3NbNV1cbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDNGICAnaUNoYW5uZWxbMl0ucmVzb2x1dGlvbicgcmVzb3NbNl0sIHJlc29zWzddLCByZXNvc1s4XVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50M0YgICdpQ2hhbm5lbFszXS5yZXNvbHV0aW9uJyByZXNvc1s5XSwgcmVzb3NbMTBdLCByZXNvc1sxMV1cbiAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIHByb2Nlc3NJbnB1dHM6ICh0aW1lLCBkdGltZSwgZnBzLCB4cmVzLCB5cmVzLCBidWZmZXJzLCBjdWJlQnVmZmVycywga2V5Ym9hcmQpIC0+XG4gICAgICAgIGkgPSAwXG4gICAgICAgIHdoaWxlIGkgPCBAbUlucHV0cy5sZW5ndGhcbiAgICAgICAgICAgIGlucCA9IEBtSW5wdXRzW2ldXG4gICAgICAgICAgICBpZiBpbnAgPT0gbnVsbFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgaW5wLm1JbmZvLm1UeXBlID09ICdidWZmZXInXG4gICAgICAgICAgICAgICAgaWYgaW5wLmxvYWRlZCA9PSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGlkID0gaW5wLmlkXG4gICAgICAgICAgICAgICAgICAgIHRleElEID0gYnVmZmVyc1tpZF0ubVRleHR1cmVbYnVmZmVyc1tpZF0ubUxhc3RSZW5kZXJEb25lXVxuICAgICAgICAgICAgICAgICAgICAjIGhhY2suIGluIHdlYmdsMi4wIHdlIGhhdmUgc2FtcGxlcnMsIHNvIHdlIGRvbid0IG5lZWQgdGhpcyBjcmFwIGhlcmVcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyID0gUmVuZGVyZXIuRklMVEVSLk5PTkVcbiAgICAgICAgICAgICAgICAgICAgaWYgaW5wLm1JbmZvLm1TYW1wbGVyLmZpbHRlciA9PSAnbGluZWFyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyID0gUmVuZGVyZXIuRklMVEVSLkxJTkVBUlxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGlucC5tSW5mby5tU2FtcGxlci5maWx0ZXIgPT0gJ21pcG1hcCdcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlciA9IFJlbmRlcmVyLkZJTFRFUi5NSVBNQVBcbiAgICAgICAgICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRTYW1wbGVyRmlsdGVyIHRleElELCBmaWx0ZXIsIGZhbHNlXG4gICAgICAgICAgICBpKytcbiAgICAgICAgcmV0dXJuXG4gICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgIFxuICAgIHBhaW50Q3ViZW1hcDogKGRhLCB0aW1lLCBkdGltZSwgZnBzLCB4cmVzLCB5cmVzLCBidWZmZXJzLCBjdWJlQnVmZmVycywga2V5Ym9hcmQsIGZhY2UpIC0+XG4gICAgICAgIFxuICAgICAgICBAcHJvY2Vzc0lucHV0cyBkYSwgdGltZSwgZHRpbWUsIGZwcywgeHJlcywgeXJlcywgYnVmZmVycywgY3ViZUJ1ZmZlcnMsIGtleWJvYXJkLCBmYWNlXG4gICAgICAgIEBzZXRVbmlmb3JtcyAgIGRhLCB0aW1lLCBkdGltZSwgZnBzLCB4cmVzLCB5cmVzLCBidWZmZXJzLCBjdWJlQnVmZmVycywga2V5Ym9hcmRcbiAgICAgICAgbDEgPSBAbVJlbmRlcmVyLmdldEF0dHJpYkxvY2F0aW9uIEBtUHJvZ3JhbSwgJ3BvcydcbiAgICAgICAgdnAgPSBbIDAsIDAsIHhyZXMsIHlyZXMgXVxuICAgICAgICBAbVJlbmRlcmVyLnNldFZpZXdwb3J0IHZwXG4gICAgICAgIEMgPSBzd2l0Y2ggZmFjZVxuICAgICAgICAgICAgd2hlbiAwIHRoZW4gWyAgMSAgMSAgMSAgMSAgMSAtMSAgMSAtMSAtMSAgMSAtMSAgMSAwIDAgMF1cbiAgICAgICAgICAgIHdoZW4gMSB0aGVuIFsgLTEgIDEgLTEgLTEgIDEgIDEgLTEgLTEgIDEgLTEgLTEgLTEgMCAwIDBdXG4gICAgICAgICAgICB3aGVuIDIgdGhlbiBbIC0xICAxIC0xICAxICAxIC0xICAxICAxICAxIC0xICAxICAxIDAgMCAwXVxuICAgICAgICAgICAgd2hlbiAzIHRoZW4gWyAtMSAtMSAgMSAgMSAtMSAgMSAgMSAtMSAtMSAtMSAtMSAtMSAwIDAgMF1cbiAgICAgICAgICAgIHdoZW4gNCB0aGVuIFsgLTEgIDEgIDEgIDEgIDEgIDEgIDEgLTEgIDEgLTEgLTEgIDEgMCAwIDBdXG4gICAgICAgICAgICBlbHNlICAgICAgICBbICAxICAxIC0xIC0xICAxIC0xIC0xIC0xIC0xICAxIC0xIC0xIDAgMCAwXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50M0ZWICd1bkNvcm5lcnMnIENcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDRGViAndW5WaWV3cG9ydCcgdnBcbiAgICAgICAgQG1SZW5kZXJlci5kcmF3VW5pdFF1YWRfWFkgbDFcbiAgICAgICAgQG1SZW5kZXJlci5kZXR0YWNoVGV4dHVyZXMoKVxuICAgIFxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHBhaW50OiAoZGEsIHRpbWUsIGR0aW1lLCBmcHMsIHhyZXMsIHlyZXMsIGlzUGF1c2VkLCBidWZmZXJJRCwgYnVmZmVyTmVlZHNNaW1hcHMsIGJ1ZmZlcnMsIGN1YmVCdWZmZXJzLCBrZXlib2FyZCwgZWZmZWN0KSAtPlxuICAgICAgICBpZiBAbVR5cGUgPT0gJ2ltYWdlJ1xuICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRSZW5kZXJUYXJnZXQgbnVsbFxuICAgICAgICAgICAgQHBhaW50SW1hZ2UgZGEsIHRpbWUsIGR0aW1lLCBmcHMsIHhyZXMsIHlyZXMsIGJ1ZmZlcnMsIGN1YmVCdWZmZXJzLCBrZXlib2FyZFxuICAgICAgICAgICAgQG1GcmFtZSsrXG4gICAgICAgIGVsc2UgaWYgQG1UeXBlID09ICdjb21tb24nXG4gICAgICAgICAgICAjY29uc29sZS5sb2coXCJyZW5kZXJpbmcgY29tbW9uXCIpO1xuICAgICAgICBlbHNlIGlmIEBtVHlwZSA9PSAnYnVmZmVyJ1xuICAgICAgICAgICAgQG1FZmZlY3QucmVzaXplQnVmZmVyIGJ1ZmZlcklELCBAbUVmZmVjdC5tWHJlcywgQG1FZmZlY3QubVlyZXMsIGZhbHNlXG4gICAgICAgICAgICBidWZmZXIgPSBidWZmZXJzW2J1ZmZlcklEXVxuICAgICAgICAgICAgZHN0SUQgPSAxIC0gKGJ1ZmZlci5tTGFzdFJlbmRlckRvbmUpXG4gICAgICAgICAgICBAbVJlbmRlcmVyLnNldFJlbmRlclRhcmdldCBidWZmZXIubVRhcmdldFtkc3RJRF1cbiAgICAgICAgICAgIEBwYWludEltYWdlIGRhLCB0aW1lLCBkdGltZSwgZnBzLCB4cmVzLCB5cmVzLCBidWZmZXJzLCBjdWJlQnVmZmVycywga2V5Ym9hcmRcblxuICAgICAgICAgICAgaWYgYnVmZmVyTmVlZHNNaW1hcHNcbiAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLmNyZWF0ZU1pcG1hcHMgYnVmZmVyLm1UZXh0dXJlW2RzdElEXVxuICAgICAgICAgICAgYnVmZmVyc1tidWZmZXJJRF0ubUxhc3RSZW5kZXJEb25lID0gMSAtIChidWZmZXJzW2J1ZmZlcklEXS5tTGFzdFJlbmRlckRvbmUpXG4gICAgICAgICAgICBAbUZyYW1lKytcbiAgICAgICAgZWxzZSBpZiBAbVR5cGUgPT0gJ2N1YmVtYXAnXG4gICAgICAgICAgICBAbUVmZmVjdC5yZXNpemVDdWJlbWFwQnVmZmVyIGJ1ZmZlcklELCAxMDI0LCAxMDI0LCBmYWxzZVxuICAgICAgICAgICAgYnVmZmVyID0gY3ViZUJ1ZmZlcnNbYnVmZmVySURdXG4gICAgICAgICAgICB4cmVzID0gYnVmZmVyLm1SZXNvbHV0aW9uWzBdXG4gICAgICAgICAgICB5cmVzID0gYnVmZmVyLm1SZXNvbHV0aW9uWzFdXG4gICAgICAgICAgICBkc3RJRCA9IDEgLSAoYnVmZmVyLm1MYXN0UmVuZGVyRG9uZSlcbiAgICAgICAgICAgIGZhY2UgPSAwXG4gICAgICAgICAgICB3aGlsZSBmYWNlIDwgNlxuICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0UmVuZGVyVGFyZ2V0Q3ViZU1hcCBidWZmZXIubVRhcmdldFtkc3RJRF0sIGZhY2VcbiAgICAgICAgICAgICAgICBAcGFpbnRDdWJlbWFwIGRhLCB0aW1lLCBkdGltZSwgZnBzLCB4cmVzLCB5cmVzLCBidWZmZXJzLCBjdWJlQnVmZmVycywga2V5Ym9hcmQsIGZhY2VcbiAgICAgICAgICAgICAgICBmYWNlKytcbiAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0UmVuZGVyVGFyZ2V0Q3ViZU1hcCBudWxsLCAwXG4gICAgICAgICAgICBpZiBidWZmZXJOZWVkc01pbWFwc1xuICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuY3JlYXRlTWlwbWFwcyBidWZmZXIubVRleHR1cmVbZHN0SURdXG4gICAgICAgICAgICBjdWJlQnVmZmVyc1tidWZmZXJJRF0ubUxhc3RSZW5kZXJEb25lID0gMSAtIChjdWJlQnVmZmVyc1tidWZmZXJJRF0ubUxhc3RSZW5kZXJEb25lKVxuICAgICAgICAgICAgQG1GcmFtZSsrXG4gICAgICAgIHJldHVyblxuICAgIFxubW9kdWxlLmV4cG9ydHMgPSBQYXNzIl19
//# sourceURL=../coffee/pass.coffee