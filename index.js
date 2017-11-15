const postcss = require("postcss");
const vars = require("postcss-simple-vars");
const pFunctions = require("postcss-functinos");

var rules = {
  forEach(value, body) {
    var [key, list] = getArgs(value);
    return Promise.all(
      list.map(item =>
        vars({ vars: { [key]: item }, undefined: () => {} })(body.clone())
      )
    );
  },
  macro(value, body) {
    var [name, args] = getArgs(value);
    functions[name] = function(...vals) {
      args.forEach((arg, ix) => {
        body.toString().replace(/arg/, vals[ix]);
      });
      return body;
    };
  }
};

postcss([
  postcss.plugin("my-plugin", o => css => {
    css.walkAtRules(rule => {
      var before = rule.parent;
      var after = before.clone();

      var at = before.index(rule);
      while (rule.next()) {
        rule.next().remove();
      }
      rule.remove();

      var afterRule = after.nodes[at];
      while (afterRule.prev()) {
        afterRule.prev().remove();
      }
      afterRule.remove();

      let varss;
      let functions = {};

      postcss([
        vars({
          onVariables: v => {
            varss = v;
          }
        }),
        pFunctions({
          functions: () => functions
        })
      ])
        .process(before)
        .then(result => {
          console.log(result.root, varss);
          console.log([rule, after].map(r => r.toString()));
        });
    });
    return postcss([
      vars({
        onVariables: vars => console.log(vars)
      })
    ]).process(css);
  })()
])
  .process(
    `
    $myVar: help(7);

    .example{
      color: fn($myVar)
    }

    @rule {
      .cls {
        prop: $myVar;
      }
    }
  `
  )
  .then(result => console.log(result.css));
