var canvas, demo, options;

var demoOptions = {
    count: 100,

    maxVelocity:       1,
    maxSize:           30,
    maxStrokeSize:     10,
    maxImageSize:      25,
    force:             0,       //-((p._apperance.shape.size + p._apperance.shape.stroke.width) / 35 * 0.25),    //Math.random() * 0.15,
    isBouncing:        Math.random() > 0.5 ? true : false,
    collisionSlowdown: Math.random() > 0.5 ? true : false,
};

function prepareParticle(c) {
    var p = new SuperParticle("auto-generated", {
        
    });

    //TEST code
    p._position.x    = demo._canvas.width  * Math.random();
    p._position.y    = demo._canvas.height * Math.random();
    p._movement.vx   = (Math.random() * (demoOptions.maxVelocity * 2)) - demoOptions.maxVelocity;
    p._movement.vy   = (Math.random() * (demoOptions.maxVelocity * 2)) - demoOptions.maxVelocity;

    p._apperance.behavior.slowDownOnCollision = demoOptions.collisionSlowdown;
    p._movement.initialSpeedSqr = Math.sqr(p._movement.vx) + Math.sqr(p._movement.vy);

    p._apperance.shape.size = (Math.random() * (demoOptions.maxSize - 10)) + 10;

    var rand = Math.round(Math.random() * 2);
    switch (rand) {
        case 1:  p._apperance.shape.type = "circle"; break;
        case 2:  p._apperance.shape.type = "square"; break;
        default: p._apperance.shape.type = undefined;
    }
    

    rand = Math.round(Math.random() * 9);
    switch (rand) {
        case 1:  p._apperance.shape.color = "blue";    break;
        case 2:  p._apperance.shape.color = "green";   break;
        case 3:  p._apperance.shape.color = "red";     break;
        case 4:  p._apperance.shape.color = "yellow";  break;
        case 5:  p._apperance.shape.color = "orange";  break;
        case 6:  p._apperance.shape.color = "pink";    break;
        case 7:  p._apperance.shape.color = "fuchsia"; break;
        case 8:  p._apperance.shape.color = "aqua";    break;
        case 9:  p._apperance.shape.color = "white";   break;
        default: p._apperance.shape.color = "white";   break;  //black
    }
    
    if (Math.random() > 0.7) {
        p._apperance.shape.stroke.width = Math.random() * demoOptions.maxStrokeSize;

        rand = Math.round(Math.random() * 9);
        switch (rand) {
            case 1:  p._apperance.shape.stroke.color = "blue";    break;
            case 2:  p._apperance.shape.stroke.color = "green";   break;
            case 3:  p._apperance.shape.stroke.color = "red";     break;
            case 4:  p._apperance.shape.stroke.color = "yellow";  break;
            case 5:  p._apperance.shape.stroke.color = "orange";  break;
            case 6:  p._apperance.shape.stroke.color = "pink";    break;
            case 7:  p._apperance.shape.stroke.color = "fuchsia"; break;
            case 8:  p._apperance.shape.stroke.color = "aqua";    break;
            case 9:  p._apperance.shape.stroke.color = "white";   break;
            default: p._apperance.shape.stroke.color = "white";   break;  //black
        }
    }

    if (c == 0 || Math.random() > 0.7 || p._apperance.shape.type == undefined) {
        p._apperance.image.size    = (Math.random() * (demoOptions.maxImageSize - 10)) + 10;
        p._apperance.image.opacity = 1; //(Math.random() * 0.5) + 0.5;

        if (c == 0)
            p._apperance.image.size = demoOptions.maxImageSize * 2;

        var cImg = document.createElement('canvas');
        cImg.width  = p._apperance.image.size;
        cImg.height = p._apperance.image.size;

        var ctx = cImg.getContext("2d");
        ctx.drawImage(testImage,
            0, 0, testImage.naturalWidth, testImage.naturalHeight,
            0, 0, cImg.width, cImg.height);

        p._apperance.image.data = cImg;
    }

    p._gravity.force = (c % 4 == 0) ? 50 : 1; //demoOptions.force;

    p._apperance.opacity.value   = (Math.random() * 0.5) + 0.5;
    p._apperance.behavior.bounce = demoOptions.isBouncing;

    if (c == 0) {
        p._position.x    = demo._canvas.width  / 2;
        p._position.y    = demo._canvas.height / 2;
        p._movement.vx   = 0;
        p._movement.vy   = 0;
        p._gravity.force = 500;
        p._apperance.shape.type = "circle";
        p._apperance.shape.size = demoOptions.maxSize * 2.5;
        p._apperance.shape.color = "black";
        p._apperance.shape.stroke.width = 2;
        p._apperance.shape.stroke.color = "lightgray";
    }

    return p;
}

function initalize() {
    for (var c = 0; c < demoOptions.count; c++) {
        //adding particle to engine array
        demo.addParticle(prepareParticle(c));
    }
}

window.onload = function () {
    canvas = document.querySelector("#super-particles-demo");
    options = {

    };

    demo = new SuperParticles(canvas, options)
        .addEventListener("diagnostics", function (data) {
            var diagBox = document.querySelector("#diag");

            diagBox.innerHTML =
                "Particles: "                + data.count + " <br />\n" +
                "FPS: &nbsp; &nbsp; &nbsp; " + data.fps + " <br />\n" +
                "Frame: &nbsp; &nbsp; "      + data.frame +" ";
        });

    document
        .querySelector("#controls #removeParticle")
        .addEventListener('click', function (e) {
            demo.removeParticle(true);
        });
    document
        .querySelector("#controls #addParticle")
        .addEventListener('click', function (e) {
            demo.addParticle(prepareParticle());
        });


    if (testImage.complete)
        initalize();
    else
        testImage.onload = initalize;
};