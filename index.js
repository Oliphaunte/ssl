const https = require("https");
const FileSystem = require("fs");
const { PromisePool } = require("@supercharge/promise-pool");
const data = require("./data.js");

const query = (item) => {
  let options = {
    hostname: item,
    port: 443,
    method: "GET",
  };

  console.log(`Query for ${item}...`);
  // Wait until we get a response from the site and then return the results of the cert lookup
  return new Promise((resolve, reject) => {
    let req = https.request(options, (res) => {
      let cert = res.socket.getPeerCertificate();

      if (cert) {
        resolve({ url: item, ssl: true });
      } else {
        resolve({ url: item, ssl: false });
      }
    });

    // reject on request error
    req.on("error", (err) => {
      resolve({ url: item, ssl: false });
    });

    // IMPORTANT
    req.end();
  });
};

const queries = async () => {
  console.log("Starting the query...");

  const { results, errors } = await PromisePool.for(data)
    .withConcurrency(10)
    .process(query);

  // Pretty print the JSON response
  FileSystem.writeFile(
    "output.json",
    JSON.stringify({ results: results }, null, "\t"),
    (error) => {
      if (error) throw error;
    }
  );

  console.log("Query has ended. Check output.js for data");
};

queries();
