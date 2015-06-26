function create(template) {
	var frag = document.createDocumentFragment();
	for (var i = 0; i < template.length; i++) {
		var node = template[i];
		if (node[0] === 'if') {
			if (node[1][0] === 'eq' && node[1][1] == node[1][2]) {
				node = node[2];
			} else if (node[3]){
				node = node[3];
			} else {
				continue;//no alternative case, jump to the next node
			}
		}
		var elem = document.createElement(node[0]);
		if (node[1].text) {
			elem.textContent = node[1].text;
		}

		if (node[1].html) {
			elem.innerHTML = node[1].html;
		}
		var keys = Object.keys(node[1]);
		var vals = node[1];
		for (var j = 0; j < keys.length; j++) {
			if (keys[j] !== 'text' && keys[j] !== 'html') {
				elem.setAttribute(keys[j], vals[keys[j]]);
			}
		}
		frag.appendChild(elem);
		if (node[2].length != 0) {
			elem.appendChild(create(node[2]));
		}
	}
	return frag;
}

function append(root, element) {
	root.appendChild(element);
}

function includes(array, callback) {
	for (var i = 0; i < array.length; i++) {
		if (callback(array[i])) return true;
	}
	return false;
}

function elem(e){ return document.getElementById(e); }
function on(e, type, callback) { return e.addEventListener(type, callback); }