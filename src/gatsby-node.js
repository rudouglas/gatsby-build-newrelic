"use strict";

require('newrelic');
const pluginOptions = require(`../../gatsby-config`)

const fs = require(`fs`);
// fs.appendFileSync('cute2.txt', JSON.stringify() + `\n`)
const {
  cpuCoreCount
} = require("gatsby-core-utils");

var ci = require('ci-info');

const coreCount = cpuCoreCount();

const constants = require('./constants');
let THEME_OPTIONS = pluginOptions.plugins.filter(plugin => plugin.resolve === 'gatsby-plugin-newrelic-test')[0].options;
THEME_OPTIONS.buildId = constants.buildId;
// # sourceMappingURL=zipkin-local.js.map
const newrelicFormatter = require('@newrelic/winston-enricher');

const NewrelicWinston = require('newrelic-agent-winston');

const NewrelicLogs = require('winston-to-newrelic-logs');

const winston = require('winston');

const winstonLogger = winston.createLogger({
  transports: [new NewrelicLogs({
    licenseKey: THEME_OPTIONS.NR_LICENSE,
    apiUrl: 'https://staging-log-api.newrelic.com',
    pluginOptions: THEME_OPTIONS,
  }), new NewrelicWinston()],
  format: winston.format.combine(winston.format.label({
    serviceName: 'GatsbyWinston'
  }), newrelicFormatter())
});
let logsStarted = false;
let DELETED_PAGES,
    CHANGED_PAGES,
    CLEARING_CACHE = false; // Logging Functionality

if (THEME_OPTIONS.logs.collectLogs) {
  !logsStarted && console.log(`[@] gatsby-plugin-newrelic: Streaming logs`);
  logsStarted = true;
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const brailleRegex = /⠋|⠙|⠹|⠸|⠼|⠴|⠦|⠧|⠇|⠏|\n/g;
  const regex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
  const deletedPagesRegex = /Deleted (.*?) pages/g;
  const changedPagesRegex = /Found (.*?) changed pages/g;
  const clearingCache = `we're deleting your site's cache`;
  const ALREADY_LOGGED = {
    'source and transform nodes': false,
    'building schema': false,
    'createPages': false,
    'createPagesStatefully': false,
    'extract queries from components': false,
    'write out redirect data': false,
    'onPostBootstrap': false,
    'Building production JavaScript and CSS bundles': false,
    'JavaScript and CSS webpack compilation Building HTML renderer': false,
    'JavaScript and CSS webpack compilation': false,
    'Building HTML renderer': false,
    'warn GATSBY_NEWRELIC_ENV env variable is not set': false,
    'onPostBuild': false,
    'initialize cache': false
  };

  process.stdout.write = (chunk, encoding, callback) => {
    let copyChunk = chunk;

    if (typeof copyChunk === 'string') {
      try {
        copyChunk = copyChunk.replace(regex, "").replace(brailleRegex, '').trimStart();

        if (Object.keys(ALREADY_LOGGED).includes(copyChunk)) {
          if (ALREADY_LOGGED[copyChunk]) {
            return originalStdoutWrite(chunk, encoding, callback);
          } else {
            ALREADY_LOGGED[copyChunk] = true;
          }
        }

        let deletedPages = deletedPagesRegex.exec(copyChunk);
        let changedPages = changedPagesRegex.exec(copyChunk);

        if (deletedPages) {
          DELETED_PAGES = deletedPages[1];
        }

        if (changedPages) {
          CHANGED_PAGES = changedPages[1];
        }

        if (copyChunk.includes(clearingCache)) {
          CLEARING_CACHE = true;
        }

        if (copyChunk !== '') {
          winstonLogger.log({
            level: 'info',
            message: copyChunk,
          });
        }
      } catch (e) {
        winstonLogger.log({
          level: 'error',
          message: e.message,
        });
      }
    }

    return originalStdoutWrite(chunk, encoding, callback);
  };

  console.error = function (d) {
    winstonLogger.log({
      level: 'error',
      message: d,
    });
  };

  console.warn = function (d) {
    //
    winstonLogger.log({
      level: 'warn',
      message: d,
    });
  };
}

var _process$env$BENCHMAR;

const {
  performance
} = require(`perf_hooks`);

const {
  sync: glob
} = require(`fast-glob`);

const nodeFetch = require(`node-fetch`);

