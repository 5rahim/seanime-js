import chalk from "chalk"
import path from "path"
import fs from "fs"

export const ASCII = `
   _____                  _                
  / ____|                (_)               
 | (___   ___  __ _ _ __  _ _ __ ___   ___ 
  \\___ \\ / _ \\/ _\` | '_ \\| | '_ \` _ \\ / _ \\
  ____) |  __/ (_| | | | | | | | | | |  __/
 |_____/ \\___|\\__,_|_| |_|_|_| |_| |_|\\___|
                                           
                                           `
export const __cli_baseDir = path.resolve(__dirname, "..")

export function cliBoilerplate() {

    console.log(chalk.dim(ASCII))

    const packageJsonPath = path.join(__cli_baseDir, "package.json")

    if (!fs.existsSync(packageJsonPath)) {
        console.log(chalk.redBright("Error: `package.json` not found."))
        process.exit(0)
    }

    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8")
    const packageJson = JSON.parse(packageJsonContent) as { [key: string]: string }


    console.log(chalk.blueBright(`     Seanime ${packageJson.version}`))
    console.log(`     - Seanime is currently in ${chalk.bold(chalk.redBright("alpha"))}, features may not work as intended.`)
    console.log("")
}
