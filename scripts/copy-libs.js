#!/usr/bin/env node

const path = require('path');
const supported = require('../supported.json');
const fs = require('fs');

function getPkgMeta(pkgName) {
  const packageJSON = require(`../node_modules/${pkgName}/package.json`);
  const { version, browser, main } = packageJSON;

  if (!browser && !main) {
    throw new Error(`Could not locate entry point for lib name: ${pkgName}`)
  }

  let modulePath = path.resolve(__dirname, `../node_modules/${pkgName}/`, main || browser);
  if (!modulePath.includes(".js")) {
    modulePath = modulePath + ".js";
  }

  return {
    version,
    main: modulePath
  }
}


function main() {
  const packages = Object.keys(supported);
  const result = {};
  const supportedUpdated = {...supported};

  packages.forEach(name => {
    const pkg = getPkgMeta(name);

    if (!supported[name].hasOwnProperty(pkg.version)) {
      result[name] = pkg;
    } else if (!fs.existsSync(`lib/${name}/${pkg.version}`)) {
      result[name] = pkg;
    }
  });

  if (Object.keys(result).length > 0) {
    console.log("\n\nFollowing will be added to lib: ");
    console.table(result);

    Object.entries(result).forEach(([name, pkg]) => {
      const path = `lib/${name}/${pkg.version}`;
      fs.mkdirSync(path, { recursive: true });

      fs.copyFileSync(pkg.main, `${path}/index.js`);

      supportedUpdated[name][pkg.version] = {};
    });

    fs.writeFileSync("./supported.json", JSON.stringify(supportedUpdated, null, 2));
  }
}


main();
