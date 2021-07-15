window.onload = function() {
    var canvas_mandala = document.getElementById('myCanvas');

    var undo = [];
    var redo = [];
    var mode = "bucket";

    // coloring page
    var mandala = {
        item: null,
        lastClicked: null,
        filePath: '/static/coloring/images/mandala-freepik.svg'
    };

    // color palette
    var cp = {
        history: ["#383838"], // black selected by default
        options: [],
        $container: $('#color-palette')
    }

    function myCustomInteraction() {
        var tool = new paper.Tool();

        tool.onMouseDown = function (event) {
            var hit = mandala.item.hitTest(event.point, { tolerance: 10, fill: true });
            if (hit) {
                // Color pallette keeps track of the full history of colors, though we
                // only color in with the most-recent color.
                if (mode == "eraser") {
                    if (hit.item.fillColor._components[0] != 1 || hit.item.fillColor._components[1] != 1 || hit.item.fillColor._components[2] != 1) {
                        undo.push({"prev_color": hit.item.fillColor, "color": "#fafafa", "point": event.point});
                        hit.item.fillColor = "#fafafa";
                        $("#undo").css("filter", "hue-rotate(336deg) brightness(0%)");
                    }
                } else if (mode == "bucket") {
                    undo.push({"prev_color": hit.item.fillColor, "color": cp.history[cp.history.length - 1], "point": event.point});
                    hit.item.fillColor = cp.history[cp.history.length - 1];
                    $("#undo").css("filter", "hue-rotate(336deg) brightness(0%)");
                }
            }
        }
    }

    // create a color palette with the given colors
    function createColorPalette(colors){

        // create a swatch for each color
        for (var i = colors.length - 1; i >= 0; i--) {
            var $swatch = $("<div>").css("background-color", colors[i])
                               .addClass("swatch");
            $swatch.click(function(){
                // add color to the color palette history
                  cp.history.push($(this).css("background-color"));
            });
            cp.$container.append($swatch);
        }
    }

    // loads a set of colors from a json to create a color palette
    function getColorsCreatePalette(){
        cp.$container.html(" ");
        $.getJSON('/static/coloring/vendors/material/material-colors.json', function(colors){
            var keys = Object.keys(colors);
            for (var i = keys.length - 1; i >= 0; i--) {
                cp.options.push(colors[keys[i]][500]);
            }
            createColorPalette(cp.options);
        });
    }

    function init(custom){
        paper.setup(canvas_mandala);
        // getColorsCreatePalette();

        paper.project.importSVG(mandala.filePath, function(item) {
            mandala.item = item._children["design-freepik"];
            paper.project.insertLayer(0,mandala.item);

            if (custom) {
                myCustomInteraction();
            } else {
                myGradientInteraction();
            }

        });
    }

    // Set up the mandala interactivity.
    init(true);

    var currentColor = 0;

    // source: https://medium.com/@bantic/hand-coding-a-color-wheel-with-canvas-78256c9d7d43
    $(() => {
        let canvas = document.getElementById('canvas');
        let ctx = canvas.getContext("2d");
        
        function drawCircle() {
            let radius = 50;
            let image = ctx.createImageData(2*radius, 2*radius);
            let data = image.data;

            for (let x = -radius; x < radius; x++) {
                for (let y = -radius; y < radius; y++) {
                    
                    let [r, phi] = xy2polar(x, y);
                    
                    if (r > radius) {
                        // skip all (x,y) coordinates that are outside of the circle
                        continue;
                    }
                    
                    let deg = rad2deg(phi);
                    
                    // Figure out the starting index of this pixel in the image data array.
                    let rowLength = 2*radius;
                    let adjustedX = x + radius; // convert x from [-50, 50] to [0, 100] (the coordinates of the image data array)
                    let adjustedY = y + radius; // convert y from [-50, 50] to [0, 100] (the coordinates of the image data array)
                    let pixelWidth = 4; // each pixel requires 4 slots in the data array
                    let index = (adjustedX + (adjustedY * rowLength)) * pixelWidth;
                    
                    let hue = deg;
                    let saturation = r / radius;
                    let value = 1.0;
                    
                    let [red, green, blue] = hsv2rgb(hue, saturation, value);
                    let alpha = 255;
                    
                    data[index] = red;
                    data[index+1] = green;
                    data[index+2] = blue;
                    data[index+3] = alpha;
                }
            }

            ctx.putImageData(image, 100, 17);
        }
        
        function xy2polar(x, y) {
            let r = Math.sqrt(x*x + y*y);
            let phi = Math.atan2(y, x);
            return [r, phi];
        }
        
        // rad in [-π, π] range
        // return degree in [0, 360] range
        function rad2deg(rad) {
            return ((rad + Math.PI) / (2 * Math.PI)) * 360;
        }
        
        drawCircle();
        let radius = 50;
        function getColor(x, y) {
            let [r, phi] = xy2polar(x, y);	
            if (r > radius) {
                return 0;
            }
            let deg = rad2deg(phi);

            let hue = deg;
            let saturation = r / radius;
            let value = 1.0;
            return hsv2rgb(hue, saturation, value);
        }


        var relX = 0;
        var relY = 0;

        var currentColor = "#383838"; // default is black
        var currentSwatch = "swatch-fill-8";

        $('#canvas').click(function (wheel) {
            if (mode == "eraser") {
                return null;
            }

            var posX = $(this).offset().left
            var posY = $(this).offset().top;
            relX = wheel.pageX - posX - radius;
            relY = wheel.pageY - posY - radius;
            currentColor = getColor(relX, relY); // color saved for use!
            currentColor = rgbToHex(currentColor[0], currentColor[1], currentColor[2]);
            $("#" + currentSwatch).css("border-left", "0.2rem solid " + currentColor);
            
            var swatch_id = "#swatch-" + currentSwatch[currentSwatch.length - 1];
            $(swatch_id).css("background-color", currentColor);
            cp.history.push(currentColor);
        });

        var drawer_open = false;
        $('#open-drawer').click(function (drawer) {
            if (drawer_open) {
                $(".palette").css("transform", "translateX(330px)");
                $("#open-drawer").css("transform", "rotate(0deg)")
            } else {
                $(".palette").css("transform", "translateX(0px)");
                $("#open-drawer").css("transform", "rotate(180deg)")
            }
            drawer_open = !drawer_open;	
        });

        swatch_to_color = {"swatch-fill-1": "#E73F3F", "swatch-fill-2": "#F49238", "swatch-fill-3": "#FFD467", "swatch-fill-4": "#7ED95E", 
            "swatch-fill-5": "#4791E9", "swatch-fill-6": "#B550D9", "swatch-fill-7": "#AC5D4B", "swatch-fill-8": "#383838"};

        $('.swatch').click(function (drawer) {
            if (mode == "eraser") {
                return null;
            }

            var clicked_id = $(this).attr('id');
            $(this).css("border-left", "0.2rem solid " + swatch_to_color[clicked_id]);
            $("#" + currentSwatch).css("border-left", "0.2rem solid " + currentColor + "00");
            currentColor = swatch_to_color[clicked_id];
            currentSwatch = clicked_id;
            cp.history.push(currentColor);
        });

        $('#reset-button').click(function (reset) {
            for (var i=1; i<=8; i++) {
                var reset_color = swatch_to_color["swatch-fill-" + i.toString()];
                $("#swatch-" + i.toString()).css("background-color", reset_color);
                $("#swatch-fill-" + i.toString()).css("border-left", "0.2rem solid " + reset_color + "00");
            }
            $("#swatch-fill-8").css("border-left", "0.2rem solid #383838");
            currentSwatch = "swatch-fill-8";
            currentColor = "#383838";
            cp.history.push(currentColor);
        });

        $('#undo').click(function () {
            if (undo.length == 0) {
                return null;
            } else if (undo.length == 1) {
                $("#undo").css("filter", "hue-rotate(219deg)");
                // $("#undo").css("color", "#E5E5E5");
            }

            var action = undo[undo.length-1];
            var hit = mandala.item.hitTest(action["point"], { tolerance: 10, fill: true });
            if (hit) {
                hit.item.fillColor = action["prev_color"];
            }
            
            undo.pop()
            redo.push({"color": action["color"], "point": action["point"]});
            $("#redo").css("filter", "hue-rotate(336deg) brightness(0%)");
            
        });

        $('#redo').click(function () {
            if (redo.length == 0) {
                return null;
            } else if (redo.length == 1) {
                $("#redo").css("filter", "hue-rotate(219deg)");
            }

            var action = redo[redo.length-1];
            var hit = mandala.item.hitTest(action["point"], { tolerance: 10, fill: true });
            
            undo.push({"prev_color": hit.item.fillColor, "color": action["color"], "point": action["point"]});
            $("#undo").css("filter", "hue-rotate(336deg) brightness(0%)");
            if (hit) {
                hit.item.fillColor = action["color"];
            }
            redo.pop();
        });

        $('#eraser').click(function () {

            if ((mode != 'eraser') || ($('.tool').hasClass('open-tool-bar'))) {
                $("#" + mode).removeClass("using");
                $("#eraser").addClass("using");
                mode = 'eraser';
                $("#" + currentSwatch).css("border-left", "0.2rem solid " + currentColor + "00");
                $('.tool').removeClass('open-tool-bar');
            }
            else {
                $('.tool').addClass('open-tool-bar');
            }
        });

        $('#bucket').click(function () {
            if ((mode != 'bucket') || ($('.tool').hasClass('open-tool-bar'))) {
                $("#" + mode).removeClass("using");
                $("#bucket").addClass("using");
                mode = 'bucket';
                $("#" + currentSwatch).css("border-left", "0.2rem solid " + currentColor);
                $('.tool').removeClass('open-tool-bar');
            }
            else {
                $('.tool').addClass('open-tool-bar');
            }
            
        });

        $('#brush').click(function () {
            mode = 'brush';

            
        });

        $('#add-time').click(function () {
            $("#dialog").css("visibility", "hidden");
            var tens_min = parseInt($("#tens_min").val(), 10);
            var ones_min = parseInt($("#ones_min").val(), 10);
            var tens_sec = parseInt($("#tens_sec").val(), 10);
            var ones_sec = parseInt($("#ones_sec").val(), 10);
            var total_sec = tens_min * 600 + ones_min * 60 + tens_sec * 10 + ones_sec;
            run_timer(total_sec, false);
        });

        $('#tens_min').keypress(function() {
            var self = $(this);
            setTimeout(function() {
                if (self.val().length > 0) {
                    $('#ones_min').focus();
                }
            }, 1);
        });

        $('#ones_min').keypress(function() {
            var self = $(this);
            setTimeout(function() {
                if (self.val().length > 0) {
                    $('#tens_sec').focus();
                }
            }, 1);
        });

        $('#tens_sec').keypress(function() {
            var self = $(this);
            setTimeout(function() {
                if (self.val().length > 0) {
                    $('#ones_sec').focus();
                }
            }, 1);
        });

        // source: https://www.w3docs.com/snippets/javascript/how-to-convert-rgb-to-hex-and-vice-versa.html
        function rgbToHex(r, g, b) {
              return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).split(".")[0];
        }

    });

    // hue in range [0, 360]
    // saturation, value in range [0,1]
    // return [r,g,b] each in range [0,255]
    // See: https://en.wikipedia.org/wiki/HSL_and_HSV#From_HSV
    function hsv2rgb(hue, saturation, value) {
        let chroma = value * saturation;
        let hue1 = hue / 60;
        let x = chroma * (1- Math.abs((hue1 % 2) - 1));
        let r1, g1, b1;
        if (hue1 >= 0 && hue1 <= 1) {
            ([r1, g1, b1] = [chroma, x, 0]);
        } else if (hue1 >= 1 && hue1 <= 2) {
            ([r1, g1, b1] = [x, chroma, 0]);
        } else if (hue1 >= 2 && hue1 <= 3) {
            ([r1, g1, b1] = [0, chroma, x]);
        } else if (hue1 >= 3 && hue1 <= 4) {
            ([r1, g1, b1] = [0, x, chroma]);
        } else if (hue1 >= 4 && hue1 <= 5) {
            ([r1, g1, b1] = [x, 0, chroma]);
        } else if (hue1 >= 5 && hue1 <= 6) {
            ([r1, g1, b1] = [chroma, 0, x]);
        }
        
        let m = value - chroma;
        let [r,g,b] = [r1+m, g1+m, b1+m];
        
        // Change r,g,b values from [0,1] to [0,255]
        return [255*r,255*g,255*b];
    }

    $(".pre-made").click(function(){
        // add color to the color palette history
        $(".unavailable").css("visibility", "visible")
    });

    $("#bummer").click(function(){
        // add color to the color palette history
        $(".unavailable").css("visibility", "hidden")
    });
}

