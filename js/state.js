// Class holding the current server state. It will continuously do ajax requests to the server and update the server state
// variable accordingly.
// It also keeps track of the remaining ammo, which is probably wrong semantically, but this was the easiest place to put it
var makeServerState = function()
{
    var _current_server_state = [];
    var _remaining_ammo = 1;
    (function w_req(){ // this is a self-executing function. it will initiate schedule itself to run again after the ajax call has returned
        var ws = new WebSocket("ws://"+window.location.hostname+":9999")
        ws.onmessage = function(data){
            _current_server_state = [];
            if(data.data !== "") {
                var strPoints = data.data.split(" ");
                for(var i in strPoints) {
                    var coords = strPoints[i].split(",");
                    var point = { x : parseFloat(coords[0]), y : parseFloat(coords[1]) };
                    _current_server_state.push(point);
                }
            }
            //_current_server_state = JSON.parse(data.data);
        }
    ws.onerror = function() {console.log("ERROR");}
    ws.onopen = function() {console.log("CONNECTED");}
    })();

    return {
        getState: function() { return _current_server_state; },

            // the following are functions for handling ammo.
            getAmmo: function() { return _remaining_ammo; },
            getMaxAmmo: function() { return 1000; },
            reload: function() { _remaining_ammo = this.getMaxAmmo(); } 
    };
};
