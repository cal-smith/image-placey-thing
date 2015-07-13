on(document, "mousemove", function(e) {
	player.x = e.clientX-c.width/2;
	player.y = e.clientY-c.height/2;
});

on(document, "click", function(e) {
	if (!keydown && offset.x === startoffset.x && offset.y === startoffset.y) {
		placed_images.push(new Player(ctx, 
			player.image,
			player.text,
			player.rot, 
			(player.x-offset.x)/zoom, 
			(player.y-offset.y)/zoom, 
			player.scale));
		var image = player.image.id === "default"?"default":btoa(player.image.src);
		socket.emit("placeimage", {
			image:image, 
			text:player.text,
			rot: player.rot,
			x: (player.x-offset.x)/zoom,
			y: (player.y-offset.y)/zoom,
			scale:player.scale});
	}
});

on(document, "mousedown", function(e) {
	mousedown = true;
	if (!keydown) {
		startpos.x = player.x;
		startpos.y = player.y;
		startoffset.x = offset.x;
		startoffset.y = offset.y
	}
});

on(document, "mouseup", function(e) {
	mousedown = false;
});

on(window, "resize", function(e) {
	c.width = window.innerWidth;
	c.height = window.innerHeight;
});

on(document, "keypress", function(e) {
	if (!keydown) {
		startpos.x = player.x;
		startpos.y = player.y;
		startoffset.x = offset.x;
		startoffset.y = offset.y
	}
	keydown = true;
});

on(document, "keydown", function(e) {
	//debug(e.keyCode);
	key = e.keyCode;
});

on(document, "keyup", function(e) {
	key = 0;
	keydown = false;
});

on(elem("controls"), "click", function(e) { e.stopPropagation(); });
on(elem("load-new-image"), "click", function(e) {
	var new_image = elem("new-image").value;
	if (new_image !== "" && elem("image-text").value !== "") {
		var id = btoa(new_image);
		if (new_image.endsWith(".mp4")||new_image.endsWith(".webm")||new_image.endsWith(".gifv")) {
			debug("no");
			lem("new-image").value = "";
			elem("image-text").value = "";
			return false;
		} else if (new_image.search(/.jpg|.png|.jpeg$/) !== -1) {
			add_image(new_image, elem("image-text").value);
		} else { return false; }
		player.image = elem(id);
		socket.emit("addimage", {image:new_image, name:elem("image-text").value});
		for (var i = 0; i < elem("select-image").length; i++) {
			elem("select-image")[i].selected = false;
		}
		elem(id).setAttribute("selected", "true");
		elem("new-image").value = "";
		elem("image-text").value = "";
	}
});

on(elem("select-image"), "change", function(e) {
	player.image = images.get(elem("select-image").value).image;
});

on(elem("text"), "keyup", function(e) {
	player.text = elem("text").value;
});