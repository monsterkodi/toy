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

    Effect.prototype.bufferID_to_assetID = function(id) {
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

    Effect.prototype.assetID_to_bufferID = function(id) {
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

    Effect.prototype.assetID_to_cubemapBuferID = function(id) {
        return id !== '4dX3Rr' && -1 || 0;
    };

    Effect.prototype.cubamepBufferID_to_assetID = function(id) {
        return id === 0 && '4dX3Rr' || 'none';
    };

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
        var bufferID, da, face, i, inp, j, k, l, m, n, needMipMaps, num, o, p, q, r, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, s, t, u, xres, yres;
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
            bufferID = this.assetID_to_bufferID(this.mPasses[i].mOutput);
            needMipMaps = false;
            for (j = p = 0, ref3 = num; 0 <= ref3 ? p < ref3 : p > ref3; j = 0 <= ref3 ? ++p : --p) {
                for (k = q = 0, ref4 = this.mPasses[j].mInputs.length; 0 <= ref4 ? q < ref4 : q > ref4; k = 0 <= ref4 ? ++q : --q) {
                    inp = this.mPasses[j].mInputs[k];
                    if (inp !== null && inp.mInfo.mType === 'buffer' && inp.id === bufferID && ((ref5 = inp.mInfo.mSampler) != null ? ref5.filter : void 0) === 'mipmap') {
                        needMipMaps = true;
                        break;
                    }
                }
            }
            this.mPasses[i].paint(da, time, dtime, fps, xres, yres, isPaused, bufferID, needMipMaps, this.mBuffers, this.mCubeBuffers, this.mKeyboard, this);
        }
        for (i = r = 0, ref6 = num; 0 <= ref6 ? r < ref6 : r > ref6; i = 0 <= ref6 ? ++r : --r) {
            if (this.mPasses[i].mType !== 'cubemap') {
                continue;
            }
            if (this.mPasses[i].mProgram === null) {
                continue;
            }
            bufferID = 0;
            needMipMaps = false;
            for (j = s = 0, ref7 = num; 0 <= ref7 ? s < ref7 : s > ref7; j = 0 <= ref7 ? ++s : --s) {
                for (k = t = 0, ref8 = this.mPasses[j].mInputs.length; 0 <= ref8 ? t < ref8 : t > ref8; k = 0 <= ref8 ? ++t : --t) {
                    inp = this.mPasses[j].mInputs[k];
                    if (inp !== null && inp.mInfo.mType === 'cubemap') {
                        if (this.assetID_to_cubemapBuferID(inp.mInfo.mID) === 0 && inp.mInfo.mSampler.filter === 'mipmap') {
                            needMipMaps = true;
                            break;
                        }
                    }
                }
            }
            this.mPasses[i].paint(da, time, dtime, fps, xres, yres, isPaused, bufferID, needMipMaps, this.mBuffers, this.mCubeBuffers, this.mKeyboard, this);
        }
        for (i = u = 0, ref9 = num; 0 <= ref9 ? u < ref9 : u > ref9; i = 0 <= ref9 ? ++u : --u) {
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
        var i, j, l, len, m, n, o, p, passType, ref, ref1, ref2, ref3, res, result, rpass, rpassName, shaderStr;
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
            if (rpass.output) {
                this.mPasses[j].mOutput = rpass.output;
            }
            rpassName = (function() {
                switch (rpass.type) {
                    case 'common':
                        return 'Common';
                    case 'image':
                        return 'Image';
                    case 'buffer':
                        return 'Buffer ' + String.fromCharCode(65 + this.assetID_to_bufferID(this.mPasses[j].mOutput));
                    case 'cubemap':
                        return 'Cube';
                }
            }).call(this);
            this.mPasses[j].create(rpass.type, rpassName);
        }
        ref2 = ['common', 'buffer', 'image', 'cubemap'];
        for (o = 0, len = ref2.length; o < len; o++) {
            passType = ref2[o];
            for (j = p = 0, ref3 = passes.length; 0 <= ref3 ? p < ref3 : p > ref3; j = 0 <= ref3 ? ++p : --p) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWZmZWN0LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBTUEsSUFBQTs7QUFBRSxPQUFTLE9BQUEsQ0FBUSxLQUFSOztBQUNYLElBQUEsR0FBVyxPQUFBLENBQVEsUUFBUjs7QUFDWCxRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0FBRUw7SUFFQyxnQkFBQyxVQUFELEVBQWMsS0FBZCxFQUFzQixLQUF0QjtBQUVDLFlBQUE7UUFGQSxJQUFDLENBQUEsYUFBRDtRQUFhLElBQUMsQ0FBQSxRQUFEO1FBQVEsSUFBQyxDQUFBLFFBQUQ7UUFFckIsSUFBQyxDQUFBLFFBQUQsR0FBc0I7UUFDdEIsSUFBQyxDQUFBLFNBQUQsR0FBc0I7UUFDdEIsSUFBQyxDQUFBLE9BQUQsR0FBc0I7UUFDdEIsSUFBQyxDQUFBLE1BQUQsR0FBc0I7UUFDdEIsSUFBQyxDQUFBLFdBQUQsR0FBc0I7UUFDdEIsSUFBQyxDQUFBLGVBQUQsR0FBc0I7UUFDdEIsSUFBQyxDQUFBLFVBQUQsR0FBc0IsSUFBQyxDQUFBLFdBQUQsR0FBZTtRQUNyQyxJQUFDLENBQUEsUUFBRCxHQUFzQjtRQUN0QixJQUFDLENBQUEsWUFBRCxHQUFzQjtRQUN0QixJQUFDLENBQUEsU0FBRCxHQUFzQixJQUFJLFFBQUosQ0FBYSxJQUFDLENBQUEsVUFBZDtRQUV0QixFQUFBLEdBQUs7UUFDTCxFQUFBLEdBQUs7UUFDTCxJQUFDLENBQUEsWUFBRCxHQUFnQixJQUFDLENBQUEsU0FBUyxDQUFDLFlBQVgsQ0FBd0IsRUFBeEIsRUFBNEIsRUFBNUI7UUFDaEIsSUFBRyxJQUFDLENBQUEsWUFBWSxDQUFDLE9BQWQsS0FBeUIsS0FBNUI7WUFDRyxPQUFBLENBQUMsS0FBRCxDQUFPLDJDQUFQLEVBQW1ELEdBQUcsQ0FBQyxLQUF2RDtBQUNDLG1CQUZKOztRQUlBLEVBQUEsR0FBSztRQUNMLEVBQUEsR0FBSztRQUNMLEdBQUEsR0FBTSxJQUFDLENBQUEsU0FBUyxD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QSxDQUFBLENBQUosR0FDSTt3QkFBQSxPQUFBLEVBQVMsSUFBVDt3QkFDQSxNQUFBLEVBQVMsTUFEVDt3QkFFQSxPQUFBLEVBQVMsU0FGVDtzQkFIUjtpQkFBQSxNQUFBO29CQU9JLEdBQUksQ0FBQSxDQUFBLENBQUosR0FDSTt3QkFBQSxPQUFBLEVBQVMsS0FBVDt3QkFDQSxNQUFBLEVBQVMsSUFEVDt3QkFFQSxPQUFBLEVBQVMsU0FGVDtzQkFSUjs7QUFMSjtBQUZKO2VBa0JBO0lBeERXOztJQTBEZixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMgMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4jIDAwMDAwMDAgICAwMDAwMDAgICAgMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiMgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuIyAwMDAwMDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgXG5cbnsga2xvZyB9ID0gcmVxdWlyZSAna3hrJ1xuUGFzcyAgICAgPSByZXF1aXJlICcuL3Bhc3MnXG5SZW5kZXJlciA9IHJlcXVpcmUgJy4vcmVuZGVyZXInXG5cbmNsYXNzIEVmZmVjdCBcbiAgICBcbiAgICBAOiAoQG1HTENvbnRleHQsIEBtWHJlcywgQG1ZcmVzKSAtPlxuICAgICAgICBcbiAgICAgICAgQG1DcmVhdGVkICAgICAgICAgICA9IGZhbHNlXG4gICAgICAgIEBtUmVuZGVyZXIgICAgICAgICAgPSBudWxsXG4gICAgICAgIEBtUGFzc2VzICAgICAgICAgICAgPSBbXVxuICAgICAgICBAbUZyYW1lICAgICAgICAgICAgID0gMFxuICAgICAgICBAbU1heEJ1ZmZlcnMgICAgICAgID0gNFxuICAgICAgICBAbU1heEN1YmVCdWZmZXJzICAgID0gMVxuICAgICAgICBAbU1heFBhc3NlcyAgICAgICAgID0gQG1NYXhCdWZmZXJzICsgM1xuICAgICAgICBAbUJ1ZmZlcnMgICAgICAgICAgID0gW11cbiAgICAgICAgQG1DdWJlQnVmZmVycyAgICAgICA9IFtdXG4gICAgICAgIEBtUmVuZGVyZXIgICAgICAgICAgPSBuZXcgUmVuZGVyZXIgQG1HTENvbnRleHRcbiAgICAgICAgXG4gICAgICAgIHZzID0gJ2xheW91dChsb2NhdGlvbiA9IDApIGluIHZlYzIgcG9zOyB2b2lkIG1haW4oKSB7IGdsX1Bvc2l0aW9uID0gdmVjNChwb3MueHksMC4wLDEuMCk7IH0nXG4gICAgICAgIGZyID0gJ3VuaWZvcm0gdmVjNCB2OyB1bmlmb3JtIHNhbXBsZXIyRCB0OyBvdXQgdmVjNCBvdXRDb2xvcjsgdm9pZCBtYWluKCkgeyBvdXRDb2xvciA9IHRleHR1cmVMb2QodCwgZ2xfRnJhZ0Nvb3JkLnh5IC8gdi56dywgMC4wKTsgfSdcbiAgICAgICAgQG1Qcm9ncmFtQ29weSA9IEBtUmVuZGVyZXIuY3JlYXRlU2hhZGVyIHZzLCBmclxuICAgICAgICBpZiBAbVByb2dyYW1Db3B5Lm1SZXN1bHQgPT0gZmFsc2VcbiAgICAgICAgICAgIGVycm9yICdGYWlsZWQgdG8gY29tcGlsZSBzaGFkZXIgdG8gY29weSBidWZmZXJzOicgcmVzLm1JbmZvXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIHZzID0gJ2xheW91dChsb2NhdGlvbiA9IDApIGluIHZlYzIgcG9zOyB2b2lkIG1haW4oKSB7IGdsX1Bvc2l0aW9uID0gdmVjNChwb3MueHksMC4wLDEuMCk7IH0nXG4gICAgICAgIGZyID0gJ3VuaWZvcm0gdmVjNCB2OyB1bmlmb3JtIHNhbXBsZXIyRCB0OyBvdXQgdmVjNCBvdXRDb2xvcjsgdm9pZCBtYWluKCkgeyB2ZWMyIHV2ID0gZ2xfRnJhZ0Nvb3JkLnh5IC8gdi56dzsgb3V0Q29sb3IgPSB0ZXh0dXJlKHQsIHZlYzIodXYueCwxLjAtdXYueSkpOyB9J1xuICAgICAgICByZXMgPSBAbVJlbmRlcmVyLmNyZWF0ZVNoYWRlciB2cywgZnJcbiAgICAgICAgaWYgcmVzLm1SZXN1bHQgPT0gZmFsc2VcbiAgICAgICAgICAgIGVycm9yICdGYWlsZWQgdG8gY29tcGlsZSBzaGFkZXIgdG8gZG93bnNjYWxlIGJ1ZmZlcnM6JyByZXNcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIGZvciBpIGluIFswLi4uQG1NYXhCdWZmZXJzXVxuICAgICAgICAgICAgQG1CdWZmZXJzW2ldID1cbiAgICAgICAgICAgICAgICBtVGV4dHVyZTogWyBudWxsIG51bGwgXVxuICAgICAgICAgICAgICAgIG1UYXJnZXQ6ICBbIG51bGwgbnVsbCBdXG4gICAgICAgICAgICAgICAgbVJlc29sdXRpb246IFsgMCAwIF1cbiAgICAgICAgICAgICAgICBtTGFzdFJlbmRlckRvbmU6IDBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5AbU1heEN1YmVCdWZmZXJzXVxuICAgICAgICAgICAgQG1DdWJlQnVmZmVyc1tpXSA9XG4gICAgICAgICAgICAgICAgbVRleHR1cmU6IFsgbnVsbCBudWxsIF1cbiAgICAgICAgICAgICAgICBtVGFyZ2V0OiAgWyBudWxsIG51bGwgXVxuICAgICAgICAgICAgICAgIG1SZXNvbHV0aW9uOiBbIDAgMCBdXG4gICAgICAgICAgICAgICAgbUxhc3RSZW5kZXJEb25lOiAwXG4gICAgICAgICAgICAgICAgbVRodW1ibmFpbFJlbmRlclRhcmdldDogbnVsbFxuXG4gICAgICAgIGtleWJvYXJkRGF0YSA9IG5ldyBVaW50OEFycmF5IDI1NiozXG4gICAgICAgIGZvciBqIGluIFswLi4uMjU2KjNdXG4gICAgICAgICAgICBrZXlib2FyZERhdGFbal0gPSAwXG4gICAgICAgICAgICBcbiAgICAgICAga2V5Ym9hcmRUZXh0dXJlID0gQG1SZW5kZXJlci5jcmVhdGVUZXh0dXJlKFJlbmRlcmVyLlRFWFRZUEUuVDJELCAyNTYsIDMsIFJlbmRlcmVyLlRFWEZNVC5DMUk4LCBSZW5kZXJlci5GSUxURVIuTk9ORSwgUmVuZGVyZXIuVEVYV1JQLkNMQU1QLCBudWxsKVxuICAgICAgICBrZXlib2FyZEltYWdlID0gbmV3IEltYWdlXG4gICAgICAgIEBtS2V5Ym9hcmQgPVxuICAgICAgICAgICAgbURhdGE6ICAgIGtleWJvYXJkRGF0YVxuICAgICAgICAgICAgbVRleHR1cmU6IGtleWJvYXJkVGV4dHVyZVxuICAgICAgICAgICAgbUljb246ICAgIGtleWJvYXJkSW1hZ2VcbiAgICAgICAgQG1DcmVhdGVkID0gdHJ1ZVxuXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBidWZmZXJJRF90b19hc3NldElEOiAoaWQpIC0+XG4gICAgICAgIHJldHVybiBzd2l0Y2ggaWRcbiAgICAgICAgICAgIHdoZW4gMCB0aGVuICdidWZmZXJBJyAjJzRkWEdSOCdcbiAgICAgICAgICAgIHdoZW4gMSB0aGVuICdidWZmZXJCJyAjJ1hzWEdSOCdcbiAgICAgICAgICAgIHdoZW4gMiB0aGVuICdidWZmZXJDJyAjJzRzWEdSOCdcbiAgICAgICAgICAgIHdoZW4gMyB0aGVuICdidWZmZXJEJyAjJ1hkZkdSOCdcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBrbG9nIFwiYnVmZmVySURfdG9fYXNzZXRJRCAje2lkfSAtPiBub25lXCJcbiAgICAgICAgICAgICAgICAnbm9uZSdcbiAgICBcbiAgICBhc3NldElEX3RvX2J1ZmZlcklEOiAoaWQpIC0+XG4gICAgICAgIHJldHVybiBzd2l0Y2ggaWRcbiAgICAgICAgICAgIHdoZW4gJ2J1ZmZlckEnIHRoZW4gMFxuICAgICAgICAgICAgd2hlbiAnYnVmZmVyQicgdGhlbiAxXG4gICAgICAgICAgICB3aGVuICdidWZmZXJDJyB0aGVuIDJcbiAgICAgICAgICAgIHdoZW4gJ2J1ZmZlckQnIHRoZW4gM1xuICAgICAgICAgICAgZWxzZSBcbiAgICAgICAgICAgICAgICBrbG9nIFwiYXNzZXRJRF90b19idWZmZXJJRCAje2lkfSAtPiAtMVwiXG4gICAgICAgICAgICAgICAgLTFcbiAgICBcbiAgICBhc3NldElEX3RvX2N1YmVtYXBCdWZlcklEOiAoaWQpIC0+IGlkICE9ICc0ZFgzUnInIGFuZCAtMSBvciAwXG4gICAgY3ViYW1lcEJ1ZmZlcklEX3RvX2Fzc2V0SUQ6IChpZCkgLT4gaWQgPT0gMCBhbmQgJzRkWDNScicgb3IgJ25vbmUnXG4gICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAwMDAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIHJlc2l6ZUN1YmVtYXBCdWZmZXI6IChpLCB4cmVzLCB5cmVzKSAtPlxuICAgICAgICBcbiAgICAgICAgb2xkWHJlcyA9IEBtQ3ViZUJ1ZmZlcnNbaV0ubVJlc29sdXRpb25bMF1cbiAgICAgICAgb2xkWXJlcyA9IEBtQ3ViZUJ1ZmZlcnNbaV0ubVJlc29sdXRpb25bMV1cbiAgICAgICAgXG4gICAgICAgIGlmIEBtQ3ViZUJ1ZmZlcnNbaV0ubVRleHR1cmVbMF0gPT0gbnVsbCBvciBvbGRYcmVzICE9IHhyZXMgb3Igb2xkWXJlcyAhPSB5cmVzXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRleHR1cmUxID0gQG1SZW5kZXJlci5jcmVhdGVUZXh0dXJlKFJlbmRlcmVyLlRFWFRZUEUuQ1VCRU1BUCwgeHJlcywgeXJlcywgUmVuZGVyZXIuVEVYRk1ULkM0RjE2LCBSZW5kZXJlci5GSUxURVIuTElORUFSLCBSZW5kZXJlci5URVhXUlAuQ0xBTVAsIG51bGwpXG4gICAgICAgICAgICB0YXJnZXQxICA9IEBtUmVuZGVyZXIuY3JlYXRlUmVuZGVyVGFyZ2V0Q3ViZU1hcCB0ZXh0dXJlMVxuICAgICAgICAgICAgdGV4dHVyZTIgPSBAbVJlbmRlcmVyLmNyZWF0ZVRleHR1cmUoUmVuZGVyZXIuVEVYVFlQRS5DVUJFTUFQLCB4cmVzLCB5cmVzLCBSZW5kZXJlci5URVhGTVQuQzRGMTYsIFJlbmRlcmVyLkZJTFRFUi5MSU5FQVIsIFJlbmRlcmVyLlRFWFdSUC5DTEFNUCwgbnVsbClcbiAgICAgICAgICAgIHRhcmdldDIgID0gQG1SZW5kZXJlci5jcmVhdGVSZW5kZXJUYXJnZXRDdWJlTWFwIHRleHR1cmUyXG5cbiAgICAgICAgICAgIEBtQ3ViZUJ1ZmZlcnNbaV0ubVRleHR1cmUgPSBbIHRleHR1cmUxLCB0ZXh0dXJlMiBdXG4gICAgICAgICAgICBAbUN1YmVCdWZmZXJzW2ldLm1UYXJnZXQgID0gWyB0YXJnZXQxLCB0YXJnZXQyIF1cbiAgICAgICAgICAgIEBtQ3ViZUJ1ZmZlcnNbaV0ubUxhc3RSZW5kZXJEb25lID0gMFxuICAgICAgICAgICAgQG1DdWJlQnVmZmVyc1tpXS5tUmVzb2x1dGlvblswXSA9IHhyZXNcbiAgICAgICAgICAgIEBtQ3ViZUJ1ZmZlcnNbaV0ubVJlc29sdXRpb25bMV0gPSB5cmVzXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwICAgIDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgcmVzaXplQnVmZmVyOiAoaSwgeHJlcywgeXJlcywgc2tpcElmTm90RXhpc3RzKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgc2tpcElmTm90RXhpc3RzIGFuZCBub3QgQG1CdWZmZXJzW2ldLm1UZXh0dXJlWzBdXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICAjIGtsb2cgXCJyZXNpemVCdWZmZXIgI3tpfVwiIFxuICAgICAgICBcbiAgICAgICAgb2xkWHJlcyA9IEBtQnVmZmVyc1tpXS5tUmVzb2x1dGlvblswXVxuICAgICAgICBvbGRZcmVzID0gQG1CdWZmZXJzW2ldLm1SZXNvbHV0aW9uWzFdXG4gICAgICAgIFxuICAgICAgICBpZiBvbGRYcmVzICE9IHhyZXMgb3Igb2xkWXJlcyAhPSB5cmVzXG4gICAgICAgICAgICBcbiAgICAgICAgICAgICMga2xvZyBcInJlc2l6ZUJ1ZmZlciAje2l9XCIgb2xkWHJlcywgb2xkWXJlcywgQG1CdWZmZXJzW2ldLm1SZXNvbHV0aW9uXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG5lZWRDb3B5ID0gQG1CdWZmZXJzW2ldLm1UZXh0dXJlWzBdICE9IG51bGxcbiAgICAgICAgICAgIHRleHR1cmUxID0gQG1SZW5kZXJlci5jcmVhdGVUZXh0dXJlKFJlbmRlcmVyLlRFWFRZUEUuVDJELCB4cmVzLCB5cmVzLCBSZW5kZXJlci5URVhGTVQuQzRGMzIsIChpZiBuZWVkQ29weSB0aGVuIEBtQnVmZmVyc1tpXS5tVGV4dHVyZVswXS5tRmlsdGVyIGVsc2UgUmVuZGVyZXIuRklMVEVSLk5PTkUpLCAoaWYgbmVlZENvcHkgdGhlbiBAbUJ1ZmZlcnNbaV0ubVRleHR1cmVbMF0ubVdyYXAgZWxzZSBSZW5kZXJlci5URVhXUlAuQ0xBTVApLCBudWxsKVxuICAgICAgICAgICAgdGV4dHVyZTIgPSBAbVJlbmRlcmVyLmNyZWF0ZVRleHR1cmUoUmVuZGVyZXIuVEVYVFlQRS5UMkQsIHhyZXMsIHlyZXMsIFJlbmRlcmVyLlRFWEZNVC5DNEYzMiwgKGlmIG5lZWRDb3B5IHRoZW4gQG1CdWZmZXJzW2ldLm1UZXh0dXJlWzFdLm1GaWx0ZXIgZWxzZSBSZW5kZXJlci5GSUxURVIuTk9ORSksIChpZiBuZWVkQ29weSB0aGVuIEBtQnVmZmVyc1tpXS5tVGV4dHVyZVsxXS5tV3JhcCBlbHNlIFJlbmRlcmVyLlRFWFdSUC5DTEFNUCksIG51bGwpXG4gICAgICAgICAgICB0YXJnZXQxICA9IEBtUmVuZGVyZXIuY3JlYXRlUmVuZGVyVGFyZ2V0IHRleHR1cmUxXG4gICAgICAgICAgICB0YXJnZXQyICA9IEBtUmVuZGVyZXIuY3JlYXRlUmVuZGVyVGFyZ2V0IHRleHR1cmUyXG4gICAgICAgICAgICBpZiBuZWVkQ29weVxuICAgICAgICAgICAgICAgIHYgPSBbIDAsIDAsIE1hdGgubWluKHhyZXMsIG9sZFhyZXMpLCBNYXRoLm1pbih5cmVzLCBvbGRZcmVzKSBdXG4gICAgICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRCbGVuZCBmYWxzZVxuICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0Vmlld3BvcnQgdlxuICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuYXR0YWNoU2hhZGVyIEBtUHJvZ3JhbUNvcHlcbiAgICAgICAgICAgICAgICBsMSA9IEBtUmVuZGVyZXIuZ2V0QXR0cmliTG9jYXRpb24gQG1Qcm9ncmFtQ29weSwgJ3BvcydcbiAgICAgICAgICAgICAgICB2T2xkID0gWyAwLCAwLCBvbGRYcmVzLCBvbGRZcmVzIF1cbiAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLnNldFNoYWRlckNvbnN0YW50NEZWICd2JyB2T2xkXG5cbiAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLnNldFJlbmRlclRhcmdldCB0YXJnZXQxXG4gICAgICAgICAgICAgICAgQG1SZW5kZXJlci5hdHRhY2hUZXh0dXJlcyAxLCBAbUJ1ZmZlcnNbaV0ubVRleHR1cmVbMF0sIG51bGwsIG51bGwsIG51bGxcbiAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLmRyYXdVbml0UXVhZF9YWSBsMVxuXG4gICAgICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRSZW5kZXJUYXJnZXQgdGFyZ2V0MlxuICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuYXR0YWNoVGV4dHVyZXMgMSwgQG1CdWZmZXJzW2ldLm1UZXh0dXJlWzFdLCBudWxsLCBudWxsLCBudWxsXG4gICAgICAgICAgICAgICAgQG1SZW5kZXJlci5kcmF3VW5pdFF1YWRfWFkgbDFcblxuICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuZGVzdHJveVRleHR1cmUgQG1CdWZmZXJzW2ldLm1UZXh0dXJlWzBdXG4gICAgICAgICAgICAgICAgQG1SZW5kZXJlci5kZXN0cm95UmVuZGVyVGFyZ2V0IEBtQnVmZmVyc1tpXS5tVGFyZ2V0WzBdXG4gICAgICAgICAgICAgICAgQG1SZW5kZXJlci5kZXN0cm95VGV4dHVyZSBAbUJ1ZmZlcnNbaV0ubVRleHR1cmVbMV1cbiAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLmRlc3Ryb3lSZW5kZXJUYXJnZXQgQG1CdWZmZXJzW2ldLm1UYXJnZXRbMV1cblxuICAgICAgICAgICAgQG1CdWZmZXJzW2ldLm1UZXh0dXJlID0gWyB0ZXh0dXJlMSwgdGV4dHVyZTIgXVxuICAgICAgICAgICAgQG1CdWZmZXJzW2ldLm1UYXJnZXQgID0gWyB0YXJnZXQxLCAgdGFyZ2V0MiAgXVxuICAgICAgICAgICAgQG1CdWZmZXJzW2ldLm1MYXN0UmVuZGVyRG9uZSA9IDBcbiAgICAgICAgICAgIEBtQnVmZmVyc1tpXS5tUmVzb2x1dGlvblswXSA9IHhyZXNcbiAgICAgICAgICAgIEBtQnVmZmVyc1tpXS5tUmVzb2x1dGlvblsxXSA9IHlyZXNcblxuICAgIHJlc2l6ZUJ1ZmZlcnM6ICh4cmVzLCB5cmVzKSAtPlxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5AbU1heEJ1ZmZlcnNdXG4gICAgICAgICAgICBAcmVzaXplQnVmZmVyIGksIHhyZXMsIHlyZXMsIHRydWVcbiAgICAgICAgQFxuXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwICAgICAwMDAwMCAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGdldFRleHR1cmU6IChwYXNzaWQsIHNsb3QpIC0+IEBtUGFzc2VzW3Bhc3NpZF0uZ2V0VGV4dHVyZSBzbG90XG4gICAgbmV3VGV4dHVyZTogKHBhc3NpZCwgc2xvdCwgdXJsKSAtPiBAbVBhc3Nlc1twYXNzaWRdLm5ld1RleHR1cmUgc2xvdCwgdXJsLCBAbUJ1ZmZlcnMsIEBtQ3ViZUJ1ZmZlcnMsIEBtS2V5Ym9hcmRcbiAgICAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgc2V0S2V5RG93bjogKGspIC0+XG4gICAgICAgICMga2xvZyBcInNldEtleURvd24gI3trfVwiXG4gICAgICAgIGlmIEBtS2V5Ym9hcmQubURhdGFbayArIDAgKiAyNTZdID09IDI1NVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIEBtS2V5Ym9hcmQubURhdGFbayArIDAgKiAyNTZdID0gMjU1XG4gICAgICAgIEBtS2V5Ym9hcmQubURhdGFbayArIDEgKiAyNTZdID0gMjU1XG4gICAgICAgIEBtS2V5Ym9hcmQubURhdGFbayArIDIgKiAyNTZdID0gMjU1IC0gKEBtS2V5Ym9hcmQubURhdGFbayArIDIgKiAyNTZdKVxuICAgICAgICBAbVJlbmRlcmVyLnVwZGF0ZVRleHR1cmUgQG1LZXlib2FyZC5tVGV4dHVyZSwgMCwgMCwgMjU2LCAzLCBAbUtleWJvYXJkLm1EYXRhXG4gICAgXG4gICAgc2V0S2V5VXA6IChrKSAtPlxuICAgICAgICAjIGtsb2cgXCJzZXRLZXlVcCAje2t9XCJcbiAgICAgICAgQG1LZXlib2FyZC5tRGF0YVtrICsgMCAqIDI1Nl0gPSAwXG4gICAgICAgIEBtS2V5Ym9hcmQubURhdGFbayArIDEgKiAyNTZdID0gMFxuICAgICAgICBAbVJlbmRlcmVyLnVwZGF0ZVRleHR1cmUgQG1LZXlib2FyZC5tVGV4dHVyZSwgMCwgMCwgMjU2LCAzLCBAbUtleWJvYXJkLm1EYXRhXG4gICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgIDAwMCAgICAwMDAwMDAwICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAgc2V0U2l6ZTogKHhyZXMsIHlyZXMpIC0+XG4gICAgICAgIGlmIHhyZXMgIT0gQG1YcmVzIG9yIHlyZXMgIT0gQG1ZcmVzXG4gICAgICAgICAgICBvbGRYcmVzID0gQG1YcmVzXG4gICAgICAgICAgICBvbGRZcmVzID0gQG1ZcmVzXG4gICAgICAgICAgICBAbVhyZXMgPSB4cmVzXG4gICAgICAgICAgICBAbVlyZXMgPSB5cmVzXG4gICAgICAgICAgICBAcmVzaXplQnVmZmVycyB4cmVzLCB5cmVzXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICBmYWxzZVxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAwMCAgICAgMDAgIDAwMDAwMDAwICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgICAgICBcbiAgICAjICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICByZXNldFRpbWU6IC0+XG4gICAgICAgIEBtRnJhbWUgPSAwXG4gICAgICAgIGZvciBpIGluIFswLi4uQG1QYXNzZXMubGVuZ3RoXVxuICAgICAgICAgICAgQG1QYXNzZXNbaV0ubUZyYW1lID0gMFxuICAgICAgICBAXG4gICAgXG4gICAgIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgcGFpbnQ6ICh0aW1lLCBkdGltZSwgZnBzLCBpc1BhdXNlZCkgLT5cbiAgICAgICAgXG4gICAgICAgIGRhICAgPSBuZXcgRGF0ZVxuICAgICAgICB4cmVzID0gQG1YcmVzIC8gMVxuICAgICAgICB5cmVzID0gQG1ZcmVzIC8gMVxuICAgICAgICBcbiAgICAgICAgaWYgQG1GcmFtZSA9PSAwXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBpIGluIFswLi4uQG1NYXhCdWZmZXJzXVxuICAgICAgICAgICAgICAgIGlmIEBtQnVmZmVyc1tpXS5tVGV4dHVyZVswXSAhPSBudWxsXG4gICAgICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuc2V0UmVuZGVyVGFyZ2V0IEBtQnVmZmVyc1tpXS5tVGFyZ2V0WzBdXG4gICAgICAgICAgICAgICAgICAgIEBtUmVuZGVyZXIuY2xlYXIgUmVuZGVyZXIuQ0xFQVIuQ29sb3IsIFsgMCAwIDAgMCBdLCAxIDBcbiAgICAgICAgICAgICAgICAgICAgQG1SZW5kZXJlci5zZXRSZW5kZXJUYXJnZXQgQG1CdWZmZXJzW2ldLm1UYXJnZXRbMV1cbiAgICAgICAgICAgICAgICAgICAgQG1SZW5kZXJlci5jbGVhciBSZW5kZXJlci5DTEVBUi5Db2xvciwgWyAwIDAgMCAwIF0sIDEgMFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBpIGluIFswLi4uQG1NYXhDdWJlQnVmZmVyc11cbiAgICAgICAgICAgICAgICBpZiBAbUN1YmVCdWZmZXJzW2ldLm1UZXh0dXJlWzBdICE9IG51bGxcbiAgICAgICAgICAgICAgICAgICAgZm9yIGZhY2UgaW4gWzAuLjVdXG4gICAgICAgICAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLnNldFJlbmRlclRhcmdldEN1YmVNYXAgQG1DdWJlQnVmZmVyc1tpXS5tVGFyZ2V0WzBdLCBmYWNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLmNsZWFyIFJlbmRlcmVyLkNMRUFSLkNvbG9yLCBbIDAgMCAwIDAgXSwgMS4wLCAwXG4gICAgICAgICAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLnNldFJlbmRlclRhcmdldEN1YmVNYXAgQG1DdWJlQnVmZmVyc1tpXS5tVGFyZ2V0WzFdLCBmYWNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAbVJlbmRlcmVyLmNsZWFyIFJlbmRlcmVyLkNMRUFSLkNvbG9yLCBbIDAgMCAwIDAgXSwgMS4wLCAwXG5cbiAgICAgICAgbnVtID0gQG1QYXNzZXMubGVuZ3RoXG4gICAgICAgIFxuICAgICAgICBmb3IgaSBpbiBbMC4uLm51bV0gIyByZW5kZXIgYnVmZmVycyBzZWNvbmRcbiAgICAgICAgICAgIGlmIEBtUGFzc2VzW2ldLm1UeXBlICE9ICdidWZmZXInIHRoZW4gY29udGludWVcbiAgICAgICAgICAgIGlmIEBtUGFzc2VzW2ldLm1Qcm9ncmFtID09IG51bGwgIHRoZW4gY29udGludWVcbiAgICAgICAgICAgIGJ1ZmZlcklEID0gQGFzc2V0SURfdG9fYnVmZmVySUQgQG1QYXNzZXNbaV0ubU91dHB1dFxuXG4gICAgICAgICAgICBuZWVkTWlwTWFwcyA9IGZhbHNlICMgY2hlY2sgaWYgYW55IGRvd25zdHJlYW0gcGFzcyBuZWVkcyBtaXBtYXBzXG4gICAgICAgICAgICBmb3IgaiBpbiBbMC4uLm51bV1cbiAgICAgICAgICAgICAgICBmb3IgayBpbiBbMC4uLkBtUGFzc2VzW2pdLm1JbnB1dHMubGVuZ3RoXVxuICAgICAgICAgICAgICAgICAgICBpbnAgPSBAbVBhc3Nlc1tqXS5tSW5wdXRzW2tdXG4gICAgICAgICAgICAgICAgICAgIGlmIGlucCAhPSBudWxsIGFuZCBpbnAubUluZm8ubVR5cGUgPT0gJ2J1ZmZlcicgYW5kIGlucC5pZCA9PSBidWZmZXJJRCBhbmQgaW5wLm1JbmZvLm1TYW1wbGVyPy5maWx0ZXIgPT0gJ21pcG1hcCdcbiAgICAgICAgICAgICAgICAgICAgICAgIG5lZWRNaXBNYXBzID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIEBtUGFzc2VzW2ldLnBhaW50IGRhLCB0aW1lLCBkdGltZSwgZnBzLCB4cmVzLCB5cmVzLCBpc1BhdXNlZCwgYnVmZmVySUQsIG5lZWRNaXBNYXBzLCBAbUJ1ZmZlcnMsIEBtQ3ViZUJ1ZmZlcnMsIEBtS2V5Ym9hcmQsIEBcbiAgICAgICAgXG4gICAgICAgIGZvciBpIGluIFswLi4ubnVtXSAjIHJlbmRlciBjdWJlbWFwIGJ1ZmZlcnMgc2Vjb25kXG4gICAgICAgICAgICBpZiBAbVBhc3Nlc1tpXS5tVHlwZSAhPSAnY3ViZW1hcCcgdGhlbiBjb250aW51ZVxuICAgICAgICAgICAgaWYgQG1QYXNzZXNbaV0ubVByb2dyYW0gPT0gbnVsbCAgIHRoZW4gY29udGludWVcbiAgICAgICAgICAgIGJ1ZmZlcklEID0gMFxuXG4gICAgICAgICAgICBuZWVkTWlwTWFwcyA9IGZhbHNlICMgY2hlY2sgaWYgYW55IGRvd25zdHJlYW0gcGFzcyBuZWVkcyBtaXBtYXBzXG4gICAgICAgICAgICBmb3IgaiBpbiBbMC4uLm51bV1cbiAgICAgICAgICAgICAgICBmb3IgayBpbiBbMC4uLkBtUGFzc2VzW2pdLm1JbnB1dHMubGVuZ3RoXVxuICAgICAgICAgICAgICAgICAgICBpbnAgPSBAbVBhc3Nlc1tqXS5tSW5wdXRzW2tdXG4gICAgICAgICAgICAgICAgICAgIGlmIGlucCAhPSBudWxsIGFuZCBpbnAubUluZm8ubVR5cGUgPT0gJ2N1YmVtYXAnXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBAYXNzZXRJRF90b19jdWJlbWFwQnVmZXJJRChpbnAubUluZm8ubUlEKSA9PSAwIGFuZCBpbnAubUluZm8ubVNhbXBsZXIuZmlsdGVyID09ICdtaXBtYXAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmVlZE1pcE1hcHMgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIEBtUGFzc2VzW2ldLnBhaW50IGRhLCB0aW1lLCBkdGltZSwgZnBzLCB4cmVzLCB5cmVzLCBpc1BhdXNlZCwgYnVmZmVySUQsIG5lZWRNaXBNYXBzLCBAbUJ1ZmZlcnMsIEBtQ3ViZUJ1ZmZlcnMsIEBtS2V5Ym9hcmQsIEBcblxuICAgICAgICBmb3IgaSBpbiBbMC4uLm51bV0gIyByZW5kZXIgaW1hZ2UgbGFzdFxuICAgICAgICAgICAgaWYgQG1QYXNzZXNbaV0ubVR5cGUgIT0gJ2ltYWdlJyB0aGVuIGNvbnRpbnVlXG4gICAgICAgICAgICBpZiBAbVBhc3Nlc1tpXS5tUHJvZ3JhbSA9PSBudWxsIHRoZW4gY29udGludWVcbiAgICAgICAgICAgIEBtUGFzc2VzW2ldLnBhaW50IGRhLCB0aW1lLCBkdGltZSwgZnBzLCB4cmVzLCB5cmVzLCBpc1BhdXNlZCwgbnVsbCwgZmFsc2UsIEBtQnVmZmVycywgQG1DdWJlQnVmZmVycywgQG1LZXlib2FyZCwgQFxuXG4gICAgICAgIGsgPSAwXG4gICAgICAgIHdoaWxlIGsgPCAyNTZcbiAgICAgICAgICAgIEBtS2V5Ym9hcmQubURhdGFbayArIDEgKiAyNTZdID0gMFxuICAgICAgICAgICAgaysrXG4gICAgICAgIEBtUmVuZGVyZXIudXBkYXRlVGV4dHVyZSBAbUtleWJvYXJkLm1UZXh0dXJlLCAwLCAwLCAyNTYsIDMsIEBtS2V5Ym9hcmQubURhdGFcbiAgICAgICAgQG1GcmFtZSsrXG4gICAgICAgIHJldHVyblxuICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAwIDAwMCAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgXG4gICAgXG4gICAgbmV3U2hhZGVyOiAoc2hhZGVyQ29kZSwgcGFzc2lkKSAtPlxuICAgICAgICBjb21tb25Tb3VyY2VDb2RlcyA9IFtdXG4gICAgICAgIGkgPSAwXG4gICAgICAgIHdoaWxlIGkgPCBAbVBhc3Nlcy5sZW5ndGhcbiAgICAgICAgICAgIGlmIEBtUGFzc2VzW2ldLm1UeXBlID09ICdjb21tb24nXG4gICAgICAgICAgICAgICAgY29tbW9uU291cmNlQ29kZXMucHVzaCBAbVBhc3Nlc1tpXS5tU291cmNlXG4gICAgICAgICAgICBpKytcbiAgICAgICAgQG1QYXNzZXNbcGFzc2lkXS5uZXdTaGFkZXIgc2hhZGVyQ29kZSwgY29tbW9uU291cmNlQ29kZXNcbiAgICBcbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgIFxuICAgIFxuICAgIGdldE51bVBhc3NlczogLT5cbiAgICAgICAgQG1QYXNzZXMubGVuZ3RoXG4gICAgXG4gICAgZ2V0TnVtT2ZUeXBlOiAocGFzc3R5cGUpIC0+XG4gICAgICAgIGlkID0gMFxuICAgICAgICBqID0gMFxuICAgICAgICB3aGlsZSBqIDwgQG1QYXNzZXMubGVuZ3RoXG4gICAgICAgICAgICBpZiBAbVBhc3Nlc1tqXS5tVHlwZSA9PSBwYXNzdHlwZVxuICAgICAgICAgICAgICAgIGlkKytcbiAgICAgICAgICAgIGorK1xuICAgICAgICBpZFxuICAgIFxuICAgIGdldFBhc3NUeXBlOiAoaWQpIC0+XG4gICAgICAgIEBtUGFzc2VzW2lkXS5tVHlwZVxuICAgIFxuICAgIGdldFBhc3NOYW1lOiAoaWQpIC0+XG4gICAgICAgIEBtUGFzc2VzW2lkXS5tTmFtZVxuICAgIFxuICAgICMgICAgICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgIFxuICAgICMgICAgICAgMDAwICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG5ld1NjcmlwdEpTT046IChwYXNzZXMpIC0+XG4gICAgICAgIGlmIHBhc3Nlcy5sZW5ndGggPCAxIG9yIHBhc3Nlcy5sZW5ndGggPiBAbU1heFBhc3Nlc1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgbUZhaWxlZDogdHJ1ZVxuICAgICAgICAgICAgICAgIG1FcnJvcjogJ0luY29ycmVjdCBudW1iZXIgb2YgcGFzc2VzLCB3cm9uZyBzaGFkZXIgZm9ybWF0J1xuICAgICAgICAgICAgICAgIG1TaGFkZXI6IG51bGxcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgcmVzID0gW11cbiAgICAgICAgcmVzLm1GYWlsZWQgPSBmYWxzZVxuICAgICAgICBcbiAgICAgICAgZm9yIGogaW4gWzAuLi5wYXNzZXMubGVuZ3RoXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBycGFzcyA9IHBhc3Nlc1tqXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBycGFzcy5pbnB1dHMgPz0gW11cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQG1QYXNzZXNbal0gPSBuZXcgUGFzcyBAbVJlbmRlcmVyLCBqLCBAXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBpIGluIFswLi4zXVxuICAgICAgICAgICAgICAgIEBtUGFzc2VzW2pdLm5ld1RleHR1cmUgaVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIGkgaW4gWzAuLi5ycGFzcy5pbnB1dHMubGVuZ3RoXVxuICAgICAgICAgICAgICAgIEBtUGFzc2VzW2pdLm5ld1RleHR1cmUgcnBhc3MuaW5wdXRzW2ldLmNoYW5uZWwsXG4gICAgICAgICAgICAgICAgICAgIG1UeXBlOiAgICAgIHJwYXNzLmlucHV0c1tpXS50eXBlXG4gICAgICAgICAgICAgICAgICAgIG1JRDogICAgICAgIHJwYXNzLmlucHV0c1tpXS5pZFxuICAgICAgICAgICAgICAgICAgICBtU3JjOiAgICAgICBycGFzcy5pbnB1dHNbaV0uc3JjXG4gICAgICAgICAgICAgICAgICAgIG1TYW1wbGVyOiAgIHJwYXNzLmlucHV0c1tpXS5zYW1wbGVyXG4gICAgICAgICAgICAgICAgLCBAbUJ1ZmZlcnMsIEBtQ3ViZUJ1ZmZlcnMsIEBtS2V5Ym9hcmRcblxuICAgICAgICAgICAgQG1QYXNzZXNbal0ubU91dHB1dCA9IHJwYXNzLm91dHB1dCBpZiBycGFzcy5vdXRwdXRcblxuICAgICAgICAgICAgcnBhc3NOYW1lID0gc3dpdGNoIHJwYXNzLnR5cGVcbiAgICAgICAgICAgICAgICB3aGVuICdjb21tb24nICB0aGVuICdDb21tb24nXG4gICAgICAgICAgICAgICAgd2hlbiAnaW1hZ2UnICAgdGhlbiAnSW1hZ2UnXG4gICAgICAgICAgICAgICAgd2hlbiAnYnVmZmVyJyAgdGhlbiAnQnVmZmVyICcgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKDY1ICsgQGFzc2V0SURfdG9fYnVmZmVySUQoQG1QYXNzZXNbal0ubU91dHB1dCkpXG4gICAgICAgICAgICAgICAgd2hlbiAnY3ViZW1hcCcgdGhlbiAnQ3ViZSdcbiAgICAgICAgICAgIEBtUGFzc2VzW2pdLmNyZWF0ZSBycGFzcy50eXBlLCBycGFzc05hbWVcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgcGFzc1R5cGUgaW4gWydjb21tb24nICdidWZmZXInICdpbWFnZScgJ2N1YmVtYXAnXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgaiBpbiBbMC4uLnBhc3Nlcy5sZW5ndGhdXG4gICAgICAgICAgICAgICAgcnBhc3MgPSBwYXNzZXNbal1cbiAgICAgICAgICAgICAgICBpZiBycGFzcy50eXBlICE9IHBhc3NUeXBlICB0aGVuIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgc2hhZGVyU3RyID0gcnBhc3MuY29kZVxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IEBuZXdTaGFkZXIgc2hhZGVyU3RyLCBqXG4gICAgICAgICAgICAgICAgaWYgcmVzdWx0ICE9IG51bGxcbiAgICAgICAgICAgICAgICAgICAgcmVzLm1GYWlsZWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIHJlc1tqXSA9XG4gICAgICAgICAgICAgICAgICAgICAgICBtRmFpbGVkOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICBtRXJyb3I6ICByZXN1bHRcbiAgICAgICAgICAgICAgICAgICAgICAgIG1TaGFkZXI6IHNoYWRlclN0clxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmVzW2pdID1cbiAgICAgICAgICAgICAgICAgICAgICAgIG1GYWlsZWQ6IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBtRXJyb3I6ICBudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICBtU2hhZGVyOiBzaGFkZXJTdHJcbiAgICAgICAgcmVzXG4gICAgICAgIFxuICAgIG1vZHVsZS5leHBvcnRzID0gRWZmZWN0Il19
//# sourceURL=../coffee/effect.coffee