const {
  execSync
} = require(`child_process`);

const bootstrapTime = performance.now();
const CI_NAME = ci.name || 'local';
const BENCHMARK_REPORTING_URL = "https://staging-metric-api.newrelic.com/metric/v1";
let lastApi; // Current benchmark state, if any. If none then create one on next lifecycle.

let benchMeta;
let nextBuildType = (_process$env$BENCHMAR = process.env.BENCHMARK_BUILD_TYPE) !== null && _process$env$BENCHMAR !== void 0 ? _process$env$BENCHMAR : `initial`;

function reportInfo(...args) {
  ;
  (lastApi ? lastApi.reporter : console).info(...args);
}

function reportError(...args) {
  ;
  (lastApi ? lastApi.reporter : console).error(...args);
}

function execToStr(cmd) {
  var _execSync;

  return String((_execSync = execSync(cmd, {
    encoding: `utf8`
  })) !== null && _execSync !== void 0 ? _execSync : ``).trim();
}

function execToInt(cmd) {
  // `parseInt` can return `NaN` for unexpected args
  // `Number` can return undefined for unexpected args
  // `0 | x` (bitwise or) will always return 0 for unexpected args, or 32bit int
  return execToStr(cmd) | 0;
}

class BenchMeta {
  constructor() {
    this.flushing = undefined; // Promise of flushing if that has started

    this.flushed = false; // Completed flushing?

    this.localTime = new Date().toISOString();
    this.timestamps = {
      // TODO: we should also have access to node's timing data and see how long it took before bootstrapping this script
      bootstrapTime,
      // Start of this file
      instantiationTime: performance.now(),
      // Instantiation time of this class
      benchmarkStart: 0,
      // Start of benchmark itself
      preInit: 0,
      // Gatsby onPreInit life cycle
      preBootstrap: 0,
      // Gatsby onPreBootstrap life cycle
      preBuild: 0,
      // Gatsby onPreBuild life cycle
      postBuild: 0,
      // Gatsby onPostBuild life cycle
      benchmarkEnd: 0 // End of benchmark itself

    };
    this.started = false;
  }

  getMetadata() {
    var _process$env$BENCHMAR2;

    let siteId = ``;

    try {
      var _JSON$parse$siteId, _JSON$parse, _process$env$GATSBY_T, _process$env; // The tags ought to be a json string, but we try/catch it just in case it's not, or not a valid json string


      siteId = (_JSON$parse$siteId = (_JSON$parse = JSON.parse((_process$env$GATSBY_T = (_process$env = process.env) === null || _process$env === void 0 ? void 0 : _process$env.GATSBY_TELEMETRY_TAGS) !== null && _process$env$GATSBY_T !== void 0 ? _process$env$GATSBY_T : `{}`)) === null || _JSON$parse === void 0 ? void 0 : _JSON$parse.siteId) !== null && _JSON$parse$siteId !== void 0 ? _JSON$parse$siteId : ``; // Set by server
    } catch (e) {
      siteId = `error`;
      reportInfo(`gatsby-plugin-newrelic: Suppressed an error trying to JSON.parse(GATSBY_TELEMETRY_TAGS): ${e}`);
    }
    /**
     * If we are running in netlify, environment variables can be attached using the INCOMING_HOOK_BODY
     * extract the configuration from there
     */


    let buildType = nextBuildType;
    nextBuildType = (_process$env$BENCHMAR2 = process.env.BENCHMARK_BUILD_TYPE_NEXT) !== null && _process$env$BENCHMAR2 !== void 0 ? _process$env$BENCHMAR2 : `DATA_UPDATE`;
    const incomingHookBodyEnv = process.env.INCOMING_HOOK_BODY;

    if (CI_NAME === `netlify` && incomingHookBodyEnv) {
      try {
        const incomingHookBody = JSON.parse(incomingHookBodyEnv);
        buildType = incomingHookBody && incomingHookBody.buildType;
      } catch (e) {
        reportInfo(`gatsby-plugin-newrelic: Suppressed an error trying to JSON.parse(INCOMING_HOOK_BODY): ${e}`);
      }
    }

    return {
      buildId: THEME_OPTIONS.buildId,
      branch: process.env.BENCHMARK_BRANCH,
      siteId,
      contentSource: process.env.BENCHMARK_CONTENT_SOURCE,
      siteType: process.env.BENCHMARK_SITE_TYPE,
      repoName: process.env.BENCHMARK_REPO_NAME,
      buildType,
    };
  }

