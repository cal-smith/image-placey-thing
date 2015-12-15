(function(window){
	window.Windows = {
		/*I should probably re-assess weather we really need localStorage *and* a Map*/
		windows: new Map(),
		_window_store: localStorage,
		_using_layer:null,
		get_window: function (id) {
			return JSON.parse(this._window_store.getItem(id));
		},
		set_window: function (id, obj) {
			return this._window_store.setItem(id, JSON.stringify(obj));
		},
		update_window: function(id, key, val) {
			var obj = this.get_window(id);
			obj[key] = val;//dot syntax would add a new "key" property set to val
			return this.set_window(id, obj);
		},

		// this works around the fact that neither gecko or webkit/blink can implement the spec properly.
		// gecko still uses layer[X|Y] while webkit/blink use offset[X|Y] and BOTH implement the other
		// property as well but lock it to client[X|Y] at mousedown. WTF.
		_real_elem_offset(ev) {
			if (this._using_layer == null && ev.offsetX == ev.clientX && ev.offsetY == ev.clientY) {
				this._using_layer = true;
				console.log("using layer");
			} else if (this._using_layer == null) {
				this._using_layer = false;
				console.log("using offset");
			}
			if (this._using_layer) {
				return {x:ev.layerX, y:ev.layerY};
			} else {
				return {x:ev.offsetX, y:ev.offsetY};
			}
		},

		resize: new MutationObserver(function (e) {
			var win = Windows.get_window(e[0].target.id);
			win.x = e[0].target.style.transform.split(" ")[0].replace(/[^0-9+]/g, "");
			win.y = e[0].target.style.transform.split(" ")[1].replace(/[^0-9+]/g, "");
			Windows.set_window(e[0].target.id, win);
		}),

		add_window: function (x, y, width, height, id, title, content, callback) {
			var saved = this.get_window(id);
			var minimized = false;
			if (saved) {
				x = saved.x;
				y = saved.y;
				width = saved.width;
				height = saved.height;
				minimized = saved.minimized;
			}
			var template = create([["div", {"class":"window " + id, "id":id, 
				"style":"transform: translatex("+x+"px) \
				translatey("+y+"px); width:"+width+"px; \
				height:"+height+"px; min-width:"+width+"px; \
				min-height:"+height+"px;"}, [
						["div", {"class":"titlebar"}, [
							["span", {"text":title}, []],
							["span", {"text":"_", "class":"minimize"}, []]]],
						["div", {"class":"window-content-container"}, []]]]]);

			append(template.firstChild.childNodes[1], content);
			append(document.body, template);

			console.log(minimized);

			this.windows.set(id, {element:elem(id), callback:callback, minimized:minimized, height:height, replace_content:function(new_content){
				replace(this.element, this.element.childNodes[1], new_content);
			}});
			this.set_window(id, {x:x, y:y, height:height, width:width, minimized:minimized});

			this.resize.observe(elem(id), {attributes:true});

			//minimize should just go down to a taskbar/dock like "button bar" that grows and shrinks as windows are minimized
			//grab the title from the window, set the whole window to display:none and instance a little button at the bottom
			//of the screen. this would also let windows start minimized or hidden (perhaps a console or text editor or the like?)
			//ew, too much duplication
			if (minimized) {
				elem(id).style.height = "40px";
				elem(id).style.overflow = "hidden";
				elem(id).style.resize = "none";
				elem(id).firstChild.childNodes[1].textContent = "+";
				elem(id).childNodes[1].style.display = "none";
			}

			on(elem(id).firstChild.childNodes[1], "click", function (e) {
				_window = Windows.windows.get(id);
				if (!_window.minimized) {
					_window.minimized = true;
					_window.height = elem(id).style.height;
					_window.element.style.height = "40px";
					_window.element.style.overflow = "hidden";
					_window.element.style.resize = "none";
					_window.element.firstChild.childNodes[1].textContent = "+";
					_window.element.childNodes[1].style.display = "none";
					Windows.update_window(id, "minimized", true);
				} else {
					_window.minimized = false;
					_window.element.style.height = _window.height;
					_window.element.style.overflow = "scroll";
					_window.element.style.resize = "both";
					_window.element.firstChild.childNodes[1].textContent = "_";
					_window.element.childNodes[1].style.display = "block";
					Windows.update_window(id, "minimized", false);
				}
			});

			return elem(id);
		},

		update_windows: function (e) {
			for (var w of this.windows) {
				if (w[1].element.firstChild === e.mousedown_target && e.mousedown){
					e.raw_event.preventDefault();
					e.raw_event.stopPropagation();
					var x = e.cursor.x - this._real_elem_offset(e.raw_event).x
					var y = e.cursor.y - this._real_elem_offset(e.raw_event).y
					w[1].element.style.transform = "translatex("+x+"px) translatey("+y+"px)";
				}
				w[1].callback(e);
			}
		}
	};

	/*
	* init ui
	*/
	var controls = create([
		["input", {id:"new-image", type:"text", placeholder:"image url", required:true}, []], 
		["input", {id:"image-text", type:"text", placeholder:"image name", required:true}, []],
		["button", {id:"load-new-image", text:"load"}, []],
		["select", {id:"select-image"}, [
			["option", {value:"default", text:"default"}, []]]],
		["input", {id:"text", type:"text", placeholder:"sample text"}, []],
		["label", {id:"zoom-label", text:"zoom", "for":"zoom"}, []],
		["input", {id:"zoom", type:"range", min:"0.10", max:"50", step:"0.1"}, []],
		["label", {text:"debug"}, [
			["input", {id:"debug", type:"checkbox", checked:true}, []]]],
		["canvas", {id:"preview", width:"300", height:"200"}, []]]);
	
	controls = Windows.add_window(5, 5, 306, 410, "controls", "Controls", controls, function(e) {
		if (zoom > elem("zoom").valueAsNumber  || zoom < elem("zoom").valueAsNumber) {
			elem("zoom").valueAsNumber = zoom;
			elem("zoom-label").textContent = "zoom: " + zoom.toFixed(2);
		}
	});

	on(elem("zoom"), "input", function(e) {
		zoom = elem("zoom").valueAsNumber;
		elem("zoom-label").textContent = "zoom: " + zoom.toFixed(2);
	});

	on(elem("debug"), "change", function(e){ dev = !dev; });

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

	var chat = create([
		["div", {id:"messages", class:"messages"}, []],
		["form", {id:"message"}, [
			["input", {id:"messagetext", type:"text", placeholder:"type something"}, []]]]]);

	Windows.add_window(5, window.innerHeight - 255, 500, 250, "chat", "Chat", chat, function(e) {});

	on(elem("message"), "submit", function(e) {
		e.preventDefault();
		socket.emit("message", {
			text:elem("messagetext").value
		});
		append(elem("messages"), create([["span", {"class":"message", "text":"> "+elem("messagetext").value}, []]]));
		var scroll = elem("messages").scrollHeight - elem("messages").offsetHeight;
		var scrolltop = elem("messages").scrollTop;
		if (scrolltop < scroll - 100 && scroll > 100) {
		} else{
			elem("messages").scrollTop = scroll;
		}
		elem("messagetext").value = "";
	});
})(window);