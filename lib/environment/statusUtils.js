"use strict";
let fs = require("fs");
let path = require("path");
let request = require("request");

var async = require("async");
var Grid = require('gridfs-stream');
var deployer = require("soajs").drivers;
var provision = require("soajs").provision;

var templates = require("../../templates/environment");

var shortid = require("shortid");
shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_');

/*
	required external BL modules
 */

var modelName = 'mongo';

var deployBL = require('../cloud/deploy/index.js');

var cdBL = require('../cd/index.js');
var cdHelper = require('../cd/helper.js');

var resourceBL = require("../resources/index.js");

var catalogBL = require("../catalog/index.js");

function initBLModel(BLModule, modelName, cb) {
	BLModule.init(modelName, cb);
}

var lib = {
	checkReturnError: function (req, mainCb, data, cb) {
		if (data.error) {
			if (typeof (data.error) === 'object') {
				req.soajs.log.error(data.error);
			}
			return mainCb({"code": data.code, "msg": data.config.errors[data.code]});
		} else {
			if (cb) {
				return cb();
			}
		}
	},
	
	uploadCertificates: function (req, context, cb) {
		if (context.template.deploy.selectedDriver === 'docker') {
			if (context.template.deploy.previousEnvironment) {
				return cb(null, true);
			}
			else {
				let certificatesNames = Object.keys(context.template.deploy.deployment.docker.certificates);
				context.BL.model.getDb(req.soajs).getMongoDB(function (error, db) {
					lib.checkReturnError(req, cb, {config: context.config, error: error, code: 727}, function () {
						let gfs = Grid(db, context.BL.model.getDb(req.soajs).mongodb);
						
						// async.eachSeries(certificatesNames, (oneCertificateName, mCb) => {
						// 	let oneCertificate = context.template.deploy.deployment.docker.certificates[oneCertificateName];
						//
						// 	let fileData = {
						// 		filename: oneCertificateName,
						// 		metadata: {
						// 			platform: oneCertificate.metadata.platform,
						// 			certType: oneCertificate.metadata.certType,
						// 			env: {}
						// 		}
						// 	};
						// 	fileData.metadata.env[oneCertificate.metadata.envCode] = [oneCertificate.metadata.platform + '.' + oneCertificate.metadata.driver];
						//
						// 	let writeStream = gfs.createWriteStream(fileData);
						// 	let filePath = path.join(__dirname, context.environmentRecord.code + "-" + shortid.generate() + "-" + oneCertificateName + ".pem");
						// 	fs.writeFile(filePath, oneCertificate.data, 'utf8', (error) => {
						// 		if(error) return mCb(error);
						//
						// 		fs.createReadStream(filePath).pipe(writeStream);
						//
						// 		// writeStream.on('error', function (error) {
						// 		// 	console.log(error);
						// 		// 	return lib.checkReturnError(req, cb, {config: context.config, error: error, code: 727});
						// 		// });
						// 		//
						// 		// writeStream.on('close', function () {
						// 		// 	fs.unlink(filePath, (error) => {
						// 		// 		if(error){
						// 		// 			req.soajs.log.error(error);
						// 		// 		}
						// 		//
						// 		// 		return mCb(null, true);
						// 		// 	});
						// 		// });
						// 		return mCb(null, true);
						// 	});
						// }, (error) => {
						// 	if (error) return cb(error);
							
							context.template.deploy.certificates = true;
							return cb(null, true);
						// });
					});
				});
			}
		}
		else {
			return cb(null, true);
		}
	},
	
	productize: function (req, context, cb) {
		if(!context.template.productize){
			context.template.productize = {};
		}
		// variables updated in checkIfProductAndPacksExists
		let productFound = false; // will also hold the product id if found
		let mainPackFound = false;
		let userPackFound = false;
		
		// variables updated in checkIfTenantAppsAndKeysExist
		let tenantFound = false;
		let mainApplicationFound = false;
		let userApplicationFound = false;
		let mainApplicationKeyFound = false;
		let userApplicationKeyFound = false;
		
		let tenantExtKey;
		
		/**
		 *  check if products and packages exist and update the following 3 variables: productFound, mainPackFound, userPackFound
		 * will also fill variables with id if found
		 *
		 * @param productCheckCb
		 */
		function checkIfProductAndPacksExists(productCheckCb) {
			req.soajs.log.debug("Checking for PRTAL product ...");
			context.BL.model.findEntry(req.soajs, {
				collection: 'products',
				conditions: {'code': 'PRTAL'}
			}, (error, product) => {
				if (error) return cb(error);
				if (product) {
					req.soajs.log.debug("PRTAL product found!");
					productFound = product['_id'];
					let packs = product.packages;
					if (packs) {
						packs.forEach(function (eachPack) {
							if (eachPack.code === 'PRTAL_MAIN') {
								req.soajs.log.debug("PRTAL_MAIN package found!");
								mainPackFound = true;
							}
							if (eachPack.code === 'PRTAL_USER') {
								req.soajs.log.debug("PRTAL_USER package found!");
								userPackFound = true;
							}
						});
					}
				}
				productCheckCb();
			});
		}
		
		/**
		 * check if the tenant found and update the following variables: tenantFound,mainApplicationFound,userApplicationFound,mainApplicationKeyFound,userApplicationKeyFound
		 * will also fill variables with id if found
		 * @param tenantCheckCb
		 */
		function checkIfTenantAppsAndKeysExist(tenantCheckCb) {
			req.soajs.log.debug("Checking for PRTL tenant ....");
			context.BL.model.findEntry(req.soajs, {
				collection: 'tenants',
				conditions: {'code': 'PRTL'}
			}, (error, tenant) => {
				if (error) return cb(error);
				if (tenant) {
					req.soajs.log.debug("PRTL tenant Found!");
					tenantFound = tenant['_id'];
					let applications = tenant.applications;
					if (applications) {
						applications.forEach(function (eachApp) {
							if (eachApp.package === 'PRTAL_MAIN' && eachApp.product === 'PRTAL') {
								mainApplicationFound = eachApp.appId;
								req.soajs.log.debug("PRTL_MAIN application Found!");
								if (eachApp.keys && eachApp.keys.length > 0 && eachApp.keys[0].config && eachApp.keys[0].config.portal
									&& eachApp.keys[0].extKeys && eachApp.keys[0].extKeys.length > 0 && eachApp.keys[0].extKeys[0].env === 'PORTAL') {
									tenantExtKey = eachApp.keys[0].extKeys[0].extKey;
									req.soajs.log.debug("PRTL_MAIN extKey Found!");
									mainApplicationKeyFound = true;
								}
							}
							if (eachApp.package === 'PRTAL_USER' && eachApp.product === 'PRTAL') {
								userApplicationFound = eachApp.appId;
								req.soajs.log.debug("PRTL_USER application Found!");
								if (eachApp.keys && eachApp.keys.length > 0 && eachApp.keys[0].config && eachApp.keys[0].config.portal
									&& eachApp.keys[0].extKeys && eachApp.keys[0].extKeys.length > 0 && eachApp.keys[0].extKeys[0].env === 'PORTAL') {
									req.soajs.log.debug("PRTL_USER extKey Found!");
									userApplicationKeyFound = true;
								}
							}
						});
					}
				}
				tenantCheckCb();
			});
		}
		
		function productizeApiCall(mCb) {
			initBLModel(require("../product/index.js"), modelName, (error, productsBL) => {
				if (error) return cb(error);
				
				if (!productFound) {
					let postData = {
						'code': "PRTAL",
						'name': "Portal Product",
						'description': "This product contains packages that offer access to the portal interface of SOAJS to manage your products."
					};
					req.soajs.log.debug("Creating PRTAL Product");
					req.soajs.inputmaskData = postData;
					productsBL.add(context.config, req, {}, (error, productId) => {
						if (error) return cb(error);
						
						addBasicPackage(productsBL, productId, (error) => {
							if (error) return cb(error);
							
							addUserPackage(productsBL, productId, (error) => {
								if (error) return cb(error);
								
								context.template.productize._id = productId;
								return mCb();
							});
						});
					});
				}
				else {
					context.template.productize._id = productFound;
					if (!mainPackFound) {
						addBasicPackage(productsBL, productFound, (error) => {
							if (error) return cb(error);
							
							if (userPackFound) {
								return mCb();
							}
							
							addUserPackage(productsBL, productFound, mCb);
						});
					} else {
						if (userPackFound) {
							return mCb();
						}
						addUserPackage(productsBL, productFound, mCb);
					}
				}
			});
			
			function addBasicPackage(productsBL, productId, mCb) {
				req.soajs.log.debug("Creating PRTAL_MAIN Package");
				req.soajs.inputmaskData = templates.mainPackage();
				req.soajs.inputmaskData.id = productId;
				productsBL.addPackage(context.config, req, {}, mCb);
			}
			
			function addUserPackage(productsBL, productId, mCb) {
				req.soajs.log.debug("Creating PRTAL_USER Package");
				req.soajs.inputmaskData = templates.userPackage();
				req.soajs.inputmaskData.id = productId;
				productsBL.addPackage(context.config, req, {}, mCb);
			}
		}
		
		function multitenancyApiCall(mCb) {
			initBLModel(require("../tenant/index.js"), modelName, (error, tenantBL) => {
				if (error) return cb(error);
				
				if (!tenantFound) {
					req.soajs.inputmaskData = templates.tenant();
					req.soajs.log.debug("Creating PRTL Tenant");
					tenantBL.add(context.config, req, {}, (error, data) => {
						let tenantId = data.id;
						
						req.soajs.inputmaskData = {
							"id": tenantId,
							"secret": "soajs beaver",
							"oauthType": "urac",
							"availableEnv": ["PORTAL"]
						};
						req.soajs.log.debug("Creating PRTL oAuth");
						tenantBL.saveOAuth(context.config, 425, 'tenant OAuth add successful', req, {}, (error) => {
							if (error) return cb(error);
							
							addApplication(tenantBL, tenantId, 'main', (error) => {
								if (error) return cb(error);
								
								addApplication(tenantBL, tenantId, 'user', (error) => {
									if (error) return cb(error);
									
									context.template.productize.tenant = tenantId;
									return mCb();
								});
							});
						});
					});
				}
				else {
					context.template.productize.tenant = tenantFound;
					addApplication(tenantBL, tenantFound, 'main', (error) => {
						if (error) return cb(error);
						
						addApplication(tenantBL, tenantFound, 'user', (error) => {
							if (error) return cb(error);
							
							context.template.productize.extKey = tenantExtKey;
							return mCb();
						});
					});
				}
			});
			
			function addApplication(tenantBL, tenantId, packageName, mCb) {
				let ttl = 7 * 24;
				let postData = {
					'description': 'Portal ' + packageName + ' application',
					'_TTL': ttl.toString(),
					'productCode': "PRTAL",
					'packageCode': packageName.toUpperCase()
				};
				
				if ((!mainApplicationFound && packageName === 'main') || (!userApplicationFound && packageName === 'user')) {
					req.soajs.inputmaskData = postData;
					req.soajs.inputmaskData.id = tenantId;
					req.soajs.log.debug("Creating PRTL Application:", packageName);
					tenantBL.addApplication(context.config, req, {}, (error, response) => {
						if (error) return cb(error);
						
						let appId = response.appId;
						addApplicationKey(tenantBL, appId, tenantId, packageName, mCb);
					});
				} else {
					if (packageName === 'main') {
						if (mainApplicationKeyFound) {
							return mCb();
						}
						addApplicationKey(tenantBL, mainApplicationFound, tenantId, packageName, mCb);
					} else { // user
						if (userApplicationKeyFound) {
							return mCb();
						}
						addApplicationKey(tenantBL, userApplicationFound, tenantId, packageName, mCb);
					}
				}
			}
			
			function addApplicationKey(tenantBL, appId, tenantId, packageName, addKeyCb) {
				req.soajs.inputmaskData = {"id": tenantId, "appId": appId};
				req.soajs.log.debug("Creating PRTL Application Key:", packageName);
				tenantBL.createApplicationKey(context.config, provision, req, {}, (error, response) => {
					if (error) return cb(error);
					
					let key = response.key;
					req.soajs.inputmaskData = {
						'expDate': null,
						'device': null,
						'geo': null,
						'env': 'PORTAL',
						"dashboardAccess": (packageName === 'user'),
						"id": tenantId,
						"appId": appId,
						"key": key
					};
					req.soajs.log.debug("Creating PRTL Application extKey:", packageName);
					tenantBL.addApplicationExtKeys(context.config, provision, req, {}, (error, response) => {
						if (error) return cb(error);
						
						if (packageName === 'main') {
							tenantExtKey = response.extKey;
							context.template.productize.extKey = tenantExtKey;
						}
						
						let domain = lib.getAPIInfo(context.template, context.template.nginx, 'sitePrefix');
						let postData = templates.tenantApplicationKeyConfig();
						postData.envCode = context.template.gi.code.toLowerCase();
						postData.config.urac.link.addUser = domain + "/#/setNewPassword";
						postData.config.urac.link.changeEmail = domain + "/#/changeEmail/validate";
						postData.config.urac.link.forgotPassword = domain + "/#/resetPassword";
						postData.config.urac.link.join = domain + "/#/join/validate";
						
						req.soajs.inputmaskData = postData;
						req.soajs.inputmaskData.id = tenantId;
						req.soajs.inputmaskData.appId = appId;
						req.soajs.inputmaskData.key = key;
						req.soajs.log.debug("Creating PRTL Application Config:", packageName);
						tenantBL.updateApplicationConfig(context.config, req, {}, addKeyCb);
					});
				});
			}
		}
		
		if (context.environmentRecord.code.toUpperCase() === 'PORTAL') {
			checkIfProductAndPacksExists(function () {
				checkIfTenantAppsAndKeysExist(function () {
					// now that the above variables are defined
					productizeApiCall((error) => {
						if (error) {
							return cb(error);
						}
						else {
							multitenancyApiCall(cb);
						}
					});
				});
			});
		}
		else {
			return cb(null, true);
		}
	},
	
	deployClusterResource: function (req, context, cb) {
		if (context.template.cluster.local) {
			req.soajs.log.debug("Fetching Mongo Server Deployment recipe");
			context.BL.model.findEntry(req.soajs, {
				collection: "catalogs",
				conditions: {name: 'Mongo Recipe'}
			}, (error, oneRecipe) => {
				let mongoRecipeId = oneRecipe._id.toString();
				
				//create resource object
				let resourceObj = {
					env: context.template.gi.code.toUpperCase(),
					resource: {
						"name": context.template.cluster.local.name,
						"type": "cluster",
						"category": "mongo",
						"plugged": true,
						"shared": false,
						"config": {
							"servers": context.template.cluster.local.servers,
							"URLParam": context.template.cluster.local.URLParam || {},
							"streaming": context.template.cluster.local.streaming || {}
						}
					}
				};
				
				if (context.template.cluster.local.credentials
					&& Object.hasOwnProperty.call(context.template.cluster.local.credentials, "username")
					&& Object.hasOwnProperty.call(context.template.cluster.local.credentials, "password")
					&& context.template.cluster.local.credentials.username !== ""
					&& context.template.cluster.local.credentials.password !== "") {
					resourceObj.resource.config.credentials = context.template.cluster.local.credentials;
				}
				
				if (context.template.cluster.local.prefix) {
					resourceObj.resource.config.prefix = context.template.cluster.local.prefix;
				}
				
				//add mongo cluster
				initBLModel(resourceBL, modelName, (error, resourceBL) => {
					if (error) return cb(error);
					
					req.soajs.log.debug("Creating Resource Entry for Mongo Server...");
					req.soajs.inputmaskData = resourceObj;
					resourceBL.addResource(context.config, req, {}, (error, resources) => {
						if (error) return cb(error);
						
						context.template.cluster._id = resources._id;
						let deployObject = {
							env: context.template.gi.code.toUpperCase(),
							recipe: mongoRecipeId,
							deployConfig: {
								"replication": {
									"replicas": 1,
									"mode": (context.template.deploy.selectedDriver === "kubernetes")
										? "deployment" : "replicated"
								}
							},
							custom: {
								"resourceId": resources._id.toString(),
								"name": context.template.cluster.local.name,
								"type": "cluster",
							}
						};
						
						//deploy mongo cluster
						initBLModel(deployBL, modelName, (error, deployBL) => {
							if (error) return cb(error);
							
							req.soajs.log.debug("Deploying local resource for Mongo Server...");
							req.soajs.inputmaskData = deployObject;
							deployBL.deployService(context.config, req.soajs, deployer, (error, service) => {
								if (error) return cb(error);
								
								if (service) {
									context.template.cluster.serviceId = service;
								}
								
								return cb(error, {
									name: context.template.cluster.local.name,
									prefix: context.template.cluster.local.prefix || null
								});
							});
						});
					});
				});
			});
		}
		else if (context.template.cluster.share) {
			//return shared cluster
			req.soajs.log.debug("Reusing existing Resource:", context.template.cluster.share.name);
			return cb(null, {
				name: context.template.cluster.share.name,
				prefix: context.template.cluster.share.prefix || null
			});
		}
		else if (context.template.cluster.external) {
			req.soajs.log.debug("Creating new External Mongo Configuration Resource:", context.template.cluster.external.name);
			//only add the resource
			let resourceObj = {
				env: context.template.gi.code.toUpperCase(),
				resource: {
					"name": context.template.cluster.external.name,
					"type": "cluster",
					"category": "mongo",
					"plugged": true,
					"shared": false,
					"config": {
						"servers": context.template.cluster.external.servers,
						"URLParam": context.template.cluster.external.URLParam || {},
						"streaming": context.template.cluster.external.streaming || {}
					}
				}
			};
			if (context.template.cluster.external.credentials
				&& Object.hasOwnProperty.call(context.template.cluster.external.credentials, "username")
				&& Object.hasOwnProperty.call(context.template.cluster.external.credentials, "password")
				&& context.template.cluster.external.credentials.username !== ""
				&& context.template.cluster.external.credentials.password !== "") {
				resourceObj.resource.config.credentials = context.template.cluster.external.credentials;
			}
			
			if (context.template.cluster.external.prefix) {
				resourceObj.resource.config.prefix = context.template.cluster.external.prefix;
			}
			
			initBLModel(resourceBL, modelName, (error, resourceBL) => {
				if (error) return cb(error);
				
				req.soajs.inputmaskData.resource = resourceObj;
				resourceBL.addResource(context.config, req, {}, (error, resources) => {
					if (error) return cb(error);
					
					if (resources && resources._id) {
						context.template.cluster._id = resources._id;
					}
					
					return cb(error, {
						name: context.template.cluster.external.name,
						prefix: context.template.cluster.external.prefix || null
					});
				});
			});
		}
	},
	
	handleClusters: function (req, context, cb) {
		if (context.environmentRecord.code.toUpperCase() === 'PORTAL') {
			lib.deployClusterResource(req, context, (error, cluster) => {
				if (error) return cb(error);
				
				let uracData = {
					"name": "urac",
					"cluster": cluster.name,
					"tenantSpecific": true
				};
				
				if (cluster.prefix) {
					uracData.prefix = cluster.prefix;
				}
				
				//add urac db using cluster
				req.soajs.inputmaskData = uracData;
				req.soajs.inputmaskData.env = context.template.gi.code.toUpperCase();
				req.soajs.log.debug("Create new database for Urac");
				context.BL.addDb(context.config, req, {}, (error) => {
					if (error) return cb(error);
					
					let sessionData = {
						"name": "session",
						"cluster": cluster.name,
						"tenantSpecific": false,
						"sessionInfo": {
							dbName: "core_session",
							store: {},
							collection: "sessions",
							stringify: false,
							expireAfter: 1209600000
						}
					};
					if (cluster.prefix) {
						sessionData.prefix = cluster.prefix;
					}
					
					//update session db
					req.soajs.inputmaskData = sessionData;
					req.soajs.inputmaskData.env = context.template.gi.code.toUpperCase();
					req.soajs.log.debug("Create new database for Session");
					context.BL.addDb(context.config, req, {}, cb);
				});
			});
		}
		else {
			return cb(null, true);
		}
	},
	
	deployservice: function (req, context, serviceName, version, cb) {
		if(!context.template[serviceName]){
			return cb();
		}
		
		let data = {
			"deployConfig": {
				"replication": {
					"mode": context.template[serviceName].mode
				},
				"memoryLimit": context.template[serviceName].memory * 1048576
			},
			"gitSource": {
				"owner": "soajs",
				"repo": "soajs." + serviceName,
				"branch": context.template[serviceName].branch
			},
			"custom": {
				"name": serviceName,
				"type": "service",
				"version": version.toString()
			},
			"recipe": context.template[serviceName].catalog,
			"env": context.template.gi.code.toUpperCase()
		};
		
		//get the commit
		if (context.template[serviceName].commit) {
			data.gitSource.commit = context.template[serviceName].commit;
		}
		
		//check the replicas
		if (['replicated', 'deployment'].indexOf(context.template[serviceName].mode) !== -1) {
			data.deployConfig.replication.replicas = context.template[serviceName].number;
		}
		
		//if custom image info
		if (context.template[serviceName].imageName) {
			data.custom.image = {
				name: context.template[serviceName].imageName,
				prefix: context.template[serviceName].imagePrefix,
				tag: context.template[serviceName].imageTag
			}
		}
		
		//if user input env variables
		if (context.template[serviceName].custom) {
			data.custom.env = {};
			for (let env in context.template[serviceName].custom) {
				data.custom.env[env] = context.template[serviceName].custom[env].value;
			}
		}
		
		let cdPost = {
			serviceName: serviceName,
			env: context.template.gi.code.toUpperCase()
		};
		
		if (serviceName === 'controller') {
			cdPost.default = {
				deploy: true,
				options: data
			};
		}
		else {
			cdPost.version = {
				deploy: true,
				options: data,
				v: 'v' + version
			};
		}
		
		async.series({
			"registerCD": function (mCb) {
				req.soajs.log.debug("Registering CD entry for service " + serviceName + " in environment " + context.template.gi.code.toUpperCase());
				initBLModel(cdBL, modelName, (error, cdBL) => {
					if (error) return cb(error);
					req.soajs.inputmaskData = {config: cdPost};
					cdBL.saveConfig(context.config, req, cdHelper, mCb);
				});
			},
			"deployService": function (mCb) {
				req.soajs.log.debug("Deploying service " + serviceName + " in environment " + context.template.gi.code.toUpperCase());
				initBLModel(deployBL, modelName, (error, deployBL) => {
					if (error) return mCb(error);
					
					data.custom.version = parseInt(data.custom.version);
					req.soajs.inputmaskData = data;
					deployBL.deployService(context.config, req.soajs, deployer, (error, data) => {
						if (error) return mCb(error);
						
						context.template[serviceName]._id = data.id;
						return mCb(null, true);
					});
				});
			}
		}, cb);
	},
	
	deployController: function (req, context, cb) {
		lib.deployservice(req, context, 'controller', 1, cb)
	},
	
	deployUrac: function (req, context, cb) {
		lib.deployservice(req, context, 'urac', 2, cb)
	},
	
	deployOauth: function (req, context, cb) {
		lib.deployservice(req, context, 'oauth', 1, cb)
	},
	
	createNginxRecipe: function (req, context, cb) {
		if(!context.template.nginx){
			return cb();
		}
		let recipe = buildRecipe();
		let catalog = {
			description: "Nginx Recipe for " + context.template.gi.code.toUpperCase() + " Environment",
			name: "Deployer Recipe for " + context.template.gi.code.toUpperCase() + " Nginx",
			recipe: recipe,
			type: "server",
			subtype: "nginx"
		};
		
		req.soajs.log.debug("Creating new Nginx Recipe:", catalog.name);
		initBLModel(catalogBL, modelName, (error, catalogBL) => {
			if (error) return cb(error);
			
			req.soajs.inputmaskData = {catalog: catalog};
			catalogBL.add(context.config, req, (error, catalogId) => {
				if (error) return cb(error);
				
				context.template.nginx.recipe = catalogId;
				return cb(null, true);
			});
		});
		
		function buildRecipe() {
			let recipe = templates.nginxRecipe();
			
			recipe.deployOptions.image.prefix = context.template.nginx.imagePrefix || "soajsorg";
			recipe.deployOptions.image.name = context.template.nginx.imageName || "nginx";
			recipe.deployOptions.image.tag = context.template.nginx.imageTag || "latest";
			recipe.deployOptions.ports[0].published = context.template.nginx.http || 80;
			
			//only for case of portal
			if (context.environmentRecord.code.toUpperCase() === "PORTAL") {
				recipe.buildOptions.env["SOAJS_EXTKEY"] = {
					"type": "computed",
					"value": "$SOAJS_EXTKEY"
				};
				recipe.buildOptions.env["SOAJS_GIT_PORTAL_BRANCH"] = {
					"type": "static",
					"value": "master"
				};
			}
			
			if (context.template.nginx.imageName) {
				recipe.deployOptions.image.override = true;
			}
			
			if (context.template.deploy.selectedDriver === 'docker') {
				recipe.deployOptions.voluming.volumes = [
					{
						"Type": "volume",
						"Source": "soajs_log_volume",
						"Target": "/var/log/soajs/"
					},
					{
						"Type": "bind",
						"ReadOnly": true,
						"Source": "/var/run/docker.sock",
						"Target": "/var/run/docker.sock"
					}
				];
			}
			else if (context.template.deploy.selectedDriver === 'kubernetes') {
				recipe.deployOptions.voluming.volumes = [
					{
						"name": "soajs-log-volume",
						"hostPath": {
							"path": "/var/log/soajs/"
						}
					}
				];
				recipe.deployOptions.voluming.volumeMounts = [
					{
						"mountPath": "/var/log/soajs/",
						"name": "soajs-log-volume"
					}
				];
				
				//supporting HT only
				if (context.template.deploy.selectedDriver === 'kubernetes' && context.template.nginx.customSSL && context.template.nginx.customSSL.secret && context.template.nginx.customSSL.secret.volume) {
					recipe.deployOptions.voluming.volumes.push(context.template.nginx.customSSL.secret.volume);
				}
				
				//supporting HT only
				if (context.template.deploy.selectedDriver === 'kubernetes' && context.template.nginx.customSSL && context.template.nginx.customSSL.secret && context.template.nginx.customSSL.secret.volumeMounts) {
					recipe.deployOptions.voluming.volumeMounts.push(context.template.nginx.customSSL.secret.volumeMounts);
				}
			}
			
			if (context.template.nginx.ssl) {
				if (context.template.deploy.selectedDriver === 'docker') {
					recipe.deployOptions.ports.push({
						"name": "https",
						"target": 443,
						"isPublished": true,
						"published": context.template.nginx.https,
						"preserveClientIP": true
					});
				}
				else if (context.template.deploy.selectedDriver === 'kubernetes') {
					recipe.deployOptions.ports.push({
						"name": "https",
						"target": 443,
						"isPublished": true,
						"published": context.template.nginx.https,
						"preserveClientIP": true
					});
				}
				
				var https = ["SOAJS_NX_API_HTTPS", "SOAJS_NX_API_HTTP_REDIRECT", "SOAJS_NX_SITE_HTTPS", "SOAJS_NX_SITE_HTTP_REDIRECT"];
				https.forEach((oneEnv) => {
					recipe.buildOptions.env[oneEnv] = {
						"type": "static",
						"value": "true"
					};
				});
				
				if (context.template.nginx.certs && Object.keys(context.template.nginx.certsGit).length > 0) {
					recipe.buildOptions.env["SOAJS_NX_CUSTOM_SSL"] = {
						"type": "static",
						"value": 'true'
					};
					recipe.buildOptions.env["SOAJS_CONFIG_REPO_BRANCH"] = {
						"type": "static",
						"value": context.template.nginx.certsGit.branch
					};
					recipe.buildOptions.env["SOAJS_CONFIG_REPO_OWNER"] = {
						"type": "static",
						"value": context.template.nginx.certsGit.owner
					};
					recipe.buildOptions.env["SOAJS_CONFIG_REPO_NAME"] = {
						"type": "static",
						"value": context.template.nginx.certsGit.repo
					};
					recipe.buildOptions.env["SOAJS_CONFIG_REPO_TOKEN"] = {
						"type": "static",
						"value": context.template.nginx.certsGit.token
					};
					recipe.buildOptions.env["SOAJS_CONFIG_REPO_PROVIDER"] = {
						"type": "static",
						"value": context.template.nginx.certsGit.provider
					};
					recipe.buildOptions.env["SOAJS_CONFIG_REPO_DOMAIN"] = {
						"type": "static",
						"value": context.template.nginx.certsGit.domain
					};
				}
				
				//supporting HT only
				if (context.template.deploy.selectedDriver === 'kubernetes' && context.template.nginx.customSSL && context.template.nginx.customSSL.secret && context.template.nginx.customSSL.secret.env) {
					for (let envVar in context.template.nginx.customSSL.secret.env) {
						recipe.buildOptions.env[envVar] = context.template.nginx.customSSL.secret.env[envVar];
					}
				}
			}
			
			if (context.template.nginx.customUi && context.template.nginx.customUi.source && context.template.nginx.customUi.provider && context.template.nginx.customUi.repo && context.template.nginx.customUi.owner && context.template.nginx.customUi.branch) {
				recipe.buildOptions.env["SOAJS_GIT_BRANCH"] = {
					"type": "static",
					"value": context.template.nginx.customUi.branch
				};
				
				recipe.buildOptions.env["SOAJS_GIT_OWNER"] = {
					"type": "static",
					"value": context.template.nginx.customUi.owner
				};
				recipe.buildOptions.env["SOAJS_GIT_REPO"] = {
					"type": "static",
					"value": context.template.nginx.customUi.repo
				};
				
				recipe.buildOptions.env["SOAJS_GIT_TOKEN"] = {
					"type": "static",
					"value": context.template.nginx.customUi.token
				};
				recipe.buildOptions.env["SOAJS_GIT_PROVIDER"] = {
					"type": "static",
					"value": context.template.nginx.customUi.source
				};
				recipe.buildOptions.env["SOAJS_GIT_DOMAIN"] = {
					"type": "static",
					"value": context.template.nginx.customUi.provider
				};
				recipe.buildOptions.env["SOAJS_GIT_PATH"] = {
					"type": "static",
					"value": context.template.nginx.customUi.path || "/"
				};
			}
			
			return recipe;
		}
	},
	
	deployNginx: function (req, context, cb) {
		if(!context.template.nginx){
			return cb();
		}
		
		let data = {
			"deployConfig": {
				"replication": {
					"mode": context.template.nginx.mode
				},
				"memoryLimit": context.template.nginx.memory * 1048576
			},
			"custom": {
				type: 'nginx',
				name: context.template.gi.code.toLowerCase() + '-nginx'
			},
			"recipe": context.template.nginx.recipe,
			"env": context.template.gi.code.toUpperCase()
		};
		
		//if custom image info
		if (context.template.nginx.imageName) {
			data.custom.image = {
				name: context.template.nginx.imageName,
				prefix: context.template.nginx.imagePrefix,
				tag: context.template.nginx.imageTag
			}
		}
		
		//if user input env variables
		if (context.template.nginx.custom) {
			data.custom.env = {};
			for (let env in context.template.nginx.custom) {
				data.custom.env[env] = context.template.nginx.custom[env].value;
			}
		}
		
		req.soajs.log.debug("Deploying Nginx Server in environment", context.template.gi.code.toUpperCase());
		initBLModel(deployBL, modelName, (error, deployBL) => {
			if (error) return cb(error);
			
			req.soajs.inputmaskData = data;
			deployBL.deployService(context.config, req.soajs, deployer, (error, data) => {
				if (error) return cb(error);
				
				context.template.nginx._id = data;
				return cb(null, true);
			});
		});
	},
	
	getAPIInfo: function (template, nginx, type) {
		let protocol = "http";
		let port = 80;
		
		if (nginx) {
			if (nginx.recipe && nginx.recipe.recipe && nginx.recipe.recipe.deployOptions && nginx.recipe.recipe.deployOptions.ports) {
				for (let i = 0; i < nginx.recipe.recipe.deployOptions.ports.length; i++) {
					let onePort = nginx.recipe.recipe.deployOptions.ports[i];
					//check for http port first, if found set it as env port
					if (onePort.name === 'http' && onePort.isPublished && onePort.published) {
						port = onePort.published;
						protocol = 'http';
					}
					
					//then check if https port is found and published, if yes check if ssl is on and set the port and protocol accordingly
					if (onePort.name === 'https' && onePort.isPublished && onePort.published) {
						for (let oneEnv in nginx.recipe.recipe.buildOptions.env) {
							if (oneEnv === 'SOAJS_NX_API_HTTPS' && ['true', '1'].indexOf(nginx.recipe.recipe.buildOptions.env[oneEnv].value) !== -1) {
								protocol = 'https';
								port = onePort.published;
							}
						}
					}
				}
			}
			else {
				if (nginx.http) {
					port = nginx.http;
				}
				if (nginx.ssl) {
					port = nginx.https;
					protocol = "https";
				}
			}
		}
		
		return protocol + "://" + template.gi[type] + "." + template.gi.domain + ":" + port;
	},
	
	createUserAndGroup: function (req, context, cb) {
		if(context.environmentRecord.code.toUpperCase() !== 'PORTAL'){
			return cb();
		}
		let url = lib.getAPIInfo(context.template, context.template.nginx, 'apiPrefix');
		let options = {
			"uri": url,
			"headers": {
				'Content-Type': 'application/json',
				'accept': 'application/json',
				'connection': 'keep-alive',
				'key': context.template.productize.extKey,
				'soajsauth': req.headers.soajsauth
			},
			"qs": {
				"access_token": req.query.access_token
			},
			"body": {
				"username": context.template.gi.username,
				"firstName": "PORTAL",
				"lastName": "OWNER",
				"email": context.template.gi.email,
				"password": context.template.gi.password
			},
			"json": true
		};
		req.soajs.log.debug("Trying to Create new portal user");
		req.soajs.log.debug(options);
		request.post(options, (error, response, body) => {
			if (error) {
				req.soajs.log.error(error);
			}
			else if(body.errors){
				req.soajs.log.error(body.errors);
			}
			else if(body.data){
				if(!context.template.user){
					context.template.user = {};
				}
				context.template.user._id = body.data.id;
			}
			return cb();
		});
	},
	
	redirectTo3rdParty: function (req, context, cb) {
	
	}
};

module.exports = lib;