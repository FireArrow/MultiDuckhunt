var _debug = true;
var makeGame = function() {
	var server = makeServerState();
	var engine = makeEngine(document.getElementById("example"));
	var view = makeView();
	engine.start();
	var calibrator = undefined;
	var maxTime = 50*1000;
	var score = 0;

	var finished = function() {
		engine.clear();
		engine.add( ending( score ) );
	};

	var start = function() {
		var drawables = [enemy()];
		var viewport = makeView();
		var startTime = new Date().getTime();
		engine.add( bar( "Ammo", {x:50,y:30},{x:30,y:200},"green",function(){ return server.getAmmo()/server.getMaxAmmo();}) );
		engine.add( bar( "Time", {x:90,y:30},{x:30,y:200},"blue",function(){
			var timeTaken = new Date().getTime() - startTime ;
			var timeRemaining = maxTime - timeTaken;
			if( timeRemaining < 0 )
				finished();
			return timeRemaining / maxTime;
		}));
		var lastmark = 0;

		var sortFunction = function(a,b){
			var v1 = b.pos().abs();
			var v2 = a.pos().abs();
			return v1 - v2;
		};

		var enemies = function( context, width, height, mark, keys ) {
			for( var d in drawables )
				drawables[d].tick( keys, mark, (mark - lastmark) );
			drawables.sort( sortFunction );
			for( var d2 in drawables )
				viewport.draw( context, width,height, drawables[d2] );
			lastmark = mark;
		};
		engine.add( {draw:enemies,id:"aoeu"} );
	};

	var reset = function() {
		engine.clear();
		server.reload();
		start();
	};

	return {
		recalibrate: function() {
			engine.clear();
			var c = calibrateAction( server.getState, _X, function( id, c ) {
				calibrator = c;
				reset();
			});
		//	engine.add( c );
			reset();
		},
		reset: reset
	}
};
