/* -----------------------------------------------
/* Author: Artur Zoremba (Skor_X) - skorx.ga
/* MIT license: http://opensource.org/licenses/MIT
/* GitHub: https://github.com/SkorX/Super-Particles
/* Page: https://skorx.github.io/Super-Particles
/* v0.2.0
/* ----------------------------------------------- */

// --- OPTIONS EXPLANATION (with default values) (do not uncomment this code, preview only) ---
// SuperParticles options:
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

// Single particle options:
// {
//     x:                      undefined,          (number)
//     y:                      undefined,          (number)
//
//     vx:                     undefined,          (number)
//     vy:                     undefined,          (number)
//
//     gravityForce:           0,                  (number)
//
//     apperance: {
//         shapeType:          undefined,          (string, ("none" | "circle" | "square"))
//         shapeSize:          0,                  (number, (0 <= val))
//         shapeColor:         undefined           (string, [#colorString])
//
//         strokeWidth:        0,                  (number, (0 <= val))
//         strokeColor:        undefined,          (string, [#colorString])
//
//         image:              undefined,          (undefined | HTMLImageElement)
//         imageSize:          0,                  (number, (0 <= val))
//         imageOpacity:       1,                  (number, (0 <= val <= 1))
//
//         opacity:            1,                  (number, (0 < val <= 1))
//     }
//     behavior: {
//         bounce:             true,               (boolean)
//         collisionSlowdown:  false,              (boolean)
//     }
// }

var Images = {
    /**
     * Converts image of any type (canvas, image, video) into canvas. If image is canvas, it will be copied.
     * 
     * @param {(HTMLCanvasElement|HTMLImageElement|HTMLVideoElement)} image - Image to convert.
     * @returns {HTMLCanvasElement} Canvas created for provided image.
     */
    getCanvasForImage: function (image) {
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

        try {
            resultCanvasCtx.getImageData(0, 0, 1, 1);
        }
        catch (e) {
            if (e.name === "SecurityError")
                throw new TaintedImageError("Loaded image causes security errors. Load image from the same domain or allow for cross-origin data.");
        }

        return resultCanvas;
    },

    /**
     * Converts image into another type of image and executes callback when finished.
     * 
     * @param {(HTMLCanvasElement|HTMLImageElement|HTMLVideoElement)} image - Image to convert.
     * @param {function} targetType - Target type of image to convert to.
     * @param {function} callback - Callback with result of image conversion.
     */
    convertImage: function (image, targetType, callback) {
        if (!(image instanceof HTMLCanvasElement) &&
            !(image instanceof HTMLImageElement)  &&
            !(image instanceof HTMLVideoElement))
            throw new Error("Can't convert image, because it is in wrong format.");

        if (targetType !== HTMLCanvasElement &&
            targetType !== HTMLImageElement &&
            targetType !== Image)
            throw new Error("Can't convert image, because targetType is incorrect.");

        var moveCanvas = Images.getCanvasForImage(image);

        if (targetType === HTMLCanvasElement) {
            setTimeout(function () { callback.call(this, moveCanvas); }.bind(Images));
        }
        else if (targetType === HTMLImageElement || targetType === Image) {
            var newImg = new Image(moveCanvas.width, moveCanvas.height);
            newImg.onload = function () {
                callback.call(Images, newImg);
            }.bind(this);
            newImg.onerror = function () {
                throw new Error("While converting an image to HTMLImageElement, error has occured.");
            };
            newImg.src = moveCanvas.toDataURL();
        }

        return Images;
    },

    /**
     * Scales down canvas image to target maximal size.
     * 
     * @param {HTMLCanvasElement} imageCanvas - Canvas to resize.
     * @param {number} maxWidth - Target max width of new image.
     * @param {number} maxHeight - Target max height of new image.
     */
    getScaledDownImage: function (imageCanvas, maxWidth, maxHeight) {
        if (typeof imageCanvas === "undefined" || !(imageCanvas instanceof HTMLCanvasElement))
            return false;

        var resultCanvas = Images.getCanvasForImage(imageCanvas);

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
            resultCanvas
                .getContext('2d')
                .drawImage(imageCanvas, 0, 0, newWidth, newHeight);
        }

        return resultCanvas;
    },

    /**
     * Scales up or down image to target size or width (height will be calculated by aspect ratio).
     * 
     * @param {HTMLCanvasElement} imageCanvas - Canvas to resize.
     * @param {number} width - Target width of rescaled image.
     * @param {number} [height] - Target height of rescaled image (or undefined to keep aspect ratio).
     */
    getScaledImage: function (imageCanvas, width, height) {
        if (typeof imageCanvas === "undefined" || !(imageCanvas instanceof HTMLCanvasElement))
            return false;

        if (!isFinite(width))
            return Images.getCanvasForImage(imageCanvas);

        var resultCanvas    = document.createElement("canvas");

                resultCanvas.width = width;
        if (!isFinite(height)) {
            var ratio = imageCanvas.height / imageCanvas.width;
            resultCanvas.height = width * ratio;
        }       
        else {
            resultCanvas.height = height;
        }

        resultCanvas
            .getContext('2d')
            .drawImage(imageCanvas, 0, 0, resultCanvas.width, resultCanvas.height);

        return resultCanvas;
    }
};

