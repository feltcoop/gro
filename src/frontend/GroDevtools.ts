// TODO maybe rename this to `FrontendDevtools`, `ClientDevtools`, or `BrowserDevtools`?
export class GroDevtools {
	head: HTMLHeadElement;
	styleElementsByPath: Map<string, HTMLLinkElement> = new Map();
	socket: WebSocket;

	constructor() {
		this.head = document.getElementsByTagName('head')[0];

		const socket = (this.socket = new WebSocket('ws://localhost:8999'));
		socket.addEventListener('open', (event) => {
			console.log('socket open', event);
			socket.send('hello from the client!');
		});
		socket.addEventListener('message', (event) => {
			console.log('socket message', event);
		});
		socket.addEventListener('close', (event) => {
			console.log('socket close', event);
		});
		socket.addEventListener('error', (event) => {
			console.log('socket error', event);
		});
		window.addEventListener('beforeunload', () => {
			socket.close();
		});
	}

	registerCss(path: string) {
		if (this.styleElementsByPath.has(path)) {
			// TODO should this do reference counting and remove unused CSS?
			// if so, we need to have components call `unregisterCss`,
			// which could be a function returned from this method
			return;
		}
		const styleEl = document.createElement('link');
		this.styleElementsByPath.set(path, styleEl);
		styleEl.rel = 'stylesheet';
		styleEl.href = path;
		this.head.appendChild(styleEl);
	}
}
