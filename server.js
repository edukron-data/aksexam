const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SUBMISSIONS_FILE = path.join(__dirname, 'submissions.json');

function readSubmissions(){
  try{
    const raw = fs.readFileSync(SUBMISSIONS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  }catch(e){
    return [];
  }
}

function writeSubmissions(arr){
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(arr, null, 2));
}

app.post('/submit', (req, res) => {
  const payload = req.body;
  if(!payload || !payload.submittedAt){
    return res.status(400).json({error: 'invalid payload'});
  }
  const subs = readSubmissions();
  subs.push(payload);
  writeSubmissions(subs);
  return res.json({ok:true, count: subs.length});
});

app.get('/submissions', (req, res) => {
  const subs = readSubmissions();
  res.json({count: subs.length, submissions: subs});
});

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log(`Submission server listening on http://localhost:${port}`));
