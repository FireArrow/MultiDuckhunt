/*
* A three dimensional vector.
* Not modifiable, if you want to change a vector, make a new one.
*/
var vec = function vec( par )
{
	if( par === undefined )
		par = {};
	
	// fields
	var _x = par.x || 0;
	var _y = par.y || 0;
	var _z = par.z || 0;
	
	// This is for pretty-printing
	var num = function( i ) {
		i *= 1000;
		i = Math.round(i);
		i /= 1000;
		return i;
	};

	// cache the length of this vector, but lazy-load it as well
	var abs = undefined; 

	return {
		x: function(){return _x;},
		y: function(){return _y;},
		z: function(){return _z;},
		
		// return length of this vector
		abs: function()
		{
			if( abs === undefined ) { abs = Math.sqrt( _x*_x + _y*_y + _z*_z ); }
			return abs;
		},
		
		// return the unit vector pointing in the same direction as this vector.
		unit: function(){ return this.mul( 1 / this.abs() ); }, 
		norm: function(){ return this.unit(); },
		
		// return the dot product of this and v
		dot: function( v ){ return _x * v.x() + _y * v.y() + _z * v.z(); }, 
		
		// return the cross product of this and v
		cross: function( v ) { return vec({
			x: _y * v.z() - _z * v.y(),
			y: _z * v.x() - _x * v.z(),
			z: _x * v.y() - _y * v.x()
		});},
		
		// return the product of the vector 'this' and the parameter scalar
		mul: function( scal ) { return vec( {x:scal*_x,y:scal*_y,z:scal*_z} ); },
		
		add: function( v ) {
			return vec({
				x: _x + v.x(),
				y: _y + v.y(),
				z: _z + v.z()
			});
		},
		sub: function( v ) {return vec({
			x: _x - v.x(),
			y: _y - v.y(),
			z: _z - v.z()
		}); },
		
		// printable string representing this vector
		info: function() { return "[ "+num(_x)+", "+num(_y)+", "+num(_z)+" ]";}
	};
};
