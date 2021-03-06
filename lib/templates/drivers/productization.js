"use strict";

const driver = {
	
	"check": function (req, context, lib, async, BL, callback) {
		//validate if ci schema is valid
		let template = context.template;
		let schema = require("../../../schemas/fullproduct");
		let myValidator = new req.soajs.validator.Validator();
		
		//check if name exists
		if (template.content && template.content.productization && template.content.productization.data && Array.isArray(template.content.productization.data) && template.content.productization.data.length > 0) {
			let products = template.content.productization.data;
			async.eachSeries(products, (oneProduct, cb) => {
				async.eachSeries(oneProduct.packages, (onePackage, pCb) => {
					if (onePackage.code.indexOf(oneProduct.code + '_') !== -1) {
                        onePackage.code = onePackage.code.split('_')[1];
					}
                    pCb();
				}, () => {
                    let status = myValidator.validate(oneProduct, schema);
                    if (!status.valid) {
                        status.errors.forEach(function (err) {
                            context.errors.push({
                                code: 173,
                                msg: `<b>${oneProduct.code}</b>: ` + err.stack,
                                group: "Products"
                            })
                        });
                    }
                    return cb();
				});
			}, callback);
		} else {
			return callback();
		}
	},
	
};

module.exports = driver;