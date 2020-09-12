import '../css/index.scss';

// eslint-disable-next-line no-console
console.log('Hello again');

Array.from(document.getElementsByTagName('p')).forEach((p, index) => {
  // eslint-disable-next-line no-console
  console.log(`p ${index}, startsWith('W')`, p, p.innerHTML.startsWith('W'));
});
