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
        ('${districtName},${stateId},${cases},${cured},${active},${deaths});`;
  const dbResponse = await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

module.exports = app;
