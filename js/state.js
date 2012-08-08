// Class holding the current server state. It will continuously do ajax requests to the server and update the server state
// variable accordingly.
// It also keeps track of the remaining ammo, which is probably wrong semantically, but this was the easiest place to put it
var makeServerState = function()
{
	var _current_server_state = [];
	var _remaining_ammo = 1;
	(function w_req(){ // this is a self-executing function. it will initiate schedule itself to run again after the ajax call has returned
		$.ajax({ // fetch data async from server. This is a jQuery function.
			url: "api/current",
			dataType:"json", // serialize'd
			success: function(data) // on success callback, this will be async, so our current thread will just continue and ignore this
			{
				if(data instanceof Array )
				{
					var points_arr = [];
					for( var i = 0; i<data.length; i++ )
					{
						var lst = data[i].split(",");
						points_arr.push( {x:parseFloat(lst[0]),y:parseFloat(lst[1]) } );
						//_remaining_ammo-=4; // currently not used because annoying when testing
					}
					_current_server_state = points_arr; // just update the state variable with the imager coordinates.
				}
				else
				{
					_current_server_state = [];
				}
				setTimeout( w_req, 10 ); // do the above with 50 ms interval
			},
			error: function(a,b,c) // in case of error.
			{
				console.log(a);
				console.log(b);
				console.log(c);
			}
		});
	})();

	return {
		getState: function() { return _current_server_state; },
		
		// the following are functions for handling ammo.
		getAmmo: function() { return _remaining_ammo; },
		getMaxAmmo: function() { return 1000; },
		reload: function() { _remaining_ammo = this.getMaxAmmo(); } 
	};
};