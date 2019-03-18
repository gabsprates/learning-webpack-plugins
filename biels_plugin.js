const fs = require("fs");
const path = require("path");
const babel = require("@babel/core");
const colors = require("colors/safe");
const HtmlWebpackPlugin = require("html-webpack-plugin");

class BielsPlugin {
  transpile(outputPath) {
    const DIR = path.resolve(__dirname, outputPath);

    console.log(colors.black.bgYellow("==== Transpiling ES6 -> ES5 ===="));
    let files;
    try {
      files = fs.readdirSync(DIR);
    } catch (error) {
      console.log(colors.red("==== FAIL TO READ DIRECTORY ===="));
      return;
    }

    const jsFiles = files.filter(fileName =>
      /([a-z0-9]{4,})\.js$/i.test(fileName)
    );

    jsFiles.forEach(file => {
      const sourceFile = path.resolve(DIR, file);
      const outputFile = sourceFile.replace(/\.js$/, ".es5.js");

      let msg = "";
      try {
        const { code } = babel.transformFileSync(sourceFile, {
          presets: [["@babel/preset-env", { targets: { ie: "8" } }]],
          compact: true,
          minified: true,
          comments: false
        });

        fs.writeFileSync(outputFile, code);

        msg = colors.bgGreen("[OK]");
      } catch (error) {
        msg = colors.red("[ERROR]: " + error.message);
      }

      console.log(" - %s: %s", outputFile, msg);
    });

    console.log(colors.black.bgCyan("===== Transpiling finished ====="), "\n");
  }

  apply(compiler) {
    compiler.hooks.compilation.tap("BielsPlugin", compilation => {
      compilation.hooks.htmlWebpackPluginAfterHtmlProcessing.tapAsync(
        "HtmlWebpackPlugin",
        function(data, callback) {
          data.html = data.html.replace(/<noscript><\/noscript>/, () => {
            let g = "<script>var ASSETS=[";
            data.assets.js.forEach(asset => {
              g += `"${asset}"`;
            });
            g += "];</script>";
            return g;
          });
          callback();
        }
      );
    });

    compiler.hooks.afterEmit.tapAsync(
      "BielsPlugin",
      (compilation, callback) => {
        this.transpile(compiler.options.output.path);
        callback();
      }
    );
  }
}

module.exports = BielsPlugin;
