var _inverseTransform = function( cx, ndist, fov, w )
{
	return ((cx - (w/2))*(ndist+w+fov))/(fov*w);
}

var _makeDashVector = function( apex, position, multiplier )
{
	var target = apex.sub( position );
	var norm = target.unit();
	return norm.mul( multiplier || 1 );
};

var makeTargeting = function()
{
	var currentVelocity = new Vec();
	var turnspeed = 10;
	var turnaround = new Vec();
	var targetVelocity = new Vec();
	var areSame = true;
	var turncounter = 0;
	
	return {
		velocity: function(){ return currentVelocity; },
		target: function( v ){
			areSame = false;
			targetVelocity = v;
			turnaround = currentVelocity.unit().cross( targetVelocity.unit() ).unit();
		},
		update: function(){
		},
		reset: function( v ){
			areSame = true;
			targetVelocity = v;
			currentVelocity = v;
		},
		merge: function() {
			// only run this function every n frames
			// TODO switch to timestamp mark
			if( turncounter++ < turnspeed )
				return;

			turncounter = 0;
		
			if( areSame )
				return;
			var diff = currentVelocity.angle(targetVelocity);
			if(diff < 0.1)
			{
				currentVelocity = targetVelocity;
				areSame = true;
				return;
			}
			currentVelocity = currentVelocity.rotate( diff/4, turnaround );
		}
	}
}