"use strict";
var settingsNav = [
	{
		'id': 'settings',
		'label': 'Settings',
		'checkPermission': {
			'service': 'dashboard',
			'route': '/settings/tenant/get'
		},
		'url': '#/settings',
		'tplPath': 'modules/settings/directives/list.tmpl',
		'icon': 'cogs',
		'mainMenu': true,
		'pillar': {
			'name': 'management',
			'label': 'Product',
			'position': 2
		},
		'tracker': true,
		'scripts': ['modules/settings/config.js', 'modules/settings/controller.js'],
		'ancestor': [translation.home[LANG]]
	}
];
navigation = navigation.concat(settingsNav);