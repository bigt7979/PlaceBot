(function() {
    'use strict';
    
    /* global r, localStorage */
    
    var place = r.place;
    var api;
    
    r.placeModule('', function(require) {
        api = require('api');
    });
	setTimeout(function() {location.reload(true);}, 4.5*60*1000);
    /**
     * @class PlaceBot
     */
    var PlaceBot = function() {
        /**
         * @property {Number} placeMode - Either PlaceBot.PlaceArray or PlaceBot.PlaceFunction
         */
        this.placeMode = PlaceBot.placeMode.ARRAY;
        
        /**
         * @property {Array} tiles - An array of tiles stored as [x, y, color]. 
         *   Used as a queue for placeMode.ARRAY, and as data storage for 
         *   placeMode.FUNCTION.
         */
        this.tiles = tiles || [];
    
        /**
         * @property {Function} tileSelector - A function that returns the index of the next tile to draw
         */
        this.tileSelector = PlaceBot.selector.DrawOrder;
        
        /**
         * @property {Function} _tileGeneratorFactory - The function that actually returns a tile generator
         */
        this._tileGeneratorFactory = undefined;
        
        /**
         * @property {Function} tileGenerator - Returns the next tile to draw
         */
        this.tileGenerator = undefined;
        
        /**
         * @property {Timer} drawTimer - The id of the current draw timer
         */
        this.drawTimer = undefined;
        
        /**
         * @property {Number} minTimer - The minimum time to use between trying to draw
         */
        this.minTimer = 10;
        
        /**
         * @property {Number} lastDrawTime - The last time a tile was drawn
         */
        this.lastDrawTime = 0;
        
        console.log([
            '------------',
          , 'PlaceBot ' + PlaceBot.version
          , '------------'
        ].join('\n'));
        
//        this.load();
        this._setTimer();
    };
    
    // Define getters
    Object.defineProperties(PlaceBot.prototype, {
        /**
         * @property {Number} cooldownRemaining - The time in ms until another draw is allowed
         */
        cooldownRemaining: {
            get: function() { return this.nextDrawTime - Date.now(); }
        },
        
        /**
         * @property {Number} nextDrawTime - The time that the next draw is allowed
         */
        nextDrawTime: {
            get: function() { return place.cooldownEndTime; }
        },
        
        /**
         * @property {Boolean} canDraw - Whether or not drawing is currently allowed
         */
        canDraw: {
            get: function() { return this.cooldownRemaining < 0 
                && this.lastDrawTime !== this.nextDrawTime; }
        }
    });
    
    
    /**
     * Sets the timer for the next available draw
     * 
     * @method _setTimer
     */
    PlaceBot.prototype._setTimer = function() {
        clearTimeout(this.drawTimer); // Ensure we only have one timer running
        
        var time = Math.round(Math.max(this.minTimer, this.cooldownRemaining));
        this.drawTimer = setTimeout(this.drawNext.bind(this), time);
        
        console.log('Scheduled draw in %sms', time);
    };
    
    /**
     * Draws the next tile (as chosen by this.tileSelector) if allowed, then sets
     * a timer for the next available draw. Also performs a check to make sure
     * the tile is not already the desired color.
     * 
     * @method drawNext
     */
    PlaceBot.prototype.drawNext = function() {
        if (this.canDraw) {
            var tile;
            
            if (this.placeMode === PlaceBot.placeMode.ARRAY) {
                if (this.tiles.length) {
                    var tileIndex = this.tileSelector(this.tiles);
                    tile = this.tiles.splice(tileIndex, 1)[0];
                }
            }
            else if (this.placeMode === PlaceBot.placeMode.FUNCTION) {
                tile = this.tileGenerator(this);
            }
            
            if (tile) {
                api.getPixelInfo(tile[0], tile[1]).then(function(data) {
                    if (data.color !== tile[2]) {
                        this.drawTile.apply(this, tile);
                    }
                    
                    this._setTimer();
                }.bind(this));
                
            }
        }
        
        this._setTimer();
    };
    
    /**
     * @method drawTile
     * @property {Number} x - The tile x coordinate
     * @property {Number} y - The tile y coordinate
     * @property {Number} color - The index of the color to use
     */
    PlaceBot.prototype.drawTile = function(x, y, color) {
        if (this.canDraw) {
            this.lastDrawTime = this.nextDrawTime;
            
            place.setColor(color);
            place.drawTile(x, y);
            
            console.log('Drawing %s at (%s, %s)', place.palette[color], x, y);
        }
    };
    
    /**
     * @property {String} version - Attach the placebot version
     * @static
     */
    PlaceBot.version = '$$version';
    
    /**
     * @property {Enum} placeMode
     * @static
     */
    PlaceBot.placeMode = { 
        ARRAY    : 0,
        FUNCTION : 1
    };
    
    /**
     * @property {Object} selector - Collection of tile selection functions
     * @static
     */
    PlaceBot.selector = {
        // Top -> Bottom, Left -> Right
        TopDown: function(tiles) {
            var index = -1,
                minX = Infinity,
                minY = Infinity;
            
            tiles.forEach(function(tile, i) {
                if (tile[1] < minY || (tile[1] === minY && tile[0] < minX)) {
                    index = i;
                    minX = tile[0];
                    minY = tile[1];
                }
            });
            
            return index;
        },
        
        // Bottom -> Top, Right -> Left
        BottomUp: function(tiles) {
            var index = -1,
                minX = -1,
                minY = -1;
            
            tiles.forEach(function(tile, i) {
                if (tile[1] > minY || (tile[1] === minY && tile[0] > minX)) {
                    index = i;
                    minX = tile[0];
                    minY = tile[1];
                }
            });
            
            return index;
        },
        
        // Chooses any random tile
        Random: function(tiles) {
            return Math.floor(Math.random() * tiles.length);
        },
        
        // Keeps the order that tiles were added
        DrawOrder: function(tiles) {
            return 0;
        }
    };
    
    new PlaceBot();
})();