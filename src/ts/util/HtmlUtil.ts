// export function createHtmlElement(tag:string, parent:HTMLElement, className?:string):HTMLElement {
//     const el = document.createElement(tag);
//     if (parent) {
//         parent.appendChild(el);
//     }
//     if (className) {
//         el.className = className;
//     }
//     return el;
// }
export function createHtmlElement<K extends keyof HTMLElementTagNameMap>(tag:K, parent?:HTMLElement, className?:string): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);
    if (parent) {
        parent.appendChild(el);
    }
    if (className) {
        el.className = className;
    }
    return el;
}

export function getJSON(url: string, params: any, callback:Function, auth?:string) {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) {
            return;
        }
        if (xhr.status !== 200 && xhr.status !== 304) {
            callback('');
            return;
        }
        callback(JSON.parse(xhr.response));
    };
    xhr.open('GET', url + getParamString(params), true);
	xhr.setRequestHeader('Accept', 'application/json');
	if (auth) {
		xhr.setRequestHeader("Authorization", auth);
	}
    xhr.send(null);
}

export function getParamString(obj:any, existingUrl?:string, uppercase?:boolean) {
	if (!obj) {
		return "";
	}
	const params = [];	
	for (let i in obj) {
		const key = encodeURIComponent(uppercase ? i.toUpperCase() : i);
		const value = obj[i];
		if (!Array.isArray(value)) {
			params.push(key + '=' + encodeURIComponent(value));
		} else {
			for (let j = 0; j < value.length; j++) {
				params.push(key + '=' + encodeURIComponent(value[j]));
			}
		}
	}
	return (!existingUrl || existingUrl.indexOf('?') === -1 ? '?' : '&') + params.join('&');
}