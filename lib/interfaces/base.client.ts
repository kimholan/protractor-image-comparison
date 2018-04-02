import getScreenDimensions from "../scripts/getScreenDimensions";

export abstract class BaseImageComparisonClient {
    constructor(options:any){
        console.log('options = ', options);
    }

    abstract async executeClientScript<T>(script: Function | string, ...scriptArgs: any[] ): Promise<T>;

    async saveScreen(): Promise<any> {
        // Do all the magic here
        return this.executeClientScript(getScreenDimensions)
    }
}