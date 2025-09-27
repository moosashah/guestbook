const { execSync } = require('child_process');

try {
  const gitSha = execSync('git rev-parse --short HEAD').toString().trim();
  console.log(gitSha);
} catch (error) {
  console.log('development');
}
