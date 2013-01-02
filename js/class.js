// When coding in javascript, we dont use no new keyword for objects. We just create them.
// Follows: Crockfords pattern for closured object creation. Is good.

// IMPORTANT: Value objects, objects that will exists in more than one or two instances at the same time
// should have its functions declared on the prototype for performance reasons, see below.

var makeClass = function( param1, param2 )
{
	// field and variables
	var field1 = 1;
	var field2 = "aoeu";
	
	var privateMethod = function( )
	{
		return field1+field2;
	}
	
	// now we return the object
	return {
		prop1: "lol", //const property
		prop2: field2, // will return "aoeu" even if field2 changes
		publicMethod: function(str){ field2=str; },
		properGetter: function(){ return field2; }
	};
};

function Particle( param1 )
{
	this.color = param1.color;
	this.spin = param1.spin;
	this._ugly_pseudo_private_internal = 100;
};

Particle.prototype.act = function(){
	if( this._ugly_pseudo_private_internal-- > 20 )
		return "not yet";
	else
	{
		this._ugly_pseudo_private_internal = 100;
		return this.color;
	}
};

// Fake accessors
Particle.prototype.getSpin = function(){
	return this.spin;
};
Particle.prototype.setSpin = function(s){
	this.spin = s;
};