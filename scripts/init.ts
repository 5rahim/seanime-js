import chalk from "chalk"
import * as fsp from "fs/promises"
import * as fs from "fs"
import path from "path"
import ora from "ora"
import { execa } from "execa"
import { __cli_baseDir, cliBoilerplate } from "./boilerplate"

async function main() {

    // Checking `standalone` directory
    const standaloneDir = path.join(__cli_baseDir, ".next/standalone")
    const nmoduleDir = path.join(__cli_baseDir, "node_modules")

    // Don't exist yet
    const standaloneStaticDir = path.join(__cli_baseDir, ".next/standalone/.next/static")
    const standalonePublicDir = path.join(__cli_baseDir, ".next/standalone/public")

    cliBoilerplate()

    if (!fs.existsSync(nmoduleDir)) {
        const spinner = ora(`Installing dependencies...`).start()
        await execa("npm", ["install"])
        spinner.succeed()
    }

    // if (fs.existsSync(standaloneDir)) {
    //     const spinner = ora(`Removing the directory`).start()
    //     fs.rmSync(standaloneDir, { recursive: true })
    //     spinner.succeed()
    // }

    const spinner = ora(`Building the app...`).start()
    await execa("npm", ["run", "build"])
    spinner.succeed()


    const spinner2 = ora(`Copying static files...`).start()
    const staticDir = path.join(__cli_baseDir, ".next/static")
    try {
        await fsp.cp(staticDir, standaloneStaticDir, { recursive: true })
        spinner2.succeed()
    } catch (e) {
        console.log(chalk.redBright("✖ Error: Could not copy static files."))
        spinner2.fail()
        process.exit(0)
    }


    const spinner3 = ora(`Copying public files...`).start()
    const publicDir = path.join(__cli_baseDir, "public")
    try {
        await fsp.cp(publicDir, standalonePublicDir, { recursive: true })
        spinner3.succeed()
    } catch (e) {
        console.log(chalk.redBright("✖ Error: Could not copy public files."))
        spinner3.fail()
        process.exit(0)
    }

    // TODO: Env file

    const serverFilePath = path.join(__cli_baseDir, ".next/standalone/server.js")
    const spinner4 = ora(`Updating generated server file...`).start()
    try {
        let data = await fsp.readFile(serverFilePath, "utf8")

        data = data.replace(" || '0.0.0.0'", " || '127.0.0.1'")

        data = data.replace(" || 3000", " || 43200")

        await fsp.writeFile(serverFilePath, data, "utf8")
        spinner4.succeed()
    } catch (err) {
        spinner4.fail()
        console.log(chalk.redBright("✖ Error: Could not update server file."))
        process.exit(0)
    }

    console.log(chalk.greenBright("✔ Success: Seanime is ready."))
    console.log(`     - Run ${chalk.bold("npm run start")} to start the server.`)

    process.exit(0)

}

main()
