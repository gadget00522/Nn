// index.web.js — entry web compatible react-native-web
import "react-native-get-random-values";
import { AppRegistry } from "react-native";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // on laisse './App' — webpack.resolve.extensions gère .jsx/.tsx
import appJson from "./app.json";

const appName = (appJson && appJson.name) || "MalinWallet";

AppRegistry.registerComponent(appName, () => App);
const rootTag = document.getElementById("root") || document.body.appendChild(document.createElement("div"));

rootTag.id = "root";

const root = ReactDOM.createRoot(rootTag);
AppRegistry.runApplication(appName, { rootTag });