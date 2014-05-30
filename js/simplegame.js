var makeGame = function(_debug) {
	var server = makeServerState();
	var engine = makeEngine(document.getElementById("example"));
	engine.start();
	var calibrator = undefined;
	var maxTime = 50*1000;
	var score = 0;
	var mousehit = [];
	var finished = false;

	// if debug, replace server coordinates with mouse coordinates.
	if( _debug !== undefined )
	{
		var canvasElement = document.getElementById("example");
		canvasElement.addEventListener("mousedown", function(e){
			var x = e.x - this.offsetLeft;
			var y = e.y - this.offsetTop;
			mousehit = [{x:x,y:y}];
		}, false);
		canvasElement.addEventListener("mouseup", function(){
			mousehit=[];
		},false);
	}

    var restartGame = function() {
			finished=false;
			reset();
			engine.resume();
    };

    var isHitRect = function(x, y, w, h) {
        var hitcoords = calibrator.getAll();
        for( var i in hitcoords ) {
            if(
                    hitcoords[i].x > x &&
                    hitcoords[i].x < x+w &&
                    hitcoords[i].y > y &&
                    hitcoords[i].y < y+h
              ) {
                  return true;
              }
        }
        return false;
    };

	// callback for when game ends (ie, when time or ammo runs out)
	var finishedCallback = function() {
		engine.clear(); // clear all drawables from engine
		engine.pause(); // since the ending screen doesnt change, we can also pause
        server.reportScore( score, function(hs) {    
            console.log("Highscore report callback");
            var strHighScore = "Highscore: ";
            if( score >= hs ) {
                if( score > hs ) {
                    strHighScore += score + " New highscore!";
                }
                else {
                    strHighScore += score + " Tied for highscore";
                }
            }
            else {
                strHighScore += hs;
            }
            engine.add( highscore( strHighScore ) );
        }); //Reports this score to the server, and get the current high-score back (not this score included)
        
        engine.add( ending( score ) ); // add the ending screen drawable to engine    
        setTimeout( addRestartButton, 2000 );
		finished=true; // flag that mouse-click should restart
	};

    var addRestartButton = function() {
        server.clearState();
        engine.add( restartButton( isHitRect, restartGame ) ); // add a button to restart the game with the laser
    }

// callback for when game starts, this is the MAIN GAME FUNCTION
	var start = function() {
		var drawables = []; // keep track of all the enemies on screen.
		var viewport = makeView(); // The enemies are drawn onto a 2d plane based on 3d coordinates
		var startTime = new Date().getTime();
		
		engine.add( bar( "Time", {x:90,y:30},{x:30,y:200},"blue",function(){
			var timeTaken = new Date().getTime() - startTime ;
			var timeRemaining = maxTime - timeTaken;
			if( timeRemaining < 0 )
				finishedCallback();
			return timeRemaining / maxTime;
		}));
		var lastmark = 0;

        // this callback controls if a current position and size contains a server coordinate 'hit'
        // ie. is an enemy currently 'shot' by a laser?
        // this will probably have to be changed so that enemies behind other enemies dont register as 'hit'
        var hitCheck = function( x, y, s )
        {
//            x = x + s / 2;
//            y = y + s / 2;
            var hitcoords =  calibrator.getAll(); // gets all transformed screen coordinates
            for( var i in hitcoords )
            {
                var dx = hitcoords[i].x - x;
                var dy = hitcoords[i].y - y;
                var dist = Math.sqrt( dx*dx + dy*dy );
                if( dist < s )
                    return true;
            }
            return false;
        };

		// this is for sorting the list of enemies
		// we want stuff farther away from viewport to be draw first
		// otherwise they will be on top of things closer to the camera, and that is b0rk
		var sortFunction = function(a,b){
			var v1 = b.pos().abs();
			var v2 = a.pos().abs();
			return v1 - v2;
		};

		// function that 'ticks' every enemy, sorts our makeshift z-buffer and then draws enemies
		var enemies = function( context, width, height, mark, keys ) {
			for( var d in drawables )
				drawables[d].tick( keys, mark, (mark - lastmark) ); // this moves enemy position and maybe velocity
			drawables.sort( sortFunction ); // this sorts the drawables array based on how close to the camera enemies are
			for( var d2 in drawables )
				viewport.draw( context, width,height, drawables[d2], mark ); // and then use the viewport to draw every enemy
			lastmark = mark;
		};
		
		// initialize 10 enemies and add them to the draw-buffer
		for( var i = 0; i < 10; i++ )
		{
			drawables.push( enemy( function(){score++;}, hitCheck, _debug ) );
		}

		// add the enemy draw function to the engine
		engine.add( {draw:enemies,id:"aoeu"} );
        if(_debug) engine.add( makeLog(calibrator));
	};

// When resetting game
	var reset = function() {
        score = 0;
		engine.clear(); // clear drawables
		setTimeout( start, 1000 ); // start game
	};

	return {
		// called from html, entry point for game
		start: function() {
			engine.clear();
			
			calibrator = makeCoordinateTransformer(server.getState);
			reset();
		},
		
		// just in case
		reset: reset
	}
};
