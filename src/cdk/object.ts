import { MiraConfig, Account } from '../config/mira-config'
import MiraEnv from './env'

/**
 * @class Responsible for naming resources and establishing asynchronous
 * object initialization pattern.
 */
export class MiraObject {
    /* eslint-disable-next-line */
    initialized: Promise<any>
    name: string
    resourceType: string
    constructor(name: string, resourceType: string = 'resource') {
        if (resourceType === 'resource') {
            console.warn('Warning: resource type not defined for '
                + `${this.constructor.name}, defaulting to 'resource' as name`)
        }
        this.resourceType = resourceType
        this.name = name
        this.initialized = new Promise(async (resolve) => {
            try {
                // TODO: With stack, we won't run this code.
                await this.preInitialize()
                await this.initialize()
                // TODO: With stack, we won't run this code.
                await this.postInitialize()
                resolve()

            } catch (e) {
                console.warn(`Initialization of ${this.constructor.name} object failed:`, e)
                throw new Error(e)
            }

        })
    }

    /**
     * @todo Consider stuffing all naming related functions in this class, i.e.
     * migrate from MiraConfig.
     */
    public calculateSharedResourceName(resource: string): string {
        return MiraConfig.calculateSharedResourceName(resource)
    }

    /**
     * @todo Consider stuffing all naming related functions in this class, i.e.
     * migrate from MiraConfig.
     */
    public getBaseStackName(suffix = ''): string {
        return MiraConfig.getBaseStackName(suffix)
    }

    getEnv() {
        return MiraEnv.instance
    }

    /**
     * @todo Consider stuffing all naming related functions in this class, i.e.
     * migrate from MiraConfig.
     */
    public getEnvironment(name?: string): Account {
        return MiraConfig.getEnvironment(name)
    }

    /**
     * @todo Consider stuffing all naming related functions in this class, i.e.
     * migrate from MiraConfig.
     */
    public getFullAccountProps(name: string): Account {
        return MiraConfig.getFullAccountProps(name)
    }

    /**
     * Gets the name for this resource.
     */
    getResourceName() {
        return `${this.calculateSharedResourceName(this.resourceType)}-${this.name}`
    }

    /**
     * @todo Consider stuffing all naming related functions in this class, i.e.
     * migrate from MiraConfig.
     */
    public getTargetName(name?: string): string {
        return MiraConfig.getTargetName(name)
    }

    /**
     * Asynchronous initilaization of a Mira resource.
     */
    public async initialize() {
        // NOOP.
    }

    /**
     * Asynchronous post-initilaization of a Mira resource.
     */
    public async postInitialize() {
        // NOOP.
    }

    /**
     * Asynchronous pre-initilaization of a Mira resource.
     */
    public async preInitialize() {
        // NOOP.
    }
}