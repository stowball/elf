# Creating a production-ready Eleventy project with webpack, Babel and Sass

While [Eleventy](https://www.11ty.dev/) is a magnificent, and increasingly popular static site generator (SSG), I’ve found it hard to find good references on starting a project using standard technologies like [webpack](https://webpack.js.org/), [Babel](https://babeljs.io/) and [Sass](https://sass-lang.com/), so decided to write this tutorial.

Before we start, it’s important to know that I’m not going to describe any technology in great detail, so I’ll assume you have a basic understanding of the “front-end” stack, and have [Node.js](https://nodejs.org/en/) installed (both v10.15 and v14.5 have been tested and work perfectly).

It’s also not a comprehensive guide to Eleventy. There are other resources for that, with [Learn Eleventy From Scratch](https://piccalil.li/course/learn-eleventy-from-scratch/) seemingly a great option. While I have only read the free, first lesson, I see many positive comments from the wider community so feel free to check it out.

Let’s take a look at what we’ll cover:

* [Setup](#setup)
* [Configuring Eleventy](#configuring-eleventy)
* [Creating a layout](#creating-a-layout)
* [Creating our first page](#creating-our-first-page)
* [Serving our site](#serving-our-site)
* [Re-writing URLs](#re-writing-urls)
* [Setting up webpack](#setting-up-webpack)
  * [Creating our assets](#creating-our-assets)
  * [Installing our dependencies](#installing-our-dependencies)
  * [Creating our configs](#creating-our-configs)
  * [Adding the assets to our Eleventy site](#adding-the-assets-to-our-eleventy-site)
  * [Updating our Eleventy config](#updating-our-eleventy-config)
* [Improving our cache busting](#improving-our-cache-busting)
* [Serving our prod build](#serving-our-prod-build)
* [Cleaning our prod build](#cleaning-our-prod-build)
* [Minifying our HTML for prod](#minifying-our-html-for-prod)
* [Implementing Babel for polyfilling and transpilation](#implementing-babel-for-polyfilling-and-transpilation)
* [Vendor prefixing CSS with Autoprefixer](#vendor-prefixing-css-with-autoprefixer)
* [A Git gotcha - my assets aren’t updating!](#a-git-gotcha---my-assets-arent-updating)
* [Wrapping up](#wrapping-up)

## Setup

Open a terminal in a new project directory, and run:

```sh
npm init -y
```

Next up, install Eleventy:

```sh
npm install @11ty/eleventy --save-dev --save-exact
```

## Configuring Eleventy

I prefer to keep all source files in a root `src` directory, with the full folder structure looking like this:

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

When the site is built, we’ll configure Eleventy to output it to a `dist` directory at the root level.

I prefer to use [EJS](https://ejs.co/) as my templating language because it’s the closest to being “just JavaScript” while also providing a simple developer experience for writing standard HTML.

OK, so let’s configure Eleventy to support the above structure.

First, create an `.eleventy.js` file in the project root with the following:

```js
module.exports = function(eleventyConfig) {
  return {
    dir: {
      includes: '_components',
      input: 'src',
      layouts: '_layouts',
      output: 'dist',
    },
    // Allows using markup and EJS features in markdown
    markdownTemplateEngine: 'ejs',
    templateFormats: [
      'ejs',
      'md',
    ],
  };
};
```

The above assumes that you’ll be using `.ejs` or `.md` files for your templating, so I recommend you install an appropriate syntax highlighter for your editor.

##  Creating a layout

[Layouts](https://www.11ty.dev/docs/layouts/) are special templates that can be used to wrap other content, which in our case will be the base, page-level HTML markup.

In `src/_layouts`, let’s create a `default.ejs` file with the following:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title><%= locals.title %></title>
  </head>
  <body>
    <%- content -%>
  </body>
</html>
```

For the most part, this is a standard HTML file, but we have 2 uses of EJS syntax:

```
<%= locals.title %>
```

Will output an escaped page `title` here. In EJS, it’s safer to always prefix your variables with `locals.`, that way you can easily support `undefined` variables in your templates.

```
<%- content -%>
```

Eleventy provides a `content` variable, so this will render any page content (unescaped) that uses this layout within this block.
 
##  Creating our first page

In `src/_pages`, let’s create an `index.md` with the following:

```md
---
title: My cool website
layout: default.ejs
---

# Hello, world

Welcome to my website.

A random number is <%- Math.random() %>
```

The part between `---` is called [front matter](https://www.11ty.dev/docs/data-frontmatter/), where we can define whatever variables we like, as well as make use of some built-in ones provided by Eleventy.

We’ve defined what our page `title` will be (which is consumed within our `default` layout), and the `layout` to use.

We’re using markdown which will be converted to an `<h1>` and `<p>`s, and demonstrating that you can also use EJS features (and JavaScript) within markdown itself.

## Serving our site

With our page created, how do we serve it up locally and see changes as we update the content and create new pages?

Let’s head over to `package.json`, and update our `"scripts"` with this:

```
"scripts": {
  "build:site": "ELEVENTY_ENV=production npx eleventy",
  "dev:site": "ELEVENTY_ENV=development npx eleventy --serve"
},
```

Now, from a terminal, you can run `npm run dev:site` and browse to [http://localhost:8080/_pages/](http://localhost:8080/_pages/) to see your HTML page fully rendered.

We’ve also added a command to perform a production build, but we won’t need to use that just yet. Also note the `ELEVENTY_ENV=production|development`. This provides us the ability to do different things with our Eleventy process, like minifying HTML, depending on the build type.

## Re-writing URLs

But wait up, we don’t want users (or us) to have to browse to `/_pages` in every URL; that home page should be available at the root domain!

Thankfully, Eleventy has a feature called [permalinks](https://www.11ty.dev/docs/permalinks/), which allows you to set what the URL for each page will be. Now, while we can manually add this to every page’s front matter to remove `_pages`, we can go one better by automating that.

Let’s create a `_pages.json` in `src/_pages`, with the following:

```json
{
  "permalink": "<%- page.filePathStem.replace('/_pages', '').replace('/index', '') %>/index.html"
}
```

“What is this madness?”, I hear you cry. Well, since we can use JavaScript within EJS, and use EJS within JSON, we can use the `page.filePathStem` which Eleventy provides to construct a new, better permalink path.

As an example, for the following files:

```
/_pages/index.md
/_pages/foo/index.ejs
/_pages/foo/bar.md
/_pages/foo/baz/index.ejs
/_pages/foo/baz/qux.md
```

Eleventy will provide the following `filePathStem`s:

```
/_pages/index
/_pages/foo/index
/_pages/foo/bar
/_pages/foo/baz/index
/_pages/foo/baz/qux
```

So, this “script” first removes the `/_pages` from the `filePathStem` string, then removes any trailing `/index` so every page is “equal”, and finally appends `/index.html`, which, for the above path examples, results in:

```
/index.html
/foo/index.html
/foo/bar/index.html
/foo/baz/index.html
/foo/baz/qux/index.html
```

Now, you should be able to browse directly to [http://localhost:8080/](http://localhost:8080/) to see your “Hello, world” file, and the correct path for any other file you create later on.

While this is kinda cool, it’s completely unstyled, so let’s see how we can set up webpack to compile CSS using Sass.

## Setting up webpack

### Creating our assets

Before we do any webpack configuration, let’s first scaffold our assets so we have something to configure.

We’re going to use Sass, which, while it may be going out of favour in some circles, still does an excellent job at allowing us to write more maintainable CSS.

*As a side note, I still like Sass so much that I’ve used it to create an atomic CSS library called [Hucssley](https://github.com/stowball/hucssley), which, in my humble opinion, is excellent!*

Anyway, back to this project…

Create `src/assets/css/index.scss` with the following code:

```css
html {
  font-family: sans-serif;
  background: #cbe3f5;
}
```

In this directory, you would add all of your project’s Sass partials and `@import` them from `index.scss`.

*If you prefer to co-locate your CSS and components, you could just as easily store them in specific template folders within `_components` and `@import` from there as well.*

For webpack to handle our CSS, it must be `import`ed into a JavaScript file, so let’s create `src/assets/js/index.js` with the following:

```js
import '../css/index.scss';

console.log('Hello again');
```

Although we `import` the CSS within in JavaScript, this is not CSS-in-JS; it’s purely so webpack can do its thing™.

### Installing our dependencies

Now that we have our asset files, let’s begin with the setup.

First, we’re going to need to install quite a few dependencies now, so kill your `dev:site` process, and run this in the terminal.

```sh
npm install css-loader fibers mini-css-extract-plugin optimize-css-assets-webpack-plugin sass sass-loader terser-webpack-plugin webpack webpack-cli webpack-merge --save-dev --save-exact
```

### Creating our configs

In the previous step, we installed a dependency called [webpack-merge](https://www.npmjs.com/package/webpack-merge). This will allow us to have separate development and production configurations which share the same, common configuration.

In the project root, create `webpack.config.common.js` with the following:

```js
// Makes Sass faster!
const Fiber = require('fibers');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

module.exports = {
  // Our "entry" point
  entry: './src/assets/js/index.js',
  output: {
    // The global variable name any `exports` from `index.js` will be available at
    library: 'SITE',
    // Where webpack will compile the assets
    path: path.resolve(__dirname, 'src/compiled-assets'),
  },
  module: {
    rules: [
      {
        // Setting up compiling our Sass
        test: /\.scss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader',
            options: {
              url: false,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              implementation: require('sass'),
              sassOptions: {
                fiber: Fiber,
                outputStyle: 'expanded',
              },
            },
          },
        ],
      },
    ],
  },
  // Any `import`s from `node_modules` will compiled in to a `vendor.js` file.
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
        },
      },
    },
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
  ],
};
```

Now, let’s create our development config, at `webpack.config.dev.js`:

```js
const { merge } = require('webpack-merge');
const common = require('./webpack.config.common.js');

module.exports = merge(common, {
  mode: 'development',
  // Allow watching and live reloading of assets
  watch: true,
});
```

And finally, our production config, at `webpack.config.prod.js`:

```js
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { merge } = require('webpack-merge');
const common = require('./webpack.config.common.js');

module.exports = merge(common, {
  // Enable minification and tree-shaking
  mode: 'production',
  optimization: {
    minimizer: [
      new OptimizeCssAssetsPlugin({}),
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
});
```

Now we have our configs, we need scripts to run them. Head over to `package.json`, and add 2 new scripts:

```
"build:assets": "webpack --config webpack.config.prod.js",
"dev:assets": "webpack --config webpack.config.dev.js",
```

so it should look like this:

```json
"scripts": {
  "build:assets": "webpack --config webpack.config.prod.js",
  "build:site": "ELEVENTY_ENV=production npx eleventy",
  "dev:assets": "webpack --config webpack.config.dev.js",
  "dev:site": "ELEVENTY_ENV=development npx eleventy --serve"
},
```

*Note: JSON doesn’t allow trailing commas on the last line of an object, so all of the updates I suggest are correct if adding them alphabetically.*

If you run `npm run build:assets` in your terminal, you should now have 2, minified files generated at:

```
src/compiled-assets/main.css
src/compiled-assets/main.js
```

### Adding the assets to our Eleventy site

Let’s open up our `src/_layouts/default.ejs`, and in the `<head>`, add a reference to the stylesheet, and before the closing `</body>`, add a reference to our JavaScript files.

```html
<head>
  … existing tags
  <link rel="stylesheet" href="/assets/main.css?<%- Date.now() %>" />
</head>
```

```html
  <!-- <script src="/assets/vendor.js?<%- Date.now() %>"></script> -->
  <script src="/assets/main.js?<%- Date.now() %>"></script>
</body>
```

We’ve also added some simplistic cache busting using the current timestamp (but we’ll improve that for production later on).

If you’re wondering why we have a commented out `vendor.js` `<script>`, we’ll use this later when we implement Babel to polyfill and transpile

You would have noticed that we’re loading these from the `/assets` directory, but we compiled them in to a `/compiled-assets` one. Now we need to update our `.eleventy.js` config file to handle this.

### Updating our Eleventy config

Update to `.eleventy.js` to include the following at the start of the `function` body:

```js
// Watch our compiled assets for changes
eleventyConfig.addWatchTarget('./src/compiled-assets/main.css');
eleventyConfig.addWatchTarget('./src/compiled-assets/main.js');
// eleventyConfig.addWatchTarget('./src/compiled-assets/vendor.js');

// Copy src/compiled-assets to /assets
eleventyConfig.addPassthroughCopy({ 'src/compiled-assets': 'assets' });
// Copy all images
eleventyConfig.addPassthroughCopy('src/images');
```

Let’s test it to see if it works!

Open another terminal, and in 1, run:

```sh
npm run dev:assets
```

and in the other, run: 

```sh
npm run dev:site
```

If you browse to [http://localhost:8080/](http://localhost:8080/), your page should be light blue with a sans-serif font! And if you open the console, `"Hello again"` should be there.

OK, so let’s see if we can update the files and reload our page. Change anything in the CSS, perhaps change the `background` to `#e1e1e1` and change the `console.log` to print `'Hello from the console'`.

Did the changes take effect? Awesome!

Having to run 2 terminals is a pain though, so let’s improve that with a `dev` command. Before we proceed, first stop both of those `dev:` processes from the terminal.

If you’re not using (or need to support Windows), you can simply add:

```json
"dev": "npm run dev:assets & npm run dev:site",
```

However, if you do need to support Windows, I recommend installing [npm-run-all](https://www.npmjs.com/package/npm-run-all) as a dev dependency with:

```sh
npm install npm-run-all --save-dev --save-exact
```

Then you can use the following command instead:

```json
"build": "npm-run-all --parallel dev:assets dev:site",
```

Even if you don’t need to support Windows, I quite like the syntax of `npm-run-all`, especially if you need to run many commands, because it removes the need for prefixing `npm run` every time.

Try running `npm run dev` from a terminal, and both processes should run and watch for changes as before.

Now let’s create a similar command to build for production:

Update your package.json with:

```json
"prod": "npm-run-all build:assets build:site"
```

Notice that these don’t run in parallel, because we want the assets to be ready before Eleventy copies them to `dist/`.


## Improving our cache busting

Earlier, we used `Date.now()` to cache bust our assets, however, that would mean that with every build (and deployment), users would be forced to download new versions of the files, even if they hadn’t changed. We can improve that by using a library called [md5-file](https://www.npmjs.com/package/md5-file) to use the file’s content as our base for cache busting string.

Let’s first install it as a dev dependency:

```sh
npm install md5-file --save-dev --save-exact
```

Now, create `src/_data/cacheBust.js` with the following:

```js
const md5File = require('md5-file');

const cacheBust = () => {
  // A "map" of files to cache bust
  const files = {
    mainCss: './src/compiled-assets/main.css',
    mainJs: './src/compiled-assets/main.js',
    // vendorJs: './src/compiled-assets/vendor.js',
  };

  return Object.entries(files).reduce((acc, [key, path]) => {
    const now = Date.now();
    const bust = process.env.ELEVENTY_ENV === 'production' ? md5File.sync(path, (_err, hash) => hash) : now;

    acc[key] = bust;

    return acc;
  }, {});
};

module.exports = cacheBust;
```

This script will loop over the items in `files`, and for each of the keys, return the current date in milliseconds for development, or the md5 hash for production in a new object. Notice the `process.env.ELEVENTY_ENV === 'production'`, which is taking advantage of the `ELEVENTY_ENV=production` variable that we added to our `package.json` `"script"` earlier.

Now we need to update our `src/_layouts/default.ejs` to use our new cache busting string:

```diff
- <link rel="stylesheet" href="/assets/main.css?<%- Date.now() %>" />
+ <link rel="stylesheet" href="/assets/main.css?<%- cacheBust.mainCss %>" />

- <!-- <link rel="stylesheet" href="/assets/vendor.js?<%- Date.now() %>" /> -->
- <link rel="stylesheet" href="/assets/main.js?<%- Date.now() %>" />
+ <!-- <link rel="stylesheet" href="/assets/vendor.js?<%- cacheBust.vendorJs %>" /> -->
+ <link rel="stylesheet" href="/assets/main.js?<%- cacheBust.mainJs %>" />
```

## Serving our prod build

We can run our prod build with `npm run prod`, but we don’t have an explicit way to view it in the browser yet.

Let’s install a new dependency, [serve](https://www.npmjs.com/package/serve), which is an excellent, little web server:

```sh
npm install serve --save-dev --save-exact
```

And add a new script to package.json:

```json
"serve:prod": "serve ./dist/"
```

Running `npm run serve:prod` should now make your site available at [http://localhost:5000/](http://localhost:5000/), where, if you inspect the source or view the Network tab, you should see the CSS and JS files have the correct md5 hash on their querystring.

## Cleaning our prod build

Since both our development and prod builds end up in the same place, I’d recommend cleaning the directory before performing a prod build, just to ensure there aren’t any leftover files in there. To support all operating systems, use another node module, [rimraf](https://www.npmjs.com/package/rimraf).

```sh
npm install rimraf --save-dev --save-exact
```

and update package.json to include:

```json
"del:dist": "rimraf ./dist",
``` 

and change our build script to:

```json
"prod": "npm-run-all del:dist build:assets build:site",
```

## Minifying our HTML for prod

Since we’re minifying our CSS and JavaScript in our webpack process, let’s also minify our HTML to squeeze a little more performance benefits:

Install [html-minifier](https://www.npmjs.com/package/html-minifier) as another dev dependency:

```sh
npm install html-minifier --save-dev --save-exact
```

Then update `.eleventy.js` to first import the package:

```js
const htmlmin = require('html-minifier');
```

And then, before the `return`, add:

```js
if (process.env.ELEVENTY_ENV === 'production') {
  eleventyConfig.addTransform('htmlmin', (content, outputPath) => {
    if (outputPath.endsWith('.html')) {
      const minified = htmlmin.minify(content, {
        collapseInlineTagWhitespace: false,
        collapseWhitespace: true,
        removeComments: true,
        sortClassName: true,
        useShortDoctype: true,
      });

      return minified;
    }

    return content;
  });
}
```

## Implementing Babel for polyfilling and transpilation

Most developers these days want to take advantage of ES6 (2015) features and APIs, like arrow functions, `const`, spreads and `Array.from()`, while also supporting older browsers which don’t understand these syntaxes.

Thankfully, Babel can do all this for us with minimal effort.

Let’s install the required dev dependencies:

```sh
npm install @babel/core @babel/preset-env babel-loader core-js --save-dev --save-exact
```

Now let’s tell webpack to use Babel by updating `webpack.config.common.js` to add this new object in the `rules` array:

```js
// Transpile and polyfill our JavaScript
{
  test: /\.js$/,
  use: 'babel-loader',
  exclude: /node_modules/
},
```

Next configure Babel by creating a `babel.config.json` at the root of the project:

```json
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "corejs": 3,
        "useBuiltIns": "usage"
      }
    ]
  ]
}
```

I’d also recommend creating a [`.browserslistrc`](https://github.com/browserslist/browserslist) file with the browsers you wish to support. For instance, I plan to support the following:

```
> 1%
last 2 versions
```

And finally, let’s un-comment all of the vendor references throughout the project, so in:

* `.eleventy.js`
* `src/_data/cacheBust.js`
* `src/_layouts/default.ejs`

With that all setup, if you were to update your `src/assets/js/index.js` to add:

```js
Array.from(document.getElementsByTagName('p')).forEach((p) => {
  console.log(`p ${index}, startsWith('W')`, p, p.innerHTML.startsWith('W'));
});
```

then run a dev or prod build, you should see that Babel created a `vendor.js` file, which has automatically transpiled the arrow function and the template literal, and polyfilled `Array.from` and `.startsWith()`, so all this works as expected, even in IE 11!

The best thing about our Babel setup is that it will only polyfill the features you use, so as you continue to develop your site and write more JavaScript, the vendor file will change appropriately.

*While out of scope for this tutorial, you may also want to investigate creating and conditionally loading 2 JavaScript bundles: 1 for modern browsers, and 1 for legacy browsers with polyfills in tow.*

## Vendor prefixing CSS with Autoprefixer

The final piece is to use [Autoprefixer](https://github.com/postcss/autoprefixer) to automatically add vendor prefixes to your CSS output, to allow you to only write the standard syntax, while ensuring all browsers (in your `.browserslistrc`) are catered for.

Let’s install 2 more dependencies:

```sh
npm install autoprefixer postcss-loader --save-dev --save-exact
```

Now create a `postcss.config.js` in the project root:

```js
module.exports = {
  plugins: [
    require('autoprefixer'),
  ],
};
```

And update `webpack.config.common.js` to add the following before the `loader: 'sass-loader'` item `.scss` `use` array:

```js
{
  loader: 'postcss-loader',
},
```

If you were to now update your CSS to include `display:flex` somewhere, you should see it automatically prefixed with `display: -webkit-box` and `display: -ms-flexbox`.

## A Git gotcha - my assets aren’t updating!

Now, this one stumped for me for a while, so take note!

Inevitably, your project will be stored in a Git repo, which will have its own `.gitignore` file. As you would never want to store the compiled files in Git, it would look something like this:

```
/dist/
/node_modules/
/src/compiled-assets/

.DS_Store
Thumbs.db
```

Unfortunately, this will break Eleventy from watching your assets, but it’s an easy fix. Create a near-identical `.eleventyignore` file in the root, but make sure that `src/compiled-assets` is not listed, like so:

```
/dist/
/node_modules/

.DS_Store
Thumbs.db
```

Then update `.eleventy.js` to add:

```js
eleventyConfig.setUseGitIgnore(false);
```

## Wrapping up

I hope you’ve found this whirlwind tutorial helpful for getting started with Eleventy and common developer tooling. I sure wish I had this guide a while ago!

And if you’d like to see the code in one place, I have it hosted as an Eleventy starter kit called [Elf](https://github.com/stowball/elf).
