const express = require('express');
const app = express();
const cors = require('cors');
const port = 3000;
const sample_data_small = require('./assets/sample_data_small.json');

app.use(cors());

app.get('/', (req, res) => {
  res.send(sample_data_small);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
