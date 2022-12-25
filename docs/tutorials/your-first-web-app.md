---
id: your-first-web-app
title: Your First Web App
---

In this tutorial, we'll build a Web App from scratch using the following tech stack:

- ⚛️ React - [Create React App](https://github.com/facebook/create-react-app)
- 🏆 Reach Router - [@reach/router](https://reach.tech/router)
- 🤯 Neurosity SDK - [@neurosity/sdk](https://www.npmjs.com/package/@neurosity/sdk)
- 🔑 Neurosity Authentication
- 👍 React Use - [react-use](https://github.com/streamich/react-use)

**TLDR**: If you want to quickly get your neuro app up and running using the Neurosity SDK & React, you can clone the [Neurosity React Starter](https://github.com/neurosity/notion-react-starter) repo.

## Getting Started

Let's start by bootstrapping our app with Create React App (CRA). We open the project in VS Code and run the app locally.

- `npx create-react-app mind-controlled-ocean`
- `code mind-controlled-ocean`
- `npm start`

If all goes well, you should see something like this:

![Create React App Default View](https://dev-to-uploads.s3.amazonaws.com/i/k1knwodmvrqogao5wvlf.png)

> Add all the styles we'll need for this app in `./src/index.css` - [here's the CSS](https://github.com/neurosity/notion-react-starter/blob/master/src/global.css).

## 🔑 Authentication

We believe in privacy. That's why Neurosity is the first brain computer to feature authentication. Adding auth to the app is pretty straightforward. For this, we'll need a login form and 3 side effects to sync the authentication state.

All you need to connect to your device is a [Neurosity account](https://console.neurosity.co/) and a Device ID. So, let's start by creating a new component for the login form that will collect this information.

```jsx
// src/components/LoginForm.js
import React, { useState } from "react";

export function LoginForm({ onLogin, loading, error }) {
  const [deviceId, setDeviceId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function onSubmit(event) {
    event.preventDefault();
    onLogin({ deviceId, email, password });
  }

  return (
    <form className="card login-form" onSubmit={onSubmit}>
      <h3 className="card-heading">Login</h3>
      {!!error ? <h4 className="card-error">{error}</h4> : null}
      <div className="row">
        <label>Neurosity Device ID</label>
        <input
          type="text"
          value={deviceId}
          disabled={loading}
          onChange={(e) => setDeviceId(e.target.value)}
        />
      </div>
      <div className="row">
        <label>Email</label>
        <input
          type="email"
          value={email}
          disabled={loading}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="row">
        <label>Password</label>
        <input
          type="password"
          value={password}
          disabled={loading}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="row">
        <button type="submit" className="card-btn" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </form>
  );
}
```

This component will hold the state of the `deviceId`, `email` and `password`. Additionally, our form component will accept an `onLogin` prop that will execute when the user clicks on the "Login" button. We'll also accept a `loading` prop for when the form submission is in progress, and an `error` message prop to be displayed when an error occurs.

Now that we've created our login component, let's add a login page that will make use of our new component.

```jsx
// src/pages/Login.js
import React, { useState, useEffect } from "react";
import { LoginForm } from "../components/LoginForm";

export function Login({ neurosity, user, setUser, setDeviceId }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  function onLogin({ email, password, deviceId }) {
    if (email && password && deviceId) {
      setError("");
      setEmail(email);
      setPassword(password);
      setDeviceId(deviceId);
    } else {
      setError("Please fill the form");
    }
  }

  return <LoginForm onLogin={onLogin} loading={isLoggingIn} error={error} />;
}
```

![Login form](https://dev-to-uploads.s3.amazonaws.com/i/aur340eejmmzjuf5fsgo.png)

The goal of this page is to display the login form, add basic form validation via the `setError` function, and execute a login function. For the latter, let's add a side effect that will sync with `email`, `password` and the props received the page.

```jsx
useEffect(() => {
  if (!user && neurosity && email && password) {
    login();
  }

  async function login() {
    setIsLoggingIn(true);
    const auth = await neurosity.login({ email, password }).catch((error) => {
      setError(error.message);
    });

    if (auth) {
      setUser(auth.user);
    }

    setIsLoggingIn(false);
  }
}, [email, password, neurosity, user, setUser, setError]);
```

You can think of `user` as the object that holds the auth user session set by the Neurosity SDK. So we are only calling our `login()` function if there is no auth session, we have a Neurosity instance in the state, and the user has submitted an email and password.

Very soon you'll find out how we'll receive the props: `neurosity, user, setUser, setDeviceId`. But before we do that, let's go back to our `App.js` and start putting it all together.

## ⚙️ App State

To keep this app simple, we'll just be using React's `useState` hook, the Reach Router, and a local storage hook brought to you by [react-use](https://github.com/streamich/react-use). This means our general application state strategy will consist of keeping the global state at the App component level and passing down the necessary props to its child components.

- `npm install @reach/router react-use`

We'll start with a single route, but we'll add 2 more routes as we continue to build the app.

```jsx
// src/App.js
import React, { useState, useEffect } from "react";
import { Router, navigate } from "@reach/router";
import useLocalStorage from "react-use/lib/useLocalStorage";
import { Login } from "./pages/Login";

export function App() {
  const [neurosity, setNeurosity] = useState(null);
  const [user, setUser] = useState(null);
  const [deviceId, setDeviceId] = useLocalStorage("deviceId");
  const [loading, setLoading] = useState(true);

  return (
    <Router>
      <Login
        path="/"
        neurosity={neurosity}
        user={user}
        setUser={setUser}
        setDeviceId={setDeviceId}
      />
    </Router>
  );
}
```

If you were wondering why have we decided to keep the `deviceId` in the local storage, it is because we'll need to access it before and after the user has logged in. It also makes a nicer user experience not to have to enter it multiple times.

## 🤯 Neurosity SDK

Now that we have basic state management in place, let's integrate our app with _Neurosity_ by installing the SDK and importing it in `App.js`.

- `npm install @neurosity/sdk`

```jsx
import { Neurosity } from "@neurosity/sdk";
```

Connecting to a Neurosity device is simple. We instantiate a new _Neurosity_ class and pass the Device ID. We can add a side effect that sets the instance to the App component state by syncing with `deviceId`.

```jsx
useEffect(() => {
  if (deviceId) {
    const neurosity = new Neurosity({ deviceId });
    setNeurosity(neurosity);
  } else {
    setLoading(false);
  }
}, [deviceId]);
```

Another state we want to sync is the `user` state.

In the following example, we'll add a side effect that syncs with the value of the `neurosity` instance. If `neurosity` hasn't been set yet, then we'll skip subscribing to _calm_ events until the `neurosity` instance is created.

```jsx
useEffect(() => {
  if (!neurosity) {
    return;
  }

  const subscription = neurosity.onAuthStateChanged().subscribe((user) => {
    if (user) {
      setUser(user);
    } else {
      navigate("/");
    }
    setLoading(false);
  });

  return () => {
    subscription.unsubscribe();
  };
}, [neurosity]);
```

If the app has an active user session persisted by the Neurosity SDK authentication, we'll want to get the current logged in user, and set it to the state in our App component.

The `onAuthStateChanged` method returns an observable of user auth events. It is important to note that when using the Neurosity SDK in the browser, the session will persist via local storage. So, if you close the app, or reload the page, the session will persist and `onAuthStateChanged` will return the user session instead of `null`. This is exactly what we want.

If no session is detected we can navigate to the login page. Otherwise, set `user` in the component's state.

We can complete full authentication by adding a Logout page.

```jsx
// src/pages/Logout.js
import { useEffect } from "react";
import { navigate } from "@reach/router";

export function Logout({ neurosity, resetState }) {
  useEffect(() => {
    if (neurosity) {
      neurosity.logout().then(() => {
        resetState();
        navigate("/");
      });
    }
  }, [neurosity, resetState]);

  return null;
}
```

The logout page is simply a React component with no DOM elements. The only logic we need is a side effect that will call the `neurosity.logout()` method if the `neurosity` instance is present. Lastly, it redirects the user to the initial route after logging out.

This component can now be added as a route in `App.js`.

```jsx
// src/App.js
// ...
import { Logout } from "./pages/Logout";
// ...

return (
  <Router>
    {/* ... */}
    <Logout
      path="/logout"
      neurosity={neurosity}
      resetState={() => {
        setNeurosity(null);
        setUser(null);
        setDeviceId("");
      }}
    />
  </Router>
);
```

Now that authentication is completed, let's add a navigation component to our app.

## 💻 Navigation

Knowing the status of the device at all times is an important part of the user experience. The idea here is to display whether the device is online or offline, charging, or in sleep mode.

So, let's add a `Status` component that uses a map for the label of the state, and another map for the color representing the state. This logic is very similar to the status bar used in the Developer Console.

```jsx
// src/components/Status.js
import React, { useState, useEffect } from "react";

const statesLabels = {
  booting: "Starting OS...",
  shuttingOff: "Shutting off...",
  updating: "Updating OS...",
  online: "Online",
  offline: "Offline"
};

const stateColors = {
  booting: "darkslategrey",
  shuttingOff: "darkslategrey",
  updating: "orange",
  online: "limegreen",
  offline: "crimson"
};

function getStatusColor(state) {
  if (state in stateColors) {
    return stateColors[state];
  }

  return stateColors.offline;
}

export function Status({ neurosity, info }) {
  const [status, setStatus] = useState(null);
  const { state, charging, battery, sleepMode } = status || {};

  useEffect(() => {
    if (!neurosity) {
      return;
    }

    const subscription = neurosity.status().subscribe((status) => {
      setStatus(status);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [neurosity]);

  if (!status) {
    return <div>Connecting to device...</div>;
  }

  return (
    <aside>
      {info ? <h3 className="card-heading">{info.deviceNickname}</h3> : null}
      <div className="status-item status-state">
        <span
          className="status-indicator"
          style={{ background: getStatusColor(state) }}
        ></span>
        {state in statesLabels ? statesLabels[state] : state}
      </div>
      {state !== "offline" ? (
        <div className="status-item status-battery">
          <span role="img" aria-label="Electricity Emoji">
            &#x26A1;
          </span>
          {charging ? " Charging " : " Charged "}
          {battery}%
        </div>
      ) : null}
      {sleepMode && state !== "offline" ? (
        <div className="status-item status-sleep-mode">
          <span role="img" aria-label="Moon Emoji">
            &#127769;
          </span>
          {" Sleep mode "}
        </div>
      ) : null}
    </aside>
  );
}
```

Next, a `Nav` component can fetch the device info, show our new `Status` component, and a logout button.

```jsx
// src/components/Nav.js
import React, { useState, useEffect } from "react";
import { navigate } from "@reach/router";

import { Status } from "./Status";
import { Footer } from "./Footer";

export function Nav({ neurosity }) {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!neurosity) {
      return;
    }

    neurosity.getInfo().then((info) => {
      setInfo(info);
    });
  }, [neurosity]);

  return (
    <nav className="card">
      <Status neurosity={neurosity} info={info} />
      <button onClick={() => navigate("/logout")} className="card-btn">
        Logout
      </button>
    </nav>
  );
}
```

Now that our app displays the state of the device at any given time, let's add App logic based on our _cognitive state_!

## 🧠 Cognitive State

This is the fun part. This is where we get to access brain data and map it to the app state.

By subscribing to `neurosity.calm()`, we get a new `calm` score approximately every second. So, let's add a page to display the calm score.

> 💡 Learn more about the [calm score](../api/calm).

```jsx
// src/pages/Calm.js
import React, { useState, useEffect } from "react";
import { Nav } from "../components/Nav";

export function Calm({ user, neurosity }) {
  const [calm, setCalm] = useState(0);

  useEffect(() => {
    if (!user || !neurosity) {
      return;
    }

    const subscription = neurosity.calm().subscribe((calm) => {
      setCalm(Number(calm.probability.toFixed(2)));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, neurosity]);

  return (
    <main className="main-container">
      {user ? <Nav neurosity={neurosity} /> : null}
      <div className="calm-score">
        &nbsp;{calm * 100}% <div className="calm-word">Calm</div>
      </div>
    </main>
  );
}
```

A side effect that syncs with the instance of `neurosity` and with `user` will create a subscription to the Calm API.

> All neurosity metrics, including `neurosity.calm()` return an RxJS subscription that we can use to safely unsubscribe when the component unmounts.

And finally, we add our Calm page to `App.js`.

```jsx
// src/App.js
// ...
import { Calm } from "./pages/Calm";
// ...

// If already authenticated, redirect user to the Calm page
useEffect(() => {
  if (user) {
    navigate("/calm");
  }
}, [user]);

return (
  <Router>
    {/* ... */}
    <Calm path="/calm" neurosity={neurosity} user={user} />
  </Router>
);
```

![Neurosity React Starter](https://github.com/neurosity/notion-react-starter/raw/master/public/notion-react-starter.png)

And with that, your first Neurosity React App is now complete.

- [View full code](https://github.com/neurosity/notion-react-starter)