  getData() {
    var _process$cwd; // Get memory usage snapshot first (just in case)


    const {
      rss,
      heapTotal,
      heapUsed,
      external
    } = process.memoryUsage();

    for (const key in this.timestamps) {
      this.timestamps[key] = Math.floor(this.timestamps[key]);
    } // For the time being, our target benchmarks are part of the main repo
    // And we will want to know what version of the repo we're testing with
    // This won't work as intended when running a site not in our repo (!)


    let ciAttributes;
    console.log(`[!] If you see issues with any attributes reporting incorrectly, please open an issue in GitHub`);
    console.log(`[!] CI: ${CI_NAME}`);

    try {
      if (process.env.NETLIFY) {
        ciAttributes = {
          gitRepoUrl: process.env.REPOSITORY_URL,
          gitBranch: process.env.BRANCH,
          gitHead: process.env.HEAD,
          gitCommit: process.env.COMMIT_REF,
          gitCachedCommit: process.env.CACHED_COMMIT_REF,
          gitPullRequest: process.env.PULL_REQUEST,
          gitReviewId: process.env.REVIEW_ID,
          buildId: process.env.BUILD_ID,
          context: process.env.CONTEXT,
          systemArchitecture: process.env._system_arch,
          systemVersion: process.env._system_version,
          url: process.env.URL,
          deployUrl: process.env.DEPLOY_URL,
          deployPrimeUrl: process.env.DEPLOY_PRIME_URL,
          deployId: process.env.DEPLOY_ID,
          ciSiteName: process.env.SITE_NAME,
          ciSiteId: process.env.SITE_ID,
          netlifyImagesCdnDomain: process.env.NETLIFY_IMAGES_CDN_DOMAIN
        };
      } else if (process.env.VERCEL) {
        ciAttributes = {
          gitRepoUrl: process.env.GATSBY_VERCEL_GIT_REPO_SLUG,
          gitBranch: process.env.GATSBY_VERCEL_GIT_COMMIT_REF,
          gitCommit: process.env.GATSBY_VERCEL_GIT_COMMIT_SHA,
          context: process.env.GATSBY_VERCEL_ENV,
          deployUrl: process.env.GATSBY_VERCEL_URL,
          deployRegion: process.env.GATSBY_VERCEL_REGION
        };
      } else if (process.env.GATSBY_CLOUD) {
        ciAttributes = {
          gitRepoUrl: execToStr(`git config --get remote.origin.url`),
          gitBranch: process.env.BRANCH,
          gatsbyIsPreview: process.env.GATSBY_IS_PREVIEW,
          gitCommit: execToStr(`git log --format="%H" -n 1`)
        };
      } else {
        ciAttributes = {
          gitRepoUrl: execToStr(`git config --get remote.origin.url`),
          gitCommit: execToStr(`git log --format="%H" -n 1`),
          gitBranch: execToStr(`git branch --show-current`)
        };
      }
    } catch (error) {}

    const gitHash = execToStr(`git rev-parse HEAD`); // Git only supports UTC tz through env var, but the unix time stamp is UTC

    const gitRepoName = execToStr('basename `git rev-parse --show-toplevel`');
    const unixStamp = execToStr(`git show --quiet --date=unix --format="%cd"`);
    const gitCommitTimestamp = new Date(parseInt(unixStamp, 10) * 1000).toISOString();
    const nodeEnv = process.env.NODE_ENV || 'n/a';
    const nodejsVersion = process.version; // This assumes the benchmark is started explicitly from `node_modules/.bin/gatsby`, and not a global install
    // (This is what `gatsby --version` does too, ultimately)

    const gatsbyCliVersion = execToStr(`node_modules/.bin/gatsby --version`);

    const gatsbyVersion = require(`gatsby/package.json`).version;

    const sharpVersion = fs.existsSync(`node_modules/sharp/package.json`) ? require(`sharp/package.json`).version : `none`;

    const webpackVersion = require(`webpack/package.json`).version;
    fs.appendFileSync('cute4.txt', THEME_OPTIONS.buildId)
    const publicJsSize = glob(`public/*.js`).reduce((t, file) => t + fs.statSync(file).size, 0);
    const jpgCount = execToInt(`find public .cache  -type f -iname "*.jpg" -or -iname "*.jpeg" | wc -l`);
    const pngCount = execToInt(`find public .cache  -type f -iname "*.png" | wc -l`);
    const gifCount = execToInt(`find public .cache  -type f -iname "*.gif" | wc -l`);
    const otherCount = execToInt(`find public .cache  -type f -iname "*.bmp" -or -iname "*.tif" -or -iname "*.webp" -or -iname "*.svg" | wc -l`);
    const benchmarkMetadata = this.getMetadata();
    const attributes = { 
      ...ciAttributes,
      gatsbySite: THEME_OPTIONS.SITE_NAME,
      gitHash,
      gitCommitTimestamp,
      gitRepoName,
      ciName: CI_NAME,
      nodeEnv,
      newRelicSiteName: THEME_OPTIONS.SITE_NAME,
      nodejs: nodejsVersion,
      gatsby: gatsbyVersion,
      gatsbyCli: gatsbyCliVersion,
      sharp: sharpVersion,
      webpack: webpackVersion,
      coreCount: coreCount,
      ...benchmarkMetadata,
      ...THEME_OPTIONS.metrics.tags,
      deletedPages: DELETED_PAGES,
      changedPages: CHANGED_PAGES,
      clearedCache: CLEARING_CACHE
    };
    const buildtimes = { ...attributes,
      bootstrapTime: this.timestamps.bootstrapTime,
      instantiationTime: this.timestamps.instantiationTime,
      // Instantiation time of this class
      benchmarkStart: this.timestamps.benchmarkStart,
      // Start of benchmark itself
      preInit: this.timestamps.preInit,
      // Gatsby onPreInit life cycle
      preBootstrap: this.timestamps.preBootstrap,
      // Gatsby onPreBootstrap life cycle
      preBuild: this.timestamps.preBuild,
      // Gatsby onPreBuild life cycle
      postBuild: this.timestamps.postBuild,
      // Gatsby onPostBuild life cycle
      benchmarkEnd: this.timestamps.benchmarkEnd // End of benchmark itself

    };
    var timestamp = Date.now();
    const timeelapsed = this.timestamps.benchmarkEnd - this.timestamps.benchmarkStart;
    return [{
      "metrics": [{
        "name": "jsSize",
        "type": "gauge",
        "value": publicJsSize,
        "timestamp": timestamp,
        "attributes": attributes
      }, {
        "name": "pngs",
        "type": "gauge",
        "value": pngCount,
        "timestamp": timestamp,
        "attributes": attributes
      }, {
        "name": "jpgs",
        "type": "gauge",
        "value": jpgCount,
        "timestamp": timestamp,
        "attributes": attributes
      }, {
        "name": "otherImages",
        "type": "gauge",
        "value": otherCount,
        "timestamp": timestamp,
        "attributes": attributes
      }, {
        "name": "gifs",
        "type": "gauge",
        "value": gifCount,
        "timestamp": timestamp,
        "attributes": attributes
      }, {
        "name": "memory-rss",
        "type": "gauge",
        "value": rss !== null && rss !== void 0 ? rss : 0,
        "timestamp": timestamp,
        "attributes": attributes
      }, {
        "name": "memory-heapTotal",
        "type": "gauge",
        "value": heapTotal !== null && heapTotal !== void 0 ? heapTotal : 0,
        "timestamp": timestamp,
        "attributes": attributes
      }, {
        "name": "memory-heapUsed",
        "type": "gauge",
        "value": heapUsed !== null && heapUsed !== void 0 ? heapUsed : 0,
        "timestamp": timestamp,
        "attributes": attributes
      }, {
        "name": "memory-external",
        "type": "gauge",
        "value": external !== null && external !== void 0 ? external : 0,
        "timestamp": timestamp,
        "attributes": attributes
      }, {
        "name": "build-times",
        "type": "gauge",
        "value": timeelapsed,
        "timestamp": timestamp,
        "attributes": buildtimes
      }]
    }];
  }

