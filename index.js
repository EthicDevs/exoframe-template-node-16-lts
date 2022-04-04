// npm packages
const fs = require("fs");
const path = require("path");

const yarnOrNpm = ({ hasYarn, hasLock }) => {
  let installString = "COPY package.json /usr/src/app/";

  if (hasYarn) {
    installString += `\nCOPY yarn.lock /usr/src/app/\nRUN yarn --silent`;
  } else if (hasLock) {
    installString += `\nCOPY package-lock.json /usr/src/app/\nRUN npm ci --silent`;
  } else {
    installString += `\nRUN npm install --silent`;
  }

  return installString;
};

const nodeDockerfile = ({ hasYarn, hasLock }) =>
  `FROM node:lts-alpine

# create folder and set it as workdir
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# copy package and yarn files to cache deps install
${yarnOrNpm({ hasYarn, hasLock })}

# copy app itself
COPY . /usr/src/app

# run build if needed
RUN npm run build --if-present

EXPOSE 80

CMD ["npm", "start"]
`;

// template name
exports.name = "node";

// function to check if the template fits this recipe
exports.checkTemplate = async ({ tempDockerDir, folder }) => {
  // if project already has dockerfile - just exit
  try {
    const filesList = fs.readdirSync(path.join(tempDockerDir, folder));
    if (filesList.includes("package.json")) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
};

// function to execute current template
exports.executeTemplate = async ({
  username,
  tempDockerDir,
  folder,
  resultStream,
  util,
  docker,
  existing,
}) => {
  try {
    // generate dockerfile
    const filesList = fs.readdirSync(path.join(tempDockerDir, folder));
    const dockerfile = nodeDockerfile({
      hasYarn: filesList.includes("yarn.lock"),
      hasLock: filesList.includes("package-lock.json"),
    });
    const dfPath = path.join(tempDockerDir, folder, "Dockerfile");
    fs.writeFileSync(dfPath, dockerfile, "utf-8");
    util.writeStatus(resultStream, {
      message: "Deploying Node.js project..",
      level: "info",
    });

    // build docker image
    const buildRes = await docker.build({ username, folder, resultStream });
    util.logger.debug("Build result:", buildRes);

    // start image
    const container = await docker.start(
      Object.assign({}, buildRes, { username, folder, existing, resultStream })
    );
    util.logger.debug(container.Name);

    // return new deployments
    util.writeStatus(resultStream, {
      message: "Deployment success!",
      deployments: [container],
      level: "info",
    });
    resultStream.end("");
  } catch (e) {
    util.logger.debug("build failed!", e);
    util.writeStatus(resultStream, {
      message: e.error,
      error: e.error,
      log: e.log,
      level: "error",
    });
    resultStream.end("");
  }
};
