'use strict';
const fs = require("fs");
const utils = require("../../../utils/utils.js");
const async = require("async");
const infraColname = 'infra';

function checkIfError(soajs, mainCb, data, cb) {
	utils.checkErrorReturn(soajs, mainCb, data, cb);
}

var BL = {
	model: null,
	
	/**
	 * List all deployed virtual machines by account
	 *
	 * @param  {Object}   config
	 * @param  {Object}   soajs
	 * @param  {Object}   deployer
	 * @param  {Function} cbMain
	 */
	"listVMs": function (config, soajs, deployer, cbMain) {
		
		async.auto({
			"getEnvironment": (mCb) =>{
				if(!soajs.inputmaskData.env){
					return mCb();
				}
				utils.getEnvironment(soajs, BL.model, soajs.inputmaskData.env.toUpperCase(), (error, envRecord) => {
					checkIfError(soajs, mCb, { config: config, error: error || !envRecord, code: 600 }, mCb);
				});
			},
			"getInfras": (mCb) => {
				soajs.inputmaskData.id = soajs.inputmaskData.infraId;
				BL.model.validateId(soajs, (err) => {
					checkIfError(soajs, mCb, {config: config, error: err, code: 490}, () => {
						let opts = {
							collection: infraColname,
							conditions: {
								_id: soajs.inputmaskData.id,
								"technologies": {$in: ["vm"]}
							}
						};
						BL.model.findEntry(soajs, opts, function (err, infraRecord) {
							checkIfError(soajs, mCb, {config: config, error: err, code: 600}, () => {
								checkIfError(soajs, mCb, {
									config: config,
									error: !infraRecord,
									code: 600
								}, () => {
									return mCb(null, infraRecord);
								});
							});
						});
					});
				});
			},
			"callDeployer": ["getEnvironment", "getInfras", (info, mCb) => {
				let options = {
					soajs: soajs,
					env: (soajs.inputmaskData.env) ? soajs.inputmaskData.env.toLowerCase() : null,
					infra: info.getInfras
				};
				deployer.execute({ type: "infra", name: info.getInfras.name, technology: "vm" }, 'listServices', options, (error, vms) => {
					checkIfError(soajs, mCb, {config: config, error: error}, () => {
						return mCb(null, vms);
					});
				});
			}]
		}, (error, result) => {
			checkIfError(soajs, cbMain, {config: config, error: error}, () => {
				return cbMain(null, {[result.getInfras.name]: result.callDeployer});
			});
		});
	},
	
	/**
	 * Execute a command inside a running virtual machine
	 *
	 * This functions takes its arguments either from
	 *  - soajs.inputmaskData.recipe (catalog recipe)
	 *  - soajs.inputmaskData.opts
	 *      --command => array
	 *      --args ==> array
	 *      --env environment variables object
	 * A command property must be provided!
	 * This function will not wait for the execution of the command
	 * @param  {Object}   config
	 * @param  {Object}   soajs
	 * @param  {Object}   deployer
	 * @param  {Function} cbMain
	 */
	"runCommand": function (config, soajs, deployer, cbMain) {
		let options = {
			infra: soajs.inputmaskData.infraRecord,
			soajs: soajs,
			params : {
				resourceGroupName: soajs.inputmaskData.env.toLowerCase(),
				vmName: soajs.inputmaskData.vmName,
			},
			
		};
		if (soajs.inputmaskData.catalog && soajs.inputmaskData.catalog.recipe && soajs.inputmaskData.catalog.recipe.buildOptions){
		
			if (soajs.inputmaskData.catalog.recipe.buildOptions.env){
				options.params.env = soajs.inputmaskData.catalog.recipe.buildOptions.env;
			}
			
			if (soajs.inputmaskData.catalog.recipe.buildOptions.cmd && soajs.inputmaskData.catalog.recipe.buildOptions.cmd.deploy ){
				if (soajs.inputmaskData.catalog.recipe.buildOptions.cmd.deploy.command){
					options.params.command = soajs.inputmaskData.catalog.recipe.buildOptions.cmd.deploy.command;
				}
				if (soajs.inputmaskData.catalog.recipe.buildOptions.cmd.deploy.args){
					options.params.args = soajs.inputmaskData.catalog.recipe.buildOptions.cmd.deploy.args;
				}
			}
		}
		else {
			if (soajs.inputmaskData.opts){
				if (soajs.inputmaskData.opts.command){
					options.params.command = soajs.inputmaskData.command;
				}
				if (soajs.inputmaskData.opts.env){
					options.params.env = soajs.inputmaskData.env;
				}
				if (soajs.inputmaskData.opts.args){
					options.params.args = soajs.inputmaskData.args;
				}
			}
		}
		checkIfError(soajs, cbMain, {config: config, error: !options.params.command ? {error: !options.params.command, message: 'No command was provided!'}: null }, () => {
			deployer.execute({ type: "infra", name: soajs.inputmaskData.infraRecord.name, technology: 'vm' }, 'runCommand', options, (error, res) => {
				if (error){
					soajs.log.error(error);
				}
				else {
					soajs.log.info(res);
				}
			});
			return cbMain(null, true);
		});
	},
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