var Player = function(ctx, image, text, rot, x, y, scale) {
	this.rot = rot;
	this.x = x;
	this.y = y;
	this.scale = scale;
	this.image = image;
	this.text = text;
	this.ctx = ctx;
	this.type = "image";
}

Player.prototype._common_draw = function() {
	if (this.image == null) debug("null", this.image);
	this.ctx.rotate(this.rot*Math.PI/180);
	try {
		/*this.ctx.drawImage(this.image, 
			(this.x-offset.x)/zoom-(this.image.width/this.scale)/2, 
			(this.y-offset.y)/zoom-(this.image.height/this.scale)/2,
			this.image.width/this.scale, 
			this.image.height/this.scale);*/
	} catch (e) {
		debug(e);
		this.ctx.drawImage(elem("error"), 
			-(elem("error").width/this.scale)/2, 
			-(elem("error").height/this.scale)/2, 
			elem("error").width/this.scale, 
			elem("error").height/this.scale);
	}
	this.ctx.font = "" + 200/this.scale + "px sans-serif";
	this.ctx.fillText(this.text, -(this.image.width/this.scale)/2, (this.image.height/this.scale)/2);
	this.ctx.strokeStyle = "white";
	this.ctx.strokeText(this.text, -(this.image.width/this.scale)/2, (this.image.height/this.scale)/2);
}

Player.prototype.static = function(alt_ctx) {
	if (this.image == null) debug("static null", this.image);
	var ctx = this.ctx;
	if (alt_ctx) this.ctx = alt_ctx;
	this.ctx.save();
	this.ctx.translate(offset.x, offset.y)
	//this.offset.x-offset.x
	//calculations like that should probably be done in here. If the prototype has as much info as possible we can change it up easier later.
	this.ctx.drawImage(this.image, 
			(this.x)-(this.image.width/this.scale)/2, 
			(this.y)-(this.image.height/this.scale)/2,
			this.image.width/this.scale, 
			this.image.height/this.scale);
	this._common_draw();
	this.ctx.restore();
	if (alt_ctx) this.ctx = ctx;
}

Player.prototype.update = function(alt_ctx) {
	if (this.image == null) debug("local null", this.image);
	var ctx = this.ctx;
	if (alt_ctx) this.ctx = alt_ctx;
	//this.ctx.save();
	if (key === 82) {//r
		var new_rot = this.x - startpos.x;
		if (this.rot*Math.PI/180 <= 180 && this.rot*Math.PI/180 >= -180) {
			this.rot = new_rot;
		}
		//this.ctx.translate((startpos.x-offset.x-(c.width/2))/zoom, (startpos.y-offset.y-(c.height/2))/zoom);
	} else if (key === 83) {//s
		var new_scale = this.scale + (this.y - startpos.y)/300;
		if (this.image.height/new_scale <= window.innerHeight && this.image.height/new_scale >= 12) {
			this.scale = new_scale;
		}
		//this.ctx.translate((startpos.x-offset.x-(c.width/2))/zoom, (startpos.y-offset.y-(c.height/2))/zoom);
	} else {
		//this.ctx.translate((this.x-offset.x-(c.width/2))/zoom, (this.y-offset.y-(c.height/2))/zoom);
	}
	this.ctx.drawImage(this.image, 
			(this.x)/zoom-(this.image.width/this.scale)/2, 
			(this.y)/zoom-(this.image.height/this.scale)/2,
			this.image.width/this.scale, 
			this.image.height/this.scale);
	this._common_draw();
	//this.ctx.restore();
	if (alt_ctx) this.ctx = ctx;
}