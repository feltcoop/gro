// TODO maybe rename this to `FrontendDevtools`, `ClientDevtools`, or `BrowserDevtools`?
export class GroDevtools {
	head: HTMLHeadElement;
	styleElementsByPath: Map<string, HTMLStyleElement> = new Map();
	socket: WebSocket;

	constructor() {
		this.head = document.getElementsByTagName('head')[0];

		const socket = (this.socket = new WebSocket('ws://localhost:8999'));
		socket.addEventListener('open', (event) => {
			console.log('socket open', event);
			socket.send('hello from the client!');
		});
		socket.addEventListener('message', (event) => {
			const data = JSON.parse(event.data);
			console.log('socket message', data);
			// Check for CSS changes.
			if (data.type === 'compiledSourceFile') {
				for (const compiledFile of data.sourceFile.compiledFiles) {
					if (
						compiledFile.extension === '.css' &&
						compiledFile.buildConfig.platform === 'browser'
					) {
						// TODO where to get this? basePath? dirBasePath? on the compiled file?
						const cssPath = compiledFile.id.substring(
							'/home/ryan/dev/gro/.gro/dev/browser/frontend'.length,
						);
						// TODO how to improve this? check for original CSS first? including " at end of regxp?
						// TODO cache in a map by path?
						// TODO types
						const jsCompiledFile = data.sourceFile.compiledFiles.find(
							(file: any) =>
								file.extension === '.js' && file.buildConfig.name === compiledFile.buildConfig.name,
						)!;
						const [originalSvelteHash] = jsCompiledFile.contents.match(/svelte-(\w+)"/)!;
						console.log('originalSvelteHash', originalSvelteHash);
						this.handleCssChange(cssPath, compiledFile.contents, originalSvelteHash);
					}
				}
			}
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

	async registerCss(path: string): Promise<void> {
		if (this.styleElementsByPath.has(path)) {
			// TODO should this do reference counting and remove unused CSS?
			// if so, we need to have components call `unregisterCss`,
			// which could be a function returned from this method
			return;
		}
		console.log('register css', path);
		const styleEl = document.createElement('style');
		this.styleElementsByPath.set(path, styleEl);
		this.head.appendChild(styleEl);
		const result = await (await fetch(path)).text();
		console.log('result', path, result);
		styleEl.textContent = result;
	}

	// TODO this works, but does it cache things properly? how can we do that to speed up refreshes?
	handleCssChange(path: string, contents: string, originalSvelteHash: string): void {
		console.log('handleCssChange contents', contents);
		const existingStyleEl = this.styleElementsByPath.get(path);
		if (!existingStyleEl) {
			throw Error(`Trying to handle css change but cannot find style element for path: ${path}`);
		}
		// TODO hack to preserve the original `svelte-` hashes, otherwise the new CSS matches nothing!
		// The correct fix is to update the JS modules, with all of the crazy caveats of HMR,
		// unless there's something simpler ..?
		// This breaks the case where you don't have a style block and then add one after the page loads.
		// Maybe we can pass the hash from the compiled files?
		const contentsWithOriginalSvelteHash = contents.replace(/svelte-\w+/g, originalSvelteHash);
		this.styleElementsByPath.delete(path);
		this.head.removeChild(existingStyleEl);
		const newStyleEl = document.createElement('style');
		newStyleEl.textContent = contentsWithOriginalSvelteHash;
		this.styleElementsByPath.set(path, newStyleEl);
		this.head.appendChild(newStyleEl);
	}
}
