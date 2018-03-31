"use strict";

var environment = {
	"code": {
		"required": true,
		"type": "string",
		"format": "alphanumeric"
	},
	"description": {
		"required": true,
		"type": "string"
	},
	"domain": {
		"required": false,
		"type": "string",
		"format": "hostname"
	},
	"apiPrefix": {
		"required": false,
		"type": "string"
	},
	"sitePrefix": {
		"required": false,
		"type": "string"
	},
	"sensitive": {
		"required": false,
		"type": "boolean"
	},
	"soajsFrmwrk": {
		"required": false,
		"type": "boolean"
	},
	"cookiesecret": {
		"required": false,
		"type": "string"
	},
	"sessionName": {
		"required": false,
		"type": "string"
	},
	"sessionSecret": {
		"required": false,
		"type": "string"
	},
	"deployPortal": {
		"required": false,
		"type": "boolean"
	},
	"deploy": {
		"required": false,
		"type": "object",
		"propeties": {
		
		}
	},
	"templateId": {
		"required": true,
		"type": "string"
	}
};

module.exports = environment;