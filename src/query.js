const db = require("./database");
var uniqid = require("uniqid");

const checkDBConnection = () => db.isConnected();

const getAllHolidaysForYear = (year) => {
  if (typeof year == "string") year = parseInt(year);
  return new Promise((resolve, reject) => {
    db.getConnection().query(
      "select * from ETT_HOLIDAY where cast(HOLIDAY as char) like '%?%' order by HOLIDAY ASC",
      [year],
      function (err, results, fields) {
        if (err) reject(err);
        resolve(results);
      }
    );
  });
};

const findHoliday = async (holiday) => {
  return new Promise((resolve, reject) => {
    db.getConnection().query(
      "select * from ETT_HOLIDAY where HOLIDAY = ? AND LOC_CD = ?",
      [holiday.HOLIDAY, holiday.LOC_CD],
      function (err, results, fields) {
        if (err) reject(err);
        resolve(results);
      }
    );
  });
};

const findHolidayById = (HOLIDAY_ID) => {
  return new Promise((resolve, reject) => {
    db.getConnection().query(
      "select * from ETT_HOLIDAY where HOLIDAY_ID = ?",
      [HOLIDAY_ID],
      function (err, results, fields) {
        if (err) reject(err);
        resolve(results);
      }
    );
  });
};

const createHoliday = async (newHoliday) => {
  let id = uniqid();
  return new Promise((resolve, reject) => {
    db.getConnection().query(
      "insert into ETT_HOLIDAY \
          (HOLIDAY_ID, ORG_CD, LOC_CD, HOLIDAY, HOLIDAY_TYPE, HOLIDAY_DESC, CRT_BY_USER, UPD_BY_USER, CRT_BY_TS, UPD_BY_TS) \
          values \
          (?,'CBP',?,?,?,?,'mprakash','mprakash',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)",
      [
        id,
        newHoliday.LOC_CD,
        newHoliday.HOLIDAY,
        newHoliday.HOLIDAY_TYPE,
        newHoliday.HOLIDAY_DESC,
      ],
      function (err, results, fields) {
        if (err) reject(err);
        results.insertId = id;
        resolve(results);
      }
    );
  });
};

const updateHolidayById = async (holiday) => {
  return new Promise((resolve, reject) => {
    db.getConnection().query(
      "update ETT_HOLIDAY set LOC_CD = ?, HOLIDAY = ?, HOLIDAY_TYPE = ?, HOLIDAY_DESC= ? where HOLIDAY_ID = ?",
      [
        holiday.LOC_CD,
        holiday.HOLIDAY,
        holiday.HOLIDAY_TYPE,
        holiday.HOLIDAY_DESC,
        holiday.HOLIDAY_ID,
      ],
      function (err, results, fields) {
        if (err) reject(err);
        resolve(results);
      }
    );
  });
};

const deleteHolidayById = async (HOLIDAY_ID) => {
  return new Promise((resolve, reject) => {
    db.getConnection().query(
      "delete from ETT_HOLIDAY where HOLIDAY_ID = ?",
      [HOLIDAY_ID],
      function (err, results, fields) {
        if (err) reject(err);
        resolve(results);
      }
    );
  });
};

module.exports = {
  checkDBConnection,
  getAllHolidaysForYear,
  findHolidayById,
  updateHolidayById,
  createHoliday,
  findHoliday,
  deleteHolidayById,
};
