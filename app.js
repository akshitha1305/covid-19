const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initilalizeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running On http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initilalizeDbAndServer();

//Get States
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT *
    FROM state;
    `;
  const stateDetails = await db.all(getStatesQuery);

  let arr = [];

  const convertSnakeCaseToCamelCase = (dbObject) => {
    return {
      stateId: dbObject.state_id,
      stateName: dbObject.state_name,
      population: dbObject.population,
    };
  };
  for (let each of stateDetails) {
    const a = convertSnakeCaseToCamelCase(each);
    arr.push(a);
  }
  response.send(arr);
});

//Get a state
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT *
    FROM state
    WHERE state_id = ${stateId};
    `;
  const dbResponse = await db.get(getStateQuery);

  const convertSnakeCaseToCamelCase = (dbObject) => {
    return {
      stateId: dbObject.state_id,
      stateName: dbObject.state_name,
      population: dbObject.population,
    };
  };
  response.send(convertSnakeCaseToCamelCase(dbResponse));
});

//Post a state
app.post("/districts/", async (request, response) => {
  const stateDetails = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = stateDetails;
  const postQuery = `
    INSERT INTO district(district_name, state_id, cases, cured, active, deaths)
    VALUES(
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );
    `;
  const dbResponse = await db.run(postQuery);
  response.send("District Successfully Added");
});

//Get a district
app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT *
    FROM district
    WHERE district_id = ${districtId};
    `;

  const districtDetails = await db.get(getDistrictQuery);

  let arr = [];

  const convertSnakeCaseToCamelCase = (dbObject) => {
    return {
      districtId: dbObject.district_id,
      districtName: dbObject.district_name,
      stateId: dbObject.state_id,
      cases: dbObject.cases,
      cured: dbObject.cured,
      active: dbObject.active,
      deaths: dbObject.deaths,
    };
  };
  response.send(convertSnakeCaseToCamelCase(districtDetails));
});

//Delete District
app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
    DELETE FROM district
    WHERE district_id = ${districtId};
    `;

  await db.run(deleteQuery);
  response.send("District Removed");
});

//Update District
app.put("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const putQuery = `
    UPDATE district
    SET district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    WHERE district_id = ${districtId};
    `;
  await db.run(putQuery);
  response.send("District Details Updated");
});

//get statistics of total cases, active, deaths based on state_id
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatisticsQuery = `
    SELECT SUM(cases) AS totalCases,
    SUM(cured) AS totalCured,
    SUM(active) AS totalActive,
    SUM(deaths) AS totalDeaths
    FROM state INNER JOIN district ON state.state_id = district.state_id 
    WHERE state.state_id = ${stateId}
    ORDER BY state.state_id;
    `;
  const dbResponse = await db.get(getStatisticsQuery);
  response.send(dbResponse);
});

//Get statename based on the district id
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNames = `
    SELECT state_name
    FROM state INNER JOIN district ON state.state_id = district.state_id 
    WHERE district_id = ${districtId};
    `;
  const dbResponse = await db.get(getStateNames);

  const convertSnakeCaseTOCamelCase = (dbObject) => {
    return {
      stateName: dbObject.state_name,
    };
  };

  response.send(convertSnakeCaseTOCamelCase(dbResponse));
});

module.exports = app;
