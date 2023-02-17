var mysql = require("mysql");

var connection;
var connectedFlag = false;

var dbConfig = {
  host: "localhost",
  user: "root",
  password: "admin123",
  database: "HolidayDB",
};

const isConnected = () => connectedFlag;
const getConnection = () => connection;

const handleDisconnect = () => {
  connection = mysql.createConnection(dbConfig);
  connection.connect(function (err) {
    if (err) {
      console.log("Database is Disconnected");
      setTimeout(handleDisconnect, 2000);
    } else {
      console.log("Database is Connected!");
      connectedFlag = true;
    }
  });
  connection.on("error", function (err) {
    console.log("Database connection lost");
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      connectedFlag = false;
      handleDisconnect();
    } else {
      throw err;
    }
  });
};
handleDisconnect();

module.exports = {
  getConnection,
  isConnected,
};
