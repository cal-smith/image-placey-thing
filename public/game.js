/*
* globals/singletons
*/
var c = elem("canvas");
c.width = window.innerWidth;
c.height = window.innerHeight;
var ctx = c.getContext("2d");
var key = 0;
var startpos = {x:0, y:0};
var startoffset = {x:0, y:0};
var zoom = 1;
var offset = {x:0, y:0};
var keydown = false;
var mousedown = false;
var placed_images = [];
var images = new Map();
images.set("aHR0cDovLzEyNy4wLjAuMTo4MDAwL0Ryb2lkLmpwZw==", {name:"default", image:elem("aHR0cDovLzEyNy4wLjAuMTo4MDAwL0Ryb2lkLmpwZw==")})
var players = new Map();
var preview = elem("preview");
preview = preview.getContext("2d");
var player = new Player(ctx, elem("aHR0cDovLzEyNy4wLjAuMTo4MDAwL0Ryb2lkLmpwZw=="), "", 0, 0, 0, 6);
var dev = true;

/*
* utility functions
*/
function debug() { if (dev) console.log.apply(console, arguments); }
function add_image(url, name) {
	var id = btoa(url);
	append(elem("assets"), create([["img", {"src":url, "id":id, "crossorigin":"anonymous"}, []]]));
	images.set(id, {name:name, image:elem(id)});
	append(elem("select-image"), create([["option", {"value":id, "text":name}, []]]));
	return id;
}

function emit_playerdata() {
	socket.emit("playerdata", {
			image: btoa(player.image.src), 
			text: player.text,
			rot: player.rot,
			x: (player.x-offset.x)/zoom,
			y: (player.y-offset.y)/zoom,
			scale:player.scale});
}

function removeimage(image) {
	socket.emit("removeimage", {image:image});
}

/*
* socket events
*/
var url = window.location.host;
if (url === "wat.reallyawesomedomain.com") {
	url += ":8000";
};
var socket = io.connect(url);
socket.on('loaded', function(data) {
	debug(data);
	socket.emit('loaded', {player:{
		image:btoa(player.image.src),
		text:player.text,
		rot:player.rot,
		x:player.x,
		y:player.y,
		scale:player.scale}});
	for (var i = 0; i < data.images.length; i++) {
		add_image(data.images[i].image, data.images[i].name);
	}
	var keys = Object.keys(data.players);
	for (var i = 0; i < keys.length; i++) {
		if (keys[i] != data.id) {
			var v = data.players[keys[i]];
			players.set(keys[i], new Player(ctx, 
				images.get(v.image).image,
				v.text,
				v.rot,
				v.x,
				v.y,
				v.scale));
		}
	}
	for (var i = 0; i < data.placed_images.length; i++) {
		placed_images.push(new Player(ctx,
			images.get(data.placed_images[i].image).image,
			data.placed_images[i].text,
			data.placed_images[i].rot,
			data.placed_images[i].x,
			data.placed_images[i].y,
			data.placed_images[i].scale));
	}
});

socket.on('playerdata', function(data) {
	var player = players.get(data.id);
	player.image = images.get(data.image).image;
	player.text = data.text;
	player.rot = data.rot;
	player.x = data.x;
	player.y = data.y;
	player.scale = data.scale;
});

socket.on('placeimage', function(data) {
	placed_images.push(
		new Player(ctx, 
			images.get(data.image).image,
			data.text,
			data.rot, 
			data.x, 
			data.y, 
			data.scale));
});

socket.on('addimage', function(data) {
	var id = btoa(data.image);
	add_image(data.image, data.name);
});

socket.on('newuser', function(data) {
	players.set(data.id, new Player(ctx, elem("aHR0cDovLzEyNy4wLjAuMTo4MDAwL0Ryb2lkLmpwZw=="), "", 0, 0, 0, 6));
});

socket.on('usergone', function(data) {
	players.delete(data.id);
});

socket.on('removeimage', function(data) {
	images.delte(data.image);
});

/*
* gameloop
*/
function frame () {
	emit_playerdata();
	if (key === 39) offset.x -= 15;//left arrow
	if (key === 37) offset.x += 15;//right arrow
	if (key === 38) offset.y += 15;//up arrow
	if (key === 40) offset.y -= 15;//down arrow
	if (key === 90) {//z 
		zoom -= (player.y - startpos.y)/300;
		if (player.y - startpos.y < 0) {
			//debug(offset);
			//offset.x += ; 
			//offset.y -= ;
		}
	}
	if (mousedown) {
		offset.x += (player.x - startpos.x);
		offset.y += (player.y - startpos.y);
		startpos.x = player.x;
		startpos.y = player.y;
	}
	ctx.clearRect(0, 0, c.width, c.height);
	ctx.save();
	ctx.scale(zoom, zoom);
	ctx.translate(offset.x/zoom, offset.y/zoom);

	//preview render calls
	preview.fillStyle = "white";
	preview.fillRect(0, 0, 300, 200);
	preview.fillStyle = "black";
	preview.save();
	preview.scale(0.1, 0.1);
	preview.translate(offset.x+(c.width/3), offset.y+(c.height/2));
	for (var i = 0; i < placed_images.length; i++) {
		placed_images[i].static();
		placed_images[i].static(preview);
	}
	players.forEach(function(v, k){
		v.static();
		v.static(preview);
	});
	player.update();
	player.update(preview);
	ctx.restore();
	preview.restore();

	requestAnimationFrame(frame);
}
requestAnimationFrame(frame);