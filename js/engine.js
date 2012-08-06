// debug log drawable (should probably be moved to drawables.js, here for legacy reasons + im lazy)
function makeLog()
{
	var counter = 0;
	var timestamp = new Date().getTime();
	var fps = 0;
	return {
		id: "log",
		draw: function(context, width, height, mark, pressedkeys) {
			// Draw FPS counter in corner
			counter++;

			var took = new Date().getTime() - timestamp;

			if( took > 1000 )
			{
				var load = took/counter;
				fps = 1000/load; // also calculate fps, so we can draw it
				counter =0;
				timestamp=new Date().getTime();
			}
			context.fillStyle = "white";
			context.font = "12px";
			context.fillText( "FPS: " + Math.round(fps), 100, 40 );
		}
	};
}

// this is the engine
// it keeps track of drawable objects and pressed keyboard keys
// it tries to use the html5 draw frame timer triggers if available, and
// defalts to using a 60 fps limit timeout pattern
function makeEngine( canvas )
{
	var workers = [];
	var pressedkeys = [];
	var isPaused = false;
	var triggerWork = function(context, width, height, mark )
	// this function lets every worker draw on the screen
	{
		for (var worker in workers)
		{
			if( workers[worker] !== undefined )
			{
				context.setTransform( 1, 0, 0, 1, 0, 0 ); // reset transform matrix before each worker starts drawing, just in case
				workers[worker].draw(context, width, height, mark, pressedkeys);
			}
		}
	};

	// this is very basic key press tracking. Good for 'press any key' but not for multiple simultaneous keypresses
	document.onkeyup = function(){ pressedkeys = []; } 
	document.onkeydown = function(event) {
		var keyCode;
		if(event == null)
		{
			keyCode = window.event.keyCode;
		}
		else
		{
			keyCode = event.keyCode;
		}
		for( var k in pressedkeys )
		{
			if( pressedkeys[k] === keyCode )
				return;
		}
		pressedkeys.push( keyCode );
	};

	var pauseLoop = function pl()
	{
		if( isPaused )
		{
			window.setTimeout(pl, 100); // in 100 ms, schedule this function to be called again.
		}
		else
		{
			requestAnimFrame(animate); // if we have unpaused, resume animation
		}
	};

	var animate = function animate()
	{
		var enterPauseMode = isPaused; // check for pause before drawing - but enter pause loop after
		// otherwise last frame will not be drawn.
		
		var context = canvas.getContext("2d");
		var frameTimeStamp = new Date().getTime() - startTime; // mark is relative to when animation started
		context.clearRect(0, 0, canvas.width, canvas.height); // clear drawing area for next frame
		context.canvas.width  = window.innerWidth-10; // adjust for scrollbars
		context.canvas.height = window.innerHeight-50; // we dont like scrollbars
		triggerWork(context, canvas.width, canvas.height, frameTimeStamp ); //call work function
		if( enterPauseMode )
			pauseLoop();
		else
			requestAnimFrame( animate );

	};

	window.requestAnimFrame = (function(){
		// degrade through different versions of animation frame
		return window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			function(callback){
				window.setTimeout(callback, 1000 / 60); // fallback : )
			};
	})(); // note, this is self executing.

	var startTime = undefined;

	return {
		add: function( fn ){
			workers.push(fn);
		},
		remove: function( id ){
			var toRemove = [];
			for (var worker in workers)
			{
				if( workers[worker] !== undefined && workers[worker].id === id )
				{
					toRemove.push(worker);
				}
			}
			for( var index in toRemove )
			{
				delete workers[toRemove[index]];
			}
		},
		start: function(){ // start animation
			startTime = new Date().getTime();
			animate();
		},
		clear: function(){ // clear screen of all drawable objects
			workers = [];
		},
		pause: function(){ // pause the engine (we dont need to max CPU for drawing the game over screen)
			isPaused = true;
		},
		resume: function() { // resume drawing again
			isPaused = false; // be careful to not loose the executing thread here
			// most of the work in the game engine is done on the rendering thread
			// make sure to add a separate event that can start it again
		}
	};
}
