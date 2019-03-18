const sum = require("./math").sum;

const write = () => "webpack!" + sum(1, 3);

document.body.innerHTML = write();
