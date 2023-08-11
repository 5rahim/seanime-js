import * as _ from "lodash"
// import axios from "axios";
import { MpcCommands, MpcCommandsList } from "./commands/mpcCommands"
import { Dictionary } from "./types"
import { AbstractPlayerController, IPlayerVariables } from "./commands/commands"
import { variableParser } from "./variableParser"

export class MpcControl extends AbstractPlayerController {
    private host: string
    private port: number

    constructor(host: string, port: number) {
        super()
        this.host = host
        this.port = port
    }

    get apiHost(): string {
        return "http://" + this.host + ":" + this.port
    }

    /**
     * @commandId - any supported command from commands/mpcCommands.ts
     * @data - additional data provided in to api call
     */
    execute(commandId: MpcCommands, data?: Dictionary<any>): Promise<any> {
        const url = new URL(this.apiHost + "/command.html")
        url.searchParams.set("wm_command", JSON.stringify(_.merge({
            wm_command: MpcCommandsList[commandId].value,
        }, data)))
        return fetch(url)
    }

    /**
     * @filePath - path to video file
     */
    openFile(filePath: string): Promise<any> {
        const url = this.apiHost + "/browser.html?path=" + filePath
        return fetch(url)
    }

    getVariables(): Promise<IPlayerVariables> {
        const url = this.apiHost + "/variables.html"
        return fetch(url).then((res) => {
            return variableParser(JSON.stringify(res.body))
        })
    }
}
