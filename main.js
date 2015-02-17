/**
* @author Jarred Linthorne
*   This file contains all of the javascript functionality of the program.
*   Ideally, this should be split up across multiple files.
*   There are several keyboard commands that can be used. They are:
*       -m: Toggle the menu on and off. 
*       -g: Toggle the image textures between white and green colour.
*       -v: Switch between video and image backgrounds. 
*       -arrow keys: navigate menu. 
*            Left/Right to navigate to different menu options
*            Up/Down to navigate to different sub-menu options
*/

//Global Variables
var gl;
var menuUp = true;
var selected = 3;
var subSelected = 0;
var subSelectedArray = [0, 4, 4, 2, 2, 2, 4];
var oldSelected = -1;
var selectionChanged = false;
var green = false;
var videoShown = false;
var shaderProgram;
var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();
var squareVertexPositionBuffer;
var squareVertexTextureCoordBuffer;
var squareVertexIndexBuffer;
var offsetVal = -5.0;
var moveOutOffset1 = offsetVal;
var moveOutOffset2 = offsetVal;
var moveOutOffset3 = offsetVal;
var moveOutOffset4 = offsetVal;
var subMoveOutOffsetCurrent = offsetVal;
var subMoveOutOffsetCurrent2 = offsetVal;
var subMoveOutOffsetCurrent3 = offsetVal;
var subMoveOutOffsetCurrent4 = offsetVal;
var subMoveOutOffsetOld = -6.6;
var subMoveOutOffsetOld2 = -6.6;
var subMoveOutOffsetOld3 = -6.6;
var subMoveOutOffsetOld4 = -6.6;
var bounceVal = [0, 0, 0, 0, 0, 0, 0];
//Each of the texture variables, should probably be put into one data structure
var textureSettings;
var textureApps;
var textureHome;
var textureTV;
var textureRecordings;
var textureTVShows;
var textureSearch;
var subTextureApps1;
var subTextureApps2;
var subTextureApps3;
var subTextureApps4;
var subTextureHome1;
var subTextureHome2;
var subTextureHome3;
var subTextureHome4;
var subTextureTV1;
var subTextureTV2;
var subTextureRecordings1;
var subTextureRecordings2;
var subTextureTVShows1;
var subTextureTVShows2;
var subTextureSearch1;
var subTextureSearch2;
var subTextureSearch3;
var subTextureSearch4;

/**
 * This function is used to set the gl variable that is used throughout the code.
 * @method initGL
 * @param {} canvas
 */
function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL");
    }
}

/**
 * Debounce function to prevent multiple key presses at once.
 * Adapted from https://remysharp.com/2010/07/21/throttling-function-calls
 * @method debounce
 * @param {} fn : The keyUp function
 * @return FunctionExpression
 */
function debounce(fn) {
  var timer = null;
  return function () {
    var context = this, args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, 250);
  };
}

/**
 * Key up function used to translate MenuItem presses to commands.
 * @method keyUp
 * @param {} e : The keyboard event
 */
function keyUp(e){
    if(e.keyCode == 77){ //m
        if(menuUp){             //toggle menu
            selected = -1;      //reset selected menu
            oldSelected = -1;   //reset old selected menu
            menuUp = false;     
            fadeOut(7);         //fade out the menu(remove the tint)
        } else {
            selected = 3;       //menu item 3 is the default option
            resetVariables();   //reset common variables
            menuUp = true; 
            fadeIn(1);          //fade in the menu(add the tint)
        }
    } else if(e.keyCode == 37){ //left
        //Only move the selection left if the menu is up and the selection isn't the leftmost one
        if(menuUp && selected > 0){ 
            oldSelected = selected;
            selected -=1 ;
            resetVariables();
            bounce()        //simulate a bounce every time the selection changes
        }
    } else if(e.keyCode == 38){ //up
        //Only move the selection up if the menu is up and the subselection doesn't exceed the total for that menu
        if(menuUp && subSelected < subSelectedArray[selected]){ //
            subSelected+=1;
        }
    } else if(e.keyCode == 39){ //right
        //Only move the selection right if the menu is up and the selection isn't the rightmost one
        if(menuUp && selected < 6){ 
            oldSelected = selected;
            selected += 1;
            resetVariables();
            bounce();
        }
    } else if(e.keyCode == 40){ //down
        //Only move the selection down if the menu is up and the subselection is greater than 0
        if(menuUp && subSelected > 0){
            subSelected-=1;
        }
    } else if(e.keyCode == 71){ //g
        if(green){              //toggle the icons to switch between green and white
            green = false;
        } else {
            green = true;
        }
    } else if(e.keyCode == 86){ //v
        if(videoShown){         //toggle the background, switching between image and video
            document.getElementById('bkgd').removeAttribute('hidden');
            document.getElementById('bkgd2').setAttribute('hidden', true);
            videoShown = false;
        } else {
            document.getElementById('bkgd2').removeAttribute('hidden');
            document.getElementById('bkgd').setAttribute('hidden', true);
            videoShown = true;
        }
        
    }
    initTextures();     //re-initialize the textures to show the selection box and switch between green/white if applicable
}

