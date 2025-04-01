/* -----------------------------------------------
/* Author: Artur Zoremba (Skor_X) - skorx.ga
/* MIT license: http://opensource.org/licenses/MIT
/* GitHub: https://github.com/SkorX/Super-Particles
/* Page: https://skorx.github.io/Super-Particles
/* v0.2.0
/* ----------------------------------------------- */

// --- OPTIONS EXPLANATION (with default values) (do not uncomment this code, preview only) ---
// {
//     particles: {
//         count:                   0,              (number, (0 <= val))
//
//         shapeType:               "none",         (string, ("none" | "circle" | "square"))
//         shapeSize:               25,             (number, (0 <= val))
//         shapeColor:              "#FFFFFF",      (string, [#colorString])
//
//         strokeWidth:             0,              (number, (0 <= val))
//         strokeColor:             "#000000",      (string, [#colorString])
//
//         image:                   undefined,      (undefined | HTMLImageElement)
//         imageSize:               15,             (number, (0 <= val))
//         imageOpacity:            1,              (number, (0 <= val <= 1))
//
//         speed:                   8,              (number, (0 <= val))
//         min_speed:               undefined,      (undefined | number, number: (0 < val < speed)
//         bouncing:                true,           (boolean)
//         collisionSlowdown:       false,          (boolean)
//          
//         direction:               undefined,      (undefined | string, string: ("top" | "bottom" | "left" | "right" | "topleft" ...))
//         vx:                      undefined,      (undefined | number, number: (-1 <= val <= 1))
//         vy:                      undefined,      (undefined | number, number: (-1 <= val <= 1))
//         vx_min:                  undefined,      (undefined | number, number: (-1 <= val < vx))
//         vy_min:                  undefined,      (undefined | number, number: (-1 <= val < vy))
//
//         opacity:                 1,              (number, (0 < val <= 1))
//     }
//     linking: {
//         enabled:                 true,           (boolean)
//         max_distance:            150,            (number, (0 < val))
//         color:                   "#FFFFFF",      (string, [#colorString])
//         width:                   1.5,            (number, (0 < val))
//         opacity:                 0.6,            (number, (0 < val <= 1))
//     }
//     attraction: {
//         enabled:                 true            (boolean)
//         force:                   500,            (number)
//     }
//
//     smoothImages:                false,          (boolean)
//
//     background: {
//         color:                   undefined,      (undefined | string, string: [#colorString])
//         image:                   undefined,      (undefined | HTMLImageElement)
//     }
//
//     limit30FPS:                  false,          (boolean)
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

                    direction: undefined,       //undefined (no direction) or "top" | "bottom" | "left" | "right" | "topleft" | "topright" | "bottomleft" | "bottomright"
                    vx:        undefined,       //initial X velocity in range <-1;1> (undefined = random)
                    vy:        undefined,       //initial Y velocity in range <-1;1> (undefined = random)
                    vx_min:    undefined,       //minimal X velocity in range <-1;1> (work only when vx is not undefined)
                    vy_min:    undefined,       //minimal Y velocity in range <-1;1> (work only when vy is not undefined)
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

            _imagePosition: {
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
                this._settings.background._imagePosition = {
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
                
                this._settings.background._imagePosition = {
                    x:      0,
                    y:  centerX - halfBackground,
                    width:  Math.floor(this._settings.background.image.width * dimensionMultiplier),
                    height: this._canvas.height
                };
            }
            else {                                          //image more more landscape than canvas (fill on X, center on Y)
                var centerY             = Math.round(this._canvas.height / 2);
                var dimensionMultiplier = this._canvas.width / this._settings.background.image.width;
                var halfBackground      = Math.floor((this._settings.background.image.height * dimensionMultiplier) / 2);
    
                this._settings.background._imagePosition = {
                    x:      centerY - halfBackground,
                    y:      0,
                    width:  this._canvas.width,
                    height: Math.floor(this._settings.background.image.height * dimensionMultiplier)
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
SuperParticles.prototype.addParticle = function (particle, position) {
    if (!(particle instanceof SuperParticle))
        throw new Error("Particle have to be a SuperParticle instance.");

    if (typeof position === "number") {
        //adding particle at specific position in collection
        this._particles.splice(position, 0, particle);
    } else {
        //adding particle at the end of collection
        this._particles.push(particle);
    }

    //updating particles count
    this._particlesCount = this._particles.length;
    return this;
};

SuperParticles.prototype.removeParticle = function (particle) {
    if (particle === true) {
        //removing last particle
        this._particles.pop();

        //updating particles count
        this._particlesCount = this._particles.length;
        return this;
    }
    else if (particle instanceof SuperParticle) {
        //removing specified particle
        var index = this._particles.indexOf(particle);
        if (index !== -1)
            this._particles.splice(index, 1);
        
        //updating particles count
        this._particlesCount = this._particles.length;
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
    if (typeof options !== 'object')
        return false;

    var previousState = this._engineState();

    //particles
    if (typeof options.particles === "object") {
        //count
        if ('count'             in options.particles && isFinite(options.particles.count)) {
            if (options.particles.count >= 0)
                this._settings.particles.count = options.particles.count;
        }

        //shape & stroke
        if ('shapeType'         in options.particles && typeof options.particles.shapeType === "string") {
            switch (options.particles.shapeType) {
                case "circle":
                    this._settings.particles.properties.shape.type = "circle";
                    break;

                case "square":
                    this._settings.particles.properties.shape.type = "square";
                    break;

                case "none":
                default:
                    this._settings.particles.properties.shape.type = undefined;
            }
        }

        if ('shapeSize'         in options.particles && isFinite(options.particles.shapeSize)) {
            if (options.particles.shapeSize >= 0)
                this._settings.particles.properties.shape.size = options.particles.shapeSize;
        }

        if ('shapeColor'        in options.particles && typeof options.particles.shapeColor === "string")
            this._settings.particles.properties.shape.color = options.particles.shapeColor;

        if ('strokeWidth'       in options.particles && isFinite(options.particles.strokeWidth)) {
            if (options.particles.strokeWidth >= 0)
                this._settings.particles.properties.shape.stroke.width = options.particles.strokeWidth;
        }

        if ('strokeColor'       in options.particles && typeof options.particles.strokeColor === "string")
            this._settings.particles.properties.shape.stroke.color = options.particles.strokeColor;

        //image
        if ('image'             in options.particles) {
            if (options.particles.image instanceof HTMLImageElement) {
                try {
                    var image = Images.getCanvasForImage(options.particles.image);
                    this._settings.particles.properties.image.data = image;
                }
                catch (e) {
                    //broken image :|
                    console.log("Particle image is unusable. Image won't be stored.");
                }
            }
            else if (!options.particles.image) {
                this._settings.particles.properties.image.data = undefined;
            }
        }

        if ('imageSize'         in options.particles && isFinite(options.particles.imageSize)) {
            if (options.particles.imageSize >= 0)
                this._settings.particles.properties.image.size = options.particles.imageSize;
        }

        if ('imageOpacity'      in options.particles && isFinite(options.particles.imageOpacity)) {
            if (options.particles.imageOpacity >= 0 && options.particles.imageOpacity <= 1)
                this._settings.particles.properties.image.opacity = options.particles.imageOpacity;
        }

        //motion
        if ('speed'             in options.particles && isFinite(options.particles.speed)) {
            if (options.particles.speed >= 0) {
                this._settings.particles.properties.motion.speed = options.particles.speed;

                if (this._settings.particles.properties.motion.min_speed >= this._settings.particles.properties.motion.speed)
                    this._settings.particles.properties.motion.min_speed = undefined;
            }
        }

        if ('min_speed'         in options.particles && isFinite(options.particles.min_speed)) {
            if (options.particles.min_speed >= 0 && options.particles.min_speed < this._settings.particles.properties.motion.speed)
                this._settings.particles.properties.motion.min_speed = options.particles.min_speed;
        }

        if ('bouncing'          in options.particles && typeof options.particles.bouncing === "boolean")
            this._settings.particles.properties.motion.bouncing = options.particles.bouncing;

        if ('collisionSlowdown' in options.particles && typeof options.particles.collisionSlowdown === "boolean")
            this._settings.particles.properties.motion.slowDownOnCollision = options.particles.collisionSlowdown;

        if ('direction'         in options.particles) {
            if (typeof options.particles.direction === "string") {
                switch (options.particles.direction) {
                    case "top":
                    case "bottom":
                    case "left":
                    case "right":
                    case "topleft":
                    case "topright":
                    case "bottomleft":
                    case "bottomright":
                        this._settings.particles.properties.motion.direction = options.particles.direction;
                        break;

                    case "none":
                        this._settings.particles.properties.motion.direction = undefined;
                        break;
                }
            }
            else if (typeof options.particles.direction === "undefined") {
                this._settings.particles.properties.motion.direction = undefined;
            }
        }

        if ('vx'                in options.particles && isFinite(options.particles.vx)) {
            if (options.particles.vx >= -1 && options.particles.vx <= 1) {
                this._settings.particles.properties.motion.vx = options.particles.vx;

                if (this._settings.particles.properties.motion.vx_min >= options.particles.vx)
                    this._settings.particles.properties.motion.vx_min = undefined;
            }
        }

        if ('vy'                in options.particles && isFinite(options.particles.vy)) {
            if (options.particles.vy >= -1 && options.particles.vy <= 1) {
                this._settings.particles.properties.motion.vy = options.particles.vy;

                if (this._settings.particles.properties.motion.vy_min >= options.particles.vy)
                    this._settings.particles.properties.motion.vy_min = undefined;
            }
        }

        if ('vx_min'            in options.particles && isFinite(options.particles.vx_min)) {
            if (options.particles.vx_min >= -1 && options.particles.vx_min < this._settings.particles.properties.motion.vx)
                this._settings.particles.properties.motion.vx_min = options.particles.vx_min;
        }

        if ('vy_min'            in options.particles && isFinite(options.particles.vy_min)) {
            if (options.particles.vy_min >= -1 && options.particles.vy_min < this._settings.particles.properties.motion.vx)
                this._settings.particles.properties.motion.vy_min = options.particles.vy_min;
        }

        if ('opacity'           in options.particles && isFinite(options.particles.opacity)) {
            if (options.particles.opacity > 0 && options.particles.opacity <= 1)
                this._settings.particles.properties.opacity.value = options.particles.opacity;
        }
    }

    //linking
    if (typeof options.linking === "object") {
        if ('enabled'       in options.linking && typeof options.linking.enabled === "boolean")
            this._settings.linking.enabled = options.linking.enabled;

        if ('max_distance'  in options.linking && isFinite(options.linking.max_distance)) {
            if (options.linking.max_distance > 0)
                this._settings.linking.max_distance = options.linking.max_distance;
        }

        if ('color'         in options.linking && typeof options.linking.color === "string")
            this._settings.linking.color = options.linking.color;

        if ('width'         in options.linking && isFinite(options.linking.width)) {
            if (options.linking.width > 0)
                this._settings.linking.width = options.linking.width;
        }

        if ('opacity'       in options.linking && isFinite(options.linking.opacity)) {
            if (options.linking.opacity > 0 && options.linking.opacity <= 1)
                this._settings.linking.opacity = options.linking.opacity;
        }
    }

    //attraction
    if (typeof options.attraction === "object") {
        if ('enabled'   in options.attraction && typeof options.attraction.enabled === "boolean")
            this._settings.attraction.enabled = options.attraction.enabled;

        if ('force'     in options.attraction && isFinite(options.attraction.force))
            this._settings.attraction.force = options.attraction.force;
    }

    //smoothing
    if ('smoothImages'  in options && typeof options.smoothImages === "boolean")
        this._settings.particles.smoothImages = options.smoothImages;

    //background
    if (typeof options.background === "object") {
        if ('color'     in options.background) {
            if (typeof options.background.color === "string")
                this._settings.background.color = options.background.color;
            else if (!options.background.color)
                this._settings.background.color = undefined;
        }

        if ('image'     in options.background) {
            if (options.background.image instanceof HTMLImageElement) {
                try {
                    var image = Images.getCanvasForImage(options.background.image);
                    this._settings.background.image = image;
                }
                catch (e) {
                    //broken image :|
                    console.log("Background image is unusable. Image won't be stored.");
                }
            }
            else if (!options.background.image) {
                this._settings.background.image = undefined;
            }
        }
    }

    //FPS limiting
    if ('limit30FPS'    in options && typeof options.limit30FPS === "boolean")
        this._canvas.drawing.limitTo30FPS = options.limit30FPS;

    this._updateParticles(previousState, this._engineState());
    return true;
};

SuperParticles.prototype._updateParticles = function (prevState, currentState) {
    var countDiff = currentState.particles.count - prevState.particles.count;
    var engineParticles = this._getEngineGeneratedParticles();

    if (countDiff > 0) {
        //adding new particles
        while (countDiff--) {
            this.addParticle(this._generateParticle());
        }
    }
    else if (countDiff < 0) {
        //removing last engine particles (by diff)
        countDiff = Math.abs(countDiff);    //we need positive value ;)
        var particlesToRemove = engineParticles.splice(engineParticles.length - countDiff, countDiff);

        for (var i = 0; i < particlesToRemove.length; i++) {
            this.removeParticle(particlesToRemove[i]);
        }
    }

    //TODO update current engineParticles
};

//particles list / genetation / etc.
SuperParticles.prototype._getEngineGeneratedParticles = function () {
    var result = [];
    var count = this._particles.length;

    for (var i = 0; i < count; i++) {
        if (typeof this._particles[i].tag === "undefined")
            result.push(this._particles[i]);
    }

    return result;
};

SuperParticles.prototype._generateParticle = function () {
    //TODO 
};

//state
SuperParticles.prototype._engineState = function () {
    var particlesImage, backgroundImage;

    //praparing data which may be undefined
    if (this._settings.particles.properties.image.data)
        particlesImage = this._settings.particles.properties.image.data.toDataURL();
        
    if (this._settings.background.image)
        backgroundImage = this._settings.background.image.toDataURL();

    //generating engine state
    return JSON.parse(JSON.stringify({
        particles: {
            count: this._settings.particles.count,
            shape: this._settings.particles.properties.shape,
            image: {
                data: particlesImage,
                size: this._settings.particles.properties.image.size,
                opacity: this._settings.particles.properties.image.opacity,
            },
            motion: this._settings.particles.properties.motion,
            opacity: this._settings.particles.properties.opacity,
            smoothImages: this._settings.particles.smoothImages,
        },
        linking: this._settings.linking,
        attraction: this._settings.attraction,
        background: {
            color: this._settings.background.color,
            image: backgroundImage,
        },

        drawing: {
            stop: this._canvas.drawing.stop,
            limitTo30FPS: this._canvas.drawing.limitTo30FPS,
        },

        frame: this._diagData.frame,
    }));
};

SuperParticles.prototype._particlesState = function () {
    var particlesState = [];

    for (var i = 0; i < this._particles.length; i++) {
        particlesState.push(this._particles[i].getState());
    }
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
            this._settings.background._imagePosition.x,
            this._settings.background._imagePosition.y,
            this._settings.background._imagePosition.width,
            this._settings.background._imagePosition.height);
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
