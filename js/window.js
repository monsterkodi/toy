// koffee 1.6.0

/*
000   000  000  000   000  0000000     0000000   000   000
000 0 000  000  0000  000  000   000  000   000  000 0 000
000000000  000  000 0 000  000   000  000   000  000000000
000   000  000  000  0000  000   000  000   000  000   000
00     00  000  000   000  0000000     0000000   00     00
 */
var $, MainWin, Toy, keyinfo, ref, win,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), $ = ref.$, keyinfo = ref.keyinfo, win = ref.win;

Toy = require('./toy');

MainWin = (function(superClass) {
    extend(MainWin, superClass);

    function MainWin() {
        this.onMenuAction = bind(this.onMenuAction, this);
        this.onMouseUp = bind(this.onMouseUp, this);
        this.onMouseMove = bind(this.onMouseMove, this);
        this.onMouseDown = bind(this.onMouseDown, this);
        this.onKeyUp = bind(this.onKeyUp, this);
        this.onKeyDown = bind(this.onKeyDown, this);
        this.onLoad = bind(this.onLoad, this);
        this.last = {
            left: {
                x: 0,
                y: 0
            },
            right: {
                x: 0,
                y: 0
            }
        };
        this.inhibit = {
            left: 0,
            right: 0
        };
        MainWin.__super__.constructor.call(this, {
            dir: __dirname,
            pkg: require('../package.json'),
            menu: '../coffee/menu.noon',
            icon: '../img/mini.png',
            prefsSeperator: '▸',
            context: false,
            onLoad: this.onLoad
        });
        this.mouse = {
            down: [0, 0],
            up: [0, 0]
        };
        addEventListener('pointerdown', this.onMouseDown);
        addEventListener('pointermove', this.onMouseMove);
        addEventListener('pointerup', this.onMouseUp);
    }

    MainWin.prototype.onLoad = function() {
        this.toy = new Toy($('#toy'));
        return this.win.on('resize', this.toy.resize);
    };

    MainWin.prototype.onKeyDown = function(event) {
        var char, combo, key, mod, ref1;
        ref1 = keyinfo.forEvent(event), mod = ref1.mod, key = ref1.key, combo = ref1.combo, char = ref1.char;
        if (event.which < 256 && !event.repeat) {
            this.toy.mEffect.setKeyDown(event.which);
        }
        return MainWin.__super__.onKeyDown.apply(this, arguments);
    };

    MainWin.prototype.onKeyUp = function(event) {
        var char, combo, key, mod, ref1, ref2;
        ref1 = keyinfo.forEvent(event), mod = ref1.mod, key = ref1.key, combo = ref1.combo, char = ref1.char;
        if (event.which < 256 && !event.repeat) {
            if ((ref2 = this.toy) != null) {
                ref2.mEffect.setKeyUp(event.which);
            }
        }
        return MainWin.__super__.onKeyUp.apply(this, arguments);
    };

    MainWin.prototype.mousePos = function(event) {
        var br;
        br = $('#toy').getBoundingClientRect();
        return [event.clientX - br.left, event.clientY - br.top];
    };

    MainWin.prototype.onMouseDown = function(event) {
        this.mouse.down = this.mousePos(event);
        return this.mouseEvent(event);
    };

    MainWin.prototype.onMouseMove = function(event) {
        return this.mouseEvent(event);
    };

    MainWin.prototype.onMouseUp = function(event) {
        this.mouse.up = this.mousePos(event);
        return this.mouseEvent(event);
    };

    MainWin.prototype.mouseEvent = function(event) {
        var dpr, hgt, pos;
        if (!this.toy) {
            return;
        }
        pos = this.mousePos(event);
        hgt = this.toy.mCanvas.height;
        dpr = window.devicePixelRatio;
        if (event.buttons) {
            return this.toy.mEffect.mRenderer.iMouse = [pos[0] * dpr, hgt - pos[1] * dpr, this.mouse.down[0] * dpr, hgt - this.mouse.down[1] * dpr];
        } else {
            return this.toy.mEffect.mRenderer.iMouse = [this.mouse.up[0] * dpr, hgt - this.mouse.up[1] * dpr, -this.mouse.down[0] * dpr, -hgt + this.mouse.down[1] * dpr];
        }
    };

    MainWin.prototype.onMenuAction = function(action, args) {
        return MainWin.__super__.onMenuAction.apply(this, arguments);
    };

    return MainWin;

})(win);

