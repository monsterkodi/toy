// koffee 1.6.0

/*
00     00   0000000   000  000   000
000   000  000   000  000  0000  000
000000000  000000000  000  000 0 000
000 0 000  000   000  000  000  0000
000   000  000   000  000  000   000
 */
var Main, app, args, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), app = ref.app, args = ref.args;

Main = (function(superClass) {
    extend(Main, superClass);

    function Main() {
        Main.__super__.constructor.call(this, {
            dir: __dirname,
            dirs: ['../shader'],
            pkg: require('../package.json'),
            index: 'index.html',
            icon: '../img/app.ico',
            about: '../img/about.png',
            prefsSeperator: '▸',
            width: 1024,
            height: 768,
            minWidth: 300,
            minHeight: 300
        });
        args.watch = true;
        args.devtools = true;
    }

    return Main;

})(app);

new Main;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsb0JBQUE7SUFBQTs7O0FBUUEsTUFBZ0IsT0FBQSxDQUFRLEtBQVIsQ0FBaEIsRUFBRSxhQUFGLEVBQU87O0FBRUQ7OztJQUVDLGNBQUE7UUFFQyxzQ0FDSTtZQUFBLEdBQUEsRUFBZ0IsU0FBaEI7WUFDQSxJQUFBLEVBQWdCLENBQUMsV0FBRCxDQURoQjtZQUVBLEdBQUEsRUFBZ0IsT0FBQSxDQUFRLGlCQUFSLENBRmhCO1lBR0EsS0FBQSxFQUFnQixZQUhoQjtZQUlBLElBQUEsRUFBZ0IsZ0JBSmhCO1lBS0EsS0FBQSxFQUFnQixrQkFMaEI7WUFNQSxjQUFBLEVBQWdCLEdBTmhCO1lBT0EsS0FBQSxFQUFnQixJQVBoQjtZQVFBLE1BQUEsRUFBZ0IsR0FSaEI7WUFTQSxRQUFBLEVBQWdCLEdBVGhCO1lBVUEsU0FBQSxFQUFnQixHQVZoQjtTQURKO1FBYUEsSUFBSSxDQUFDLEtBQUwsR0FBZ0I7UUFDaEIsSUFBSSxDQUFDLFFBQUwsR0FBZ0I7SUFoQmpCOzs7O0dBRlk7O0FBb0JuQixJQUFJIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwXG4wMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgYXBwLCBhcmdzIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIE1haW4gZXh0ZW5kcyBhcHBcblxuICAgIEA6IC0+XG4gICAgICAgIFxuICAgICAgICBzdXBlclxuICAgICAgICAgICAgZGlyOiAgICAgICAgICAgIF9fZGlybmFtZVxuICAgICAgICAgICAgZGlyczogICAgICAgICAgIFsnLi4vc2hhZGVyJ11cbiAgICAgICAgICAgIHBrZzogICAgICAgICAgICByZXF1aXJlICcuLi9wYWNrYWdlLmpzb24nXG4gICAgICAgICAgICBpbmRleDogICAgICAgICAgJ2luZGV4Lmh0bWwnXG4gICAgICAgICAgICBpY29uOiAgICAgICAgICAgJy4uL2ltZy9hcHAuaWNvJ1xuICAgICAgICAgICAgYWJvdXQ6ICAgICAgICAgICcuLi9pbWcvYWJvdXQucG5nJ1xuICAgICAgICAgICAgcHJlZnNTZXBlcmF0b3I6ICfilrgnXG4gICAgICAgICAgICB3aWR0aDogICAgICAgICAgMTAyNFxuICAgICAgICAgICAgaGVpZ2h0OiAgICAgICAgIDc2OFxuICAgICAgICAgICAgbWluV2lkdGg6ICAgICAgIDMwMFxuICAgICAgICAgICAgbWluSGVpZ2h0OiAgICAgIDMwMFxuICAgICAgICAgICAgXG4gICAgICAgIGFyZ3Mud2F0Y2ggICAgPSB0cnVlXG4gICAgICAgIGFyZ3MuZGV2dG9vbHMgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxubmV3IE1haW4iXX0=
//# sourceURL=../coffee/main.coffee