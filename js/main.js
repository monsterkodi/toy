// koffee 1.6.0

/*
00     00   0000000   000  000   000
000   000  000   000  000  0000  000
000000000  000000000  000  000 0 000
000 0 000  000   000  000  000  0000
000   000  000   000  000  000   000
 */
var Main, app, args, ref, slash,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

ref = require('kxk'), app = ref.app, args = ref.args, slash = ref.slash;

Main = (function(superClass) {
    extend(Main, superClass);

    function Main() {
        var dirs;
        dirs = [__dirname + "/../shader"];
        dirs = dirs.concat(slash.list(dirs[0], {
            type: 'dir'
        }).filter(function(p) {
            return p.type === 'dir';
        }).map(function(d) {
            return d.file;
        }));
        Main.__super__.constructor.call(this, {
            dir: __dirname,
            dirs: dirs,
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsMkJBQUE7SUFBQTs7O0FBUUEsTUFBdUIsT0FBQSxDQUFRLEtBQVIsQ0FBdkIsRUFBRSxhQUFGLEVBQU8sZUFBUCxFQUFhOztBQUVQOzs7SUFFQyxjQUFBO0FBRUMsWUFBQTtRQUFBLElBQUEsR0FBTyxDQUFJLFNBQUQsR0FBVyxZQUFkO1FBQ1AsSUFBQSxHQUFPLElBQUksQ0FBQyxNQUFMLENBQVksS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFLLENBQUEsQ0FBQSxDQUFoQixFQUFvQjtZQUFBLElBQUEsRUFBSyxLQUFMO1NBQXBCLENBQStCLENBQUMsTUFBaEMsQ0FBdUMsU0FBQyxDQUFEO21CQUFPLENBQUMsQ0FBQyxJQUFGLEtBQVE7UUFBZixDQUF2QyxDQUE0RCxDQUFDLEdBQTdELENBQWlFLFNBQUMsQ0FBRDttQkFBTyxDQUFDLENBQUM7UUFBVCxDQUFqRSxDQUFaO1FBRVAsc0NBQ0k7WUFBQSxHQUFBLEVBQWdCLFNBQWhCO1lBQ0EsSUFBQSxFQUFnQixJQURoQjtZQUVBLEdBQUEsRUFBZ0IsT0FBQSxDQUFRLGlCQUFSLENBRmhCO1lBR0EsS0FBQSxFQUFnQixZQUhoQjtZQUlBLElBQUEsRUFBZ0IsZ0JBSmhCO1lBS0EsS0FBQSxFQUFnQixrQkFMaEI7WUFNQSxjQUFBLEVBQWdCLEdBTmhCO1lBT0EsS0FBQSxFQUFnQixJQVBoQjtZQVFBLE1BQUEsRUFBZ0IsR0FSaEI7WUFTQSxRQUFBLEVBQWdCLEdBVGhCO1lBVUEsU0FBQSxFQUFnQixHQVZoQjtTQURKO1FBYUEsSUFBSSxDQUFDLEtBQUwsR0FBZ0I7UUFDaEIsSUFBSSxDQUFDLFFBQUwsR0FBZ0I7SUFuQmpCOzs7O0dBRlk7O0FBdUJuQixJQUFJIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwXG4wMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgYXBwLCBhcmdzLCBzbGFzaCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBNYWluIGV4dGVuZHMgYXBwXG5cbiAgICBAOiAtPlxuICAgICAgICBcbiAgICAgICAgZGlycyA9IFtcIiN7X19kaXJuYW1lfS8uLi9zaGFkZXJcIl1cbiAgICAgICAgZGlycyA9IGRpcnMuY29uY2F0IHNsYXNoLmxpc3QoZGlyc1swXSwgdHlwZTonZGlyJykuZmlsdGVyKChwKSAtPiBwLnR5cGU9PSdkaXInKS5tYXAgKGQpIC0+IGQuZmlsZVxuICAgICAgICBcbiAgICAgICAgc3VwZXJcbiAgICAgICAgICAgIGRpcjogICAgICAgICAgICBfX2Rpcm5hbWVcbiAgICAgICAgICAgIGRpcnM6ICAgICAgICAgICBkaXJzXG4gICAgICAgICAgICBwa2c6ICAgICAgICAgICAgcmVxdWlyZSAnLi4vcGFja2FnZS5qc29uJ1xuICAgICAgICAgICAgaW5kZXg6ICAgICAgICAgICdpbmRleC5odG1sJ1xuICAgICAgICAgICAgaWNvbjogICAgICAgICAgICcuLi9pbWcvYXBwLmljbydcbiAgICAgICAgICAgIGFib3V0OiAgICAgICAgICAnLi4vaW1nL2Fib3V0LnBuZydcbiAgICAgICAgICAgIHByZWZzU2VwZXJhdG9yOiAn4pa4J1xuICAgICAgICAgICAgd2lkdGg6ICAgICAgICAgIDEwMjRcbiAgICAgICAgICAgIGhlaWdodDogICAgICAgICA3NjhcbiAgICAgICAgICAgIG1pbldpZHRoOiAgICAgICAzMDBcbiAgICAgICAgICAgIG1pbkhlaWdodDogICAgICAzMDBcbiAgICAgICAgICAgIFxuICAgICAgICBhcmdzLndhdGNoICAgID0gdHJ1ZVxuICAgICAgICBhcmdzLmRldnRvb2xzID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbm5ldyBNYWluIl19
//# sourceURL=../coffee/main.coffee