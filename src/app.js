const path = require("path");
const express = require("express");
const hbs = require("hbs");
const dayjs = require("dayjs");
const hlQuery = require("./query");

const app = express();

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, "../public");
const viewsPath = path.join(__dirname, "../templates/views");
const partialsPath = path.join(__dirname, "../templates/partials");

// Setup handlebars engine and views location
app.set("view engine", "hbs");
app.set("views", viewsPath);
hbs.registerPartials(partialsPath);

// Setup static directory to serve
app.use(express.static(publicDirectoryPath));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

hbs.registerHelper("setSelected", function (item, selectedVal) {
  if (item == selectedVal) return "selected";
  else return "";
});

const getYearList = () => {
  const currentYear = new Date().getFullYear();
  const yearList = [];
  for (let i = -3; i <= 3; i++) {
    yearList.push(currentYear + i);
  }
  return yearList;
};

const getHolidayType = (hType) => {
  var type = "";
  switch (hType) {
    case "O":
      type = "Optional";
      break;
    case "F":
      type = "Fixed";
      break;
    default:
      type = "Invalid";
  }
  return type;
};

const getHolidayLoc = (hLoc) => {
  var location = "";
  switch (hLoc) {
    case "All":
      location = "All Locations";
      break;
    case "IND":
      location = "India";
      break;
    case "USA":
      location = "United States of America";
      break;
    default:
      location = "Invalid";
  }
  return location;
};

const getYearFromDate = (date) => {
  return date.substring(0, 4);
};

const getViewData = (req) => {
  return (holiday = {
    HOLIDAY_ID: req.body.hId,
    HOLIDAY: req.body.hDate,
    HOLIDAY_DESC: req.body.hDesc,
    HOLIDAY_TYPE: req.body.hType,
    LOC_CD: req.body.hLoc,
  });
};

const dbConnected = () => hlQuery.checkDBConnection();

app.get("/", async (req, res) => {
  let failureMsg = "";
  let year = "";
  if (!req.query.year) {
    year = new Date().getFullYear();
  } else {
    year = req.query.year;
  }
  if (!dbConnected()) {
    res.render("holidayList", {
      failureMsg: "Database is not connected!",
      yearList: getYearList(),
    });
    return;
  }
  const holidays = await hlQuery.getAllHolidaysForYear(year);
  holidays.map((obj, i) => {
    obj.HOLIDAY = dayjs(obj.HOLIDAY).format("MM/DD/YYYY");
    obj.HOLIDAY_TYPE = getHolidayType(obj.HOLIDAY_TYPE);
    obj.LOC_CD = getHolidayLoc(obj.LOC_CD);
  });

  if (holidays.length == 0) {
    failureMsg = "No holidays found for selected year:";
  }
  const pageData = {
    title: "Holiday List",
    yearList: getYearList(),
    failureMsg: failureMsg,
    selectedYear: year,
    holidayData: holidays,
  };
  res.render("holidayList", pageData);
});

app.get("/holidays/view/:id", async (req, res) => {
  if (!dbConnected()) {
    res.render("holidayList", { failureMsg: "Database is not connected!" });
    return;
  }
  const holiday = await hlQuery.findHolidayById(req.params.id);
  holiday[0].HOLIDAY = dayjs(holiday[0].HOLIDAY).format("YYYY-MM-DD");
  const pageData = {
    title: "Holidays Detail",
    readOnly: true,
    newRecord: false,
    selectedYear: getYearFromDate(holiday[0].HOLIDAY.toString()),
    holidayData: holiday[0],
  };
  res.render("holidayDetail", pageData);
});

app.get("/holidays/update/:id", async (req, res) => {
  if (!dbConnected()) {
    res.render("holidayList", { failureMsg: "Database is not connected!" });
    return;
  }
  const holiday = await hlQuery.findHolidayById(req.params.id);
  holiday[0].HOLIDAY = dayjs(holiday[0].HOLIDAY).format("YYYY-MM-DD");
  const pageData = {
    title: "Holidays Detail",
    newRecord: false,
    readOnly: false,
    selectedYear: getYearFromDate(holiday[0].HOLIDAY.toString()),
    holidayData: holiday[0],
  };
  res.render("holidayDetail", pageData);
});

