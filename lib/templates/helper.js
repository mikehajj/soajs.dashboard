"use strict";
var fs = require("fs");
var async = require("async");
var unzip2 = require("unzip2");

let path = __dirname + "/uploads/";

const helpers = {
	
	ci: function (cmd, req, context, BL, lib, callback) {
		const ci = require("./drivers/ci");
		ci[cmd](req, context, lib, async, BL, callback);
	},
	
	cd: function (cmd, req, context, BL, lib, callback) {
		const cd = require("./drivers/cd");
		cd[cmd](req, context, lib, async, BL, callback);
	},
	
	endpoint: function (cmd, req, context, BL, lib, callback) {
		const endpoint = require("./drivers/endpoint");
		endpoint[cmd](req, context, lib, async, BL, callback);
	},
	
	productization: function (cmd, req, context, BL, lib, callback) {
		const productization = require("./drivers/productization");
		productization[cmd](req, context, lib, async, BL, callback);
	},
	
	tenant: function (cmd, req, context, BL, lib, callback) {
		const tenant = require("./drivers/tenant");
		tenant[cmd](req, context, lib, async, BL, callback);
	},
	
	repos: function (cmd, req, context, BL, lib, callback) {
		const repos = require("./drivers/repos");
		repos[cmd](req, context, lib, async, BL, callback);
	},
	
	"cleanUp": function (fileName, mCb) {
		if (fileName) {
			fs.exists(path + fileName + ".zip", (exists) => {
				if (exists) {
					fs.unlinkSync(path + fileName + ".zip");
				}
			});
			
			fs.exists(path + fileName + ".js", (exists) => {
				if (exists) {
					fs.unlinkSync(path + fileName + ".js");
				}
			});
			
			fs.exists(path + fileName + ".json", (exists) => {
				if (exists) {
					fs.unlinkSync(path + fileName + ".json");
				}
			});
		}
		return mCb();
	},
	
	"parse": function (req, form, context, mCb) {
		try{
			form.onPart = function (part) {
				if(!part){
					return mCb({code: 172, msg: "No Uploaded File Detected in request !"});
				}
				
				if (!part.filename) return form.handlePart(part);
				
				let fileName = part.filename.replace(".zip", "");
				context.fileName = fileName;
				
				let writeStream = fs.createWriteStream(path + fileName + ".zip");
				
				part.pipe(writeStream);
				
				writeStream.on('error', function (error) {
					return mCb({code: 600, msg: error.toString()});
				});
				
				//once file is written, unzip it and parse it
				writeStream.on('close', function () {
					//if zip file, trigger parse
					try {
						fs.createReadStream(path + fileName + ".zip").pipe(unzip2.Extract({path: path})).on('error', (error) => {
							return mCb({code: 600, msg: error.toString()});
						}).on("close", () => {
							
							fs.exists(path + fileName + ".json", (exists) =>{
								if(!exists){
									fs.exists(path + fileName + ".js", (exists) =>{
										if(!exists){
											return mCb({code: 600, msg: "Unable to Load or Parse Uploaded Template!"});
										}
										else{
											parseTheFile(path + fileName + ".js");
										}
									});
								}
								else{
									parseTheFile(path + fileName + ".json");
								}
							});
							
							function parseTheFile(filePath){
								context.template = require(filePath);
								return mCb(null, true);
							}
						});
					}
					catch (error) {
						return mCb({code: 600, msg: error.toString()});
					}
				});
				
			};
			form.parse(req);
		}
		catch(e){
			return mCb({code: 173, msg: e.toString() });
		}
	},
	
	"checkDuplicate": function (req, BL, context, lib, mCb) {
		let template = context.template;
		
		let stack = [];
		//check ci recipes
		if (template.content && template.content.recipes && template.content.recipes.ci) {
			let stepMethod = function (vCb) {
                helpers.ci("check", req, context, BL, lib, vCb);
            };
			stack.push(stepMethod);
		}
		
		//check cd recipes
		if (template.content && template.content.recipes && template.content.recipes.deployment) {
			let stepMethod = function (vCb) {
				helpers.cd("check", req, context, BL, lib, (error) => {
					if (error) {
						context.errors.push(error);
					}
					return vCb();
				});
			};
			stack.push(stepMethod);
		}
		
		//check endpoints & services
		if (template.content && template.content.endpoints) {
			let stepMethod = function (vCb) {
				helpers.endpoint("check", req, context, BL, lib, (error) => {
					if (error) {
						context.errors.push(error);
					}
					return vCb();
				});
			};
			stack.push(stepMethod);
		}
		
		//check productization schemas
		if (template.content && template.content.productization) {
			let stepMethod = function (vCb) {
				helpers.productization("check", req, context, BL, lib, (error) => {
					if (error) {
						context.errors.push(error);
					}
					return vCb();
				});
			};
			stack.push(stepMethod);
		}
		
		//check tenant schemas
		if (template.content && template.content.tenant) {
			let stepMethod = function (vCb) {
				helpers.tenant("check", req, context, BL, lib, (error) => {
					if (error) {
						context.errors.push(error);
					}
					return vCb();
				});
			};
			stack.push(stepMethod);
		}
		
		//check activated repos
		if (template.content && template.content.deployments && template.content.deployment.repo) {
			let stepMethod = function (vCb) {
				helpers.repos("check", req, context, BL, lib, (error) => {
					if (error) {
						context.errors.push(error);
					}
					return vCb();
				});
			};
			stack.push(stepMethod);
		}
		
		async.series(stack, mCb);
	},
	
	"saveContent": function (req, BL, context, lib, mCb) {
		let template = context.template;
		
		let stack = [];
		//check ci recipes
		if (template.content && template.content.recipes && template.content.recipes.ci) {
			let stepMethod = function (vCb) {
				helpers.ci("save", req, context, BL, lib, (error) => {
					if (error) {
						context.errors.push(error);
					}
					return vCb();
				});
			};
			stack.push(stepMethod);
		}
		
		//check cd recipes
		if (template.content && template.content.recipes && template.content.recipes.deployment) {
			let stepMethod = function (vCb) {
				helpers.cd("save", req, context, BL, lib, (error) => {
					if (error) {
						context.errors.push(error);
					}
					return vCb();
				});
			};
			stack.push(stepMethod);
		}
		
		//check endpoints & services
		if (template.content && template.content.endpoints) {
			let stepMethod = function (vCb) {
				helpers.endpoint("save", req, context, BL, lib, (error) => {
					if (error) {
						context.errors.push(error);
					}
					return vCb();
				});
			};
			stack.push(stepMethod);
		}
		
		async.series(stack, mCb);
	},
	
	"generateDeploymentTemplate": function (req, config, BL, context, lib, mCb) {
		/**
		 * remove unneeded information: content.recipes & content.endpoints
		 * set type to _template
		 */
		delete context.template.content.recipes;
		delete context.template.content.endpoints;
		delete context.template.expires;
		context.template.type = "_template";
		
		let method = (context.template._id) ? "saveEntry" : "insertEntry";
		BL.model[method](req.soajs, {"collection": "templates", "record": context.template}, mCb);
	},
	
	"mergeToTemplate": function (req, config, BL, context, lib, mCb) {
		//get the template from the database to rectify it
		BL.model.findEntry(req.soajs, {
			"collection": "templates",
			"conditions": {"_id": new BL.model.getDb(req.soajs).ObjectId(req.soajs.inputmaskData.id)}
		}, (error, template) => {
			lib.checkReturnError(req, mCb, {config: config, error: error, code: 600}, () => {
				context.template = template;
				
				let stack = [];
				//check ci recipes
				if (template.content && template.content.recipes && template.content.recipes.ci) {
					let stepMethod = function (vCb) {
						helpers.ci("merge", req, context, BL, lib, (error) => {
							if (error) {
								context.errors.push(error);
							}
							return vCb();
						});
					};
					stack.push(stepMethod);
				}
				
				//check cd recipes
				if (template.content && template.content.recipes && template.content.recipes.deployment) {
					let stepMethod = function (vCb) {
						helpers.cd("merge", req, context, BL, lib, (error) => {
							if (error) {
								context.errors.push(error);
							}
							return vCb();
						});
					};
					stack.push(stepMethod);
				}
				
				//check endpoints & services
				if (template.content && template.content.endpoints) {
					let stepMethod = function (vCb) {
						helpers.endpoint("merge", req, context, BL, lib, (error) => {
							if (error) {
								context.errors.push(error);
							}
							return vCb();
						});
					};
					stack.push(stepMethod);
				}
				
				//check activated repos
				if (template.content && template.content.deployments && template.content.deployment.repo) {
					let stepMethod = function (vCb) {
						helpers.repos("merge", req, context, BL, lib, (error) => {
							if (error) {
								context.errors.push(error);
							}
							return vCb();
						});
					};
					stack.push(stepMethod);
				}
				
				async.series(stack, mCb);
			});
		});
	},
	
	"checkMandatoryTemplateSchema": function (req, BL, lib, context, validator, mCb) {
		let errors = [];
		let schema = require("../../schemas/template");
		let status = validator.validate(context.template, schema);
		if (!status.valid) {
			status.errors.forEach(function (err) {
				errors.push({code: 173, msg: err.stack});
			});
		}
		
		//there is a conflict in the schema
		if(errors && errors.length > 0){
			return mCb(errors);
		}
		
		//template was previously inserted, now it's being rectified, no need to check in db
		if(context.template._id){
			return mCb(null, true);
		}
		
		//check if this template already exists in the db
		BL.model.countEntries(req.soajs, {
			"collection": "templates",
			"conditions":{
				"name": context.template.name
			}
		}, (error, count) =>{
			lib.checkReturnError(req, mCb, {config: config, error: error, code: 600}, () => {
				lib.checkReturnError(req, mCb, {config: config, error: count > 0, code: 998}, () => {
					return mCb(null, true);
				});
			});
		});
	}
};

module.exports = helpers;