const { Notion } = require("../..");

const notion = new Notion();

const currentUser = JSON.stringify(
  notion.__getApp().auth().currentUser
);

console.log("currentUser", currentUser);

notion.onAuthStateChanged().subscribe((user) => {
  console.log("onAuthStateChanged", user ? user.uid : user);

  if (user) {
    const userData = JSON.parse(
      JSON.stringify(notion.__getApp().auth().currentUser)
    );
    const userObject = Notion.createUser(
      userData,
      userData.stsTokenManager,
      userData
    );

    notion
      .__getApp()
      .auth()
      .updateCurrentUser(userObject)
      .catch((error) => {
        console.error(`error in updateCurrentUser`, error);
      });
  }
});

(async () => {
  await notion.login({
    email: process.env.NEUROSITY_EMAIL,
    password: process.env.NEUROSITY_PASSWORD
  });

  notion.status().subscribe((status) => {
    console.log("status", status);
  });
})();
