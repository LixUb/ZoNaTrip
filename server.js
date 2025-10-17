const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "webuser",
  password: "Vie0001p",
  database: "formdb",
});


db.connect(err => {
  if (err) throw err;
  console.log("✅");
});
app.post("/submit", (req, res) => {
  const { nama, email, checkin, tamu } = req.body;

  const sql = "INSERT INTO pendaftar (nama, email, checkin, tamu) VALUES (?, ?, ?, ?)";
  db.query(sql, [nama, email, checkin, tamu], (err) => {
    if (err) {
      console.error("❌ fail:", err);
      res.status(500).send("fail");
    } else {
      res.send("✅ stored");
    }
  });
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
