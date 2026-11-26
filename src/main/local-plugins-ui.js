Draw.loadPlugin(function(ui)
{
	function request(action)
	{
		electron.request({action: action}, function() {}, function(err)
		{
			ui.alert('本地插件操作失败：' + (err.message || err));
		});
	}

	var label = '载入本地插件';
	var install = ui.actions.addAction('installDesktopPlugin', function() { request('installDesktopPlugin'); });
	install.label = label;
	var remove = ui.actions.addAction('removeDesktopPlugin', function() { request('removeDesktopPlugin'); });
	remove.label = '移除本地插件…';
	ui.menus.addPluginMenuItems('extras', ['-', 'installDesktopPlugin', 'removeDesktopPlugin']);

	function addButton()
	{
		var bar = ui.menubar && ui.menubar.container;
		if (!bar || bar.querySelector('[data-install-desktop-plugin]')) return;
		var button = document.createElement('a');
		button.className = 'geItem';
		button.setAttribute('role', 'button');
		button.setAttribute('data-install-desktop-plugin', '');
		button.tabIndex = 0;
		button.textContent = label;
		button.addEventListener('click', function() { ui.hideCurrentMenu(); install.funct(); });
		button.addEventListener('keydown', function(evt)
		{
			if (evt.key === 'Enter' || evt.key === ' ')
			{
				evt.preventDefault();
				button.click();
			}
		});
		var items = bar.querySelectorAll(':scope > a.geItem');
		bar.insertBefore(button, items.length ? items[items.length - 1].nextSibling : null);
	}

	addButton();
	ui.addListener('currentThemeChanged', addButton);
	ui.addListener('languageChanged', addButton);
});
