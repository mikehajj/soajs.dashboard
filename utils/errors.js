"use strict";

var errors = {
	"400": "Unable to add the environment record",
	"401": "Unable to update the environment record",
	"402": "Unable to get the environment records",
	"403": "Environment already exists",
	"404": "Unable to remove environment record",
	"405": "Invalid environment id provided",
	"406": "Unable to update tenant key security information",
	"407": "Invalid or no Platform Driver configuration provided!",

	"409": "Invalid product id provided",
	"410": "Unable to add the product record",
	"411": "Unable to update the product record",
	"412": "Unable to get the product record",
	"413": "Product already exists",
	"414": "Unable to remove product record",
	"415": "Unable to add the product package",
	"416": "Unable to update the product package",
	"417": "Unable to get the product packages",
	"418": "Product package already exists",
	"419": "Unable to remove product package",

	"420": "Unable to add the tenant record",
	"421": "Unable to update the tenant record",
	"422": "Unable to get the tenant records",
	"423": "Tenant already exists",
	"424": "Unable to remove tenant record",

	"425": "Unable to add the tenant OAuth",
	"426": "Unable to update the tenant OAuth",
	"427": "Unable to get the tenant OAuth",
	"428": "Unable to remove tenant OAuth",

	"429": "Unable to add the tenant application",
	"430": "Unable to update the tenant application",
	"431": "Unable to get the tenant application",
	"432": "Unable to remove tenant application",
	"433": "Tenant application already exist",
	"434": "Invalid product code or package code provided",

	"435": "Unable to get the tenant application keys",
	"436": "Unable to add a new key to the tenant application",
	"437": "Unable to remove key from the tenant application",
	"438": "Invalid tenant Id provided",
	"439": "Invalid tenant oauth user Id provided",

	"440": "Unable to add the tenant application ext Key",
	"441": "Unable to update the tenant application ext Key",
	"442": "Unable to get the tenant application ext Keys",
	"443": "Unable to remove tenant application ext Key",
	"444": "Unable to get the tenant application configuration",
	"445": "Unable to update the tenant application configuration",
	"446": "Invalid environment provided",

	"447": "Unable to get tenant oAuth Users",
	"448": "tenant oAuth User already exists",
	"449": "Unable to add tenant oAuth User",
	"450": "Unable to remove tenant oAuth User",
	"451": "Unable to updated tenant oAuth User",

    "452": "Invalid Tenant Code",
    "453": "Invalid Tenant External Key",
    "454": "Tenant does not exist",
    "455": "Tenant Key already exists",
    "456": "Error adding Tenant Key",

	"460": "Unable to find product",
	"461": "Unable to find package",

	"462": "You are not allowed to remove the tenant you are currently logged in with",
	"463": "You are not allowed to remove the application you are currently logged in with",
	"464": "You are not allowed to remove the key you are currently logged in with",
	"465": "You are not allowed to remove the external key you are currently logged in with",
	"466": "You are not allowed to remove the product you are currently logged in with",
	"467": "You are not allowed to remove the package you are currently logged in with",

	"500": "This record is locked. You cannot delete it",
	"501": "This record is locked. You cannot modify or delete it",
	"502": "Invalid cluster name provided",
	"503": "Error adding new environment database",
	"504": "Environment cluster already exists",
	"505": "Error adding environment cluster",
	"506": "Error updating environment cluster",
	"507": "Invalid db Information provided for session database",
	"508": "cluster not found",
	"509": "environment database already exist",
	"510": "environment session database already exist",
	"511": "environment session database does not exist",
	"512": "environment database does not exist",
	"513": "Error updating environment database",
	"514": "Error removing environment database",

	"600": "Database error",
	"601": "No Logged in User found.",
	"602": "Invalid maintenance operation requested.",
	"603": "Error executing maintenance operation.",
	"604": "Service not found.",
	"605": "Service Host not found.",
	"606": "Error adding an administrator user for tenant",
	"607": "Error adding an administrator group for tenant",
	"608": "Permissions denied to access this section",
	"609": "Dashboard service is not accessible at the time being Come back later.",
	"610": "Invalid or profile not found.",
	"611": "Invalid Service Image Name provided",
	"612": "Invalid Operation! you can either deploy a service by providing its image or if it is a GC service but not both.",
	"613": "Invalid Operation! either deploy a service by providing its image or its GC information.",
	"614": "Service exists!",
	"615": "Error adding service host!",
	"616": "Error Uploading File.",
	"617": "Error Registering Service.",
	"618": "The Deployer of this environment is configured to be manual. Deploy and Start the services then refresh this section.",
	"619": "The Deployer of this environment is configured to be manual. Unable to perform requested maintenance operation.",
    "620": "Make sure upload directory exists :",

	"700": "This Content Schema already Exist",
	"701": "Invalid Id provided",
	"702": "Content Schema doesn't exists",
	"703": "Invalid or no Content Service with this name and version",
	"704": "Another Service with the same name or port exists. Change the name of this schema or its service port.",
	"705": "Tenant already has a key to use the dashboard",
	"706": "Please create a session database for this environment",

	"710": "A Daemon with the same name and/or port already exists",
	"714": "A Group Configuration with the same name already exists",
	"715": "Unable to update group configuration",
	"716": "Unable to delete group configuration",
	"717": "Unable to add group configuration",
	"718": "Unable to retrieve list of daemons",
	"719": "Unable to retrieve list of group configurations",

	"720": "Unable to update job's service configuration",
	"721": "Unable to retrieve job's service configuration",
	"722": "Unable to update job's tenant external keys",
	"723": "Unable to list job's tenant external keys",
	"724": "Job not found",
	"725": "Group Configuration not found",
	"726": "Daemon not found",

	"727": "Unable to add certificate(s)",
	"728": "Unable to get certificate(s)",
	"729": "Unable to remove certificate",
	"730": "One or more certificates do not exist",
	"731": "Certificate with the same name exists. Either change its name or select it using the 'Choose Existing' feature",

	"732": "Unable to list drivers",
	"733": "Unable to add driver",
	"734": "Unable to update driver",
	"735": "Unable to change selected driver",
	"736": "Unable to delete driver",
	"737": "You are not allowed to delete a driver that is currently selected",
	"738": "Unable to change deployer type",

	"739": "Missing required param(s). Make sure you specify certificate filename, environment code, and driver name",

	"740": "This application does not have access to specified environment. Either update its package's ACL or choose a different environment",

	"741": "No platform certificates found for this environment. Please upload them in the Platforms section",

	"742": "Unable to list static content sources",

	"743": "Missing environment deployer settings. Please specify deployment type, selected driver, and driver settings in the Platforms section",

	"750": "Invalid Request.",

	"751": "Unable to login",
	"752": "User account already exists",
	"753": "Unable to logout",
	"754": "Active repositories exist for this user. Please deactivate them to be able to logout",
	"755": "Authentication failed",
	"756": "Unable to list accounts",
	"757": "Unable to get git user account",
	"758": "Unable to get repositories. Please try again.",
	"759": "Unable to get branches",
	"760": "Missing source information",
	"761": "Failed to activate repository, make sure config.js file is available in your repository and it has the right schema.",
	"762": "A module with the same name and/or port already exists",
	"763": "Unable to reach the GitHub API. Please try again.",

	"764": "Static Content already exists",
	"765": "Failed to deactivate repository",
	"766": "Repository has running hosts. Please stop them to be able to deactivate repository",
	"767": "Invalid Git information provided",
	"768": "Failed to sync repository",
	"769": "Missing config.js data",
	"770": "Missing config.js source data",
	"771": "Invalid or no type provided in config.js",

	"772": "Unable to list zombie containers",
	"773": "Unable to delete container",
	"774": "Unable to get container logs",

	"775": "Missing account provider param",
	"776": "GitHub API returned an error: API rate limit exceeded for this IP. It is advised to use an authenticated account to proceed or try again later",

	"777": "You are not allowed to delete this container. At least one instance of nginx must be available",

	901: "Error Logging out from environments",
	902: "Error Logging in to environments",
	903: "You do not have access to this environment %envCode%"
};


module.exports = errors;