/**
 * Reset the variables that are used for spacing.
 * @method resetVariables
 */
function resetVariables(){
    selectionChanged = true;
    subSelected = 0;
    subMoveOutOffsetCurrent = -6.6;
    subMoveOutOffsetCurrent2 = -6.6;
    subMoveOutOffsetCurrent3 = -6.6;
    subMoveOutOffsetCurrent4 = -6.6;
    subMoveOutOffsetOld = -5.4;
    subMoveOutOffsetOld2 = -5.4;
    subMoveOutOffsetOld3 = -5.4;
    subMoveOutOffsetOld4 = -5.4;
}

/**
 * Fade out method, used to remove the artificial tint over the video.
 * @method fadeOut
 * @param {} fade : The amount to fade out by.
 */
function fadeOut(fade){
    setTimeout(function() {     //Doing a recursive call allows a gradual fade to occur
        gl.clearColor(0.1, 0.1, 0.1, fade/10);
        gl.enable(gl.DEPTH_TEST);
        if(fade > 1){
            fadeOut(fade-1);
        }
    }, 25);     //Fade out quicker than fade in to resume viewing experience quicker
}

/**
 * Fade in method, used to add the artificial tint over the video.
 * @method fadeIn
 * @param {} fade : The amount to fade in by.
 */
function fadeIn(fade){
    setTimeout(function() {
        gl.clearColor(0.1, 0.1, 0.1, fade/10);
        gl.enable(gl.DEPTH_TEST);
        if(fade < 7){
            fadeIn(fade+1);
        }
    }, 50);
}

/**
 * Used to get the shaders defined in index.html
 * @method getShader
 * @param {} gl
 * @param {} id
 * @return shader
 */
function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }
    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }
    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

/**
 * Initializes the shaders defined in index.html
 * @method initShaders
 */
function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
    gl.useProgram(shaderProgram);
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
}


/**
 * The function to initialize the shaders. Sets the texture variables to their appropriate image/text combination.
 * @method initTextures
 */
