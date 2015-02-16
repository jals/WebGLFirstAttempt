
var gl;

function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }

    document.onkeyup = keyUp;
    //document.onkeydown = keyDown;
}

var menuUp = false;
function keyUp(e){
  //  console.log(e.keyCode);
    if(e.keyCode == 77){
        if(menuUp){
            menuUp = false;
            fadeIn(1);
        } else {
            menuUp = true;
            fadeOut(7);
        }
    } else if(e.keyCode == 37){
        console.log('left');
    } else if(e.keyCode == 38){
        console.log('up');
    } else if(e.keyCode == 39){
        console.log('right');
    } else if(e.keyCode == 40){
        console.log('down');
    }
}

function fadeOut(fade){
    setTimeout(function() {
        gl.clearColor(0.1, 0.1, 0.1, fade/10);
        gl.enable(gl.DEPTH_TEST);
        if(fade > 1){
            fadeOut(fade-1);
        }
    }, 25);
}
function fadeIn(fade){
    setTimeout(function() {
        gl.clearColor(0.1, 0.1, 0.1, fade/10);
        gl.enable(gl.DEPTH_TEST);
        if(fade < 7){
            fadeIn(fade+1);
        }
    }, 50);
}

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

var shaderProgram;

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

var textureSettings;
var textureApps;
var textureHome;
var textureTV;
var textureRecordings;
var textureTVShows;
var textureSearch;
var textureBlank;

function initTextures() {
    textureSettings = getTexture("SETTINGS", "img/settings.png");
    textureApps = getTexture("APPS", "img/apps.png");
    textureHome = getTexture("JARRED", "img/Home.png");
    textureTV = getTexture("LIVE TV", "img/Live_TV.png");
    textureRecordings = getTexture("RECORDINGS", "img/recorded.png");
    textureTVShows = getTexture("TV SHOWS", "img/on_demand.png");
    textureSearch = getTexture("SEARCH", "img/search.png");
    textureBlank = getTexture("TEST", "");
}

function getTexture(text, imagePath){
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width  = 200;
    canvas.height = 130;
    var img = new Image();

    ctx.fillStyle = 'white';
    ctx.font = "35px calibri";
    ctx.textAlign = 'center';            
    ctx.fillText(text, 200 / 2, ctx.canvas.height-10);

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([77, 77, 77, 255]));
    texture.image = new Image();
    img.onload = function () {
        ctx.drawImage(img, -17, -4, 200/2-img.width/2, 130/2-img.height/2-5, 0, 0, 200, 100);
        handleTextureLoaded(canvas, texture);
    }    
    img.src = imagePath;
    return texture;
}

function handleTextureLoaded(image, texture) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}


function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}


function degToRad(degrees) {
    return degrees * Math.PI / 180;
}


var cubeVertexPositionBuffer;
var cubeVertexTextureCoordBuffer;
var cubeVertexIndexBuffer;

function initBuffers() {
    cubeVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    vertices = [
        // Front face
        0.0, 0.0, 0.0,
        0.0, -2.0, 0.0,
        2.0, -2.0, 0.0,
        2.0, 0.0, 0.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    cubeVertexPositionBuffer.itemSize = 3;
    cubeVertexPositionBuffer.numItems = 4;

    cubeVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    var textureCoords = [
      // Front face
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    cubeVertexTextureCoordBuffer.itemSize = 2;
    cubeVertexTextureCoordBuffer.numItems = 4;

    cubeVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    var cubeVertexIndices = [
        0, 1, 2, // eg. Draw vertex 0, vertex 1 then vertex 2 to complete a triangle
        0, 2, 3,
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
    cubeVertexIndexBuffer.itemSize = 1;
    cubeVertexIndexBuffer.numItems = 6;

}

var offsetVal = -5.0;
var moveOutOffset1 = offsetVal;
var moveOutOffset2 = offsetVal;
var moveOutOffset3 = offsetVal;
var moveOutOffset4 = offsetVal;

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //mat4.perspective(90, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
    mat4.ortho(-8, 10, -8, 6, 0.1, 100, pMatrix);
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [0.0, moveOutOffset1, -8.0]);

    var diff = 2.1;
    addButton(-3*diff, moveOutOffset4, textureSettings);
    addButton(-2*diff, moveOutOffset3, textureApps);
    addButton(-1*diff, moveOutOffset2, textureHome);
    addButton(0, moveOutOffset1, textureTV);
    addButton(diff, moveOutOffset2, textureRecordings);
    addButton(2*diff, moveOutOffset3, textureTVShows);
    addButton(3*diff, moveOutOffset4, textureSearch);
    addButton(0, moveOutOffset1, textureBlank);
}

function addButton(offset, moveOutOffset, texture){
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [0.0, moveOutOffset, -8.0]);

    mat4.translate(mvMatrix, [offset, 0.0, 0.0]);
    //mat4.scale(mvMatrix, [1.3, 1.1, 0.1]);
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

}

function animate() 
{    if(menuUp){
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
        
    } else {
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
    }
}


function tick() {
    window.webkitRequestAnimationFrame(tick);
    drawScene();
    animate();
}


function webGLStart() {
    var canvas = document.getElementById("canvas");
    initGL(canvas);
    initShaders()
    initBuffers();
    initTextures();

    gl.clearColor(0.1, 0.1, 0.1, 0.5);
    gl.enable(gl.DEPTH_TEST);

    tick();
}
