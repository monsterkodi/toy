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
        this.mOutputs = [null, null, null, null];
        this.mSource = null;
        this.mType = 'image';
        this.mName = 'none';
        this.mCompile = 0;
        this.mFrame = 0;
    }

    Pass.prototype.bufferID_to_assetID = function(id) {
        switch (id) {
            case 0:
                return 'bufferA';
            case 1:
                return 'bufferB';
            case 2:
                return 'bufferC';
            case 3:
                return 'bufferD';
            default:
                klog("bufferID_to_assetID " + id + " -> none");
                return 'none';
        }
    };

    Pass.prototype.assetID_to_bufferID = function(id) {
        switch (id) {
            case 'bufferA':
                return 0;
            case 'bufferB':
                return 1;
            case 'bufferC':
                return 2;
            case 'bufferD':
                return 3;
            default:
                klog("assetID_to_bufferID " + id + " -> -1");
                return -1;
        }
    };

    Pass.prototype.assetID_to_cubemapBuferID = function(id) {
        return id !== '4dX3Rr' && -1 || 0;
    };

    Pass.prototype.cubamepBufferID_to_assetID = function(id) {
        return id === 0 && '4dX3Rr' || 'none';
    };

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
        this.header += "struct Channel\n{\n    vec3  resolution;\n    float time;\n};\nuniform Channel iChannel[4];\n\nvoid mainImage( out vec4 c,  in vec2 f );";
        return this.footer = "out vec4 outColor;\nvoid main( void )\n{\n    vec4 color = vec4(0.0,0.0,0.0,1.0);\n    mainImage(color, gl_FragCoord.xy);\n    color.w = 1.0;\n    outColor = color;\n}";
    };

    Pass.prototype.makeHeaderBuffer = function() {
        this.header = this.commonHeader();
        this.header += 'void mainImage( out vec4 c,  in vec2 f );\n';
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
        var fsSource, i, j, ref1, res, vsSource;
        vsSource = 'layout(location = 0) in vec2 pos; void main() { gl_Position = vec4(pos.xy,0.0,1.0); }';
        fsSource = this.header;
        for (i = j = 0, ref1 = commonShaderCodes.length; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
            fsSource += '\n' + commonShaderCodes[i] + '\n';
        }
        fsSource += shaderCode;
        fsSource += this.footer;
        res = this.mRenderer.createShader(vsSource, fsSource);
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
        var fsSource, i, res, vsSource;
        vsSource = 'layout(location = 0) in vec2 pos; void main() { gl_Position = vec4(pos.xy,0.0,1.0); }';
        fsSource = this.header;
        i = 0;
        while (i < commonShaderCodes.length) {
            fsSource += commonShaderCodes[i] + '\n';
            i++;
        }
        fsSource += shaderCode;
        fsSource += this.footer;
        res = this.mRenderer.createShader(vsSource, fsSource);
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
        var fsSource, res, vsSource;
        vsSource = 'layout(location = 0) in vec2 pos; void main() { gl_Position = vec4(pos.xy,0.0,1.0); }';
        fsSource = this.header + shaderCode + this.footer;
        res = this.mRenderer.createShader(vsSource, fsSource);
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
                if (assetID_to_cubemapBuferID(inp.mInfo.mID) === 0) {
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

    Pass.prototype.getTexture = function(slot) {
        var ref1;
        return (ref1 = this.mInputs[slot]) != null ? ref1.mInfo : void 0;
    };

    Pass.prototype.setOutputs = function(slot, id) {
        return this.mOutputs[slot] = id;
    };

    Pass.prototype.setOutputsByBufferID = function(slot, id) {
        if (this.mType === 'buffer') {
            this.mOutputs[slot] = this.bufferID_to_assetID(id);
            return this.mEffect.resizeBuffer(id, this.mEffect.mXres, this.mEffect.mYres, false);
        } else if (this.mType === 'cubemap') {
            this.mOutputs[slot] = this.cubamepBufferID_to_assetID(id);
            return this.mEffect.resizeCubemapBuffer(id, 1024, 1024);
        }
    };

    Pass.prototype.newTexture = function(slot, url, buffers, cubeBuffers, keyboard) {
        var i, n, numLoaded, returnValue, rti, texture;
        klog("newTexture " + slot, url);
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
                    var channels, rti;
                    klog('onload');
                    rti = _this.sampler2Renderer(url.mSampler);
                    channels = Renderer.TEXFMT.C4I8;
                    if (url.mID === 'Xdf3zn' || url.mID === '4sf3Rn' || url.mID === '4dXGzn' || url.mID === '4sf3Rr') {
                        channels = Renderer.TEXFMT.C1I8;
                    }
                    texture.globject = _this.mRenderer.createTextureFromImage(Renderer.TEXTYPE.T2D, texture.image, channels, rti.mFilter, rti.mWrap);
                    texture.loaded = true;
                };
            })(this);
            klog("texture.image.src " + url.mSrc);
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
            if (assetID_to_cubemapBuferID(url.mID) !== -1) {
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
            texture.id = this.assetID_to_bufferID(url.mID);
            texture.loaded = true;
            returnValue = {
                mFailed: false,
                mNeedsShaderCompile: this.mInputs[slot] === null || this.mInputs[slot].mInfo.mType !== 'texture' && this.mInputs[slot].mInfo.mType !== 'keyboard'
            };
            this.destroyInput(slot);
            this.mInputs[slot] = texture;
            this.mEffect.resizeBuffer(texture.id, this.mEffect.mXres, this.mEffect.mYres, false);
            this.setSamplerFilter(slot, 'linear', buffers, cubeBuffers, true);
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
                    id = assetID_to_cubemapBuferID(inp.mInfo.mID);
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
                    id = assetID_to_cubemapBuferID(inp.mInfo.mID);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFzcy5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBbUIsT0FBQSxDQUFRLEtBQVIsQ0FBbkIsRUFBRSxtQkFBRixFQUFVOztBQUNWLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFFTDtJQUVDLGNBQUMsU0FBRCxFQUFhLEdBQWIsRUFBbUIsT0FBbkI7UUFBQyxJQUFDLENBQUEsWUFBRDtRQUFZLElBQUMsQ0FBQSxNQUFEO1FBQU0sSUFBQyxDQUFBLFVBQUQ7UUFFbEIsSUFBQyxDQUFBLE9BQUQsR0FBWSxDQUFFLElBQUYsRUFBTyxJQUFQLEVBQVksSUFBWixFQUFpQixJQUFqQjtRQUNaLElBQUMsQ0FBQSxRQUFELEdBQVksQ0FBRSxJQUFGLEVBQU8sSUFBUCxFQUFZLElBQVosRUFBaUIsSUFBakI7UUFDWixJQUFDLENBQUEsT0FBRCxHQUFZO1FBQ1osSUFBQyxDQUFBLEtBQUQsR0FBWTtRQUNaLElBQUMsQ0FBQSxLQUFELEdBQVk7UUFDWixJQUFDLENBQUEsUUFBRCxHQUFZO1FBQ1osSUFBQyxDQUFBLE1BQUQsR0FBWTtJQVJiOzttQkFVSCxtQkFBQSxHQUFxQixTQUFDLEVBQUQ7QUFDVixnQkFBTyxFQUFQO0FBQUEsaUJBQ0UsQ0FERjt1QkFDUztBQURULGlCQUVFLENBRkY7dUJBRVM7QUFGVCxpQkFHRSxDQUhGO3VCQUdTO0FBSFQsaUJBSUUsQ0FKRjt1QkFJUztBQUpUO2dCQU1DLElBQUEsQ0FBSyxzQkFBQSxHQUF1QixFQUF2QixHQUEwQixVQUEvQjt1QkFDQTtBQVBEO0lBRFU7O21CQVVyQixtQkFBQSxHQUFxQixTQUFDLEVBQUQ7QUFDVixnQkFBTyxFQUFQO0FBQUEsaUJBQ0UsU0FERjt1QkFDaUI7QUFEakIsaUJBRUUsU0FGRjt1QkFFaUI7QUFGakIsaUJBR0UsU0FIRjt1QkFHaUI7QUFIakIsaUJBSUUsU0FKRjt1QkFJaUI7QUFK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QSxPQUFPLENBQUMsbUJBQVQsQ0FBNkIsUUFBN0IsRUFBdUMsSUFBdkMsRUFBNkMsSUFBN0MsRUFBbUQsS0FBbkQ7WUFDQSxNQUFBLEdBQVMsV0FBWSxDQUFBLFFBQUE7WUFDckIsSUFBQSxHQUFPLE1BQU0sQ0FBQyxXQUFZLENBQUEsQ0FBQTtZQUMxQixJQUFBLEdBQU8sTUFBTSxDQUFDLFdBQVksQ0FBQSxDQUFBO1lBQzFCLEtBQUEsR0FBUSxDQUFBLEdBQUssTUFBTSxDQUFDO1lBQ3BCLElBQUEsR0FBTztBQUNQLG1CQUFNLElBQUEsR0FBTyxDQUFiO2dCQUNJLElBQUMsQ0FBQSxTQUFTLENBQUMsc0JBQVgsQ0FBa0MsTUFBTSxDQUFDLE9BQVEsQ0FBQSxLQUFBLENBQWpELEVBQXlELElBQXpEO2dCQUNBLElBQUMsQ0FBQSxZQUFELENBQWMsRUFBZCxFQUFrQixJQUFsQixFQUF3QixLQUF4QixFQUErQixHQUEvQixFQUFvQyxJQUFwQyxFQUEwQyxJQUExQyxFQUFnRCxPQUFoRCxFQUF5RCxXQUF6RCxFQUFzRSxRQUF0RSxFQUFnRixJQUFoRjtnQkFDQSxJQUFBO1lBSEo7WUFJQSxJQUFDLENBQUEsU0FBUyxDQUFDLHNCQUFYLENBQWtDLElBQWxDLEVBQXdDLENBQXhDO1lBQ0EsSUFBRyxpQkFBSDtnQkFDSSxJQUFDLENBQUEsU0FBUyxDQUFDLGFBQVgsQ0FBeUIsTUFBTSxDQUFDLFFBQVMsQ0FBQSxLQUFBLENBQXpDLEVBREo7O1lBRUEsV0FBWSxDQUFBLFFBQUEsQ0FBUyxDQUFDLGVBQXRCLEdBQXdDLENBQUEsR0FBSyxXQUFZLENBQUEsUUFBQSxDQUFTLENBQUM7WUFDbkUsSUFBQyxDQUFBLE1BQUQsR0FmQzs7SUFsQkY7Ozs7OztBQW9DWCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbjAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuMDAwICAgICAgICAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgXG4wMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiMjI1xuXG57IGZpbHRlciwga2xvZyB9ID0gcmVxdWlyZSAna3hrJ1xuUmVuZGVyZXIgPSByZXF1aXJlICcuL3JlbmRlcmVyJ1xuXG5jbGFzcyBQYXNzXG4gICAgXG4gICAgQDogKEBtUmVuZGVyZXIsIEBtSUQsIEBtRWZmZWN0KSAtPlxuICAgICAgICBcbiAgICAgICAgQG1JbnB1dHMgID0gWyBudWxsIG51bGwgbnVsbCBudWxsIF1cbiAgICAgICAgQG1PdXRwdXRzID0gWyBudWxsIG51bGwgbnVsbCBudWxsIF1cbiAgICAgICAgQG1Tb3VyY2UgID0gbnVsbFxuICAgICAgICBAbVR5cGUgICAgPSAnaW1hZ2UnXG4gICAgICAgIEBtTmFtZSAgICA9ICdub25lJ1xuICAgICAgICBAbUNvbXBpbGUgPSAwXG4gICAgICAgIEBtRnJhbWUgICA9IDBcbiAgICAgICAgXG4gICAgYnVmZmVySURfdG9fYXNzZXRJRDogKGlkKSAtPlxuICAgICAgICByZXR1cm4gc3dpdGNoIGlkXG4gICAgICAgICAgICB3aGVuIDAgdGhlbiAnYnVmZmVyQScgIyc0ZFhHUjgnXG4gICAgICAgICAgICB3aGVuIDEgdGhlbiAnYnVmZmVyQicgIydYc1hHUjgnXG4gICAgICAgICAgICB3aGVuIDIgdGhlbiAnYnVmZmVyQycgIyc0c1hHUjgnXG4gICAgICAgICAgICB3aGVuIDMgdGhlbiAnYnVmZmVyRCcgIydYZGZHUjgnXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAga2xvZyBcImJ1ZmZlcklEX3RvX2Fzc2V0SUQgI3tpZH0gLT4gbm9uZVwiXG4gICAgICAgICAgICAgICAgJ25vbmUnXG4gICAgXG4gICAgYXNzZXRJRF90b19idWZmZXJJRDogKGlkKSAtPlxuICAgICAgICByZXR1cm4gc3dpdGNoIGlkXG4gICAgICAgICAgICB3aGVuICdidWZmZXJBJyB0aGVuIDBcbiAgICAgICAgICAgIHdoZW4gJ2J1ZmZlckInIHRoZW4gMVxuICAgICAgICAgICAgd2hlbiAnYnVmZmVyQycgdGhlbiAyXG4gICAgICAgICAgICB3aGVuICdidWZmZXJEJyB0aGVuIDNcbiAgICAgICAgICAgIGVsc2UgXG4gICAgICAgICAgICAgICAga2xvZyBcImFzc2V0SURfdG9fYnVmZmVySUQgI3tpZH0gLT4gLTFcIlxuICAgICAgICAgICAgICAgIC0xXG4gICAgXG4gICAgYXNzZXRJRF90b19jdWJlbWFwQnVmZXJJRDogKGlkKSAtPiBpZCAhPSAnNGRYM1JyJyBhbmQgLTEgb3IgMFxuICAgIGN1YmFtZXBCdWZmZXJJRF90b19hc3NldElEOiAoaWQpIC0+IGlkID09IDAgYW5kICc0ZFgzUnInIG9yICdub25lJ1xuICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBjb21tb25IZWFkZXI6IC0+XG4gICAgICAgIFxuICAgICAgICBoID0gXCJcIlwiXG4gICAgICAgICAgICAjZGVmaW5lIEhXX1BFUkZPUk1BTkNFIDFcbiAgICAgICAgICAgIHVuaWZvcm0gdmVjMyAgaVJlc29sdXRpb247XG4gICAgICAgICAgICB1bmlmb3JtIGZsb2F0IGlUaW1lO1xuICAgICAgICAgICAgdW5pZm9ybSBmbG9hdCBpQ2hhbm5lbFRpbWVbNF07XG4gICAgICAgICAgICB1bmlmb3JtIHZlYzQgIGlNb3VzZTtcbiAgICAgICAgICAgIHVuaWZvcm0gdmVjNCAgaURhdGU7XG4gICAgICAgICAgICB1bmlmb3JtIGZsb2F0IGlTYW1wbGVSYXRlO1xuICAgICAgICAgICAgdW5pZm9ybSB2ZWMzICBpQ2hhbm5lbFJlc29sdXRpb25bNF07XG4gICAgICAgICAgICB1bmlmb3JtIGludCAgIGlGcmFtZTtcbiAgICAgICAgICAgIHVuaWZvcm0gZmxvYXQgaVRpbWVEZWx0YTtcbiAgICAgICAgICAgIHVuaWZvcm0gZmxvYXQgaUZyYW1lUmF0ZTtcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICBmb3IgaSBpbiBbMC4uLkBtSW5wdXRzLmxlbmd0aF1cbiAgICAgICAgICAgIGggKz0gXCJ1bmlmb3JtIHNhbXBsZXIjeyBAbUlucHV0c1tpXT8ubUluZm8ubVR5cGUgPT0gJ2N1YmVtYXAnIGFuZCAnQ3ViZScgb3IgJzJEJyB9IGlDaGFubmVsI3tpfTtcXG5cIlxuICAgICAgICBoXG5cbiAgICBtYWtlSGVhZGVySW1hZ2U6IC0+XG4gICAgICAgIFxuICAgICAgICBAaGVhZGVyICA9IEBjb21tb25IZWFkZXIoKVxuICAgICAgICBAaGVhZGVyICs9IFwiXCJcIlxuICAgICAgICAgICAgc3RydWN0IENoYW5uZWxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB2ZWMzICByZXNvbHV0aW9uO1xuICAgICAgICAgICAgICAgIGZsb2F0IHRpbWU7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdW5pZm9ybSBDaGFubmVsIGlDaGFubmVsWzRdO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2b2lkIG1haW5JbWFnZSggb3V0IHZlYzQgYywgIGluIHZlYzIgZiApO1xuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgQGZvb3RlciA9IFwiXCJcIlxuICAgICAgICAgICAgb3V0IHZlYzQgb3V0Q29sb3I7XG4gICAgICAgICAgICB2b2lkIG1haW4oIHZvaWQgKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHZlYzQgY29sb3IgPSB2ZWM0KDAuMCwwLjAsMC4wLDEuMCk7XG4gICAgICAgICAgICAgICAgbWFpbkltYWdlKGNvbG9yLCBnbF9GcmFnQ29vcmQueHkpO1xuICAgICAgICAgICAgICAgIGNvbG9yLncgPSAxLjA7XG4gICAgICAgICAgICAgICAgb3V0Q29sb3IgPSBjb2xvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFwiXCJcIlxuICAgIFxuICAgIG1ha2VIZWFkZXJCdWZmZXI6IC0+XG4gICAgICAgIFxuICAgICAgICBAaGVhZGVyICA9IEBjb21tb25IZWFkZXIoKVxuICAgICAgICBAaGVhZGVyICs9ICd2b2lkIG1haW5JbWFnZSggb3V0IHZlYzQgYywgIGluIHZlYzIgZiApO1xcbidcbiAgICAgICAgXG4gICAgICAgIEBmb290ZXIgPSBcIlwiXCJcbiAgICAgICAgICAgIG91dCB2ZWM0IG91dENvbG9yO1xuICAgICAgICAgICAgdm9pZCBtYWluKCB2b2lkIClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB2ZWM0IGNvbG9yID0gdmVjNCgwLjAsMC4wLDAuMCwxLjApO1xuICAgICAgICAgICAgICAgIG1haW5JbWFnZSggY29sb3IsIGdsX0ZyYWdDb29yZC54eSApO1xuICAgICAgICAgICAgICAgIG91dENvbG9yID0gY29sb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcIlwiXCJcbiAgICBcbiAgICBtYWtlSGVhZGVyQ3ViZW1hcDogLT5cbiAgICAgICAgXG4gICAgICAgIEBoZWFkZXIgID0gQGNvbW1vbkhlYWRlcigpXG4gICAgICAgIEBoZWFkZXIgKz0gJ3ZvaWQgbWFpbkN1YmVtYXAoIG91dCB2ZWM0IGMsIGluIHZlYzIgZiwgaW4gdmVjMyBybywgaW4gdmVjMyByZCApO1xcbidcbiAgICAgICAgXG4gICAgICAgIEBmb290ZXIgID0gXCJcIlwiXG4gICAgICAgICAgICB1bmlmb3JtIHZlYzQgdW5WaWV3cG9ydDtcbiAgICAgICAgICAgIHVuaWZvcm0gdmVjMyB1bkNvcm5lcnNbNV07XG4gICAgICAgICAgICBvdXQgdmVjNCBvdXRDb2xvcjtcbiAgICAgICAgICAgIHZvaWQgbWFpbih2b2lkKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHZlYzQgY29sb3IgPSB2ZWM0KDAuMCwwLjAsMC4wLDEuMCk7XG4gICAgICAgICAgICAgICAgdmVjMyBybyA9IHVuQ29ybmVyc1s0XTtcbiAgICAgICAgICAgICAgICB2ZWMyIHV2ID0gKGdsX0ZyYWdDb29yZC54eSAtIHVuVmlld3BvcnQueHkpL3VuVmlld3BvcnQuenc7XG4gICAgICAgICAgICAgICAgdmVjMyByZCA9IG5vcm1hbGl6ZSggbWl4KCBtaXgoIHVuQ29ybmVyc1swXSwgdW5Db3JuZXJzWzFdLCB1di54ICksIG1peCggdW5Db3JuZXJzWzNdLCB1bkNvcm5lcnNbMl0sIHV2LnggKSwgdXYueSApIC0gcm8pO1xuICAgICAgICAgICAgICAgIG1haW5DdWJlbWFwKGNvbG9yLCBnbF9GcmFnQ29vcmQueHktdW5WaWV3cG9ydC54eSwgcm8sIHJkKTtcbiAgICAgICAgICAgICAgICBvdXRDb2xvciA9IGNvbG9yOyBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFwiXCJcIlxuICAgIFxuICAgIG1ha2VIZWFkZXJDb21tb246IC0+XG4gICAgICAgIEBoZWFkZXIgPSBcIlwiXCJcbiAgICAgICAgICAgIHVuaWZvcm0gdmVjNCAgICAgIGlEYXRlO1xuICAgICAgICAgICAgdW5pZm9ybSBmbG9hdCAgICAgaVNhbXBsZVJhdGU7XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgQGZvb3RlciAgPSBcIlwiXCJcbiAgICAgICAgICAgIG91dCB2ZWM0IG91dENvbG9yO1xuICAgICAgICAgICAgdm9pZCBtYWluKHZvaWQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgb3V0Q29sb3IgPSB2ZWM0KDAuMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcIlwiXCJcbiAgICBcbiAgICBtYWtlSGVhZGVyOiAtPlxuICAgICAgICBzd2l0Y2ggQG1UeXBlIFxuICAgICAgICAgICAgd2hlbiAnaW1hZ2UnICAgdGhlbiBAbWFrZUhlYWRlckltYWdlKClcbiAgICAgICAgICAgIHdoZW4gJ2J1ZmZlcicgIHRoZW4gQG1ha2VIZWFkZXJCdWZmZXIoKVxuICAgICAgICAgICAgd2hlbiAnY29tbW9uJyAgdGhlbiBAbWFrZUhlYWRlckNvbW1vbigpXG4gICAgICAgICAgICB3aGVuICdjdWJlbWFwJyB0aGVuIEBtYWtlSGVhZGVyQ3ViZW1hcCgpXG4gICAgICAgIFxuICAgIGNyZWF0ZTogKEBtVHlwZSwgQG1OYW1lKSAtPlxuICAgICAgICBAbVNvdXJjZSA9IG51bGxcbiAgICAgICAgQG1ha2VIZWFkZXIoKVxuICAgICAgICBpZiBAbVR5cGUgaW4gWydpbWFnZScgJ2J1ZmZlcicgJ2N1YmVtYXAnXVxuICAgICAgICAgICAgQG1Qcm9ncmFtID0gbnVsbFxuICAgIFxuICAgIGRlc3Ryb3k6IC0+IEBtU291cmNlID0gbnVsbFxuICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG5ld1NoYWRlcjogKHNoYWRlckNvZGUsIGNvbW1vblNvdXJjZUNvZGVzKSAtPlxuICAgICAgICBpZiBAbVJlbmRlcmVyID09IG51bGxcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIHRpbWVTdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpXG4gICAgICAgIHJlcyA9IG51bGxcbiAgICAgICAgaWYgQG1UeXBlID09ICdpbWFnZSdcbiAgICAgICAgICAgIHJlcyA9IEBuZXdTaGFkZXJJbWFnZShzaGFkZXJDb2RlLCBjb21tb25Tb3VyY2VDb2RlcylcbiAgICAgICAgZWxzZSBpZiBAbVR5cGUgPT0gJ2J1ZmZlcidcbiAgICAgICAgICAgIHJlcyA9IEBuZXdTaGFkZXJJbWFnZShzaGFkZXJDb2RlLCBjb21tb25Tb3VyY2VDb2RlcylcbiAgICAgICAgZWxzZSBpZiBAbVR5cGUgPT0gJ2NvbW1vbidcbiAgICAgICAgICAgIHJlcyA9IEBuZXdTaGFkZXJDb21tb24oc2hhZGVyQ29kZSlcbiAgICAgICAgZWxzZSBpZiBAbVR5cGUgPT0gJ2N1YmVtYXAnXG4gICAgICAgICAgICByZXMgPSBAbmV3U2hhZGVyQ3ViZW1hcChzaGFkZXJDb2RlLCBjb21tb25Tb3VyY2VDb2RlcylcbiAgICAgICAgZWxzZSBpZiBAbVR5cGUgPT0gJ2tleWJvYXJkJ1xuICAgICAgICAgICAgcmVzID0gbnVsbFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBlcnJvciBcInVua25vd24gdHlwZSAje0BtVHlwZX1cIlxuICAgICAgICBpZiByZXMgPT0gbnVsbFxuICAgICAgICAgICAgQG1Db21waWxlID0gcGVyZm9ybWFuY2Uubm93KCkgLSB0aW1lU3RhcnRcbiAgICAgICAgQG1Tb3VyY2UgPSBzaGFkZXJDb2RlXG4gICAgICAgIHJlc1xuICAgIFxuICAgICMgMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBuZXdTaGFkZXJJbWFnZTogKHNoYWRlckNvZGUsIGNvbW1vblNoYWRlckNvZGVzKSAtPlxuICAgICAgICBcbiAgICAgICAgdnNTb3VyY2UgPSAnbGF5b3V0KGxvY2F0aW9uID0gMCkgaW4gdmVjMiBwb3M7IHZvaWQgbWFpbigpIHsgZ2xfUG9zaXRpb24gPSB2ZWM0KHBvcy54eSwwLjAsMS4wKTsgfSdcbiAgICAgICAgZnNTb3VyY2UgPSBAaGVhZGVyXG4gICAgICAgIGZvciBpIGluIFswLi4uY29tbW9uU2hhZGVyQ29kZXMubGVuZ3RoXVxuICAgICAgICAgICAgZnNTb3VyY2UgKz0gJ1xcbicgKyBjb21tb25TaGFkZXJDb2Rlc1tpXSArICdcXG4nXG4gICAgICAgIGZzU291cmNlICs9IHNoYWRlckNvZGVcbiAgICAgICAgZnNTb3VyY2UgKz0gQGZvb3RlclxuICAgICAgICByZXMgPSBAbVJlbmRlcmVyLmNyZWF0ZVNoYWRlcih2c1NvdXJjZSwgZnNTb3VyY2UpXG4gICAgICAgIGlmIHJlcy5tUmVzdWx0ID09IGZhbHNlXG4gICAgICAgICAgICByZXR1cm4gcmVzLm1JbmZvXG4gICAgICAgIGlmIEBtUHJvZ3JhbSAhPSBudWxsXG4gICAgICAgICAgICBAbVJlbmRlcmVyLmRlc3Ryb3lTaGFkZXIgQG1Qcm9ncmFtXG4gICAgICAgIEBtUHJvZ3JhbSA9IHJlc1xuICAgICAgICBudWxsXG4gICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgIFxuICAgIG5ld1NoYWRlckN1YmVtYXA6IChzaGFkZXJDb2RlLCBjb21tb25TaGFkZXJDb2RlcykgLT5cbiAgICAgICAgXG4gICAgICAgIHZzU291cmNlID0gJ2xheW91dChsb2NhdGlvbiA9IDApIGluIHZlYzIgcG9zOyB2b2lkIG1haW4oKSB7IGdsX1Bvc2l0aW9uID0gdmVjNChwb3MueHksMC4wLDEuMCk7IH0nXG4gICAgICAgIGZzU291cmNlID0gQGhlYWRlclxuICAgICAgICBpID0gMFxuICAgICAgICB3aGlsZSBpIDwgY29tbW9uU2hhZGVyQ29kZXMubGVuZ3RoXG4gICAgICAgICAgICBmc1NvdXJjZSArPSBjb21tb25TaGFkZXJDb2Rlc1tpXSArICdcXG4nXG4gICAgICAgICAgICBpKytcbiAgICAgICAgZnNTb3VyY2UgKz0gc2hhZGVyQ29kZVxuICAgICAgICBmc1NvdXJjZSArPSBAZm9vdGVyXG4gICAgICAgIHJlcyA9IEBtUmVuZGVyZXIuY3JlYXRlU2hhZGVyKHZzU291cmNlLCBmc1NvdXJjZSlcbiAgICAgICAgaWYgcmVzLm1SZXN1bHQgPT0gZmFsc2VcbiAgICAgICAgICAgIHJldHVybiByZXMubUluZm9cbiAgICAgICAgaWYgQG1Qcm9ncmFtICE9IG51bGxcbiAgICAgICAgICAgIEBtUmVuZGVyZXIuZGVzdHJveVNoYWRlciBAbVByb2dyYW1cbiAgICAgICAgQG1Qcm9ncmFtID0gcmVzXG4gICAgICAgIG51bGxcbiAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG5ld1NoYWRlckNvbW1vbjogKHNoYWRlckNvZGUpIC0+XG4gICAgICAgIFxuICAgICAgICB2c1NvdXJjZSA9ICdsYXlvdXQobG9jYXRpb24gPSAwKSBpbiB2ZWMyIHBvczsgdm9pZCBtYWluKCkgeyBnbF9Qb3NpdGlvbiA9IHZlYzQocG9zLnh5LDAuMCwxLjApOyB9J1xuICAgICAgICBmc1NvdXJjZSA9IEBoZWFkZXIgKyBzaGFkZXJDb2RlICsgQGZvb3RlclxuICAgICAgICByZXMgPSBAbVJlbmRlcmVyLmNyZWF0ZVNoYWRlcih2c1NvdXJjZSwgZnNTb3VyY2UpXG4gICAgICAgIGlmIHJlcy5tUmVzdWx0ID09IGZhbHNlXG4gICAgICAgICAgICByZXR1cm4gcmVzLm1JbmZvXG4gICAgICAgIGlmIEBtUHJvZ3JhbSAhPSBudWxsXG4gICAgICAgICAgICBAbVJlbmRlcmVyLmRlc3Ryb3lTaGFkZXIgQG1Qcm9ncmFtXG4gICAgICAgIEBtUHJvZ3JhbSA9IHJlc1xuICAgICAgICBudWxsXG4gICAgICAgIFxuICAgIGRlc3Ryb3lJbnB1dDogKGlkKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQG1JbnB1dHNbaWRdXG4gICAgICAgICAgICBpZiBAbUlucHV0c1tpZF0ubUluZm8ubVR5cGUgaW4gWyd0ZXh0dXJlJyAnY3ViZW1hcCddXG4gICAgICAgICAgICAgICAgQG1SZW5kZXJlci5kZXN0cm95VGV4dHVyZSBAbUlucHV0c1tpZF0uZ2xvYmplY3RcbiAgICAgICAgICAgIEBtSW5wdXRzW2lkXSA9IG51bGxcbiAgICBcbiAgICBzYW1wbGVyMlJlbmRlcmVyOiAoc2FtcGxlcikgLT5cbiAgICAgICAgXG4gICAgICAgIGZpbHRlciA9IFJlbmRlcmVyLkZJTFRFUi5OT05FXG4gICAgICAgIGlmIHNhbXBsZXI/LmZpbHRlciA9PSAnbGluZWFyJyB0aGVuIGZpbHRlciA9IFJlbmRlcmVyLkZJTFRFUi5MSU5FQVJcbiAgICAgICAgaWYgc2FtcGxlcj8uZmlsdGVyID09ICdtaXBtYXAnIHRoZW4gZmlsdGVyID0gUmVuZGVyZXIuRklMVEVSLk1JUE1BUFxuICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIG1GaWx0ZXI6IGZpbHRlclxuICAgICAgICAgICAgbVdyYXA6ICAgc2FtcGxlcj8ud3JhcCAhPSAnY2xhbXAnIGFuZCBSZW5kZXJlci5URVhXUlAuUkVQRUFUIG9yIFJlbmRlcmVyLlRFWFdSUC5DTEFNUFxuICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAgICAgMDAwICAwMDAgICAgICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgc2V0U2FtcGxlckZpbHRlcjogKGlkLCBzdHIsIGJ1ZmZlcnMsIGN1YmVCdWZmZXJzKSAtPlxuICAgICAgICBcbiAgICAgICAgaW5wID0gQG1JbnB1dHNbaWRdXG4gICAgICAgIGZpbHRlciA9IFJlbmRlcmVyLkZJTFRFUi5OT05FXG4gICAgICAgIGlmIHN0ciA9PSAnbGluZWFyJ1xuICAgICAgICAgICAgZmlsdGVyID0gUmVuZGVyZXIuRklMVEVSLkxJTkVBUlxuICAgICAgICBpZiBzdHIgPT0gJ21pcG1hcCdcbiAgICAgICAgICAgIGZpbHRlciA9IFJlbmRlcmVyLkZJTFRFUi5NSVBNQVBcbiAgICAgICAgaWYgaW5wID09IG51bGxcbiAgICAgICAgZWxzZSBpZiBpbnAubUluZm8ubVR5cGUgPT0gJ3RleHR1cmUnXG4gICAgICAgICAgICBpZiBpbnAubG9hZGVkXG4gICAgICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRTYW1wbGVyRmlsdGVyIGlucC5nbG9iamVjdCwgZmlsdGVyLCB0cnVlXG4gICAgICAgICAgICAgICAgIyBpbnAubUluZm8ubVNhbXBsZXIuZmlsdGVyID0gc3RyXG4gICAgICAgIGVsc2UgaWYgaW5wLm1JbmZvLm1UeXBlID09ICdjdWJlbWFwJ1xuICAgICAgICAgICAgaWYgaW5wLmxvYWRlZFxuICAgICAgICAgICAgICAgIGlmIGFzc2V0SURfdG9fY3ViZW1hcEJ1ZmVySUQoaW5wLm1JbmZvLm1JRCkgPT0gMFxuICAgICAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLnNldFNhbXBsZXJGaWx0ZXIgY3ViZUJ1ZmZlcnNbaWRdLm1UZXh0dXJlWzBdLCBmaWx0ZXIsIHRydWVcbiAgICAgICAgICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRTYW1wbGVyRmlsdGVyIGN1YmVCdWZmZXJzW2lkXS5tVGV4dHVyZVsxXSwgZmlsdGVyLCB0cnVlXG4gICAgICAgICAgICAgICAgICAgICMgaW5wLm1JbmZvLm1TYW1wbGVyLmZpbHRlciA9IHN0clxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRTYW1wbGVyRmlsdGVyIGlucC5nbG9iamVjdCwgZmlsdGVyLCB0cnVlXG4gICAgICAgICAgICAgICAgICAgICMgaW5wLm1JbmZvLm1TYW1wbGVyLmZpbHRlciA9IHN0clxuICAgICAgICBlbHNlIGlmIGlucC5tSW5mby5tVHlwZSA9PSAnYnVmZmVyJ1xuICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRTYW1wbGVyRmlsdGVyIGJ1ZmZlcnNbaW5wLmlkXS5tVGV4dHVyZVswXSwgZmlsdGVyLCB0cnVlXG4gICAgICAgICAgICBAbVJlbmRlcmVyLnNldFNhbXBsZXJGaWx0ZXIgYnVmZmVyc1tpbnAuaWRdLm1UZXh0dXJlWzFdLCBmaWx0ZXIsIHRydWVcbiAgICAgICAgICAgICMgaW5wLm1JbmZvLm1TYW1wbGVyLmZpbHRlciA9IHN0clxuICAgICAgICAjIGVsc2UgaWYgaW5wLm1JbmZvLm1UeXBlID09ICdrZXlib2FyZCdcbiAgICAgICAgICAgICMgaW5wLm1JbmZvLm1TYW1wbGVyLmZpbHRlciA9IHN0clxuICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjIDAwICAgICAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgXG4gICAgc2V0U2FtcGxlcldyYXA6IChpZCwgc3RyLCBidWZmZXJzKSAtPlxuICAgICAgICBcbiAgICAgICAgaW5wID0gQG1JbnB1dHNbaWRdXG4gICAgICAgIHJlc3RyID0gUmVuZGVyZXIuVEVYV1JQLlJFUEVBVFxuICAgICAgICBpZiBzdHIgPT0gJ2NsYW1wJ1xuICAgICAgICAgICAgcmVzdHIgPSBSZW5kZXJlci5URVhXUlAuQ0xBTVBcbiAgICAgICAgaWYgaW5wPy5tSW5mby5tVHlwZSA9PSAndGV4dHVyZSdcbiAgICAgICAgICAgIGlmIGlucC5sb2FkZWRcbiAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLnNldFNhbXBsZXJXcmFwIGlucC5nbG9iamVjdCwgcmVzdHJcbiAgICAgICAgICAgICAgICAjIGlucC5tSW5mby5tU2FtcGxlci53cmFwID0gc3RyXG4gICAgICAgIGVsc2UgaWYgaW5wPy5tSW5mby5tVHlwZSA9PSAnY3ViZW1hcCdcbiAgICAgICAgICAgIGlmIGlucC5sb2FkZWRcbiAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLnNldFNhbXBsZXJXcmFwIGlucC5nbG9iamVjdCwgcmVzdHJcbiAgICAgICAgICAgICAgICAjIGlucC5tSW5mby5tU2FtcGxlci53cmFwID0gc3RyXG4gICAgICAgIGVsc2UgaWYgaW5wPy5tSW5mby5tVHlwZSA9PSAnYnVmZmVyJ1xuICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRTYW1wbGVyV3JhcCBidWZmZXJzW2lucC5pZF0ubVRleHR1cmVbMF0sIHJlc3RyXG4gICAgICAgICAgICBAbVJlbmRlcmVyLnNldFNhbXBsZXJXcmFwIGJ1ZmZlcnNbaW5wLmlkXS5tVGV4dHVyZVsxXSwgcmVzdHJcbiAgICAgICAgICAgICMgaW5wLm1JbmZvLm1TYW1wbGVyLndyYXAgPSBzdHJcbiAgICBcbiAgICBnZXRUZXh0dXJlOiAoc2xvdCkgLT4gQG1JbnB1dHNbc2xvdF0/Lm1JbmZvXG4gICAgXG4gICAgc2V0T3V0cHV0czogKHNsb3QsIGlkKSAtPiBAbU91dHB1dHNbc2xvdF0gPSBpZFxuICAgIFxuICAgIHNldE91dHB1dHNCeUJ1ZmZlcklEOiAoc2xvdCwgaWQpIC0+XG4gICAgICAgIGlmIEBtVHlwZSA9PSAnYnVmZmVyJ1xuICAgICAgICAgICAgQG1PdXRwdXRzW3Nsb3RdID0gQGJ1ZmZlcklEX3RvX2Fzc2V0SUQoaWQpXG4gICAgICAgICAgICBAbUVmZmVjdC5yZXNpemVCdWZmZXIgaWQsIEBtRWZmZWN0Lm1YcmVzLCBAbUVmZmVjdC5tWXJlcywgZmFsc2VcbiAgICAgICAgZWxzZSBpZiBAbVR5cGUgPT0gJ2N1YmVtYXAnXG4gICAgICAgICAgICBAbU91dHB1dHNbc2xvdF0gPSBAY3ViYW1lcEJ1ZmZlcklEX3RvX2Fzc2V0SUQoaWQpXG4gICAgICAgICAgICBAbUVmZmVjdC5yZXNpemVDdWJlbWFwQnVmZmVyIGlkLCAxMDI0LCAxMDI0XG4gICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG5ld1RleHR1cmU6IChzbG90LCB1cmwsIGJ1ZmZlcnMsIGN1YmVCdWZmZXJzLCBrZXlib2FyZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGtsb2cgXCJuZXdUZXh0dXJlICN7c2xvdH1cIiB1cmxcbiAgICAgICAgXG4gICAgICAgIHRleHR1cmUgPSBudWxsXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgdXJsPy5tVHlwZVxuICAgICAgICAgICAgQGRlc3Ryb3lJbnB1dCBzbG90XG4gICAgICAgICAgICBAbUlucHV0c1tzbG90XSA9IG51bGxcbiAgICAgICAgICAgIEBtYWtlSGVhZGVyKClcbiAgICAgICAgICAgIHJldHVybiBcbiAgICAgICAgICAgICAgICBtRmFpbGVkOiBmYWxzZVxuICAgICAgICAgICAgICAgIG1OZWVkc1NoYWRlckNvbXBpbGU6IGZhbHNlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGVsc2UgaWYgdXJsLm1UeXBlID09ICd0ZXh0dXJlJ1xuICAgICAgICAgICAgdGV4dHVyZSA9IHt9XG4gICAgICAgICAgICB0ZXh0dXJlLm1JbmZvID0gdXJsXG4gICAgICAgICAgICB0ZXh0dXJlLmdsb2JqZWN0ID0gbnVsbFxuICAgICAgICAgICAgdGV4dHVyZS5sb2FkZWQgPSBmYWxzZVxuICAgICAgICAgICAgdGV4dHVyZS5pbWFnZSA9IG5ldyBJbWFnZVxuICAgICAgICAgICAgdGV4dHVyZS5pbWFnZS5jcm9zc09yaWdpbiA9ICcnXG4gICAgXG4gICAgICAgICAgICB0ZXh0dXJlLmltYWdlLm9ubG9hZCA9ID0+XG4gICAgICAgICAgICAgICAga2xvZyAnb25sb2FkJ1xuICAgICAgICAgICAgICAgIHJ0aSA9IEBzYW1wbGVyMlJlbmRlcmVyIHVybC5tU2FtcGxlclxuICAgICAgICAgICAgICAgICMgTy5NLkcuIElRSVEgRklYIFRISVNcbiAgICAgICAgICAgICAgICBjaGFubmVscyA9IFJlbmRlcmVyLlRFWEZNVC5DNEk4XG4gICAgICAgICAgICAgICAgaWYgdXJsLm1JRCA9PSAnWGRmM3puJyBvciB1cmwubUlEID09ICc0c2YzUm4nIG9yIHVybC5tSUQgPT0gJzRkWEd6bicgb3IgdXJsLm1JRCA9PSAnNHNmM1JyJ1xuICAgICAgICAgICAgICAgICAgICBjaGFubmVscyA9IFJlbmRlcmVyLlRFWEZNVC5DMUk4XG4gICAgICAgICAgICAgICAgdGV4dHVyZS5nbG9iamVjdCA9IEBtUmVuZGVyZXIuY3JlYXRlVGV4dHVyZUZyb21JbWFnZShSZW5kZXJlci5URVhUWVBFLlQyRCwgdGV4dHVyZS5pbWFnZSwgY2hhbm5lbHMsIHJ0aS5tRmlsdGVyLCBydGkubVdyYXApXG4gICAgICAgICAgICAgICAgdGV4dHVyZS5sb2FkZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgXG4gICAgICAgICAgICBrbG9nIFwidGV4dHVyZS5pbWFnZS5zcmMgI3t1cmwubVNyY31cIlxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgdGV4dHVyZS5pbWFnZS5zcmMgPSB1cmwubVNyY1xuICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSBcbiAgICAgICAgICAgICAgICBtRmFpbGVkOiBmYWxzZVxuICAgICAgICAgICAgICAgIG1OZWVkc1NoYWRlckNvbXBpbGU6IEBtSW5wdXRzW3Nsb3RdID09IG51bGwgb3IgQG1JbnB1dHNbc2xvdF0ubUluZm8ubVR5cGUgIT0gJ3RleHR1cmUnIGFuZCBAbUlucHV0c1tzbG90XS5tSW5mby5tVHlwZSAhPSAna2V5Ym9hcmQnXG4gICAgICAgICAgICBAZGVzdHJveUlucHV0IHNsb3RcbiAgICAgICAgICAgIEBtSW5wdXRzW3Nsb3RdID0gdGV4dHVyZVxuICAgICAgICAgICAgQG1ha2VIZWFkZXIoKVxuICAgICAgICAgICAgcmV0dXJuIHJldHVyblZhbHVlXG4gICAgICAgICAgICBcbiAgICAgICAgZWxzZSBpZiB1cmwubVR5cGUgPT0gJ2N1YmVtYXAnXG4gICAgICAgICAgICB0ZXh0dXJlID0ge31cbiAgICAgICAgICAgIHRleHR1cmUubUluZm8gPSB1cmxcbiAgICAgICAgICAgIHRleHR1cmUuZ2xvYmplY3QgPSBudWxsXG4gICAgICAgICAgICB0ZXh0dXJlLmxvYWRlZCA9IGZhbHNlXG4gICAgICAgICAgICBydGkgPSBAc2FtcGxlcjJSZW5kZXJlciB1cmwubVNhbXBsZXJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgYXNzZXRJRF90b19jdWJlbWFwQnVmZXJJRCh1cmwubUlEKSAhPSAtMVxuICAgICAgICAgICAgICAgIHRleHR1cmUubUltYWdlID0gbmV3IEltYWdlXG4gICAgXG4gICAgICAgICAgICAgICAgdGV4dHVyZS5tSW1hZ2Uub25sb2FkID0gLT5cbiAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS5sb2FkZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgIFxuICAgICAgICAgICAgICAgIEBtRWZmZWN0LnJlc2l6ZUN1YmVtYXBCdWZmZXIgMCAxMDI0IDEwMjRcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0ZXh0dXJlLmltYWdlID0gW1xuICAgICAgICAgICAgICAgICAgICBuZXcgSW1hZ2VcbiAgICAgICAgICAgICAgICAgICAgbmV3IEltYWdlXG4gICAgICAgICAgICAgICAgICAgIG5ldyBJbWFnZVxuICAgICAgICAgICAgICAgICAgICBuZXcgSW1hZ2VcbiAgICAgICAgICAgICAgICAgICAgbmV3IEltYWdlXG4gICAgICAgICAgICAgICAgICAgIG5ldyBJbWFnZVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICBudW1Mb2FkZWQgPSAwXG4gICAgICAgICAgICAgICAgaSA9IDBcbiAgICAgICAgICAgICAgICB3aGlsZSBpIDwgNlxuICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlLmltYWdlW2ldLm1JZCA9IGlcbiAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS5pbWFnZVtpXS5jcm9zc09yaWdpbiA9ICcnXG4gICAgXG4gICAgICAgICAgICAgICAgICAgIHRleHR1cmUuaW1hZ2VbaV0ub25sb2FkID0gPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gQG1JZFxuICAgICAgICAgICAgICAgICAgICAgICAgbnVtTG9hZGVkKytcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIG51bUxvYWRlZCA9PSA2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS5nbG9iamVjdCA9IEBtUmVuZGVyZXIuY3JlYXRlVGV4dHVyZUZyb21JbWFnZShSZW5kZXJlci5URVhUWVBFLkNVQkVNQVAsIHRleHR1cmUuaW1hZ2UsIFJlbmRlcmVyLlRFWEZNVC5DNEk4LCBydGkubUZpbHRlciwgcnRpLm1XcmFwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHR1cmUubG9hZGVkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIGkgPT0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS5pbWFnZVtpXS5zcmMgPSB1cmwubVNyY1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBuID0gdXJsLm1TcmMubGFzdEluZGV4T2YoJy4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS5pbWFnZVtpXS5zcmMgPSB1cmwubVNyYy5zdWJzdHJpbmcoMCwgbikgKyAnXycgKyBpICsgdXJsLm1TcmMuc3Vic3RyaW5nKG4sIHVybC5tU3JjLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgaSsrXG4gICAgICAgICAgICByZXR1cm5WYWx1ZSA9IFxuICAgICAgICAgICAgICAgIG1GYWlsZWQ6IGZhbHNlXG4gICAgICAgICAgICAgICAgbU5lZWRzU2hhZGVyQ29tcGlsZTogQG1JbnB1dHNbc2xvdF0gPT0gbnVsbCBvciBAbUlucHV0c1tzbG90XS5tSW5mby5tVHlwZSAhPSAnY3ViZW1hcCdcbiAgICAgICAgICAgIEBkZXN0cm95SW5wdXQgc2xvdFxuICAgICAgICAgICAgQG1JbnB1dHNbc2xvdF0gPSB0ZXh0dXJlXG4gICAgICAgICAgICBAbWFrZUhlYWRlcigpXG4gICAgICAgICAgICByZXR1cm4gcmV0dXJuVmFsdWVcbiAgICAgICAgICAgIFxuICAgICAgICBlbHNlIGlmIHVybC5tVHlwZSA9PSAna2V5Ym9hcmQnXG4gICAgICAgICAgICB0ZXh0dXJlID0ge31cbiAgICAgICAgICAgIHRleHR1cmUubUluZm8gPSB1cmxcbiAgICAgICAgICAgIHRleHR1cmUuZ2xvYmplY3QgPSBudWxsXG4gICAgICAgICAgICB0ZXh0dXJlLmxvYWRlZCA9IHRydWVcbiAgICAgICAgICAgIHRleHR1cmUua2V5Ym9hcmQgPSB7fVxuICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSBcbiAgICAgICAgICAgICAgICBtRmFpbGVkOiBmYWxzZVxuICAgICAgICAgICAgICAgIG1OZWVkc1NoYWRlckNvbXBpbGU6IEBtSW5wdXRzW3Nsb3RdID09IG51bGwgb3IgQG1JbnB1dHNbc2xvdF0ubUluZm8ubVR5cGUgIT0gJ3RleHR1cmUnIGFuZCBAbUlucHV0c1tzbG90XS5tSW5mby5tVHlwZSAhPSAna2V5Ym9hcmQnXG4gICAgICAgICAgICBAZGVzdHJveUlucHV0IHNsb3RcbiAgICAgICAgICAgIEBtSW5wdXRzW3Nsb3RdID0gdGV4dHVyZVxuICAgICAgICAgICAgQG1ha2VIZWFkZXIoKVxuICAgICAgICAgICAgcmV0dXJuIHJldHVyblZhbHVlXG4gICAgICAgICAgICBcbiAgICAgICAgZWxzZSBpZiB1cmwubVR5cGUgPT0gJ2J1ZmZlcidcbiAgICAgICAgICAgIHRleHR1cmUgPSB7fVxuICAgICAgICAgICAgdGV4dHVyZS5tSW5mbyA9IHVybFxuICAgICAgICAgICAgdGV4dHVyZS5pbWFnZSA9IG5ldyBJbWFnZVxuICAgICAgICAgICAgdGV4dHVyZS5pbWFnZS5zcmMgPSB1cmwubVNyY1xuICAgICAgICAgICAgdGV4dHVyZS5pZCA9IEBhc3NldElEX3RvX2J1ZmZlcklEKHVybC5tSUQpXG4gICAgICAgICAgICB0ZXh0dXJlLmxvYWRlZCA9IHRydWVcbiAgICAgICAgICAgIHJldHVyblZhbHVlID0gXG4gICAgICAgICAgICAgICAgbUZhaWxlZDogZmFsc2VcbiAgICAgICAgICAgICAgICBtTmVlZHNTaGFkZXJDb21waWxlOiBAbUlucHV0c1tzbG90XSA9PSBudWxsIG9yIEBtSW5wdXRzW3Nsb3RdLm1JbmZvLm1UeXBlICE9ICd0ZXh0dXJlJyBhbmQgQG1JbnB1dHNbc2xvdF0ubUluZm8ubVR5cGUgIT0gJ2tleWJvYXJkJ1xuICAgICAgICAgICAgQGRlc3Ryb3lJbnB1dCBzbG90XG4gICAgICAgICAgICBAbUlucHV0c1tzbG90XSA9IHRleHR1cmVcbiAgICAgICAgICAgIEBtRWZmZWN0LnJlc2l6ZUJ1ZmZlciB0ZXh0dXJlLmlkLCBAbUVmZmVjdC5tWHJlcywgQG1FZmZlY3QubVlyZXMsIGZhbHNlXG5cbiAgICAgICAgICAgIEBzZXRTYW1wbGVyRmlsdGVyIHNsb3QsICdsaW5lYXInIGJ1ZmZlcnMsIGN1YmVCdWZmZXJzLCB0cnVlXG4gICAgICAgICAgICAjIEBzZXRTYW1wbGVyVkZsaXAgc2xvdCwgdXJsLm1TYW1wbGVyLnZmbGlwXG4gICAgICAgICAgICAjIEBzZXRTYW1wbGVyV3JhcCBzbG90LCB1cmwubVNhbXBsZXIud3JhcCwgYnVmZmVyc1xuICAgICAgICAgICAgQHNldFNhbXBsZXJXcmFwIHNsb3QsICdjbGFtcCcgYnVmZmVyc1xuICAgICAgICAgICAgQG1ha2VIZWFkZXIoKVxuICAgICAgICAgICAgcmV0dXJuIHJldHVyblZhbHVlXG4gICAgICAgICAgICBcbiAgICAgICAgZXJyb3IgXCJpbnB1dCB0eXBlIGVycm9yOiAje3VybC5tVHlwZX1cIlxuICAgICAgICByZXR1cm4gbUZhaWxlZDp0cnVlXG4gICAgXG4gICAgIyAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIHBhaW50SW1hZ2U6IChkYSwgdGltZSwgZHRpbWUsIGZwcywgeHJlcywgeXJlcywgYnVmZmVycywgY3ViZUJ1ZmZlcnMsIGtleWJvYXJkKSAtPlxuICAgICAgICBcbiAgICAgICAgdGltZXMgPSBbIDAgMCAwIDAgXVxuICAgICAgICBkYXRlcyA9IFtcbiAgICAgICAgICAgIGRhLmdldEZ1bGxZZWFyKClcbiAgICAgICAgICAgIGRhLmdldE1vbnRoKClcbiAgICAgICAgICAgIGRhLmdldERhdGUoKVxuICAgICAgICAgICAgZGEuZ2V0SG91cnMoKSAqIDYwLjAgKiA2MCArIGRhLmdldE1pbnV0ZXMoKSAqIDYwICsgZGEuZ2V0U2Vjb25kcygpICsgZGEuZ2V0TWlsbGlzZWNvbmRzKCkgLyAxMDAwLjBcbiAgICAgICAgXVxuICAgICAgICByZXNvcyA9IFsgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgXVxuICAgICAgICB0ZXhJRCA9IFsgbnVsbCBudWxsIG51bGwgbnVsbCBdXG4gICAgICAgIGkgPSAwXG4gICAgICAgIHdoaWxlIGkgPCBAbUlucHV0cy5sZW5ndGhcbiAgICAgICAgICAgIGlucCA9IEBtSW5wdXRzW2ldXG4gICAgICAgICAgICBpZiBpbnAgPT0gbnVsbFxuICAgICAgICAgICAgZWxzZSBpZiBpbnAubUluZm8ubVR5cGUgPT0gJ3RleHR1cmUnXG4gICAgICAgICAgICAgICAgaWYgaW5wLmxvYWRlZCA9PSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIHRleElEW2ldID0gaW5wLmdsb2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIHJlc29zWzMgKiBpICsgMF0gPSBpbnAuaW1hZ2Uud2lkdGhcbiAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAxXSA9IGlucC5pbWFnZS5oZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAyXSA9IDFcbiAgICAgICAgICAgIGVsc2UgaWYgaW5wLm1JbmZvLm1UeXBlID09ICdrZXlib2FyZCdcbiAgICAgICAgICAgICAgICB0ZXhJRFtpXSA9IGtleWJvYXJkLm1UZXh0dXJlXG4gICAgICAgICAgICBlbHNlIGlmIGlucC5tSW5mby5tVHlwZSA9PSAnY3ViZW1hcCdcbiAgICAgICAgICAgICAgICBpZiBpbnAubG9hZGVkID09IHRydWVcbiAgICAgICAgICAgICAgICAgICAgaWQgPSBhc3NldElEX3RvX2N1YmVtYXBCdWZlcklEKGlucC5tSW5mby5tSUQpXG4gICAgICAgICAgICAgICAgICAgIGlmIGlkICE9IC0xXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXhJRFtpXSA9IGN1YmVCdWZmZXJzW2lkXS5tVGV4dHVyZVtjdWJlQnVmZmVyc1tpZF0ubUxhc3RSZW5kZXJEb25lXVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAwXSA9IGN1YmVCdWZmZXJzW2lkXS5tUmVzb2x1dGlvblswXVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAxXSA9IGN1YmVCdWZmZXJzW2lkXS5tUmVzb2x1dGlvblsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAyXSA9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0U2FtcGxlckZpbHRlciB0ZXhJRFtpXSwgaW5wLm1JbmZvLm1TYW1wbGVyPy5maWx0ZXIgPyBSZW5kZXJlci5GSUxURVIuTUlQTUFQLCBmYWxzZVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXhJRFtpXSA9IGlucC5nbG9iamVjdFxuICAgICAgICAgICAgZWxzZSBpZiBpbnAubUluZm8ubVR5cGUgPT0gJ2J1ZmZlcidcbiAgICAgICAgICAgICAgICBpZiBpbnAubG9hZGVkID09IHRydWVcbiAgICAgICAgICAgICAgICAgICAgaWQgPSBpbnAuaWRcbiAgICAgICAgICAgICAgICAgICAgdGV4SURbaV0gPSBidWZmZXJzW2lkXS5tVGV4dHVyZVtidWZmZXJzW2lkXS5tTGFzdFJlbmRlckRvbmVdXG4gICAgICAgICAgICAgICAgICAgIHJlc29zWzMgKiBpICsgMF0gPSB4cmVzXG4gICAgICAgICAgICAgICAgICAgIHJlc29zWzMgKiBpICsgMV0gPSB5cmVzXG4gICAgICAgICAgICAgICAgICAgIHJlc29zWzMgKiBpICsgMl0gPSAxXG4gICAgICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0U2FtcGxlckZpbHRlciB0ZXhJRFtpXSwgaW5wLm1JbmZvLm1TYW1wbGVyPy5maWx0ZXIgPyBSZW5kZXJlci5GSUxURVIuTElORUFSLCBmYWxzZVxuICAgICAgICAgICAgaSsrXG4gICAgICAgIEBtUmVuZGVyZXIuYXR0YWNoVGV4dHVyZXMgNCwgdGV4SURbMF0sIHRleElEWzFdLCB0ZXhJRFsyXSwgdGV4SURbM11cbiAgICAgICAgcHJvZyA9IEBtUHJvZ3JhbVxuICAgICAgICBAbVJlbmRlcmVyLmF0dGFjaFNoYWRlciBwcm9nXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQxRiAgJ2lUaW1lJyB0aW1lXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQzRiAgJ2lSZXNvbHV0aW9uJyB4cmVzLCB5cmVzLCAxLjBcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDRGViAnaU1vdXNlJyBAbVJlbmRlcmVyLmlNb3VzZVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50NEZWICdpRGF0ZScgZGF0ZXNcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDFGICAnaVNhbXBsZVJhdGUnIEBtU2FtcGxlUmF0ZVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlclRleHR1cmVVbml0ICdpQ2hhbm5lbDAnIDBcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJUZXh0dXJlVW5pdCAnaUNoYW5uZWwxJyAxXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyVGV4dHVyZVVuaXQgJ2lDaGFubmVsMicgMlxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlclRleHR1cmVVbml0ICdpQ2hhbm5lbDMnIDNcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDFJICAnaUZyYW1lJyBAbUZyYW1lXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQxRiAgJ2lUaW1lRGVsdGEnIGR0aW1lXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQxRiAgJ2lGcmFtZVJhdGUnIGZwc1xuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpQ2hhbm5lbFswXS50aW1lJyB0aW1lc1swXVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpQ2hhbm5lbFsxXS50aW1lJyB0aW1lc1sxXVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpQ2hhbm5lbFsyXS50aW1lJyB0aW1lc1syXVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpQ2hhbm5lbFszXS50aW1lJyB0aW1lc1szXVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50M0YgICdpQ2hhbm5lbFswXS5yZXNvbHV0aW9uJyByZXNvc1swXSwgcmVzb3NbMV0sIHJlc29zWzJdXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQzRiAgJ2lDaGFubmVsWzFdLnJlc29sdXRpb24nIHJlc29zWzNdLCByZXNvc1s0XSwgcmVzb3NbNV1cbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDNGICAnaUNoYW5uZWxbMl0ucmVzb2x1dGlvbicgcmVzb3NbNl0sIHJlc29zWzddLCByZXNvc1s4XVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50M0YgICdpQ2hhbm5lbFszXS5yZXNvbHV0aW9uJyByZXNvc1s5XSwgcmVzb3NbMTBdLCByZXNvc1sxMV1cbiAgICAgICAgbDEgPSBAbVJlbmRlcmVyLmdldEF0dHJpYkxvY2F0aW9uKEBtUHJvZ3JhbSwgJ3BvcycpXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0Vmlld3BvcnQgWyAwLCAwLCB4cmVzLCB5cmVzIF1cbiAgICAgICAgQG1SZW5kZXJlci5kcmF3RnVsbFNjcmVlblRyaWFuZ2xlX1hZIGwxXG4gICAgICAgIEBtUmVuZGVyZXIuZGV0dGFjaFRleHR1cmVzKClcbiAgICAgICAgcmV0dXJuXG4gICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwICAgICAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgICAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBzZXRVbmlmb3JtczogKGRhLCB0aW1lLCBkdGltZSwgZnBzLCB4cmVzLCB5cmVzLCBidWZmZXJzLCBjdWJlQnVmZmVycywga2V5Ym9hcmQpIC0+XG4gICAgICAgIHRpbWVzID0gWyAwIDAgMCAwIF1cbiAgICAgICAgZGF0ZXMgPSBbXG4gICAgICAgICAgICBkYS5nZXRGdWxsWWVhcigpXG4gICAgICAgICAgICBkYS5nZXRNb250aCgpXG4gICAgICAgICAgICBkYS5nZXREYXRlKClcbiAgICAgICAgICAgIGRhLmdldEhvdXJzKCkgKiA2MCAqIDYwICsgZGEuZ2V0TWludXRlcygpICogNjAgKyBkYS5nZXRTZWNvbmRzKCkgKyBkYS5nZXRNaWxsaXNlY29uZHMoKSAvIDEwMDBcbiAgICAgICAgXVxuICAgICAgICByZXNvcyA9IFsgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgXVxuICAgICAgICB0ZXhJRCA9IFsgbnVsbCBudWxsIG51bGwgbnVsbCBdXG4gICAgICAgIFxuICAgICAgICBmb3IgaSBpbiBbMC4uLkBtSW5wdXRzLmxlbmd0aF1cbiAgICAgICAgICAgIGlucCA9IEBtSW5wdXRzW2ldXG4gICAgICAgICAgICBpZiBpbnA/Lm1JbmZvLm1UeXBlID09ICd0ZXh0dXJlJ1xuICAgICAgICAgICAgICAgIGlmIGlucC5sb2FkZWQgPT0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB0ZXhJRFtpXSA9IGlucC5nbG9iamVjdFxuICAgICAgICAgICAgICAgICAgICByZXNvc1szICogaSArIDBdID0gaW5wLmltYWdlLndpZHRoXG4gICAgICAgICAgICAgICAgICAgIHJlc29zWzMgKiBpICsgMV0gPSBpbnAuaW1hZ2UuaGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgIHJlc29zWzMgKiBpICsgMl0gPSAxXG4gICAgICAgICAgICBlbHNlIGlmIGlucD8ubUluZm8ubVR5cGUgPT0gJ2tleWJvYXJkJ1xuICAgICAgICAgICAgICAgIHRleElEW2ldID0ga2V5Ym9hcmQubVRleHR1cmVcbiAgICAgICAgICAgIGVsc2UgaWYgaW5wPy5tSW5mby5tVHlwZSA9PSAnY3ViZW1hcCdcbiAgICAgICAgICAgICAgICBpZiBpbnAubG9hZGVkID09IHRydWVcbiAgICAgICAgICAgICAgICAgICAgaWQgPSBhc3NldElEX3RvX2N1YmVtYXBCdWZlcklEKGlucC5tSW5mby5tSUQpXG4gICAgICAgICAgICAgICAgICAgIGlmIGlkICE9IC0xXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXhJRFtpXSA9IGN1YmVCdWZmZXJzW2lkXS5tVGV4dHVyZVtjdWJlQnVmZmVyc1tpZF0ubUxhc3RSZW5kZXJEb25lXVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAwXSA9IGN1YmVCdWZmZXJzW2lkXS5tUmVzb2x1dGlvblswXVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAxXSA9IGN1YmVCdWZmZXJzW2lkXS5tUmVzb2x1dGlvblsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAyXSA9IDFcbiAgICAgICAgICAgICAgICAgICAgICAgICMgaGFjay4gaW4gd2ViZ2wyLjAgd2UgaGF2ZSBzYW1wbGVycywgc28gd2UgZG9uJ3QgbmVlZCB0aGlzIGNyYXAgaGVyZVxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyID0gUmVuZGVyZXIuRklMVEVSLk5PTkVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIGlucC5tSW5mby5tU2FtcGxlci5maWx0ZXIgPT0gJ2xpbmVhcidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXIgPSBSZW5kZXJlci5GSUxURVIuTElORUFSXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGlucC5tSW5mby5tU2FtcGxlci5maWx0ZXIgPT0gJ21pcG1hcCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXIgPSBSZW5kZXJlci5GSUxURVIuTUlQTUFQXG4gICAgICAgICAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLnNldFNhbXBsZXJGaWx0ZXIgdGV4SURbaV0sIGZpbHRlciwgZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4SURbaV0gPSBpbnAuZ2xvYmplY3RcbiAgICAgICAgICAgIGVsc2UgaWYgaW5wPy5tSW5mby5tVHlwZSA9PSAnYnVmZmVyJ1xuICAgICAgICAgICAgICAgIGlmIGlucC5sb2FkZWQgPT0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB0ZXhJRFtpXSA9IGJ1ZmZlcnNbaW5wLmlkXS5tVGV4dHVyZVtidWZmZXJzW2lucC5pZF0ubUxhc3RSZW5kZXJEb25lXVxuICAgICAgICAgICAgICAgICAgICByZXNvc1szICogaSArIDBdID0geHJlc1xuICAgICAgICAgICAgICAgICAgICByZXNvc1szICogaSArIDFdID0geXJlc1xuICAgICAgICAgICAgICAgICAgICByZXNvc1szICogaSArIDJdID0gMVxuXG4gICAgICAgIEBtUmVuZGVyZXIuYXR0YWNoVGV4dHVyZXMgNCwgdGV4SURbMF0sIHRleElEWzFdLCB0ZXhJRFsyXSwgdGV4SURbM11cbiAgICAgICAgQG1SZW5kZXJlci5hdHRhY2hTaGFkZXIgQG1Qcm9ncmFtXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQxRiAgJ2lUaW1lJyB0aW1lXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQzRiAgJ2lSZXNvbHV0aW9uJyB4cmVzLCB5cmVzLCAxLjBcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDRGViAnaU1vdXNlJyBAbVJlbmRlcmVyLmlNb3VzZVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50NEZWICdpRGF0ZScgZGF0ZXNcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDFGICAnaVNhbXBsZVJhdGUnIEBtU2FtcGxlUmF0ZVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlclRleHR1cmVVbml0ICdpQ2hhbm5lbDAnIDBcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJUZXh0dXJlVW5pdCAnaUNoYW5uZWwxJyAxXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyVGV4dHVyZVVuaXQgJ2lDaGFubmVsMicgMlxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlclRleHR1cmVVbml0ICdpQ2hhbm5lbDMnIDNcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDFJICAnaUZyYW1lJyBAbUZyYW1lXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQxRiAgJ2lUaW1lRGVsdGEnIGR0aW1lXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQxRiAgJ2lGcmFtZVJhdGUnIGZwc1xuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpQ2hhbm5lbFswXS50aW1lJyB0aW1lc1swXVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpQ2hhbm5lbFsxXS50aW1lJyB0aW1lc1sxXVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpQ2hhbm5lbFsyXS50aW1lJyB0aW1lc1syXVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpQ2hhbm5lbFszXS50aW1lJyB0aW1lc1szXVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50M0YgICdpQ2hhbm5lbFswXS5yZXNvbHV0aW9uJyByZXNvc1swXSwgcmVzb3NbMV0sIHJlc29zWzJdXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQzRiAgJ2lDaGFubmVsWzFdLnJlc29sdXRpb24nIHJlc29zWzNdLCByZXNvc1s0XSwgcmVzb3NbNV1cbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDNGICAnaUNoYW5uZWxbMl0ucmVzb2x1dGlvbicgcmVzb3NbNl0sIHJlc29zWzddLCByZXNvc1s4XVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50M0YgICdpQ2hhbm5lbFszXS5yZXNvbHV0aW9uJyByZXNvc1s5XSwgcmVzb3NbMTBdLCByZXNvc1sxMV1cbiAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIHByb2Nlc3NJbnB1dHM6ICh0aW1lLCBkdGltZSwgZnBzLCB4cmVzLCB5cmVzLCBidWZmZXJzLCBjdWJlQnVmZmVycywga2V5Ym9hcmQpIC0+XG4gICAgICAgIGkgPSAwXG4gICAgICAgIHdoaWxlIGkgPCBAbUlucHV0cy5sZW5ndGhcbiAgICAgICAgICAgIGlucCA9IEBtSW5wdXRzW2ldXG4gICAgICAgICAgICBpZiBpbnAgPT0gbnVsbFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgaWYgaW5wLm1JbmZvLm1UeXBlID09ICdidWZmZXInXG4gICAgICAgICAgICAgICAgaWYgaW5wLmxvYWRlZCA9PSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGlkID0gaW5wLmlkXG4gICAgICAgICAgICAgICAgICAgIHRleElEID0gYnVmZmVyc1tpZF0ubVRleHR1cmVbYnVmZmVyc1tpZF0ubUxhc3RSZW5kZXJEb25lXVxuICAgICAgICAgICAgICAgICAgICAjIGhhY2suIGluIHdlYmdsMi4wIHdlIGhhdmUgc2FtcGxlcnMsIHNvIHdlIGRvbid0IG5lZWQgdGhpcyBjcmFwIGhlcmVcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyID0gUmVuZGVyZXIuRklMVEVSLk5PTkVcbiAgICAgICAgICAgICAgICAgICAgaWYgaW5wLm1JbmZvLm1TYW1wbGVyLmZpbHRlciA9PSAnbGluZWFyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyID0gUmVuZGVyZXIuRklMVEVSLkxJTkVBUlxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIGlucC5tSW5mby5tU2FtcGxlci5maWx0ZXIgPT0gJ21pcG1hcCdcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlciA9IFJlbmRlcmVyLkZJTFRFUi5NSVBNQVBcbiAgICAgICAgICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRTYW1wbGVyRmlsdGVyIHRleElELCBmaWx0ZXIsIGZhbHNlXG4gICAgICAgICAgICBpKytcbiAgICAgICAgcmV0dXJuXG4gICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgIFxuICAgIHBhaW50Q3ViZW1hcDogKGRhLCB0aW1lLCBkdGltZSwgZnBzLCB4cmVzLCB5cmVzLCBidWZmZXJzLCBjdWJlQnVmZmVycywga2V5Ym9hcmQsIGZhY2UpIC0+XG4gICAgICAgIFxuICAgICAgICBAcHJvY2Vzc0lucHV0cyBkYSwgdGltZSwgZHRpbWUsIGZwcywgeHJlcywgeXJlcywgYnVmZmVycywgY3ViZUJ1ZmZlcnMsIGtleWJvYXJkLCBmYWNlXG4gICAgICAgIEBzZXRVbmlmb3JtcyAgIGRhLCB0aW1lLCBkdGltZSwgZnBzLCB4cmVzLCB5cmVzLCBidWZmZXJzLCBjdWJlQnVmZmVycywga2V5Ym9hcmRcbiAgICAgICAgbDEgPSBAbVJlbmRlcmVyLmdldEF0dHJpYkxvY2F0aW9uIEBtUHJvZ3JhbSwgJ3BvcydcbiAgICAgICAgdnAgPSBbIDAsIDAsIHhyZXMsIHlyZXMgXVxuICAgICAgICBAbVJlbmRlcmVyLnNldFZpZXdwb3J0IHZwXG4gICAgICAgIEMgPSBzd2l0Y2ggZmFjZVxuICAgICAgICAgICAgd2hlbiAwIHRoZW4gWyAgMSAgMSAgMSAgMSAgMSAtMSAgMSAtMSAtMSAgMSAtMSAgMSAwIDAgMF1cbiAgICAgICAgICAgIHdoZW4gMSB0aGVuIFsgLTEgIDEgLTEgLTEgIDEgIDEgLTEgLTEgIDEgLTEgLTEgLTEgMCAwIDBdXG4gICAgICAgICAgICB3aGVuIDIgdGhlbiBbIC0xICAxIC0xICAxICAxIC0xICAxICAxICAxIC0xICAxICAxIDAgMCAwXVxuICAgICAgICAgICAgd2hlbiAzIHRoZW4gWyAtMSAtMSAgMSAgMSAtMSAgMSAgMSAtMSAtMSAtMSAtMSAtMSAwIDAgMF1cbiAgICAgICAgICAgIHdoZW4gNCB0aGVuIFsgLTEgIDEgIDEgIDEgIDEgIDEgIDEgLTEgIDEgLTEgLTEgIDEgMCAwIDBdXG4gICAgICAgICAgICBlbHNlICAgICAgICBbICAxICAxIC0xIC0xICAxIC0xIC0xIC0xIC0xICAxIC0xIC0xIDAgMCAwXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50M0ZWICd1bkNvcm5lcnMnIENcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDRGViAndW5WaWV3cG9ydCcgdnBcbiAgICAgICAgQG1SZW5kZXJlci5kcmF3VW5pdFF1YWRfWFkgbDFcbiAgICAgICAgQG1SZW5kZXJlci5kZXR0YWNoVGV4dHVyZXMoKVxuICAgIFxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHBhaW50OiAoZGEsIHRpbWUsIGR0aW1lLCBmcHMsIHhyZXMsIHlyZXMsIGlzUGF1c2VkLCBidWZmZXJJRCwgYnVmZmVyTmVlZHNNaW1hcHMsIGJ1ZmZlcnMsIGN1YmVCdWZmZXJzLCBrZXlib2FyZCwgZWZmZWN0KSAtPlxuICAgICAgICBpZiBAbVR5cGUgPT0gJ2ltYWdlJ1xuICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRSZW5kZXJUYXJnZXQgbnVsbFxuICAgICAgICAgICAgQHBhaW50SW1hZ2UgZGEsIHRpbWUsIGR0aW1lLCBmcHMsIHhyZXMsIHlyZXMsIGJ1ZmZlcnMsIGN1YmVCdWZmZXJzLCBrZXlib2FyZFxuICAgICAgICAgICAgQG1GcmFtZSsrXG4gICAgICAgIGVsc2UgaWYgQG1UeXBlID09ICdjb21tb24nXG4gICAgICAgICAgICAjY29uc29sZS5sb2coXCJyZW5kZXJpbmcgY29tbW9uXCIpO1xuICAgICAgICBlbHNlIGlmIEBtVHlwZSA9PSAnYnVmZmVyJ1xuICAgICAgICAgICAgQG1FZmZlY3QucmVzaXplQnVmZmVyIGJ1ZmZlcklELCBAbUVmZmVjdC5tWHJlcywgQG1FZmZlY3QubVlyZXMsIGZhbHNlXG4gICAgICAgICAgICBidWZmZXIgPSBidWZmZXJzW2J1ZmZlcklEXVxuICAgICAgICAgICAgZHN0SUQgPSAxIC0gKGJ1ZmZlci5tTGFzdFJlbmRlckRvbmUpXG4gICAgICAgICAgICBAbVJlbmRlcmVyLnNldFJlbmRlclRhcmdldCBidWZmZXIubVRhcmdldFtkc3RJRF1cbiAgICAgICAgICAgIEBwYWludEltYWdlIGRhLCB0aW1lLCBkdGltZSwgZnBzLCB4cmVzLCB5cmVzLCBidWZmZXJzLCBjdWJlQnVmZmVycywga2V5Ym9hcmRcblxuICAgICAgICAgICAgaWYgYnVmZmVyTmVlZHNNaW1hcHNcbiAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLmNyZWF0ZU1pcG1hcHMgYnVmZmVyLm1UZXh0dXJlW2RzdElEXVxuICAgICAgICAgICAgYnVmZmVyc1tidWZmZXJJRF0ubUxhc3RSZW5kZXJEb25lID0gMSAtIChidWZmZXJzW2J1ZmZlcklEXS5tTGFzdFJlbmRlckRvbmUpXG4gICAgICAgICAgICBAbUZyYW1lKytcbiAgICAgICAgZWxzZSBpZiBAbVR5cGUgPT0gJ2N1YmVtYXAnXG4gICAgICAgICAgICBAbUVmZmVjdC5yZXNpemVDdWJlbWFwQnVmZmVyIGJ1ZmZlcklELCAxMDI0LCAxMDI0LCBmYWxzZVxuICAgICAgICAgICAgYnVmZmVyID0gY3ViZUJ1ZmZlcnNbYnVmZmVySURdXG4gICAgICAgICAgICB4cmVzID0gYnVmZmVyLm1SZXNvbHV0aW9uWzBdXG4gICAgICAgICAgICB5cmVzID0gYnVmZmVyLm1SZXNvbHV0aW9uWzFdXG4gICAgICAgICAgICBkc3RJRCA9IDEgLSAoYnVmZmVyLm1MYXN0UmVuZGVyRG9uZSlcbiAgICAgICAgICAgIGZhY2UgPSAwXG4gICAgICAgICAgICB3aGlsZSBmYWNlIDwgNlxuICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0UmVuZGVyVGFyZ2V0Q3ViZU1hcCBidWZmZXIubVRhcmdldFtkc3RJRF0sIGZhY2VcbiAgICAgICAgICAgICAgICBAcGFpbnRDdWJlbWFwIGRhLCB0aW1lLCBkdGltZSwgZnBzLCB4cmVzLCB5cmVzLCBidWZmZXJzLCBjdWJlQnVmZmVycywga2V5Ym9hcmQsIGZhY2VcbiAgICAgICAgICAgICAgICBmYWNlKytcbiAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0UmVuZGVyVGFyZ2V0Q3ViZU1hcCBudWxsLCAwXG4gICAgICAgICAgICBpZiBidWZmZXJOZWVkc01pbWFwc1xuICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuY3JlYXRlTWlwbWFwcyBidWZmZXIubVRleHR1cmVbZHN0SURdXG4gICAgICAgICAgICBjdWJlQnVmZmVyc1tidWZmZXJJRF0ubUxhc3RSZW5kZXJEb25lID0gMSAtIChjdWJlQnVmZmVyc1tidWZmZXJJRF0ubUxhc3RSZW5kZXJEb25lKVxuICAgICAgICAgICAgQG1GcmFtZSsrXG4gICAgICAgIHJldHVyblxuICAgIFxubW9kdWxlLmV4cG9ydHMgPSBQYXNzIl19
//# sourceURL=../coffee/pass.coffee