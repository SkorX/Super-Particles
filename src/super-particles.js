/* -----------------------------------------------
/* Author: Artur Zoremba (Skor_X) - skorx.ga
/* MIT license: http://opensource.org/licenses/MIT
/* GitHub: https://github.com/SkorX/Super-Particles
/* Page: https://skorx.github.io/Super-Particles
/* v0.2.0
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

var SuperParticles = function (canvas, options) {
    "use strict";

    //init checks
    if (!(this instanceof SuperParticles))
        throw new Error("SuperParticles have to be executed as a class. Use new keyword.");

    if (!(canvas instanceof HTMLCanvasElement))
        throw new Error("Passed canvas element have to be HTMLCanvasElement.");

    if (typeof options !== "object")
        throw new Error("Options are not valid object element.");

    //// === PRIVATE VARIABLES ===
    this._initialized = false;

    //defaults
    this._settings = {
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
            },

            smoothImages: false,
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
        if (this._settings.background.image) {
            var canvasRatio = this._canvas.width / this._canvas.height;
            var imageRatio  = this._settings.background.image.naturalWidth / this._settings.background.image.naturalHeight;

            if (canvasRatio === imageRatio) {               //image same as canvas (fill whole canvas)
                this._settings.background.imagePosition = {
                    x:      0,
                    y:      0,
                    width:  this._canvas.width,
                    height: this._canvas.height
                };
            }
            else if (canvasRatio > imageRatio) {            //image more more portrait than canvas (fill on Y, center on X)
                var centerX             = Math.round(this._canvas.width / 2);
                var dimensionMultiplier = this._canvas.height / this._settings.background.image.naturalHeight;
                var halfBackground      = Math.floor((this._settings.background.image.width * dimensionMultiplier) / 2);
                
                that._.workspace = {
                    x:      0,
                    leyft:  centerX - halfBackground,
                    width:  Math.floor(this._settings.background.image.width * dimensionMultiplier),
                    height: this._canvas.height
                };
            }
            else {                                          //image more more landscape than canvas (fill on X, center on Y)
                var centerY             = Math.round(this._canvas.height / 2);
                var dimensionMultiplier = this._canvas.width / this._settings.background.image.width;
                var halfBackground      = Math.floor((this._settings.background.image.height * dimensionMultiplier) / 2);
    
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
    
    
    //// === CONSTRUCTOR ===
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
SuperParticles.version = {
    major:    0,
    minor:    2,
    revision: 0,
    beta:  true,
};

//// === PUBLIC METHODS ===
//particles
SuperParticles.prototype.addParticle = function (particle) {
    if (!(particle instanceof SuperParticle))
        throw new Error("Particle have to be a SuperParticle instance.");

    //adding particle to collection
    this._particles.push(particle);

    return this;
};

SuperParticles.prototype.removeParticle = function (particle) {
    if (particle === true) {
        //removing last particle
        this._particles.pop();

        return this;
    }
    else if (particle instanceof SuperParticle) {
        //removing specified particle
        var index = this._particles.indexOf(particle);
        if (index !== -1)
            this._particles.splice(index, 1);
        
        return this;
    }

    throw new Error("Particle have to be a SuperParticle instance.");
};

//events
SuperParticles.prototype.addEventListener = function (event, callback) {
    if (typeof event !== 'string' || typeof callback !== 'function')
        return this;

    if (!event.startsWith('_') && event in this._callbacks) {
        this._callbacks[event].push(callback);
    }

    return this;
};

SuperParticles.prototype.removeEventListener = function (event, callback) {
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
SuperParticles.prototype.startDrawing = function () {
    if (!this._canvas.drawing.stop || !this._initialized)       //preventing animation, if drawing loop is running or engine is not initialized
        return this;

    this._canvas.drawing.stop = false;
    this._diagData.startTime = Date.now();
    this._requestFrame(this._process);

    return this;
};

SuperParticles.prototype.stopDrawing = function () {
    this._canvas.drawing.stop = true;

    return this;
};

//image export
SuperParticles.prototype.getScreenshotData = function (callback, format, encoderOptions) {          //callback (imageData: base64 string | false)
    if (!this._initialized) {
        this._execCallback(callback, [false]);
        return that;
    }

    var imgData = this._canvas.element.toDataURL(format, encoderOptions);
    this._execCallback(callback, [imgData]);

    return that;
};

SuperParticles.prototype.getScreenshot = function (callback) {                                      //callback (image: HTMLImageElement | false)
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
SuperParticles.prototype._loadOptions = function (options) {
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
SuperParticles.prototype._handleEvent = function (eventName, argArray, disableInner, disablePublic) {
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

SuperParticles.prototype._execCallback = function (callback, args) {
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
SuperParticles.prototype._requestFrame = function (callback) {
    if (window.requestAnimationFrame)               window.requestAnimationFrame(callback.bind(this));
    else if (window.mozRequestAnimationFrame)       window.mozRequestAnimationFrame(callback.bind(this));
    else if (window.webkitRequestAnimationFrame)    window.webkitRequestAnimationFrame(callback.bind(this));
    else if (window.oRequestAnimationFrame)         window.oRequestAnimationFrame(callback.bind(this));
    else if (window.msRequestAnimationFrame)        window.msRequestAnimationFrame(callback.bind(this));
    else
        throw new Error("Can't redraw canvas, because browser do not support any requestAnimationFrame method.");
};

SuperParticles.prototype._process = function () {
    if (this._canvas.drawing.stop)          //preventing particles processing when animation should be stopped
        return;

    this._particlesCount = this._particles.length;

    //logic / particles processing
    for (var i = 0; i < this._particlesCount; i++) {
        //particles interactions
        for (var j = i + 1; j < this._particlesCount; j++) {
            //attration
            this._particles[i].attractTo(this._particles[j]);
        }

        this._particles[i].checkPosition(this._canvas.width, this._canvas.height);
        this._particles[i].update();
    }

    this._drawing_Redraw();
    this._drawing_Diagnostic();

    //request next animation frame
    this._requestFrame(this._process);
};

SuperParticles.prototype._drawing_Redraw = function () {
    if (this._canvas.drawing.limitTo30FPS && this._diagData.frame % 2 != 0)
        return;

    //clear canvas / draw canvas background
    this._drawing_ClearCanvas();

    for (var i = 0; i < this._particlesCount; i++) {
        //line linking
        if (this._settings.linking.enabled) {
            var maxDistanceSqr = Math.sqr(this._settings.linking.max_distance);

            for (var j = i + 1; j < this._particlesCount; j++) {
                var distanceSqr =
                    Math.sqr(this._particles[i]._position.x - this._particles[j]._position.x) +
                    Math.sqr(this._particles[i]._position.y - this._particles[j]._position.y);

                if (distanceSqr <= maxDistanceSqr) {
                    this._canvas.ctx.save();
                    
                    this._canvas.ctx.beginPath();
                    this._canvas.ctx.moveTo(this._particles[i]._position.x, this._particles[i]._position.y);
                    this._canvas.ctx.lineTo(this._particles[j]._position.x, this._particles[j]._position.y);
                    this._canvas.ctx.lineWidth   = this._settings.linking.width;
                    this._canvas.ctx.strokeStyle = this._settings.linking.color;
                    this._canvas.ctx.globalAlpha = this._settings.linking.opacity * (1 - distanceSqr / maxDistanceSqr);
                    this._canvas.ctx.stroke();

                    this._canvas.ctx.restore();
                }
            }
        }

        //particle drawing
        this._canvas.ctx.save();
        this._particles[i].draw(this._canvas.ctx, this._settings.particles.smoothImages);
        this._canvas.ctx.restore();
    }
};

SuperParticles.prototype._drawing_ClearCanvas = function () {
    this._canvas.ctx.save();

    if (this._settings.background.color) {
        this._canvas.ctx.fillStyle             = this._settings.background.color;
        this._canvas.ctx.globalAlpha           = 1.0;
        this._canvas.ctx.imageSmoothingEnabled = false;
        this._canvas.ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
    }
    else {
        this._canvas.ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }

    if (this._settings.background.image) {
        this._canvas.ctx.drawImage(
            this._settings.background.image,
            this._settings.background.imagePosition.x,
            this._settings.background.imagePosition.y,
            this._settings.background.imagePosition.width,
            this._settings.background.imagePosition.height);
    }

    this._canvas.ctx.restore();
};

SuperParticles.prototype._drawing_Diagnostic = function () {
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
