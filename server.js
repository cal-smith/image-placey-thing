var express = require('express')
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

app.use(express.static('public'));

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/r.html');
});

var players = {};
var placed_images = [];
var images = new Set();

io.on('connection', function (socket) {
	players[socket.id] = {};
	var image_array = [];
	images.forEach(function(v){ image_array.push(v); });
	socket.emit('loaded', {players:players, placed_images:placed_images, images:image_array, id:socket.id});
	socket.on('loaded', function (data) {
		players[socket.id] = data.player;
		players[socket.id].nick = "";
	});
	socket.broadcast.emit('newuser', {id:socket.id});
	
	socket.on('playerdata', function (data) {
		var player = players[socket.id];
		player.image = data.image;
		player.text = data.text;
		player.rot = data.rot;
		player.x = data.x;
		player.y = data.y;
		player.scale = data.scale;
		data.id = socket.id;
		socket.broadcast.emit('playerdata', data);
	});

	socket.on('placeimage', function (data) {
		socket.broadcast.emit('placeimage', data);
		placed_images.push(data);
	});

	socket.on('addimage', function (data) {
		socket.broadcast.emit('addimage', data);
		images.add({image:data.image, name:data.name});
	});

	socket.on('removeimage', function (data) {
		placed_images = placed_images.filter(function(i) {
			return data.image != i.image;
		});
		images.delete(data.image);
		socket.broadcast.emit('removeimage', data);
	});

	socket.on('message', function(data) {
		if (data.text[0] === "/") {
			if (data.text.startsWith("/echo")) {
				socket.emit('message', {text: "server: " + data.text.replace(/^\/echo\s/, "")});
			} else if (data.text.startsWith("/nick")) {
				var oldnick = players[socket.id].nick;
				players[socket.id].nick = data.text.replace(/^\/nick\s/, "");//prevent nick from being empty space, "server", less than 2 chars, greater than...12?, or already in use
				socket.emit('message', {text: "server: nick set to " + players[socket.id].nick});
				if (oldnick === "") {
					socket.broadcast.emit('message', {text: "server: " + players[socket.id].nick + " joined"});
				} else {
					socket.broadcast.emit('message', {text: "server: "+ oldnick + " is now known as " + players[socket.id].nick});
				}
			} else {
				socket.emit('message', {text: "unknown command"});
			}
		} else {
			if (players[socket.id].nick === "") {
				socket.emit('message', {text: "use '/nick nickname' to chat"})
			} else {
				data.text = players[socket.id].nick + ": " + data.text;
				socket.broadcast.emit('message', data);
			}
		}
	});

	socket.on('disconnect', function (data) {
		socket.broadcast.emit('usergone', {id:socket.id});
		delete players[socket.id];
	});
});

var port = process.env.OPENSHIFT_IOJS_PORT  || 5000;
var ip = process.env.OPENSHIFT_IOJS_IP || 'localhost';
server.listen(port, ip, function() {
	console.log("Listening on " + port);
});