  markStart() {
    if (this.started) {
      reportError(`gatsby-plugin-newrelic: `, new Error(`Error: Should not call markStart() more than once`));
      process.exit(1);
    }

    this.timestamps.benchmarkStart = performance.now();
    this.started = true;
  }

  markDataPoint(name) {
    if (BENCHMARK_REPORTING_URL) {
      if (!(name in this.timestamps)) {
        reportError(`gatsby-plugin-newrelic: Attempted to record a timestamp with a name (\`${name}\`) that wasn't expected`);
        process.exit(1);
      }
    }

    this.timestamps[name] = performance.now();
  }

  async markEnd() {
    if (!this.timestamps.benchmarkStart) {
      reportError(`gatsby-plugin-newrelic:`, new Error(`Error: Should not call markEnd() before calling markStart()`));
      process.exit(1);
    }

    this.timestamps.benchmarkEnd = performance.now();
    return this.flush();
  }

  async flush() {
    const data = this.getData();
    const json = JSON.stringify(data, null, 2);

    if (!BENCHMARK_REPORTING_URL) {
      // reportInfo(`Gathered data: ` + json);
      reportInfo(`gatsby-plugin-newrelic: MetricAPI BENCHMARK_REPORTING_URL not set, not submitting data`);
      this.flushed = true;
      return this.flushing = Promise.resolve();
    } // reportInfo(`Gathered data: ` + json);


    reportInfo(`Flushing benchmark data to remote server...`);
    let lastStatus = 0;
    this.flushing = nodeFetch(`${BENCHMARK_REPORTING_URL}`, {
      method: `POST`,
      headers: {
        "content-type": `application/json`,
        "Api-Key": THEME_OPTIONS.NR_KEY
      },
      body: json
    }).then(res => {
      lastStatus = res.status;

      if ([401, 500].includes(lastStatus)) {
        reportInfo(`gatsby-plugin-newrelic: MetricAPI got ${lastStatus} response, waiting for text`);
        res.text().then(content => {
          reportError(`Response error`, new Error(`gatsby-plugin-newrelic: MetricAPI responded with a ${lastStatus} error: ${content}`));
          process.exit(1);
        });
      }

      this.flushed = true; // Note: res.text returns a promise

      return res.text();
    });
    this.flushing.then(text => reportInfo(`gatsby-plugin-newrelic: MetricAPI response: ${lastStatus}: ${text}`));
    return this.flushing;
  }

}

