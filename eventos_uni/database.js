const mysql = require("mysql");

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "AW_24",
    port: 3307
});

module.exports = pool;