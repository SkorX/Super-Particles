/* -----------------------------------------------
/* Author : Skor_X - skorx.ga
/* MIT license: http://opensource.org/licenses/MIT
/* GitHub : https://github.com/SkorX/Super-Particles
/* v0.1.0
/* ----------------------------------------------- */

// --- FULL OPTIONS EXPLANATION (with default values) (do not uncomment this code, preview only) ---
// {
//     particles: {
//         count:                       0,              (number)
//         properties: {
//             shape: {
//                 type:                "none",         (string, ("none" || "circle" || "square"))
//                 size:                25,             (number)
//                 color:               "#FFFFFF",      (string, [#colorString])
//                 stroke: {
//                     width:           0,              (number)
//                     color:           "#000000",      (string, [#colorString])
//                 }
//             }
//             image: {
//                 data:                undefined,      (undefined || HTMLImageElement)
//                 size:                15,             (number)
//                 opacity:             1,              (number, (0 < val <= 1))
//             }
//             motion: {
//                 speed:               8,              (number, (0 <= val))
//                 min_speed:           undefined,      (number, val < speed)
//                 bouncing:            true,           (boolean)
//                 slowDownOnCollision: false,          (boolean)
//                 vx:                  undefined,      (undefined || number, number: (0 < val <= 1))
//                 vy:                  undefined,      (undefined || number, number: (0 < val <= 1))
//                 vx_min:              undefined,      (undefined || number, number: (0 < val <= 1))
//                 vy_min:              undefined,      (undefined || number, number: (0 < val <= 1))
//             }
//             opacity: {
//                 value:               1,              (number, (0 < val <= 1))
//                 alternation: {
//                     enabled:         true,           (boolean)
//                     speed:           1,              (number)
//                     min_value:       0,              (number)
//                 }
//             }
//         }
//     }
//     linking: {
//         enabled:                     true,           (boolean)
//         max_distance:                150,            (numbar)
//         color:                       "#FFFFFF",      (string, [#colorString])
//         width:                       1.5,            (number)
//         opacity:                     0.6,            (number, (0 < val <= 1))
//     }
//     attraction: {
//         enabled:                     true            (boolean)
//         rotateX:                     500,            (numbar)
//         rotateY:                     500,            (numbar)
//     }
// }


