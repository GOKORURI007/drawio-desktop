import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {BrowserWindow, dialog, Menu} from 'electron';
import Store from 'electron-store';

// Keep the approved snapshot. Later edits to the source file require reimport.
let library;

async function install(win)
{
	const chosen = await dialog.showOpenDialog(win, {
		title: 'Install local draw.io plugin', properties: ['openFile'],
		filters: [{name: 'JavaScript plugin', extensions: ['js']}]
	});
	if (chosen.canceled) return;
	const file = chosen.filePaths[0];
	if (path.extname(file).toLowerCase() !== '.js') throw Error('Select a .js plugin');
	const name = path.basename(file);
	const source = await readFile(file, 'utf8');
	const answer = await dialog.showMessageBox(win, {
		type: 'warning', message: 'Trust and install ' + name + '?',
		detail: file + '\nThis script will run in the editor and can access your diagrams. Installing again replaces the copy with the same name. Changes apply to newly opened editor windows.',
		buttons: ['Cancel', 'Install'], defaultId: 0, cancelId: 0
	});
	if (answer.response === 1)
	{
		const others = library.get('plugins').filter(p => p.name !== name);
		library.set('plugins', [...others, {name, source}]);
		setPluginMenu();
	}
}

export function setPluginMenu()
{
	library ??= new Store({name: 'desktop-plugins', defaults: {plugins: []}});
	const plugins = library.get('plugins');
	Menu.setApplicationMenu(Menu.buildFromTemplate([{label: 'Local Plugins', submenu: [
		{label: 'Install JavaScript plugin…', click: (_, win) => {
			if (win instanceof BrowserWindow) install(win).catch(err => dialog.showErrorBox('Plugin installation failed', err.message));
		}},
		{label: 'Remove plugin', enabled: plugins.length > 0, submenu: plugins.map(({name}) => ({
			label: name, click: () => {
				library.set('plugins', library.get('plugins').filter(p => p.name !== name));
				setPluginMenu();
			}
		}))}
	]}]));
}

export async function loadLocalPlugins(frame)
{
	for (const plugin of library.get('plugins'))
	{
		try { await frame.executeJavaScript(plugin.source + '\n;void 0'); }
		catch (err) { console.error('Could not load draw.io plugin', plugin.name, err); }
	}
}
