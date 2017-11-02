'use strict';
var soajs = require('soajs');
var config = require('./config.js');

var dashboardBL = {
	environment: {
		module: require("./lib/environment/index.js")
	},
	resources: {
		module: require("./lib/resources/index.js")
	},
	customRegistry: {
		module: require("./lib/customRegistry/index.js")
	},
	product: {
		module: require("./lib/product/index.js")
	},
	tenant: {
		module: require("./lib/tenant/index.js")
	},
	services: {
		module: require("./lib/services/index.js")
	},
	daemons: {
		module: require("./lib/daemons/index.js")
	},
	swagger: {
		module: require("./lib/swagger/index.js")
	},
	cb:{
		module: require("./lib/contentbuilder/index")
	},
	hosts:{
		module: require("./lib/hosts/index.js"),
		helper: require("./lib/hosts/helper.js")
	},
	catalog:{
		module: require("./lib/catalog/index.js")
	},
	ci:{
		module: require("./lib/ci/index.js"),
		driver: require('./utils/drivers/ci/index.js')
	},
	cd:{
		module: require("./lib/cd/index.js"),
		helper: require("./lib/cd/helper.js")
	},
	git: {
		module: require('./lib/git/index.js'),
		helper: require("./lib/git/helper.js"),
		driver: require('./utils/drivers/git/index.js'),
		model: require('./models/git.js')
	},
	cloud:{
		service:{
			module: require("./lib/cloud/services/index.js")
		},
		deploy:{
			module: require("./lib/cloud/deploy/index.js")
		},
		nodes:{
			module: require("./lib/cloud/nodes/index.js")
		},
		maintenance:{
			module: require("./lib/cloud/maintenance/index.js")
		},
		namespace:{
			module: require("./lib/cloud/namespaces/index.js")
		},
		autoscale: {
			module: require('./lib/cloud/autoscale/index.js')
		},
		metrics: {
			module: require('./lib/cloud/metrics/index.js')
		}
	}
};


var deployer = require("soajs").drivers;

var dbModel = "mongo";

var service = new soajs.server.service(config);

function checkMyAccess (req, res, cb) {
	if (!req.soajs.uracDriver || !req.soajs.uracDriver.getProfile()) {
		return res.jsonp(req.soajs.buildResponse({ "code": 601, "msg": config.errors[ 601 ] }));
	}
	var myTenant = req.soajs.uracDriver.getProfile().tenant;
	if (!myTenant || !myTenant.id) {
		return res.jsonp(req.soajs.buildResponse({ "code": 608, "msg": config.errors[ 608 ] }));
	}
	else {
		req.soajs.inputmaskData.id = myTenant.id.toString();
		return cb();
	}
}

function initBLModel (req, res, BLModule, modelName, cb) {
	BLModule.init(modelName, function (error, BL) {
		if (error) {
			req.soajs.log.error(error);
			return res.json(req.soajs.buildResponse({ "code": 407, "msg": config.errors[ 407 ] }));
		}
		else {
			return cb(BL);
		}
	});
}

