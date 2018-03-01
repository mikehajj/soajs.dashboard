"use strict";
var assert = require("assert");
var helper = require("../../../helper.js");
var swagger = helper.requireModule('./utils/apiBuilder/swagger.js');

let yamlWithResponse = "swagger: '2.0'\ninfo:\n    version: 1.0.0\n    title: www\nhost: localhost\nbasePath: /www\nschemes:\n    - http\npaths:\n    /pet:\n        post:\n            tags:\n                - pet\n            summary: 'Add a new pet to the store'\n            operationId: Addanewpettothestore\n            responses:      200:        description:test";


let yamlComplex = "swagger: '2.0'\ninfo:\n    version: 1.0.0\n    title: www\nhost: localhost\nbasePath: /www\nschemes:\n    - http\npaths:\n    /pet:\n        post:\n            tags:\n                - pet\n            summary: 'Add a new pet to the store'\n            operationId: Addanewpettothestore\n            parameters:\n                -\n                    $ref: '#/parameters/testInParams'\n    /testArrayRoot:\n        post:\n            tags:\n                - pets\n            summary: 'get all pets'\n            operationId: getallpets\n            parameters:\n                -\n                    name: input\n                    required: true\n                    in: body\n                    description: 'Pet object that needs to be added to the store'\n                    schema:\n                        type: array\n                        items:\n                            type: object\n                            properties:\n                                sss:\n                                    type: string\n    '/pet/:id':\n        delete:\n            tags:\n                - pet\n            summary: 'delete a pet by id'\n            operationId: deleteapetbyid\n            parameters:\n                -\n                    name: testInDef\n                    required:\n                        - breed\n                        - name\n                    description: 'Pet object that needs to be added to the store'\n                    schema:\n                        type: object\n                        properties:\n                            breed:\n                                type: string\n                            name:\n                                type: string\n                            subObjExample:\n                                type: object\n                                properties:\n                                    sub2:\n                                        type: object\n                                        properties:\n                                            sub3:\n                                                type: string\n                                    level2int:\n                                        type: integer\n                                    level2arraystring:\n                                        type: array\n                                        items:\n                                            type: string\n                                    level2arrayobj:\n                                        type: array\n                                        items:\n                                            type: object\n                                            properties:\n                                                arraySubInt:\n                                                    type: integer\n                                                arraySubObj:\n                                                    type: object\n                                                    properties:\n                                                        levelN:\n                                                            type: string\n                        required:\n                            - breed\n                            - name\n        put:\n            tags:\n                - pet\n            summary: 'Update an existing pet'\n            operationId: Updateanexistingpet\n            parameters:\n                -\n                    name: inputString\n                    required: true\n                    in: path\n                    description: 'Pet object that needs to be added to the store'\n                    type: string\n                -\n                    name: inputString2\n                    required: true\n                    in: header\n                    description: 'Pet object that needs to be added to the store'\n                    type: string\n                -\n                    name: testDirect\n                    required: true\n                    in: body\n                    description: 'Pet object that needs to be added to the store'\n                    schema:\n                        type: object\n                        properties:\n                            breed:\n                                type: string\n                            name:\n                                type: string\n                            subObjExample:\n                                type: object\n                                properties:\n                                    sub2:\n                                        type: object\n                                        properties:\n                                            sub3:\n                                                type: string\n                                    level2int:\n                                        type: integer\n                                    level2arraystring:\n                                        type: array\n                                        items:\n                                            type: string\n                                    level2arrayobj:\n                                        type: array\n                                        items:\n                                            type: object\n                                            properties:\n                                                arraySubInt:\n                                                    type: integer\n                                                arraySubObj:\n                                                    type: object\n                                                    properties:\n                                                        levelN:\n                                                            type: string\n                -\n                    $ref: '#/parameters/id'\n    /pets:\n        get:\n            tags:\n                - pets\n            summary: 'get all pets'\n            operationId: getallpets\nresponses:\n    success:\n        description: success\n    invalid:\n        description: 'invalid id'\n    invalidInput:\n        description: 'invalid input'\nparameters:\n    id:\n        name: id\n        required: true\n        in: path\n        description: 'Pet mongo id'\n        type: string\n    testInParams:\n        name: testInParams\n        required: true\n        in: body\n        description: 'Pet object that needs to be added to the store'\n        schema:\n            type: object\n            properties:\n                breed:\n                    type: string\n                name:\n                    type: string\n                subObjExample:\n                    type: object\n                    properties:\n                        sub2:\n                            type: object\n                            properties:\n                                sub3:\n                                    type: string\n                        level2int:\n                            type: integer\n                        level2arraystring:\n                            type: array\n                            items:\n                                type: string\n                        level2arrayobj:\n                            type: array\n                            items:\n                                type: object\n                                properties:\n                                    arraySubInt:\n                                        type: integer\n                                    arraySubObj:\n                                        type: object\n                                        properties:\n                                            levelN:\n                                                type: string\n";

let context = {
	soajs: {
		config: {
			serviceVersion: 1,
			serviceName: 'test',
			serviceGroup: 'test',
			servicePort: 4321,
			prerequisites: {}
		}
	}
};

describe("Swagger to JSON Utilities", function () {
	
	it("Fail - parse yaml responses", function (done) {
		swagger.parseYaml(yamlWithResponse, context, function (error, response) {
			assert.deepEqual(error.code, 853);
			done();
		});
	});
	
	it("Success - parse yaml", function (done) {
		swagger.parseYaml(yamlComplex, context, function (error, response) {
			assert.deepEqual(response, true);
			done();
		});
	});
});