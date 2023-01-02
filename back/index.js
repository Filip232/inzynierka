const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const fs = require('fs');
const parseToJson = require('./parseToJson.js');
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

const myFunc = (path, cb) => {
  fs.readFile(path, 'utf8', function(err, data){
    if(err) throw err;
    cb(data);
  });
};

app.get('/', (req, res) => {
  const data = require(`./parsed/${req.query.filename.slice(0, -4)}.json`);
  return res.send(data);
});

app.post('/', async (req, res) => {
  const file = req.files.files;
  const filePath = './uploads/' + file.name;
  await fs.writeFile(filePath, file.data, err => {
    if (err) return console.log(err);
  });
  
  console.log(req.body.coordinateSystem);

  // const data = await parseToJson(filePath, file.name, String(req.body.coordinateSystem));
  // console.log(data);
  
  myFunc(filePath, data => {
    const file = data.split('\n');
    const ready = [];
    file.forEach(el => ready.push(el.replace('\r', '').split('\t')));
    const siema = ready.flat();
    const wynik = [];
    for(let i = 8; i < siema.length; i += 8) {
      if(!siema[i]) continue;
      wynik.push({
        fid: siema[i],
        X2000: siema[i+1],
        Y2000: siema[i+2],
        v_m: siema[i+3],
        ALD_m: siema[i+4],
        Exx: parseFloat(siema[i+5].replace(',', '.')),
        Eyy: parseFloat(siema[i+6].replace(',', '.')),
        Yxy: parseFloat(siema[i+7].replace(',', '.')),
      });
    }
    wynik.forEach(el => {
      const cords = proj4('EPSG:4326', projections[String(req.body.coordinateSystem)], [parseFloat(el.X2000), parseFloat(el.Y2000)]);
      el.coordinates = { lat: cords[1], lng: cords[0] }
    });
  
    return res.status(200).send(JSON.stringify(wynik));
  });
  
  // return res.status(200).send('File uploaded');
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