service.init(function () {
	/**
	 * Environments features
	 */

	/**
	 * Add a new environment
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/environment/add", function (req, res) {
		initBLModel(req, res, dashboardBL.environment.module, dbModel, function (BL) {
			BL.model.initConnection(req.soajs);
			BL.add(config, service, soajs.provision, dbModel, req, res, function (error, data) {
				BL.model.closeConnection(req.soajs);
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Delete an environment
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.delete("/environment/delete", function (req, res) {
		initBLModel(req, res, dashboardBL.environment.module, dbModel, function (BL) {
			BL.model.initConnection(req.soajs);
			BL.delete(config, req, res, function (error, data) {
				BL.model.closeConnection(req.soajs);
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Update an existing environment
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/environment/update", function (req, res) {
		initBLModel(req, res, dashboardBL.environment.module, dbModel, function (BL) {
			BL.model.initConnection(req.soajs);
			BL.update(config, req, res, function (error, data) {
				BL.model.closeConnection(req.soajs);
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * List all environments
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/environment/list", function (req, res) {
		initBLModel(req, res, dashboardBL.environment.module, dbModel, function (BL) {
			BL.model.initConnection(req.soajs);
			BL.list(config, req, res, function (error, data) {
				BL.model.closeConnection(req.soajs);
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

    /**
     * Get a specific environment
     * @param {String} API route
     * @param {Function} API middleware
     */
    service.get("/environment", function (req, res) {
        initBLModel(req, res, dashboardBL.environment.module, dbModel, function (BL) {
	        BL.model.initConnection(req.soajs);
	        BL.get(config, req, res, function (error, data) {
		        BL.model.closeConnection(req.soajs);
		        return res.json(req.soajs.buildResponse(error, data));
            });
        });
    });

	/**
	 * Update environment tenant security key
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/environment/key/update", function (req, res) {
		initBLModel(req, res, dashboardBL.environment.module, dbModel, function (BL) {
			BL.model.initConnection(req.soajs);
			BL.keyUpdate(config, soajs.provision, req, res, function (error, data) {
				BL.model.closeConnection(req.soajs);
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * List environment databases
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/environment/dbs/list", function (req, res) {
		initBLModel(req, res, dashboardBL.environment.module, dbModel, function (BL) {
			BL.model.initConnection(req.soajs);
			BL.listDbs(config, req, res, function (error, data) {
				BL.model.closeConnection(req.soajs);
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Delete environment database
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.delete("/environment/dbs/delete", function (req, res) {
		initBLModel(req, res, dashboardBL.environment.module, dbModel, function (BL) {
			BL.model.initConnection(req.soajs);
			BL.deleteDb(config, req, res, function (error, data) {
				BL.model.closeConnection(req.soajs);
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Add environment database
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/environment/dbs/add", function (req, res) {
		initBLModel(req, res, dashboardBL.environment.module, dbModel, function (BL) {
			BL.model.initConnection(req.soajs);
			BL.addDb(config, req, res, function (error, data) {
				BL.model.closeConnection(req.soajs);
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Update environment database
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/environment/dbs/update", function (req, res) {
		initBLModel(req, res, dashboardBL.environment.module, dbModel, function (BL) {
			BL.model.initConnection(req.soajs);
			BL.updateDb(config, req, res, function (error, data) {
				BL.model.closeConnection(req.soajs);
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Update environment's database prefix
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/environment/dbs/updatePrefix", function (req, res) {
		initBLModel(req, res, dashboardBL.environment.module, dbModel, function (BL) {
			BL.model.initConnection(req.soajs);
			BL.updateDbsPrefix(config, req, res, function (error, data) {
				BL.model.closeConnection(req.soajs);
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * List resources
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/resources/list", function (req, res) {
		initBLModel(req, res, dashboardBL.resources.module, dbModel, function (BL) {
			BL.model.initConnection(req.soajs);
			BL.listResources(config, req, res, function (error, data) {
				BL.model.closeConnection(req.soajs);
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Get one resource
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/resources/get", function (req, res) {
		initBLModel(req, res, dashboardBL.resources.module, dbModel, function (BL) {
			BL.getResource(config, req, res, function (error, data) {
				// BL.model.closeConnection(req.soajs);
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Upgrade Resources
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/resources/upgrade", function (req, res) {
		initBLModel(req, res, dashboardBL.resources.module, dbModel, function (BL) {
			BL.upgradeResources(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Add new resource
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/resources/add", function (req, res) {
		initBLModel(req, res, dashboardBL.resources.module, dbModel, function (BL) {
			BL.addResource(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Delete a resource
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.delete("/resources/delete", function (req, res) {
		initBLModel(req, res, dashboardBL.resources.module, dbModel, function (BL) {
			BL.deleteResource(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Update a resource
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/resources/update", function (req, res) {
		initBLModel(req, res, dashboardBL.resources.module, dbModel, function (BL) {
			BL.updateResource(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Get resources deploy configuration
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/resources/config", function (req, res) {
		initBLModel(req, res, dashboardBL.resources.module, dbModel, function (BL) {
			BL.getConfig(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Set resources deploy configuration
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/resources/config/update", function (req, res) {
		initBLModel(req, res, dashboardBL.resources.module, dbModel, function (BL) {
			BL.setConfig(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * List custom registry entries
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/customRegistry/list", function (req, res) {
		initBLModel(req, res, dashboardBL.customRegistry.module, dbModel, function (BL) {
			BL.list(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Get a custom registry entry
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/customRegistry/get", function (req, res) {
		initBLModel(req, res, dashboardBL.customRegistry.module, dbModel, function (BL) {
			BL.get(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Add a custom registry entry
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/customRegistry/add", function (req, res) {
		initBLModel(req, res, dashboardBL.customRegistry.module, dbModel, function (BL) {
			BL.add(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Update a custom registry entry
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/customRegistry/update", function (req, res) {
		initBLModel(req, res, dashboardBL.customRegistry.module, dbModel, function (BL) {
			BL.update(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Upgrade custom registry entries from old schema to new one
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/customRegistry/upgrade", function (req, res) {
		initBLModel(req, res, dashboardBL.customRegistry.module, dbModel, function (BL) {
			BL.upgrade(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Delete a custom registry entry
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.delete("/customRegistry/delete", function (req, res) {
		initBLModel(req, res, dashboardBL.customRegistry.module, dbModel, function (BL) {
			BL.delete(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * List enviornment platforms
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/environment/platforms/list", function (req, res) {
		initBLModel(req, res, dashboardBL.environment.module, dbModel, function (BL) {
			BL.model.initConnection(req.soajs);
			BL.listPlatforms(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Upload platform certificate
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/environment/platforms/cert/upload", function (req, res) {
		initBLModel(req, res, dashboardBL.environment.module, dbModel, function (BL) {
			BL.model.initConnection(req.soajs);
			BL.uploadCerts(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Delete platform certificate
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.delete("/environment/platforms/cert/delete", function (req, res) {
		initBLModel(req, res, dashboardBL.environment.module, dbModel, function (BL) {
			BL.model.initConnection(req.soajs);
			BL.removeCert(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Choose existing platform certificate
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/environment/platforms/cert/choose", function (req, res) {
		initBLModel(req, res, dashboardBL.environment.module, dbModel, function (BL) {
			BL.model.initConnection(req.soajs);
			BL.chooseExistingCerts(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Change selected platform
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/environment/platforms/driver/changeSelected", function (req, res) {
		initBLModel(req, res, dashboardBL.environment.module, dbModel, function (BL) {
			BL.model.initConnection(req.soajs);
			BL.changeSelectedDriver(config, req, res, function (error, data) {
				BL.model.closeConnection(req.soajs);
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Change selected platform driver
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/environment/platforms/deployer/type/change", function (req, res) {
		initBLModel(req, res, dashboardBL.environment.module, dbModel, function (BL) {
			BL.model.initConnection(req.soajs);
			BL.changeDeployerType(config, req, res, function (error, data) {
				BL.model.closeConnection(req.soajs);
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Update deployer configuration
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/environment/platforms/deployer/update", function (req, res) {
		initBLModel(req, res, dashboardBL.environment.module, dbModel, function (BL) {
			BL.model.initConnection(req.soajs);
			BL.updateDeployerConfig(config, req, res, function (error, data) {
				BL.model.closeConnection(req.soajs);
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Products features
	 */

	/**
	 * Add a new product
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/product/add", function (req, res) {
		initBLModel(req, res, dashboardBL.product.module, dbModel, function (BL) {
			BL.add(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Delete an existing product
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.delete("/product/delete", function (req, res) {
		initBLModel(req, res, dashboardBL.product.module, dbModel, function (BL) {
			BL.delete(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Update an existing product
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/product/update", function (req, res) {
		initBLModel(req, res, dashboardBL.product.module, dbModel, function (BL) {
			BL.update(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * List available products
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/product/list", function (req, res) {
		initBLModel(req, res, dashboardBL.product.module, dbModel, function (BL) {
			BL.list(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Get a specific product
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/product/get", function (req, res) {
		initBLModel(req, res, dashboardBL.product.module, dbModel, function (BL) {
			BL.get(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Get package of specific product
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/product/packages/get", function (req, res) {
		initBLModel(req, res, dashboardBL.product.module, dbModel, function (BL) {
			BL.getPackage(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * List all product packages
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/product/packages/list", function (req, res) {
		initBLModel(req, res, dashboardBL.product.module, dbModel, function (BL) {
			BL.listPackage(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Add a new product package
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/product/packages/add", function (req, res) {
		initBLModel(req, res, dashboardBL.product.module, dbModel, function (BL) {
			BL.addPackage(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Update a product package
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/product/packages/update", function (req, res) {
		initBLModel(req, res, dashboardBL.product.module, dbModel, function (BL) {
			BL.updatePackage(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Delete a product package
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.delete("/product/packages/delete", function (req, res) {
		initBLModel(req, res, dashboardBL.product.module, dbModel, function (BL) {
			BL.deletePackage(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Tenants features
	 */

	/**
	 * Add a new tenant
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/tenant/add", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.add(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Delete an existing tenant
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.delete("/tenant/delete", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.delete(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * List available tenants
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/tenant/list", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.list(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Update an existing tenant
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/tenant/update", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.update(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Get a specific tenant
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/tenant/get", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.get(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * List tenant oauth configuration
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/tenant/oauth/list", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.getOAuth(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Add new tenant oauth configuration
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/tenant/oauth/add", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.saveOAuth(config, 425, 'tenant OAuth add successful', req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Update existing oauth configuration
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/tenant/oauth/update", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.saveOAuth(config, 426, 'tenant OAuth update successful', req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Delete oauth configuration
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.delete("/tenant/oauth/delete", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.deleteOAuth(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * List tenant oauth users
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/tenant/oauth/users/list", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.getOAuthUsers(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Delete tenant oauth user
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.delete("/tenant/oauth/users/delete", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.deleteOAuthUsers(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Add new tenant oauth user
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/tenant/oauth/users/add", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.addOAuthUsers(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Update tenant oauth user
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/tenant/oauth/users/update", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.updateOAuthUsers(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * List tenant applications
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/tenant/application/list", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.listApplication(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Add a new tenant application
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/tenant/application/add", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.addApplication(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Update an existing tenant application
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/tenant/application/update", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.updateApplication(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Delete a tenant application
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.delete("/tenant/application/delete", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.deleteApplication(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Get tenant ACL
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/tenant/acl/get", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.getTenantAcl(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Add a new application key
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/tenant/application/key/add", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.createApplicationKey(config, soajs.provision, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * List all tenant application keys
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/tenant/application/key/list", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.getApplicationKeys(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Delete application key
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.delete("/tenant/application/key/delete", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.deleteApplicationKey(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * List application external keys for a specific key
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/tenant/application/key/ext/list", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.listApplicationExtKeys(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Add a new application external key for a specific key
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/tenant/application/key/ext/add", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.addApplicationExtKeys(config, soajs.provision, service.registry, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Update an existing application external key
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/tenant/application/key/ext/update", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.updateApplicationExtKeys(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Delete an existing application external key
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/tenant/application/key/ext/delete", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.deleteApplicationExtKeys(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Update the service configuration for a specific key
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/tenant/application/key/config/update", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.updateApplicationConfig(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * List service configuration for a specific key
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/tenant/application/key/config/list", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.listApplicationConfig(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Dashboard Keys
	 */

	/**
	 * List external keys with dashboard access
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/tenant/db/keys/list", function (req, res) {
		initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
			BL.listDashboardKeys(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Hosts features
	 */

	/**
	 * List existing hosts in manual deployment mode
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/hosts/list", function (req, res) {
		initBLModel(req, res, dashboardBL.hosts.module, dbModel, function (BL) {
			BL.list(config, req.soajs, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Perform maintenance operation on a host deployed in manual mode
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/hosts/maintenanceOperation", function (req, res) {
		initBLModel(req, res, dashboardBL.hosts.module, dbModel, function (BL) {
			BL.maintenanceOperation(config, req.soajs, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * High Availability Cloud features
	 */

	/**
	 * Get all available nodes
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/cloud/nodes/list", function (req, res) {
		initBLModel(req, res, dashboardBL.cloud.nodes.module, dbModel, function (BL) {
			BL.listNodes(config, req.soajs, deployer, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Add a new node
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/cloud/nodes/add", function (req, res) {
		initBLModel(req, res, dashboardBL.cloud.nodes.module, dbModel, function (BL) {
			BL.addNode(config, req.soajs, deployer, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Remove an existing node
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.delete("/cloud/nodes/remove", function (req, res) {
		initBLModel(req, res, dashboardBL.cloud.nodes.module, dbModel, function (BL) {
			BL.removeNode(config, req.soajs, deployer, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Update the role or availability of an existing node
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/cloud/nodes/update", function (req, res) {
		initBLModel(req, res, dashboardBL.cloud.nodes.module, dbModel, function (BL) {
			BL.updateNode(config, req.soajs, deployer, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Update the tag of a node
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/cloud/nodes/tag", function (req, res) {
		initBLModel(req, res, dashboardBL.cloud.nodes.module, dbModel, function (BL) {
			BL.tagNode(config, req.soajs, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * List all services per environment deployed in container mode
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/cloud/services/list", function (req, res) {
		initBLModel(req, res, dashboardBL.cloud.service.module, dbModel, function (BL) {
			BL.listServices(config, req.soajs, deployer, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Deploy a new SOAJS service
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/cloud/services/soajs/deploy", function (req, res) {
		initBLModel(req, res, dashboardBL.cloud.deploy.module, dbModel, function (BL) {
			BL.deployService(config, req.soajs, service.registry, deployer, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Deploy a plugin, such as heapster
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/cloud/plugins/deploy", function (req, res) {
		initBLModel(req, res, dashboardBL.cloud.deploy.module, dbModel, function (BL) {
			BL.deployPlugin(config, req.soajs, deployer, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Check if resource is deployed
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/cloud/resource", function (req, res) {
		initBLModel(req, res, dashboardBL.cloud.service.module, dbModel, function (BL) {
			BL.checkResource(config, req.soajs, deployer, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Redeploy a running service
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/cloud/services/redeploy", function (req, res) {
		initBLModel(req, res, dashboardBL.cloud.deploy.module, dbModel, function (BL) {
			BL.redeployService(config, req.soajs, service.registry, deployer, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Scale an existing service deployment
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/cloud/services/scale", function (req, res) {
		initBLModel(req, res, dashboardBL.cloud.service.module, dbModel, function (BL) {
			BL.scaleService(config, req.soajs, deployer, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Delete an existing deployment
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.delete("/cloud/services/delete", function (req, res) {
		initBLModel(req, res, dashboardBL.cloud.service.module, dbModel, function (BL) {
			BL.deleteService(config, req.soajs, deployer, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Perform maintenance operations on services deployed in container mode
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/cloud/services/maintenance", function (req, res) {
		initBLModel(req, res, dashboardBL.cloud.maintenance.module, dbModel, function (BL) {
			BL.maintenance(config, req.soajs, deployer, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Get container logs
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/cloud/services/instances/logs", function (req, res) {
		initBLModel(req, res, dashboardBL.cloud.maintenance.module, dbModel, function (BL) {
			BL.streamLogs(config, req.soajs, deployer, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Autoscale one or more services
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/cloud/services/autoscale", function (req, res) {
		initBLModel(req, res, dashboardBL.cloud.autoscale.module, dbModel, function(BL) {
			BL.set(config, req.soajs, deployer, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Configure environment autoscaling
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/cloud/services/autoscale/config", function (req, res) {
		initBLModel(req, res, dashboardBL.cloud.autoscale.module, dbModel, function(BL) {
			BL.updateEnvAutoscaleConfig(config, req.soajs, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * List available namespaces
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/cloud/namespaces/list", function (req, res) {
		initBLModel(req, res, dashboardBL.cloud.namespace.module, dbModel, function (BL) {
			BL.list(config, req.soajs, deployer, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Delete a namespace
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.delete("/cloud/namespaces/delete", function (req, res) {
		initBLModel(req, res, dashboardBL.cloud.namespace.module, dbModel, function (BL) {
			BL.delete(config, req.soajs, deployer, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});
	
	/**
	 * Get Services Metrics
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/cloud/metrics/services", function (req, res) {
		initBLModel(req, res, dashboardBL.cloud.metrics.module, dbModel, function (BL) {
			BL.getServicesMetrics(config, req.soajs, deployer, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});
	
	/**
	 * Get Nodes Metrics ( kubernetes only)
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/cloud/metrics/nodes", function (req, res) {
		initBLModel(req, res, dashboardBL.cloud.metrics.module, dbModel, function (BL) {
			BL.getNodesMetrics(config, req.soajs, deployer, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Catalog Recipes features
	 */

	/**
	 * List catalogs
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/catalog/recipes/list", function (req, res) {
		initBLModel(req, res, dashboardBL.catalog.module, dbModel, function (BL) {
			BL.list(config, req, function (error, data) {
				return res.jsonp(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Add new catalog
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/catalog/recipes/add", function (req, res) {
		initBLModel(req, res, dashboardBL.catalog.module, dbModel, function (BL) {
			BL.add(config, req, function (error, data) {
				return res.jsonp(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Update a catalog
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/catalog/recipes/update", function (req, res) {
		initBLModel(req, res, dashboardBL.catalog.module, dbModel, function (BL) {
			BL.edit(config, req, function (error, data) {
				return res.jsonp(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Delete a catalog
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.delete("/catalog/recipes/delete", function (req, res) {
		initBLModel(req, res, dashboardBL.catalog.module, dbModel, function (BL) {
			BL.delete(config, req, function (error, data) {
				return res.jsonp(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Get a catalog
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/catalog/recipes/get", function (req, res) {
		initBLModel(req, res, dashboardBL.catalog.module, dbModel, function (BL) {
			BL.get(config, req, function (error, data) {
				return res.jsonp(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Upgrade Catalog Recipes to latest versions
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/catalog/recipes/upgrade", function (req, res) {
		initBLModel(req, res, dashboardBL.catalog.module, dbModel, function (BL) {
			BL.upgrade(config, req, function (error, data) {
				return res.jsonp(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Continuous Delivery Features
	 */

	/**
	 * Get a CD configuration
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/cd", function (req, res) {
		initBLModel(req, res, dashboardBL.cd.module, dbModel, function (BL) {
			BL.getConfig(config, req, dashboardBL.cd.helper, function (error, data) {
				return res.jsonp(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Get Get Update Notification Ledger
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/cd/updates", function (req, res) {
		initBLModel(req, res, dashboardBL.cd.module, dbModel, function (BL) {
			BL.getUpdates(config, req, deployer, dashboardBL.cd.helper, dashboardBL.cloud.service.module, function (error, data) {
				return res.jsonp(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Save a CD configuration
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/cd", function (req, res) {
		initBLModel(req, res, dashboardBL.cd.module, dbModel, function (BL) {
			BL.saveConfig(config, req, dashboardBL.cd.helper, function (error, data) {
				return res.jsonp(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Pause CD in an environment
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/cd/pause", function (req, res) {
		initBLModel(req, res, dashboardBL.cd.module, dbModel, function (BL) {
			BL.pauseCD(config, req, dashboardBL.cd.helper, function (error, data) {
				return res.jsonp(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Trigger CD deploy operation
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/cd/deploy", function (req, res) {
		initBLModel(req, res, dashboardBL.cd.module, dbModel, function (BL) {
			BL.cdDeploy(config, req, service.registry, deployer, dashboardBL.cd.helper, function (error, data) {
				return res.jsonp(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Take action based on ledger notification
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/cd/action", function (req, res) {
		initBLModel(req, res, dashboardBL.cd.module, dbModel, function (BL) {
			BL.cdAction(config, service.registry, req, deployer, dashboardBL.cd.helper, function (error, data) {
				return res.jsonp(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Lists the ledgers of a specific environment
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/cd/ledger", function (req, res) {
		initBLModel(req, res, dashboardBL.cd.module, dbModel, function (BL) {
			BL.getLedger(config, req, dashboardBL.cd.helper, function (error, data) {
				return res.jsonp(req.soajs.buildResponse(error, data));
			});
		});
	});


	/**
	 * Marks records as read
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/cd/ledger/read", function (req, res) {
		initBLModel(req, res, dashboardBL.cd.module, dbModel, function (BL) {
			BL.markRead(config, req, dashboardBL.cd.helper, function (error, data) {
				return res.jsonp(req.soajs.buildResponse(error, data));
			});
		});
	});
	/**
	 * Continuous Integration features
	 */

	/**
	 * Get CI Accounts
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/ci", function (req, res) {
		initBLModel(req, res, dashboardBL.ci.module, dbModel, function (BL) {
			BL.listCIAccounts(config, req, function (error, data) {
				return res.jsonp(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Get CI providers
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/ci/providers", function (req, res) {
		initBLModel(req, res, dashboardBL.ci.module, dbModel, function (BL) {
			BL.listUniqueProviders(config, req, function (error, data) {
				return res.jsonp(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Turn On/Off Repository CI
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/ci/status", function (req, res) {
		initBLModel(req, res, dashboardBL.ci.module, dbModel, function (BL) {
			BL.toggleRepoStatus(config, req, dashboardBL.ci.driver, function (error, data) {
				return res.jsonp(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Activate CI Provider
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/ci/provider", function (req, res) {
		initBLModel(req, res, dashboardBL.ci.module, dbModel, function (BL) {
			BL.activateProvider(config, req, dashboardBL.ci.driver, function (error, data) {
				return res.jsonp(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Add CI Recipe
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/ci/recipe", function (req, res) {
		initBLModel(req, res, dashboardBL.ci.module, dbModel, function (BL) {
			BL.addRecipe(config, req, function (error, data) {
				return res.jsonp(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Edit CI Recipe
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/ci/recipe", function (req, res) {
		initBLModel(req, res, dashboardBL.ci.module, dbModel, function (BL) {
			BL.addRecipe(config, req, function (error, data) {
				return res.jsonp(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Delete CI Recipe
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.delete("/ci/recipe", function (req, res) {
		initBLModel(req, res, dashboardBL.ci.module, dbModel, function (BL) {
			BL.deleteRecipe(config, req, function (error, data) {
				return res.jsonp(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Deactivate CI Provider
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/ci/provider", function (req, res) {
		initBLModel(req, res, dashboardBL.ci.module, dbModel, function (BL) {
			BL.deactivateProvider(config, req, function (error, data) {
				return res.jsonp(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Download a CI recipe
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/ci/recipe/download", function (req, res) {
		initBLModel(req, res, dashboardBL.ci.module, dbModel, function (BL) {
			BL.downloadRecipe(config, req, res, function (error, data) {
				return res.jsonp(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Download CI provider script for CD
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/ci/script/download", function (req, res) {
		initBLModel(req, res, dashboardBL.ci.module, dbModel, function (BL) {
			BL.downloadScript(config, req, res);
		});
	});

	/**
	 * Get ci repository settings and environment variables
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/ci/settings", function (req, res) {
		initBLModel(req, res, dashboardBL.ci.module, dbModel, function (BL) {
			BL.getRepoSettings(config, req, dashboardBL.ci.driver, function (error, data) {
				return res.jsonp(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Update ci repository settings and environment variables
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/ci/settings", function (req, res) {
		initBLModel(req, res, dashboardBL.ci.module, dbModel, function (BL) {
			BL.updateRepoSettings(config, req, dashboardBL.ci.driver, function (error, data) {
				return res.jsonp(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * get the content of the ci file from provider for this repo
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/ci/repo/remote/config", function (req, res) {
		initBLModel(req, res, dashboardBL.ci.module, dbModel, function (BL) {
			initBLModel(req, res, dashboardBL.git.module, dbModel, function (gitBL) {
				BL.getRepoYamlFile(config, req, dashboardBL.ci.driver, dashboardBL.git.driver, dashboardBL.git.helper, dashboardBL.git.model, gitBL, function (error, data) {
					return res.jsonp(req.soajs.buildResponse(error, data));
				});
			});
		});
	});

	/**
	 * Git App features gitAccountsBL
	 */

	/**
	 * Add a new git account
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/gitAccounts/login", function (req, res) {
		initBLModel(req, res, dashboardBL.git.module, dbModel, function (BL) {
			BL.login(config, req, dashboardBL.git.driver, dashboardBL.git.helper, dashboardBL.git.model, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Delete an existing git account
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.delete("/gitAccounts/logout", function (req, res) {
		initBLModel(req, res, dashboardBL.git.module, dbModel, function (BL) {
			BL.logout(config, req, dashboardBL.git.driver, dashboardBL.git.helper, dashboardBL.git.model, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * List all available git accounts
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/gitAccounts/accounts/list", function (req, res) {
		initBLModel(req, res, dashboardBL.git.module, dbModel, function (BL) {
			BL.listAccounts(config, req, dashboardBL.git.driver, dashboardBL.git.helper, dashboardBL.git.model, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Get git account repositories
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/gitAccounts/getRepos", function (req, res) {
		initBLModel(req, res, dashboardBL.git.module, dbModel, function (BL) {
			BL.getRepos(config, req, dashboardBL.git.driver, dashboardBL.git.helper, dashboardBL.git.model, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Get file content from a repository, restricted to YAML files
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/gitAccounts/getYaml", function (req, res) {
		initBLModel(req, res, dashboardBL.git.module, dbModel, function (BL) {
			BL.getFile(config, req, dashboardBL.git.driver, deployer, dashboardBL.git.helper, dashboardBL.git.model, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Get repository barnches
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/gitAccounts/getBranches", function (req, res) {
		initBLModel(req, res, dashboardBL.git.module, dbModel, function (BL) {
			BL.getBranches(config, req, dashboardBL.git.driver, dashboardBL.git.helper, dashboardBL.git.model, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Activate a repository
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/gitAccounts/repo/activate", function (req, res) {
		initBLModel(req, res, dashboardBL.git.module, dbModel, function (BL) {
			BL.activateRepo(config, req, dashboardBL.git.driver, dashboardBL.git.helper, dashboardBL.git.model, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Deactivate a repository
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put('/gitAccounts/repo/deactivate', function (req, res) {
		initBLModel(req, res, dashboardBL.cloud.service.module, dbModel, function(cloudBL){
			initBLModel(req, res, dashboardBL.git.module, dbModel, function (BL) {
				BL.deactivateRepo(config, req, dashboardBL.git.driver, dashboardBL.git.helper, dashboardBL.git.model, cloudBL, deployer, function (error, data) {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
		});
	});

	/**
	 * Sync an active repository
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put('/gitAccounts/repo/sync', function (req, res) {
		initBLModel(req, res, dashboardBL.git.module, dbModel, function (BL) {
			BL.syncRepo(config, req, dashboardBL.git.driver, dashboardBL.git.helper, dashboardBL.git.model, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Services features
	 */

	/**
	 * List available services
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/services/list", function (req, res) {
		initBLModel(req, res, dashboardBL.services.module, dbModel, function (BL) {
			BL.list(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Update service settings
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/services/settings/update", function (req, res) {
		initBLModel(req, res, dashboardBL.services.module, dbModel, function (BL) {
			BL.updateSettings(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Get all environments where a specific service is deployed
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/services/env/list", function (req, res) {
		initBLModel(req, res, dashboardBL.hosts.module, dbModel, function (BL) {
			BL.listHostEnv(config, req.soajs, deployer, dashboardBL.hosts.helper, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});
	/**
	 * Daemons features
	 */

	/**
	 * List available daemons
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/daemons/list", function (req, res) {
		initBLModel(req, res, dashboardBL.daemons.module, dbModel, function (BL) {
			BL.list(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * List available daemon group configurations
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/daemons/groupConfig/list", function (req, res) {
		initBLModel(req, res, dashboardBL.daemons.module, dbModel, function (BL) {
			BL.listGroupConfig(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Add a new group configuration
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/daemons/groupConfig/add", function (req, res) {
		initBLModel(req, res, dashboardBL.daemons.module, dbModel, function (BL) {
			BL.addGroupConfig(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Update an exiting daemon group configuration
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/daemons/groupConfig/update", function (req, res) {
		initBLModel(req, res, dashboardBL.daemons.module, dbModel, function (BL) {
			BL.updateGroupConfig(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Delete a group configuration
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.delete("/daemons/groupConfig/delete", function (req, res) {
		initBLModel(req, res, dashboardBL.cloud.service.module, dbModel, function(cloudBL){
			initBLModel(req, res, dashboardBL.daemons.module, dbModel, function (BL) {
				BL.deleteGroupConfig(config, req, res, cloudBL, deployer, function (error, data) {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
		});
	});

	/**
	 * Update the service configuration of a specific group configuration
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/daemons/groupConfig/serviceConfig/update", function (req, res) {
		initBLModel(req, res, dashboardBL.daemons.module, dbModel, function (BL) {
			BL.updateServiceConfig(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * List service configurations per group configuration
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/daemons/groupConfig/serviceConfig/list", function (req, res) {
		initBLModel(req, res, dashboardBL.daemons.module, dbModel, function (BL) {
			BL.listServiceConfig(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Update list of tenant external keys per group configuration
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/daemons/groupConfig/tenantExtKeys/update", function (req, res) {
		initBLModel(req, res, dashboardBL.daemons.module, dbModel, function (BL) {
			BL.updateTenantExtKeys(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * List tenant external keys per group configuration
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/daemons/groupConfig/tenantExtKeys/list", function (req, res) {
		initBLModel(req, res, dashboardBL.daemons.module, dbModel, function (BL) {
			BL.listTenantExtKeys(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Settings features
	 */

	/**
	 * Update logged in user's tenant
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/settings/tenant/update", function (req, res) {
		checkMyAccess(req, res, function () {
			initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
				BL.update(config, req, res, function (error, data) {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
		});
	});

	/**
	 * Get current logged-in user's tenant
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/settings/tenant/get", function (req, res) {
		checkMyAccess(req, res, function () {
			initBLModel(req, res, dashboardBL.environment.module, dbModel, function (BL) {
				BL.list(config, req, res, function (error, environments) {
					// todo: check for error?
					initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL1) {
						BL1.get(config, req, res, function (error, tenant) {
							// todo: check for error?
							return res.jsonp(req.soajs.buildResponse(null, {
								'tenant': tenant,
								'environments': environments
							}));
						});
					});
				});
			});
		});
	});

	/**
	 * List current tenant's oauth configuration
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/settings/tenant/oauth/list", function (req, res) {
		checkMyAccess(req, res, function () {
			initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
				BL.getOAuth(config, req, res, function (error, data) {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
		});
	});

	/**
	 * Add new oauth configuration for current tenant
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/settings/tenant/oauth/add", function (req, res) {
		checkMyAccess(req, res, function () {
			initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
				BL.saveOAuth(config, 425, 'tenant OAuth add successful', req, res, function (error, data) {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
		});
	});

	/**
	 * Update current tenant's oauth configuration
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/settings/tenant/oauth/update", function (req, res) {
		checkMyAccess(req, res, function () {
			initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
				BL.saveOAuth(config, 426, 'tenant OAuth update successful', req, res, function (error, data) {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
		});
	});

	/**
	 * Delete current tenant's oauth configuration
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.delete("/settings/tenant/oauth/delete", function (req, res) {
		checkMyAccess(req, res, function () {
			initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
				BL.deleteOAuth(config, req, res, function (error, data) {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
		});
	});

	/**
	 * List current tenant's oauth users
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/settings/tenant/oauth/users/list", function (req, res) {
		checkMyAccess(req, res, function () {
			initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
				BL.getOAuthUsers(config, req, res, function (error, data) {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
		});
	});

	/**
	 * Delete current tenant's oauth user
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.delete("/settings/tenant/oauth/users/delete", function (req, res) {
		checkMyAccess(req, res, function () {
			initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
				BL.deleteOAuthUsers(config, req, res, function (error, data) {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
		});
	});

	/**
	 * Add a new oauth user for current tenant
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/settings/tenant/oauth/users/add", function (req, res) {
		checkMyAccess(req, res, function () {
			initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
				BL.addOAuthUsers(config, req, res, function (error, data) {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
		});
	});

	/**
	 * Update current tennant oauth user
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/settings/tenant/oauth/users/update", function (req, res) {
		checkMyAccess(req, res, function () {
			initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
				BL.updateOAuthUsers(config, req, res, function (error, data) {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
		});
	});

	/**
	 * List current tenant applications
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/settings/tenant/application/list", function (req, res) {
		checkMyAccess(req, res, function () {
			initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
				BL.listApplication(config, req, res, function (error, data) {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
		});
	});

	/**
	 * Add application key for current tenant
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/settings/tenant/application/key/add", function (req, res) {
		checkMyAccess(req, res, function () {
			initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
				BL.createApplicationKey(config, soajs.provision, req, res, function (error, data) {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
		});
	});

	/**
	 * List current tenant's keys
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/settings/tenant/application/key/list", function (req, res) {
		checkMyAccess(req, res, function () {
			initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
				BL.getApplicationKeys(config, req, res, function (error, data) {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
		});
	});

	/**
	 * Delete current tenant's application key
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.delete("/settings/tenant/application/key/delete", function (req, res) {
		checkMyAccess(req, res, function () {
			initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
				BL.deleteApplicationKey(config, req, res, function (error, data) {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
		});
	});

	/**
	 * List external keys of current tenant
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/settings/tenant/application/key/ext/list", function (req, res) {
		checkMyAccess(req, res, function () {
			initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
				BL.listApplicationExtKeys(config, req, res, function (error, data) {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
		});
	});

	/**
	 * Add external key to current tenant's application
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/settings/tenant/application/key/ext/add", function (req, res) {
		checkMyAccess(req, res, function () {
			initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
				BL.addApplicationExtKeys(config, soajs.provision, service.registry, req, res, function (error, data) {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
		});
	});

	/**
	 * Update external key of current tenant's application
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/settings/tenant/application/key/ext/update", function (req, res) {
		checkMyAccess(req, res, function () {
			initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
				BL.updateApplicationExtKeys(config, req, res, function (error, data) {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
		});
	});

	/**
	 * Delete external key of current tenant's application
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/settings/tenant/application/key/ext/delete", function (req, res) {
		checkMyAccess(req, res, function () {
			initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
				BL.deleteApplicationExtKeys(config, req, res, function (error, data) {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
		});
	});

	/**
	 * Update service configuration of current tenant's key
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/settings/tenant/application/key/config/update", function (req, res) {
		checkMyAccess(req, res, function () {
			initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
				BL.updateApplicationConfig(config, req, res, function (error, data) {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
		});
	});

	/**
	 * List service configuration of current tenant's key
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/settings/tenant/application/key/config/list", function (req, res) {
		checkMyAccess(req, res, function () {
			initBLModel(req, res, dashboardBL.tenant.module, dbModel, function (BL) {
				BL.listApplicationConfig(config, req, res, function (error, data) {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
		});
	});

	/**
	 * content builder features
	 */

	/**
	 * List available content builders
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/cb/list", function (req, res) {
		initBLModel(req, res, dashboardBL.cb.module, dbModel, function (BL) {
			BL.list(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Get a specific content builder
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/cb/get", function (req, res) {
		initBLModel(req, res, dashboardBL.cb.module, dbModel, function (BL) {
			BL.get(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * List revisions of a specific content builder
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.get("/cb/listRevisions", function (req, res) {
		initBLModel(req, res, dashboardBL.cb.module, dbModel, function (BL) {
			BL.revisions(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Add a new content builder
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/cb/add", function (req, res) {
		initBLModel(req, res, dashboardBL.cb.module, dbModel, function (BL) {
			BL.add(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Update an existing content builder
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.put("/cb/update", function (req, res) {
		initBLModel(req, res, dashboardBL.cb.module, dbModel, function (BL) {
			BL.update(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Simulation api that mimics a service api behavior used by swagger feature.
	 * Api takes a yaml input and simulate the imfv validation of a requested service API
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/swagger/simulate", function (req, res) {
		initBLModel(req, res, dashboardBL.swagger.module, dbModel, function (BL) {
			BL.test(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Swagger generate service API
	 * Api takes service information and yaml code as service api schema
	 * attempts to communicate remote git repo
	 * if no errors are found in neither code nor git communication
	 * it generates a folder schema for the service and pushes it to the remote api repo
	 * @param {String} API route
	 * @param {Function} API middleware
	 */
	service.post("/swagger/generate", function (req, res) {
		initBLModel(req, res, dashboardBL.swagger.module, dbModel, function (BL) {
			BL.generate(config, req, res, function (error, data) {
				return res.json(req.soajs.buildResponse(error, data));
			});
		});
	});

	/**
	 * Service Start
	 */
	service.start();
});
