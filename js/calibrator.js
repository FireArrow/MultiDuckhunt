// This is the object that is responsible for setting up a calibration sequence.
// When it is done, it will return a prepared calibrate-object
var calibrateAction = function( state, image, finished )
{
	var id = "calibrate";
	var c = makeCalibration( state );
	var transition_mark = undefined;
	// The delegate will be added to the rendering engine. It will be called once for each rendered frame.
	var delegate = function( context, width, height, mark, keys ) {
		
		// depending on which state the calibration sequence is in, we either
		if( c.getState() === "show1" )
		{
			// draw an image in the top left corner
			context.drawImage(image, -20, -20,40,40);
			if( keys.length > 0 )
			{
				c.reportFirst( width, height );
				transition_mark = mark;
			}
		}
		else if( c.getState() === "show2" )
		{
			// draw an image in the bottom right corner
			context.drawImage(image, width-20, height-20,40,40);
			if( keys.length > 0 && transition_mark + 1000 < mark )
			{
				c.reportSecond();
			}
		}
		else if( c.getState() === "ready" )
		{
			// or finish up and return our ready calibration object
			finished( id, c );
		}
	};
	return {
		id: id,
		draw: delegate
	};
};

var makeCalibration = function( comms )
{
	var _state = "show1"; // other possible states are [show2, ready]
	var _current_coords = {x:0,y:0};
	
	var base_report = undefined;
	var scale_report = undefined;
	
	return {
		reportFirst: function(current_width,current_height){
			//user has pressed key signaling that the current state reported by the server matches the
			// mark drawn on the screen.
			var coords = comms();
			if( coords.length > 0 ) // guard for badness from server
			{
				_current_coords = {x:current_width,y:current_height}; // save screen size so we know where to print second mark
				_state = "show2";
				base_report = coords[0];
			}
		},
		reportSecond: function(){
			// user signals that second mark matches
			var coords = comms();
			if( coords.length > 0 )
			{
				_state = "ready";
				scale_report = coords[0];
			}
		},
		getState: function(){
			return _state;
		},
		transform: function(coords){
			
		// this function transforms coords from the scale they are imported from the imaging server
		// to on screen window relative coordinates.
		
		// There is testing done on this. Check test.html.
		
		//transform x component linearily onto screen based on the two calibration reports
		var baseX = coords.x - base_report.x;
		var deltaX = scale_report.x - base_report.x;
		var x = ( baseX / deltaX ) * _current_coords.x;
		
		// transform y coordinate in the same way
		var baseY = coords.y - base_report.y;
		var deltaY = scale_report.y - base_report.y;
		var y = ( baseY / deltaY ) * _current_coords.y;

			return { x: x, y: y };
		},
		getAll: function(){
			// this is a helper function that simply gets the latest reported coords from the server and transforms them in bulk
			var serverCoords = comms();
			var transformed = [];
			for( var i = 0; i < serverCoords.length; i++ )
			{
				transformed.push( this.transform( serverCoords[i] ) );
			}
			return transformed;
		}
	};
};