<div align="center">
  <img
    alt="Elf logo"
    height="200"
    src="https://github.com/stowball/elf/blob/master/src/images/logo.svg?raw=true"
  />

# Elf

</div>

Elf is a simple, magical [Eleventy](https://www.11ty.dev/) starter kit to help you create a project using standard technologies like webpack, Babel and Sass, while also considering ease of use, performance and browser compatibility.

If you'd like to know why Elf exists and how best to take advantage of it, read [Creating a production-ready Eleventy project with webpack, Babel and Sass](https://dev.to/stowball/creating-a-production-ready-eleventy-project-with-webpack-babel-and-sass-35ep).

## Getting started

1. Clone or fork this repo: `git clone https://github.com/stowball/elf`
2. `cd` into the project directory and run `npm install`

## Running and serving a dev build

```sh
npm run dev
```

Browse to [http://localhost:8080](http://localhost:8080).

## Running and serving a prod build

```sh
npm run prod
npm run serve:prod
```

Browse to [http://localhost:5000](http://localhost:5000).

## Technologies used

* [Eleventy](https://www.11ty.dev/)… obviously
* [EJS](https://ejs.co/) as the templating language
* [Sass](https://sass-lang.com/) for writing CSS
* [Babel](https://babeljs.io/) for transpiling and polyfilling JavaScript
* [Autoprefixer](https://github.com/postcss/autoprefixer) for vendor prefixing CSS
* [Webpack](https://webpack.js.org/) for compiling the Sass and JavaScript assets
* [ESLint](https://eslint.org/) and [Airbnb's base configuration](https://www.npmjs.com/package/eslint-config-airbnb-base) for linting

## Project structure

```
src/
  _components/
    All UI partials
  _data/
    Eleventy data files
  _layouts/
    Base page layouts
  _pages/
    Each individual page template
  assets/
    css/
      index.scss
      All other scss files
    js/
      index.js
      All other js files
  images/
    All images used
Configuration and build files
```

Files in `assets` will be handled by webpack, Eleventy will transform all of the directories with a leading `_`, and will copy across any `images`.

Eleventy’s output will be to a `dist` directory at the root level.
