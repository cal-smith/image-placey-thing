var Events = {
	cursor:{x:0,y:0},
	mousedown:false,
	key:false,
	click_target:null,
	mousedown_target:null,
	raw_event:null,
	hover_target:null,
	bounds:null
};

on(document, "mousemove", function(e) {
	Events.cursor.x = e.clientX;
	Events.cursor.y = e.clientY;
	player.x = e.clientX-c.width/2;
	player.y = e.clientY-c.height/2;
});

on(document, "click", function(e) {
	Events.click_target = e.target;
	Events.raw_event = e;
	if (!keydown && offset.x === startoffset.x 
		&& offset.y === startoffset.y
		&& e.target === elem("canvas")) {
		placed_images.push(new Player(ctx,
			player.image,
			player.text,
			player.rot, 
			player.x/zoom-offset.x,
			player.y/zoom-offset.y, 
			player.scale));
		var image = player.image.id === "default"?"default":btoa(player.image.src);
		socket.emit("placeimage", {
			image:image, 
			text:player.text,
			rot: player.rot,
			x: player.x/zoom-offset.x,
			y: player.y/zoom-offset.y,
			scale:player.scale});
	}
});

on(document, "mousedown", function(e) {
	mousedown = true;
	target = e;
	Events.mousedown = true;
	Events.raw_event = e;
	Events.mousedown_target = e.target;	
	if (!keydown) {
		startpos.x = player.x;
		startpos.y = player.y;
		startoffset.x = offset.x;
		startoffset.y = offset.y
	}
});

on(document, "mouseup", function(e) {
	Events.mousedown = false;
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
	key = e.keyCode;
});

on(document, "keyup", function(e) {
	key = 0;
	keydown = false;
});

on(document, "wheel", function(e) {
	if (Events.hover_target === c) zoom -= e.deltaY*0.005;;
});

on(document, "mouseover", function(e) {
	Events.hover_target = e.target;
});

var last_window = {elem:null, index:null};
function uifocus(e) {
	e.stopPropagation();
	if (e.target.classList.contains("minimize")) {
		debug(e.target);
		e.target.parentNode.parentNode.style.top = c.height-40+"px";
		e.target.parentNode.parentNode.style.width = "100px";
		e.target.textContent = "+";
	}
	if (last_window.elem && last_window.elem !== e.target) {
		last_window.elem.style["z-index"] = last_window.index;
	}
	last_window.elem = e.target;
	last_window.index = e.target.style["z-index"];
	e.target.style["z-index"] = 3;
}