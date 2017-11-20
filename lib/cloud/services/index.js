'use strict';

var fs = require("fs");
var utils = require("../../../utils/utils.js");
var async = require("async");

function checkIfError(soajs, mainCb, data, cb) {
	utils.checkErrorReturn(soajs, mainCb, data, cb);
}

var BL = {
	model: null,

	/**
	 * List all deployed services from cluster, SOAJS content + custom deployments/services
	 *
	 * @param {Object} Config
	 * @param {Object} SOAJS
	 * @param {Callback Function} cbMain
	 */
	"listServices": function (config, soajs, deployer, cbMain) {
		utils.getEnvironment(soajs, BL.model, soajs.inputmaskData.env.toUpperCase(), function (error, envRecord) {
			checkIfError(soajs, cbMain, {
				config: config,
				error: error || !envRecord,
				code: 600
			}, function () {
				checkIfError(soajs, cbMain, {
					config: config,
					error: !envRecord.deployer.type || !envRecord.deployer.selected || envRecord.deployer.type === 'manual',
					code: 743
				}, function () {
					
					var options = utils.buildDeployerOptions(envRecord, soajs, BL);
					checkIfError(soajs, cbMain, {config: config, error: !options, code: 825}, function () {
						//NOTE: listing soajs content by env
						options.params = {env: soajs.inputmaskData.env.toLowerCase()};
						deployer.listServices(options, function (error, services) {
							checkIfError(soajs, cbMain, {config: config, error: error}, function () {
								//NOTE: listing custom content
								options.params = {custom: true};
								deployer.listServices(options, function (error, customServices) {
									checkIfError(soajs, cbMain, {config: config, error: error}, function () {
										if (!services) services = [];
										if (customServices && customServices.length > 0) {
											services = services.concat(customServices);
										}
										
										var blackList = config.HA.blacklist;
										if (soajs.servicesConfig.dashboard && soajs.servicesConfig.dashboard.HA && soajs.servicesConfig.dashboard.HA.blacklist) {
											blackList = soajs.servicesConfig.dashboard.HA.blacklist;
										}
										services.forEach(function (oneService) {
											if (oneService.env) {
												for (var e = 0; e < oneService.env.length; e++) {
													var envName = oneService.env[e].split("=")[0];
													if (blackList.indexOf(envName.toLowerCase()) !== -1) {
														oneService.env[e] = envName + "=******************";
													}
												}
											}
										});
										
										return cbMain(null, services);
									});
								});
							});
						});
					});
				});
			});
		});
	},

	/**
	 * Scale a deployed service (SOAJS content or custom)
	 *
	 * @param {Object} Config
	 * @param {Object} SOAJS
	 * @param {Callback Function} cbMain
	 */
	"scaleService": function (config, soajs, deployer, cbMain) {
		utils.getEnvironment(soajs, BL.model, soajs.inputmaskData.env.toUpperCase(), function (error, envRecord) {
			checkIfError(soajs, cbMain, {
				config: config,
				error: error || !envRecord,
				code: 600
			}, function () {
				checkIfError(soajs, cbMain, {
					config: config,
					error: !envRecord.deployer.type || !envRecord.deployer.selected || envRecord.deployer.type === 'manual',
					code: 743
				}, function () {
					
					var options = utils.buildDeployerOptions(envRecord, soajs, BL);
					options.params = {
						id: soajs.inputmaskData.serviceId,
						scale: soajs.inputmaskData.scale
					};
					deployer.scaleService(options, function (error) {
						checkIfError(soajs, cbMain, {config: config, error: error}, function () {
							return cbMain(null, true);
						});
					});
				});
			});
		});
	},

	/**
	 * Delete a deployed service (SOAJS content or custom)
	 *
	 * @param {Object} Config
	 * @param {Object} SOAJS
	 * @param {Callback Function} cbMain
	 */
	"deleteService": function (config, soajs, deployer, cbMain) {
		utils.getEnvironment(soajs, BL.model, soajs.inputmaskData.env.toUpperCase(), function (error, envRecord) {
			checkIfError(soajs, cbMain, {
				config: config,
				error: error || !envRecord,
				code: 600
			}, function () {
				checkIfError(soajs, cbMain, {
					config: config,
					error: !envRecord.deployer.type || !envRecord.deployer.selected || envRecord.deployer.type === 'manual',
					code: 743
				}, function () {
					
					var options = utils.buildDeployerOptions(envRecord, soajs, BL);
					options.params = {
						id: soajs.inputmaskData.serviceId,
						mode: soajs.inputmaskData.mode //NOTE: required for kubernetes driver only
					};
					deployer.deleteService(options, function (error) {
						checkIfError(soajs, cbMain, {config: config, error: error}, function () {
							return cbMain(null, true);
						});
					});
				});
			});
		});
	},

	/**
	 * Check if resource is deployed
	 * @param  {Object}   config
	 * @param  {Object}   soajs
	 * @param  {Object}   deployer
	 * @param  {Function} cb
	 *
	 */
	checkResource: function(config, soajs, deployer, cb) {
		utils.getEnvironment(soajs, BL.model, soajs.inputmaskData.env.toUpperCase(), function (error, envRecord) {
			checkIfError(soajs, cb, {
				config: config,
				error: error || !envRecord,
				code: 600
			}, function () {
				checkIfError(soajs, cb, {
					config: config,
					error: !envRecord.deployer.type || !envRecord.deployer.selected || envRecord.deployer.type === 'manual',
					code: 743
				}, function () {
					
					var options = utils.buildDeployerOptions(envRecord, soajs, BL);
					checkIfError(soajs, cb, { config: config, error: !options, code: 600 }, function() {
						deployer.listKubeServices(options, function(error, services) {
							checkIfError(soajs, cb, { config: config, error: error }, function() {
								async.detect(services, function(oneService, callback) {
									return callback(null, oneService && oneService.metadata && oneService.metadata.name === soajs.inputmaskData.resource && oneService.metadata.namespace === soajs.inputmaskData.namespace);
								}, function(error, service) {
									//no error to be handled
									return cb(null, {
										deployed: (service && Object.keys(service).length > 0) ? true : false
									});
								});
							});
						});
					});
				});
			});
		});
	}
};

module.exports = {
	"init": function (modelName, cb) {
		var modelPath;

		if (!modelName) {
			return cb(new Error("No Model Requested!"));
		}

		modelPath = __dirname + "/../../../models/" + modelName + ".js";
		return requireModel(modelPath, cb);

		/**
		 * checks if model file exists, requires it and returns it.
		 * @param filePath
		 * @param cb
		 */
		function requireModel(filePath, cb) {
			//check if file exist. if not return error
			fs.exists(filePath, function (exists) {
				if (!exists) {
					return cb(new Error("Requested Model Not Found!"));
				}

				BL.model = require(filePath);
				return cb(null, BL);
			});
		}
	}
};