function init(lifecycle) {
  if (!benchMeta && THEME_OPTIONS.metrics.collectMetrics) {
    benchMeta = new BenchMeta(); // This should be set in the gatsby-config of the site when enabling this plugin

    reportInfo(`gatsby-plugin-newrelic: Will post benchmark data to: ${BENCHMARK_REPORTING_URL || `the CLI`}`);
    benchMeta.markStart();
  }
}

process.on(`exit`, () => {
  if (benchMeta && !benchMeta.flushed && BENCHMARK_REPORTING_URL) {
    // This is probably already a non-zero exit as otherwise node should wait for the last promise to complete
    reportError(`gatsby-plugin-newrelic: error`, new Error(`This is process.exit(); gatsby-plugin-newrelic: MetricAPI collector has not completely flushed yet`));
    process.stdout.write = originalStdoutWrite; // process.stderr.write = originalStderrWrite;

    process.exit(1);
  }
});

async function onPreInit(api, themeOptions) {
  THEME_OPTIONS = themeOptions
  !themeOptions.traces.collectTraces && reportInfo('[!] gatsby-newrelic-plugin: Not collecting Traces');
  !themeOptions.logs.collectLogs && reportInfo('[!] gatsby-newrelic-plugin: Not collecting Logs');
  !themeOptions.metrics.collectMetrics && reportInfo('[!] gatsby-newrelic-plugin: Not collecting Metrics');
  lastApi = api;
  init(`preInit`);
  THEME_OPTIONS.metrics.collectMetrics && benchMeta.markDataPoint(`preInit`);
}

async function onPreBootstrap(api) {
  lastApi = api;
  init(`preBootstrap`);
  THEME_OPTIONS.metrics.collectMetrics && benchMeta.markDataPoint(`preBootstrap`);
}

async function onPreBuild(api) {
  lastApi = api;
  init(`preBuild`);
  THEME_OPTIONS.metrics.collectMetrics && benchMeta.markDataPoint(`preBuild`);
}

async function onPostBuild(api) {
  if (!benchMeta) {
    // Ignore. Don't start measuring on this event.
    return;
  }

  lastApi = api;
  benchMeta.markDataPoint(`postBuild`);
  await benchMeta.markEnd();
  benchMeta = undefined;
}

module.exports = {
  onPreInit,
  onPreBootstrap,
  onPreBuild,
  onPostBuild
};