function initTextures() {
    //Main menu textures
    if(green){
        //Set the texture with a specific text, an image url, and a boolean condition to determine if the texture is currently selected
        textureSettings = getTexture("SETTINGS", "img/settings_gr.png", selected == 0 && subSelected == 0); 
        textureApps = getTexture("APPS", "img/apps_gr.png", selected == 1 && subSelected == 0); 
        textureHome = getTexture("JARRED", "img/Home_gr.png", selected == 2 && subSelected == 0); 
        textureTV = getTexture("LIVE TV", "img/Live_TV_gr.png", selected == 3 && subSelected == 0); 
        textureRecordings = getTexture("RECORDINGS", "img/recorded_gr.png", selected == 4 && subSelected == 0); 
        textureTVShows = getTexture("TV SHOWS", "img/on_demand_gr.png", selected == 5 && subSelected == 0); 
        textureSearch = getTexture("SEARCH", "img/search_gr.png", selected == 6 && subSelected == 0); 
    } else {
        textureSettings = getTexture("SETTINGS", "img/settings.png", selected == 0 && subSelected == 0); 
        textureApps = getTexture("APPS", "img/apps.png", selected == 1 && subSelected == 0); 
        textureHome = getTexture("JARRED", "img/Home.png", selected == 2 && subSelected == 0); 
        textureTV = getTexture("LIVE TV", "img/Live_TV.png", selected == 3 && subSelected == 0); 
        textureRecordings = getTexture("RECORDINGS", "img/recorded.png", selected == 4 && subSelected == 0); 
        textureTVShows = getTexture("TV SHOWS", "img/on_demand.png", selected == 5 && subSelected == 0); 
        textureSearch = getTexture("SEARCH", "img/search.png", selected == 6 && subSelected == 0); 
    }
    //Submenu textures
    subTextureApps1 = getIconTexture("img/youtube.png", selected == 1 && subSelected == 1);
    subTextureApps2 = getIconTexture("img/netflix.png", selected == 1 && subSelected == 2);
    subTextureApps3 = getIconTexture("img/soccer.png", selected == 1 && subSelected == 3);
    subTextureApps4 = getIconTexture("img/ski.png", selected == 1 && subSelected == 4);
    subTextureHome1 = getText("FAMILY", selected == 2 && subSelected == 1);
    subTextureHome2 = getText("ANDREA", selected == 2 && subSelected == 2);
    subTextureHome3 = getText("COOPER", selected == 2 && subSelected == 3);
    subTextureHome4 = getText("OPTIONS", selected == 2 && subSelected == 4);
    subTextureTV1 = getText("GUIDE", selected == 3 && subSelected == 1);
    subTextureTV2 = getText("WHAT'S ON", selected == 3 && subSelected == 2);
    subTextureRecordings1 = getText("SETUP", selected == 4 && subSelected == 1);
    subTextureRecordings2 = getText("RECENT", selected == 4 && subSelected == 2);
    subTextureTVShows1 = getText("POPULAR", selected == 5 && subSelected == 1);
    subTextureTVShows2 = getText("FAVOURITES", selected == 5 && subSelected == 2);
    subTextureSearch1 = getText("DISTRICT B13", selected == 6 && subSelected == 1);
    subTextureSearch2 = getText("PARKOUR", selected == 6 && subSelected == 2);
    subTextureSearch3 = getText("NETFLIX", selected == 6 && subSelected == 3);
    subTextureSearch4 = getText("CLEAR RECENT", selected == 6 && subSelected == 4);
}

/**
 * Helper function to create a texture with text and an image.
 * @method getTexture
 * @param {} text : The text to place under the image.
 * @param {} imagePath : The url to the image.
 * @param {} isSelected : Boolean condition to determine if the texture is currently selected in the menu.
 * @return texture : The finalized texture.
 */
function getTexture(text, imagePath, isSelected){
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width  = 200;
    canvas.height = 130;
    var img = new Image();
    //If the texture is selected, apply a turquoise tint over it with alpha to make it slightly transparent
    if(isSelected){
        ctx.fillStyle = 'rgba(29, 136, 114, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    //The stylings for the font used in the text
    ctx.fillStyle = 'white';
    ctx.font = "35px calibri";
    ctx.textAlign = 'center';            
    ctx.fillText(text, ctx.canvas.width/2, ctx.canvas.height-10);
    //Create the GL texture
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([77, 77, 77, 255]));
    texture.image = new Image();
    img.onload = function () {
        ctx.drawImage(img, -17, -4, ctx.canvas.width/2-img.width/2, ctx.canvas.height/2-img.height/2-5, 0, 0, 200, 100);
        handleTextureLoaded(canvas, texture);   //combine the canvas with the texture
    }    
    img.src = imagePath;
    return texture;
}

/**
 * Helper function to create a texture just an image.
 * @method getIconTexture
 * @param {} imagePath : The url to the image.
 * @param {} isSelected : Boolean condition to determine if the texture is currently selected in the menu.
 * @return texture : The finalized texture.
 */
function getIconTexture(imagePath, isSelected){
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width  = 200;
    canvas.height = 150;
    var img = new Image();
    if(isSelected){
        ctx.fillStyle = 'rgba(29, 136, 114, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([77, 77, 77, 255]));
    texture.image = new Image();
    img.onload = function () {
        ctx.drawImage(img, -5, -2, ctx.canvas.width/2-img.width/2, ctx.canvas.height/2-img.height/2, 0, 0, 250, 140);
        handleTextureLoaded(canvas, texture);
    }    
    img.src = imagePath;
    return texture;
}

/**
 * Helper function to create a texture with just text.
 * @method getText
 * @param {} text : The text to place.
 * @param {} isSelected : Boolean condition to determine if the texture is currently selected in the menu.
 * @return texture : The finalized texture.
 */
function getText(text, isSelected){
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width  = 200;
    canvas.height = 50;
    var img = new Image();
    if(isSelected){
        ctx.fillStyle = 'rgba(29, 136, 114, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.fillStyle = 'white';
    ctx.font = "30px calibri";
    ctx.textAlign = 'center';            
    ctx.fillText(text, ctx.canvas.width / 2, ctx.canvas.height-14);
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255]));
    handleTextureLoaded(canvas, texture);
    return texture;
}

