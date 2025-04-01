/* -----------------------------------------------
/* Author: Artur Zoremba (Skor_X) - skorx.ga
/* MIT license: http://opensource.org/licenses/MIT
/* GitHub: https://github.com/SkorX/Super-Particles
/* Page: https://skorx.github.io/Super-Particles
/* v0.2.0
/* ----------------------------------------------- */

// --- OPTIONS EXPLANATION (with default values) (do not uncomment this code, preview only) ---
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


var SuperParticle = function (tag, options) {
    "use strict";

    //init checks
    if (!(this instanceof SuperParticle))
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

        initialSpeedSqr: undefined, //slowdown cached speed (for slowdownOnCollision setting)
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
            opacity:    1,
        },
        opacity: {
            value: 1,

            alternation: {
                speed:     0,       //change per second
                min_value: 0,
            }
        },

        _size: 0,
    };

    this._behavior = {
        bounce:              true,
        slowdownOnCollision: false,
    };

    //// === PUBLIC VARIABLES ===
    this.tag = undefined;

    //// === CONSTRUCTOR ===
    if (typeof tag !== "string")
        throw new Error("Tag have to be a valid string.");

    this.tag = tag;
    this._loadOptions(options);

    return this;
};

//// === PUBLIC METHODS ===
//state
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

//properties
SuperParticle.prototype.size = function () {
    return this._apperance._size;
};

//modificators
SuperParticle.prototype.setSpeed = function (targetSpeed) {
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

SuperParticle.prototype.resetSpeed = function () {
    //calculating current speed square
    var currentSpeedSqr = Math.sqr(this._movement.vx) + Math.sqr(this._movement.vy);

    //calulating speed difference
    var divider = Math.sqrt(currentSpeedSqr / this._movement.initialSpeedSqr);

    //reseting speed to initial value
    this._movement.vx /= divider;
    this._movement.vy /= divider;

    return this;
};

SuperParticle.prototype.applyForce = function (vx, vy, changeInitialSpeed) {
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

//processing / drawing
SuperParticle.prototype.attractTo = function (other) {
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
        var gravityForce = Math.abs(this._gravity.force * other._gravity.force) / distanceSqr;

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

SuperParticle.prototype.update = function () {
    this._position.x += this._movement.vx;
    this._position.y += this._movement.vy;

    //TODO opacity alternation

    return this;
};

SuperParticle.prototype.checkPosition = function (canvasWidth, canvasHeight) {
    if (!isFinite(canvasWidth) || !isFinite(canvasHeight))
        return this;

    var collision = false;
    var size = this.size();
    var radius = size / 2;

    if (this._behavior.bounce) {
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

    if (collision && this._behavior.slowdownOnCollision)
        this.resetSpeed();

    return this;
};

SuperParticle.prototype.draw = function (canvasContext, enableImageSmoothing) {
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

//// === PRIVATE METHODS ===
//options
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
        //fill
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

        //stroke
        if ('strokeWidth'   in options.apperance && isFinite(options.apperance.strokeWidth)) {
            if (options.apperance.strokeWidth >= 0) {
                this._apperance.shape.stroke.width = options.apperance.strokeWidth;
                this._recalculateSize();
            }
        }

        if ('strokeColor'   in options.apperance && typeof options.apperance.strokeColor === "string")
            this._apperance.shape.stroke.color = options.apperance.strokeColor;

        //image
        if ('image'         in options.apperance && options.apperance.image instanceof HTMLImageElement) {
            try {
                var image = Images.getCanvasForImage(options.apperance.image);
                this._apperance.image.sourceData = image;

                if (this._apperance.image.size)
                    this._apperance.image.data = Images.getScaledImage(image, this._apperance.image.size);
            }
            catch (e) {
                //unusable image :(
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

        //opacity
        if ('opacity'       in options.apperance && isFinite(options.apperance.opacity))
            if (options.apperance.opacity > 0 && options.apperance.opacity <= 1)
                this._apperance.opacity.value = options.apperance.opacity;
    }

    //behavior
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

//utilities
SuperParticle.prototype._calculateDistance = function (p1, p2) {
    return Math.abs(
             Math.sqrt(
               Math.sqr(p1._position.x - p2._position.x) +
               Math.sqr(p1._position.y - p2._position.y)));
};
