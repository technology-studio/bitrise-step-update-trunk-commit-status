import ky from 'ky';
import { execSync } from 'child_process';

const ACCESS_TOKEN = process.env.GITHUB_ACCESS_TOKEN;
const COMMIT_SHA = process.env.COMMIT_SHA;
const REPO = process.env.REPO_SLUG;
const OWNER = process.env.REPO_OWNER;
const BITRISE_STATUS = process.env.BITRISE_BUILD_STATUS;
const IS_PENDING = process.env.IS_PENDING;
const BUILD_URL = process.env.BITRISE_BUILD_URL;
const IS_BUILD_FAILED = process.env.IS_BUILD_FAILED;
const CONTEXT = process.env.CONTEXT;

const api = ky.create({
  prefixUrl: 'https://api.github.com',
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28',
  },
});

(async () => {
  if (IS_BUILD_FAILED === undefined && BITRISE_STATUS === '1') {
    execSync(`envman add --key IS_BUILD_FAILED --value true`);
  }
  if (COMMIT_SHA === "") {
    console.log("No commit SHA provided, skipping");
    return;
  }

  const state = BITRISE_STATUS === "0"
    ? IS_PENDING === "yes"
      ? "pending"
      : "success"
    : "failure";
  const description = state === "success"
    ? 'The build succeeded'
    : state === "failure"
      ? 'The build failed'
      : state === "pending"
        ? 'The build is pending'
        : 'The build failed';

  console.log(`Updating status for commit ${COMMIT_SHA} to ${state} with description "${description}" and context "${CONTEXT}"...`);
  try {
    await api.post(`repos/${OWNER}/${REPO}/statuses/${COMMIT_SHA}`, {
      json: {
        target_url: BUILD_URL,
        context: CONTEXT,
        state,
        description,
      },
    }).json();
    console.log("Successfully updated status");
  } catch (error) {
    console.error("Failed to update status");
    console.error(error);
  }
})();
