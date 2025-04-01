/* -----------------------------------------------
/* Author: Artur Zoremba (Skor_X) - skorx.ga
/* MIT license: http://opensource.org/licenses/MIT
/* GitHub: https://github.com/SkorX/Super-Particles
/* Page: https://skorx.github.io/Super-Particles
/* v0.2.0
/* ----------------------------------------------- */

// === Images ===
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

        //checking for tainted canvas
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
                //this should never happen
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

        //canvas cloning
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
            //can't produce scales image (no size), so we clone old image (same size)
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

// === Math ===
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
    //Multiplying is much faster then Math.pow function
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