app.post("/holidays/view", async (req, res) => {
  const hlSelectedYear = req.body.hlSelectedYear;
  if (!dbConnected()) {
    res.render("holidayDetail", {
      readOnly: true,
      newRecord: false,
      failureMsg: "Database is not connected!",
      selectedYear: hlSelectedYear,
    });
    return;
  }
  const holiday = await hlQuery.findHolidayById(req.body.hId);
  holiday[0].HOLIDAY = dayjs(holiday[0].HOLIDAY).format("YYYY-MM-DD");
  pageData = {
    title: "Holidays Detail",
    readOnly: true,
    newRecord: false,
    selectedYear: hlSelectedYear,
    holidayData: holiday[0],
  };
  res.render("holidayDetail", pageData);
});

app.post("/holidays/update", async (req, res) => {
  let pageData = {};
  const hlSelectedYear = req.body.hlSelectedYear;
  if (!dbConnected()) {
    pageData.holidayData = getViewData(req);
    pageData.failureMsg = "Database is not connected!";
    pageData.selectedYear = hlSelectedYear;
    res.render("holidayDetail", pageData);
    return;
  }
  const holiday = await hlQuery.findHolidayById(req.body.hId);
  holiday[0].HOLIDAY = dayjs(holiday[0].HOLIDAY).format("YYYY-MM-DD");
  pageData = {
    title: "Holidays Detail",
    newRecord: false,
    readOnly: false,
    selectedYear: hlSelectedYear,
    holidayData: holiday[0],
  };
  res.render("holidayDetail", pageData);
});

app.post("/holidays/new", (req, res) => {
  if (!dbConnected()) {
    res.render("holidayList", { failureMsg: "Database is not connected!" });
    return;
  }
  const hlSelectedYear = req.body.year;
  const pageData = {
    title: "Holidays Detail",
    readOnly: false,
    newRecord: true,
    selectedYear: hlSelectedYear,
    holidayData: {
      HOLIDAY_ID: "",
      HOLIDAY: "",
      HOLIDAY_DESC: "",
      HOLIDAY_TYPE: "",
      LOC_CD: "",
    },
  };
  res.render("holidayDetail", pageData);
});

app.post("/holidays/create", async (req, res) => {
  const pageData = {};
  const holiday = {
    HOLIDAY: req.body.hDate,
    HOLIDAY_DESC: req.body.hDesc,
    HOLIDAY_TYPE: req.body.hType,
    LOC_CD: req.body.hLoc,
  };
  pageData.title = "Holidays Detail";
  pageData.readOnly = false;
  pageData.newRecord = false;
  pageData.holidayData = holiday;
  pageData.selectedYear = req.body.hlSelectedYear;
  if (!dbConnected()) {
    holiday.HOLIDAY_ID = req.body.hId;
    if (req.body.hId == "") {
      pageData.newRecord = true;
    }
    pageData.failureMsg = "Database is not connected!";
    res.render("holidayDetail", pageData);
    return;
  }

  if (
    holiday.HOLIDAY == "" ||
    holiday.HOLIDAY_DESC == "" ||
    holiday.HOLIDAY_TYPE == "" ||
    holiday.LOC_CD == ""
  ) {
    pageData.newRecord = true;
    pageData.failureMsg = "All fields are required!";
    res.render("holidayDetail", pageData);
    return;
  }

  const result = await hlQuery.findHoliday(holiday);
  // Insert Flow
  if (req.body.hId == "") {
    if (result.length > 0) {
      pageData.failureMsg = "Duplicate Found!";
      pageData.newRecord = true;
    } else {
      const result = await hlQuery.createHoliday(holiday);
      if (result) {
        holiday.HOLIDAY_ID = result.insertId;
        pageData.successMsg = "Holiday created successfully!";
      }
    }
  } else {
    //Update flow
    holiday.HOLIDAY_ID = req.body.hId;
    if (result[0] && holiday.HOLIDAY_ID != result[0].HOLIDAY_ID) {
      pageData.failureMsg = "Duplicate Found!";
    } else {
      const result = await hlQuery.updateHolidayById(holiday);
      if (result) {
        pageData.successMsg = "Holiday record update successful";
        pageData.selectedYear = req.body.hlSelectedYear;
      } else {
        pageData.successMsg = "No update in holiday record";
      }
    }
  }
  res.render("holidayDetail", pageData);
});
app.post("/holidays/delete", async (req, res) => {
  if (!dbConnected()) {
    res.render("holidayDetail", { failureMsg: "Database is not connected" });
    return;
  }
  const result = await hlQuery.deleteHolidayById(req.body.hId);
  if (result) {
    res.redirect("/?year=" + getYearFromDate(req.body.hDate));
  }
});

app
  .listen(3000, () => {
    console.log("app is running on port 3000");
  })
  .on("error", function (err) {
    console.log("address already in use -> 3000");
    process.exit(1);
  });
