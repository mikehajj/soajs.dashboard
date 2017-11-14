'use strict';
var fs = require("fs");
var async = require("async");

var utils = require("../../../utils/utils.js");

var colls = {
	git: 'git_accounts',
	services: 'services',
	daemons: 'daemons',
	staticContent: 'staticContent',
	catalog: 'catalogs',
	resources: 'resources',
	environment: 'environment'
};

var helpers = {

	/**
	 * check if there are any docker or kubernetes exposed ports and how they are configured
	 * @param context
	 * @param config
	 * @param cbMain
	 * @param cb
	 * @returns {*}
	 */
	checkPort: function (context, config, cbMain, cb) {
		var deployType = context.envRecord.deployer.selected.split('.')[1];
		if (deployType !== 'kubernetes') {
			return cb();
		}
		if (!context.catalog.recipe.deployOptions || !context.catalog.recipe.deployOptions.ports || context.catalog.recipe.deployOptions.ports.length === 0) {
			return cb();
		}

		var ports = context.catalog.recipe.deployOptions.ports;
		async.each(ports, function (onePort, callback) {
			if (!onePort.published) {
				return callback();
			}

			if (onePort.published > 30000) {
				onePort.published -= 30000;
			}

			if (onePort.published < config.kubeNginx.minPort || onePort.published > config.kubeNginx.maxPort) {
				return callback({wrongPort: onePort});
			}

			return callback();
		}, function (error) {
			if (error && error.wrongPort) {
				var errMsg = config.errors[824];
				errMsg = errMsg.replace("%PORTNUMBER%", error.wrongPort.published);
				errMsg = errMsg.replace("%MINNGINXPORT%", config.kubeNginx.minPort);
				errMsg = errMsg.replace("%MAXNGINXPORT%", config.kubeNginx.maxPort);
				return cbMain({"code": 824, "msg": errMsg});
			}
			else {
				async.map(ports, function (onePort, callback) {
					// Increment all exposed port by 30000 to be in the port range of kubernetes exposed ports
					// NOTE: It's better to leave it for the user to set the proper ports
					if (onePort.published) {
						onePort.published += 30000;
					}

					return callback(null, onePort)
				}, function (error, updatedPorts) {
					//No error to be handled
					context.ports = context.catalog.recipe.deployOptions.ports = updatedPorts;
					return cb();
				});
			}
		});
	},

	/**
	 * Get activated git record from data store
	 *
	 * @param {Object} soajs
	 * @param {Object} repo
	 * @param {Callback Function} cb
	 */
	getGitRecord: function (soajs, repo, BL, cb) {
		var opts = {
			collection: colls.git,
			conditions: {'repos.name': repo},
			fields: {
				provider: 1,
				domain: 1,
				token: 1,
				'repos.$': 1
			}
		};

		BL.model.findEntry(soajs, opts, cb);
	},
	/**
	 * map computed env variables into catalog recipe env variables
	 * @param context
	 * @param soajs
	 * @param config
	 * @param cb
	 * @returns {*}
	 */
	computeCatalogEnvVars: function (context, soajs, config, cb) {
		// context.catalog.recipe.buildOptions.env <- read environment variables config
		// context.variables <- replace computed values from this object
		// context.serviceParams.variables <- push final list of values to this array
		if (!context.catalog.recipe.buildOptions || !context.catalog.recipe.buildOptions.env || Object.keys(context.catalog.recipe.buildOptions.env).length === 0) {
			return cb(null, []);
		}

		var catalogEnvs = Object.keys(context.catalog.recipe.buildOptions.env);
		async.concat(catalogEnvs, function (oneEnvName, callback) {
			var oneEnv = context.catalog.recipe.buildOptions.env[oneEnvName];
			var result = [];
			// if env variable is of type static, just set its value and return
			if (oneEnv.type === 'static') {
				result.push(oneEnvName + '=' + oneEnv.value);
			}
			// if env variable is of type userInput, get value from request body, if not found see use default value
			else if (oneEnv.type === 'userInput') {
				var value = null;
				// first set to default value if found
				if (oneEnv.default) value = oneEnv.default;

				// if user specified value in request body, overwrite default with the new value
				if (soajs.inputmaskData.custom &&
					soajs.inputmaskData.custom.env &&
					soajs.inputmaskData.custom.env[oneEnvName]) {
					value = soajs.inputmaskData.custom.env[oneEnvName];
				}

				if (value) {
					result.push(oneEnvName + '=' + value);
				}
				else {
					return callback({type: 'userInput', name: oneEnvName});
				}
			}
			else if (oneEnv.type === 'computed') {
				// if computed value is dynamic, collect all applicable values and set them
				if (config.HA.dynamicCatalogVariables.indexOf(oneEnv.value) !== -1) {
					var nVariableName = oneEnv.value.replace(/_N$/, ''), nCount = 1;
					var regex = new RegExp(nVariableName.replace("$", "\\$") + '_[0-9]+');
					Object.keys(context.variables).forEach(function (oneVar) {
						if (oneVar.match(regex)) {
							result.push(oneEnvName + '_' + nCount++ + '=' + context.variables[oneVar]);
						}
					});
				}
				else {
					if (oneEnv.value && context.variables[oneEnv.value]) {
						result.push(oneEnvName + '=' + context.variables[oneEnv.value]);
					}
				}
			}
			return callback(null, result);
		}, cb);
	},
	/**
	 * Get environment record and extract cluster information from it
	 *
	 * @param {Object} soajs
	 * @param {Callback Function} cb
	 */
	getDashDbInfo: function (soajs, cb) {
		let envRecord = soajs.registry;
		let data;

		let cluster = envRecord.coreDB.provision;
		data = {
			mongoDbs: cluster.servers,
			mongoCred: cluster.credentials,
			clusterInfo: cluster,
			prefix: envRecord.coreDB.provision.prefix
		};
		
		if (process.env.SOAJS_SAAS && soajs.servicesConfig && soajs.servicesConfig.dashboard && soajs.servicesConfig.dashboard.SOAJS_COMPANY) {
			if (soajs.inputmaskData.project && soajs.servicesConfig.dashboard.SOAJS_COMPANY[soajs.inputmaskData.project]) {
				data.prefix = soajs.inputmaskData.project + '_';
				data.credentials = soajs.servicesConfig.dashboard.SOAJS_COMPANY[soajs.inputmaskData.project].credentials;
			}
		}

		return cb(null, data);
	},

	/**
	 * function that returns a cluster resource based on its name
	 * @param {Object} soajs
	 * @param {Object} name
	 * @param {Function} cb
	 */
	getClusterResource: function (soajs, BL, name, cb) {
		BL.model.findEntry(soajs, {
			collection: colls.resources,
			conditions: {
				"name": name,
				"type": "cluster",
				locked: true,
				plugged: true,
				shared: true
			}
		}, cb);
	},

	/**
	 * function that calls the drivers and deploys a service/container
	 *
	 * @param {Object} config
	 * @param {Object} opts
	 * @param {Object} soajs
	 * @param {Object} registry
	 * @param {Response} res
	 *
	 */
	deployContainer: function (config, context, soajs, registry, deployer, BL, cbMain) {
		// console.log(JSON.stringify(context, null, 2));

		var options = context.options;
		var platform = context.platform;

		function verifyReplicationMode(soajs) {
			if (soajs.inputmaskData.deployConfig.isKubernetes) {
				if (soajs.inputmaskData.deployConfig.replication.mode === 'replicated') return "deployment";
				else if (soajs.inputmaskData.deployConfig.replication.mode === 'global') return "daemonset";
				else return soajs.inputmaskData.deployConfig.replication.mode
			}

			return soajs.inputmaskData.deployConfig.replication.mode
		}

		function createService(cb) {
			options.params = context.serviceParams;
			soajs.log.debug("Creating service with deployer: " + JSON.stringify(options.params));
			deployer.deployService(options, function (error, data) {
				utils.checkErrorReturn(soajs, cbMain, { config: config, error: error }, function() {
					return cb(null, data);
				});
			});
		}

		function rebuildService(cb) {
			options.params = {
				id: soajs.inputmaskData.serviceId,
				mode: soajs.inputmaskData.mode, //NOTE: only required for kubernetes driver
				action: soajs.inputmaskData.action,
				newBuild: context.serviceParams
			};

			soajs.log.debug("Rebuilding service with deployer: " + JSON.stringify(options.params));
			deployer.redeployService(options, function (error) {
				utils.checkErrorReturn(soajs, cbMain, {config: config, error: error}, cb);
			});
		}

		function buildAvailableVariables() {
			var variables = {
				'$SOAJS_ENV': context.envRecord.code.toLowerCase(),
				'$SOAJS_DEPLOY_HA': '$SOAJS_DEPLOY_HA', // field computed at the driver level
				'$SOAJS_HA_NAME': '$SOAJS_HA_NAME' // field computed at the driver level
			};

			for (var i in context.variables) {
				variables[i] = context.variables[i];
			}

			return variables;
		}

		function updateEnvSettings(cb) {
			if(context.catalog.type ==='nginx' || (context.catalog.subtype ==='nginx' && context.catalog.type ==='server')) {
				//if no ports are set in the recipe, do not perform check
				if(!context.catalog || !context.catalog.recipe || !context.catalog.recipe.deployOptions || !context.catalog.recipe.deployOptions.ports || !Array.isArray(context.catalog.recipe.deployOptions.ports)) {
					return cb();
				}

				var protocol = (context.envRecord && context.envRecord.protocol) ? context.envRecord.protocol : 'http';
				var port = (context.envRecord && context.envRecord.port) ? context.envRecord.port : 80;

				for(var i = 0; i < context.catalog.recipe.deployOptions.ports.length; i++) {
					var onePort = context.catalog.recipe.deployOptions.ports[i];

					//check for http port first, if found set it as env port
					if(onePort.name === 'http' && onePort.isPublished && onePort.published) {
						port = onePort.published;
						protocol = 'http';
					}

					//then check if https port is found and published, if yes check if ssl is on and set the port and protocol accordingly
					if(onePort.name === 'https' && onePort.isPublished && onePort.published) {
						for (var i = 0; i < context.serviceParams.variables.length; i++) {
							var oneEnv = context.serviceParams.variables[i].split('=');
							if(oneEnv[0] === 'SOAJS_NX_API_HTTPS' && ['true', '1'].indexOf(oneEnv[1]) !== -1) {
								protocol = 'https';
								port = onePort.published;
							}
						}
					}
				}

				//compare the above values with the current environment settings and update if required
				if((!context.envRecord.protocol || (context.envRecord.protocol !== protocol)) || (!context.envRecord.port || (context.envRecord.port !== port))) {
					var opts = {
						collection: colls.environment,
						conditions: { code: context.envRecord.code.toUpperCase() },
						fields: {
							$set: {
								protocol: protocol,
								port: port
							}
						}
					};
					BL.model.updateEntry(soajs, opts, function(error) {
						utils.checkErrorReturn(soajs, cbMain, { config: config, error: error, code: 401 }, cb);
					});
				}
				else {
					//values are still the same, do not update environment record
					return cb();
				}
			}
			else {
				return cb();
			}
		}

		function constructDeployerParams(serviceName) {
			if (!soajs.inputmaskData.action || soajs.inputmaskData.action !== 'rebuild') {
				//settings replication is only applicable in deploy operations, not when rebuilding
				soajs.inputmaskData.deployConfig.replication.mode = verifyReplicationMode(soajs);
			}

			var image = '', iPrefix, iName, iTag;
			if (context.catalog.recipe.deployOptions.image.prefix) {
				image += context.catalog.recipe.deployOptions.image.prefix + '/';
				iPrefix = context.catalog.recipe.deployOptions.image.prefix;
			}

			image += context.catalog.recipe.deployOptions.image.name;
			iName = context.catalog.recipe.deployOptions.image.name;

			if (context.catalog.recipe.deployOptions.image.tag) {
				image += ':' + context.catalog.recipe.deployOptions.image.tag;
				iTag = context.catalog.recipe.deployOptions.image.tag;
			}

			if (soajs.inputmaskData.custom && soajs.inputmaskData.custom.image && soajs.inputmaskData.custom.image.name) {
				image = '';

				if (soajs.inputmaskData.custom.image.prefix) {
					image += soajs.inputmaskData.custom.image.prefix + '/';
					iPrefix = soajs.inputmaskData.custom.image.prefix;
				}

				image += soajs.inputmaskData.custom.image.name;
				iName = soajs.inputmaskData.custom.image.name;

				if (soajs.inputmaskData.custom.image.tag) {
					image += ':' + soajs.inputmaskData.custom.image.tag;
					iTag = soajs.inputmaskData.custom.image.tag;
				}
			}

			var serviceParams = {
				"env": context.envRecord.code.toLowerCase(),
				"id": serviceName.toLowerCase(),
				"name": serviceName.toLowerCase(),
				"image": image,
				"imagePullPolicy": context.catalog.recipe.deployOptions.image.pullPolicy || '',
				"labels": {
					"soajs.env.code": context.envRecord.code.toLowerCase(),
					"soajs.service.mode": (soajs.inputmaskData.deployConfig) ? soajs.inputmaskData.deployConfig.replication.mode : null, //replicated || global for swarm, deployment || daemonset for kubernetes
					"soajs.catalog.id": context.catalog._id.toString()
				},
				"memoryLimit": ((soajs.inputmaskData.deployConfig) ? soajs.inputmaskData.deployConfig.memoryLimit : null),
				"cpuLimit": ((soajs.inputmaskData.deployConfig) ? soajs.inputmaskData.deployConfig.cpuLimit : null),
				"replication": {
					"mode": ((soajs.inputmaskData.deployConfig) ? soajs.inputmaskData.deployConfig.replication.mode : null)
				},
				"version": parseFloat(soajs.inputmaskData.custom.version) || 1,
				"containerDir": config.imagesDir,
				"restartPolicy": {
					"condition": "any",
					"maxAttempts": 5
				},
				"network": ((platform === 'docker') ? config.network : ''),
				"ports": context.ports
			};

			if (soajs.inputmaskData.autoScale) {
				serviceParams.autoScale = {
					id: soajs.inputmaskData.autoScale.id,
					type: soajs.inputmaskData.autoScale.type,
					min: soajs.inputmaskData.autoScale.replicas.min,
					max: soajs.inputmaskData.autoScale.replicas.max,
					metrics: soajs.inputmaskData.autoScale.metrics
				};
			}

			if (context.catalog.v) {
				serviceParams.labels["soajs.catalog.v"] = context.catalog.v.toString();
			}

			if (iPrefix) serviceParams.labels['service.image.prefix'] = iPrefix;
			if (iName) serviceParams.labels['service.image.name'] = iName;
			if (iTag) serviceParams.labels['service.image.tag'] = iTag;

			if (['replicated', 'deployment'].indexOf(serviceParams.labels['soajs.service.mode']) !== -1) {
				serviceParams.labels["soajs.service.replicas"] = (soajs.inputmaskData.deployConfig) ? soajs.inputmaskData.deployConfig.replication.replicas : null; //if replicated how many replicas
				if (serviceParams.labels["soajs.service.replicas"]) {
					serviceParams.labels["soajs.service.replicas"] = serviceParams.labels["soajs.service.replicas"].toString();
				}
			}

			for (var oneLabel in context.labels) {
				serviceParams.labels[oneLabel] = context.labels[oneLabel];
			}

			//if a custom namespace is set in the catalog recipe, use it
			if (context.catalog.recipe.deployOptions.namespace) {
				serviceParams.namespace = context.catalog.recipe.deployOptions.namespace;
			}

			//Add readiness probe configuration if present, only for kubernetes deployments
			if (platform === 'kubernetes' && context.catalog.recipe && context.catalog.recipe.deployOptions && context.catalog.recipe.deployOptions.readinessProbe && Object.keys(context.catalog.recipe.deployOptions.readinessProbe).length > 0) {
				serviceParams.readinessProbe = context.catalog.recipe.deployOptions.readinessProbe;
			}

			//Add replica count in case of docker replicated service or kubernetes deployment
			if (soajs.inputmaskData.deployConfig && soajs.inputmaskData.deployConfig.replication.replicas) {
				serviceParams.replication.replicas = soajs.inputmaskData.deployConfig.replication.replicas;
			}
			//Override the default docker network of the user wants to use a custom overlay network
			if (platform === 'docker' && context.catalog.recipe.deployOptions.container && context.catalog.recipe.deployOptions.container.network) {
				serviceParams.network = context.catalog.recipe.deployOptions.container.network;
			}

			//Override the default container working directory if the user wants to set a custom path
			if (context.catalog.recipe.deployOptions.container && context.catalog.recipe.deployOptions.container.workingDir) {
				serviceParams.containerDir = context.catalog.recipe.deployOptions.container.workingDir;
			}

			//Override the default container restart policy if set
			if (context.catalog.recipe.deployOptions.restartPolicy) {
				serviceParams.restartPolicy.condition = context.catalog.recipe.deployOptions.restartPolicy.condition;
				if (context.catalog.recipe.deployOptions.restartPolicy.maxAttempts) {
					serviceParams.restartPolicy.maxAttempts = context.catalog.recipe.deployOptions.restartPolicy.maxAttempts;
				}
			}

			//Add the commands to execute when running the containers
			if (context.catalog.recipe.buildOptions && context.catalog.recipe.buildOptions.cmd && context.catalog.recipe.buildOptions.cmd.deploy && context.catalog.recipe.buildOptions.cmd.deploy.command) {
				serviceParams.command = context.catalog.recipe.buildOptions.cmd.deploy.command;
			}

			//Add the command arguments
			if (context.catalog.recipe.buildOptions && context.catalog.recipe.buildOptions.cmd && context.catalog.recipe.buildOptions.cmd.deploy && context.catalog.recipe.buildOptions.cmd.deploy.args) {
				serviceParams.args = context.catalog.recipe.buildOptions.cmd.deploy.args;
			}

			//If a service requires to run cmd commands before starting, get them from service record and add them
			if (serviceParams.command && context.serviceCmd) {
				if (!serviceParams.args) {
					serviceParams.args = [];
				}

				if (serviceParams.args[0] === '-c') {
					serviceParams.args.shift();
				}
				serviceParams.args = context.serviceCmd.concat(serviceParams.args);
				serviceParams.args = serviceParams.args.join(" && ");
				serviceParams.args = [serviceParams.args];
				serviceParams.args.unshift("-c");
			}

			//Add the user-defined volumes if any
			if (context.catalog.recipe.deployOptions && context.catalog.recipe.deployOptions.voluming) {
				serviceParams.voluming = context.catalog.recipe.deployOptions.voluming || {};
			}

			return serviceParams;
		}

		context.serviceParams = constructDeployerParams(context.name);
		context.variables = buildAvailableVariables();

		helpers.computeCatalogEnvVars(context, soajs, config, function (error, variables) {
			if (error) {
				var errorMessage = config.errors[911];
				errorMessage = errorMessage.replace('%ENV_NAME%', error.name);
				errorMessage = errorMessage.replace('%ENV_TYPE%', error.type);
				return cbMain({code: 911, msg: errorMessage});
			}

			context.serviceParams.variables = variables;
			if (!soajs.inputmaskData.action || soajs.inputmaskData.action !== 'rebuild') {
				createService(function (error, data) {
					//error handled in function
					updateEnvSettings(function() {
						return cbMain(null, data);
					});
				});
			}
			else {
				rebuildService(function () {
					updateEnvSettings(function() {
						return cbMain(null, true);
					});
				});
			}
		});
	}
};

module.exports = helpers;