/**
 * Used to combine the canvas with the texture.
 * @method handleTextureLoaded
 * @param {} canvas
 * @param {} texture
 */
function handleTextureLoaded(canvas, texture) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);   //Must flip the image in Y-coordinate, since images and gl use different corners for their (0,0) point
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

/**
 * @method setMatrixUniforms
 * @return 
 */
function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

/**
 * Initialize the buffer data for the squares.
 * @method initBuffers
 */
function initBuffers() {
    squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    vertices = [
        0.0, 0.0, 0.0,
        0.0, -2.0, 0.0,
        2.0, -2.0, 0.0,
        2.0, 0.0, 0.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    squareVertexPositionBuffer.itemSize = 3;
    squareVertexPositionBuffer.numItems = 4;

    squareVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexTextureCoordBuffer);
    var textureCoords = [
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    squareVertexTextureCoordBuffer.itemSize = 2;
    squareVertexTextureCoordBuffer.numItems = 4;

    squareVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareVertexIndexBuffer);
    var cubeVertexIndices = [
        0, 1, 2,
        0, 2, 3,
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
    squareVertexIndexBuffer.itemSize = 1;
    squareVertexIndexBuffer.numItems = 6;
}

/**
 * Bounce function. Figures out if a small/big bounce should occur, and if it is left or right of the current selection.
 * @method bounce 
 */
function bounce(){
    var index;
    for(index = 0; index < 7; index++){     //Iterate through each menu item
        if((oldSelected - selected) > 0){   //If this is true, the selection came from the right (moving left)
            if(index < selected){           //If the menu item is left of the current selection, do a small bounce
                negSmallBounce(index);
            } else if(index > selected){
                posBigBounce(index);
            }
        } else {
            if(index < selected){
                negBigBounce(index);
            } else if(index > selected){
                posSmallBounce(index);
            }
        }
    }
}

//These functions could certainly be collapsed and simplified.
//The aim was to have a gradual shift while bouncing to keep the animation smooth.

/**
 * Bounce a small amount on the negative side(to left of selection)
 * @method negSmallBounce
 * @param {} index : The menu item to bounce
 */
function negSmallBounce(index){
    bounceVal[index] = -0.1;
    setTimeout(function(){
        bounceVal[index] = -0.2;
        setTimeout(function(){
            bounceVal[index] = -0.3;
            setTimeout(function(){
                bounceVal[index] = -0.2;
                setTimeout(function(){
                    bounceVal[index] = -0.1;
                    setTimeout(function(){
                        bounceVal[index] = 0.0;
                    }, 50);
                }, 50);
            }, 50);
        }, 50);
    }, 50);
}

/**
 * Bounce a large amount on the negative side(to left of selection)
 * @method negBigBounce
 * @param {} index : The menu item to bounce
 */
function negBigBounce(index){
    bounceVal[index] = -0.1;
    setTimeout(function(){
        bounceVal[index] = -0.2;
        setTimeout(function(){
            bounceVal[index] = -0.3;
            setTimeout(function(){
                bounceVal[index] = -0.4;
                setTimeout(function(){
                    bounceVal[index] = -0.5;
                    setTimeout(function(){
                        bounceVal[index] = -0.4;
                        setTimeout(function(){
                            bounceVal[index] = -0.3;
                            setTimeout(function(){
                                bounceVal[index] = -0.2;
                                setTimeout(function(){
                                    bounceVal[index] = -0.1;
                                    setTimeout(function(){
                                        bounceVal[index] = 0.0;
                                    }, 50);
                                }, 50);
                            }, 50);
                        }, 50);
                    }, 50);
                }, 50);
            }, 50);
        }, 50);
    }, 50);
}

/**
 * Bounce a small amount on the positive side(to right of selection)
 * @method posSmallBounce
 * @param {} index : The menu item to bounce
 */
function posSmallBounce(index){
    bounceVal[index] = 0.1;
    setTimeout(function(){
        bounceVal[index] = 0.2;
        setTimeout(function(){
            bounceVal[index] = 0.3;
            setTimeout(function(){
                bounceVal[index] = 0.2;
                setTimeout(function(){
                    bounceVal[index] = 0.1;
                    setTimeout(function(){
                        bounceVal[index] = 0.0;
                    }, 50);
                }, 50);
            }, 50);
        }, 50);
    }, 50);
}

/**
 * Bounce a large amount on the positive side(to right of selection)
 * @method posBigBounce
 * @param {} index : The menu item to bounce
 * @return 
 */
function posBigBounce(index){
    bounceVal[index] = 0.1;
    setTimeout(function(){
        bounceVal[index] = 0.2;
        setTimeout(function(){
            bounceVal[index] = 0.3;
            setTimeout(function(){
                bounceVal[index] = 0.4;
                setTimeout(function(){
                    bounceVal[index] = 0.5;
                    setTimeout(function(){
                        bounceVal[index] = 0.4;
                        setTimeout(function(){
                            bounceVal[index] = 0.3;
                            setTimeout(function(){
                                bounceVal[index] = 0.2;
                                setTimeout(function(){
                                    bounceVal[index] = 0.1;
                                    setTimeout(function(){
                                        bounceVal[index] = 0.0;
                                    }, 50);
                                }, 50);
                            }, 50);
                        }, 50);
                    }, 50);
                }, 50);
            }, 50);
        }, 50);
    }, 50);
}

/**
 * Draw the scene. Draw all menu items and submenu items.
 * @method drawScene
 */
function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //Use orthographic projection
    mat4.ortho(-8, 10, -8, 6, 0.1, 100, pMatrix);
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [0.0, moveOutOffset1, -8.0]);
    var diff = 2.1;
    var diff2 = 0.87;
    //Add the main menu items
    addMenuItem(-3*diff + bounceVal[0], 0, moveOutOffset4, textureSettings, false, false);
    addMenuItem(-2*diff + bounceVal[1], 0, moveOutOffset3, textureApps, false, false);
    addMenuItem(-1*diff + bounceVal[2], 0, moveOutOffset2, textureHome, false, false);
    addMenuItem(0 + bounceVal[3], 0, moveOutOffset1, textureTV, false, false);
    addMenuItem(diff + bounceVal[4], 0, moveOutOffset2, textureRecordings, false, false);
    addMenuItem(2*diff + bounceVal[5], 0, moveOutOffset3, textureTVShows, false, false);
    addMenuItem(3*diff + bounceVal[6], 0, moveOutOffset4, textureSearch, false, false);
    //Depending on whether or not it is selected, display the submenus
    if(selected == 1){
        addMenuItem(-2*diff + bounceVal[1], 1.5, subMoveOutOffsetCurrent, subTextureApps1, false, true); 
        addMenuItem(-2*diff + bounceVal[1] + diff/2, 1.5, subMoveOutOffsetCurrent, subTextureApps2, false, true); 
        addMenuItem(-2*diff + bounceVal[1], 2*1.5, subMoveOutOffsetCurrent, subTextureApps3, false, true); 
        addMenuItem(-2*diff + bounceVal[1] + diff/2, 2*1.5, subMoveOutOffsetCurrent, subTextureApps4, false, true); 
    } else if(selected == 2){
        addMenuItem(-1*diff + bounceVal[2], diff2, subMoveOutOffsetCurrent, subTextureHome1, true, false);
        addMenuItem(-1*diff + bounceVal[2], 2*diff2, subMoveOutOffsetCurrent2, subTextureHome2, true, false);
        addMenuItem(-1*diff + bounceVal[2], 3*diff2, subMoveOutOffsetCurrent3, subTextureHome3, true, false);
        addMenuItem(-1*diff + bounceVal[2], 4*diff2, subMoveOutOffsetCurrent4, subTextureHome4, true, false);
    } else if(selected == 3){
        addMenuItem(0 + bounceVal[3], diff2, subMoveOutOffsetCurrent, subTextureTV1, true, false);
        addMenuItem(0 + bounceVal[3], 2*diff2, subMoveOutOffsetCurrent2, subTextureTV2, true, false);
    } else if(selected == 4){
        addMenuItem(diff + bounceVal[4], diff2, subMoveOutOffsetCurrent, subTextureRecordings1, true, false);
        addMenuItem(diff + bounceVal[4], 2*diff2, subMoveOutOffsetCurrent2, subTextureRecordings2, true, false);
    } else if(selected == 5){
        addMenuItem(2*diff + bounceVal[5], diff2, subMoveOutOffsetCurrent, subTextureTVShows1, true, false);
        addMenuItem(2*diff + bounceVal[5], 2*diff2, subMoveOutOffsetCurrent2, subTextureTVShows2, true, false);
    } else if(selected == 6){
        addMenuItem(3*diff + bounceVal[6], diff2, subMoveOutOffsetCurrent, subTextureSearch1, true, false);
        addMenuItem(3*diff + bounceVal[6], 2*diff2, subMoveOutOffsetCurrent2, subTextureSearch2, true, false);
        addMenuItem(3*diff + bounceVal[6], 3*diff2, subMoveOutOffsetCurrent3, subTextureSearch3, true, false);
        addMenuItem(3*diff + bounceVal[6], 4*diff2, subMoveOutOffsetCurrent4, subTextureSearch4, true, false);
    }
    //Used to show the animation of the submenu disappearing
    if(oldSelected == 1){
        addMenuItem(-2*diff + bounceVal[1], 1.5, subMoveOutOffsetOld, subTextureApps1, false, true);
        addMenuItem(-2*diff + bounceVal[1] + diff/2, 1.5, subMoveOutOffsetOld, subTextureApps2, false, true);
        addMenuItem(-2*diff + bounceVal[1], 2*1.5, subMoveOutOffsetOld, subTextureApps3, false, true);
        addMenuItem(-2*diff + bounceVal[1] + diff/2, 2*1.5, subMoveOutOffsetOld, subTextureApps4, false, true);
    } else if(oldSelected == 2){
        addMenuItem(-1*diff + bounceVal[2], diff2, subMoveOutOffsetOld, subTextureHome1, true, false);
        addMenuItem(-1*diff + bounceVal[2], 2*diff2, subMoveOutOffsetOld2, subTextureHome2, true, false);
        addMenuItem(-1*diff + bounceVal[2], 3*diff2, subMoveOutOffsetOld3, subTextureHome3, true, false);
        addMenuItem(-1*diff + bounceVal[2], 4*diff2, subMoveOutOffsetOld4, subTextureHome4, true, false);
    } else if(oldSelected == 3){
        addMenuItem(0 + bounceVal[3], diff2, subMoveOutOffsetOld, subTextureTV1, true, false);
        addMenuItem(0 + bounceVal[3], 2*diff2, subMoveOutOffsetOld2, subTextureTV2, true, false);
    } else if(oldSelected == 4){
        addMenuItem(diff + bounceVal[4], diff2, subMoveOutOffsetOld, subTextureRecordings1, true, false);
        addMenuItem(diff + bounceVal[4], 2*diff2, subMoveOutOffsetOld2, subTextureRecordings2, true, false);
    } else if(oldSelected == 5){
        addMenuItem(2*diff + bounceVal[5], diff2, subMoveOutOffsetOld, subTextureTVShows1, true, false);
        addMenuItem(2*diff + bounceVal[5], 2*diff2, subMoveOutOffsetOld2, subTextureTVShows2, true, false);
    } else if(oldSelected == 6){
        addMenuItem(3*diff + bounceVal[6], diff2, subMoveOutOffsetOld, subTextureSearch1, true, false);
        addMenuItem(3*diff + bounceVal[6], 2*diff2, subMoveOutOffsetOld2, subTextureSearch2, true, false);
        addMenuItem(3*diff + bounceVal[6], 3*diff2, subMoveOutOffsetOld3, subTextureSearch3, true, false);
        addMenuItem(3*diff + bounceVal[6], 4*diff2, subMoveOutOffsetOld4, subTextureSearch4, true, false);
    }
}

