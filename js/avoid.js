var latestCoords = {x:500,y:500};

var inverseTransform = function( cx, ndist, fov, w )
{
	return ((cx - (w/2))*(ndist+w+fov))/(fov*w);
}

function makeShip()
{
	var counter = 0;
	var timestamp = new Date().getTime();
	var fps = 0;
	return {
		id: "log",
		draw: function(context, width, height, mark, pressedkeys) {
		
			context.setTransform(1, 0, 0, 1, -35, -50); 
				context.drawImage(_shipSprite, latestCoords.x, latestCoords.y, 35, 50 );
		}
	};
}

var makeGame = function(debugmode) {
	var _debug = debugmode || false;
	var server = makeServerState(_debug);
	var engine = makeEngine(document.getElementById("example"));
	engine.start();
	var calibrator = undefined;
	var maxHealth = 100;
	var health = 100;
	var mousehit = [];
	var finished = false;
	var enemycount = 40;

	
		var canvasElement = document.getElementById("example");
		canvasElement.addEventListener("mousedown", function(e){
			var x = e.x - this.offsetLeft;
			var y = e.y - this.offsetTop;
latestCoords.x = x;
latestCoords.y = y;
		}, false);
		
	

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

        engine.add( ending(0) ); // add the ending screen drawable to engine    
        setTimeout( addRestartButton, 2000 );
		finished=true; // flag that mouse-click should restart
	};

    var addRestartButton = function() {
        server.clearState();
        engine.add( restartButton( isHitRect, restartGame ) ); // add a button to restart the game with the laser
    }

	var start = function() {
		var drawables = []; // keep track of all the enemies on screen.
		var viewport = makeView(); // The enemies are drawn onto a 2d plane based on 3d coordinates
		var startTime = new Date().getTime();
		
		engine.add( bar( "Health", {x:90,y:30},{x:30,y:200},"blue",function(){
			if( health < 0 )
				finishedCallback();
			return health / maxHealth;
		}));
		var lastmark = 0;

        // this callback controls if a current position and size contains a server coordinate 'hit'
        // ie. is an enemy currently 'shot' by a laser?
        // this will probably have to be changed so that enemies behind other enemies dont register as 'hit'
        var hitCheck = function( x, y, s )
        {
			var rad = s/2;
            var hitcoords = calibrator.getAll();
			if(hitcoords.length !== undefined && hitcoords.length > 0 )
			{
               latestCoords.x = hitcoords[0].x;
               latestCoords.y = hitcoords[0].y;
			}


			var dx = latestCoords.x - x;
			var dy = latestCoords.y - y;
            var dist =  dx*dx + dy*dy ;
            if( dist < rad*rad )
                return true;
            return false;
        };

		// this is for sorting the list of enemies
		// we want stuff farther away from viewport to be draw first
		// otherwise they will be on top of things closer to the camera, and that is b0rk
		var sortFunction = function(a,b){
			var v1 = b.pos().z();
			var v2 = a.pos().z();
			return v1 - v2;
		};

		// function that 'ticks' every enemy, sorts our makeshift z-buffer and then draws enemies
		var enemies = function( context, width, height, mark, keys ) {
			for( var d in drawables )
				drawables[d].tick( keys, mark, (mark - lastmark) ); // this moves enemy position and maybe velocity
			drawables.sort( sortFunction ); // this sorts the drawables array based on how close to the camera enemies are
			for( var d2 in drawables )
				viewport.draw( context, width, height, drawables[d2], mark ); // and then use the viewport to draw every enemy
			lastmark = mark;
		};
		
		var eCount = 0;
		function makeEnemy()
		{
			return homingEnemy( function(points,x,y,z)
			{
				var deathid = "d"+eCount;
				eCount++;
				health--;
				
				engine.add({draw:function( context ){
					context.setTransform(1, 0, 0, 1, 0, 0);
					context.fillStyle = "white";
					context.font = "bold 15px Consolas, monospace";
					context.fillText( "-1", x, y );
				},id:deathid})
				
				setTimeout( function(){engine.remove(deathid)}, 1000);
			}, hitCheck,viewport, function(){return latestCoords;} );
		};
		
		// initialize enemies and add them to the draw-buffer
		for( var i = 0; i < enemycount; i++ )
		{
			drawables.push( makeEnemy() );
		}
		(function add_enemy(){
			if( enemycount > 100 || finished )
				return;
			
			drawables.push(makeEnemy() );
			enemycount++;
			setTimeout( add_enemy, 600 );
		})();

		// add the enemy draw function to the engine
		engine.add( {draw:enemies,id:"aoeu"} );
        engine.add( makeShip());
	};

// When resetting game
	var reset = function() {
        health = 100;
        enemycount = 40;
		engine.clear(); // clear drawables
		setTimeout( start, 1000 ); // start game
	};

	return {
		start: function() {
			engine.clear();
			calibrator = makeCoordinateTransformer(server.getState);
			reset();
		},
		reset: reset
	}
};
