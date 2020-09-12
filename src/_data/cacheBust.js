const md5File = require('md5-file');

const cacheBust = () => {
  // A "map" of files to cache bust
  const files = {
    mainCss: './src/compiled-assets/main.css',
    mainJs: './src/compiled-assets/main.js',
    vendorJs: './src/compiled-assets/vendor.js',
  };

  return Object.entries(files).reduce((acc, [key, path]) => {
    const now = Date.now();
    const bust = process.env.ELEVENTY_ENV === 'production' ? md5File.sync(path, (_err, hash) => hash) : now;

    acc[key] = bust;

    return acc;
  }, {});
};

module.exports = cacheBust;
