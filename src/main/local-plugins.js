import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {dialog, Menu} from 'electron';
import Store from 'electron-store';

let library;
function pluginStore()
{
	return library ??= new Store({name: 'desktop-plugins', defaults: {plugins: []}});
}

export async function installLocalPlugin(win)
{
	const chosen = await dialog.showOpenDialog(win, {
		title: '载入本地插件', buttonLabel: '选择插件', properties: ['openFile'],
		filters: [{name: 'JavaScript 插件', extensions: ['js']}]
	});
	if (chosen.canceled) return;
	const file = chosen.filePaths[0];
	if (path.extname(file).toLowerCase() !== '.js') throw Error('请选择 .js 插件文件');
	const name = path.basename(file);
	const source = await readFile(file, 'utf8');
	const answer = await dialog.showMessageBox(win, {
		type: 'warning', title: '安装本地插件', message: '信任并安装“' + name + '”？',
		detail: file + '\n插件可以访问图表。安装后请打开新的编辑器窗口。同名插件将被替换。',
		buttons: ['取消', '安装'], defaultId: 0, cancelId: 0
	});
	if (answer.response === 1)
	{
		const store = pluginStore();
		const others = store.get('plugins').filter(p => p.name !== name);
		store.set('plugins', [...others, {name, source}]);
	}
}

export function showRemovePluginMenu(win)
{
	const store = pluginStore();
	const entries = store.get('plugins').map(({name}) => ({
		label: name, click: () => store.set('plugins', store.get('plugins').filter(p => p.name !== name))
	}));
	Menu.buildFromTemplate(entries.length ? entries : [{label: '暂无本地插件', enabled: false}]).popup({window: win});
}

export async function loadLocalPlugins(frame)
{
	const menuScript = await readFile(new URL('./local-plugins-ui.js', import.meta.url), 'utf8');
	await frame.executeJavaScript(menuScript);
	for (const plugin of pluginStore().get('plugins'))
	{
		try { await frame.executeJavaScript(plugin.source + '\n;void 0'); }
		catch (err) { console.error('Could not load draw.io plugin', plugin.name, err); }
	}
}