var superParticle = function (tag, options) {
    "use strict";

    //init checks
    if (!(this instanceof superParticle))
        throw new Error("SuperParticle have to be executed as a class. Use new keyword.");

    if (typeof options !== "object")
        throw new Error("Options are not valid object element.");

    //// === PRIVATE VARIABLES ===
    this._position = {              //current particle postion
        x: undefined,
        y: undefined,
    };

    this._movement = {              //movement vector (velocity)
        vx: undefined,
        vy: undefined,

        initialSpeedSqr: undefined, //slowdown cached speed (for slowDownOnCollision setting)
    };

    this._gravity = {
        force: 0,                   //0 means particle has no gravity (no mass)
    };

    this._apperance = {
        shape: {
            type:  undefined,       //circle | square
            size:  0,
            color: undefined,
            stroke: {
                width: 0,
                color: undefined,
            }
        },
        image: {
            sourceData: undefined,  //HTMLCanvasElement loaded when creating particle
            data:       undefined,  //HTMLCanvasElement optimized for drawing (TODO optimize to target size)
            size:       0,
            opacity:    0,
        },
        opacity: {
            value: 1,

            alternation: {
                speed:     0,       //change per second
                min_value: 0,
            }
        },

        behavior: { 
            bounce:              true,
            slowDownOnCollision: false,
        },
    };

    //// === PUBLIC VARIABLES ===
    this.tag = undefined;

    //// === CONSTRUCTOR ===
    var constructor = function (tag, options) {
        if (typeof tag !== "string")
            throw new Error("Tag have to be a valid string.");

        this.tag = tag;
        this._loadOptions(options);

        return this;
    };


    //// === PUBLIC METHODS ===
    this.setSpeed = function (targetSpeed) {
        if (!isFinite(targetSpeed))
            throw new Error("Speed have to be finite number.");

        //calculating current speed & target speed divider
        var currentSpeed = Math.sqrt(Math.sqr(this._movement.vx) + Math.sqr(this._movement.vy));
        var divider = currentSpeed / targetSpeed;

        //reseting speed 
        this._movement.vx /= divider;
        this._movement.vy /= divider;

        //setting target speed as initial
        this._movement.initialSpeedSqr = Math.sqr(targetSpeed);

        return this;
    };

    this.resetSpeed = function () {
        //calculating current speed square
        var currentSpeedSqr = Math.sqr(this._movement.vx) + Math.sqr(this._movement.vy);

        //calulating speed difference
        var divider = Math.sqrt(currentSpeedSqr / this._movement.initialSpeedSqr);

        //reseting speed to initial value
        this._movement.vx /= divider;
        this._movement.vy /= divider;

        return this;
    };

    this.applyForce = function (vx, vy, changeInitialSpeed) {
        changeInitialSpeed = (typeof changeInitialSpeed === "boolean") ? changeInitialSpeed : false;

        if (isFinite(vx) && isFinite(vy)) {
            //applying new movement vector
            this._movement.vx += vx;
            this._movement.vy += vy;
            
            if (changeInitialSpeed)
                this._movement.initialSpeedSqr = Math.sqr(this._movement.vx) + Math.sqr(this._movement.vy);
        }

        return this;
    };

    this.size = function () {
        var shapeSize = (this._apperance.shape.type != undefined && this._apperance.shape.color) ?
            this._apperance.shape.size + this._apperance.shape.stroke.width : 0;

        var imgSize = (this._apperance.image.data != undefined && this._apperance.image.opacity) ?
            this._apperance.image.size : 0;

        return Math.max(shapeSize, imgSize);
    }

    this.attractTo = function (other) {
        //if no force, we do not have to calculate anything
        if (this._gravity.force == 0 || other._gravity.force == 0)
            return this;

        //if two particles are at the same place, no force can't be applied
        if (this._position.x === other._position.x &&
            this._position.y === other._position.y)
            return this;

        //distance square
        var distanceSqr =
            Math.sqr(this._position.x - other._position.x) +
            Math.sqr(this._position.y - other._position.y);

        if (distanceSqr > Math.SQRT2 && isFinite(distanceSqr)) {
            var gravityForce = (this._gravity.force * other._gravity.force) / distanceSqr;

            //let's move objects even when one has no force (it stills should be attracted to each other)
            if (gravityForce <= 0)
                gravityForce = 0.01;

            //optimization (very low gravity do not change positions significantly, but consumes processing power)
            //skipping high gravity (otherwise objects velocity can grow to extremly high values in a few ticks)
            if (gravityForce < 0.01 || gravityForce > 10)       //10 or 100 is cool (not too high, not too low)
                return this;

            //calculating postion difference
            var xDiff = other._position.x - this._position.x;
            var yDiff = other._position.y - this._position.y;

            var distance = Math.sqrt(distanceSqr);

            this.applyForce(
                ((xDiff / distance) * (gravityForce / this._gravity.force)),
                ((yDiff / distance) * (gravityForce / this._gravity.force)));

            other.applyForce(
                -((xDiff / distance) * (gravityForce / other._gravity.force)),
                -((yDiff / distance) * (gravityForce / other._gravity.force)));
        }

        return this;
    };

    this.update = function () {
        this._position.x += this._movement.vx;
        this._position.y += this._movement.vy;

        //TODO opacity alternation

        return this;
    };

    this.checkPosition = function (canvasWidth, canvasHeight) {
        if (!isFinite(canvasWidth) || !isFinite(canvasHeight))
            return this;

        var collision = false;
        var size = this.size();
        var radius = size / 2;

        if (this._apperance.behavior.bounce) {
            //bouncing handling
            if (this._position.x + radius >= canvasWidth && this._movement.vx > 0) {
                this._movement.vx = -this._movement.vx;
                collision = true;
            }
            else if (this._position.x - radius <= 0 && this._movement.vx < 0) {
                this._movement.vx = -this._movement.vx;
                collision = true;
            }

            if (this._position.y + radius >= canvasHeight && this._movement.vy > 0) {
                this._movement.vy = -this._movement.vy;
                collision = true;
            }
            else if (this._position.y - radius <= 0 && this._movement.vy < 0) {
                this._movement.vy = -this._movement.vy;
                collision = true;
            }
        }
        else {
            //warp handling (to the oposite edge of canvas)
            if (this._position.x - radius >= canvasWidth) {
                this._position.x = -radius;
                collision = true;
            }
            else if (this._position.x + radius <= 0) {
                this._position.x = canvasWidth + radius;
                collision = true;
            }

            if (this._position.y - radius >= canvasHeight) {
                this._position.y = -radius;
                collision = true;
            }
            else if (this._position.y + radius <= 0) {
                this._position.y = canvasHeight + radius;
                collision = true;
            }
        }

        if (collision && this._apperance.behavior.slowDownOnCollision)
            this.resetSpeed();

        return this;
    };

    this.draw = function (canvasContext) {
        //drawing shapes
        if (this._apperance.shape.type !== undefined &&
            this._apperance.shape.size && this._apperance.shape.color) {

            canvasContext.beginPath();

            if (this._apperance.shape.type === "circle") {
                //circle drawing
                canvasContext.arc(
                    this._position.x,
                    this._position.y,
                    this._apperance.shape.size / 2,
                    0,
                    2 * Math.PI);
            }
            else {
                //square drawing
                var centerPositionAdjustment = this._apperance.shape.size / 2;

                canvasContext.rect(
                    this._position.x - centerPositionAdjustment,
                    this._position.y - centerPositionAdjustment,
                    this._apperance.shape.size,
                    this._apperance.shape.size);
            }

            canvasContext.globalAlpha = this._apperance.opacity;

            canvasContext.fillStyle = this._apperance.shape.color;
            canvasContext.fill();

            //drawing outline (stroke)
            if (this._apperance.shape.stroke.width && this._apperance.shape.stroke.color) {
                canvasContext.lineWidth = this._apperance.shape.stroke.width;
                canvasContext.strokeStyle = this._apperance.shape.stroke.color;
                canvasContext.stroke();
            }
        }

        //drawing image
        if (this._apperance.image.data !== undefined &&
            this._apperance.image.size && this._apperance.image.opacity) {

            var ratio = this._apperance.image.data.height / this._apperance.image.data.width;
            var targetHeight = this._apperance.image.size * ratio;

            var centerPosAdjX = this._apperance.image.size / 2;
            var centerPosAdjY = targetHeight / 2;
            
            canvasContext.beginPath();
            canvasContext.globalAlpha = this._apperance.image.opacity;

            canvasContext.drawImage(
                this._apperance.image.data,
                this._position.x - centerPosAdjX,
                this._position.y - centerPosAdjY,
                this._apperance.image.size,
                targetHeight);
        }

        return this;
    };

    //// === PRIVATE METHODS ===
    //options
    this._loadOptions = function (options) {
        if (typeof options === 'undefined')
            return false;

        // if ('maskVisible'          in options && typeof options.maskVisible === 'boolean')
        //     that.maskVisibiliy(options.maskVisible);

        return true;
    };

    //utilities
    this._calculateDistance = function (p1, p2) {
        return Math.abs(
                 Math.sqrt(
                   Math.sqr(p1._position.x - p2._position.x) +
                   Math.sqr(p1._position.y - p2._position.y)));
    };


    //constructor call
    return constructor.call(this, tag, options);
};