function TaintedImageError(message, innerError) {
    Error.call(this, message);

    this.name       = "TaintedImageError";
    this.innerError = innerError;
}
TaintedImageError.prototype = Object.create(Error.prototype);
TaintedImageError.prototype.toString = function () {
    return this.name + ': "' + this.message + '"';
}

/**
 * Returns random number in [min; max) range.
 * 
 * @param {number} min - Minimal value.
 * @param {number} max - Maximal value.
 */
Math.rand = function (min, max) {
    return (Math.random() * (max - min)) + min;
};

/**
 * Returns random integer number in [min; max] range.
 * 
 * @param {number} min - Minimal value.
 * @param {number} max - Maximal value.
 */
Math.randInt = function (min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns the square of the number.
 * 
 * @param {number} x - Value whose square is computed.
 */
Math.sqr = function (x) {
    return x * x;
};

/**
 * Returns the cubic of the number.
 * 
 * @param {number} x - Value whose cubic is computed.
 */
Math.cub = function (x) {
    return x * x * x;
};

var SuperParticle = function (tag, options) {
    "use strict";

    if (!(this instanceof SuperParticle))
        throw new Error("SuperParticle have to be executed as a class. Use new keyword.");

    if (typeof options !== "object")
        throw new Error("Options are not valid object element.");

    this._position = {              
        x: undefined,
        y: undefined,
    };

    this._movement = {              
        vx: undefined,
        vy: undefined,

        initialSpeedSqr: undefined, 
    };

    this._gravity = {
        force: 0,                   
    };

    this._apperance = {
        shape: {
            type:  undefined,       
            size:  0,
            color: undefined,
            stroke: {
                width: 0,
                color: undefined,
            }
        },
        image: {
            sourceData: undefined,  
            data:       undefined,  
            size:       0,
            opacity:    1,
        },
        opacity: {
            value: 1,

            alternation: {
                speed:     0,       
                min_value: 0,
            }
        },

        _size: 0,
    };

    this._behavior = {
        bounce:              true,
        slowdownOnCollision: false,
    };

    this.tag = undefined;

    if (typeof tag !== "string")
        throw new Error("Tag have to be a valid string.");

    this.tag = tag;
    this._loadOptions(options);

    return this;
};

SuperParticle.prototype.getState = function () {
    return JSON.parse(JSON.stringify({
        position: this._position,
        movement: this._movement,
        gravity: this._gravity,
        apperance: {
            shape: this._apperance.shape,
            image: {
                data: this._apperance.image.sourceData.toDataURL(),
                size: this._apperance.image.size,
                opacity: this._apperance.image.opacity,
            },
            opacity: this._apperance.opacity,
        },
        size: this._apperance._size,
        behavior: this._behavior,

        tag: this.tag,
    }));
};

SuperParticle.prototype.size = function () {
    return this._apperance._size;
};

SuperParticle.prototype.setSpeed = function (targetSpeed) {
    if (!isFinite(targetSpeed))
        throw new Error("Speed have to be finite number.");

    var currentSpeed = Math.sqrt(Math.sqr(this._movement.vx) + Math.sqr(this._movement.vy));
    var divider = currentSpeed / targetSpeed;

    this._movement.vx /= divider;
    this._movement.vy /= divider;

    this._movement.initialSpeedSqr = Math.sqr(targetSpeed);

    return this;
};

SuperParticle.prototype.resetSpeed = function () {
    var currentSpeedSqr = Math.sqr(this._movement.vx) + Math.sqr(this._movement.vy);

    var divider = Math.sqrt(currentSpeedSqr / this._movement.initialSpeedSqr);

    this._movement.vx /= divider;
    this._movement.vy /= divider;

    return this;
};

SuperParticle.prototype.applyForce = function (vx, vy, changeInitialSpeed) {
    changeInitialSpeed = (typeof changeInitialSpeed === "boolean") ? changeInitialSpeed : false;

    if (isFinite(vx) && isFinite(vy)) {
        this._movement.vx += vx;
        this._movement.vy += vy;

                if (changeInitialSpeed)
            this._movement.initialSpeedSqr = Math.sqr(this._movement.vx) + Math.sqr(this._movement.vy);
    }

    return this;
};

SuperParticle.prototype.attractTo = function (other) {
    if (this._gravity.force == 0 || other._gravity.force == 0)
        return this;

    if (this._position.x === other._position.x &&
        this._position.y === other._position.y)
        return this;

    var distanceSqr =
        Math.sqr(this._position.x - other._position.x) +
        Math.sqr(this._position.y - other._position.y);

    if (distanceSqr > Math.SQRT2 && isFinite(distanceSqr)) {
        var gravityForce = Math.abs(this._gravity.force * other._gravity.force) / distanceSqr;

        if (gravityForce <= 0)
            gravityForce = 0.01;

        if (gravityForce < 0.01 || gravityForce > 10)       
            return this;

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

SuperParticle.prototype.update = function () {
    this._position.x += this._movement.vx;
    this._position.y += this._movement.vy;

    return this;
};

SuperParticle.prototype.checkPosition = function (canvasWidth, canvasHeight) {
    if (!isFinite(canvasWidth) || !isFinite(canvasHeight))
        return this;

    var collision = false;
    var size = this.size();
    var radius = size / 2;

    if (this._behavior.bounce) {
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

    if (collision && this._behavior.slowdownOnCollision)
        this.resetSpeed();

    return this;
};

SuperParticle.prototype.draw = function (canvasContext, enableImageSmoothing) {
    if (this._apperance.shape.type !== undefined &&
        this._apperance.shape.size && this._apperance.shape.color) {

        canvasContext.beginPath();

        if (this._apperance.shape.type === "circle") {
            canvasContext.arc(
                this._position.x,
                this._position.y,
                this._apperance.shape.size / 2,
                0,
                2 * Math.PI);
        }
        else {
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

        if (this._apperance.shape.stroke.width && this._apperance.shape.stroke.color) {
            canvasContext.lineWidth = this._apperance.shape.stroke.width;
            canvasContext.strokeStyle = this._apperance.shape.stroke.color;
            canvasContext.stroke();
        }
    }

    if (this._apperance.image.data !== undefined &&
        this._apperance.image.size && this._apperance.image.opacity) {

        var ratio = this._apperance.image.data.height / this._apperance.image.data.width;
        var targetHeight = this._apperance.image.size * ratio;

        var centerPosAdjX = this._apperance.image.size / 2;
        var centerPosAdjY = targetHeight / 2;

                canvasContext.beginPath();
        canvasContext.globalAlpha = this._apperance.image.opacity;
        canvasContext.imageSmoothingEnabled = (typeof enableImageSmoothing === "boolean") ? enableImageSmoothing : false;

        canvasContext.drawImage(
            this._apperance.image.data,
            this._position.x - centerPosAdjX,
            this._position.y - centerPosAdjY,
            this._apperance.image.size,
            targetHeight);
    }

    return this;
};

SuperParticle.prototype._loadOptions = function (options) {
    if (typeof options !== 'object')
        return false;

    if ('x'             in options && isFinite(options.x))
        this._position.x = options.x;

    if ('y'             in options && isFinite(options.y))
        this._position.y = options.y;

    if ('vx'            in options && isFinite(options.vx)) {
        this._movement.vx = options.vx;
        this._movement.initialSpeedSqr = Math.sqr(this._movement.vx) + Math.sqr(this._movement.vy);
    }

    if ('vy'            in options && isFinite(options.vy)) {
        this._movement.vy = options.vy;
        this._movement.initialSpeedSqr = Math.sqr(this._movement.vx) + Math.sqr(this._movement.vy);
    }

    if ('gravityForce'  in options && isFinite(options.gravityForce))
        this._gravity.force = options.gravityForce;

    if (typeof options.apperance === "object") {
        if ('shapeType'     in options.apperance) {
            if (options.apperance.shapeType === "circle" || options.apperance.shapeType === "square")
                this._apperance.shape.type = options.apperance.shapeType;
            else if (options.apperance.shapeType === "none")
                this._apperance.shape.type = undefined;
        }

        if ('shapeSize'     in options.apperance && isFinite(options.apperance.shapeSize)) {
            if (options.apperance.shapeSize >= 0) {
                this._apperance.shape.size = options.apperance.shapeSize;
                this._recalculateSize();
            }
        }

        if ('shapeColor'    in options.apperance && typeof options.apperance.shapeColor === "string")
            this._apperance.shape.color = options.apperance.shapeColor;

        if ('strokeWidth'   in options.apperance && isFinite(options.apperance.strokeWidth)) {
            if (options.apperance.strokeWidth >= 0) {
                this._apperance.shape.stroke.width = options.apperance.strokeWidth;
                this._recalculateSize();
            }
        }

        if ('strokeColor'   in options.apperance && typeof options.apperance.strokeColor === "string")
            this._apperance.shape.stroke.color = options.apperance.strokeColor;

        if ('image'         in options.apperance && options.apperance.image instanceof HTMLImageElement) {
            try {
                var image = Images.getCanvasForImage(options.apperance.image);
                this._apperance.image.sourceData = image;

                if (this._apperance.image.size)
                    this._apperance.image.data = Images.getScaledImage(image, this._apperance.image.size);
            }
            catch (e) {
                console.log("Particle image is unusable. Image won't be loaded.");
            }
        }

        if ('imageSize'     in options.apperance && isFinite(options.apperance.imageSize)) {
            if (options.apperance.imageSize >= 0) {
                this._apperance.image.size = options.apperance.imageSize;
                this._recalculateSize();

                if (this._apperance.image.sourceData)
                    this._apperance.image.data = Images.getScaledImage(this._apperance.image.sourceData, this._apperance.image.size);
            }
        }

        if ('imageOpacity'  in options.apperance && isFinite(options.apperance.imageOpacity)) {
            if (options.apperance.imageOpacity >= 0 && options.apperance.imageOpacity <= 1)
                this._apperance.image.opacity = options.apperance.imageOpacity;
        }

        if ('opacity'       in options.apperance && isFinite(options.apperance.opacity))
            if (options.apperance.opacity > 0 && options.apperance.opacity <= 1)
                this._apperance.opacity.value = options.apperance.opacity;
    }

    if (typeof options.behavior === "object") {
        if ('bounce'            in options.behavior && typeof options.behavior.bounce === "boolean")
            this._behavior.bounce = options.behavior.bounce;

        if ('collisionSlowdown' in options.behavior && typeof options.behavior.collisionSlowdown === "boolean")
            this._behavior.slowdownOnCollision = options.behavior.collisionSlowdown;
    }

    return true;
};

SuperParticle.prototype._recalculateSize = function () {
    var shapeSize = (this._apperance.shape.type != undefined && this._apperance.shape.color) ?
        this._apperance.shape.size + this._apperance.shape.stroke.width : 0;

    var imgSize = (this._apperance.image.data != undefined && this._apperance.image.opacity) ?
        this._apperance.image.size : 0;

    return this._apperance._size = Math.max(shapeSize, imgSize);
};

SuperParticle.prototype._calculateDistance = function (p1, p2) {
    return Math.abs(
             Math.sqrt(
               Math.sqr(p1._position.x - p2._position.x) +
               Math.sqr(p1._position.y - p2._position.y)));
};

var SuperParticles = function (canvas, options) {
    "use strict";

    if (!(this instanceof SuperParticles))
        throw new Error("SuperParticles have to be executed as a class. Use new keyword.");

    if (!(canvas instanceof HTMLCanvasElement))
        throw new Error("Passed canvas element have to be HTMLCanvasElement.");

    if (typeof options !== "object")
        throw new Error("Options are not valid object element.");

    this._initialized = false;

    this._settings = {
        particles: {
            count: 0,

                    properties: {
                shape: {
                    type: "none",               
                    size: 25,                   
                    color: "#FFFFFF",

                    stroke: {
                        width: 0,
                        color: "#000000",
                    },
                },
                image: {
                    data:    undefined,         
                    size:    15,                
                    opacity: 1,
                },

                motion: {
                    speed:     8,               
                    min_speed: undefined,       

                    bouncing:            true,  
                    slowDownOnCollision: false, 

                    direction: undefined,       
                    vx:        undefined,       
                    vy:        undefined,       
                    vx_min:    undefined,       
                    vy_min:    undefined,       
                },

                opacity: {
                    value: 1,                   

                    alternation: {
                        enabled:   false,
                        speed:     1,           
                        min_value: 0,
                    }
                }
            },

            smoothImages: false,
        },

        linking: {
            enabled:      true,
            max_distance: 150,                  
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
            image: undefined,                   

            _imagePosition: {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
            }
        }

    };

    this._canvas = {
        element: undefined,
        ctx:     undefined,

        width:   0,
        height:  0,

        drawing: {
            stop:         true,             
            limitTo30FPS: false,

            isResizeEventRunning: false,
            lastWindowResizeTime: Date.now(),
        }
    };

    this._particlesCount = 0;
    this._particles = [];

    this._callbacks = {
        initialized:   [],
        windowResized: [],
        diagnostics:   [],

        _initialized:   undefined,
        _windowResized: undefined,
        _diagnostics:   undefined,
    };

    this._keyboard = {
        queue: [],
    }

    this._diagData = {
        fps:       0,           
        frame:     0,           
        count:     0,           
        startTime: Date.now(),  

        _times: [],             
    };


    this.onInitialized   = undefined;       
    this.onWindowResized = undefined;       
    this.onDiagnostics   = undefined;       


    this._resizeHandler = function () {
        this._canvas.drawing.lastWindowResizeTime = Date.now();

        if (!this._canvas.drawing.isResizeEventRunning) {
            this._canvas.drawing.isResizeEventRunning = true;

            setTimeout(this._resizeEventProcess, 50);
        }
    }.bind(this);

    this._resizeEventProcess = function () {
        if (this._canvas.drawing.isResizeEventRunning && this._canvas.drawing.lastWindowResizeTime + 50 > Date.now()) {
            setTimeout(this._resizeEventProcess, 50);                                   
            return;                                                                     
        }

        this._drawing_ClearCanvas();

        this._canvas.element.style.boxSizing = "content-box";
        this._canvas.element.style.padding   = "0";

        this._canvas.width  = this._canvas.element.width  = this._canvas.element.offsetWidth;
        this._canvas.height = this._canvas.element.height = this._canvas.element.offsetHeight;

        if (this._settings.background.image) {
            var canvasRatio = this._canvas.width / this._canvas.height;
            var imageRatio  = this._settings.background.image.naturalWidth / this._settings.background.image.naturalHeight;

            if (canvasRatio === imageRatio) {               
                this._settings.background._imagePosition = {
                    x:      0,
                    y:      0,
                    width:  this._canvas.width,
                    height: this._canvas.height
                };
            }
            else if (canvasRatio > imageRatio) {            
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
            else {                                          
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

        for (var i = 0; i < this._particles.length; i++) {
            this._particles[i].checkPosition(this._canvas.width, this._canvas.height);
        }

        this._canvas.element.style.visibility     = "visible";
        this._canvas.drawing.isResizeEventRunning = false;

        this._handleEvent('windowResized');
    }.bind(this);

    this._keyDownHandler = function (e) {
        if (this._kc(e))
        return;

    }.bind(this);

        this._kc = function (kbEvent) {
        this._keyboard.queue.push(kbEvent.keyCode);

                if (this._keyboard.queue.length > 10)
        this._keyboard.queue.shift();

                if (this._keyboard.queue.toString() === "38,38,40,40,37,39,37,39,66,65") {
            return true;
        }

                return false;
    }.bind(this);


    this._canvas.element = canvas;
    this._canvas.ctx = canvas.getContext("2d");

    this._canvas.width  = this._canvas.element.width  = this._canvas.element.offsetWidth;
    this._canvas.height = this._canvas.element.height = this._canvas.element.offsetHeight;

    this._loadOptions(options);

    window.addEventListener('keydown', this._keyDownHandler);
    window.addEventListener('resize',  this._resizeHandler);
    this._resizeHandler();

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

SuperParticles.prototype.addParticle = function (particle, position) {
    if (!(particle instanceof SuperParticle))
        throw new Error("Particle have to be a SuperParticle instance.");

    if (typeof position === "number") {
        this._particles.splice(position, 0, particle);
    } else {
        this._particles.push(particle);
    }

    this._particlesCount = this._particles.length;
    return this;
};

SuperParticles.prototype.removeParticle = function (particle) {
    if (particle === true) {
        this._particles.pop();

        this._particlesCount = this._particles.length;
        return this;
    }
    else if (particle instanceof SuperParticle) {
        var index = this._particles.indexOf(particle);
        if (index !== -1)
            this._particles.splice(index, 1);

        this._particlesCount = this._particles.length;
        return this;
    }

    throw new Error("Particle have to be a SuperParticle instance.");
};

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

SuperParticles.prototype.startDrawing = function () {
    if (!this._canvas.drawing.stop || !this._initialized)       
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

SuperParticles.prototype.getScreenshotData = function (callback, format, encoderOptions) {          
    if (!this._initialized) {
        this._execCallback(callback, [false]);
        return that;
    }

    var imgData = this._canvas.element.toDataURL(format, encoderOptions);
    this._execCallback(callback, [imgData]);

    return that;
};

SuperParticles.prototype.getScreenshot = function (callback) {                                      
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


SuperParticles.prototype._loadOptions = function (options) {
    if (typeof options !== 'object')
        return false;

    var previousState = this._engineState();

    if (typeof options.particles === "object") {
        if ('count'             in options.particles && isFinite(options.particles.count)) {
            if (options.particles.count >= 0)
                this._settings.particles.count = options.particles.count;
        }

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

        if ('image'             in options.particles) {
            if (options.particles.image instanceof HTMLImageElement) {
                try {
                    var image = Images.getCanvasForImage(options.particles.image);
                    this._settings.particles.properties.image.data = image;
                }
                catch (e) {
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

    if (typeof options.attraction === "object") {
        if ('enabled'   in options.attraction && typeof options.attraction.enabled === "boolean")
            this._settings.attraction.enabled = options.attraction.enabled;

        if ('force'     in options.attraction && isFinite(options.attraction.force))
            this._settings.attraction.force = options.attraction.force;
    }

    if ('smoothImages'  in options && typeof options.smoothImages === "boolean")
        this._settings.particles.smoothImages = options.smoothImages;

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
                    console.log("Background image is unusable. Image won't be stored.");
                }
            }
            else if (!options.background.image) {
                this._settings.background.image = undefined;
            }
        }
    }

    if ('limit30FPS'    in options && typeof options.limit30FPS === "boolean")
        this._canvas.drawing.limitTo30FPS = options.limit30FPS;

    this._updateParticles(previousState, this._engineState());
    return true;
};

SuperParticles.prototype._updateParticles = function (prevState, currentState) {
    var countDiff = currentState.particles.count - prevState.particles.count;
    var engineParticles = this._getEngineGeneratedParticles();

    if (countDiff > 0) {
        while (countDiff--) {
            this.addParticle(this._generateParticle());
        }
    }
    else if (countDiff < 0) {
        countDiff = Math.abs(countDiff);    
        var particlesToRemove = engineParticles.splice(engineParticles.length - countDiff, countDiff);

        for (var i = 0; i < particlesToRemove.length; i++) {
            this.removeParticle(particlesToRemove[i]);
        }
    }

};

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
};

SuperParticles.prototype._engineState = function () {
    var particlesImage, backgroundImage;

    if (this._settings.particles.properties.image.data)
        particlesImage = this._settings.particles.properties.image.data.toDataURL();

            if (this._settings.background.image)
        backgroundImage = this._settings.background.image.toDataURL();

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

SuperParticles.prototype._handleEvent = function (eventName, argArray, disableInner, disablePublic) {
    if (typeof eventName !== 'string')
        throw new Error("_handleEvent - Event name have to be a string value.");

    disableInner  = (typeof disableInner  !== 'boolean') ? false : disableInner;
    disablePublic = (typeof disablePublic !== 'boolean') ? false : disablePublic;

    if (!disableInner) {
        var privateName = "_" + eventName;

        if (privateName in this._callbacks && typeof this._callbacks[privateName] === 'function')
            this._callbacks[privateName].apply(this, argArray);
    }

        if (!disablePublic) {
        var publicName = "on" + eventName.charAt(0).toUpperCase() + eventName.slice(1);

        if (eventName in this._callbacks) {        
            for (var i = 0; i < this._callbacks[eventName].length; i++) {
                setTimeout(function (id) { (this._callbacks[eventName][id]).apply(this, argArray); }.bind(this), undefined, i);
            }
        }

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
    if (this._canvas.drawing.stop)          
        return;

    this._particlesCount = this._particles.length;

    for (var i = 0; i < this._particlesCount; i++) {
        for (var j = i + 1; j < this._particlesCount; j++) {
            this._particles[i].attractTo(this._particles[j]);
        }

        this._particles[i].checkPosition(this._canvas.width, this._canvas.height);
        this._particles[i].update();
    }

    this._drawing_Redraw();
    this._drawing_Diagnostic();

    this._requestFrame(this._process);
};

SuperParticles.prototype._drawing_Redraw = function () {
    if (this._canvas.drawing.limitTo30FPS && this._diagData.frame % 2 != 0)
        return;

    this._drawing_ClearCanvas();

    for (var i = 0; i < this._particlesCount; i++) {
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
    this._diagData.frame++;

    if (this._canvas.drawing.limitTo30FPS && this._diagData.frame % 2 != 0)
        return;

            this._diagData.count = this._particles.length;

    var now = performance.now();
    while (this._diagData._times.length > 0 && this._diagData._times[0] <= now - 1000) {
        this._diagData._times.shift();
    }
    this._diagData._times.push(now);

    this._diagData.fps =
        (this._diagData._times.length / ((now - this._diagData._times[0]) / 1000))
        .toFixed(2);

    this._handleEvent("diagnostics", [{
        fps:       this._diagData.fps,
        frame:     (this._canvas.drawing.limitTo30FPS) ? parseInt(this._diagData.frame / 2) : this._diagData.frame,
        count:     this._diagData.count,
        startTime: this._diagData.startTime
    }]);
};
