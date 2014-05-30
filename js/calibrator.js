var makeCoordinateTransformer = function( comms )
{
    // The calibration works by taking the mean of two linear transformations, one for each axis.
	var calPointTopLeft = {x:0,y:0}; 
    var calPointBottomRight = {x:640,y:480}; // this should be the resolution of the projector

    var scaleX = undefined; // To replace static calculations in transform
    var scaleY = undefined; // not yet implemented
	
	return {
		transform: function(coords){
			
    		// This function transforms coords from the scale they are imported from the imaging server
    		// to on screen window relative coordinates.
    		// Transform x component linearily onto screen based on the two calibration reports
            // Top left corner to bottom right.
    		var base_TLBR_X = coords.x - calPointTopLeft.x;
    		var delta_TLBR_X = calPointBottomRight.x - calPointTopLeft.x;
    		var x1 = ( base_TLBR_X / delta_TLBR_X ) *window.innerWidth;

    		// transform y coordinate in the same way
    		var base_TLBR_Y = coords.y - calPointTopLeft.y;
    		var delta_TLBR_Y = calPointBottomRight.y - calPointTopLeft.y;
    		var y1 = ( base_TLBR_Y / delta_TLBR_Y ) *window.innerHeight;

//            console.log( "x:" + x1 + "  y:" + y1 );
			return { x: x1, y: y1 };
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
