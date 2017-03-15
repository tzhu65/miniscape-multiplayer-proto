/// <reference path="../../../typings/index.d.ts" />

import * as fs from "fs-extra";
import * as args from "minimist";
import * as Q from "q";
let argv = args(process.argv.slice(2));
// socket cluster has no typescript typings, so this will do for now
let SocketCluster:any = require("socketcluster").SocketCluster;
let scHotReboot:any = require("sc-hot-reboot");

let workerControllerPath = argv.wc || process.env.SOCKETCLUSTER_WORKER_CONTROLLER;
let brokerControllerPath = argv.bc || process.env.SOCKETCLUSTER_BROKER_CONTROLLER;
let initControllerPath = argv.ic || process.env.SOCKETCLUSTER;
let environment = process.env.ENV || "dev";

let options:any = {
  workers: Number(argv.w) || Number(process.env.SOCKETCLUSTER_WORKERS) || 1,
  brokers: Number(argv.b) || Number(process.env.SOCKETCLUSTER_BROKERS) || 1,
  port: Number(argv.p) || Number(process.env.SOCKETCLUSTER_PORT) || Number(process.env.PORT) || 8000,
  // If your system doesn't support 'uws', you can switch to 'ws' (which is slower but works on older systems).
  wsEngine: process.env.SOCKETCLUSTER_WS_ENGINE || "uws",
  appName: argv.n || process.env.SOCKETCLUSTER_APP_NAME || null,
  workerController: workerControllerPath || __dirname + '/worker.js',
  brokerController: brokerControllerPath || __dirname + '/broker.js',
  initController: initControllerPath || null,
  clusterStateServerHost: argv.cssh || process.env.SCC_STATE_SERVER_HOST || null,
  clusterStateServerPort: process.env.SCC_STATE_SERVER_PORT || null,
  clusterAuthKey: process.env.SCC_AUTH_KEY || null,
  clusterStateServerConnectTimeout: Number(process.env.SCC_STATE_SERVER_CONNECT_TIMEOUT) || null,
  clusterStateServerAckTimeout: Number(process.env.SCC_STATE_SERVER_ACK_TIMEOUT) || null,
  clusterStateServerReconnectRandomness: Number(process.env.SCC_STATE_SERVER_RECONNECT_RANDOMNESS) || null,
  crashWorkerOnError: argv['auto-reboot'] != false,
  // If using nodemon, set this to true, and make sure that environment is 'dev'.
  killMasterOnSignal: false,
  instanceId: 'realm-1',
  pubSubBatchDuration: 5,   // originally set to null
  environment: environment
};

let SOCKETCLUSTER_OPTIONS;

if (process.env.SOCKETCLUSTER_OPTIONS) {
  SOCKETCLUSTER_OPTIONS = JSON.parse(process.env.SOCKETCLUSTER_OPTIONS);
}

for (let i in SOCKETCLUSTER_OPTIONS) {
  if (SOCKETCLUSTER_OPTIONS.hasOwnProperty(i)) {
    options[i] = SOCKETCLUSTER_OPTIONS[i];
  }
}

let masterControllerPath = argv.mc || process.env.SOCKETCLUSTER_MASTER_CONTROLLER;

let start = function() {
  let socketCluster = new SocketCluster(options);

  if (masterControllerPath) {
    var masterController = require(masterControllerPath);
    masterController.run(socketCluster);
  }

  if (environment == 'dev') {
    // This will cause SC workers to reboot when code changes anywhere in the app directory.
    // The second options argument here is passed directly to chokidar.
    // See https://github.com/paulmillr/chokidar#api for details.
    console.log(`   !! The sc-hot-reboot plugin is watching for code changes in the ${__dirname} directory`);
    scHotReboot.attach(socketCluster, {
      cwd: __dirname,
      ignored: ['public', 'node_modules', 'README.md', 'Dockerfile', 'server.js', 'broker.js', /[\/\\]\./]
    });
  }
};

let bootCheckInterval = Number(process.env.SOCKETCLUSTER_BOOT_CHECK_INTERVAL) || 200;

if (workerControllerPath) {
  // Detect when Docker volumes are ready.
  var startWhenFileIsReady = (filePath:string) => {
    return Q.Promise((resolve:any) => {
      if (!filePath) {
        resolve();
        return;
      }
      var checkIsReady = () => {
        fs.exists(filePath, (exists) => {
          if (exists) {
            resolve();
          } else {
            setTimeout(checkIsReady, bootCheckInterval);
          }
        });
      };
      checkIsReady();
    });
  };
  var filesReadyPromises = [
    startWhenFileIsReady(masterControllerPath),
    startWhenFileIsReady(workerControllerPath),
    startWhenFileIsReady(brokerControllerPath),
    startWhenFileIsReady(initControllerPath)
  ];
  Q.all(filesReadyPromises).then(() => {
    start();
  });
} else {
  start();
}