new MainWin;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxrQ0FBQTtJQUFBOzs7O0FBUUEsTUFBc0IsT0FBQSxDQUFRLEtBQVIsQ0FBdEIsRUFBRSxTQUFGLEVBQUsscUJBQUwsRUFBYzs7QUFFZCxHQUFBLEdBQU0sT0FBQSxDQUFRLE9BQVI7O0FBRUE7OztJQUVDLGlCQUFBOzs7Ozs7OztRQUVDLElBQUMsQ0FBQSxJQUFELEdBQVE7WUFBQSxJQUFBLEVBQUs7Z0JBQUMsQ0FBQSxFQUFFLENBQUg7Z0JBQUssQ0FBQSxFQUFFLENBQVA7YUFBTDtZQUFnQixLQUFBLEVBQU07Z0JBQUMsQ0FBQSxFQUFFLENBQUg7Z0JBQUssQ0FBQSxFQUFFLENBQVA7YUFBdEI7O1FBQ1IsSUFBQyxDQUFBLE9BQUQsR0FBVztZQUFBLElBQUEsRUFBSyxDQUFMO1lBQU8sS0FBQSxFQUFNLENBQWI7O1FBQ1gseUNBQ0k7WUFBQSxHQUFBLEVBQVEsU0FBUjtZQUNBLEdBQUEsRUFBUSxPQUFBLENBQVEsaUJBQVIsQ0FEUjtZQUVBLElBQUEsRUFBUSxxQkFGUjtZQUdBLElBQUEsRUFBUSxpQkFIUjtZQUlBLGNBQUEsRUFBZ0IsR0FKaEI7WUFLQSxPQUFBLEVBQVMsS0FMVDtZQU1BLE1BQUEsRUFBUSxJQUFDLENBQUEsTUFOVDtTQURKO1FBU0EsSUFBQyxDQUFBLEtBQUQsR0FDSTtZQUFBLElBQUEsRUFBTSxDQUFDLENBQUQsRUFBRyxDQUFILENBQU47WUFDQSxFQUFBLEVBQU0sQ0FBQyxDQUFELEVBQUcsQ0FBSCxDQUROOztRQUdKLGdCQUFBLENBQWlCLGFBQWpCLEVBQStCLElBQUMsQ0FBQSxXQUFoQztRQUNBLGdCQUFBLENBQWlCLGFBQWpCLEVBQStCLElBQUMsQ0FBQSxXQUFoQztRQUNBLGdCQUFBLENBQWlCLFdBQWpCLEVBQStCLElBQUMsQ0FBQSxTQUFoQztJQW5CRDs7c0JBcUJILE1B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QUMsQ0FBQSxLQUFLLENBQUMsRUFBRyxDQUFBLENBQUEsQ0FBVixHQUFpQixHQURwQixFQUU1QixDQUFDLElBQUMsQ0FBQSxLQUFLLENBQUMsSUFBSyxDQUFBLENBQUEsQ0FBYixHQUFtQixHQUZTLEVBRUosQ0FBQyxHQUFELEdBQU8sSUFBQyxDQUFBLEtBQUssQ0FBQyxJQUFLLENBQUEsQ0FBQSxDQUFaLEdBQWlCLEdBRnBCLEVBTnBDOztJQUxROztzQkFzQlosWUFBQSxHQUFjLFNBQUMsTUFBRCxFQUFTLElBQVQ7ZUFJViwyQ0FBQSxTQUFBO0lBSlU7Ozs7R0ExRkk7O0FBZ0d0QixJQUFJIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4wMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4wMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4wMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMCAgICAgMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAgICAgIDAwXG4jIyNcblxueyAkLCBrZXlpbmZvLCB3aW4gfSA9IHJlcXVpcmUgJ2t4aydcblxuVG95ID0gcmVxdWlyZSAnLi90b3knXG5cbmNsYXNzIE1haW5XaW4gZXh0ZW5kcyB3aW5cbiAgICBcbiAgICBAOiAtPlxuICAgICAgICBcbiAgICAgICAgQGxhc3QgPSBsZWZ0Ont4OjAgeTowfSwgcmlnaHQ6e3g6MCB5OjB9XG4gICAgICAgIEBpbmhpYml0ID0gbGVmdDowIHJpZ2h0OjBcbiAgICAgICAgc3VwZXJcbiAgICAgICAgICAgIGRpcjogICAgX19kaXJuYW1lXG4gICAgICAgICAgICBwa2c6ICAgIHJlcXVpcmUgJy4uL3BhY2thZ2UuanNvbidcbiAgICAgICAgICAgIG1lbnU6ICAgJy4uL2NvZmZlZS9tZW51Lm5vb24nXG4gICAgICAgICAgICBpY29uOiAgICcuLi9pbWcvbWluaS5wbmcnXG4gICAgICAgICAgICBwcmVmc1NlcGVyYXRvcjogJ+KWuCdcbiAgICAgICAgICAgIGNvbnRleHQ6IGZhbHNlXG4gICAgICAgICAgICBvbkxvYWQ6IEBvbkxvYWRcbiAgICAgICAgICBcbiAgICAgICAgQG1vdXNlID0gXG4gICAgICAgICAgICBkb3duOiBbMCAwXVxuICAgICAgICAgICAgdXA6ICAgWzAgMF1cbiAgICAgICAgICAgIFxuICAgICAgICBhZGRFdmVudExpc3RlbmVyICdwb2ludGVyZG93bicgQG9uTW91c2VEb3duXG4gICAgICAgIGFkZEV2ZW50TGlzdGVuZXIgJ3BvaW50ZXJtb3ZlJyBAb25Nb3VzZU1vdmVcbiAgICAgICAgYWRkRXZlbnRMaXN0ZW5lciAncG9pbnRlcnVwJyAgIEBvbk1vdXNlVXBcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgIG9uTG9hZDogPT5cblxuICAgICAgICBAdG95ID0gbmV3IFRveSAkICcjdG95J1xuICAgICAgICBAd2luLm9uICdyZXNpemUnIEB0b3kucmVzaXplXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgb25LZXlEb3duOiAoZXZlbnQpID0+XG5cbiAgICAgICAgeyBtb2QsIGtleSwgY29tYm8sIGNoYXIgfSA9IGtleWluZm8uZm9yRXZlbnQgZXZlbnRcbiAgICAgICAgIyBrbG9nIG1vZCwga2V5LCBjb21ibywgY2hhciwgZXZlbnQud2hpY2hcbiAgICAgICAgXG4gICAgICAgIGlmIGV2ZW50LndoaWNoIDwgMjU2IGFuZCBub3QgZXZlbnQucmVwZWF0XG4gICAgICAgICAgICBAdG95Lm1FZmZlY3Quc2V0S2V5RG93biBldmVudC53aGljaFxuXG4gICAgICAgIHN1cGVyXG4gICAgICAgIFxuICAgIG9uS2V5VXA6IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIHsgbW9kLCBrZXksIGNvbWJvLCBjaGFyIH0gPSBrZXlpbmZvLmZvckV2ZW50IGV2ZW50XG4gICAgICAgICMga2xvZyBtb2QsIGtleSwgY29tYm8sIGNoYXIsIGV2ZW50LndoaWNoXG4gICAgICAgIFxuICAgICAgICBpZiBldmVudC53aGljaCA8IDI1NiBhbmQgbm90IGV2ZW50LnJlcGVhdFxuICAgICAgICAgICAgQHRveT8ubUVmZmVjdC5zZXRLZXlVcCBldmVudC53aGljaFxuICAgICAgICBcbiAgICAgICAgc3VwZXJcbiAgICAgICAgXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcblxuICAgIG1vdXNlUG9zOiAoZXZlbnQpIC0+XG4gICAgICAgIGJyID0gJCgnI3RveScpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgIFtldmVudC5jbGllbnRYLWJyLmxlZnQsIGV2ZW50LmNsaWVudFktYnIudG9wXVxuICAgIFxuICAgIG9uTW91c2VEb3duOiAoZXZlbnQpID0+IEBtb3VzZS5kb3duID0gQG1vdXNlUG9zKGV2ZW50KTsgQG1vdXNlRXZlbnQgZXZlbnRcbiAgICBvbk1vdXNlTW92ZTogKGV2ZW50KSA9PiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQG1vdXNlRXZlbnQgZXZlbnRcbiAgICBvbk1vdXNlVXA6ICAgKGV2ZW50KSA9PiBAbW91c2UudXAgPSBAbW91c2VQb3MoZXZlbnQpOyBAbW91c2VFdmVudCBldmVudFxuICAgICAgICBcbiAgICBtb3VzZUV2ZW50OiAoZXZlbnQpIC0+IFxuICAgICAgICByZXR1cm4gaWYgbm90IEB0b3lcbiAgICAgICAgcG9zID0gQG1vdXNlUG9zKGV2ZW50KVxuICAgICAgICBoZ3QgPSBAdG95Lm1DYW52YXMuaGVpZ2h0XG4gICAgICAgIGRwciA9IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvXG4gICAgICAgIGlmIGV2ZW50LmJ1dHRvbnNcbiAgICAgICAgICAgIEB0b3kubUVmZmVjdC5tUmVuZGVyZXIuaU1vdXNlID0gW1xuICAgICAgICAgICAgICAgIHBvc1swXSAgICAgICAgICAqIGRwciwgaGd0IC0gcG9zWzFdICAgICAgICAgKiBkcHJcbiAgICAgICAgICAgICAgICBAbW91c2UuZG93blswXSAgKiBkcHIsIGhndCAtIEBtb3VzZS5kb3duWzFdICogZHByXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdG95Lm1FZmZlY3QubVJlbmRlcmVyLmlNb3VzZSA9IFtcbiAgICAgICAgICAgICAgICBAbW91c2UudXBbMF0gICAgICogZHByLCAgaGd0IC0gQG1vdXNlLnVwWzFdICAgKiBkcHJcbiAgICAgICAgICAgICAgICAtQG1vdXNlLmRvd25bMF0gICogZHByLCAtaGd0ICsgQG1vdXNlLmRvd25bMV0gKiBkcHJcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgIFxuICAgICMgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIFxuICAgIFxuICAgIG9uTWVudUFjdGlvbjogKGFjdGlvbiwgYXJncykgPT5cbiAgICAgICAgXG4gICAgICAgICMga2xvZyBcIm1lbnVBY3Rpb24gI3thY3Rpb259XCIgYXJncywgQHdvcmxkLnNjZW5lLmRlYnVnTGF5ZXIuaXNWaXNpYmxlKClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIHN1cGVyXG4gICAgICAgICAgICAgICAgICAgICAgICBcbm5ldyBNYWluV2luICAgICAgICAgICAgXG4iXX0=
//# sourceURL=../coffee/window.coffee