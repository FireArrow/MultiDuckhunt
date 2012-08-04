var _debug = true;
var makeGame = function() {
	var server = makeServerState();
	var engine = makeEngine(document.getElementById("example"));
	var view = makeView();
	engine.start();
	var calibrator = undefined;
	var maxTime = 50*1000;
	var score = 0;
	var mousehit = [];
	var debugAmmo = 1;
	if( _debug )
	{
		$("#example").mousedown(function(e){
			debugAmmo -= 0.03;
			var x = e.pageX - this.offsetLeft;
			var y = e.pageY - this.offsetTop;
			mousehit = [{x:x,y:y}];
		});
		$("#example").mouseup(function(){
			mousehit=[];
		});
	}


	var finished = function() {
		engine.clear();
		engine.add( ending( score ) );
	};

	var start = function() {
		var drawables = [];
		var viewport = makeView();
		var startTime = new Date().getTime();
		engine.add( bar( "Ammo", {x:50,y:30},{x:30,y:200},"green",function(){
				if( _debug )
					return debugAmmo;
			return server.getAmmo()/server.getMaxAmmo();}
		) );
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

		var hitCheck = function( x, y, s )
		{
			var hitcoords = _debug ? mousehit : server.getAll();
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

		var enemies = function( context, width, height, mark, keys ) {
			for( var d in drawables )
				drawables[d].tick( keys, mark, (mark - lastmark) );
			drawables.sort( sortFunction );
			for( var d2 in drawables )
				viewport.draw( context, width,height, drawables[d2], mark );
			lastmark = mark;
		};
		drawables.push( enemy( function(){score++;}, hitCheck ) );
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
