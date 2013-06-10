var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
window.requestAnimationFrame = requestAnimationFrame;
window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

var v, canvas, gCtx;
var backBuffer = document.createElement('canvas');
var bCtx = backBuffer.getContext('2d');


cubes = {

    webcam: null,
    imageData: null,
    tilesAcross: 20,
    tileStore: [],
    hasImage: false,
    baseWidth: 20,
    baseHeight: 15,
    counter: 0,

    init: function() {

        v = document.getElementById('webcam');
        canvas = document.getElementById('webcamcanvas');
        gCtx = canvas.getContext('2d');

        //cubes.makeTileMap();

        navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
        navigator.getUserMedia({video:true}, function(localMediaStream) {cubes.callbackStreamIsReady(localMediaStream);}, function(err) {console.log(err);});

        setInterval(function() {
            cubes.createMesh();
        }, 60);

    },

    callbackStreamIsReady: function(stream) {

        v.src = URL.createObjectURL(stream);
        v.play();
        window.requestAnimationFrame(cubes.makeFrame);

    },

    makeFrame: function() {

        var w = cubes.baseWidth;
        var h = cubes.baseHeight;

        backBuffer.width = w;
        backBuffer.height = h;

        //  copy the image from the video into the background bugger
        try {
            bCtx.translate(w, 0);
            bCtx.scale(-1, 1);
            bCtx.drawImage(v, 0, 0, w, h);
        } catch(er) {
            $('.firefoxBug').fadeIn('slow');
            return;
        }

        var imageData = bCtx.getImageData(0, 0, w, h);
        cubes.imageData = imageData;


        //flambientcam.renderFrame();

        var pixels = bCtx.getImageData(0, 0, w, h);
        gCtx.putImageData(pixels, 0, 0);

        cubes.hasImage = true;

        window.requestAnimationFrame(cubes.makeFrame);
    },


    //  This tries to create a mesh over in the control object
    createMesh: function() {

        if (!cubes.hasImage) return;
        if (control.rendering) return;
        if (control.paused) return;

        var cubeSize = 20;
        var newMesh = null;
        var color = new THREE.Color( 0xff0000 );
        var cube = new THREE.CubeGeometry( cubeSize, cubeSize, cubeSize );
        

        var tl = new THREE.Vector3(-cubeSize,  cubeSize, 0);
        var tr = new THREE.Vector3( cubeSize,  cubeSize, 0);
        var bl = new THREE.Vector3(-cubeSize, -cubeSize, 0);
        var br = new THREE.Vector3( cubeSize, -cubeSize, 0);

        var newScale = 1;
        var r = null;
        var g = null;
        var b = null;

        

        //  If the scene is being run for the first time, set it all up
        if (control.scene.__objects.length === 0) {

            for (var y = 0; y < this.baseHeight; y++) {
                for (var x = 0; x < this.baseWidth; x++) {
                    r = cubes.imageData.data[(y*this.baseWidth+x)*4]/255;
                    g = cubes.imageData.data[(y*this.baseWidth+x)*4+1]/255;
                    b = cubes.imageData.data[(y*this.baseWidth+x)*4+2]/255;
                    color.setRGB(r, g, b);
                    newCube = new THREE.Mesh( cube, new THREE.MeshLambertMaterial( { color: color, ambient: color, side: THREE.DoubleSide } ) );
                    newCube.position.x = ((x-(this.baseWidth/2)+1)*cubeSize)-(cubeSize/2);
                    newCube.position.y = (((this.baseHeight-y)-(this.baseHeight/2))*cubeSize)-(cubeSize/2) + 300;
                    newCube.position.z = ((r+g+b)/3)*50;
                    newCube.scale = {x: newScale, y: newScale, z: newScale};
                    control.scene.add(newCube);
                }
            }

            //  Add some lights. We do this after adding the cubes
            //  because these count as __objects in the scene and
            //  we are refering to the objects by array index in the
            //  update code starting at 0. It's just easier
            //  to add the lights at the *end* of the objects
            //  array rather than the begining.
            var light = new THREE.DirectionalLight( 0x999999 );
            light.position.set( 0, 0, 600 );
            control.scene.add( light );
            var light2 = new THREE.DirectionalLight( 0x666666 );
            light2.position.set( 200, 150, 200 );
            control.scene.add( light2 );
            var light3 = new THREE.DirectionalLight( 0x666666 );
            light3.position.set( -200, 0, 100 );
            control.scene.add( light3 );
            var ambientLight = new THREE.AmbientLight(0x999999);
            control.scene.add(ambientLight);

            $('.allowcamera').stop(true, true).fadeOut('fast');
            control.started = true;

        } else {

            //  Otherwise just update the colour, size and position of
            //  the cubes.
            //  We're going to directly access the object from the
            //  scene.__objects array. This is bad we should 
            //  select the object and adjust the colours via
            //  methods as this kind of thing could change at
            //  any moment.
            for (var y = 0; y < this.baseHeight; y++) {
                for (var x = 0; x < this.baseWidth; x++) {
                    r = cubes.imageData.data[(y*this.baseWidth+x)*4]/255;
                    g = cubes.imageData.data[(y*this.baseWidth+x)*4+1]/255;
                    b = cubes.imageData.data[(y*this.baseWidth+x)*4+2]/255;
                    newCube = control.scene.__objects[(y*this.baseWidth)+x];
                    newCube.material.color.r = r;
                    newCube.material.color.g = g;
                    newCube.material.color.b = b;
                    newCube.material.ambient.r = r;
                    newCube.material.ambient.g = g;
                    newCube.material.ambient.b = b;
                    newCube.position.z = ((r+g+b)/3)*50;
                    newScale = ((1-((r+g+b)/3))*1.5)+0.8;
                    newCube.scale = {x: newScale, y: newScale, z: newScale};
                }
            }
        }

        cubes.counter++;
    },

    clearScene: function() {

        var oldObject = null;
        var objNumber = control.scene.__objects.length;
        for (var i = 0; i < objNumber; i++) {
            oldObject = control.scene.__objects[0];
            control.scene.remove(oldObject);
        }
    }

};

utils = {

    log: function(msg) {

        try {
            console.log(msg);
        } catch(er) {
            //  DO NOWT
        }
    }

};
