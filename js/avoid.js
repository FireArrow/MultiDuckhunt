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

var enemy2 = function( ow, intersectHit, viewport, debugmode ){
	var makeDashVector = function( apex, multiplier )
	{
		var target = apex.sub( position );
		var norm = target.unit();
		return norm.mul( multiplier || 1 );
	};
	
	var enemyid = 0; // which enemy sprite should be drawn?
	var meakness = [20, 15, 25];
	var points = [3, 7, 1];
	var imgoffsets = [0,120,250];//data used to navigate the single-image sprite
	var imgwidths = [110,120,80];// 
	var animation = [0,90]; // the offset in the sprite image for the two different animation images
	var islive = -1; // timestamp for when enemy was killed
	var angle = 0; // current angle of rotation (used during death animation)
	var _size = 100;
	var position = new Vec(); // our position in a three dimensional vector room
	var health = 100;
	var armor = 0;
	var timeoffset = 0;
	var turnspeed = 300;
	var turnaround = new Vec();
	
	var stateMachine = 0;
	
	
	var currentVelocity = new Vec();
	var targetVelocity = new Vec();
	var areSame = true;
	
	var setTarget = function( v ){
		areSame = false;
		targetVelocity = v;
		turnaround = currentVelocity.unit().cross( targetVelocity.unit() ).unit();
	};
	var setCurrent = function( v ){
		areSame = true;
		targetVelocity = v;
		currentVelocity = v;
	};
	
	var setToPointer = function()
	{
	var x = inverseTransform( latestCoords.x, 1000, 0.5, viewport.width() )
		var y = inverseTransform( latestCoords.y, 1000, 0.5, viewport.height() )
		if( x > 4000 || y > 4000 )
			return;
		setCurrent( makeDashVector( new Vec([x,y, 1000]) ));
	}
	
	// function that resets all values
	var reset = function(){
		enemyid = Math.floor( Math.random() * 3 );
		islive = -1;
		health=100;
		armor = Math.random()*8+8;
		timeoffset = Math.random()*1500;
		_size = 100; // vary enemy size somewhat
		// reset starting position to a random place somwhere in the distance
		position = new Vec([
			(Math.random()-0.5)*8000,
			(Math.random()-0.5)*8000,
			Math.random()*1000 + 6000
		]);
		setCurrent( makeDashVector( new Vec([0,0, 1000]) ));
		
		setToPointer();
		

		};
	reset();
	

	var getDelayedHitbox = function(w,h)
	{
		var result = undefined;
		viewport.project(w,h, position.sub( currentVelocity.mul(200) ), _size, function(x,y,size){
			result = {x:x,y:y,s:size};
		});
		return result;
	};
	
	var mergeVelocity = function()
	{
		if( areSame )
			return;
		var diff = currentVelocity.angle(targetVelocity);
		if(diff < 0.1)
		{
			currentVelocity = targetVelocity;
			areSame = true;
			return;
		}
		
		currentVelocity = currentVelocity.rotate( diff/2, turnaround );
	};
	
	var turncounter=0;

	return {
		id:"enemy",
		pos: function(){ return position;},
		size: function(){ return _size; },
		tick: function( keys, mark, delta ) {
			// our game engine calls this one once for every enemy once per frame, before anything is drawn
			if( islive !== -1 && mark-islive > 6000 || position.z() < -3000 )
			{
				//if we are dead, and have been dead for a little while
				// or if we are way past the viewport
				reset(mark);
			}

			if( turncounter++ > turnspeed )
			{
				turncounter = 0;
				mergeVelocity();
			}
			
			// this switches between the two animation states.
			animation = ( Math.floor( mark / 1000 ) % 2 == 0) ? [0,90] : [80,90];
			
		if( Math.floor( (mark+timeoffset) / 1000 ) % 3 !== 0 )
			{
				if( stateMachine !== 0 )
				{
					stateMachine = 0;
					setToPointer();
				}
			}
			else
			{
				if( stateMachine !== 2 )
				{
					stateMachine = 2;
					
					var r = new Vec([
						Math.random()-0.5,
						Math.random()-0.5,
						Math.random()-0.5
						]);
					setTarget( currentVelocity.unit().rotate( 1.5707, r.unit() ).unit().mul( Math.random() *3 +2 ) );
				}
			}
				
			position = position.add( currentVelocity.mul( delta ) );
		},
		draw: function( context, x, y, s, mark, wx, wy ) {
		
		
				if( position.z() < 5000 && intersectHit(  x,  y, s ) ) 
					ow( mark, x,y );

				context.setTransform(1, 0, 0, 1, -s/2, -s/2); 
				context.drawImage(_1Sprite, imgoffsets[enemyid], animation[0], imgwidths[enemyid],animation[1], x, y, s, s);

				if( position.z() > 4000 )
				{
					var alpha = (position.z()/2000)-2;
					context.setTransform(1, 0, 0, 1, 0, 0);
					context.fillStyle = "rgba(0,0,0,"+alpha+")";
					context.beginPath();
					context.arc( x, y, s/1.5, 0, Math.PI*2, true);
					context.fill();
				}

		}
	};
};

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
			console.log( x+" ... " + y);
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

        engine.add( ending( score ) ); // add the ending screen drawable to engine    
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
			return enemy2( function(points,x,y,z)
			{
				var deathid = "d"+eCount;
				eCount++;
				health--;
				
				var px = 15;
				if( z > 2000 )
					px = 11;
				
				engine.add({draw:function( context ){
					context.setTransform(1, 0, 0, 1, 0, 0);
					context.fillStyle = "white";
					context.font = "bold "+px+"px Consolas, monospace";
					context.fillText( "-1", x, y );

				},id:deathid})
				
				setTimeout( function(){engine.remove(deathid)}, 1000);
			}, hitCheck,viewport, _debug );
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
