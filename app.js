const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running on http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT 
        *
    FROM 
        state
    ORDER BY 
        state_id;`;
  let states = await db.all(getStatesQuery);
  response.send(
    states.map((item) => {
      return {
        stateId: item.state_id,
        stateName: item.state_name,
        population: item.population,
      };
    })
  );
});
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT 
        *
    FROM 
        state
    WHERE 
        state_id=${stateId};`;
  const state = await db.get(getStateQuery);
  response.send({
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  });
});
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
    INSERT INTO
        district(district_name,state_id,cases,cured,active,deaths)
    VALUES
        ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const dbResponse = await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  let deleteDistrictQuery = `
    DELETE FROM 
        district
    WHERE district_id=${districtId};`;
  const dbResponse = await db.run(deleteDistrictQuery);
  response.send("District Removed");
});
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT 
        *
    FROM 
        district
    WHERE 
        district_id=${districtId}`;
  const district = await db.get(getDistrictQuery);
  response.send({
    districtId: district.district_id,
    districtName: district.district_name,
    stateId: district.state_id,
    cases: district.cases,
    cured: district.cured,
    active: district.active,
    deaths: district.deaths,
  });
});
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const putDistrictQuery = `
    UPDATE district
    SET
        district_name='${districtName}',
        state_id=${stateId},
        cases=${cases},
        cured=${cured},
        active=${active},
        deaths=${deaths}
    WHERE 
        district_id=${districtId};`;
  let dbResponse = await db.run(putDistrictQuery);
  response.send("District Details Updated");
});
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT 
        state_id,
        SUM(cases) as total_cases,
        SUM(cured) as total_cured,
        SUM(active) as total_active,
        SUM(deaths) as total_deaths
    FROM 
        district
    GROUP BY 
        state_id
    HAVING 
        state_id=${stateId} ;`;
  let state = await db.get(getStateQuery);
  response.send({
    totalCases: state.total_cases,
    totalCured: state.total_cured,
    totalActive: state.total_active,
    totalDeaths: state.total_deaths,
  });
});
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateQuery = `
    SELECT 
        T.state_name as state_name
    FROM 
        (district 
        INNER JOIN state 
        ON district.state_id=state.state_id) as T
    WHERE 
        district_id=${districtId};`;
  const state = await db.get(getStateQuery);
  response.send({
    stateName: state.state_name,
  });
});
module.exports = app;
