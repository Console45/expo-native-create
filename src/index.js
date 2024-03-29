#!/usr/bin/env node
const path = require("path");
const fs = require("fs-extra");
const childProcess = require("child_process");
const { Command } = require("commander");
const chalk = require("chalk");
const simpleGit = require("simple-git");
const inquirer = require("inquirer");
const packageJson = require("../package.json");
const Listr = require("listr");

let projectName;
let template;

new Command(packageJson.name)
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

    function hasPackage(packageName) {
      try {
        childProcess.execSync(`${packageName} --version`, { stdio: "ignore" });
        return true;
      } catch (e) {
        return false;
      }
    }

    const packageManager = hasPackage("yarn") ? "yarn" : "npm";

    const tasks = new Listr([
      {
        title: `Install packages with ${template} template`,
        task: async () => {
          await fs.copy(
            path.join(__dirname, "../templates", template),
            projectName
          );
          fs.writeFileSync(`${projectName}/.gitignore`, "node_modules/");
        },
      },
      {
        title: "Install dependencies",
        task: () => {
          process.chdir(projectDestination);
          childProcess.execSync(`${packageManager} install`);
        },
      },
      {
        title: "Install updated version of expo-cli",
        task: () => {
          packageManager === "yarn"
            ? childProcess.execSync(`yarn global add expo-cli@latest`)
            : childProcess.execSync(`npm install expo-cli@latest -g`);
        },
      },
      {
        title: "Initialize git in directory",
        task: async () => {
          const git = simpleGit({
            baseDir: projectDestination,
            binary: "git",
          });
          await git.init();
          await git.add(".");
          await git.commit("Initialized project using expo-native-create");
        },
      },
    ]);
    await tasks.run();
    const printScript = (script) => {
      return chalk.cyan`${packageManager} ${script}`;
    };
    console.log(
      chalk.green(`\nSuccess! Created ${projectName} at ${projectDestination}`)
    );
    console.log("Inside that directory, you can run several commands:");
    console.log();
    console.log(` ${printScript("start")}`);
    console.log(`   Starts the expo server`);
    console.log();
    console.log(` ${printScript("ios")}`);
    console.log(`   Runs your app in the ios emulator`);
    console.log();
    console.log(` ${printScript("android")}`);
    console.log(`   Runs your app in the android emulator`);
    console.log();
    console.log(` ${printScript("web")}`);
    console.log(`   Runs your app in the browser`);
    console.log();
    console.log(` ${printScript("eject")}`);
    console.log(`   Switch from expo to barebones react-native`);
    console.log();
    console.log("Happy hacking!");
    process.exit(0);
  });
