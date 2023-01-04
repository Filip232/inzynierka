const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const proj4 = require('proj4');

const app = express();
const port = 3000;

app.use(cors());
app.use(fileUpload({
  createParentPath: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const projections = {
  '2176': '+proj=tmerc +lat_0=0 +lon_0=15 +k=0.999923 +x_0=5500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  '2177': '+proj=tmerc +lat_0=0 +lon_0=18 +k=0.999923 +x_0=6500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  '2178': '+proj=tmerc +lat_0=0 +lon_0=21 +k=0.999923 +x_0=7500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  '2179': '+proj=tmerc +lat_0=0 +lon_0=24 +k=0.999923 +x_0=8500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  '4326': '+proj=longlat +datum=WGS84 +no_defs',
};

app.get('/', (req, res) => {
  const data = require(`./parsed/${req.query.filename.slice(0, -4)}.json`);
  return res.send(data);
});

app.post('/', async (req, res) => {
  const fileRaw = req.files.files;
  const file = fileRaw.data.toString('utf8').split('\n');
  const ready = [];
  file.forEach(el => ready.push(el.replace('\r', '').split('\t')));
  const parsedFile = ready.flat();
  const result = [];
  for(let i = 8; i < parsedFile.length; i += 8) {
    if(!parsedFile[i]) continue;
    result.push({
      fid: parsedFile[i],
      X2000: parsedFile[i+1],
      Y2000: parsedFile[i+2],
      v_m: parsedFile[i+3],
      ALD_m: parsedFile[i+4],
      Exx: parseFloat(parsedFile[i+5].replace(',', '.')),
      Eyy: parseFloat(parsedFile[i+6].replace(',', '.')),
      Yxy: parseFloat(parsedFile[i+7].replace(',', '.')),
    });
  }
  result.forEach(el => {
    const cords = proj4(projections[String(req.body.coordinateSystem)], 'EPSG:4326', [parseFloat(el.X2000), parseFloat(el.Y2000)]);
    el.coordinates = { lat: cords[1], lng: cords[0] };
  });

  return res.status(200).send(JSON.stringify(result));
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
