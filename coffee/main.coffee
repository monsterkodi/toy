###
00     00   0000000   000  000   000
000   000  000   000  000  0000  000
000000000  000000000  000  000 0 000
000 0 000  000   000  000  000  0000
000   000  000   000  000  000   000
###

{ app, args, slash } = require 'kxk'

class Main extends app

    @: ->
        process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true
        
        dirs = ["#{__dirname}/../shader"]
        dirs = dirs.concat slash.list(dirs[0], type:'dir').filter((p) -> p.type=='dir').map (d) -> d.file
        # klog 'dirs' dirs
        super
            dir:            __dirname
            dirs:           dirs
            pkg:            require '../package.json'
            index:          'index.html'
            icon:           '../img/app.ico'
            about:          '../img/about.png'
            prefsSeperator: '▸'
            width:          1024
            height:         768
            minWidth:       300
            minHeight:      300
            
        args.watch    = true
        args.devtools = true
                                
new Main