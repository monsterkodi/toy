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
        process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUEsMkJBQUE7SUFBQTs7O0FBUUEsTUFBdUIsT0FBQSxDQUFRLEtBQVIsQ0FBdkIsRUFBRSxhQUFGLEVBQU8sZUFBUCxFQUFhOztBQUVQOzs7SUFFQyxjQUFBO0FBQ0MsWUFBQTtRQUFBLE9BQU8sQ0FBQyxHQUFJLENBQUEsb0NBQUEsQ0FBWixHQUFvRDtRQUVwRCxJQUFBLEdBQU8sQ0FBSSxTQUFELEdBQVcsWUFBZDtRQUNQLElBQUEsR0FBTyxJQUFJLENBQUMsTUFBTCxDQUFZLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBSyxDQUFBLENBQUEsQ0FBaEIsRUFBb0I7WUFBQSxJQUFBLEVBQUssS0FBTDtTQUFwQixDQUErQixDQUFDLE1BQWhDLENBQXVDLFNBQUMsQ0FBRDttQkFBTyxDQUFDLENBQUMsSUFBRixLQUFRO1FBQWYsQ0FBdkMsQ0FBNEQsQ0FBQyxHQUE3RCxDQUFpRSxTQUFDLENBQUQ7bUJBQU8sQ0FBQyxDQUFDO1FBQVQsQ0FBakUsQ0FBWjtRQUVQLHNDQUNJO1lBQUEsR0FBQSxFQUFnQixTQUFoQjtZQUNBLElBQUEsRUFBZ0IsSUFEaEI7WUFFQSxHQUFBLEVBQWdCLE9BQUEsQ0FBUSxpQkFBUixDQUZoQjtZQUdBLEtBQUEsRUFBZ0IsWUFIaEI7WUFJQSxJQUFBLEVBQWdCLGdCQUpoQjtZQUtBLEtBQUEsRUFBZ0Isa0JBTGhCO1lBTUEsY0FBQSxFQUFnQixHQU5oQjtZQU9BLEtBQUEsRUFBZ0IsSUFQaEI7WUFRQSxNQUFBLEVBQWdCLEdBUmhCO1lBU0EsUUFBQSxFQUFnQixHQVRoQjtZQVVBLFNBQUEsRUFBZ0IsR0FWaEI7U0FESjtRQWFBLElBQUksQ0FBQyxLQUFMLEdBQWdCO1FBQ2hCLElBQUksQ0FBQyxRQUFMLEdBQWdCO0lBcEJqQjs7OztHQUZZOztBQXdCbkIsSUFBSSIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDBcbjAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAwIDAwMFxuMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAwMDAwXG4wMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IGFwcCwgYXJncywgc2xhc2ggfSA9IHJlcXVpcmUgJ2t4aydcblxuY2xhc3MgTWFpbiBleHRlbmRzIGFwcFxuXG4gICAgQDogLT5cbiAgICAgICAgcHJvY2Vzcy5lbnZbJ0VMRUNUUk9OX0RJU0FCTEVfU0VDVVJJVFlfV0FSTklOR1MnXSA9IHRydWVcbiAgICAgICAgXG4gICAgICAgIGRpcnMgPSBbXCIje19fZGlybmFtZX0vLi4vc2hhZGVyXCJdXG4gICAgICAgIGRpcnMgPSBkaXJzLmNvbmNhdCBzbGFzaC5saXN0KGRpcnNbMF0sIHR5cGU6J2RpcicpLmZpbHRlcigocCkgLT4gcC50eXBlPT0nZGlyJykubWFwIChkKSAtPiBkLmZpbGVcbiAgICAgICAgIyBrbG9nICdkaXJzJyBkaXJzXG4gICAgICAgIHN1cGVyXG4gICAgICAgICAgICBkaXI6ICAgICAgICAgICAgX19kaXJuYW1lXG4gICAgICAgICAgICBkaXJzOiAgICAgICAgICAgZGlyc1xuICAgICAgICAgICAgcGtnOiAgICAgICAgICAgIHJlcXVpcmUgJy4uL3BhY2thZ2UuanNvbidcbiAgICAgICAgICAgIGluZGV4OiAgICAgICAgICAnaW5kZXguaHRtbCdcbiAgICAgICAgICAgIGljb246ICAgICAgICAgICAnLi4vaW1nL2FwcC5pY28nXG4gICAgICAgICAgICBhYm91dDogICAgICAgICAgJy4uL2ltZy9hYm91dC5wbmcnXG4gICAgICAgICAgICBwcmVmc1NlcGVyYXRvcjogJ+KWuCdcbiAgICAgICAgICAgIHdpZHRoOiAgICAgICAgICAxMDI0XG4gICAgICAgICAgICBoZWlnaHQ6ICAgICAgICAgNzY4XG4gICAgICAgICAgICBtaW5XaWR0aDogICAgICAgMzAwXG4gICAgICAgICAgICBtaW5IZWlnaHQ6ICAgICAgMzAwXG4gICAgICAgICAgICBcbiAgICAgICAgYXJncy53YXRjaCAgICA9IHRydWVcbiAgICAgICAgYXJncy5kZXZ0b29scyA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG5uZXcgTWFpbiJdfQ==
//# sourceURL=../coffee/main.coffee