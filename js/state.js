var makeServerState = function()
{
	var _current_server_state = [];
	var _remaining_ammo = 1;
	(function w_req(){
		$.ajax({
			url: "api/current",
			dataType:"json",
			success: function(data)
			{
				if(data instanceof Array )
				{
					var points_arr = [];
					for( var i = 0; i<data.length; i++ )
					{
						var lst = data[i].split(",");
						points_arr.push( {x:parseFloat(lst[0]),y:parseFloat(lst[1]) } );
						_remaining_ammo-=4;
					}
					_current_server_state = points_arr;
				}
				else
				{
					_current_server_state = [];
				}
				setTimeout( w_req, 50 ); // do the above with 50 ms interval
			},
			error: function(a,b,c)
			{
				console.log(a);
				console.log(b);
				console.log(c);
			}
		});
	})();

	return {
		getState: function() { return _current_server_state; },
		getAmmo: function() { return _remaining_ammo; },
		getMaxAmmo: function() { return 1000; },
		reload: function() { _remaining_ammo = this.getMaxAmmo(); }
	};
};