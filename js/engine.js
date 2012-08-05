function makeLog()
{
	var counter = 0;
	var timestamp = new Date().getTime();
	var fps = 0;
	return {
		id: "log",
		draw: function(context, width, height, mark, pressedkeys) {
			counter++;

			var took = new Date().getTime() - timestamp;

			if( took > 1000 )
			{
				var load = took/counter;
				fps = 1000/load;
				counter =0;
				timestamp=new Date().getTime();
			}
			context.fillStyle = "white";
			context.font = "12px";
			context.fillText( "FPS: " + Math.round(fps), 100, 40 );
		}
	};
}

function makeEngine( canvas )
{
	var workers = [];
	var pressedkeys = [];
	var isPaused = false;
	var triggerWork = function(context, width, height, mark )
	{
		for (var worker in workers)
		{
			if( workers[worker] !== undefined )
			{
				context.setTransform( 1, 0, 0, 1, 0, 0 );
				workers[worker].draw(context, width, height, mark, pressedkeys);
			}
		}
	};

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
			window.setTimeout(pl, 100);
		}
		else
		{
			// request new frame
			requestAnimFrame(function(){
				animate();
			});
		}
	};

	var animate = function()
	{
		var context = canvas.getContext("2d");
		var frameTimeStamp = new Date().getTime() - startTime;
		context.clearRect(0, 0, canvas.width, canvas.height);
		context.canvas.width  = window.innerWidth-10;
		context.canvas.height = window.innerHeight-50;
		triggerWork(context, canvas.width, canvas.height, frameTimeStamp );
		pauseLoop();
	};

	window.requestAnimFrame = (function(){
		return window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			function(callback){
				window.setTimeout(callback, 1000 / 60);
			};
	})();

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
		start: function(){
			startTime = new Date().getTime();
			animate();
		},
		clear: function(){
			workers = [];
		},
		pause: function(){
			isPaused = true;
		},
		resume: function() {
			isPaused = false;
		}
	};
}
