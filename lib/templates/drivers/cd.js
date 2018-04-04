"use strict";
let colName = 'catalogs';
const driver = {
	
	"check": function (req, context, lib, async, BL, callback) {
		//validate if ci schema is valid
		let template = context.template;
		let schema = context.config.schema.post["/catalog/recipes/add"].catalog.validation;
		let myValidator = new req.soajs.validator.Validator();
		
		//check if name exists
		if (template.content && template.content.recipes && template.content.recipes.deployment && template.content.recipes.deployment.length > 0) {
			let catalogs = template.content.recipes.deployment;
			async.eachSeries(catalogs, (oneCatalog, cb) => {
				let status = myValidator.validate(oneCatalog, schema);
				if (!status.valid) {
					status.errors.forEach(function (err) {
						context.errors.push({code: 173, msg: err.stack})
					});
					return cb();
				}
				else {
					let opts = {
						conditions: {
							name: oneCatalog.name
						},
						collection: colName,
					};
					
					BL.model.countEntries(req.soajs, opts, function (error, count) {
						lib.checkReturnError(req, cb, {config: context.config, error: error, code: 600}, () => {
							if (count && count === 1) {
								context.errors.push({
									"code": 967,
									"msg": `Catalog Deployment recipe ${oneCatalog.name} already exists => ${oneCatalog.name}`
								})
							}
							return cb();
						});
					});
				}
			}, callback);
		} else {
			return callback();
		}
	},
	
	"merge": function (req, context, lib, async, BL, callback) {
		
		if (req.soajs.inputmaskData.correction && req.soajs.inputmaskData.correction.catalogs) {
			req.soajs.inputmaskData.correction.catalogs.forEach((oneCatalogInput) => {
				
				context.template.content.deployment.forEach((oneTemplateCatalog) => {
					if (oneCatalogInput.old === oneTemplateCatalog.name) {
						oneTemplateCatalog.name = oneCatalogInput.new;
					}
				});
				
				//check the other dependent sections
				if (context.template.content.deployments) {
					//check in repos
					if (context.template.content.deployments.repo) {
						for (let oneRepo in context.template.content.deployments.repo) {
							if (context.template.content.deployments.repo[oneRepo].deploy) {
								if (context.template.content.deployments.repo[oneRepo].deploy.recipes) {
									if (context.template.content.deployments.repo[oneRepo].deploy.recipes.default === oneCatalogInput.old) {
										context.template.content.deployments.repo[oneRepo].deploy.recipes.default = oneCatalogInput.new;
									}
									if (context.template.content.deployments.repo[oneRepo].deploy.recipes.available &&
										Array.isArray(context.template.content.deployments.repo[oneRepo].deploy.recipes.available) &&
										context.template.content.deployments.repo[oneRepo].deploy.recipes.available.length > 0) {
										
										for (let i = 0; i < context.template.content.deployments.repo[oneRepo].deploy.recipes.available.length; i++) {
											if (context.template.content.deployments.repo[oneRepo].deploy.recipes.available[i] === oneCatalogInput.old) {
												context.template.content.deployments.repo[oneRepo].deploy.recipes.available[i] = oneCatalogInput.new;
											}
										}
									}
								}
							}
						}
					}
					
					//check in resources
					if (context.template.content.deployments.resources) {
						for (let oneResource in context.template.content.deployments.resources) {
							if (context.template.content.deployments.resources[oneResource].deploy) {
								if (context.template.content.deployments.resources[oneResource].deploy.recipes) {
									if (context.template.content.deployments.resources[oneResource].deploy.recipes.default === oneCatalogInput.old) {
										context.template.content.deployments.resources[oneResource].deploy.recipes.default = oneCatalogInput.new;
									}
									if (context.template.content.deployments.resources[oneResource].deploy.recipes.available &&
										Array.isArray(context.template.content.deployments.resources[oneResource].deploy.recipes.available) &&
										context.template.content.deployments.resources[oneResource].deploy.recipes.available.length > 0) {
										
										for (let i = 0; i < context.template.content.deployments.resources[oneResource].deploy.recipes.available.length; i++) {
											if (context.template.content.deployments.resources[oneResource].deploy.recipes.available[i] === oneCatalogInput.old) {
												context.template.content.deployments.resources[oneResource].deploy.recipes.available[i] = oneCatalogInput.new;
											}
										}
									}
								}
							}
						}
					}
				}
			});
		}
		
		return callback();
	},
	
	"save": function (req, context, lib, async, BL, callback) {
		if (context.content && context.content.recipes && context.content.recipes.deployment && context.content.recipes.deployment.length > 0) {
			lib.initBLModel('catalog', (error, catalogModule) => {
				lib.checkReturnError(req, callback, {config: context.config, error: error, code: 600}, () => {
					let catalogs = context.content.recipes.deployment;
					async.eachSeries(catalogs, (oneCatalog, cb) => {
						req.soajs.inputmaskData = {};
						req.soajs.inputmaskData.catalog = oneCatalog;
						catalogModule.add(context.config, req, (error) => {
							lib.checkReturnError(req, cb, {config: context.config, error: error, code: 600}, cb);
						});
					}, callback);
				});
			});
		} else {
			return callback();
		}
	}
};

module.exports = driver;