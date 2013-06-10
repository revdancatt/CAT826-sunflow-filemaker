control = {

    //  Here's all the "global" stuff that we want to have access
    //  to most of the time.

    //  The camera, scene and renderer vars are all to do with THREE.js
    //  this will give us access them (to move around etc.) at any time
    camera: null,
    scene: null,
    renderer: null,
    rendering: false,
    paused: false,
    started: false,

    //  Now we want to keep track of where we want to move the camera
    //  do. We basically have a camera that sits on a "dolly" that
    //  tracks around the target, rather like this...
    /*
          #####
       ###     ###
      #           #
     #             #
     C------t      #
     #             #
      #           #
       ###     ###
          #####
    */
    // As the camera moves round the track it will always point into 
    //  the middle. This is a bit of an odd way to control a camera but
    //  it'll allow us to move 360 degree around an object.

    //  The position is going to record how far around we are, 0-359
    //  and what the radius of the track is. So we can make the track
    //  larger to move the camera away from the target and smaller, etc.
    //
    //  We do two more things, we can adjust the height of the camera and
    //  the height of the target. So we can raise the camera above the target
    //  or the target up above the camera. Somewhat like this...
    /*

    C             t
    |\           /|
    | \         / |
    |  \       /  |
    |   \     /   |
    |    t   C    |
    |    |   |    |
    ######   ######

    */
    //  The position holds all this infomation
    position: {around: 90.0, radius: 600.0, height: 300.0, lookat: 300.0},

    //  There's also a bit going on about adjusting the camera position
    //  rather than just moving it as I press down keys I'm actually
    //  adjusting the "velocity" at which the object is being moved
    //  This isn't important but I quite like it as it gives it a bit
    //  more of a flow feel.
    velocity: {around: 0.0, radius: 0.0, height: 0.0, lookat: 0.0},


    //  I want to keep track of which keys are currently being
    //  held down so I can react to them. I'm tracking the 
    //  cursor keys (up/down/left/right) and the extra keys
    //  to move the camera and target up and down
    keyControls: {
        isUpDown: false,
        isDownDown: false,
        isLeftDown: false,
        isRightDown: false,
        isCameraUpDown: false,
        isCameraDownDown: false,
        isTargetUpDown: false,
        isTargetDownDown: false
    },

    //  I should use some kind of long polling or handy node websockets
    //  stuff. But because I can't be bothered I'm just going to check to
    //  see if the render has finished by polling the backend once every
    //  second. This timer is going to be used for that.
    fileCheckTmr: null,

    //  The size stuff goes here
    baseWidth: 400,
    baseHeight: 225,

    //  This timer will handle when we atempt to resize the stage
    windowResizeTrm: null,


    //  This functions sets everything up...
    init: function() {

        //  First of we are going to set the scene
        //  we do this by creating a camera, scene and renderer as part
        //  of THREE.
        //  We are going to be working with the dimensions set in the CSS
        //  for the .threeHolder and the renderer will throw the canvas
        //  it's going to use into the DOM.

        this.setRenderArea();

        try {
            this.camera = new THREE.PerspectiveCamera( 35, this.baseWidth / this.baseHeight, 1, 10000 );
            this.scene = new THREE.Scene();
            this.renderer = new THREE.WebGLRenderer({antialias: true});
            this.renderer.setSize( $('.threeHolder').width(), $('.threeHolder').height() );
            $('.threeHolder').append( $(this.renderer.domElement) );
        } catch(er) {
            $('.nowebGL').fadeIn('slow');
            return;
        }


        //  fire the resize after 600ms.
        $(window).resize( function() {
            clearTimeout(control.windowResizeTrm);
            control.windowResizeTrm = setTimeout(function() {
                control.setRenderArea();
            }, 600);
        });

        //  Ok, so we've built the scene, now I'm going to bind all the key control flags
        //  to the keypressed.
        //  NOTE: They don't actually do anything themselves as such, that all happens
        //  in the animation loop. The only thing that really triggers an action
        //  is "r" for render
        $(document).bind('keydown', function(e) {
            if (e.keyCode == 87) control.keyControls.isUpDown = true;           //  W
            if (e.keyCode == 83) control.keyControls.isDownDown = true;         //  S
            if (e.keyCode == 65) control.keyControls.isRightDown = true;        //  A
            if (e.keyCode == 68) control.keyControls.isLeftDown = true;         //  D
            if (e.keyCode == 81) control.keyControls.isCameraUpDown = true;     //  Q
            if (e.keyCode == 90) control.keyControls.isCameraDownDown = true;   //  Z
            if (e.keyCode == 69) control.keyControls.isTargetUpDown = true;     //  E
            if (e.keyCode == 67) control.keyControls.isTargetDownDown = true;   //  C

        });

        //  All the same keys, but you know, letting go of them.
        $(document).bind('keyup', function(e) {
            if (e.keyCode == 87) control.keyControls.isUpDown = false;          //  W
            if (e.keyCode == 83) control.keyControls.isDownDown = false;        //  S
            if (e.keyCode == 65) control.keyControls.isRightDown = false;       //  A
            if (e.keyCode == 68) control.keyControls.isLeftDown = false;        //  D
            if (e.keyCode == 81) control.keyControls.isCameraUpDown = false;    //  Q
            if (e.keyCode == 90) control.keyControls.isCameraDownDown = false;  //  Z
            if (e.keyCode == 69) control.keyControls.isTargetUpDown = false;    //  E
            if (e.keyCode == 67) control.keyControls.isTargetDownDown = false;  //  C

            //  if we have told it to render do that here
            //  NOTE: We are sending over the scene object even
            //  thought the render function would have access to it
            //  anyway. We are doing this so in theory we can throw 
            //  *any* THREE scene that has been created in a different
            //  way. We could just take the render function and 
            //  stick it onto something else.
            //  
            //  TODO: move the render function out of control and into
            //  a different object, just to prove the point.
            if (e.keyCode == 82) {
                if (!control.rendering && control.started) {
                    control.paused = true;
                    $('.paused').stop(true, true).fadeIn('fast');
                    control.render(control.scene, control.camera, control.renderer);
                }
            }

            //  Toggle the paused
            if (e.keyCode == 80 && control.started) {
                if (control.paused) {
                    $('.paused').stop(true, true).fadeOut('slow');
                    control.paused = false;
                } else {
                    $('.paused').stop(true, true).fadeIn('fast');
                    control.paused = true;
                }
            }

        });

        this.animate();

        //  fade in the camera prompt popup
        setTimeout(function() {
            if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
                $('.allowcamera').css({
                    left: '28px',
                    right: null,
                    top: '200px'
                });
            }
            $('.allowcamera').fadeIn('slow');
        }, 1000);

        //  finally kick off the cubes
        cubes.init();

        //  unpause the animation when we close the dialog
        $('#dialog').dialog({
            close: function() {
                if (control.paused) {
                    $('.paused').stop(true, true).fadeOut('slow');
                    control.paused = false;
                }
            }
        });

    },

    setRenderArea: function() {

        //  Calculate the size of the "stage", to see if we can get it into
        //  16:9 ratio
        var stageWidth = $('body').innerWidth();
        var stageHeight = Math.floor(stageWidth/16*9);

        //  if the new height is too high to be displayed
        //  then we have to go the other way.
        if (stageHeight > $('body').innerHeight()) {
            stageHeight = $('body').innerHeight();
            stageWidth = Math.floor(stageHeight/9*16);
        }

        var stageTop = Math.floor(($('body').innerHeight() - stageHeight)/2);

        //  Now set the size of the canvas
        $('.threeHolder').css({
            'width': stageWidth,
            'height': stageHeight,
            'margin-top': stageTop
        });

        //  set the canvas, just incase we can.
        $('.threeHolder canvas').css({width: '100%', height: '100%'});

        try {
            control.renderer.setSize( stageWidth, stageHeight );
        } catch(er) {
            //  NOWT
        }

    },

    //  This function deals with all the camera moving stuff and so on,
    //  it's awesome
    animate: function() {


        // note: three.js includes requestAnimationFrame shim
        requestAnimationFrame( control.animate );

        //  Dampening is how quickly the movement slides to a halt
        //  after you take your finger off a key.
        //  maxTurn is the maximum velocity that we can move each
        //  frame.
        //
        //  TODO:
        //  Add a Shift modifier key so we can have precise movements
        //  for fine tuning the view.
        var dampening = 0.8;
        var maxTurn = 2;

        //  dampen the velocities
        //  Do this stops movement from being an on/off thing but a bit more
        //  swooshy and smooth :)
        control.velocity.around = control.velocity.around * dampening;
        control.velocity.radius = control.velocity.radius * dampening;
        control.velocity.height = control.velocity.height * dampening;
        control.velocity.lookat = control.velocity.lookat * dampening;

        //  This controls the value we are going to increase the movement
        //  *around* the middle point, to the left and right
        if (control.keyControls.isLeftDown) {
            control.velocity.around++;
            if (control.velocity.around > maxTurn) control.velocity.around = maxTurn;
        }

        if (control.keyControls.isRightDown) {
            control.velocity.around--;
            if (control.velocity.around < -maxTurn) control.velocity.around = -maxTurn;
        }

        
        //  And now increase and decrease the radius of the track on which the 
        //  camera is going round on. Essentially moves the camera in and out of
        //  the scene.
        if (control.keyControls.isUpDown) {
            control.velocity.radius--;
            if (control.velocity.radius < -maxTurn) control.velocity.radius = -maxTurn;
        }

        if (control.keyControls.isDownDown) {
            control.velocity.radius++;
            if (control.velocity.radius > maxTurn) control.velocity.radius = maxTurn;
        }


        //  Now for the camera height
        if (control.keyControls.isCameraUpDown) {
            control.velocity.height+=2;
            if (control.velocity.height > maxTurn*2) control.velocity.height = maxTurn*2;
        }

        if (control.keyControls.isCameraDownDown) {
            control.velocity.height-=2;
            if (control.velocity.height < -maxTurn*2) control.velocity.height = -maxTurn*2;
        }


        //  Finally the lookat height
        if (control.keyControls.isTargetUpDown) {
            control.velocity.lookat+=2;
            if (control.velocity.lookat > maxTurn*2) control.velocity.lookat = maxTurn*2;
        }

        if (control.keyControls.isTargetDownDown) {
            control.velocity.lookat-=2;
            if (control.velocity.lookat < -maxTurn*2) control.velocity.lookat = -maxTurn*2;
        }

        //  Now that we've got our new velocity, we can adjust the position values.
        control.position.around += control.velocity.around;
        control.position.radius += control.velocity.radius;
        control.position.height += control.velocity.height;
        control.position.lookat += control.velocity.lookat;

        //  Calculate the x,z position of the camera (i.e. convert the angle and radius
        //  to co-ordinates we can use)
        var x = control.position.radius * Math.cos(control.position.around * Math.PI / 180);
        var z = control.position.radius * Math.sin(control.position.around * Math.PI / 180);

        //  Set the position and height of the camera
        control.camera.position.x = x;
        control.camera.position.z = z;
        control.camera.position.y = control.position.height;

        //  Set the target of the camera.
        control.camera.lookAt(new THREE.Vector3( 0, control.position.lookat, 0 ));

        //  render the scene again with the scene and camera
        control.renderer.render( control.scene, control.camera );

    },


    //  This function goes through the camera position, the target
    //  and all the objects in the scene
    //  It bundles all that up into a JSON object which it POSTS
    //  to the node.js backend, which will use all of that to
    //  write the .sc file needed for Sunflow and kick off the rendering
    //
    //  In theory this would be nice if we could *just* send the
    //  scene and camera over. Which we can, but I'm still accessing
    //  the target which we hold on control.
    //
    //  I'm not sure how to get the target from *just* the camera info
    //  without having to run the calculations backwards from its
    //  rotations... which I *can* just not quite yet, need a coffee
    //  first and I don't drink coffee.
    //
    //  So for the moment, let's just pretend that it's *nearly*
    //  totally free from "knowing" control stuff
    render: function(scene, camera, renderer) {

        this.paused = true;

        //  First of all we are going to work out a bunch of
        //  parameters to deal with, make the empty param thing
        var params = {};

        //  send over the dimensions, which come from the
        //  renderer. There's probably a better way of asking
        //  the renderer for this information, but for the
        //  moment let's go directly for the throat.
        params.size = {
            width: 1600,
            height: 900
        };

        //  add the camera
        //  TODO, work out the lookat position from the camera, not directly
        //  from the control object
        params.camera = {
            fov: camera.fov,
            position: {x: parseFloat(camera.position.x), y: parseFloat(camera.position.y), z: parseFloat(camera.position.z)},
            lookat: {x: 0, y: control.position.lookat, z: 0},
            aspect: params.size.width / params.size.height
        };

        //  Now throw all the objects in, set up all the vars
        //  we are going to be using, 'cause reasons
        params.objects = [];
        var mesh = null;
        var meshes = scene.getDescendants();
        var object = {};
        var newVertics = null;

        //  go thru all the meshes in the scene
        for (var i in meshes) {

            mesh = meshes[i];
            object = {};

            //  Try and grab the colour from the model
            if ('material' in mesh && 'color' in mesh.material) {
                object.colour = {
                    r: mesh.material.color.r,
                    g: mesh.material.color.g,
                    b: mesh.material.color.b
                };
            }

            //  Find out what type of object it is, so we can handle it
            //  in different ways
            //
            //  There is probably a better way of detecting a SPHERE than this
            //  but for the moment this will do. If there is a "Radius" in 
            //  the geometry the let's *assume* it's a sphere, otherwise
            //  let's *assume* it's a mesh object
            if ('geometry' in mesh && 'radius' in mesh.geometry) {

                //  if it's a sphere then we can jyst do that here
                object.type = 'sphere';
                object.position = {x: parseFloat(mesh.position.x), y: parseFloat(mesh.position.y), z: parseFloat(mesh.position.z)};
                object.radius = parseFloat(mesh.geometry.radius);

                //  Add the object
                params.objects.push(object);

            } else if ('geometry' in mesh && 'vertices' in mesh.geometry && 'faces' in mesh.geometry) {

                //  otherwise it's a mesh and we need to pass over the vertices and faces
                object.type = 'mesh';
                object.vertices = [];
                object.faces = [];

                //  Go through all the vertices
                for (var v in mesh.geometry.vertices) {

                    //  convert the vertices from local to world locations (so we don't
                    //  have to pass the rotation, position and scale over to the backend)
                    newVertics =mesh.geometry.vertices[v].clone();
                    newVertics = newVertics.applyMatrix4(mesh.matrixWorld);
                    object.vertices.push({x: newVertics.x, y: newVertics.y, z: newVertics.z});

                }

                //  Now go thru all the faces.
                for (var f in mesh.geometry.faces) {

                    //  If there are 4 vertices used in this face (i.e. it's a QUAD) and we should
                    //  really use the *proper* way to check if it is or not (Face3 vs Face4) just
                    //  as soon as I've gotten round to figuring it out...
                    //  ...anyway, if there are 4 vertices then we can split those into two 3 vertices
                    //  faces by using a,b,c and a,c,d which is the same as a,b,c,d just split.
                    if ('d' in mesh.geometry.faces[f]) {
                        object.faces.push([mesh.geometry.faces[f].a, mesh.geometry.faces[f].b, mesh.geometry.faces[f].c]);
                        object.faces.push([mesh.geometry.faces[f].a, mesh.geometry.faces[f].c, mesh.geometry.faces[f].d]);
                    } else {
                        object.faces.push([mesh.geometry.faces[f].a, mesh.geometry.faces[f].b, mesh.geometry.faces[f].c]);
                    }
                }

                //  Add the object
                params.objects.push(object);

            } else {
                // If it wasn't a SPHERE or a MESH, then, huh, who knows, maybe a TORUS :)
            }


        }

        //  Tell the backend what filename to use
        //  (so in theory we can set up sequential files)
        params.filename = 'test';
        control.createScene(params)

    },

    //  A very poor way of checking for the file existing on the back end
    //  In an ideal world we'll have the backend serve up the valid image
    //  but for the moment we are asking if it exists.
    createScene: function(queryObject) {

        var data = "";

        data += this.topBit();
        data += this.image(queryObject.size);
        data += this.addCamera(queryObject.camera);
        data += this.shaders(queryObject.objects);
        data += this.objects(queryObject.objects);

        localStorage.setItem('scene', data);
        $( "#dialog" ).dialog( "open" );

    },

    topBit: function() {

        var d = new Date();

        var comment = '/*\n' +
        '# This is a Sunflow scene description. Do a Select All and Copy & Paste into a text document,\n' +
        '# save as "scene.sc" and load it into Sunflow to be rendered ("Save As..." will not work).\n' +
        '# Sunflow: http://sunflow.sourceforge.net/\n' +
        '# "scene.sc" can be any filename you like, but needs the .sc extension.\n' +
        '#\n' +
        '# Generated by CAT826 Sunflow Filemaker, ' + d + '\n' +
        '# More information...\n' +
        '# Blogpost: \n' +
        '# Github: \n' +
        '*/\n' +
        '\n';

        var x = 'trace-depths {\n' +
            '  diff 4\n' +
            '  refl 3\n' +
            '  refr 2\n' +
            '}\n' +
            '\n' +
            'gi {\n' +
            '   type ambocc\n' +
            '   bright { "sRGB nonlinear" 1 1 1 }\n' +
            '   dark { "sRGB nonlinear" 0 0 0 }\n' +
            '   samples 64\n' +
            '   maxdist 200.0\n' +
            '}\n' +
            '\n' +
            'background {\n' +
            '   color  { "sRGB nonlinear" 0.0 0.0 0.0 }\n' +
            '}\n' +
            '\n' +
            'shader {\n' +
            '  name debug_caustics\n' +
            '  type view-caustics\n' +
            '}\n' +
            '\n' +
            'shader {\n' +
            '  name debug_globals\n' +
            '  type view-global\n' +
            '}\n' +
            '\n' +
            'shader {\n' +
            '  name debug_gi\n' +
            '  type view-irradiance\n' +
            '}\n' +
            'shader {\n' +
            '  name Grey\n' +
            '  type diffuse\n' +
            '  diff 0.7 0.7 0.7\n' +
            '}\n' +
            '\n' +
            'shader {\n' +
            '  name Red\n' +
            '  type diffuse\n' +
            '  diff 0.8 0.0 0.0\n' +
            '}\n' +
            '\n' +
            'shader {\n' +
            '  name DarkGrey\n' +
            '  type diffuse\n' +
            '  diff 0.2 0.2 0.2\n' +
            '}\n' +
//            'object {\n' +
//            '   shader Grey\n' +
//            '   type plane\n' +
//            '   p 0 0 0\n' +
//            '   n 0 0 1\n' +
//            '}\n' +
            '\n';
        return comment + x;

    },

    image: function(sizeNode) {

        var i = 'image {\n' +
            '  resolution ' + Math.floor(sizeNode.width) + ' ' + Math.floor(sizeNode.height) + '\n' +
            '  aa 1 2\n' +
            '  filter gaussian\n' +
            '}\n' +
            '\n';
        return i;

    },

    addCamera: function(cameraNode) {

        //  NOTE!!!
        //  The FOV in Sunflow doesn't seem to be correct, or at least it certainly
        //  doesn't match the output of THREE.js. a fov of 59 is about right for
        //  a ratio of 16:9
        //
        //  I don't know why, one day I'll figure it out but for the moment
        //  be aware that changing the ratio of the canvas we are rendering to
        //  with THREE.js means you'll have to tweek the fov by hand to match
        //  (and it won't be what you expect it to be)
        var position = this.convertPosition(cameraNode.position);
        var lookat = this.convertPosition(cameraNode.lookat);
        var c = 'camera {\n' +
              '  type pinhole\n' +
              '  eye    ' + position.x + ' ' + position.y + ' ' + position.z + '\n' +
              '  target ' + lookat.x + ' ' + lookat.y + ' ' + lookat.z + '\n' +
              '  up     0 0 1\n' +
              '  fov    59\n' +
              '  aspect ' + parseFloat(cameraNode.aspect) + '\n' +
              '}\n' +
              '\n';
        return c;
    },

    shaders: function(objectArray) {

        var o = '';
        var object = null;

        for (var i in objectArray) {
            object = objectArray[i];

            if ('colour' in object) {
                o += 'shader {\n' +
                '  name Object' + i + '\n' +
                '  type diffuse\n' +
                '  diff ' + object.colour.r + ' ' + object.colour.g + ' ' + object.colour.b + '\n' +
                '}\n' +
                '\n';
            } else {
                o += 'shader {\n' +
                '  name Object' + i + '\n' +
                '  type diffuse\n' +
                '  diff 0.7 0.7 0.7\n' +
                '}\n' +
                '\n';           
            }
        }

        return o;
    },

    objects: function(objectArray) {

        var shader = null;
        var o = '';
        var object = null;

        for (var i in objectArray) {
            object = objectArray[i];

            shader = 'Object' + i;
            o += 'object {\n' +
                '  shader ' + shader + '\n';

            //  If it's a sphere then we can easily do that here.
            if (object.type == 'sphere') {
                object.position = this.convertPosition(object.position);

                o += '  type sphere\n' +
                '  c ' + object.position.x + ' ' + object.position.y + ' ' + object.position.z + '\n' +
                '  r ' + object.radius + '\n';
            }

            if (object.type == 'mesh') {

                o += '  type generic-mesh\n' +
                '\n' +
                '  points ' + object.vertices.length + '\n';

                for (var v in object.vertices) {
                    object.vertices[v] = this.convertPosition(object.vertices[v]);
                    o += '    ' + object.vertices[v].x + ' ' + object.vertices[v].y + ' ' + object.vertices[v].z + '\n';
                }

                o += '\n' +
                '  triangles ' + object.faces.length + '\n';

                for (var f in object.faces) {
                    o += '    ' + object.faces[f][0] + ' ' + object.faces[f][1] + ' ' + object.faces[f][2] + '\n';
                }

                o += '  normals none\n';
                o += '  uvs none\n';

            }

            o += '}\n' +
            '\n';
            //  if it's a matrix then that's a little more hard work
            //  CONVERT ALL VERTEX AND FACES HERE

        }

        return o;

    },

    addSphere: function(position, r) {

        position = this.convertPosition(position);

        var shader = 'Grey';
        var o = 'object {\n' +
            '  shader ' + shader + '\n' +
            '  type sphere\n' +
            '  c ' + position.x + ' ' + position.y + ' ' + position.z + '\n' +
            '  r ' + r + '\n' +
            '}\n';
        return o;

    },

    convertPosition: function(position) {

        var newPosition = {
            x: parseFloat(position.x),
            y: parseFloat(-position.z),
            z: parseFloat(position.y)
        };
        return newPosition;

    }    

};

utils = {

    log: function(msg) {

        try {
            console.log(msg);
        } catch(er) {
            //  do nowt
        }

    }

};