/**
 * Add the menu item items.
 * @method addMenuItem
 * @param {} offset : The x-offset, used to move items horizantally.
 * @param {} heightOffset: The y-offset, used to move items vertically.
 * @param {} moveOutOffset: Offset used for animations.
 * @param {} texture : The texture for the menu item.
 * @param {} isSmaller : This refers to the smaller rectangle submenus
 * @param {} isSmallest : This refers to the smallest square submenus
 */
function addMenuItem(offset, heightOffset, moveOutOffset, texture, isSmaller, isSmallest){
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [offset, moveOutOffset+heightOffset, -0.1]);
    //Scale accordingly with the submenus
    if(isSmaller){
        mat4.scale(mvMatrix, [1.0, 0.4, 1.0]);
    } else if(isSmallest){
         mat4.scale(mvMatrix, [0.5, 0.7, 1.0]);
    }
    //Bind each of the buffers, and set the pointers
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, squareVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareVertexIndexBuffer);
    setMatrixUniforms();
    //Draw everything!
    gl.drawElements(gl.TRIANGLES, squareVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

}

/**
 * Animate the items.
 * @method animate
 */
function animate(){
    if(menuUp){
        //Move each of the menu items in turn
         if(moveOutOffset1 < offsetVal){
            moveOutOffset1+=0.4; 
            setTimeout(function() {
                moveOutOffset2+=0.4;
                setTimeout(function() {
                    moveOutOffset3+=0.4;
                    setTimeout(function() {
                        moveOutOffset4+=0.4;
                    }, 100);
                }, 100);
            }, 100);
        }
        if(selectionChanged){
            //Move one submenu up, and another down
            if(subMoveOutOffsetCurrent < -5.0 && subMoveOutOffsetOld > -6.6){
                subMoveOutOffsetCurrent+=0.2;
                setTimeout(function() {
                    subMoveOutOffsetCurrent2+=0.2;
                    setTimeout(function() {
                        subMoveOutOffsetCurrent3+=0.2;
                        setTimeout(function() {
                            subMoveOutOffsetCurrent4+=0.2;
                        }, 50);
                    }, 50);
                }, 50);
                subMoveOutOffsetOld-=0.2;
                setTimeout(function() {
                    subMoveOutOffsetOld2-=0.2;
                    setTimeout(function() {
                        subMoveOutOffsetOld3-=0.2;
                        setTimeout(function() {
                            subMoveOutOffsetOld4-=0.2;
                        }, 50);
                    }, 50);
                }, 50);
            } else if (subMoveOutOffsetCurrent >= -5.0 && subMoveOutOffsetOld > -6.6){
                subMoveOutOffsetOld-=0.2;
                 setTimeout(function() {
                    subMoveOutOffsetOld2-=0.2;
                    setTimeout(function() {
                        subMoveOutOffsetOld3-=0.2;
                        setTimeout(function() {
                            subMoveOutOffsetOld4-=0.2;
                        }, 50);
                    }, 50);
                }, 50);
            } else if (subMoveOutOffsetCurrent < -5.0 && subMoveOutOffsetOld <= -6.6){
                subMoveOutOffsetCurrent+=0.2;
                setTimeout(function() {
                    subMoveOutOffsetCurrent2+=0.2;
                    setTimeout(function() {
                        subMoveOutOffsetCurrent3+=0.2;
                        setTimeout(function() {
                            subMoveOutOffsetCurrent4+=0.2;
                        }, 50);
                    }, 50);
                }, 50);
            } else {
                oldSelected = -1;
                selectionChanged = false;
            }
        }
    } else {
        if(moveOutOffset1 > -10){
            moveOutOffset1-=0.8; 
            setTimeout(function() {
                moveOutOffset2-=0.8;
                setTimeout(function() {
                    moveOutOffset3-=0.8;
                    setTimeout(function() {
                        moveOutOffset4-=0.8;
                    }, 50);
                }, 50);
            }, 50);
        }
    }
}

/**
 * Called on every tick to redraw the scene and animate.
 * @method tick
 */
function tick() {
    window.webkitRequestAnimationFrame(tick);
    drawScene();
    animate();
}

/**
 * Initialize everything.
 * @method webGLStart
 */
function webGLStart() {
    document.getElementById('bkgd2').setAttribute('hidden', true);  //Hide the video initially
    document.onkeyup = debounce(keyUp); //Call this method on every key up event
    var canvas = document.getElementById("canvas");
    initGL(canvas);
    initShaders()
    initBuffers();
    initTextures();
    gl.clearColor(0.1, 0.1, 0.1, 0.5);  //Make the canvas translucent to see the background image/video
    gl.enable(gl.DEPTH_TEST);
    tick();
}