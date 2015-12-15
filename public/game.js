//bugs:
// need to enforce usernames as much as possible. fall back to "anon".
// need to add controls for: map zoom, image rot, image scale, etc
// need to clarify how to add images
// need to add hide/minimize button to the windows
// disable highlighting when dragging elements (and force pointer while draging)
// need to have windows correctly z-index (ie: focused windows on top)
// save ui height to localstorage
// save images to redis or something
// handle image errors

/*
* globals/singletons
*/
var c = elem("canvas");
c.width = window.innerWidth;
c.height = window.innerHeight;
var ctx = c.getContext("2d");
var startpos = {x:0, y:0};
var startoffset = {x:0, y:0};
var zoom = 1;
var offset = {x:0, y:0};
var target;
var keydown = false;
var mousedown = false;
var placed_images = [];
var images = new Map();
images.set("default", {name:"default", image:elem("default")})
var players = new Map();
var preview = elem("preview");
preview = preview.getContext("2d");
var player = new Player(ctx, elem("default"), "", 0, 0, 0, 6);
var url = window.location.host;
var socket = io.connect(url);
var dev = false;

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
	var image = player.image.id === "default"?"default":btoa(player.image.src);
	socket.emit("playerdata", {
			image: image, 
			text: player.text,
			rot: player.rot,
			x: player.x/zoom-offset.x,
			y: player.y/zoom-offset.y,
			scale:player.scale});
}

function removeimage(image) {
	socket.emit("removeimage", {image:image});
}

/*
* incoming socket events
*/
if (url === "wat.reallyawesomedomain.com") {
	url += ":8000";
};

socket.on('loaded', function(data) {
	debug(data);
	socket.emit('loaded', {player:{
		image:"default",
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
			if (v == null) {
				debug("i am error");
				continue;
			}
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
	players.set(data.id, new Player(ctx, elem("default"), "", 0, 0, 0, 6));
});

socket.on('usergone', function(data) {
	players.delete(data.id);
});

socket.on('removeimage', function(data) {
	images.delete(data.image);
});

socket.on('message', function(data) {
	append(elem("messages"), create([["span", {"class":"message", "text":data.text}, []]]));
	var scroll = elem("messages").scrollHeight - elem("messages").offsetHeight;
	var scrolltop = elem("messages").scrollTop;
	if (scrolltop < scroll - 100 && scroll > 100) {
	} else{
		elem("messages").scrollTop = scroll;
	}
});

/*
* gameloop
*/
var last_time = 0;
function frame (time) {
	if (dev) {
		var dt = time - last_time;
		last_time = time;
	}
	emit_playerdata();
	Windows.update_windows(Events);
	if (Events.key === 39) offset.x -= 15;//left arrow
	if (Events.key === 37) offset.x += 15;//right arrow
	if (Events.key === 38) offset.y += 15;//up arrow
	if (Events.key === 40) offset.y -= 15;//down arrow
	if (Events.key === 90) {//z
		zoom -= (player.y - startpos.y)/300;
	}
	if (zoom <= 0.10) zoom = 0.10;
	if (zoom >= 50) zoom = 50;
	if (Events.mousedown && Events.mousedown_target === c) {
		offset.x += (player.x - startpos.x)/zoom;
		offset.y += (player.y - startpos.y)/zoom;
		startpos.x = player.x;
		startpos.y = player.y;
	}
	ctx.clearRect(0, 0, c.width, c.height);
	ctx.save();
	ctx.translate((c.width/2), (c.height/2));
	ctx.scale(zoom, zoom);

	//preview render calls
	preview.fillStyle = "white";
	preview.fillRect(0, 0, 300, 200);
	preview.fillStyle = "black";
	preview.save();
	preview.scale(0.1, 0.1);
	preview.translate(offset.x+(c.width-300), offset.y+c.height);
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

	if (dev) {
		//draw global position crosshairs
		ctx.lineWidth = 1;
		ctx.strokeStyle = "black";
		ctx.beginPath();
		ctx.moveTo(-20000, offset.y);
		ctx.lineTo(20000, offset.y);
		ctx.moveTo(offset.x, -20000);
		ctx.lineTo(offset.x, 20000);
		ctx.stroke();

		//now in the preview
		preview.lineWidth = 1;
		preview.strokeStyle = "black";
		preview.beginPath();
		preview.moveTo(-20000, offset.y);
		preview.lineTo(20000, offset.y);
		preview.moveTo(offset.x, -20000);
		preview.lineTo(offset.x, 20000);
		preview.stroke();
	}

	ctx.restore();
	preview.restore();

	if (dev) {
		ctx.font = "25px sans-serif";
		ctx.fillText("Δt: "+dt.toFixed(2), c.width-200, 30);
		ctx.fillText("offset: (" + Math.round(offset.x) + "," + Math.round(offset.y) + ")", c.width-200, 60);
		ctx.fillText("player: (" + Math.round(player.x) + "," + Math.round(player.y) + ")", c.width-200, 90);
		ctx.fillText("zoom: " + zoom.toFixed(2), c.width-200, 120);
		ctx.strokeStyle = "blue";
		ctx.beginPath();
		ctx.moveTo(c.width/2, 0);
		ctx.lineTo(c.width/2, c.height);
		ctx.moveTo(0, c.height/2);
		ctx.lineTo(c.width, c.height/2);
		ctx.stroke();
	}

	requestAnimationFrame(frame);
}
requestAnimationFrame(frame);