#!/usr/bin/env node

import * as p from "@clack/prompts";
import fs from "fs";
import path from "path";
import yargs from "yargs";

import { dirname } from "path";
import { fileURLToPath } from "url";

// Get the file path of the current module
const __filename = fileURLToPath(import.meta.url);

// Get the directory name of the current module
const __dirname = dirname(__filename);

const argv = yargs(process.argv.slice(2))
  .version("0.1.0")
  .scriptName("create-bled-app")
  .usage("Usage: $0 <project> [options]")
  .positional("project", {
    describe: "The name of the project",
    type: "string",
  })
  .boolean("turso")
  .describe("turso", `${"Turso".padEnd(15)}${"(SQLite)".padStart(15)}`)
  .boolean("cloud")
  .describe("cloud", `${"Cloudflare D1".padEnd(15)}${"(SQLite)".padStart(15)}`)
  .boolean("neon")
  .describe("neon", `${"Neon".padEnd(15)}${"(PostgreSQL)".padStart(15)}`)
  .boolean("planet")
  .describe("planet", `${"PlanetScale".padEnd(15)}${"(MySQL)".padStart(15)}`)
  .alias("p", "plain")
  .boolean("p")
  .describe("p", "Clone a template without login and signup")
  .alias("c", "creds")
  .boolean("c")
  .describe("c", "Clone a template with username login and signup")
  .alias("s", "social")
  .boolean("s")
  .describe("s", "Clone a template with social authentication")
  .alias("e", "email")
  .boolean("e")
  .describe("e", "Clone a template with email authentication flow")
  .help("h")
  .alias("h", "help")
  .parse();

p.intro("Welcome to the BLED stack🩸!");
p.log.info(
  "BLED is a high performant backend framework that is built on top of:"
);
p.log.info(
  `  ${"Bun:".padEnd(
    14
  )} a fast JavaScript all-in-one toolkit\n  ${"Lucia:".padEnd(
    14
  )} a highly customizable open-source authentication flow\n  ${"Elysia:".padEnd(
    14
  )} an performant, ergonomic web framework for building backend servers for Bun\n  ${"Drizzle:".padEnd(
    14
  )} an open-source TypeScript ORM that is lightweight and production ready`
);

let project = argv._[0];

const databases = {
  turso: argv.turso,
  cloud: argv.cloud,
  neon: argv.neon,
  planet: argv.planet,
};

const auths = {
  plain: argv.plain,
  creds: argv.creds,
  social: argv.social,
  email: argv.email,
};

if (Object.values(databases).filter((v) => v === true).length > 1) {
  p.log.error("You can only choose one database.");
  process.exit(1);
}

if (Object.values(auths).filter((v) => v === true).length > 1) {
  p.log.error("You can only choose one authentication flow.");
  process.exit(1);
}

if (!project) {
  project = await p.text({ message: "Please specify a project name:" });
  if (p.isCancel(project)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }
}

// check if target path is valid
if (await fs.existsSync(project)) {
  p.log.error(`Project ${project} already exists`);
  process.exit(1);
} else {
  p.log.success(`Project name: ${project}`);
}

let database = Object.keys(databases).find((key) => databases[key] === true);

if (!database) {
  database = await p.select({
    message: "Choose your favorite database:",
    options: [
      { value: "turso", label: "Turso", hint: "SQLite" },
      { value: "cloud", label: "Cloudflare D1", hint: "SQLite" },
      { value: "neon", label: "Neon", hint: "PostgreSQL" },
      { value: "planet", label: "PlanetScale", hint: "MySQL" },
    ],
  });
  if (p.isCancel(database)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }
} else {
  p.log.success(
    `Database: ${database.charAt(0).toUpperCase() + database.slice(1)}`
  );
}

let auth = Object.keys(auths).find((key) => auths[key] === true);

if (!auth) {
  auth = await p.select({
    message: "Choose a template:",
    options: [
      {
        value: "plain",
        label: "plain",
        hint: "basic lucia configuration",
      },
      {
        value: "creds",
        label: "credentials authentication",
        hint: "username, password",
      },
      {
        value: "social",
        label: "social authentication",
        hint: "an example of github social login",
      },
      {
        value: "email",
        label: "email authentication",
        hint: "with verification and password reset flow",
      },
    ],
  });
  if (p.isCancel(auth)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }
}

const s = p.spinner();
s.start("Preparing to be BLED🩸...");

const templatesDir = path.join(__dirname, "templates");
const projectDir = path.join(process.cwd(), project);
const templateDir = path.join(templatesDir, `bled-${database}-${auth}`);

if (!fs.existsSync(templateDir)) {
  p.log.error("Template not implemented yet.");
  process.exit(1);
}

fs.cpSync(templateDir, projectDir, { overwrite: false, recursive: true });

// read the package.json file and replace the name field
const packageJsonPath = path.join(projectDir, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
packageJson.name = project;
packageJson.version = "0.0.1";
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

s.stop("Ready to be BLED🩸");

p.outro(`You are all set!`);
