# AKS Exam Quiz — GitHub Pages static site

This repository contains a static single-page quiz covering Azure DevOps, AKS, and Terraform. It's designed to be hosted on GitHub Pages (or any static host). The quiz supports multiple-choice and text-input questions, and will POST submissions to a configurable backend endpoint.

Files added
- `index.html` — main page
- `style.css` — styling
- `script.js` — quiz logic and submission code
- `questions.json` — question data (includes answers and explanations)

How it collects submissions

- By default the site saves submissions to the user's browser `localStorage` (no backend required).
- To collect results centrally, set `BACKEND_ENDPOINT` at the top of `script.js` to a server endpoint that accepts `POST` JSON submissions.

Example backend options

1) Google Apps Script Web App (quick, requires a Google account)

  - Create a new Apps Script project at https://script.google.com
  - Paste this code and deploy as a web app (execute as: Me, access: Anyone, even anonymous):

```javascript
function doPost(e){
  var data = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.openById('YOUR_SPREADSHEET_ID').getSheetByName('Submissions');
  sheet.appendRow([new Date(), JSON.stringify(data)]);
  return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
}
```

  - Use the deployed web app URL as `BACKEND_ENDPOINT`.

2) Azure Function (HTTP-triggered)

  - Create an HTTP-triggered function that accepts JSON and stores it (e.g., in Azure Table Storage, Blob, or CosmosDB). Example (Node.js):

```javascript
module.exports = async function (context, req) {
  const payload = req.body;
  context.log('Received submission', payload);
  // store payload into storage or DB
  context.res = { status: 200, body: {ok:true} };
};
```

3) Simple Express app (self-hosted) — example

```js
const express = require('express');
const app = express();
app.use(express.json());
app.post('/submit', (req,res)=>{
  console.log('submission', req.body);
  // persist to file/DB
  res.json({ok:true});
});
app.listen(3000);
```

Hosting on GitHub Pages

- Create a repository and push this folder to the `main` branch.
- In repository settings, enable GitHub Pages to serve from the `main` branch (root) or `gh-pages` branch depending on preference.
- The site will be available at `https://<your-username>.github.io/<repo>/`.

Customization

- Edit `questions.json` to update questions, answers, or add topics.
- Update `BACKEND_ENDPOINT` in `script.js` to point to your collection endpoint.

Run backend locally (optional)

If you want to run the provided demo backend locally (for development or to collect submissions on a server you control):

```bash
cd <repo-root>
npm install
npm start
```

By default the Express server listens on port `3000` and exposes an endpoint `POST /submit` that accepts the same JSON payload the frontend sends. For local testing set `BACKEND_ENDPOINT` in `script.js` to `http://localhost:3000/submit`.

Privacy & Security

- Do not embed private API keys or tokens in the frontend — they will be public.
- Use a server-side endpoint to accept and securely store submissions.
# aksexam