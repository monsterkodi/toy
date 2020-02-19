// koffee 1.6.0
var Effect, Pass, Renderer, klog;

klog = require('kxk').klog;

Pass = require('./pass');

Renderer = require('./renderer');

Effect = (function() {
    function Effect(mGLContext, mXres, mYres) {
        var fr, i, j, keyboardData, keyboardImage, keyboardTexture, l, m, n, ref, ref1, ref2, res, vs;
        this.mGLContext = mGLContext;
        this.mXres = mXres;
        this.mYres = mYres;
        this.mCreated = false;
        this.mRenderer = null;
        this.mPasses = [];
        this.mFrame = 0;
        this.mMaxBuffers = 4;
        this.mMaxCubeBuffers = 1;
        this.mMaxPasses = this.mMaxBuffers + 3;
        this.mBuffers = [];
        this.mCubeBuffers = [];
        this.mRenderer = new Renderer(this.mGLContext);
        vs = 'layout(location = 0) in vec2 pos; void main() { gl_Position = vec4(pos.xy,0.0,1.0); }';
        fr = 'uniform vec4 v; uniform sampler2D t; out vec4 outColor; void main() { outColor = textureLod(t, gl_FragCoord.xy / v.zw, 0.0); }';
        this.mProgramCopy = this.mRenderer.createShader(vs, fr);
        if (this.mProgramCopy.mResult === false) {
            console.error('Failed to compile shader to copy buffers:', res.mInfo);
            return;
        }
        vs = 'layout(location = 0) in vec2 pos; void main() { gl_Position = vec4(pos.xy,0.0,1.0); }';
        fr = 'uniform vec4 v; uniform sampler2D t; out vec4 outColor; void main() { vec2 uv = gl_FragCoord.xy / v.zw; outColor = texture(t, vec2(uv.x,1.0-uv.y)); }';
        res = this.mRenderer.createShader(vs, fr);
        if (res.mResult === false) {
            console.error('Failed to compile shader to downscale buffers:', res);
            return;
        }
        for (i = l = 0, ref = this.mMaxBuffers; 0 <= ref ? l < ref : l > ref; i = 0 <= ref ? ++l : --l) {
            this.mBuffers[i] = {
                mTexture: [null, null],
                mTarget: [null, null],
                mResolution: [0, 0],
                mLastRenderDone: 0
            };
        }
        for (i = m = 0, ref1 = this.mMaxCubeBuffers; 0 <= ref1 ? m < ref1 : m > ref1; i = 0 <= ref1 ? ++m : --m) {
            this.mCubeBuffers[i] = {
                mTexture: [null, null],
                mTarget: [null, null],
                mResolution: [0, 0],
                mLastRenderDone: 0,
                mThumbnailRenderTarget: null
            };
        }
        keyboardData = new Uint8Array(256 * 3);
        for (j = n = 0, ref2 = 256 * 3; 0 <= ref2 ? n < ref2 : n > ref2; j = 0 <= ref2 ? ++n : --n) {
            keyboardData[j] = 0;
        }
        keyboardTexture = this.mRenderer.createTexture(Renderer.TEXTYPE.T2D, 256, 3, Renderer.TEXFMT.C1I8, Renderer.FILTER.NONE, Renderer.TEXWRP.CLAMP, null);
        keyboardImage = new Image;
        this.mKeyboard = {
            mData: keyboardData,
            mTexture: keyboardTexture,
            mIcon: keyboardImage
        };
        this.mCreated = true;
    }

    Effect.prototype.resizeCubemapBuffer = function(i, xres, yres) {
        var oldXres, oldYres, target1, target2, texture1, texture2;
        oldXres = this.mCubeBuffers[i].mResolution[0];
        oldYres = this.mCubeBuffers[i].mResolution[1];
        if (this.mCubeBuffers[i].mTexture[0] === null || oldXres !== xres || oldYres !== yres) {
            texture1 = this.mRenderer.createTexture(Renderer.TEXTYPE.CUBEMAP, xres, yres, Renderer.TEXFMT.C4F16, Renderer.FILTER.LINEAR, Renderer.TEXWRP.CLAMP, null);
            target1 = this.mRenderer.createRenderTargetCubeMap(texture1);
            texture2 = this.mRenderer.createTexture(Renderer.TEXTYPE.CUBEMAP, xres, yres, Renderer.TEXFMT.C4F16, Renderer.FILTER.LINEAR, Renderer.TEXWRP.CLAMP, null);
            target2 = this.mRenderer.createRenderTargetCubeMap(texture2);
            this.mCubeBuffers[i].mTexture = [texture1, texture2];
            this.mCubeBuffers[i].mTarget = [target1, target2];
            this.mCubeBuffers[i].mLastRenderDone = 0;
            this.mCubeBuffers[i].mResolution[0] = xres;
            return this.mCubeBuffers[i].mResolution[1] = yres;
        }
    };

    Effect.prototype.resizeBuffer = function(i, xres, yres, skipIfNotExists) {
        var l1, needCopy, oldXres, oldYres, target1, target2, texture1, texture2, v, vOld;
        if (skipIfNotExists && !this.mBuffers[i].mTexture[0]) {
            return;
        }
        klog("resizeBuffer " + i, this.mBuffers[i]);
        oldXres = this.mBuffers[i].mResolution[0];
        oldYres = this.mBuffers[i].mResolution[1];
        if (oldXres !== xres || oldYres !== yres) {
            needCopy = this.mBuffers[i].mTexture[0] !== null;
            texture1 = this.mRenderer.createTexture(Renderer.TEXTYPE.T2D, xres, yres, Renderer.TEXFMT.C4F32, (needCopy ? this.mBuffers[i].mTexture[0].mFilter : Renderer.FILTER.NONE), (needCopy ? this.mBuffers[i].mTexture[0].mWrap : Renderer.TEXWRP.CLAMP), null);
            texture2 = this.mRenderer.createTexture(Renderer.TEXTYPE.T2D, xres, yres, Renderer.TEXFMT.C4F32, (needCopy ? this.mBuffers[i].mTexture[1].mFilter : Renderer.FILTER.NONE), (needCopy ? this.mBuffers[i].mTexture[1].mWrap : Renderer.TEXWRP.CLAMP), null);
            target1 = this.mRenderer.createRenderTarget(texture1);
            target2 = this.mRenderer.createRenderTarget(texture2);
            if (needCopy) {
                v = [0, 0, Math.min(xres, oldXres), Math.min(yres, oldYres)];
                this.mRenderer.setBlend(false);
                this.mRenderer.setViewport(v);
                this.mRenderer.attachShader(this.mProgramCopy);
                l1 = this.mRenderer.getAttribLocation(this.mProgramCopy, 'pos');
                vOld = [0, 0, oldXres, oldYres];
                this.mRenderer.setShaderConstant4FV('v', vOld);
                this.mRenderer.setRenderTarget(target1);
                this.mRenderer.attachTextures(1, this.mBuffers[i].mTexture[0], null, null, null);
                this.mRenderer.drawUnitQuad_XY(l1);
                this.mRenderer.setRenderTarget(target2);
                this.mRenderer.attachTextures(1, this.mBuffers[i].mTexture[1], null, null, null);
                this.mRenderer.drawUnitQuad_XY(l1);
                this.mRenderer.destroyTexture(this.mBuffers[i].mTexture[0]);
                this.mRenderer.destroyRenderTarget(this.mBuffers[i].mTarget[0]);
                this.mRenderer.destroyTexture(this.mBuffers[i].mTexture[1]);
                this.mRenderer.destroyRenderTarget(this.mBuffers[i].mTarget[1]);
            }
            this.mBuffers[i].mTexture = [texture1, texture2];
            this.mBuffers[i].mTarget = [target1, target2];
            this.mBuffers[i].mLastRenderDone = 0;
            this.mBuffers[i].mResolution[0] = xres;
            return this.mBuffers[i].mResolution[1] = yres;
        }
    };

    Effect.prototype.resizeBuffers = function(xres, yres) {
        var i, l, ref;
        for (i = l = 0, ref = this.mMaxBuffers; 0 <= ref ? l < ref : l > ref; i = 0 <= ref ? ++l : --l) {
            this.resizeBuffer(i, xres, yres, true);
        }
        return this;
    };

    Effect.prototype.getTexture = function(passid, slot) {
        return this.mPasses[passid].getTexture(slot);
    };

    Effect.prototype.newTexture = function(passid, slot, url) {
        return this.mPasses[passid].newTexture(slot, url, this.mBuffers, this.mCubeBuffers, this.mKeyboard);
    };

    Effect.prototype.setOutputs = function(passid, slot, url) {
        return this.mPasses[passid].setOutputs(slot, url);
    };

    Effect.prototype.setOutputsByBufferID = function(passid, slot, id) {
        return this.mPasses[passid].setOutputsByBufferID(slot, id);
    };

    Effect.prototype.setKeyDown = function(k) {
        if (this.mKeyboard.mData[k + 0 * 256] === 255) {
            return;
        }
        this.mKeyboard.mData[k + 0 * 256] = 255;
        this.mKeyboard.mData[k + 1 * 256] = 255;
        this.mKeyboard.mData[k + 2 * 256] = 255 - this.mKeyboard.mData[k + 2 * 256];
        return this.mRenderer.updateTexture(this.mKeyboard.mTexture, 0, 0, 256, 3, this.mKeyboard.mData);
    };

    Effect.prototype.setKeyUp = function(k) {
        this.mKeyboard.mData[k + 0 * 256] = 0;
        this.mKeyboard.mData[k + 1 * 256] = 0;
        return this.mRenderer.updateTexture(this.mKeyboard.mTexture, 0, 0, 256, 3, this.mKeyboard.mData);
    };

    Effect.prototype.setSize = function(xres, yres) {
        var oldXres, oldYres;
        if (xres !== this.mXres || yres !== this.mYres) {
            oldXres = this.mXres;
            oldYres = this.mYres;
            this.mXres = xres;
            this.mYres = yres;
            this.resizeBuffers(xres, yres);
            return true;
        }
        return false;
    };

    Effect.prototype.resetTime = function() {
        var i, l, ref;
        this.mFrame = 0;
        for (i = l = 0, ref = this.mPasses.length; 0 <= ref ? l < ref : l > ref; i = 0 <= ref ? ++l : --l) {
            this.mPasses[i].mFrame = 0;
        }
        return this;
    };

    Effect.prototype.paint = function(time, dtime, fps, isPaused) {
        var bufferID, da, face, i, inp, j, k, l, m, n, needMipMaps, num, o, p, q, r, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, s, t, u, xres, yres;
        da = new Date;
        xres = this.mXres / 1;
        yres = this.mYres / 1;
        if (this.mFrame === 0) {
            for (i = l = 0, ref = this.mMaxBuffers; 0 <= ref ? l < ref : l > ref; i = 0 <= ref ? ++l : --l) {
                if (this.mBuffers[i].mTexture[0] !== null) {
                    this.mRenderer.setRenderTarget(this.mBuffers[i].mTarget[0]);
                    this.mRenderer.clear(Renderer.CLEAR.Color, [0, 0, 0, 0], 1, 0);
                    this.mRenderer.setRenderTarget(this.mBuffers[i].mTarget[1]);
                    this.mRenderer.clear(Renderer.CLEAR.Color, [0, 0, 0, 0], 1, 0);
                }
            }
            for (i = m = 0, ref1 = this.mMaxCubeBuffers; 0 <= ref1 ? m < ref1 : m > ref1; i = 0 <= ref1 ? ++m : --m) {
                if (this.mCubeBuffers[i].mTexture[0] !== null) {
                    for (face = n = 0; n <= 5; face = ++n) {
                        this.mRenderer.setRenderTargetCubeMap(this.mCubeBuffers[i].mTarget[0], face);
                        this.mRenderer.clear(Renderer.CLEAR.Color, [0, 0, 0, 0], 1.0, 0);
                        this.mRenderer.setRenderTargetCubeMap(this.mCubeBuffers[i].mTarget[1], face);
                        this.mRenderer.clear(Renderer.CLEAR.Color, [0, 0, 0, 0], 1.0, 0);
                    }
                }
            }
        }
        num = this.mPasses.length;
        for (i = o = 0, ref2 = num; 0 <= ref2 ? o < ref2 : o > ref2; i = 0 <= ref2 ? ++o : --o) {
            if (this.mPasses[i].mType !== 'buffer') {
                continue;
            }
            if (this.mPasses[i].mProgram === null) {
                continue;
            }
            bufferID = assetID_to_bufferID(this.mPasses[i].mOutputs[0]);
            needMipMaps = false;
            for (j = p = 0, ref3 = num; 0 <= ref3 ? p < ref3 : p > ref3; j = 0 <= ref3 ? ++p : --p) {
                for (k = q = 0, ref4 = this.mPasses[j].mInputs.length; 0 <= ref4 ? q < ref4 : q > ref4; k = 0 <= ref4 ? ++q : --q) {
                    inp = this.mPasses[j].mInputs[k];
                    if (inp !== null && inp.mInfo.mType === 'buffer' && inp.id === bufferID && inp.mInfo.mSampler.filter === 'mipmap') {
                        needMipMaps = true;
                        break;
                    }
                }
            }
            this.mPasses[i].paint(da, time, dtime, fps, xres, yres, isPaused, bufferID, needMipMaps, this.mBuffers, this.mCubeBuffers, this.mKeyboard, this);
        }
        for (i = r = 0, ref5 = num; 0 <= ref5 ? r < ref5 : r > ref5; i = 0 <= ref5 ? ++r : --r) {
            if (this.mPasses[i].mType !== 'cubemap') {
                continue;
            }
            if (this.mPasses[i].mProgram === null) {
                continue;
            }
            bufferID = 0;
            needMipMaps = false;
            for (j = s = 0, ref6 = num; 0 <= ref6 ? s < ref6 : s > ref6; j = 0 <= ref6 ? ++s : --s) {
                for (k = t = 0, ref7 = this.mPasses[j].mInputs.length; 0 <= ref7 ? t < ref7 : t > ref7; k = 0 <= ref7 ? ++t : --t) {
                    inp = this.mPasses[j].mInputs[k];
                    if (inp !== null && inp.mInfo.mType === 'cubemap') {
                        if (assetID_to_cubemapBuferID(inp.mInfo.mID) === 0 && inp.mInfo.mSampler.filter === 'mipmap') {
                            needMipMaps = true;
                            break;
                        }
                    }
                }
            }
            this.mPasses[i].paint(da, time, dtime, fps, xres, yres, isPaused, bufferID, needMipMaps, this.mBuffers, this.mCubeBuffers, this.mKeyboard, this);
        }
        for (i = u = 0, ref8 = num; 0 <= ref8 ? u < ref8 : u > ref8; i = 0 <= ref8 ? ++u : --u) {
            if (this.mPasses[i].mType !== 'image') {
                continue;
            }
            if (this.mPasses[i].mProgram === null) {
                continue;
            }
            this.mPasses[i].paint(da, time, dtime, fps, xres, yres, isPaused, null, false, this.mBuffers, this.mCubeBuffers, this.mKeyboard, this);
        }
        k = 0;
        while (k < 256) {
            this.mKeyboard.mData[k + 1 * 256] = 0;
            k++;
        }
        this.mRenderer.updateTexture(this.mKeyboard.mTexture, 0, 0, 256, 3, this.mKeyboard.mData);
        this.mFrame++;
    };

    Effect.prototype.newShader = function(shaderCode, passid) {
        var commonSourceCodes, i;
        commonSourceCodes = [];
        i = 0;
        while (i < this.mPasses.length) {
            if (this.mPasses[i].mType === 'common') {
                commonSourceCodes.push(this.mPasses[i].mSource);
            }
            i++;
        }
        return this.mPasses[passid].newShader(shaderCode, commonSourceCodes);
    };

    Effect.prototype.getNumPasses = function() {
        return this.mPasses.length;
    };

    Effect.prototype.getNumOfType = function(passtype) {
        var id, j;
        id = 0;
        j = 0;
        while (j < this.mPasses.length) {
            if (this.mPasses[j].mType === passtype) {
                id++;
            }
            j++;
        }
        return id;
    };

    Effect.prototype.getPassType = function(id) {
        return this.mPasses[id].mType;
    };

    Effect.prototype.getPassName = function(id) {
        return this.mPasses[id].mName;
    };

    Effect.prototype.newScriptJSON = function(passes) {
        var i, j, l, len, m, n, o, outputCH, outputID, p, passType, q, r, ref, ref1, ref2, ref3, ref4, res, result, rpass, rpassName, shaderStr;
        if (passes.length < 1 || passes.length > this.mMaxPasses) {
            return {
                mFailed: true,
                mError: 'Incorrect number of passes, wrong shader format',
                mShader: null
            };
        }
        res = [];
        res.mFailed = false;
        for (j = l = 0, ref = passes.length; 0 <= ref ? l < ref : l > ref; j = 0 <= ref ? ++l : --l) {
            rpass = passes[j];
            if (rpass.inputs != null) {
                rpass.inputs;
            } else {
                rpass.inputs = [];
            }
            if (rpass.outputs != null) {
                rpass.outputs;
            } else {
                rpass.outputs = [];
            }
            this.mPasses[j] = new Pass(this.mRenderer, j, this);
            for (i = m = 0; m <= 3; i = ++m) {
                this.mPasses[j].newTexture(i);
            }
            for (i = n = 0, ref1 = rpass.inputs.length; 0 <= ref1 ? n < ref1 : n > ref1; i = 0 <= ref1 ? ++n : --n) {
                this.mPasses[j].newTexture(rpass.inputs[i].channel, {
                    mType: rpass.inputs[i].type,
                    mID: rpass.inputs[i].id,
                    mSrc: rpass.inputs[i].src,
                    mSampler: rpass.inputs[i].sampler
                }, this.mBuffers, this.mCubeBuffers, this.mKeyboard);
            }
            for (i = o = 0; o <= 3; i = ++o) {
                this.mPasses[j].setOutputs(i, null);
            }
            for (i = p = 0, ref2 = rpass.outputs.length; 0 <= ref2 ? p < ref2 : p > ref2; i = 0 <= ref2 ? ++p : --p) {
                outputID = rpass.outputs[i].id;
                outputCH = rpass.outputs[i].channel;
                this.mPasses[j].setOutputs(outputCH, outputID);
            }
            rpassName = (function() {
                switch (rpass.type) {
                    case 'common':
                        return 'Common';
                    case 'image':
                        return 'Image';
                    case 'buffer':
                        return 'Buffer ' + String.fromCharCode(65 + assetID_to_bufferID(this.mPasses[j].mOutputs[0]));
                    case 'cubemap':
                        return 'Cube';
                }
            }).call(this);
            this.mPasses[j].create(rpass.type, rpassName);
        }
        ref3 = ['common', 'buffer', 'image', 'cubemap'];
        for (q = 0, len = ref3.length; q < len; q++) {
            passType = ref3[q];
            for (j = r = 0, ref4 = passes.length; 0 <= ref4 ? r < ref4 : r > ref4; j = 0 <= ref4 ? ++r : --r) {
                rpass = passes[j];
                if (rpass.type !== passType) {
                    continue;
                }
                shaderStr = rpass.code;
                result = this.newShader(shaderStr, j);
                if (result !== null) {
                    res.mFailed = true;
                    res[j] = {
                        mFailed: true,
                        mError: result,
                        mShader: shaderStr
                    };
                } else {
                    res[j] = {
                        mFailed: false,
                        mError: null,
                        mShader: shaderStr
                    };
                }
            }
        }
        return res;
    };

    module.exports = Effect;

    return Effect;

})();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWZmZWN0LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBTUEsSUFBQTs7QUFBRSxPQUFTLE9BQUEsQ0FBUSxLQUFSOztBQUNYLElBQUEsR0FBVyxPQUFBLENBQVEsUUFBUjs7QUFDWCxRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBRUw7SUFFQyxnQkFBQyxVQUFELEVBQWMsS0FBZCxFQUFzQixLQUF0QjtBQUVDLFlBQUE7UUFGQSxJQUFDLENBQUEsYUFBRDtRQUFhLElBQUMsQ0FBQSxRQUFEO1FBQVEsSUFBQyxDQUFBLFFBQUQ7UUFFckIsSUFBQyxDQUFBLFFBQUQsR0FBc0I7UUFDdEIsSUFBQyxDQUFBLFNBQUQsR0FBc0I7UUFDdEIsSUFBQyxDQUFBLE9BQUQsR0FBc0I7UUFDdEIsSUFBQyxDQUFBLE1BQUQsR0FBc0I7UUFDdEIsSUFBQyxDQUFBLFdBQUQsR0FBc0I7UUFDdEIsSUFBQyxDQUFBLGVBQUQsR0FBc0I7UUFDdEIsSUFBQyxDQUFBLFVBQUQsR0FBc0IsSUFBQyxDQUFBLFdBQUQsR0FBZTtRQUNyQyxJQUFDLENBQUEsUUFBRCxHQUFzQjtRQUN0QixJQUFDLENBQUEsWUFBRCxHQUFzQjtRQUN0QixJQUFDLENBQUEsU0FBRCxHQUFzQixJQUFJLFFBQUosQ0FBYSxJQUFDLENBQUEsVUFBZDtRQUV0QixFQUFBLEdBQUs7UUFDTCxFQUFBLEdBQUs7UUFDTCxJQUFDLENBQUEsWUFBRCxHQUFnQixJQUFDLENBQUEsU0FBUyxDQUFDLFlBQVgsQ0FBd0IsRUFBeEIsRUFBNEIsRUFBNUI7UUFDaEIsSUFBRyxJQUFDLENBQUEsWUFBWSxDQUFDLE9BQWQsS0FBeUIsS0FBNUI7WUFDRyxPQUFBLENBQUMsS0FBRCxDQUFPLDJDQUFQLEVBQW1ELEdBQUcsQ0FBQyxLQUF2RDtBQUNDLG1CQUZKOztRQUlBLEVBQUEsR0FBSztRQUNMLEVBQUEsR0FBSztRQUNMLEdBQUEsR0FBTSxJQUFDLENBQUEsU0FBUyxD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SSxDQUFBLENBQUEsQ0FBSixHQUNJO3dCQUFBLE9BQUEsRUFBUyxJQUFUO3dCQUNBLE1BQUEsRUFBUyxNQURUO3dCQUVBLE9BQUEsRUFBUyxTQUZUO3NCQUhSO2lCQUFBLE1BQUE7b0JBT0ksR0FBSSxDQUFBLENBQUEsQ0FBSixHQUNJO3dCQUFBLE9BQUEsRUFBUyxLQUFUO3dCQUNBLE1BQUEsRUFBUyxJQURUO3dCQUVBLE9BQUEsRUFBUyxTQUZUO3NCQVJSOztBQUxKO0FBRko7ZUFrQkE7SUEvRFc7O0lBaUVmLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4jIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiMgMDAwMDAwMCAgIDAwMDAwMCAgICAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4jIDAwMDAwMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICBcblxueyBrbG9nIH0gPSByZXF1aXJlICdreGsnXG5QYXNzICAgICA9IHJlcXVpcmUgJy4vcGFzcydcblJlbmRlcmVyID0gcmVxdWlyZSAnLi9yZW5kZXJlcidcblxuY2xhc3MgRWZmZWN0IFxuICAgIFxuICAgIEA6IChAbUdMQ29udGV4dCwgQG1YcmVzLCBAbVlyZXMpIC0+XG4gICAgICAgIFxuICAgICAgICBAbUNyZWF0ZWQgICAgICAgICAgID0gZmFsc2VcbiAgICAgICAgQG1SZW5kZXJlciAgICAgICAgICA9IG51bGxcbiAgICAgICAgQG1QYXNzZXMgICAgICAgICAgICA9IFtdXG4gICAgICAgIEBtRnJhbWUgICAgICAgICAgICAgPSAwXG4gICAgICAgIEBtTWF4QnVmZmVycyAgICAgICAgPSA0XG4gICAgICAgIEBtTWF4Q3ViZUJ1ZmZlcnMgICAgPSAxXG4gICAgICAgIEBtTWF4UGFzc2VzICAgICAgICAgPSBAbU1heEJ1ZmZlcnMgKyAzXG4gICAgICAgIEBtQnVmZmVycyAgICAgICAgICAgPSBbXVxuICAgICAgICBAbUN1YmVCdWZmZXJzICAgICAgID0gW11cbiAgICAgICAgQG1SZW5kZXJlciAgICAgICAgICA9IG5ldyBSZW5kZXJlciBAbUdMQ29udGV4dFxuICAgICAgICBcbiAgICAgICAgdnMgPSAnbGF5b3V0KGxvY2F0aW9uID0gMCkgaW4gdmVjMiBwb3M7IHZvaWQgbWFpbigpIHsgZ2xfUG9zaXRpb24gPSB2ZWM0KHBvcy54eSwwLjAsMS4wKTsgfSdcbiAgICAgICAgZnIgPSAndW5pZm9ybSB2ZWM0IHY7IHVuaWZvcm0gc2FtcGxlcjJEIHQ7IG91dCB2ZWM0IG91dENvbG9yOyB2b2lkIG1haW4oKSB7IG91dENvbG9yID0gdGV4dHVyZUxvZCh0LCBnbF9GcmFnQ29vcmQueHkgLyB2Lnp3LCAwLjApOyB9J1xuICAgICAgICBAbVByb2dyYW1Db3B5ID0gQG1SZW5kZXJlci5jcmVhdGVTaGFkZXIgdnMsIGZyXG4gICAgICAgIGlmIEBtUHJvZ3JhbUNvcHkubVJlc3VsdCA9PSBmYWxzZVxuICAgICAgICAgICAgZXJyb3IgJ0ZhaWxlZCB0byBjb21waWxlIHNoYWRlciB0byBjb3B5IGJ1ZmZlcnM6JyByZXMubUluZm9cbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgdnMgPSAnbGF5b3V0KGxvY2F0aW9uID0gMCkgaW4gdmVjMiBwb3M7IHZvaWQgbWFpbigpIHsgZ2xfUG9zaXRpb24gPSB2ZWM0KHBvcy54eSwwLjAsMS4wKTsgfSdcbiAgICAgICAgZnIgPSAndW5pZm9ybSB2ZWM0IHY7IHVuaWZvcm0gc2FtcGxlcjJEIHQ7IG91dCB2ZWM0IG91dENvbG9yOyB2b2lkIG1haW4oKSB7IHZlYzIgdXYgPSBnbF9GcmFnQ29vcmQueHkgLyB2Lnp3OyBvdXRDb2xvciA9IHRleHR1cmUodCwgdmVjMih1di54LDEuMC11di55KSk7IH0nXG4gICAgICAgIHJlcyA9IEBtUmVuZGVyZXIuY3JlYXRlU2hhZGVyIHZzLCBmclxuICAgICAgICBpZiByZXMubVJlc3VsdCA9PSBmYWxzZVxuICAgICAgICAgICAgZXJyb3IgJ0ZhaWxlZCB0byBjb21waWxlIHNoYWRlciB0byBkb3duc2NhbGUgYnVmZmVyczonIHJlc1xuICAgICAgICAgICAgcmV0dXJuXG5cbiAgICAgICAgZm9yIGkgaW4gWzAuLi5AbU1heEJ1ZmZlcnNdXG4gICAgICAgICAgICBAbUJ1ZmZlcnNbaV0gPVxuICAgICAgICAgICAgICAgIG1UZXh0dXJlOiBbIG51bGwgbnVsbCBdXG4gICAgICAgICAgICAgICAgbVRhcmdldDogIFsgbnVsbCBudWxsIF1cbiAgICAgICAgICAgICAgICBtUmVzb2x1dGlvbjogWyAwIDAgXVxuICAgICAgICAgICAgICAgIG1MYXN0UmVuZGVyRG9uZTogMFxuICAgICAgICBmb3IgaSBpbiBbMC4uLkBtTWF4Q3ViZUJ1ZmZlcnNdXG4gICAgICAgICAgICBAbUN1YmVCdWZmZXJzW2ldID1cbiAgICAgICAgICAgICAgICBtVGV4dHVyZTogWyBudWxsIG51bGwgXVxuICAgICAgICAgICAgICAgIG1UYXJnZXQ6ICBbIG51bGwgbnVsbCBdXG4gICAgICAgICAgICAgICAgbVJlc29sdXRpb246IFsgMCAwIF1cbiAgICAgICAgICAgICAgICBtTGFzdFJlbmRlckRvbmU6IDBcbiAgICAgICAgICAgICAgICBtVGh1bWJuYWlsUmVuZGVyVGFyZ2V0OiBudWxsXG5cbiAgICAgICAga2V5Ym9hcmREYXRhID0gbmV3IFVpbnQ4QXJyYXkgMjU2KjNcbiAgICAgICAgZm9yIGogaW4gWzAuLi4yNTYqM11cbiAgICAgICAgICAgIGtleWJvYXJkRGF0YVtqXSA9IDBcbiAgICAgICAgICAgIFxuICAgICAgICBrZXlib2FyZFRleHR1cmUgPSBAbVJlbmRlcmVyLmNyZWF0ZVRleHR1cmUoUmVuZGVyZXIuVEVYVFlQRS5UMkQsIDI1NiwgMywgUmVuZGVyZXIuVEVYRk1ULkMxSTgsIFJlbmRlcmVyLkZJTFRFUi5OT05FLCBSZW5kZXJlci5URVhXUlAuQ0xBTVAsIG51bGwpXG4gICAgICAgIGtleWJvYXJkSW1hZ2UgPSBuZXcgSW1hZ2VcbiAgICAgICAgQG1LZXlib2FyZCA9XG4gICAgICAgICAgICBtRGF0YTogICAga2V5Ym9hcmREYXRhXG4gICAgICAgICAgICBtVGV4dHVyZToga2V5Ym9hcmRUZXh0dXJlXG4gICAgICAgICAgICBtSWNvbjogICAga2V5Ym9hcmRJbWFnZVxuICAgICAgICBAbUNyZWF0ZWQgPSB0cnVlXG5cbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgMDAwICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICByZXNpemVDdWJlbWFwQnVmZmVyOiAoaSwgeHJlcywgeXJlcykgLT5cbiAgICAgICAgXG4gICAgICAgIG9sZFhyZXMgPSBAbUN1YmVCdWZmZXJzW2ldLm1SZXNvbHV0aW9uWzBdXG4gICAgICAgIG9sZFlyZXMgPSBAbUN1YmVCdWZmZXJzW2ldLm1SZXNvbHV0aW9uWzFdXG4gICAgICAgIFxuICAgICAgICBpZiBAbUN1YmVCdWZmZXJzW2ldLm1UZXh0dXJlWzBdID09IG51bGwgb3Igb2xkWHJlcyAhPSB4cmVzIG9yIG9sZFlyZXMgIT0geXJlc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0ZXh0dXJlMSA9IEBtUmVuZGVyZXIuY3JlYXRlVGV4dHVyZShSZW5kZXJlci5URVhUWVBFLkNVQkVNQVAsIHhyZXMsIHlyZXMsIFJlbmRlcmVyLlRFWEZNVC5DNEYxNiwgUmVuZGVyZXIuRklMVEVSLkxJTkVBUiwgUmVuZGVyZXIuVEVYV1JQLkNMQU1QLCBudWxsKVxuICAgICAgICAgICAgdGFyZ2V0MSAgPSBAbVJlbmRlcmVyLmNyZWF0ZVJlbmRlclRhcmdldEN1YmVNYXAgdGV4dHVyZTFcbiAgICAgICAgICAgIHRleHR1cmUyID0gQG1SZW5kZXJlci5jcmVhdGVUZXh0dXJlKFJlbmRlcmVyLlRFWFRZUEUuQ1VCRU1BUCwgeHJlcywgeXJlcywgUmVuZGVyZXIuVEVYRk1ULkM0RjE2LCBSZW5kZXJlci5GSUxURVIuTElORUFSLCBSZW5kZXJlci5URVhXUlAuQ0xBTVAsIG51bGwpXG4gICAgICAgICAgICB0YXJnZXQyICA9IEBtUmVuZGVyZXIuY3JlYXRlUmVuZGVyVGFyZ2V0Q3ViZU1hcCB0ZXh0dXJlMlxuXG4gICAgICAgICAgICBAbUN1YmVCdWZmZXJzW2ldLm1UZXh0dXJlID0gWyB0ZXh0dXJlMSwgdGV4dHVyZTIgXVxuICAgICAgICAgICAgQG1DdWJlQnVmZmVyc1tpXS5tVGFyZ2V0ICA9IFsgdGFyZ2V0MSwgdGFyZ2V0MiBdXG4gICAgICAgICAgICBAbUN1YmVCdWZmZXJzW2ldLm1MYXN0UmVuZGVyRG9uZSA9IDBcbiAgICAgICAgICAgIEBtQ3ViZUJ1ZmZlcnNbaV0ubVJlc29sdXRpb25bMF0gPSB4cmVzXG4gICAgICAgICAgICBAbUN1YmVCdWZmZXJzW2ldLm1SZXNvbHV0aW9uWzFdID0geXJlc1xuXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMCAgICAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIHJlc2l6ZUJ1ZmZlcjogKGksIHhyZXMsIHlyZXMsIHNraXBJZk5vdEV4aXN0cykgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHNraXBJZk5vdEV4aXN0cyBhbmQgbm90IEBtQnVmZmVyc1tpXS5tVGV4dHVyZVswXVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAga2xvZyBcInJlc2l6ZUJ1ZmZlciAje2l9XCIgQG1CdWZmZXJzW2ldXG4gICAgICAgIFxuICAgICAgICBvbGRYcmVzID0gQG1CdWZmZXJzW2ldLm1SZXNvbHV0aW9uWzBdXG4gICAgICAgIG9sZFlyZXMgPSBAbUJ1ZmZlcnNbaV0ubVJlc29sdXRpb25bMV1cbiAgICAgICAgXG4gICAgICAgIGlmIG9sZFhyZXMgIT0geHJlcyBvciBvbGRZcmVzICE9IHlyZXNcbiAgICAgICAgICAgIG5lZWRDb3B5ID0gQG1CdWZmZXJzW2ldLm1UZXh0dXJlWzBdICE9IG51bGxcbiAgICAgICAgICAgIHRleHR1cmUxID0gQG1SZW5kZXJlci5jcmVhdGVUZXh0dXJlKFJlbmRlcmVyLlRFWFRZUEUuVDJELCB4cmVzLCB5cmVzLCBSZW5kZXJlci5URVhGTVQuQzRGMzIsIChpZiBuZWVkQ29weSB0aGVuIEBtQnVmZmVyc1tpXS5tVGV4dHVyZVswXS5tRmlsdGVyIGVsc2UgUmVuZGVyZXIuRklMVEVSLk5PTkUpLCAoaWYgbmVlZENvcHkgdGhlbiBAbUJ1ZmZlcnNbaV0ubVRleHR1cmVbMF0ubVdyYXAgZWxzZSBSZW5kZXJlci5URVhXUlAuQ0xBTVApLCBudWxsKVxuICAgICAgICAgICAgdGV4dHVyZTIgPSBAbVJlbmRlcmVyLmNyZWF0ZVRleHR1cmUoUmVuZGVyZXIuVEVYVFlQRS5UMkQsIHhyZXMsIHlyZXMsIFJlbmRlcmVyLlRFWEZNVC5DNEYzMiwgKGlmIG5lZWRDb3B5IHRoZW4gQG1CdWZmZXJzW2ldLm1UZXh0dXJlWzFdLm1GaWx0ZXIgZWxzZSBSZW5kZXJlci5GSUxURVIuTk9ORSksIChpZiBuZWVkQ29weSB0aGVuIEBtQnVmZmVyc1tpXS5tVGV4dHVyZVsxXS5tV3JhcCBlbHNlIFJlbmRlcmVyLlRFWFdSUC5DTEFNUCksIG51bGwpXG4gICAgICAgICAgICB0YXJnZXQxICA9IEBtUmVuZGVyZXIuY3JlYXRlUmVuZGVyVGFyZ2V0IHRleHR1cmUxXG4gICAgICAgICAgICB0YXJnZXQyICA9IEBtUmVuZGVyZXIuY3JlYXRlUmVuZGVyVGFyZ2V0IHRleHR1cmUyXG4gICAgICAgICAgICBpZiBuZWVkQ29weVxuICAgICAgICAgICAgICAgIHYgPSBbIDAsIDAsIE1hdGgubWluKHhyZXMsIG9sZFhyZXMpLCBNYXRoLm1pbih5cmVzLCBvbGRZcmVzKSBdXG4gICAgICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRCbGVuZCBmYWxzZVxuICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0Vmlld3BvcnQgdlxuICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuYXR0YWNoU2hhZGVyIEBtUHJvZ3JhbUNvcHlcbiAgICAgICAgICAgICAgICBsMSA9IEBtUmVuZGVyZXIuZ2V0QXR0cmliTG9jYXRpb24gQG1Qcm9ncmFtQ29weSwgJ3BvcydcbiAgICAgICAgICAgICAgICB2T2xkID0gWyAwLCAwLCBvbGRYcmVzLCBvbGRZcmVzIF1cbiAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50NEZWICd2JyB2T2xkXG5cbiAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLnNldFJlbmRlclRhcmdldCB0YXJnZXQxXG4gICAgICAgICAgICAgICAgQG1SZW5kZXJlci5hdHRhY2hUZXh0dXJlcyAxLCBAbUJ1ZmZlcnNbaV0ubVRleHR1cmVbMF0sIG51bGwsIG51bGwsIG51bGxcbiAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLmRyYXdVbml0UXVhZF9YWSBsMVxuXG4gICAgICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRSZW5kZXJUYXJnZXQgdGFyZ2V0MlxuICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuYXR0YWNoVGV4dHVyZXMgMSwgQG1CdWZmZXJzW2ldLm1UZXh0dXJlWzFdLCBudWxsLCBudWxsLCBudWxsXG4gICAgICAgICAgICAgICAgQG1SZW5kZXJlci5kcmF3VW5pdFF1YWRfWFkgbDFcblxuICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuZGVzdHJveVRleHR1cmUgQG1CdWZmZXJzW2ldLm1UZXh0dXJlWzBdXG4gICAgICAgICAgICAgICAgQG1SZW5kZXJlci5kZXN0cm95UmVuZGVyVGFyZ2V0IEBtQnVmZmVyc1tpXS5tVGFyZ2V0WzBdXG4gICAgICAgICAgICAgICAgQG1SZW5kZXJlci5kZXN0cm95VGV4dHVyZSBAbUJ1ZmZlcnNbaV0ubVRleHR1cmVbMV1cbiAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLmRlc3Ryb3lSZW5kZXJUYXJnZXQgQG1CdWZmZXJzW2ldLm1UYXJnZXRbMV1cblxuICAgICAgICAgICAgQG1CdWZmZXJzW2ldLm1UZXh0dXJlID0gWyB0ZXh0dXJlMSwgdGV4dHVyZTIgXVxuICAgICAgICAgICAgQG1CdWZmZXJzW2ldLm1UYXJnZXQgID0gWyB0YXJnZXQxLCAgdGFyZ2V0MiAgXVxuICAgICAgICAgICAgQG1CdWZmZXJzW2ldLm1MYXN0UmVuZGVyRG9uZSA9IDBcbiAgICAgICAgICAgIEBtQnVmZmVyc1tpXS5tUmVzb2x1dGlvblswXSA9IHhyZXNcbiAgICAgICAgICAgIEBtQnVmZmVyc1tpXS5tUmVzb2x1dGlvblsxXSA9IHlyZXNcblxuICAgIHJlc2l6ZUJ1ZmZlcnM6ICh4cmVzLCB5cmVzKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5AbU1heEJ1ZmZlcnNdXG4gICAgICAgICAgICBAcmVzaXplQnVmZmVyIGksIHhyZXMsIHlyZXMsIHRydWVcbiAgICAgICAgQFxuXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGdldFRleHR1cmU6IChwYXNzaWQsIHNsb3QpIC0+XG4gICAgICAgIEBtUGFzc2VzW3Bhc3NpZF0uZ2V0VGV4dHVyZSBzbG90XG5cbiAgICBuZXdUZXh0dXJlOiAocGFzc2lkLCBzbG90LCB1cmwpIC0+XG4gICAgICAgIEBtUGFzc2VzW3Bhc3NpZF0ubmV3VGV4dHVyZSBzbG90LCB1cmwsIEBtQnVmZmVycywgQG1DdWJlQnVmZmVycywgQG1LZXlib2FyZFxuICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgICAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIHNldE91dHB1dHM6IChwYXNzaWQsIHNsb3QsIHVybCkgLT5cbiAgICAgICAgQG1QYXNzZXNbcGFzc2lkXS5zZXRPdXRwdXRzIHNsb3QsIHVybFxuICAgIFxuICAgIHNldE91dHB1dHNCeUJ1ZmZlcklEOiAocGFzc2lkLCBzbG90LCBpZCkgLT5cbiAgICAgICAgQG1QYXNzZXNbcGFzc2lkXS5zZXRPdXRwdXRzQnlCdWZmZXJJRCBzbG90LCBpZFxuICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHNldEtleURvd246IChrKSAtPlxuICAgICAgICAjIGtsb2cgXCJzZXRLZXlEb3duICN7a31cIlxuICAgICAgICBpZiBAbUtleWJvYXJkLm1EYXRhW2sgKyAwICogMjU2XSA9PSAyNTVcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBAbUtleWJvYXJkLm1EYXRhW2sgKyAwICogMjU2XSA9IDI1NVxuICAgICAgICBAbUtleWJvYXJkLm1EYXRhW2sgKyAxICogMjU2XSA9IDI1NVxuICAgICAgICBAbUtleWJvYXJkLm1EYXRhW2sgKyAyICogMjU2XSA9IDI1NSAtIChAbUtleWJvYXJkLm1EYXRhW2sgKyAyICogMjU2XSlcbiAgICAgICAgQG1SZW5kZXJlci51cGRhdGVUZXh0dXJlIEBtS2V5Ym9hcmQubVRleHR1cmUsIDAsIDAsIDI1NiwgMywgQG1LZXlib2FyZC5tRGF0YVxuICAgIFxuICAgIHNldEtleVVwOiAoaykgLT5cbiAgICAgICAgIyBrbG9nIFwic2V0S2V5VXAgI3trfVwiXG4gICAgICAgIEBtS2V5Ym9hcmQubURhdGFbayArIDAgKiAyNTZdID0gMFxuICAgICAgICBAbUtleWJvYXJkLm1EYXRhW2sgKyAxICogMjU2XSA9IDBcbiAgICAgICAgQG1SZW5kZXJlci51cGRhdGVUZXh0dXJlIEBtS2V5Ym9hcmQubVRleHR1cmUsIDAsIDAsIDI1NiwgMywgQG1LZXlib2FyZC5tRGF0YVxuICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgICAwMDAgICAgMDAwMDAwMCAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIHNldFNpemU6ICh4cmVzLCB5cmVzKSAtPlxuICAgICAgICBpZiB4cmVzICE9IEBtWHJlcyBvciB5cmVzICE9IEBtWXJlc1xuICAgICAgICAgICAgb2xkWHJlcyA9IEBtWHJlc1xuICAgICAgICAgICAgb2xkWXJlcyA9IEBtWXJlc1xuICAgICAgICAgICAgQG1YcmVzID0geHJlc1xuICAgICAgICAgICAgQG1ZcmVzID0geXJlc1xuICAgICAgICAgICAgQHJlc2l6ZUJ1ZmZlcnMgeHJlcywgeXJlc1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgZmFsc2VcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgMDAgICAgIDAwICAwMDAwMDAwMCAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAgcmVzZXRUaW1lOiAtPlxuICAgICAgICBAbUZyYW1lID0gMFxuICAgICAgICBmb3IgaSBpbiBbMC4uLkBtUGFzc2VzLmxlbmd0aF1cbiAgICAgICAgICAgIEBtUGFzc2VzW2ldLm1GcmFtZSA9IDBcbiAgICAgICAgQFxuICAgIFxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHBhaW50OiAodGltZSwgZHRpbWUsIGZwcywgaXNQYXVzZWQpIC0+XG4gICAgICAgIFxuICAgICAgICBkYSAgID0gbmV3IERhdGVcbiAgICAgICAgeHJlcyA9IEBtWHJlcyAvIDFcbiAgICAgICAgeXJlcyA9IEBtWXJlcyAvIDFcbiAgICAgICAgXG4gICAgICAgIGlmIEBtRnJhbWUgPT0gMFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgaSBpbiBbMC4uLkBtTWF4QnVmZmVyc11cbiAgICAgICAgICAgICAgICBpZiBAbUJ1ZmZlcnNbaV0ubVRleHR1cmVbMF0gIT0gbnVsbFxuICAgICAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLnNldFJlbmRlclRhcmdldCBAbUJ1ZmZlcnNbaV0ubVRhcmdldFswXVxuICAgICAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLmNsZWFyIFJlbmRlcmVyLkNMRUFSLkNvbG9yLCBbIDAgMCAwIDAgXSwgMSAwXG4gICAgICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0UmVuZGVyVGFyZ2V0IEBtQnVmZmVyc1tpXS5tVGFyZ2V0WzFdXG4gICAgICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuY2xlYXIgUmVuZGVyZXIuQ0xFQVIuQ29sb3IsIFsgMCAwIDAgMCBdLCAxIDBcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgaSBpbiBbMC4uLkBtTWF4Q3ViZUJ1ZmZlcnNdXG4gICAgICAgICAgICAgICAgaWYgQG1DdWJlQnVmZmVyc1tpXS5tVGV4dHVyZVswXSAhPSBudWxsXG4gICAgICAgICAgICAgICAgICAgIGZvciBmYWNlIGluIFswLi41XVxuICAgICAgICAgICAgICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRSZW5kZXJUYXJnZXRDdWJlTWFwIEBtQ3ViZUJ1ZmZlcnNbaV0ubVRhcmdldFswXSwgZmFjZVxuICAgICAgICAgICAgICAgICAgICAgICAgQG1SZW5kZXJlci5jbGVhciBSZW5kZXJlci5DTEVBUi5Db2xvciwgWyAwIDAgMCAwIF0sIDEuMCwgMFxuICAgICAgICAgICAgICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRSZW5kZXJUYXJnZXRDdWJlTWFwIEBtQ3ViZUJ1ZmZlcnNbaV0ubVRhcmdldFsxXSwgZmFjZVxuICAgICAgICAgICAgICAgICAgICAgICAgQG1SZW5kZXJlci5jbGVhciBSZW5kZXJlci5DTEVBUi5Db2xvciwgWyAwIDAgMCAwIF0sIDEuMCwgMFxuXG4gICAgICAgIG51bSA9IEBtUGFzc2VzLmxlbmd0aFxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5udW1dICMgcmVuZGVyIGJ1ZmZlcnMgc2Vjb25kXG4gICAgICAgICAgICBpZiBAbVBhc3Nlc1tpXS5tVHlwZSAhPSAnYnVmZmVyJyB0aGVuIGNvbnRpbnVlXG4gICAgICAgICAgICBpZiBAbVBhc3Nlc1tpXS5tUHJvZ3JhbSA9PSBudWxsICB0aGVuIGNvbnRpbnVlXG4gICAgICAgICAgICBidWZmZXJJRCA9IGFzc2V0SURfdG9fYnVmZmVySUQoQG1QYXNzZXNbaV0ubU91dHB1dHNbMF0pXG5cbiAgICAgICAgICAgIG5lZWRNaXBNYXBzID0gZmFsc2UgIyBjaGVjayBpZiBhbnkgZG93bnN0cmVhbSBwYXNzIG5lZWRzIG1pcG1hcHNcbiAgICAgICAgICAgIGZvciBqIGluIFswLi4ubnVtXVxuICAgICAgICAgICAgICAgIGZvciBrIGluIFswLi4uQG1QYXNzZXNbal0ubUlucHV0cy5sZW5ndGhdXG4gICAgICAgICAgICAgICAgICAgIGlucCA9IEBtUGFzc2VzW2pdLm1JbnB1dHNba11cbiAgICAgICAgICAgICAgICAgICAgaWYgaW5wICE9IG51bGwgYW5kIGlucC5tSW5mby5tVHlwZSA9PSAnYnVmZmVyJyBhbmQgaW5wLmlkID09IGJ1ZmZlcklEIGFuZCBpbnAubUluZm8ubVNhbXBsZXIuZmlsdGVyID09ICdtaXBtYXAnXG4gICAgICAgICAgICAgICAgICAgICAgICBuZWVkTWlwTWFwcyA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBAbVBhc3Nlc1tpXS5wYWludCBkYSwgdGltZSwgZHRpbWUsIGZwcywgeHJlcywgeXJlcywgaXNQYXVzZWQsIGJ1ZmZlcklELCBuZWVkTWlwTWFwcywgQG1CdWZmZXJzLCBAbUN1YmVCdWZmZXJzLCBAbUtleWJvYXJkLCBAXG4gICAgICAgIFxuICAgICAgICBmb3IgaSBpbiBbMC4uLm51bV0gIyByZW5kZXIgY3ViZW1hcCBidWZmZXJzIHNlY29uZFxuICAgICAgICAgICAgaWYgQG1QYXNzZXNbaV0ubVR5cGUgIT0gJ2N1YmVtYXAnIHRoZW4gY29udGludWVcbiAgICAgICAgICAgIGlmIEBtUGFzc2VzW2ldLm1Qcm9ncmFtID09IG51bGwgICB0aGVuIGNvbnRpbnVlXG4gICAgICAgICAgICBidWZmZXJJRCA9IDBcblxuICAgICAgICAgICAgbmVlZE1pcE1hcHMgPSBmYWxzZSAjIGNoZWNrIGlmIGFueSBkb3duc3RyZWFtIHBhc3MgbmVlZHMgbWlwbWFwc1xuICAgICAgICAgICAgZm9yIGogaW4gWzAuLi5udW1dXG4gICAgICAgICAgICAgICAgZm9yIGsgaW4gWzAuLi5AbVBhc3Nlc1tqXS5tSW5wdXRzLmxlbmd0aF1cbiAgICAgICAgICAgICAgICAgICAgaW5wID0gQG1QYXNzZXNbal0ubUlucHV0c1trXVxuICAgICAgICAgICAgICAgICAgICBpZiBpbnAgIT0gbnVsbCBhbmQgaW5wLm1JbmZvLm1UeXBlID09ICdjdWJlbWFwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgYXNzZXRJRF90b19jdWJlbWFwQnVmZXJJRChpbnAubUluZm8ubUlEKSA9PSAwIGFuZCBpbnAubUluZm8ubVNhbXBsZXIuZmlsdGVyID09ICdtaXBtYXAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmVlZE1pcE1hcHMgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIEBtUGFzc2VzW2ldLnBhaW50IGRhLCB0aW1lLCBkdGltZSwgZnBzLCB4cmVzLCB5cmVzLCBpc1BhdXNlZCwgYnVmZmVySUQsIG5lZWRNaXBNYXBzLCBAbUJ1ZmZlcnMsIEBtQ3ViZUJ1ZmZlcnMsIEBtS2V5Ym9hcmQsIEBcblxuICAgICAgICBmb3IgaSBpbiBbMC4uLm51bV0gIyByZW5kZXIgaW1hZ2UgbGFzdFxuICAgICAgICAgICAgaWYgQG1QYXNzZXNbaV0ubVR5cGUgIT0gJ2ltYWdlJyB0aGVuIGNvbnRpbnVlXG4gICAgICAgICAgICBpZiBAbVBhc3Nlc1tpXS5tUHJvZ3JhbSA9PSBudWxsIHRoZW4gY29udGludWVcbiAgICAgICAgICAgIEBtUGFzc2VzW2ldLnBhaW50IGRhLCB0aW1lLCBkdGltZSwgZnBzLCB4cmVzLCB5cmVzLCBpc1BhdXNlZCwgbnVsbCwgZmFsc2UsIEBtQnVmZmVycywgQG1DdWJlQnVmZmVycywgQG1LZXlib2FyZCwgQFxuXG4gICAgICAgIGsgPSAwXG4gICAgICAgIHdoaWxlIGsgPCAyNTZcbiAgICAgICAgICAgIEBtS2V5Ym9hcmQubURhdGFbayArIDEgKiAyNTZdID0gMFxuICAgICAgICAgICAgaysrXG4gICAgICAgIEBtUmVuZGVyZXIudXBkYXRlVGV4dHVyZSBAbUtleWJvYXJkLm1UZXh0dXJlLCAwLCAwLCAyNTYsIDMsIEBtS2V5Ym9hcmQubURhdGFcbiAgICAgICAgQG1GcmFtZSsrXG4gICAgICAgIHJldHVyblxuICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgXG4gICAgXG4gICAgbmV3U2hhZGVyOiAoc2hhZGVyQ29kZSwgcGFzc2lkKSAtPlxuICAgICAgICBjb21tb25Tb3VyY2VDb2RlcyA9IFtdXG4gICAgICAgIGkgPSAwXG4gICAgICAgIHdoaWxlIGkgPCBAbVBhc3Nlcy5sZW5ndGhcbiAgICAgICAgICAgIGlmIEBtUGFzc2VzW2ldLm1UeXBlID09ICdjb21tb24nXG4gICAgICAgICAgICAgICAgY29tbW9uU291cmNlQ29kZXMucHVzaCBAbVBhc3Nlc1tpXS5tU291cmNlXG4gICAgICAgICAgICBpKytcbiAgICAgICAgQG1QYXNzZXNbcGFzc2lkXS5uZXdTaGFkZXIgc2hhZGVyQ29kZSwgY29tbW9uU291cmNlQ29kZXNcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGdldE51bVBhc3NlczogLT5cbiAgICAgICAgQG1QYXNzZXMubGVuZ3RoXG4gICAgXG4gICAgZ2V0TnVtT2ZUeXBlOiAocGFzc3R5cGUpIC0+XG4gICAgICAgIGlkID0gMFxuICAgICAgICBqID0gMFxuICAgICAgICB3aGlsZSBqIDwgQG1QYXNzZXMubGVuZ3RoXG4gICAgICAgICAgICBpZiBAbVBhc3Nlc1tqXS5tVHlwZSA9PSBwYXNzdHlwZVxuICAgICAgICAgICAgICAgIGlkKytcbiAgICAgICAgICAgIGorK1xuICAgICAgICBpZFxuICAgIFxuICAgIGdldFBhc3NUeXBlOiAoaWQpIC0+XG4gICAgICAgIEBtUGFzc2VzW2lkXS5tVHlwZVxuICAgIFxuICAgIGdldFBhc3NOYW1lOiAoaWQpIC0+XG4gICAgICAgIEBtUGFzc2VzW2lkXS5tTmFtZVxuICAgIFxuICAgICMgICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgICAgICAgMDAwICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG5ld1NjcmlwdEpTT046IChwYXNzZXMpIC0+XG4gICAgICAgIGlmIHBhc3Nlcy5sZW5ndGggPCAxIG9yIHBhc3Nlcy5sZW5ndGggPiBAbU1heFBhc3Nlc1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgbUZhaWxlZDogdHJ1ZVxuICAgICAgICAgICAgICAgIG1FcnJvcjogJ0luY29ycmVjdCBudW1iZXIgb2YgcGFzc2VzLCB3cm9uZyBzaGFkZXIgZm9ybWF0J1xuICAgICAgICAgICAgICAgIG1TaGFkZXI6IG51bGxcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgcmVzID0gW11cbiAgICAgICAgcmVzLm1GYWlsZWQgPSBmYWxzZVxuICAgICAgICBcbiAgICAgICAgZm9yIGogaW4gWzAuLi5wYXNzZXMubGVuZ3RoXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBycGFzcyA9IHBhc3Nlc1tqXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBycGFzcy5pbnB1dHMgID89IFtdXG4gICAgICAgICAgICBycGFzcy5vdXRwdXRzID89IFtdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBtUGFzc2VzW2pdID0gbmV3IFBhc3MgQG1SZW5kZXJlciwgaiwgQFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgaSBpbiBbMC4uM11cbiAgICAgICAgICAgICAgICBAbVBhc3Nlc1tqXS5uZXdUZXh0dXJlIGlcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBpIGluIFswLi4ucnBhc3MuaW5wdXRzLmxlbmd0aF1cbiAgICAgICAgICAgICAgICBAbVBhc3Nlc1tqXS5uZXdUZXh0dXJlIHJwYXNzLmlucHV0c1tpXS5jaGFubmVsLFxuICAgICAgICAgICAgICAgICAgICBtVHlwZTogICAgICBycGFzcy5pbnB1dHNbaV0udHlwZVxuICAgICAgICAgICAgICAgICAgICBtSUQ6ICAgICAgICBycGFzcy5pbnB1dHNbaV0uaWRcbiAgICAgICAgICAgICAgICAgICAgbVNyYzogICAgICAgcnBhc3MuaW5wdXRzW2ldLnNyY1xuICAgICAgICAgICAgICAgICAgICBtU2FtcGxlcjogICBycGFzcy5pbnB1dHNbaV0uc2FtcGxlclxuICAgICAgICAgICAgICAgICwgQG1CdWZmZXJzLCBAbUN1YmVCdWZmZXJzLCBAbUtleWJvYXJkXG5cbiAgICAgICAgICAgIGZvciBpIGluIFswLi4zXVxuICAgICAgICAgICAgICAgIEBtUGFzc2VzW2pdLnNldE91dHB1dHMgaSwgbnVsbFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIGkgaW4gWzAuLi5ycGFzcy5vdXRwdXRzLmxlbmd0aF1cbiAgICAgICAgICAgICAgICBvdXRwdXRJRCA9IHJwYXNzLm91dHB1dHNbaV0uaWRcbiAgICAgICAgICAgICAgICBvdXRwdXRDSCA9IHJwYXNzLm91dHB1dHNbaV0uY2hhbm5lbFxuICAgICAgICAgICAgICAgIEBtUGFzc2VzW2pdLnNldE91dHB1dHMgb3V0cHV0Q0gsIG91dHB1dElEXG5cbiAgICAgICAgICAgIHJwYXNzTmFtZSA9IHN3aXRjaCBycGFzcy50eXBlXG4gICAgICAgICAgICAgICAgd2hlbiAnY29tbW9uJyAgdGhlbiAnQ29tbW9uJ1xuICAgICAgICAgICAgICAgIHdoZW4gJ2ltYWdlJyAgIHRoZW4gJ0ltYWdlJ1xuICAgICAgICAgICAgICAgIHdoZW4gJ2J1ZmZlcicgIHRoZW4gJ0J1ZmZlciAnICsgU3RyaW5nLmZyb21DaGFyQ29kZSg2NSArIGFzc2V0SURfdG9fYnVmZmVySUQoQG1QYXNzZXNbal0ubU91dHB1dHNbMF0pKVxuICAgICAgICAgICAgICAgIHdoZW4gJ2N1YmVtYXAnIHRoZW4gJ0N1YmUnXG4gICAgICAgICAgICBAbVBhc3Nlc1tqXS5jcmVhdGUgcnBhc3MudHlwZSwgcnBhc3NOYW1lXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIHBhc3NUeXBlIGluIFsnY29tbW9uJyAnYnVmZmVyJyAnaW1hZ2UnICdjdWJlbWFwJ11cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIGogaW4gWzAuLi5wYXNzZXMubGVuZ3RoXVxuICAgICAgICAgICAgICAgIHJwYXNzID0gcGFzc2VzW2pdXG4gICAgICAgICAgICAgICAgaWYgcnBhc3MudHlwZSAhPSBwYXNzVHlwZSAgdGhlbiBjb250aW51ZVxuICAgICAgICAgICAgICAgIHNoYWRlclN0ciA9IHJwYXNzLmNvZGVcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBAbmV3U2hhZGVyIHNoYWRlclN0ciwgalxuICAgICAgICAgICAgICAgIGlmIHJlc3VsdCAhPSBudWxsXG4gICAgICAgICAgICAgICAgICAgIHJlcy5tRmFpbGVkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICByZXNbal0gPVxuICAgICAgICAgICAgICAgICAgICAgICAgbUZhaWxlZDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgbUVycm9yOiAgcmVzdWx0XG4gICAgICAgICAgICAgICAgICAgICAgICBtU2hhZGVyOiBzaGFkZXJTdHJcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHJlc1tqXSA9XG4gICAgICAgICAgICAgICAgICAgICAgICBtRmFpbGVkOiBmYWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgbUVycm9yOiAgbnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgbVNoYWRlcjogc2hhZGVyU3RyXG4gICAgICAgIHJlc1xuICAgICAgICBcbiAgICBtb2R1bGUuZXhwb3J0cyA9IEVmZmVjdCJdfQ==
//# sourceURL=../coffee/effect.coffee