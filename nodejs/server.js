var udp_listen_port = 10001;
var debug_mode = false;
// latest state of detected light (format: 0.5,22.388 33.21,9993 ...)
var current_state = "";

var WebSocketServer = require("ws").Server
  , wss = new WebSocketServer({port: 9999})
var ws_clients = [];

// Listen for udp
var dgram = require("dgram");
var server = dgram.createSocket("udp4");
server.on( "listening",
	function () {
		var address = server.address();
		if(debug_mode)
		console.log("listening for udp datagrams on " + address.address + ":" + address.port);
});
console.log(server);

function stdrecv() {
	server.on("message",
		function (msg, rinfo) {
		if(debug_mode)
			console.log("server got: " + msg + " from " + rinfo.address + ":" + rinfo.port);
			current_state = ""+msg;
	});
}
server.bind(udp_listen_port);

wss.on("connection", function(ws) {
	console.log("connection from: ", ws.upgradeReq.headers.origin);
	ws.on("close", function() {
		stdrecv();
	});
	server.on("message", function(msg, rinfo) {
		if(msg != "ndd"){
			current_state = ""+msg;
			var dots = [];
			var listofcoordpairs = current_state.split( " " );
			for(var key in listofcoordpairs) {
				var coords = listofcoordpairs[key].split(",");
				dots.push({x: parseFloat(coords[0]), y:parseFloat(coords[1])});
			}
			ws.send(JSON.stringify(dots), function(err){ if(err != null) stdrecv();});
		} else {
			current_state = "";
			ws.send("[]", function(err){ if(err != null) stdrecv();});
		}
	});
});


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
	else if( pathname === "/index.html" || pathname === "/" ) {
		//Generate an index.html with a list of all available pages
		console.log("Generating index.html");
		var availablePages = "";
		fs.readdir("../js", function(err, files) {
			//Handle error
			if(err) {
				console.log("500: " + pathname);
				response.writeHead(500, {"Content-Type": "text/plain"});
				response.write(err + "\n");
				response.end();
				return;
			}
			
			//List all available HTML pages
			for(i in files) {
				var filenameParts = files[i].split(".");
				console.log(filenameParts);
				if(filenameParts.length == 2 && filenameParts[1] == "html") {
					availablePages += '<a href=/' + filenameParts[0] + "." + filenameParts[1] + '><p class="greenlink">' + filenameParts[0] + '</p></a>';
				}
			}
			if(availablePages.length == 0) {
				availablePages = "No pages found";
			}
			response.writeHead(200);
			
			//Generate the actual page
			//TODO Create a header and a footer page for more dynamic generation
			response.write(
			'<html>\n' +
			'<head>\n' +
			'	<link rel="stylesheet" type="text/css" href="style.css">\n' +
			'	<title>Pew pew lazors</title>\n' +
			'</head>\n' +
			'<body bgcolor="#000000">\n' +
			'	<h1>Available pages</h1>\n' +
			'	<div id="pages" class="greenbox">' + availablePages + '</div>\n' +
			'</body>\n' +
			'</html>\n'
			, "binary");
			response.end();
		});
	}
	else
	{
		console.log("Serving file " + pathname);
		var uri = "../js" + pathname;
		var filename = path.join(process.cwd(), uri);
		fs.exists(filename, function(exists) {
			if(!exists) {
			console.log("404: "+pathname);
				response.writeHead(404, {"Content-Type": "text/plain"});
				response.write("404 Not Found\n");
				response.end();
				return;
			}

			if (fs.statSync(filename).isDirectory()) 
				filename += '/index.html';

			fs.readFile(filename, "binary", function(err, file) {
				if(err) {        
					console.log("500: "+pathname);
					response.writeHead(500, {"Content-Type": "text/plain"});
					response.write(err + "\n");
					response.end();
					return;
				}
				console.log("200: "+pathname);
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
