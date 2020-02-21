###
000   000  000  000   000  0000000     0000000   000   000
000 0 000  000  0000  000  000   000  000   000  000 0 000
000000000  000  000 0 000  000   000  000   000  000000000
000   000  000  000  0000  000   000  000   000  000   000
00     00  000  000   000  0000000     0000000   00     00
###

{ $, keyinfo, win } = require 'kxk'

Toy = require './toy'

class MainWin extends win
    
    @: ->
        
        @last = left:{x:0 y:0}, right:{x:0 y:0}
        @inhibit = left:0 right:0
        super
            dir:    __dirname
            pkg:    require '../package.json'
            menu:   '../coffee/menu.noon'
            icon:   '../img/mini.png'
            prefsSeperator: '▸'
            context: false
            onLoad: @onLoad
          
        @mouse = 
            down: [0 0]
            up:   [0 0]
            
        addEventListener 'pointerdown' @onMouseDown
        addEventListener 'pointermove' @onMouseMove
        addEventListener 'pointerup'   @onMouseUp
                        
    onLoad: =>

        @toy = new Toy $ '#toy'
        @win.on 'resize' @toy.resize
                                
    # 000   000  00000000  000   000  
    # 000  000   000        000 000   
    # 0000000    0000000     00000    
    # 000  000   000          000     
    # 000   000  00000000     000     
    
    onKeyDown: (event) =>

        { mod, key, combo, char } = keyinfo.forEvent event
        
        if event.which < 256 and not event.repeat
            @toy.mEffect.setKeyDown event.which

        super
        
    onKeyUp: (event) =>
        
        { mod, key, combo, char } = keyinfo.forEvent event
        # klog mod, key, combo, char, event.which
        
        if event.which < 256 and not event.repeat
            @toy?.mEffect.setKeyUp event.which
        
        super
        
    # 00     00   0000000   000   000   0000000  00000000  
    # 000   000  000   000  000   000  000       000       
    # 000000000  000   000  000   000  0000000   0000000   
    # 000 0 000  000   000  000   000       000  000       
    # 000   000   0000000    0000000   0000000   00000000  

    mousePos: (event) ->
        br = $('#toy').getBoundingClientRect()
        [event.clientX-br.left, event.clientY-br.top]
    
    onMouseDown: (event) => @mouse.down = @mousePos(event); @mouseEvent event
    onMouseMove: (event) =>                                @mouseEvent event
    onMouseUp:   (event) => @mouse.up = @mousePos(event); @mouseEvent event
        
    mouseEvent: (event) -> 
        return if not @toy
        pos = @mousePos(event)
        hgt = @toy.mCanvas.height
        dpr = window.devicePixelRatio
        if event.buttons
            @toy.mEffect.mRenderer.iMouse = [
                pos[0]          * dpr, hgt - pos[1]         * dpr
                @mouse.down[0]  * dpr, hgt - @mouse.down[1] * dpr
                ]
        else
            @toy.mEffect.mRenderer.iMouse = [
                @mouse.up[0]     * dpr,  hgt - @mouse.up[1]   * dpr
                -@mouse.down[0]  * dpr, -hgt + @mouse.down[1] * dpr
                ]
        
    # 00     00  00000000  000   000  000   000  
    # 000   000  000       0000  000  000   000  
    # 000000000  0000000   000 0 000  000   000  
    # 000 0 000  000       000  0000  000   000  
    # 000   000  00000000  000   000   0000000   
    
    onMenuAction: (action, args) =>
        
        # klog "menuAction #{action}" args, @world.scene.debugLayer.isVisible()
                    
        super
                        
new MainWin            
