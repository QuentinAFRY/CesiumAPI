/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from "vite";
import cesium from 'vite-plugin-cesium-build'
import react from "@vitejs/plugin-react";


/**
 * Cesium-Plugin:
 * CesiumJS requires a few static files to be hosted on your server, like web workers and SVG icons.
 * The Plugin fixes this issue by doing the neccessary steps.
 * Link to library - https://github.com/s3xysteak/vite-plugin-cesium-build
 * Link to blogpost - https://community.cesium.com/t/is-there-a-good-way-to-use-cesium-with-vite/27545/3
 * 
 * Concerning Vite-Cesium in general:
 * Sourcemap Error detected in the console. Developer is aware of the issue, seems to be a problem in Cesium.
 * For the moment it can be ignored!
 */

export default defineConfig({
  plugins: [
    react(),
    cesium()
  ],
  base: "./",
  esbuild: {
    supported: {
      "top-level-await": true,
    },
  },
  build: {
    sourcemap: true,
  }
});
