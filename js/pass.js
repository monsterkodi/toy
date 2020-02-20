// koffee 1.7.0

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
            texture = {};
            texture.mInfo = url;
            texture.image = new Image;
            texture.image.src = url.mSrc;
            texture.id = this.mEffect.assetID_to_bufferID(url.mID);
            klog("newTexture 'buffer' " + slot, url, texture.id);
            texture.loaded = true;
            returnValue = {
                mFailed: false,
                mNeedsShaderCompile: this.mInputs[slot] === null || this.mInputs[slot].mInfo.mType !== 'texture' && this.mInputs[slot].mInfo.mType !== 'keyboard'
            };
            klog("newTexture 'buffer' " + slot, returnValue);
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
        this.mRenderer.setShaderConstant1FV('iChannelTime', times);
        this.mRenderer.setShaderConstant3FV('iChannelResolution', resos);

        /*
        @mRenderer.setShaderConstant1F  'iChannel[0].time' times[0]
        @mRenderer.setShaderConstant1F  'iChannel[1].time' times[1]
        @mRenderer.setShaderConstant1F  'iChannel[2].time' times[2]
        @mRenderer.setShaderConstant1F  'iChannel[3].time' times[3]
        @mRenderer.setShaderConstant3F  'iChannel[0].resolution' resos[0], resos[1],  resos[2]
        @mRenderer.setShaderConstant3F  'iChannel[1].resolution' resos[3], resos[4],  resos[5]
        @mRenderer.setShaderConstant3F  'iChannel[2].resolution' resos[6], resos[7],  resos[8]
        @mRenderer.setShaderConstant3F  'iChannel[3].resolution' resos[9], resos[10], resos[11]
         */
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
        this.mRenderer.setShaderConstant1FV('iChannelTime', times);
        return this.mRenderer.setShaderConstant3FV('iChannelResolution', resos);

        /*       
        @mRenderer.setShaderConstant1F  'iChannel[0].time' times[0]
        @mRenderer.setShaderConstant1F  'iChannel[1].time' times[1]
        @mRenderer.setShaderConstant1F  'iChannel[2].time' times[2]
        @mRenderer.setShaderConstant1F  'iChannel[3].time' times[3]
        @mRenderer.setShaderConstant3F  'iChannel[0].resolution' resos[0], resos[1], resos[2]
        @mRenderer.setShaderConstant3F  'iChannel[1].resolution' resos[3], resos[4], resos[5]
        @mRenderer.setShaderConstant3F  'iChannel[2].resolution' resos[6], resos[7], resos[8]
        @mRenderer.setShaderConstant3F  'iChannel[3].resolution' resos[9], resos[10], resos[11]
         */
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFzcy5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBbUIsT0FBQSxDQUFRLEtBQVIsQ0FBbkIsRUFBRSxtQkFBRixFQUFVOztBQUNWLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFFTDtJQUVDLGNBQUMsU0FBRCxFQUFhLEdBQWIsRUFBbUIsT0FBbkI7UUFBQyxJQUFDLENBQUEsWUFBRDtRQUFZLElBQUMsQ0FBQSxNQUFEO1FBQU0sSUFBQyxDQUFBLFVBQUQ7UUFFbEIsSUFBQyxDQUFBLE9BQUQsR0FBWSxDQUFFLElBQUYsRUFBTyxJQUFQLEVBQVksSUFBWixFQUFpQixJQUFqQjtRQUNaLElBQUMsQ0FBQSxPQUFELEdBQVk7UUFDWixJQUFDLENBQUEsT0FBRCxHQUFZO1FBQ1osSUFBQyxDQUFBLEtBQUQsR0FBWTtRQUNaLElBQUMsQ0FBQSxLQUFELEdBQVk7UUFDWixJQUFDLENBQUEsUUFBRCxHQUFZO1FBQ1osSUFBQyxDQUFBLE1BQUQsR0FBWTtJQVJiOzttQkFnQkgsWUFBQSxHQUFjLFNBQUE7QUFFVixZQUFBO1FBQUEsQ0FBQSxHQUFJO0FBYUosYUFBUyxpR0FBVDtZQUNJLENBQUEsSUFBSyxpQkFBQSxHQUFpQix5Q0FBYSxDQUFFLEtBQUssQ0FBQyxlQUFuQixLQUE0QixTQUE1QixJQUEwQyxNQUExQyxJQUFvRCxJQUF0RCxDQUFqQixHQUE2RSxXQUE3RSxHQUF3RixDQUF4RixHQUEwRjtBQURuRztlQUVBO0lBakJVOzttQkFtQmQsZUFBQSxHQUFpQixTQUFBO1FBRWIsSUFBQyxDQUFBLE1BQUQsR0FBVyxJQUFDLENBQUEsWUFBRCxDQUFBO1FBQ1gsSUFBQyxDQUFBLE1BQUQsSUFBVztlQVdYLElBQUMsQ0FBQSxNQUFELEdBQVU7SUFkRzs7bUJBeUJqQixnQkFBQSxHQUFrQixTQUFBO1FBRWQsSUFBQyxDQUFBLE1BQUQsR0FBVyxJQUFD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QztZQUNuRSxJQUFDLENBQUEsTUFBRCxHQWZDOztJQW5CRjs7Ozs7O0FBcUNYLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4wMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICBcbjAwMCAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuIyMjXG5cbnsgZmlsdGVyLCBrbG9nIH0gPSByZXF1aXJlICdreGsnXG5SZW5kZXJlciA9IHJlcXVpcmUgJy4vcmVuZGVyZXInXG5cbmNsYXNzIFBhc3NcbiAgICBcbiAgICBAOiAoQG1SZW5kZXJlciwgQG1JRCwgQG1FZmZlY3QpIC0+XG4gICAgICAgIFxuICAgICAgICBAbUlucHV0cyAgPSBbIG51bGwgbnVsbCBudWxsIG51bGwgXVxuICAgICAgICBAbU91dHB1dCAgPSBudWxsXG4gICAgICAgIEBtU291cmNlICA9IG51bGxcbiAgICAgICAgQG1UeXBlICAgID0gJ2ltYWdlJ1xuICAgICAgICBAbU5hbWUgICAgPSAnbm9uZSdcbiAgICAgICAgQG1Db21waWxlID0gMFxuICAgICAgICBAbUZyYW1lICAgPSAwXG4gICAgICAgICAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgY29tbW9uSGVhZGVyOiAtPlxuICAgICAgICBcbiAgICAgICAgaCA9IFwiXCJcIlxuICAgICAgICAgICAgI2RlZmluZSBIV19QRVJGT1JNQU5DRSAxXG4gICAgICAgICAgICB1bmlmb3JtIHZlYzMgIGlSZXNvbHV0aW9uO1xuICAgICAgICAgICAgdW5pZm9ybSBmbG9hdCBpVGltZTtcbiAgICAgICAgICAgIHVuaWZvcm0gZmxvYXQgaUNoYW5uZWxUaW1lWzRdO1xuICAgICAgICAgICAgdW5pZm9ybSB2ZWM0ICBpTW91c2U7XG4gICAgICAgICAgICB1bmlmb3JtIHZlYzQgIGlEYXRlO1xuICAgICAgICAgICAgdW5pZm9ybSBmbG9hdCBpU2FtcGxlUmF0ZTtcbiAgICAgICAgICAgIHVuaWZvcm0gdmVjMyAgaUNoYW5uZWxSZXNvbHV0aW9uWzRdO1xuICAgICAgICAgICAgdW5pZm9ybSBpbnQgICBpRnJhbWU7XG4gICAgICAgICAgICB1bmlmb3JtIGZsb2F0IGlUaW1lRGVsdGE7XG4gICAgICAgICAgICB1bmlmb3JtIGZsb2F0IGlGcmFtZVJhdGU7XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5AbUlucHV0cy5sZW5ndGhdXG4gICAgICAgICAgICBoICs9IFwidW5pZm9ybSBzYW1wbGVyI3sgQG1JbnB1dHNbaV0/Lm1JbmZvLm1UeXBlID09ICdjdWJlbWFwJyBhbmQgJ0N1YmUnIG9yICcyRCcgfSBpQ2hhbm5lbCN7aX07XFxuXCJcbiAgICAgICAgaFxuXG4gICAgbWFrZUhlYWRlckltYWdlOiAtPlxuICAgICAgICBcbiAgICAgICAgQGhlYWRlciAgPSBAY29tbW9uSGVhZGVyKClcbiAgICAgICAgQGhlYWRlciArPSBcIlwiXCJcbiAgICAgICAgICAgIHN0cnVjdCBDaGFubmVsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdmVjMyAgcmVzb2x1dGlvbjtcbiAgICAgICAgICAgICAgICBmbG9hdCB0aW1lO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHVuaWZvcm0gQ2hhbm5lbCBpQ2hhbm5lbFs0XTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdm9pZCBtYWluSW1hZ2Uob3V0IHZlYzQgYywgaW4gdmVjMiBmKTtcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIEBmb290ZXIgPSBcIlwiXCJcbiAgICAgICAgICAgIG91dCB2ZWM0IG91dENvbG9yO1xuICAgICAgICAgICAgdm9pZCBtYWluKCB2b2lkIClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB2ZWM0IGNvbG9yID0gdmVjNCgwLjAsMC4wLDAuMCwxLjApO1xuICAgICAgICAgICAgICAgIG1haW5JbWFnZShjb2xvciwgZ2xfRnJhZ0Nvb3JkLnh5KTtcbiAgICAgICAgICAgICAgICBjb2xvci53ID0gMS4wO1xuICAgICAgICAgICAgICAgIG91dENvbG9yID0gY29sb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcIlwiXCJcbiAgICBcbiAgICBtYWtlSGVhZGVyQnVmZmVyOiAtPlxuICAgICAgICBcbiAgICAgICAgQGhlYWRlciAgPSBAY29tbW9uSGVhZGVyKClcbiAgICAgICAgQGhlYWRlciArPSAndm9pZCBtYWluSW1hZ2Uob3V0IHZlYzQgYywgaW4gdmVjMiBmKTtcXG4nXG4gICAgICAgIFxuICAgICAgICBAZm9vdGVyID0gXCJcIlwiXG4gICAgICAgICAgICBvdXQgdmVjNCBvdXRDb2xvcjtcbiAgICAgICAgICAgIHZvaWQgbWFpbiggdm9pZCApXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdmVjNCBjb2xvciA9IHZlYzQoMC4wLDAuMCwwLjAsMS4wKTtcbiAgICAgICAgICAgICAgICBtYWluSW1hZ2UoIGNvbG9yLCBnbF9GcmFnQ29vcmQueHkgKTtcbiAgICAgICAgICAgICAgICBvdXRDb2xvciA9IGNvbG9yO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXCJcIlwiXG4gICAgXG4gICAgbWFrZUhlYWRlckN1YmVtYXA6IC0+XG4gICAgICAgIFxuICAgICAgICBAaGVhZGVyICA9IEBjb21tb25IZWFkZXIoKVxuICAgICAgICBAaGVhZGVyICs9ICd2b2lkIG1haW5DdWJlbWFwKCBvdXQgdmVjNCBjLCBpbiB2ZWMyIGYsIGluIHZlYzMgcm8sIGluIHZlYzMgcmQgKTtcXG4nXG4gICAgICAgIFxuICAgICAgICBAZm9vdGVyICA9IFwiXCJcIlxuICAgICAgICAgICAgdW5pZm9ybSB2ZWM0IHVuVmlld3BvcnQ7XG4gICAgICAgICAgICB1bmlmb3JtIHZlYzMgdW5Db3JuZXJzWzVdO1xuICAgICAgICAgICAgb3V0IHZlYzQgb3V0Q29sb3I7XG4gICAgICAgICAgICB2b2lkIG1haW4odm9pZClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB2ZWM0IGNvbG9yID0gdmVjNCgwLjAsMC4wLDAuMCwxLjApO1xuICAgICAgICAgICAgICAgIHZlYzMgcm8gPSB1bkNvcm5lcnNbNF07XG4gICAgICAgICAgICAgICAgdmVjMiB1diA9IChnbF9GcmFnQ29vcmQueHkgLSB1blZpZXdwb3J0Lnh5KS91blZpZXdwb3J0Lnp3O1xuICAgICAgICAgICAgICAgIHZlYzMgcmQgPSBub3JtYWxpemUoIG1peCggbWl4KCB1bkNvcm5lcnNbMF0sIHVuQ29ybmVyc1sxXSwgdXYueCApLCBtaXgoIHVuQ29ybmVyc1szXSwgdW5Db3JuZXJzWzJdLCB1di54ICksIHV2LnkgKSAtIHJvKTtcbiAgICAgICAgICAgICAgICBtYWluQ3ViZW1hcChjb2xvciwgZ2xfRnJhZ0Nvb3JkLnh5LXVuVmlld3BvcnQueHksIHJvLCByZCk7XG4gICAgICAgICAgICAgICAgb3V0Q29sb3IgPSBjb2xvcjsgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcIlwiXCJcbiAgICBcbiAgICBtYWtlSGVhZGVyQ29tbW9uOiAtPlxuICAgICAgICBAaGVhZGVyID0gXCJcIlwiXG4gICAgICAgICAgICB1bmlmb3JtIHZlYzQgICAgICBpRGF0ZTtcbiAgICAgICAgICAgIHVuaWZvcm0gZmxvYXQgICAgIGlTYW1wbGVSYXRlO1xuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgIEBmb290ZXIgID0gXCJcIlwiXG4gICAgICAgICAgICBvdXQgdmVjNCBvdXRDb2xvcjtcbiAgICAgICAgICAgIHZvaWQgbWFpbih2b2lkKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG91dENvbG9yID0gdmVjNCgwLjApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXCJcIlwiXG4gICAgXG4gICAgbWFrZUhlYWRlcjogLT5cbiAgICAgICAgc3dpdGNoIEBtVHlwZSBcbiAgICAgICAgICAgIHdoZW4gJ2ltYWdlJyAgIHRoZW4gQG1ha2VIZWFkZXJJbWFnZSgpXG4gICAgICAgICAgICB3aGVuICdidWZmZXInICB0aGVuIEBtYWtlSGVhZGVyQnVmZmVyKClcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1vbicgIHRoZW4gQG1ha2VIZWFkZXJDb21tb24oKVxuICAgICAgICAgICAgd2hlbiAnY3ViZW1hcCcgdGhlbiBAbWFrZUhlYWRlckN1YmVtYXAoKVxuICAgICAgICBcbiAgICBjcmVhdGU6IChAbVR5cGUsIEBtTmFtZSkgLT5cbiAgICAgICAgQG1Tb3VyY2UgPSBudWxsXG4gICAgICAgIEBtYWtlSGVhZGVyKClcbiAgICAgICAgaWYgQG1UeXBlIGluIFsnaW1hZ2UnICdidWZmZXInICdjdWJlbWFwJ11cbiAgICAgICAgICAgIEBtUHJvZ3JhbSA9IG51bGxcbiAgICBcbiAgICBkZXN0cm95OiAtPiBAbVNvdXJjZSA9IG51bGxcbiAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBuZXdTaGFkZXI6IChzaGFkZXJDb2RlLCBjb21tb25Tb3VyY2VDb2RlcykgLT5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAbVJlbmRlcmVyXG4gICAgICAgICAgICBcbiAgICAgICAgdGltZVN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KClcblxuICAgICAgICBzd2l0Y2ggQG1UeXBlXG4gICAgICAgICAgICB3aGVuICdpbWFnZScgJ2J1ZmZlcidcbiAgICAgICAgICAgICAgICBlcnIgPSBAbmV3U2hhZGVySW1hZ2Ugc2hhZGVyQ29kZSwgY29tbW9uU291cmNlQ29kZXNcbiAgICAgICAgICAgIHdoZW4gJ2NvbW1vbidcbiAgICAgICAgICAgICAgICBlcnIgPSBAbmV3U2hhZGVyQ29tbW9uIHNoYWRlckNvZGVcbiAgICAgICAgICAgIHdoZW4gJ2N1YmVtYXAnXG4gICAgICAgICAgICAgICAgZXJyID0gQG5ld1NoYWRlckN1YmVtYXAgc2hhZGVyQ29kZSwgY29tbW9uU291cmNlQ29kZXNcbiAgICAgICAgICAgIHdoZW4gJ2tleWJvYXJkJ1xuICAgICAgICAgICAgICAgIGVyciA9IG51bGxcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBlcnIgPSBcInVua25vd24gdHlwZSAje0BtVHlwZX1cIlxuICAgICAgICAgICAgICAgIGVycm9yIGVyclxuICAgICAgICBpZiBub3QgZXJyXG4gICAgICAgICAgICBAbUNvbXBpbGUgPSBwZXJmb3JtYW5jZS5ub3coKSAtIHRpbWVTdGFydFxuICAgICAgICBAbVNvdXJjZSA9IHNoYWRlckNvZGVcbiAgICAgICAgZXJyXG4gICAgXG4gICAgIyAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG5ld1NoYWRlckltYWdlOiAoc2hhZGVyQ29kZSwgY29tbW9uU2hhZGVyQ29kZXMpIC0+XG4gICAgICAgIFxuICAgICAgICB2cyA9ICdsYXlvdXQobG9jYXRpb24gPSAwKSBpbiB2ZWMyIHBvczsgdm9pZCBtYWluKCkgeyBnbF9Qb3NpdGlvbiA9IHZlYzQocG9zLnh5LDAuMCwxLjApOyB9J1xuICAgICAgICBmciA9IEBoZWFkZXJcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5jb21tb25TaGFkZXJDb2Rlcy5sZW5ndGhdXG4gICAgICAgICAgICBmciArPSAnXFxuJyArIGNvbW1vblNoYWRlckNvZGVzW2ldXG4gICAgICAgIGZyICs9ICdcXG4nICsgc2hhZGVyQ29kZVxuICAgICAgICBmciArPSAnXFxuJyArIEBmb290ZXJcbiAgICAgICAgcmVzID0gQG1SZW5kZXJlci5jcmVhdGVTaGFkZXIgdnMsIGZyXG4gICAgICAgIGlmIHJlcy5tUmVzdWx0ID09IGZhbHNlXG4gICAgICAgICAgICByZXR1cm4gcmVzLm1JbmZvXG4gICAgICAgIGlmIEBtUHJvZ3JhbSAhPSBudWxsXG4gICAgICAgICAgICBAbVJlbmRlcmVyLmRlc3Ryb3lTaGFkZXIgQG1Qcm9ncmFtXG4gICAgICAgIEBtUHJvZ3JhbSA9IHJlc1xuICAgICAgICBudWxsXG4gICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgIFxuICAgIG5ld1NoYWRlckN1YmVtYXA6IChzaGFkZXJDb2RlLCBjb21tb25TaGFkZXJDb2RlcykgLT5cbiAgICAgICAgXG4gICAgICAgIHZzID0gJ2xheW91dChsb2NhdGlvbiA9IDApIGluIHZlYzIgcG9zOyB2b2lkIG1haW4oKSB7IGdsX1Bvc2l0aW9uID0gdmVjNChwb3MueHksMC4wLDEuMCk7IH0nXG4gICAgICAgIGZyID0gQGhlYWRlclxuICAgICAgICBpID0gMFxuICAgICAgICB3aGlsZSBpIDwgY29tbW9uU2hhZGVyQ29kZXMubGVuZ3RoXG4gICAgICAgICAgICBmciArPSBjb21tb25TaGFkZXJDb2Rlc1tpXSArICdcXG4nXG4gICAgICAgICAgICBpKytcbiAgICAgICAgZnIgKz0gc2hhZGVyQ29kZVxuICAgICAgICBmciArPSBAZm9vdGVyXG4gICAgICAgIHJlcyA9IEBtUmVuZGVyZXIuY3JlYXRlU2hhZGVyKHZzLCBmcilcbiAgICAgICAgaWYgcmVzLm1SZXN1bHQgPT0gZmFsc2VcbiAgICAgICAgICAgIHJldHVybiByZXMubUluZm9cbiAgICAgICAgaWYgQG1Qcm9ncmFtICE9IG51bGxcbiAgICAgICAgICAgIEBtUmVuZGVyZXIuZGVzdHJveVNoYWRlciBAbVByb2dyYW1cbiAgICAgICAgQG1Qcm9ncmFtID0gcmVzXG4gICAgICAgIG51bGxcbiAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwICAgICAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG5ld1NoYWRlckNvbW1vbjogKHNoYWRlckNvZGUpIC0+XG4gICAgICAgIFxuICAgICAgICB2cyA9ICdsYXlvdXQobG9jYXRpb24gPSAwKSBpbiB2ZWMyIHBvczsgdm9pZCBtYWluKCkgeyBnbF9Qb3NpdGlvbiA9IHZlYzQocG9zLnh5LDAuMCwxLjApOyB9J1xuICAgICAgICBmciA9IEBoZWFkZXIgKyBzaGFkZXJDb2RlICsgQGZvb3RlclxuICAgICAgICByZXMgPSBAbVJlbmRlcmVyLmNyZWF0ZVNoYWRlcih2cywgZnIpXG4gICAgICAgIGlmIHJlcy5tUmVzdWx0ID09IGZhbHNlXG4gICAgICAgICAgICByZXR1cm4gcmVzLm1JbmZvXG4gICAgICAgIGlmIEBtUHJvZ3JhbSAhPSBudWxsXG4gICAgICAgICAgICBAbVJlbmRlcmVyLmRlc3Ryb3lTaGFkZXIgQG1Qcm9ncmFtXG4gICAgICAgIEBtUHJvZ3JhbSA9IHJlc1xuICAgICAgICBudWxsXG4gICAgICAgIFxuICAgIGRlc3Ryb3lJbnB1dDogKGlkKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQG1JbnB1dHNbaWRdXG4gICAgICAgICAgICBpZiBAbUlucHV0c1tpZF0ubUluZm8ubVR5cGUgaW4gWyd0ZXh0dXJlJyAnY3ViZW1hcCddXG4gICAgICAgICAgICAgICAgQG1SZW5kZXJlci5kZXN0cm95VGV4dHVyZSBAbUlucHV0c1tpZF0uZ2xvYmplY3RcbiAgICAgICAgICAgIEBtSW5wdXRzW2lkXSA9IG51bGxcbiAgICBcbiAgICBzYW1wbGVyMlJlbmRlcmVyOiAoc2FtcGxlcikgLT5cbiAgICAgICAgXG4gICAgICAgIGZpbHRlciA9IFJlbmRlcmVyLkZJTFRFUi5OT05FXG4gICAgICAgIGlmIHNhbXBsZXI/LmZpbHRlciA9PSAnbGluZWFyJyB0aGVuIGZpbHRlciA9IFJlbmRlcmVyLkZJTFRFUi5MSU5FQVJcbiAgICAgICAgaWYgc2FtcGxlcj8uZmlsdGVyID09ICdtaXBtYXAnIHRoZW4gZmlsdGVyID0gUmVuZGVyZXIuRklMVEVSLk1JUE1BUFxuICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIG1GaWx0ZXI6IGZpbHRlclxuICAgICAgICAgICAgbVdyYXA6ICAgc2FtcGxlcj8ud3JhcCAhPSAnY2xhbXAnIGFuZCBSZW5kZXJlci5URVhXUlAuUkVQRUFUIG9yIFJlbmRlcmVyLlRFWFdSUC5DTEFNUFxuICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAgICAgMDAwICAwMDAgICAgICAgICAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgc2V0U2FtcGxlckZpbHRlcjogKGlkLCBzdHIsIGJ1ZmZlcnMsIGN1YmVCdWZmZXJzKSAtPlxuICAgICAgICBcbiAgICAgICAgaW5wID0gQG1JbnB1dHNbaWRdXG4gICAgICAgIGZpbHRlciA9IFJlbmRlcmVyLkZJTFRFUi5OT05FXG4gICAgICAgIGlmIHN0ciA9PSAnbGluZWFyJ1xuICAgICAgICAgICAgZmlsdGVyID0gUmVuZGVyZXIuRklMVEVSLkxJTkVBUlxuICAgICAgICBpZiBzdHIgPT0gJ21pcG1hcCdcbiAgICAgICAgICAgIGZpbHRlciA9IFJlbmRlcmVyLkZJTFRFUi5NSVBNQVBcbiAgICAgICAgaWYgaW5wID09IG51bGxcbiAgICAgICAgZWxzZSBpZiBpbnAubUluZm8ubVR5cGUgPT0gJ3RleHR1cmUnXG4gICAgICAgICAgICBpZiBpbnAubG9hZGVkXG4gICAgICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRTYW1wbGVyRmlsdGVyIGlucC5nbG9iamVjdCwgZmlsdGVyLCB0cnVlXG4gICAgICAgIGVsc2UgaWYgaW5wLm1JbmZvLm1UeXBlID09ICdjdWJlbWFwJ1xuICAgICAgICAgICAgaWYgaW5wLmxvYWRlZFxuICAgICAgICAgICAgICAgIGlmIEBtRWZmZWN0LmFzc2V0SURfdG9fY3ViZW1hcEJ1ZmVySUQoaW5wLm1JbmZvLm1JRCkgPT0gMFxuICAgICAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLnNldFNhbXBsZXJGaWx0ZXIgY3ViZUJ1ZmZlcnNbaWRdLm1UZXh0dXJlWzBdLCBmaWx0ZXIsIHRydWVcbiAgICAgICAgICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRTYW1wbGVyRmlsdGVyIGN1YmVCdWZmZXJzW2lkXS5tVGV4dHVyZVsxXSwgZmlsdGVyLCB0cnVlXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLnNldFNhbXBsZXJGaWx0ZXIgaW5wLmdsb2JqZWN0LCBmaWx0ZXIsIHRydWVcbiAgICAgICAgZWxzZSBpZiBpbnAubUluZm8ubVR5cGUgPT0gJ2J1ZmZlcidcbiAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0U2FtcGxlckZpbHRlciBidWZmZXJzW2lucC5pZF0ubVRleHR1cmVbMF0sIGZpbHRlciwgdHJ1ZVxuICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRTYW1wbGVyRmlsdGVyIGJ1ZmZlcnNbaW5wLmlkXS5tVGV4dHVyZVsxXSwgZmlsdGVyLCB0cnVlXG4gICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgMDAgICAgIDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICBcbiAgICBcbiAgICBzZXRTYW1wbGVyV3JhcDogKGlkLCBzdHIsIGJ1ZmZlcnMpIC0+XG4gICAgICAgIFxuICAgICAgICBpbnAgPSBAbUlucHV0c1tpZF1cbiAgICAgICAgcmVzdHIgPSBSZW5kZXJlci5URVhXUlAuUkVQRUFUXG4gICAgICAgIGlmIHN0ciA9PSAnY2xhbXAnXG4gICAgICAgICAgICByZXN0ciA9IFJlbmRlcmVyLlRFWFdSUC5DTEFNUFxuICAgICAgICBpZiBpbnA/Lm1JbmZvLm1UeXBlID09ICd0ZXh0dXJlJ1xuICAgICAgICAgICAgaWYgaW5wLmxvYWRlZFxuICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0U2FtcGxlcldyYXAgaW5wLmdsb2JqZWN0LCByZXN0clxuICAgICAgICBlbHNlIGlmIGlucD8ubUluZm8ubVR5cGUgPT0gJ2N1YmVtYXAnXG4gICAgICAgICAgICBpZiBpbnAubG9hZGVkXG4gICAgICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRTYW1wbGVyV3JhcCBpbnAuZ2xvYmplY3QsIHJlc3RyXG4gICAgICAgIGVsc2UgaWYgaW5wPy5tSW5mby5tVHlwZSA9PSAnYnVmZmVyJ1xuICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRTYW1wbGVyV3JhcCBidWZmZXJzW2lucC5pZF0ubVRleHR1cmVbMF0sIHJlc3RyXG4gICAgICAgICAgICBAbVJlbmRlcmVyLnNldFNhbXBsZXJXcmFwIGJ1ZmZlcnNbaW5wLmlkXS5tVGV4dHVyZVsxXSwgcmVzdHJcbiAgICBcbiAgICBzZXRTYW1wbGVyVkZsaXA6IChpZCwgZmxpcCkgLT5cblxuICAgICAgICBpbnAgPSBAbUlucHV0c1tpZF1cbiAgICAgICAgaWYgaW5wPy5sb2FkZWQgYW5kIGlucD8ubUluZm8ubVR5cGUgaW4gWyd0ZXh0dXJlJyAnY3ViZW1hcCddXG4gICAgICAgICAgICBAbVJlbmRlcmVyLnNldFNhbXBsZXJWRmxpcCBpbnAuZ2xvYmplY3QsIGZsaXAsIGlucC5pbWFnZVxuICAgICAgICAgICAgXG4gICAgZ2V0VGV4dHVyZTogKHNsb3QpIC0+IEBtSW5wdXRzW3Nsb3RdPy5tSW5mb1xuICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgIDAwMCAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBuZXdUZXh0dXJlOiAoc2xvdCwgdXJsLCBidWZmZXJzLCBjdWJlQnVmZmVycywga2V5Ym9hcmQpIC0+XG4gICAgICAgIFxuICAgICAgICB0ZXh0dXJlID0gbnVsbFxuICAgICAgICBcbiAgICAgICAgaWYgbm90IHVybD8ubVR5cGVcbiAgICAgICAgICAgIEBkZXN0cm95SW5wdXQgc2xvdFxuICAgICAgICAgICAgQG1JbnB1dHNbc2xvdF0gPSBudWxsXG4gICAgICAgICAgICBAbWFrZUhlYWRlcigpXG4gICAgICAgICAgICByZXR1cm4gXG4gICAgICAgICAgICAgICAgbUZhaWxlZDogZmFsc2VcbiAgICAgICAgICAgICAgICBtTmVlZHNTaGFkZXJDb21waWxlOiBmYWxzZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBlbHNlIGlmIHVybC5tVHlwZSA9PSAndGV4dHVyZSdcbiAgICAgICAgICAgICMga2xvZyBcIm5ld1RleHR1cmUgJ3RleHR1cmUnICN7c2xvdH1cIiB1cmxcbiAgICAgICAgICAgIHRleHR1cmUgPSB7fVxuICAgICAgICAgICAgdGV4dHVyZS5tSW5mbyA9IHVybFxuICAgICAgICAgICAgdGV4dHVyZS5nbG9iamVjdCA9IG51bGxcbiAgICAgICAgICAgIHRleHR1cmUubG9hZGVkID0gZmFsc2VcbiAgICAgICAgICAgIHRleHR1cmUuaW1hZ2UgPSBuZXcgSW1hZ2VcbiAgICAgICAgICAgIHRleHR1cmUuaW1hZ2UuY3Jvc3NPcmlnaW4gPSAnJ1xuICAgIFxuICAgICAgICAgICAgdGV4dHVyZS5pbWFnZS5vbmxvYWQgPSA9PlxuICAgICAgICAgICAgICAgIHJ0aSA9IEBzYW1wbGVyMlJlbmRlcmVyIHVybC5tU2FtcGxlclxuICAgICAgICAgICAgICAgIHRleHR1cmUuZ2xvYmplY3QgPSBAbVJlbmRlcmVyLmNyZWF0ZVRleHR1cmVGcm9tSW1hZ2UgUmVuZGVyZXIuVEVYVFlQRS5UMkQsIHRleHR1cmUuaW1hZ2UsIFJlbmRlcmVyLlRFWEZNVC5DNEk4LCBydGkubUZpbHRlciwgcnRpLm1XcmFwXG4gICAgICAgICAgICAgICAgdGV4dHVyZS5sb2FkZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgQHNldFNhbXBsZXJWRmxpcCBzbG90LCB0cnVlXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgXG4gICAgICAgICAgICAjIGtsb2cgXCJ0ZXh0dXJlLmltYWdlLnNyYyAje3VybC5tU3JjfVwiXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB0ZXh0dXJlLmltYWdlLnNyYyA9IHVybC5tU3JjXG4gICAgICAgICAgICByZXR1cm5WYWx1ZSA9IFxuICAgICAgICAgICAgICAgIG1GYWlsZWQ6IGZhbHNlXG4gICAgICAgICAgICAgICAgbU5lZWRzU2hhZGVyQ29tcGlsZTogQG1JbnB1dHNbc2xvdF0gPT0gbnVsbCBvciBAbUlucHV0c1tzbG90XS5tSW5mby5tVHlwZSAhPSAndGV4dHVyZScgYW5kIEBtSW5wdXRzW3Nsb3RdLm1JbmZvLm1UeXBlICE9ICdrZXlib2FyZCdcbiAgICAgICAgICAgIEBkZXN0cm95SW5wdXQgc2xvdFxuICAgICAgICAgICAgQG1JbnB1dHNbc2xvdF0gPSB0ZXh0dXJlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBtYWtlSGVhZGVyKClcbiAgICAgICAgICAgIHJldHVybiByZXR1cm5WYWx1ZVxuICAgICAgICAgICAgXG4gICAgICAgIGVsc2UgaWYgdXJsLm1UeXBlID09ICdjdWJlbWFwJ1xuICAgICAgICAgICAgdGV4dHVyZSA9IHt9XG4gICAgICAgICAgICB0ZXh0dXJlLm1JbmZvID0gdXJsXG4gICAgICAgICAgICB0ZXh0dXJlLmdsb2JqZWN0ID0gbnVsbFxuICAgICAgICAgICAgdGV4dHVyZS5sb2FkZWQgPSBmYWxzZVxuICAgICAgICAgICAgcnRpID0gQHNhbXBsZXIyUmVuZGVyZXIgdXJsLm1TYW1wbGVyXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIEBtRWZmZWN0LmFzc2V0SURfdG9fY3ViZW1hcEJ1ZmVySUQodXJsLm1JRCkgIT0gLTFcbiAgICAgICAgICAgICAgICB0ZXh0dXJlLm1JbWFnZSA9IG5ldyBJbWFnZVxuICAgIFxuICAgICAgICAgICAgICAgIHRleHR1cmUubUltYWdlLm9ubG9hZCA9IC0+XG4gICAgICAgICAgICAgICAgICAgIHRleHR1cmUubG9hZGVkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICBcbiAgICAgICAgICAgICAgICBAbUVmZmVjdC5yZXNpemVDdWJlbWFwQnVmZmVyIDAgMTAyNCAxMDI0XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdGV4dHVyZS5pbWFnZSA9IFtcbiAgICAgICAgICAgICAgICAgICAgbmV3IEltYWdlXG4gICAgICAgICAgICAgICAgICAgIG5ldyBJbWFnZVxuICAgICAgICAgICAgICAgICAgICBuZXcgSW1hZ2VcbiAgICAgICAgICAgICAgICAgICAgbmV3IEltYWdlXG4gICAgICAgICAgICAgICAgICAgIG5ldyBJbWFnZVxuICAgICAgICAgICAgICAgICAgICBuZXcgSW1hZ2VcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgbnVtTG9hZGVkID0gMFxuICAgICAgICAgICAgICAgIGkgPSAwXG4gICAgICAgICAgICAgICAgd2hpbGUgaSA8IDZcbiAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS5pbWFnZVtpXS5tSWQgPSBpXG4gICAgICAgICAgICAgICAgICAgIHRleHR1cmUuaW1hZ2VbaV0uY3Jvc3NPcmlnaW4gPSAnJ1xuICAgIFxuICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlLmltYWdlW2ldLm9ubG9hZCA9ID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IEBtSWRcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bUxvYWRlZCsrXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBudW1Mb2FkZWQgPT0gNlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHR1cmUuZ2xvYmplY3QgPSBAbVJlbmRlcmVyLmNyZWF0ZVRleHR1cmVGcm9tSW1hZ2UoUmVuZGVyZXIuVEVYVFlQRS5DVUJFTUFQLCB0ZXh0dXJlLmltYWdlLCBSZW5kZXJlci5URVhGTVQuQzRJOCwgcnRpLm1GaWx0ZXIsIHJ0aS5tV3JhcClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0dXJlLmxvYWRlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiBpID09IDBcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHR1cmUuaW1hZ2VbaV0uc3JjID0gdXJsLm1TcmNcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgbiA9IHVybC5tU3JjLmxhc3RJbmRleE9mKCcuJylcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHR1cmUuaW1hZ2VbaV0uc3JjID0gdXJsLm1TcmMuc3Vic3RyaW5nKDAsIG4pICsgJ18nICsgaSArIHVybC5tU3JjLnN1YnN0cmluZyhuLCB1cmwubVNyYy5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgIGkrK1xuICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSBcbiAgICAgICAgICAgICAgICBtRmFpbGVkOiBmYWxzZVxuICAgICAgICAgICAgICAgIG1OZWVkc1NoYWRlckNvbXBpbGU6IEBtSW5wdXRzW3Nsb3RdID09IG51bGwgb3IgQG1JbnB1dHNbc2xvdF0ubUluZm8ubVR5cGUgIT0gJ2N1YmVtYXAnXG4gICAgICAgICAgICBAZGVzdHJveUlucHV0IHNsb3RcbiAgICAgICAgICAgIEBtSW5wdXRzW3Nsb3RdID0gdGV4dHVyZVxuICAgICAgICAgICAgQG1ha2VIZWFkZXIoKVxuICAgICAgICAgICAgcmV0dXJuIHJldHVyblZhbHVlXG4gICAgICAgICAgICBcbiAgICAgICAgZWxzZSBpZiB1cmwubVR5cGUgPT0gJ2tleWJvYXJkJ1xuICAgICAgICAgICAgdGV4dHVyZSA9IHt9XG4gICAgICAgICAgICB0ZXh0dXJlLm1JbmZvID0gdXJsXG4gICAgICAgICAgICB0ZXh0dXJlLmdsb2JqZWN0ID0gbnVsbFxuICAgICAgICAgICAgdGV4dHVyZS5sb2FkZWQgPSB0cnVlXG4gICAgICAgICAgICB0ZXh0dXJlLmtleWJvYXJkID0ge31cbiAgICAgICAgICAgIHJldHVyblZhbHVlID0gXG4gICAgICAgICAgICAgICAgbUZhaWxlZDogZmFsc2VcbiAgICAgICAgICAgICAgICBtTmVlZHNTaGFkZXJDb21waWxlOiBAbUlucHV0c1tzbG90XSA9PSBudWxsIG9yIEBtSW5wdXRzW3Nsb3RdLm1JbmZvLm1UeXBlICE9ICd0ZXh0dXJlJyBhbmQgQG1JbnB1dHNbc2xvdF0ubUluZm8ubVR5cGUgIT0gJ2tleWJvYXJkJ1xuICAgICAgICAgICAgQGRlc3Ryb3lJbnB1dCBzbG90XG4gICAgICAgICAgICBAbUlucHV0c1tzbG90XSA9IHRleHR1cmVcbiAgICAgICAgICAgIEBtYWtlSGVhZGVyKClcbiAgICAgICAgICAgIHJldHVybiByZXR1cm5WYWx1ZVxuICAgICAgICAgICAgXG4gICAgICAgIGVsc2UgaWYgdXJsLm1UeXBlID09ICdidWZmZXInXG4gICAgICAgICAgICB0ZXh0dXJlID0ge31cbiAgICAgICAgICAgIHRleHR1cmUubUluZm8gPSB1cmxcbiAgICAgICAgICAgIHRleHR1cmUuaW1hZ2UgPSBuZXcgSW1hZ2VcbiAgICAgICAgICAgIHRleHR1cmUuaW1hZ2Uuc3JjID0gdXJsLm1TcmNcbiAgICAgICAgICAgIHRleHR1cmUuaWQgPSBAbUVmZmVjdC5hc3NldElEX3RvX2J1ZmZlcklEKHVybC5tSUQpXG4gICAgICAgICAgICBrbG9nIFwibmV3VGV4dHVyZSAnYnVmZmVyJyAje3Nsb3R9XCIgdXJsLCB0ZXh0dXJlLmlkXG4gICAgICAgICAgICB0ZXh0dXJlLmxvYWRlZCA9IHRydWVcbiAgICAgICAgICAgIHJldHVyblZhbHVlID0gXG4gICAgICAgICAgICAgICAgbUZhaWxlZDogZmFsc2VcbiAgICAgICAgICAgICAgICBtTmVlZHNTaGFkZXJDb21waWxlOiBAbUlucHV0c1tzbG90XSA9PSBudWxsIG9yIEBtSW5wdXRzW3Nsb3RdLm1JbmZvLm1UeXBlICE9ICd0ZXh0dXJlJyBhbmQgQG1JbnB1dHNbc2xvdF0ubUluZm8ubVR5cGUgIT0gJ2tleWJvYXJkJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAga2xvZyBcIm5ld1RleHR1cmUgJ2J1ZmZlcicgI3tzbG90fVwiIHJldHVyblZhbHVlXG4gICAgICAgICAgICBAZGVzdHJveUlucHV0IHNsb3RcbiAgICAgICAgICAgIEBtSW5wdXRzW3Nsb3RdID0gdGV4dHVyZVxuICAgICAgICAgICAgQG1FZmZlY3QucmVzaXplQnVmZmVyIHRleHR1cmUuaWQsIEBtRWZmZWN0Lm1YcmVzLCBAbUVmZmVjdC5tWXJlcywgZmFsc2VcblxuICAgICAgICAgICAgIyBAc2V0U2FtcGxlckZpbHRlciBzbG90LCAnbGluZWFyJyBidWZmZXJzLCBjdWJlQnVmZmVycywgdHJ1ZVxuICAgICAgICAgICAgIyBAc2V0U2FtcGxlclZGbGlwIHNsb3QsIHRydWVcbiAgICAgICAgICAgICMgQHNldFNhbXBsZXJXcmFwIHNsb3QsICdjbGFtcCcgYnVmZmVyc1xuICAgICAgICAgICAgQG1ha2VIZWFkZXIoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAjIGtsb2cgXCJuZXdUZXh0dXJlICdidWZmZXInICN7c2xvdH1cIiBAaGVhZGVyLCBAZm9vdGVyXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiByZXR1cm5WYWx1ZVxuICAgICAgICAgICAgXG4gICAgICAgIGVycm9yIFwiaW5wdXQgdHlwZSBlcnJvcjogI3t1cmwubVR5cGV9XCJcbiAgICAgICAgcmV0dXJuIG1GYWlsZWQ6dHJ1ZVxuICAgIFxuICAgICMgMDAwICAwMCAgICAgMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBwYWludEltYWdlOiAoZGEsIHRpbWUsIGR0aW1lLCBmcHMsIHhyZXMsIHlyZXMsIGJ1ZmZlcnMsIGN1YmVCdWZmZXJzLCBrZXlib2FyZCkgLT5cbiAgICAgICAgXG4gICAgICAgIHRpbWVzID0gWyAwIDAgMCAwIF1cbiAgICAgICAgZGF0ZXMgPSBbXG4gICAgICAgICAgICBkYS5nZXRGdWxsWWVhcigpXG4gICAgICAgICAgICBkYS5nZXRNb250aCgpXG4gICAgICAgICAgICBkYS5nZXREYXRlKClcbiAgICAgICAgICAgIGRhLmdldEhvdXJzKCkgKiA2MC4wICogNjAgKyBkYS5nZXRNaW51dGVzKCkgKiA2MCArIGRhLmdldFNlY29uZHMoKSArIGRhLmdldE1pbGxpc2Vjb25kcygpIC8gMTAwMC4wXG4gICAgICAgIF1cbiAgICAgICAgcmVzb3MgPSBbIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIF1cbiAgICAgICAgdGV4SUQgPSBbIG51bGwgbnVsbCBudWxsIG51bGwgXVxuICAgICAgICBpID0gMFxuICAgICAgICB3aGlsZSBpIDwgQG1JbnB1dHMubGVuZ3RoXG4gICAgICAgICAgICBpbnAgPSBAbUlucHV0c1tpXVxuICAgICAgICAgICAgaWYgaW5wID09IG51bGxcbiAgICAgICAgICAgIGVsc2UgaWYgaW5wLm1JbmZvLm1UeXBlID09ICd0ZXh0dXJlJ1xuICAgICAgICAgICAgICAgIGlmIGlucC5sb2FkZWQgPT0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB0ZXhJRFtpXSA9IGlucC5nbG9iamVjdFxuICAgICAgICAgICAgICAgICAgICByZXNvc1szICogaSArIDBdID0gaW5wLmltYWdlLndpZHRoXG4gICAgICAgICAgICAgICAgICAgIHJlc29zWzMgKiBpICsgMV0gPSBpbnAuaW1hZ2UuaGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgIHJlc29zWzMgKiBpICsgMl0gPSAxXG4gICAgICAgICAgICBlbHNlIGlmIGlucC5tSW5mby5tVHlwZSA9PSAna2V5Ym9hcmQnXG4gICAgICAgICAgICAgICAgdGV4SURbaV0gPSBrZXlib2FyZC5tVGV4dHVyZVxuICAgICAgICAgICAgZWxzZSBpZiBpbnAubUluZm8ubVR5cGUgPT0gJ2N1YmVtYXAnXG4gICAgICAgICAgICAgICAgaWYgaW5wLmxvYWRlZCA9PSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGlkID0gQG1FZmZlY3QuYXNzZXRJRF90b19jdWJlbWFwQnVmZXJJRChpbnAubUluZm8ubUlEKVxuICAgICAgICAgICAgICAgICAgICBpZiBpZCAhPSAtMVxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4SURbaV0gPSBjdWJlQnVmZmVyc1tpZF0ubVRleHR1cmVbY3ViZUJ1ZmZlcnNbaWRdLm1MYXN0UmVuZGVyRG9uZV1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29zWzMgKiBpICsgMF0gPSBjdWJlQnVmZmVyc1tpZF0ubVJlc29sdXRpb25bMF1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29zWzMgKiBpICsgMV0gPSBjdWJlQnVmZmVyc1tpZF0ubVJlc29sdXRpb25bMV1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29zWzMgKiBpICsgMl0gPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLnNldFNhbXBsZXJGaWx0ZXIgdGV4SURbaV0sIGlucC5tSW5mby5tU2FtcGxlcj8uZmlsdGVyID8gUmVuZGVyZXIuRklMVEVSLk1JUE1BUCwgZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4SURbaV0gPSBpbnAuZ2xvYmplY3RcbiAgICAgICAgICAgIGVsc2UgaWYgaW5wLm1JbmZvLm1UeXBlID09ICdidWZmZXInXG4gICAgICAgICAgICAgICAgaWYgaW5wLmxvYWRlZCA9PSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGlkID0gaW5wLmlkXG4gICAgICAgICAgICAgICAgICAgIHRleElEW2ldID0gYnVmZmVyc1tpZF0ubVRleHR1cmVbYnVmZmVyc1tpZF0ubUxhc3RSZW5kZXJEb25lXVxuICAgICAgICAgICAgICAgICAgICByZXNvc1szICogaSArIDBdID0geHJlc1xuICAgICAgICAgICAgICAgICAgICByZXNvc1szICogaSArIDFdID0geXJlc1xuICAgICAgICAgICAgICAgICAgICByZXNvc1szICogaSArIDJdID0gMVxuICAgICAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLnNldFNhbXBsZXJGaWx0ZXIgdGV4SURbaV0sIGlucC5tSW5mby5tU2FtcGxlcj8uZmlsdGVyID8gUmVuZGVyZXIuRklMVEVSLkxJTkVBUiwgZmFsc2VcbiAgICAgICAgICAgIGkrK1xuICAgICAgICBAbVJlbmRlcmVyLmF0dGFjaFRleHR1cmVzIDQsIHRleElEWzBdLCB0ZXhJRFsxXSwgdGV4SURbMl0sIHRleElEWzNdXG4gICAgICAgIHByb2cgPSBAbVByb2dyYW1cbiAgICAgICAgQG1SZW5kZXJlci5hdHRhY2hTaGFkZXIgcHJvZ1xuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpVGltZScgdGltZVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50M0YgICdpUmVzb2x1dGlvbicgeHJlcywgeXJlcywgMS4wXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQ0RlYgJ2lNb3VzZScgQG1SZW5kZXJlci5pTW91c2VcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDRGViAnaURhdGUnIGRhdGVzXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQxRiAgJ2lTYW1wbGVSYXRlJyBAbVNhbXBsZVJhdGVcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJUZXh0dXJlVW5pdCAnaUNoYW5uZWwwJyAwXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyVGV4dHVyZVVuaXQgJ2lDaGFubmVsMScgMVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlclRleHR1cmVVbml0ICdpQ2hhbm5lbDInIDJcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJUZXh0dXJlVW5pdCAnaUNoYW5uZWwzJyAzXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQxSSAgJ2lGcmFtZScgQG1GcmFtZVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpVGltZURlbHRhJyBkdGltZVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpRnJhbWVSYXRlJyBmcHNcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDFGViAnaUNoYW5uZWxUaW1lJyB0aW1lc1xuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50M0ZWICdpQ2hhbm5lbFJlc29sdXRpb24nIHJlc29zXG4gICAgICAgICMjI1xuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpQ2hhbm5lbFswXS50aW1lJyB0aW1lc1swXVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpQ2hhbm5lbFsxXS50aW1lJyB0aW1lc1sxXVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpQ2hhbm5lbFsyXS50aW1lJyB0aW1lc1syXVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpQ2hhbm5lbFszXS50aW1lJyB0aW1lc1szXVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50M0YgICdpQ2hhbm5lbFswXS5yZXNvbHV0aW9uJyByZXNvc1swXSwgcmVzb3NbMV0sICByZXNvc1syXVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50M0YgICdpQ2hhbm5lbFsxXS5yZXNvbHV0aW9uJyByZXNvc1szXSwgcmVzb3NbNF0sICByZXNvc1s1XVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50M0YgICdpQ2hhbm5lbFsyXS5yZXNvbHV0aW9uJyByZXNvc1s2XSwgcmVzb3NbN10sICByZXNvc1s4XVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50M0YgICdpQ2hhbm5lbFszXS5yZXNvbHV0aW9uJyByZXNvc1s5XSwgcmVzb3NbMTBdLCByZXNvc1sxMV1cbiAgICAgICAgIyMjXG4gICAgICAgIGwxID0gQG1SZW5kZXJlci5nZXRBdHRyaWJMb2NhdGlvbihAbVByb2dyYW0sICdwb3MnKVxuICAgICAgICBAbVJlbmRlcmVyLnNldFZpZXdwb3J0IFsgMCwgMCwgeHJlcywgeXJlcyBdXG4gICAgICAgIEBtUmVuZGVyZXIuZHJhd0Z1bGxTY3JlZW5UcmlhbmdsZV9YWSBsMVxuICAgICAgICBAbVJlbmRlcmVyLmRldHRhY2hUZXh0dXJlcygpXG4gICAgICAgIHJldHVyblxuICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMCAgICAgMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgc2V0VW5pZm9ybXM6IChkYSwgdGltZSwgZHRpbWUsIGZwcywgeHJlcywgeXJlcywgYnVmZmVycywgY3ViZUJ1ZmZlcnMsIGtleWJvYXJkKSAtPlxuICAgICAgICB0aW1lcyA9IFsgMCAwIDAgMCBdXG4gICAgICAgIGRhdGVzID0gW1xuICAgICAgICAgICAgZGEuZ2V0RnVsbFllYXIoKVxuICAgICAgICAgICAgZGEuZ2V0TW9udGgoKVxuICAgICAgICAgICAgZGEuZ2V0RGF0ZSgpXG4gICAgICAgICAgICBkYS5nZXRIb3VycygpICogNjAgKiA2MCArIGRhLmdldE1pbnV0ZXMoKSAqIDYwICsgZGEuZ2V0U2Vjb25kcygpICsgZGEuZ2V0TWlsbGlzZWNvbmRzKCkgLyAxMDAwXG4gICAgICAgIF1cbiAgICAgICAgcmVzb3MgPSBbIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIF1cbiAgICAgICAgdGV4SUQgPSBbIG51bGwgbnVsbCBudWxsIG51bGwgXVxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5AbUlucHV0cy5sZW5ndGhdXG4gICAgICAgICAgICBpbnAgPSBAbUlucHV0c1tpXVxuICAgICAgICAgICAgaWYgaW5wPy5tSW5mby5tVHlwZSA9PSAndGV4dHVyZSdcbiAgICAgICAgICAgICAgICBpZiBpbnAubG9hZGVkID09IHRydWVcbiAgICAgICAgICAgICAgICAgICAgdGV4SURbaV0gPSBpbnAuZ2xvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAwXSA9IGlucC5pbWFnZS53aWR0aFxuICAgICAgICAgICAgICAgICAgICByZXNvc1szICogaSArIDFdID0gaW5wLmltYWdlLmhlaWdodFxuICAgICAgICAgICAgICAgICAgICByZXNvc1szICogaSArIDJdID0gMVxuICAgICAgICAgICAgZWxzZSBpZiBpbnA/Lm1JbmZvLm1UeXBlID09ICdrZXlib2FyZCdcbiAgICAgICAgICAgICAgICB0ZXhJRFtpXSA9IGtleWJvYXJkLm1UZXh0dXJlXG4gICAgICAgICAgICBlbHNlIGlmIGlucD8ubUluZm8ubVR5cGUgPT0gJ2N1YmVtYXAnXG4gICAgICAgICAgICAgICAgaWYgaW5wLmxvYWRlZCA9PSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGlkID0gQG1FZmZlY3QuYXNzZXRJRF90b19jdWJlbWFwQnVmZXJJRChpbnAubUluZm8ubUlEKVxuICAgICAgICAgICAgICAgICAgICBpZiBpZCAhPSAtMVxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4SURbaV0gPSBjdWJlQnVmZmVyc1tpZF0ubVRleHR1cmVbY3ViZUJ1ZmZlcnNbaWRdLm1MYXN0UmVuZGVyRG9uZV1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29zWzMgKiBpICsgMF0gPSBjdWJlQnVmZmVyc1tpZF0ubVJlc29sdXRpb25bMF1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29zWzMgKiBpICsgMV0gPSBjdWJlQnVmZmVyc1tpZF0ubVJlc29sdXRpb25bMV1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29zWzMgKiBpICsgMl0gPSAxXG4gICAgICAgICAgICAgICAgICAgICAgICAjIGhhY2suIGluIHdlYmdsMi4wIHdlIGhhdmUgc2FtcGxlcnMsIHNvIHdlIGRvbid0IG5lZWQgdGhpcyBjcmFwIGhlcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlciA9IFJlbmRlcmVyLkZJTFRFUi5OT05FXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBpbnAubUluZm8ubVNhbXBsZXIuZmlsdGVyID09ICdsaW5lYXInXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyID0gUmVuZGVyZXIuRklMVEVSLkxJTkVBUlxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBpbnAubUluZm8ubVNhbXBsZXIuZmlsdGVyID09ICdtaXBtYXAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyID0gUmVuZGVyZXIuRklMVEVSLk1JUE1BUFxuICAgICAgICAgICAgICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRTYW1wbGVyRmlsdGVyIHRleElEW2ldLCBmaWx0ZXIsIGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleElEW2ldID0gaW5wLmdsb2JqZWN0XG4gICAgICAgICAgICBlbHNlIGlmIGlucD8ubUluZm8ubVR5cGUgPT0gJ2J1ZmZlcidcbiAgICAgICAgICAgICAgICBpZiBpbnAubG9hZGVkID09IHRydWVcbiAgICAgICAgICAgICAgICAgICAgdGV4SURbaV0gPSBidWZmZXJzW2lucC5pZF0ubVRleHR1cmVbYnVmZmVyc1tpbnAuaWRdLm1MYXN0UmVuZGVyRG9uZV1cbiAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAwXSA9IHhyZXNcbiAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAxXSA9IHlyZXNcbiAgICAgICAgICAgICAgICAgICAgcmVzb3NbMyAqIGkgKyAyXSA9IDFcblxuICAgICAgICBAbVJlbmRlcmVyLmF0dGFjaFRleHR1cmVzIDQsIHRleElEWzBdLCB0ZXhJRFsxXSwgdGV4SURbMl0sIHRleElEWzNdXG4gICAgICAgIEBtUmVuZGVyZXIuYXR0YWNoU2hhZGVyIEBtUHJvZ3JhbVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpVGltZScgdGltZVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50M0YgICdpUmVzb2x1dGlvbicgeHJlcywgeXJlcywgMS4wXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQ0RlYgJ2lNb3VzZScgQG1SZW5kZXJlci5pTW91c2VcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDRGViAnaURhdGUnIGRhdGVzXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQxRiAgJ2lTYW1wbGVSYXRlJyBAbVNhbXBsZVJhdGVcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJUZXh0dXJlVW5pdCAnaUNoYW5uZWwwJyAwXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyVGV4dHVyZVVuaXQgJ2lDaGFubmVsMScgMVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlclRleHR1cmVVbml0ICdpQ2hhbm5lbDInIDJcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJUZXh0dXJlVW5pdCAnaUNoYW5uZWwzJyAzXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQxSSAgJ2lGcmFtZScgQG1GcmFtZVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpVGltZURlbHRhJyBkdGltZVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50MUYgICdpRnJhbWVSYXRlJyBmcHNcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDFGViAnaUNoYW5uZWxUaW1lJyB0aW1lc1xuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50M0ZWICdpQ2hhbm5lbFJlc29sdXRpb24nIHJlc29zXG4gICAgICAgICMjIyAgICAgICBcbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDFGICAnaUNoYW5uZWxbMF0udGltZScgdGltZXNbMF1cbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDFGICAnaUNoYW5uZWxbMV0udGltZScgdGltZXNbMV1cbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDFGICAnaUNoYW5uZWxbMl0udGltZScgdGltZXNbMl1cbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDFGICAnaUNoYW5uZWxbM10udGltZScgdGltZXNbM11cbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDNGICAnaUNoYW5uZWxbMF0ucmVzb2x1dGlvbicgcmVzb3NbMF0sIHJlc29zWzFdLCByZXNvc1syXVxuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50M0YgICdpQ2hhbm5lbFsxXS5yZXNvbHV0aW9uJyByZXNvc1szXSwgcmVzb3NbNF0sIHJlc29zWzVdXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQzRiAgJ2lDaGFubmVsWzJdLnJlc29sdXRpb24nIHJlc29zWzZdLCByZXNvc1s3XSwgcmVzb3NbOF1cbiAgICAgICAgQG1SZW5kZXJlci5zZXRTaGFkZXJDb25zdGFudDNGICAnaUNoYW5uZWxbM10ucmVzb2x1dGlvbicgcmVzb3NbOV0sIHJlc29zWzEwXSwgcmVzb3NbMTFdXG4gICAgICAgICMjI1xuICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgXG4gICAgcHJvY2Vzc0lucHV0czogKHRpbWUsIGR0aW1lLCBmcHMsIHhyZXMsIHlyZXMsIGJ1ZmZlcnMsIGN1YmVCdWZmZXJzLCBrZXlib2FyZCkgLT5cbiAgICAgICAgaSA9IDBcbiAgICAgICAgd2hpbGUgaSA8IEBtSW5wdXRzLmxlbmd0aFxuICAgICAgICAgICAgaW5wID0gQG1JbnB1dHNbaV1cbiAgICAgICAgICAgIGlmIGlucCA9PSBudWxsXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBpbnAubUluZm8ubVR5cGUgPT0gJ2J1ZmZlcidcbiAgICAgICAgICAgICAgICBpZiBpbnAubG9hZGVkID09IHRydWVcbiAgICAgICAgICAgICAgICAgICAgaWQgPSBpbnAuaWRcbiAgICAgICAgICAgICAgICAgICAgdGV4SUQgPSBidWZmZXJzW2lkXS5tVGV4dHVyZVtidWZmZXJzW2lkXS5tTGFzdFJlbmRlckRvbmVdXG4gICAgICAgICAgICAgICAgICAgICMgaGFjay4gaW4gd2ViZ2wyLjAgd2UgaGF2ZSBzYW1wbGVycywgc28gd2UgZG9uJ3QgbmVlZCB0aGlzIGNyYXAgaGVyZVxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXIgPSBSZW5kZXJlci5GSUxURVIuTk9ORVxuICAgICAgICAgICAgICAgICAgICBpZiBpbnAubUluZm8ubVNhbXBsZXIuZmlsdGVyID09ICdsaW5lYXInXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXIgPSBSZW5kZXJlci5GSUxURVIuTElORUFSXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgaW5wLm1JbmZvLm1TYW1wbGVyLmZpbHRlciA9PSAnbWlwbWFwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyID0gUmVuZGVyZXIuRklMVEVSLk1JUE1BUFxuICAgICAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLnNldFNhbXBsZXJGaWx0ZXIgdGV4SUQsIGZpbHRlciwgZmFsc2VcbiAgICAgICAgICAgIGkrK1xuICAgICAgICByZXR1cm5cbiAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgXG4gICAgcGFpbnRDdWJlbWFwOiAoZGEsIHRpbWUsIGR0aW1lLCBmcHMsIHhyZXMsIHlyZXMsIGJ1ZmZlcnMsIGN1YmVCdWZmZXJzLCBrZXlib2FyZCwgZmFjZSkgLT5cbiAgICAgICAgXG4gICAgICAgIEBwcm9jZXNzSW5wdXRzIGRhLCB0aW1lLCBkdGltZSwgZnBzLCB4cmVzLCB5cmVzLCBidWZmZXJzLCBjdWJlQnVmZmVycywga2V5Ym9hcmQsIGZhY2VcbiAgICAgICAgQHNldFVuaWZvcm1zICAgZGEsIHRpbWUsIGR0aW1lLCBmcHMsIHhyZXMsIHlyZXMsIGJ1ZmZlcnMsIGN1YmVCdWZmZXJzLCBrZXlib2FyZFxuICAgICAgICBsMSA9IEBtUmVuZGVyZXIuZ2V0QXR0cmliTG9jYXRpb24gQG1Qcm9ncmFtLCAncG9zJ1xuICAgICAgICB2cCA9IFsgMCwgMCwgeHJlcywgeXJlcyBdXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0Vmlld3BvcnQgdnBcbiAgICAgICAgQyA9IHN3aXRjaCBmYWNlXG4gICAgICAgICAgICB3aGVuIDAgdGhlbiBbICAxICAxICAxICAxICAxIC0xICAxIC0xIC0xICAxIC0xICAxIDAgMCAwXVxuICAgICAgICAgICAgd2hlbiAxIHRoZW4gWyAtMSAgMSAtMSAtMSAgMSAgMSAtMSAtMSAgMSAtMSAtMSAtMSAwIDAgMF1cbiAgICAgICAgICAgIHdoZW4gMiB0aGVuIFsgLTEgIDEgLTEgIDEgIDEgLTEgIDEgIDEgIDEgLTEgIDEgIDEgMCAwIDBdXG4gICAgICAgICAgICB3aGVuIDMgdGhlbiBbIC0xIC0xICAxICAxIC0xICAxICAxIC0xIC0xIC0xIC0xIC0xIDAgMCAwXVxuICAgICAgICAgICAgd2hlbiA0IHRoZW4gWyAtMSAgMSAgMSAgMSAgMSAgMSAgMSAtMSAgMSAtMSAtMSAgMSAwIDAgMF1cbiAgICAgICAgICAgIGVsc2UgICAgICAgIFsgIDEgIDEgLTEgLTEgIDEgLTEgLTEgLTEgLTEgIDEgLTEgLTEgMCAwIDBdXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBtUmVuZGVyZXIuc2V0U2hhZGVyQ29uc3RhbnQzRlYgJ3VuQ29ybmVycycgQ1xuICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50NEZWICd1blZpZXdwb3J0JyB2cFxuICAgICAgICBAbVJlbmRlcmVyLmRyYXdVbml0UXVhZF9YWSBsMVxuICAgICAgICBAbVJlbmRlcmVyLmRldHRhY2hUZXh0dXJlcygpXG4gICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgcGFpbnQ6IChkYSwgdGltZSwgZHRpbWUsIGZwcywgeHJlcywgeXJlcywgaXNQYXVzZWQsIGJ1ZmZlcklELCBidWZmZXJOZWVkc01pbWFwcywgYnVmZmVycywgY3ViZUJ1ZmZlcnMsIGtleWJvYXJkLCBlZmZlY3QpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAbVR5cGUgPT0gJ2ltYWdlJ1xuICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRSZW5kZXJUYXJnZXQgbnVsbFxuICAgICAgICAgICAgQHBhaW50SW1hZ2UgZGEsIHRpbWUsIGR0aW1lLCBmcHMsIHhyZXMsIHlyZXMsIGJ1ZmZlcnMsIGN1YmVCdWZmZXJzLCBrZXlib2FyZFxuICAgICAgICAgICAgQG1GcmFtZSsrXG4gICAgICAgIGVsc2UgaWYgQG1UeXBlID09ICdjb21tb24nXG4gICAgICAgICAgICAjY29uc29sZS5sb2coXCJyZW5kZXJpbmcgY29tbW9uXCIpO1xuICAgICAgICBlbHNlIGlmIEBtVHlwZSA9PSAnYnVmZmVyJ1xuICAgICAgICAgICAgQG1FZmZlY3QucmVzaXplQnVmZmVyIGJ1ZmZlcklELCBAbUVmZmVjdC5tWHJlcywgQG1FZmZlY3QubVlyZXMsIGZhbHNlXG4gICAgICAgICAgICBidWZmZXIgPSBidWZmZXJzW2J1ZmZlcklEXVxuICAgICAgICAgICAgZHN0SUQgPSAxIC0gKGJ1ZmZlci5tTGFzdFJlbmRlckRvbmUpXG4gICAgICAgICAgICBAbVJlbmRlcmVyLnNldFJlbmRlclRhcmdldCBidWZmZXIubVRhcmdldFtkc3RJRF1cbiAgICAgICAgICAgIEBwYWludEltYWdlIGRhLCB0aW1lLCBkdGltZSwgZnBzLCB4cmVzLCB5cmVzLCBidWZmZXJzLCBjdWJlQnVmZmVycywga2V5Ym9hcmRcblxuICAgICAgICAgICAgaWYgYnVmZmVyTmVlZHNNaW1hcHNcbiAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLmNyZWF0ZU1pcG1hcHMgYnVmZmVyLm1UZXh0dXJlW2RzdElEXVxuICAgICAgICAgICAgYnVmZmVyc1tidWZmZXJJRF0ubUxhc3RSZW5kZXJEb25lID0gMSAtIChidWZmZXJzW2J1ZmZlcklEXS5tTGFzdFJlbmRlckRvbmUpXG4gICAgICAgICAgICBAbUZyYW1lKytcbiAgICAgICAgZWxzZSBpZiBAbVR5cGUgPT0gJ2N1YmVtYXAnXG4gICAgICAgICAgICBAbUVmZmVjdC5yZXNpemVDdWJlbWFwQnVmZmVyIGJ1ZmZlcklELCAxMDI0LCAxMDI0LCBmYWxzZVxuICAgICAgICAgICAgYnVmZmVyID0gY3ViZUJ1ZmZlcnNbYnVmZmVySURdXG4gICAgICAgICAgICB4cmVzID0gYnVmZmVyLm1SZXNvbHV0aW9uWzBdXG4gICAgICAgICAgICB5cmVzID0gYnVmZmVyLm1SZXNvbHV0aW9uWzFdXG4gICAgICAgICAgICBkc3RJRCA9IDEgLSAoYnVmZmVyLm1MYXN0UmVuZGVyRG9uZSlcbiAgICAgICAgICAgIGZhY2UgPSAwXG4gICAgICAgICAgICB3aGlsZSBmYWNlIDwgNlxuICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0UmVuZGVyVGFyZ2V0Q3ViZU1hcCBidWZmZXIubVRhcmdldFtkc3RJRF0sIGZhY2VcbiAgICAgICAgICAgICAgICBAcGFpbnRDdWJlbWFwIGRhLCB0aW1lLCBkdGltZSwgZnBzLCB4cmVzLCB5cmVzLCBidWZmZXJzLCBjdWJlQnVmZmVycywga2V5Ym9hcmQsIGZhY2VcbiAgICAgICAgICAgICAgICBmYWNlKytcbiAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0UmVuZGVyVGFyZ2V0Q3ViZU1hcCBudWxsLCAwXG4gICAgICAgICAgICBpZiBidWZmZXJOZWVkc01pbWFwc1xuICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuY3JlYXRlTWlwbWFwcyBidWZmZXIubVRleHR1cmVbZHN0SURdXG4gICAgICAgICAgICBjdWJlQnVmZmVyc1tidWZmZXJJRF0ubUxhc3RSZW5kZXJEb25lID0gMSAtIChjdWJlQnVmZmVyc1tidWZmZXJJRF0ubUxhc3RSZW5kZXJEb25lKVxuICAgICAgICAgICAgQG1GcmFtZSsrXG4gICAgICAgIHJldHVyblxuICAgIFxubW9kdWxlLmV4cG9ydHMgPSBQYXNzIl19
//# sourceURL=../coffee/pass.coffee