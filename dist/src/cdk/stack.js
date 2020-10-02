"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiraStack = exports.MiraServiceStack = void 0;
const cdk = __importStar(require("@aws-cdk/core"));
const aws = __importStar(require("aws-sdk"));
const aws_cloudformation_1 = require("@aws-cdk/aws-cloudformation");
const core_1 = require("@aws-cdk/core");
const aws_ssm_1 = require("@aws-cdk/aws-ssm");
const policies_1 = require("./aspects/security/policies");
const mira_config_1 = require("../config/mira-config");
const app_1 = require("./app");
/**
 * The main Mira stack.  Responsible for provisioning IAM role / CodePipeline.
 * There is a 1:1 relationship between the service stack and the app.  This
 * makes provisioning a CICD more organized within a single app and keeps the
 * CloudFormation stack listing likewise de-cluttered.
 */
class MiraServiceStack extends cdk.Stack {
    constructor(app, environment, suffix) {
        const account = mira_config_1.MiraConfig.getEnvironment(environment);
        let stackName = `${app_1.MiraApp.getBaseStackName('Service')}-${account.name}`;
        if (suffix) {
            stackName += `-${suffix}`;
        }
        super(app.cdkApp, stackName, {
            env: {
                region: account.env.region,
                account: account.env.account
            }
        });
        this.initialized = new Promise((resolve) => {
            setTimeout(async () => {
                await this.initialize();
                resolve();
            }, 1);
        });
    }
    /**
     * Applies security policies.
     */
    applyPolicies(customList) {
        core_1.Aspects.of(this).add(new policies_1.Policies(customList));
    }
    /**
     * Initialize this component in some async way.
     */
    async initialize() {
        const iam = new aws.IAM();
        let owner;
        let createdBy;
        try {
            owner = await iam.getUser().promise();
            createdBy = owner.User.UserName;
        }
        catch (error) {
            // console.log('Unable to get current user, fallback to caller identity')
            const sts = new aws.STS();
            owner = await sts.getCallerIdentity().promise();
            // this is only needed because of Typescript since we use the getCallerIdentity call only when the iam.getUser call fails
            // and that only happens when an assumed role is used instead of an actual user profile
            // in this case the UserId property will be there and the actual userId will be used since it is not possible to get the actual user name
            createdBy = owner.UserId ? owner.UserId.split(':')[0] : 'usr';
        }
        core_1.Tags.of(this).add('StackName', this.stackName);
        core_1.Tags.of(this).add('CreatedBy', createdBy);
        const costCenter = mira_config_1.MiraConfig.getCostCenter();
        if (costCenter) {
            core_1.Tags.of(this).add('CostCenter', costCenter);
        }
        return Promise.resolve();
    }
}
exports.MiraServiceStack = MiraServiceStack;
/**
 * @class Object containing persistent state for MiraStack.  This generally
 * is instantiated and attached one time, but is useful as a class object for
 * testing purposes to cleanly wipe and configure state.
 */
class MiraStackState {
    constructor() {
        /**
         * Stores stack instances by name.
         */
        this.stackInstances = {};
    }
}
/**
 * Note that in Mira, a "stack" is always nested within a service context to
 * support CICD out of the box.
 */
class MiraStack extends aws_cloudformation_1.NestedStack {
    constructor(parent, name, props) {
        if (!name) {
            name = 'DefaultStack';
        }
        if (!MiraStack.stackInstances[name]) {
            MiraStack.stackInstances[name] = [];
        }
        const id = MiraStack.stackInstances[name].length;
        super(parent, `${name}-${id}`);
        this.parent = parent;
        this.name = name;
        this.props = props || {};
        MiraStack.stackInstances[name].push(this);
        this.initialized = new Promise((resolve) => {
            setTimeout(async () => {
                await this.initialize();
                resolve();
            }, 1);
        });
    }
    /**
   * Adds an output to the stack.
   * @param name
   * @param value
   * @param shouldExport
   */
    addOutput(name, value, shouldExport = true) {
        const exportName = name;
        new core_1.CfnOutput(this, name, {
            value: value
        });
        if (shouldExport) {
            new core_1.CfnOutput(this.parent, exportName, {
                value: value
            });
        }
    }
    /**
   * Initialize this component in an asynchronous manner.
   */
    initialize() {
        return Promise.resolve();
    }
    createParameter(fullName, description, value) {
        const { id, parameterName } = this.parseParameterName(fullName);
        return new aws_ssm_1.StringParameter(this, id, {
            description,
            parameterName,
            stringValue: value
        });
    }
    loadParameter(fullName) {
        const { id, parameterName } = this.parseParameterName(fullName);
        return aws_ssm_1.StringParameter.fromStringParameterAttributes(this, id, {
            parameterName
        });
    }
    parseParameterName(fullName) {
        const nameParts = fullName.split('/');
        const baseName = nameParts.length === 1 ? this.name : nameParts[0];
        const name = nameParts.length === 1 ? nameParts[0] : nameParts[1];
        const id = `${baseName}${name}Parameter`;
        const parameterName = `/${app_1.MiraApp.getStackName()}/${baseName}/${name}`;
        return { id, parameterName };
    }
}
exports.MiraStack = MiraStack;
// Attach the default state.
Object.assign(MiraStack, new MiraStackState());
//# sourceMappingURL=stack.js.map