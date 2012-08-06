// When coding in javascript, we dont use no new keyword for objects. We just create them.
// Follows: Crockfords pattern for object creation. Is good.

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