// --- Super Particles ---
var superParticles = function (canvas, options) {
    "use strict";

    //init checks
    if (!(this instanceof superParticles))
        throw new Error("SuperParticles have to be executed as a class. Use new keyword.");

    if (!(canvas instanceof HTMLCanvasElement))
        throw new Error("Passed canvas element have to be HTMLCanvasElement.");

    if (typeof options !== "object")
        throw new Error("Options are not valid object element.");

    //// === PRIVATE VARIABLES ===
    this._initialized = false;

    //defaults
    this._defaults = {
        particles: {
            count: 0,
        
            properties: {
                shape: {
                    type: "none",               //none | circle | square
                    size: 25,                   //pixels

                    color: "#FFFFFF",
                    stroke: {
                        width: 0,
                        color: "#000000",
                    },
                },
                image: {
                    data:    undefined,         //HTMLCanvasElement
                    size:    15,                //width of image in pixels (height is calculted using image's aspect ratio)
                    opacity: 1,
                },

                motion: {
                    speed:     8,               //number of pixels per second
                    min_speed: undefined,       //minmal particle speed (undefined = no randomness)

                    bouncing:            true,  //determines if particles will be able to bounce on canvas borders
                    slowDownOnCollision: false, //forces particles to keep it's speed (and only change direction)

                    vx:     undefined,          //initial X velocity in range <-1;1> (undefined = random)
                    vy:     undefined,          //initial Y velocity in range <-1;1> (undefined = random)
                    vx_min: undefined,          //minimal X velocity in range <-1;1> (work only when vx is not undefined)
                    vy_min: undefined,          //minimal Y velocity in range <-1;1> (work only when vy is not undefined)
                },

                opacity: {
                    value: 1,                   //particle opacity

                    alternation: {
                        enabled:   false,
                        speed:     1,           //change per second
                        min_value: 0,
                    }
                }
            }
        },

        linking: {
            enabled:      true,
            max_distance: 150,                  //max distance in pixels (to draw a link line)
            color:        "#FFFFFF",
            width:        1.5,
            opacity:      0.6,
        },
        attraction: {
            enabled: true,
            force: 500,
        },

        background: {
            color: undefined,
            image: undefined,                   //HTMLImageElement

            imagePosition: {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
            }
        }

        //TODO some interactivity options
    };

    //canvas data
    this._canvas = {
        element: undefined,
        ctx:     undefined,

        width:   0,
        height:  0,

        drawing: {
            stop:         true,             //true, because it's initial state of uninitialized engine
            limitTo30FPS: false,

            isResizeEventRunning: false,
            lastWindowResizeTime: Date.now(),
        }
    };

    //particles list
    this._particlesCount = 0;
    this._particles = [];

    //callbacks
    this._callbacks = {
        initialized:   [],
        windowResized: [],
        diagnostics:   [],

        //one time callbacks (for internal use)
        _initialized:   undefined,
        _windowResized: undefined,
        _diagnostics:   undefined,
    };

    //keyboard data (shortcuts, etc.)
    this._keyboard = {
        queue: [],
    }

    //diagnostic data
    this._diagData = {
        fps:       0,           //current FPS
        frame:     0,           //frame id
        count:     0,           //particles count
        startTime: Date.now(),  //drawing start time (new for each restart)

        _times: [],             //frames times
    };


    //// === PUBLIC VARIABLES ===
    //events
    this.onInitialized   = undefined;       //()
    this.onWindowResized = undefined;       //()
    this.onDiagnostics   = undefined;       //(diagnosticData)


    //// === CONSTRUCTOR ===
    var constructor = function (canvas, options) {
        this._canvas.element = canvas;
        this._canvas.ctx = canvas.getContext("2d");

        this._canvas.width  = this._canvas.element.width  = this._canvas.element.offsetWidth;
        this._canvas.height = this._canvas.element.height = this._canvas.element.offsetHeight;

        //loading options passed by user
        this._loadOptions(options);

        //filling engine with particles
        //TODO

        //events attach
        window.addEventListener('keydown', this._keyDownHandler);
        window.addEventListener('resize',  this._resizeHandler);
        this._resizeHandler();

        //marking particles as prepared to run
        this._initialized = true;
        this.startDrawing();

        return this;
    };


    //// === PUBLIC METHODS ===
    //particles
    this.addParticle = function (particle) {
        if (!(particle instanceof superParticle))
            throw new Error("Particle have to be a superParticle instance.");

        //adding particle to collection
        this._particles.push(particle);

        return this;
    };

    this.removeParticle = function (particle) {
        if (!(particle instanceof superParticle))
            throw new Error("Particle have to be a superParticle instance.");

        //removing specified particle
        var index = this._particles.indexOf(particle);
        if (index !== -1)
            this._particles.splice(index, 1);

        return this;
    };

    //events
    this.addEventListener = function (event, callback) {
        if (typeof event !== 'string' || typeof callback !== 'function')
            return this;

        if (!event.startsWith('_') && event in this._callbacks) {
            this._callbacks[event].push(callback);
        }

        return this;
    };

    this.removeEventListener = function (event, callback) {
        if (typeof event !== 'string' || typeof callback !== 'function')
            return this;

        if (!event.startsWith('_') && event in this._callbacks) {
            var index = this._callbacks[event].indexOf(callback);

            if (index !== -1)
            this._callbacks[event].splice(index, 1);
        }

        return this;
    };

    //drawing
    this.startDrawing = function () {
        if (!this._canvas.drawing.stop || !this._initialized)       //preventing animation, if drawing loop is running or engine is not initialized
            return this;

        this._canvas.drawing.stop = false;
        this._diagData.startTime = Date.now();
        this._requestFrame(this._process);

        return this;
    };

    this.stopDrawing = function () {
        this._canvas.drawing.stop = true;

        return this;
    };

    //image export
    this.getScreenshotData = function (callback, format, encoderOptions) {          //callback (imageData: base64 string | false)
        if (!this._initialized) {
            this._execCallback(callback, [false]);
            return that;
        }

        var imgData = this._canvas.element.toDataURL(format, encoderOptions);
        this._execCallback(callback, [imgData]);

        return that;
    };

    this.getScreenshot = function (callback) {                                      //callback (image: HTMLImageElement | false)
        if (typeof callback !== 'function')
            throw new Error("Callback parameter is not a function.");

        this.getScreenshotData(function (imageData) {
            if (imageData === false) {
                this._execCallback(callback, [false]);
                return this;
            }
        });

        var image = document.createElement("img");
        image.onload = function () { this._execCallback(callback, [image]); }.bind(this);
        image.src = imageData;

        return this;
    };

    
    //// === PRIVATE METHODS ===
    //options
    this._loadOptions = function (options) {
        if (typeof options === 'undefined')
            return false;

        // if ('maskVisible'          in options && typeof options.maskVisible === 'boolean')
        //     that.maskVisibiliy(options.maskVisible);

        // if ('maskType'             in options && typeof options.maskType === 'string')
        //     if (options.maskType === 'rectangle' || options.maskType === 'image' || options.maskType === 'rectangle-inner')
        //         that._.mask.type = options.maskType;

        // if ('maskAspectRatio'      in options) {
        //     if (typeof options.maskAspectRatio === 'number' && options.maskAspectRatio > 0)
        //         that._.mask.aspectRatio = options.maskAspectRatio;
        //     else if (typeof options.maskAspectRatio === 'boolean' && options.maskAspectRatio === false)
        //         that._.mask.aspectRatio = options.maskAspectRatio;
        // }

        // if ('maskOpacity'          in options && typeof options.maskOpacity === 'number')
        //     if (options.maskOpacity >= 0.1 && options.maskOpacity <= 1)
        //         that._.mask.opacity = options.maskOpacity;

        // if ('maskColor'            in options && typeof options.maskColor === 'string')
        //     if (window.colorHelper.getColorFromHex(options.maskColor) !== false) {
        //         that._.mask.color = options.maskColor;
        //         that._.mask.drawImage = that._maskRecolor(that._.mask.image);
        //     }

        // if ('maskImage'            in options && options.maskImage instanceof HTMLImageElement)
        //     that.applyImageMask(maskImage);

        // if ('maskGrabMargin'       in options && typeof options.maskGrabMargin === 'number')
        //     if (options.maskGrabMargin >= 4 && options.maskGrabMargin <= 50)
        //         that._.mask.grabMargin = options.maskGrabMargin;

        // if ('maskTouchGrabMargin' in options && typeof options.maskTouchGrabMargin === 'number')
        //     if (options.maskTouchGrabMargin >= 10 && options.maskTouchGrabMargin <= 100)
        //         that._.mask.touchGrabMargin = options.maskTouchGrabMargin;

        
        // if ('maskQualityData'      in options) {
        //     try {
        //         if (typeof options.maskQualityData === 'undefined') {
        //             that._.mask.qualityValues = undefined;
        //             that._fieldQualityHandler(true);
        //         }
        //         else
        //             that.setFieldQuality(options.maskQualityData);
        //     } catch (e) { }
        // }

        // //theme options
        // if ('theme'                in options && typeof options.theme === 'string') {
        //     switch (options.theme) {        //we can't use build-in function (because it requests redraw, it may break script called from constructor (image is not loaded, but try to redraw))
        //         case "dark": {
        //             that._.theme.color = "#000000";
        //             break;
        //         }
        //         case "light": {
        //             that._.theme.color = "#FFFFFF";
        //             break;
        //         }
        //         default: {
        //             var colorCheck = new RegExp("^#([0-9A-F]{3}|[0-9A-F]{6})$", "i");
        //             if (!colorCheck.test(options.theme))
        //                 break;

        //             that._.theme.color = options.theme;
        //         }
        //     }
        // }

        // if ('cornersType'          in options && typeof options.cornersType === 'string')
        //     if (options.cornersType === 'none' || options.cornersType === 'bubbles' || options.cornersType === 'edges')
        //         that._.theme.cornersType = options.cornersType;

        // if ('cornersColor'         in options && typeof options.cornersColor === 'string')
        //     if (window.colorHelper.getColorFromHex(options.cornersColor) !== false)
        //         that._.theme.cornersColor = options.cornersColor;

        // if ('cornersRadius'        in options && typeof options.cornersRadius === 'number')
        //     if (options.cornersRadius > 0 && options.cornersRadius <= 50)
        //         that._.theme.cornersRadius = options.cornersRadius;

        // //animation options
        // if ('waitAnimTimespan'     in options && typeof options.waitAnimTimespan === 'number')
        //     if (options.waitAnimTimespan > 100)
        //         that._.waitAnimation.phaseTimespan = options.waitAnimTimespan;

        // if ('waitAnimSize'         in options && typeof options.waitAnimSize === 'number')
        //     if (options.waitAnimSize > 0.01 && options.waitAnimSize <= 1)
        //         that._.waitAnimation.size = options.waitAnimSize;
        //     else if (options.waitAnimSize > 1)
        //         that._.waitAnimation.size = 5;              //if (size > 1) we make animation on full canvas

        // if ('waitAnimColor'        in options) {
        //     if (typeof options.waitAnimColor === 'undefined')
        //         that._.waitAnimation.color = undefined;
        //     else if (typeof options.waitAnimColor === 'boolean' && options.waitAnimColor === false)
        //         that._.waitAnimation.color = undefined;
        //     else if (typeof options.waitAnimColor === 'string'  && window.colorHelper.getColorFromHex(options.waitAnimColor) !== false)
        //         that._.waitAnimation.color = options.waitAnimColor;
        // }

        // //first we set fullscreen target and than check if we should turn that on
        // if ('fullscreenTarget'     in options) {
        //     if (typeof options.fullscreenTarget === 'undefined')
        //         that._.fullscreen.target = document.documentElement;
        //     else if (that._fullscreenAvailable(options.fullscreenTarget))
        //         that._.fullscreen.target = options.fullscreenTarget;
        // }

        // if ('fullscreenEnabled'    in options && typeof options.fullscreenEnabled === 'boolean') {
        //     if (options.fullscreenEnabled !== that._.fullscreen.enabled)
        //         that.toggleFullscreen();
        // }

        return true;
    };

    //callbacks & events
    this._handleEvent = function (eventName, argArray, disableInner, disablePublic) {
        if (typeof eventName !== 'string')
            throw new Error("_handleEvent - Event name have to be a string value.");

        disableInner  = (typeof disableInner  !== 'boolean') ? false : disableInner;
        disablePublic = (typeof disablePublic !== 'boolean') ? false : disablePublic;

        if (!disableInner) {
            var privateName = "_" + eventName;
            
            //executing internal callbacks (first, no async)
            if (privateName in this._callbacks && typeof this._callbacks[privateName] === 'function')
                this._callbacks[privateName].apply(this, argArray);
        }
        
        if (!disablePublic) {
            var publicName = "on" + eventName.charAt(0).toUpperCase() + eventName.slice(1);

            //executing public callbacks (from array)
            if (eventName in this._callbacks) {        //don't have to check for function type (addEventListener do this)
                for (var i = 0; i < this._callbacks[eventName].length; i++) {
                    setTimeout(function (id) { (this._callbacks[eventName][id]).apply(this, argArray); }.bind(this), undefined, i);
                }
            }

            //executing public callback (on... named)
            if (publicName in this && typeof this[publicName] === 'function')
                setTimeout(function () { (this[publicName]).apply(this, argArray); }.bind(this));
        }
    };

    this._execCallback = function (callback, args) {
        if (typeof callback !== 'function')
            throw new Error("Callback parameter is not a function.");

        try {
            setTimeout(function () { callback.apply(this, args); }.bind(this));
        }
        catch (e) {
            console.exception("An error was thrown during callback: " + e.message || e);
        }
    };

    //drawing
    this._requestFrame = function (callback) {
        if (window.requestAnimationFrame)               window.requestAnimationFrame(callback.bind(this));
        else if (window.mozRequestAnimationFrame)       window.mozRequestAnimationFrame(callback.bind(this));
        else if (window.webkitRequestAnimationFrame)    window.webkitRequestAnimationFrame(callback.bind(this));
        else if (window.oRequestAnimationFrame)         window.oRequestAnimationFrame(callback.bind(this));
        else if (window.msRequestAnimationFrame)        window.msRequestAnimationFrame(callback.bind(this));
        else
            throw new Error("Can't redraw canvas, because browser do not support any requestAnimationFrame method.");
    };

    this._process = function () {
        if (this._canvas.drawing.stop)          //preventing particles processing when animation should be stopped
            return;

        this._particlesCount = this._particles.length;

        var avgSpeed = 0;

        //logic / particles processing
        for (var i = 0; i < this._particlesCount; i++) {
            //particles interactions
            for (var j = i + 1; j < this._particlesCount; j++) {
                //attration
                this._particles[i].attractTo(this._particles[j]);
            }

            this._particles[i].checkPosition(this._canvas.width, this._canvas.height);
            this._particles[i].update();

            avgSpeed += Math.sqrt(Math.sqr(this._particles[i]._movement.vx) + Math.sqr(this._particles[i]._movement.vy));
        }

        avgSpeed /= this._particlesCount;
        console.log(avgSpeed);

        this._drawing_Redraw();
        this._drawing_Diagnostic();

        //request next animation frame
        this._requestFrame(this._process);
    };

    this._drawing_Redraw = function () {
        if (this._canvas.drawing.limitTo30FPS && this._diagData.frame % 2 != 0)
            return;

        //clear canvas / draw canvas background
        this._drawing_ClearCanvas();

        for (var i = 0; i < this._particlesCount; i++) {
            //line linking
            if (this._defaults.linking.enabled) {
                var maxDistanceSqr = Math.sqr(this._defaults.linking.max_distance);

                for (var j = i + 1; j < this._particlesCount; j++) {
                    var distanceSqr =
                        Math.sqr(this._particles[i]._position.x - this._particles[j]._position.x) +
                        Math.sqr(this._particles[i]._position.y - this._particles[j]._position.y);

                    if (distanceSqr <= maxDistanceSqr) {
                        this._canvas.ctx.save();
                        
                        this._canvas.ctx.beginPath();
                        this._canvas.ctx.moveTo(this._particles[i]._position.x, this._particles[i]._position.y);
                        this._canvas.ctx.lineTo(this._particles[j]._position.x, this._particles[j]._position.y);
                        this._canvas.ctx.lineWidth   = this._defaults.linking.width;
                        this._canvas.ctx.strokeStyle = this._defaults.linking.color;
                        this._canvas.ctx.globalAlpha = this._defaults.linking.opacity * (1 - distanceSqr / maxDistanceSqr);
                        this._canvas.ctx.stroke();

                        this._canvas.ctx.restore();
                    }
                }
            }

            //particle drawing
            this._canvas.ctx.save();
            this._particles[i].draw(this._canvas.ctx);
            this._canvas.ctx.restore();
        }
    };

    this._drawing_ClearCanvas = function () {
        this._canvas.ctx.save();

        if (this._defaults.background.color) {
            this._canvas.ctx.fillStyle             = this._defaults.background.color;
            this._canvas.ctx.globalAlpha           = 1.0;
            this._canvas.ctx.imageSmoothingEnabled = false;
            this._canvas.ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
        }
        else {
            this._canvas.ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        }

        if (this._defaults.background.image) {
            this._canvas.ctx.drawImage(
                this._defaults.background.image,
                this._defaults.background.imagePosition.x,
                this._defaults.background.imagePosition.y,
                this._defaults.background.imagePosition.width,
                this._defaults.background.imagePosition.height);
        }

        this._canvas.ctx.restore();
    };

    this._drawing_Diagnostic = function () {
        //frame count & particles count
        this._diagData.frame++;

        if (this._canvas.drawing.limitTo30FPS && this._diagData.frame % 2 != 0)
            return;
            
        this._diagData.count = this._particles.length;

        //fps calculation
        var now = performance.now();
        while (this._diagData._times.length > 0 && this._diagData._times[0] <= now - 1000) {
            this._diagData._times.shift();
        }
        this._diagData._times.push(now);

        this._diagData.fps =
            (this._diagData._times.length / ((now - this._diagData._times[0]) / 1000))
            .toFixed(2);

        //rise event
        this._handleEvent("diagnostics", [{
            fps:       this._diagData.fps,
            frame:     (this._canvas.drawing.limitTo30FPS) ? parseInt(this._diagData.frame / 2) : this._diagData.frame,
            count:     this._diagData.count,
            startTime: this._diagData.startTime
        }]);
    };

    //utilities, tools, transformations, etc.
    this.__getCanvasForImage = function (image) {
        if (!(image instanceof HTMLCanvasElement) &&
            !(image instanceof HTMLImageElement)  &&
            !(image instanceof HTMLVideoElement))
            throw new Error("Can't convert image, because it is in wrong format.");

        var resultCanvas    = document.createElement("canvas");
        var resultCanvasCtx = resultCanvas.getContext("2d");

        if (image instanceof HTMLCanvasElement) {
            resultCanvas.width  = image.width;
            resultCanvas.height = image.height;
        }
        else if (image instanceof HTMLImageElement) {
            if (image.complete === false || image.naturalWidth === undefined || image.naturalWidth === 0)
                throw new Error("Passed image is broken.");

            resultCanvas.width  = image.naturalWidth;
            resultCanvas.height = image.naturalHeight;
        }
        else if (image instanceof HTMLVideoElement) {
            if (image.videoWidth === undefined || image.videoWidth === 0)
                throw new Error("Passed video is broken.");

            resultCanvas.width  = image.videoWidth;
            resultCanvas.height = image.videoHeight;
        }

        resultCanvasCtx.drawImage(image, 0, 0);

        //checking for tainted canvas
        try {
            resultCanvasCtx.getImageData(0, 0, 1, 1);
        }
        catch (e) {
            if (e.name === "SecurityError")
                throw new TaintedImageError("Loaded image causes security errors. Load image from the same domain or allow for cross-origin data.");
        }

        return resultCanvas;
    };

    this.__convertImage = function (image, targetType, callback) {
        if (!(image instanceof HTMLCanvasElement) &&
            !(image instanceof HTMLImageElement)  &&
            !(image instanceof HTMLVideoElement)  &&
            imgFromStr === false)
            throw new Error("Can't convert image, because it is in wrong format.");

        if (targetType !== HTMLCanvasElement &&
            targetType !== HTMLImageElement &&
            targetType !== Image)
            throw new Error("Can't convert image, because targetType is incorrect.");

        var moveCanvas = this.__getCanvasForImage(image);

        if (targetType === HTMLCanvasElement) {
            setTimeout(function () { callback.call(this, moveCanvas); }.bind(this));
        } else if (targetType === HTMLImageElement || targetType === Image) {
            var newImg = new Image(moveCanvas.width, moveCanvas.height);
            newImg.onload = function () {
                callback.call(this, newImg);
            }.bind(this);
            newImg.onerror = function () {
                //this should never happen
                throw new Error("While converting an image to HTMLImageElement, error has occured.");
            };
            newImg.src = moveCanvas.toDataURL();
        }
    };

    this.__getScaledDownImage = function (imageCanvas, maxWidth, maxHeight) {
        if (typeof imageCanvas === "undefined" || !(imageCanvas instanceof HTMLCanvasElement))
            return false;

        //canvas cloneing
        var resultCanvas = this.__getCanvasForImage(imageCanvas);

        if (imageCanvas.width > maxWidth || imageCanvas.height > maxHeight) {
            var sizeRatio = imageCanvas.width / imageCanvas.height;
            var newWidth  = imageCanvas.width;
            var newHeight = imageCanvas.height;

            if (newWidth > maxWidth) {
                newWidth  = maxWidth;
                newHeight = newWidth * (1 / sizeRatio);
            }

            if (newHeight > maxHeight) {
                newHeight = maxHeight;
                newWidth  = newHeight * sizeRatio;
            }

            resultCanvas.width  = newWidth;
            resultCanvas.height = newHeight;
            resultCanvas.getContext('2d').drawImage(imageCanvas, 0, 0, newWidth, newHeight);
        }

        return resultCanvas;
    };

    //// === EVENT HANDLERS ===
    this._resizeHandler = function () {
        //handler specially made to prevent constant redrawing on resize and prevent flickering on fast computers / browsers

        this._canvas.drawing.lastWindowResizeTime = Date.now();

        if (!this._canvas.drawing.isResizeEventRunning) {
            this._canvas.drawing.isResizeEventRunning = true;

            setTimeout(this._resizeEventProcess, 50);
        }
    }.bind(this);

    this._resizeEventProcess = function () {
        if (this._canvas.drawing.isResizeEventRunning && this._canvas.drawing.lastWindowResizeTime + 50 > Date.now()) {
            setTimeout(this._resizeEventProcess, 50);                                   //we are still waiting
            return;                                                                     //as we will call this function later we can close this right now
        }

        this._drawing_ClearCanvas();

        //applying (removing) some size changing styles
        this._canvas.element.style.boxSizing = "content-box";
        this._canvas.element.style.padding   = "0";

        //setting new canvas dimensions (we can do this even when editor is locked)
        this._canvas.width  = this._canvas.element.width  = this._canvas.element.offsetWidth;
        this._canvas.height = this._canvas.element.height = this._canvas.element.offsetHeight;

        //background image position recalculation
        if (this._defaults.background.image) {
            var canvasRatio = this._canvas.width / this._canvas.height;
            var imageRatio  = this._defaults.background.image.naturalWidth / this._defaults.background.image.naturalHeight;

            if (canvasRatio === imageRatio) {               //image same as canvas (fill whole canvas)
                this._defaults.background.imagePosition = {
                    x:      0,
                    y:      0,
                    width:  this._canvas.width,
                    height: this._canvas.height
                };
            }
            else if (canvasRatio > imageRatio) {            //image more more portrait than canvas (fill on Y, center on X)
                var centerX             = Math.round(this._canvas.width / 2);
                var dimensionMultiplier = this._canvas.height / this._defaults.background.image.naturalHeight;
                var halfBackground      = Math.floor((this._defaults.background.image.width * dimensionMultiplier) / 2);
    
                that._.workspace = {
                    x:      0,
                    leyft:  centerX - halfBackground,
                    width:  Math.floor(this._defaults.background.image.width * dimensionMultiplier),
                    height: this._canvas.height
                };
            }
            else {                                          //image more more landscape than canvas (fill on X, center on Y)
                var centerY             = Math.round(this._canvas.height / 2);
                var dimensionMultiplier = this._canvas.width / this._defaults.background.image.width;
                var halfBackground      = Math.floor((this._defaults.background.image.height * dimensionMultiplier) / 2);
    
                that._.workspace = {
                    x:      centerY - halfBackground,
                    y:      0,
                    width:  that._.canvasSize.width,
                    height: Math.floor(that._.images.workingImg.height * dimensionMultiplier)
                };
            }
        }

        //particles recalculation
        for (var i = 0; i < this._particles.length; i++) {
            this._particles[i].checkPosition(this._canvas.width, this._canvas.height);
        }

        this._canvas.element.style.visibility     = "visible";
        this._canvas.drawing.isResizeEventRunning = false;

        this._handleEvent('windowResized');
    }.bind(this);

    //keyboard, mouse & touch
    this._keyDownHandler = function (e) {
        if (this._kc(e))
            return;

        //DBG
        //this._requestFrame(this._process);
    }.bind(this);

    this._kc = function (kbEvent) {
        this._keyboard.queue.push(kbEvent.keyCode);
        
        if (this._keyboard.queue.length > 10)
        this._keyboard.queue.shift();

        if (this._keyboard.queue.toString() === "38,38,40,40,37,39,37,39,66,65") {
            //TODO Konami Code handling

            return true;
        }

        return false;
    }.bind(this);


    //constructor call
    return constructor.call(this, canvas, options);
};
superParticles.version = {
    major:    0,
    minor:    1,
    revision: 0,
    beta: false,
};


//Super Particles ERRORS
function TaintedImageError(message, innerError) {
    Error.call(this, message);

    this.name       = "TaintedImageError";
    this.innerError = innerError;
}
TaintedImageError.prototype = Object.create(Error.prototype);
TaintedImageError.prototype.toString = function () {
    return this.name + ': "' + this.message + '"';
}


// --- Useful Extensions ---
Math.sqr = function (x) {
    //Multiplying is much faster then Math.pow function
    return x * x;
};

Math.sqr3 = function (x) {
    return x * x * x;
};
