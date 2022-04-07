const { Notion } = require("../..");

const notion = new Notion({
  autoSelectDevice: false
});

main();

async function main() {
  await notion
    .login({
      email: process.env.NEUROSITY_EMAIL,
      password: process.env.NEUROSITY_PASSWORD
    })
    .catch((error) => {
      console.log("login error", error.response);
    });

  const token = await notion
    .getOAuthToken({
      clientId: process.env.NEUROSITY_OAUTH_CLIENT_ID,
      clientSecret: process.env.NEUROSITY_OAUTH_CLIENT_SECRET,
      userId: process.env.NEUROSITY_OAUTH_USER_ID
    })
    .catch((error) => {
      console.log("oauth error", error.response);
    });

  console.log("token", token);
}
