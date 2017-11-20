module.exports = {
    "source": ['body.catalog'],
    "required": true,
    "validation": {
        "type": "object",
        "required": true,
        "additionalProperties": false,
        "properties": {
            "name": { "type": "string", "required": true },
            "locked": { "type": "boolean", "required": false },
            "active": { "type": "boolean", "required": false },
            "type": { "type": "string", "required": true },
            "subtype": { "type": "string", "required": false},
            "description": { "type": "string", "required": true },
            "recipe": {
                "type": "object",
                "required": true,
                "additionalProperties": false,
                "properties": {
                    "deployOptions": {
                        "type": "object",
                        "required": true,
                        "properties": {
                            "namespace": {
                                "type": "string",
                                "required": false
                            },
                            "image": {
                                "type": "object",
                                "required": false,
                                "properties": {
                                    "prefix": { "type": "string", "required": false },
                                    "name": { "type": "string", "required": true },
                                    "tag": { "type": "string", "required": true },
                                    "pullPolicy": { "type": "string", "required": false }
                                }
                            },
                            "specifyGitConfiguration": {
                                "type": "boolean",
                                "required": false
                            },
                            "readinessProbe": {
                                "type": "object",
                                "required": false
                                //NOTE: removed validation for readinessProbe to allow free schema
                            },
                            "ports": {
                                "type": "array",
                                "required": false,
                                "items": {
                                    "type": "object",
                                    "additionalProperties": false,
                                    "properties": {
                                        "name": { "type": "string", "required": true },
                                        "isPublished": { "type": "boolean", "required": false },
                                        "port": { "type": "number", "required": false },
                                        "target": { "type": "number", "required": true },
                                        "published": { "type": "number", "required": false },
                                        "preserveClientIP": { "type": "boolean", "required": false }
                                    }
                                }
                            },
                            "voluming": {
                                "type": "object",
                                "required": false,
                                "additionalProperties": false,
                                "properties": {
                                    "volumes": {
                                        "type": "array",
                                        "required": true,
                                        "validation": {
                                            "type": "array"
                                        }
                                    },
                                    "volumeMounts": {
                                        "type": "array",
                                        "required": false,
                                        "validation": {
                                            "type": "array"
                                        }
                                    }
                                }
                            },
                            "labels": {
                                "type": "object",
                                "required": false
                            },
                            "serviceAccount": {
                                "type": "object",
                                "required": false
                            }
                        }
                    },
                    "buildOptions": {
                        "type": "object",
                        "required": false,
                        "additionalProperties": false,
                        "properties": {
                            "settings": {
                                "type": "object",
                                "required": false,
                                "properties": {
                                    "accelerateDeployment": { "type": "boolean", "required": false }
                                }
                            },
                            "env": {
                                "type": "object",
                                "required": false,
                                "additionalProperties": {
                                	"type": "object",
	                                "properties":{
		                                "type": { "type": "string", "required": true, "enum": [ "static", "userInput", "computed" ]},
		                                "label": {"type": "string", "required": false},
		                                "fieldMsg": {"type": "string", "required": false},
		                                "default": {"type": "string", "required": false}
	                                }
                                }
                            },
                            "cmd": {
                                "type": "object",
                                "required": false,
                                "additionalProperties": false,
                                "properties": {
                                    "deploy": {
                                        "type": "object",
                                        "required": true,
                                        "additionalProperties": false,
                                        "properties": {
                                            "command": { "type": "array", "required": true},
                                            "args": { "type": "array", "required": true}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};
