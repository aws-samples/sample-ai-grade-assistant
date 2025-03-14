## AWS AI Grade Assistant Demo - User Interface

This project provides a User Interface (UI) to support the AWS AI Grade Assistant demo.

This project is a React project bootstrapped with [Vite](https://vitejs.dev/).

---

## Getting started

**Step 1**
Ensure that the [CDK project](../cdk)  has been deployed to your AWS account.

**Step 2.**
Deploying the CDK project will generate a file in the ```ui/public``` folder called ```config.js```. This file will contain config needed to connect the UI to the backend.

**Step 3**
Run `npm install` to install NPM packages

**Step 4**
Run `npm start` to run the UI locally 

---

## Available Scripts

In the project directory, you can run:

#### Local development
```
npm run dev
```

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

#### Build for deployment
```
npm run build
```

Builds the app for production to the `dist` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include hashes.
