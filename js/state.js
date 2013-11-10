// Class holding the current server state. It will continuously do ajax requests to the server and update the server state
// variable accordingly.
// It also keeps track of the remaining ammo, which is probably wrong semantically, but this was the easiest place to put it
var makeServerState = function()
{
    var ws;
    var highscore_callback;
    var _current_server_state = [];
    var _remaining_ammo = 1;
    (function w_req(){ // this is a self-executing function. it will initiate schedule itself to run again after the ajax call has returned
        ws = new WebSocket("ws://"+window.location.hostname+":9999")
        ws.onmessage = function(data){
            _current_server_state = [];
            if(data.data !== "") {
                if(data.data.slice(0,2) == "hs") { //This is a highscore message;
                    var highscore = parseInt(data.data.slice(3));
                    highscore_callback(highscore);
                }
                else { //This is a points message
                    var strPoints = data.data.split(" ");
                    for(var i in strPoints) {
                        var coords = strPoints[i].split(",");
                        var point = { x : parseFloat(coords[0]), y : parseFloat(coords[1]) };
                        _current_server_state.push(point);
                    }
                }
            }
        }
    ws.onerror = function() {console.log("ERROR");}
    ws.onopen = function() {console.log("CONNECTED");}
    })();

    return {
        getState: function() { return _current_server_state; },
        clearState: function() { _current_server_state = []; },

            // the following are functions for handling ammo.
        getAmmo: function() { return _remaining_ammo; },
        getMaxAmmo: function() { return 1000; },
        reload: function() { _remaining_ammo = this.getMaxAmmo(); }, 

        // Allows reporting the score to the server
        reportScore: function( score, callback ) {
            console.log("Reporting score");
            highscore_callback = callback;
            ws.send("invadersHS:" + score);
        }

    };
};
