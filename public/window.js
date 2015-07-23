(function(window){
	window.Windows = {
		windows: new Map(),

		add_window: function (x, y, width, height, id, title, content, callback) {
			var template = create([["div", {"class":"window " + id, "id":id, "style":"left:"+x+"px; top:"+y+"px; width:"+width+"px; height:"+height+"px;"}, [
						["div", {"class":"titlebar"}, [
							["span", {"text":title}, []],
							["span", {"text":"_", "class":"minimize"}, []]],
						["div", {}, []]]]]]);
			append(template.firstChild.childNodes[1], content);
			append(document.body, template);
			on(elem(id).firstChild.childNodes[1], "click", function(e) {
				_window = Windows.windows.get(id);
				if (!_window.minimized) {
					_window.minimized = true;
					_window.height = elem(id).style.height;
					_window.element.style.height = "40px";
					_window.element.style.overflow = "hidden";
					_window.element.style.resize = "none";
					_window.element.firstChild.childNodes[1].textContent = "+";
					_window.element.childNodes[1].style.display = "none";
				} else {
					_window.minimized = false;
					_window.element.style.height = _window.height;
					_window.element.style.overflow = "scroll";
					_window.element.style.resize = "both";
					_window.element.firstChild.childNodes[1].textContent = "_";
					_window.element.childNodes[1].style.display = "block";
				}
			});
			this.windows.set(id, {element:elem(id), callback:callback, minimized:false, height:height, replace_content:function(new_content){
				replace(this.element, this.element.childNodes[1], new_content);
			}});
			return elem(id);
		},

		update_windows: function (e) {
			for (var w of this.windows) {
				if (w[1].element.firstChild === e.mousedown_target && e.mousedown){
					e.raw_event.stopPropagation();
					w[1].element.style.left = e.cursor.x - e.raw_event.layerX + "px";
					w[1].element.style.top = e.cursor.y - e.raw_event.layerY + "px";
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
		["label", {text:"debug"}, [
			["input", {id:"debug", type:"checkbox", checked:true}, []]]],
		["canvas", {id:"preview", width:"300", height:"200"}, []]]);
	

	controls = Windows.add_window(5, 5, 306, 400, "controls", "Controls", controls, function(e) {});

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
		append(elem("messages"), create([["span", {"class":"message", "text":elem("messagetext").value}, []]]));
		var scroll = elem("messages").scrollHeight - elem("messages").offsetHeight;
		var scrolltop = elem("messages").scrollTop;
		if (scrolltop < scroll - 100 && scroll > 100) {
		} else{
			elem("messages").scrollTop = scroll;
		}
		elem("messagetext").value = "";
	});
})(window);