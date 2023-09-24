import merge from "lodash/merge"
import { MpcCommands, MpcCommandsList } from "./mpcCommands"
import { AbstractPlayerController, IPlayerVariables } from "./commands"
import { variableParser } from "./variableParser"
import axios from "axios"

export class MpcApi extends AbstractPlayerController {
    constructor(host: string, port: number) {
        super()
        this._host = host
        this._port = port
    }

    private _host: string

    set host(value: string) {
        this._host = value
    }

    private _port: number

    set port(value: number) {
        this._port = value
    }

    get apiHost(): string {
        return "http://" + this._host + ":" + this._port
    }

    /**
     * @commandId - any supported command from commands/mpcCommands.ts
     * @data - additional data provided in to api call
     */
    execute(commandId: MpcCommands, data?: { [key: string]: any }): Promise<any> {
        const url = this.apiHost + "/command.html"
        try {
            return axios.get(url, {
                params: merge({
                    wm_command: MpcCommandsList[commandId].value,
                }, data),
            })
        } catch (e) {
            return new Promise((resolve) => resolve(""))
        }
    }

    /**
     * @filePath - path to video file
     */
    openFile(filePath: string): Promise<any> {
        const url = this.apiHost + "/browser.html?path=" + filePath
        try {
            return axios.get(url)
        } catch (e) {
            return new Promise((resolve) => resolve(""))
        }
    }

    getVariables(): Promise<IPlayerVariables> {
        const url = this.apiHost + "/variables.html"
        return axios.get(url).then((res) => {
            return variableParser(res.data)
        })
    }
}
