import path from "path";
import fs from "fs-extra";
import childProcess from "child_process";
import { Command } from "commander";
import chalk from "chalk";
import simpleGit, { SimpleGit } from "simple-git";
import inquirer from "inquirer";
import packageJson from "../package.json";
import Listr from "listr";

let projectName: string = "";
let template: string = "";

const program = new Command(packageJson.name)
  .version(packageJson.version)
  .description(chalk.bold.blue(packageJson.description))
  .usage(chalk.green("[project-name]"))
  .arguments("[project-name]")
  .option("-t,--typescript", "use typescript template")
  .option("-j,--javascript", "use javascript template")
  .action((name, options) => {
    projectName = name;
    template = options.javascript
      ? "javascript"
      : options.typescript
      ? "typescript"
      : "";
  })
  .parse(process.argv);

inquirer
  .prompt([
    {
      name: "projectName",
      message: "What is the name of your project?",
      when() {
        return projectName ? false : true;
      },
    },
    {
      type: "list",
      name: "template",
      message: "Select a template to use",
      choices: ["Javascript", "Typescript"],
      when() {
        return template ? false : true;
      },
    },
  ])
  .then(async (answers) => {
    if (answers.projectName) projectName = answers.projectName;
    if (answers.template) template = answers.template.toLowerCase();
    const projectDestination = path.join(process.cwd(), projectName);

    function hasYarn() {
      try {
        childProcess.execSync("yarn --version", { stdio: "ignore" });
        return true;
      } catch (e) {
        return false;
      }
    }

    const packageManager: string = hasYarn() ? "yarn" : "npm";

    const tasks = new Listr([
      {
        title: `Install packages with ${template} template`,
        task: async () => {
          await fs.copy(
            path.join(__dirname, "../templates", template),
            projectName
          );
          const json = fs.readFileSync(`${projectDestination}/package.json`, {
            encoding: "utf8",
          });
          const jsonObject = JSON.parse(json);
          jsonObject["name"] = projectName;
          fs.writeFileSync(
            `${projectDestination}/package.json`,
            JSON.stringify(jsonObject, null, 4)
          );
        },
      },
    ]);
    await tasks.run();
    console.log(packageManager, projectName, template, projectDestination);
  });
