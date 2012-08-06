var udp_listen_port = 10001;

// latest state of detected light (format: 0.5,22.388 33.21,9993 ...)
var current_state = "0,0";

// Listen for udp
var dgram = require("dgram");
var server = dgram.createSocket("udp4");
server.on( "listening",
	function () {
		var address = server.address();
		console.log("listening for udp datagrams on " + address.address + ":" + address.port);
});
server.on("message",
	function (msg, rinfo) {
		console.log("server got: " + msg + " from " + rinfo.address + ":" + rinfo.port);
		current_state = ""+msg;
});
server.bind(udp_listen_port);

// web server paste
var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs")
    port = process.argv[2] || 8888;
var requesthandler = function( request, response ) {
	// if request.url is request from javascript app, 
	// parse current state to some sort of json and return it,
	// else just return the static html files:
	var pathname = url.parse( request.url ).pathname;

	if(pathname === "/api/current" )
	{
		var listofcoordpairs = current_state.split( " " );
		response.writeHead(200);
		response.write( JSON.stringify( listofcoordpairs ) );
		response.end();
		return;
	}
	else
	{
		var uri = "../js" + pathname;
		var filename = path.join(process.cwd(), uri);
		path.exists(filename, function(exists) {
			if(!exists) {
				response.writeHead(404, {"Content-Type": "text/plain"});
				response.write("404 Not Found\n");
				response.end();
				return;
			}

			if (fs.statSync(filename).isDirectory()) 
				filename += '/index.html';

			fs.readFile(filename, "binary", function(err, file) {
				if(err) {        
					response.writeHead(500, {"Content-Type": "text/plain"});
					response.write(err + "\n");
					response.end();
					return;
				}
				response.writeHead(200);
				response.write(file, "binary");
				response.end();
			});
		});
	}
};

http.createServer( requesthandler ).listen(parseInt(port, 10));

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");

process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', function (chunk) {
 current_state = chunk;
});