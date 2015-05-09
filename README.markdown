# sigh-sass

[![build status](https://circleci.com/gh/sighjs/sigh-sass.png)](https://circleci.com/gh/sighjs/sigh-sass)

Compiles css files with node-sass. The sass compilers run in the sigh process pool to take advantage of multiple CPUs/cores.

## Example

`npm install --save node-sass` then add this to your `sigh.js`:
```javascript
var sass, glob, babel, write

module.exports = function(pipelines) {
  pipelines['build:source'] = [
    glob({ basePath: 'src' }, '**/*.scss'),
    sass(),
    write('build/assets'),
  ]
}
```

You can pass an object containing node-sass options as the first parameter to `sass`.

## TODO
 * Write more tests
