var Player = function(ctx, image, text, rot, x, y, scale) {
	this.rot = rot;
	this.x = x;
	this.y = y;
	this.scale = scale;
	this.image = image;
	this.text = text;
	this.ctx = ctx;
	this.type = "image";
	this._scale = function() {
		return {
			width: this.image.width/this.scale,
			height: this.image.height/this.scale
		};
	}
	this._draw_text = function() {
		this.ctx.font = "" + 200/this.scale + "px sans-serif";
		this.ctx.fillText(this.text, -this._scale().width/2, this._scale().height/2);
		this.ctx.strokeStyle = "white";
		this.ctx.strokeText(this.text, -this._scale().width/2, this._scale().height/2);
	}
	this._draw_image = function() {
		this.ctx.drawImage(this.image, 
			-this._scale().width/2, 
			-this._scale().height/2,
			this._scale().width, 
			this._scale().height);
	}
}

Player.prototype.static = function(alt_ctx) {
	if (this.image == null) debug("static null", this.image);
	var ctx = this.ctx;
	if (alt_ctx) this.ctx = alt_ctx;
	this.ctx.save();
	this.ctx.translate(this.x+offset.x, this.y+offset.y);
	this.ctx.rotate(this.rot*Math.PI/180);
	this._draw_image();
	this._draw_text();
	this.ctx.restore();
	if (alt_ctx) this.ctx = ctx;
}

Player.prototype.update = function(alt_ctx) {
	if (this.image == null) debug("local null", this.image);
	var ctx = this.ctx;
	if (alt_ctx) this.ctx = alt_ctx;
	if (Events.key === 82) {//r
		var new_rot = this.x - startpos.x;
		if (this.rot*Math.PI/180 <= 180 && this.rot*Math.PI/180 >= -180) {
			this.rot = new_rot;
		}
	} else if (Events.key === 83) {//s
		var new_scale = this.scale + (this.y - startpos.y)/300;
		if (this.image.height/new_scale <= window.innerHeight && this.image.height/new_scale >= 12) {
			this.scale = new_scale;
		}
	}
	this.ctx.save();
	this.ctx.translate(this.x/zoom, this.y/zoom);
	this.ctx.rotate(this.rot*Math.PI/180);
	this._draw_image();
	this._draw_text();
	this.ctx.restore();
	if (alt_ctx) this.ctx = ctx;
}