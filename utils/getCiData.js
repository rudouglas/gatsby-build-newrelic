const { execToStr } = require('./execTo');
const gitRepoUrl = execToStr(`git config --get remote.origin.url`);
const gitCommit = execToStr(`git log --format="%H" -n 1`);

const getCiData = () => {
  switch (true) {
    case process.env.NETLIFY:
      return {
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
    case process.env.VERCEL:
      return {
        gitRepoUrl: process.env.GATSBY_VERCEL_GIT_REPO_SLUG,
        gitBranch: process.env.GATSBY_VERCEL_GIT_COMMIT_REF,
        gitCommit: process.env.GATSBY_VERCEL_GIT_COMMIT_SHA,
        context: process.env.GATSBY_VERCEL_ENV,
        deployUrl: process.env.GATSBY_VERCEL_URL,
        deployRegion: process.env.GATSBY_VERCEL_REGION
      };
    case process.env.GATSBY_CLOUD:
      return {
        gitRepoUrl,
        gitBranch: process.env.BRANCH,
        gatsbyIsPreview: process.env.GATSBY_IS_PREVIEW,
        gitCommit,
      };
    default:
      return {
        gitRepoUrl,
        gitCommit,
        gitBranch: execToStr(`git branch --show-current`)
      };
  }
};

module.exports = getCiData;