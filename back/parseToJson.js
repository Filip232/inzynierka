const fs = require('fs');
const proj4 = require('proj4');

const projections = {
  '2176': '+proj=tmerc +lat_0=0 +lon_0=15 +k=0.999923 +x_0=5500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  '2177': '+proj=tmerc +lat_0=0 +lon_0=18 +k=0.999923 +x_0=6500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  '2178': '+proj=tmerc +lat_0=0 +lon_0=21 +k=0.999923 +x_0=7500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  '2179': '+proj=tmerc +lat_0=0 +lon_0=24 +k=0.999923 +x_0=8500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  '4326': '+proj=longlat +datum=WGS84 +no_defs',
}

const myFunc = (path, cb) => {
  fs.readFile(path, 'utf8', function(err, data){
    if(err) throw err;
    cb(data);
  });
}

const parseToJson = (filePath, fileName, coordinateSystem) => {
  return myFunc(filePath, data => {
    console.log('elko2')
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
      const cords = proj4( projections[coordinateSystem], 'EPSG:4326', [parseFloat(el.X2000), parseFloat(el.Y2000)]);
      el.coordinates = { lat: cords[1], lng: cords[0] }
    });
  
    return JSON.stringify(wynik);

    // await fs.writeFile(`./parsed/${fileName.slice(0, -4)}.json`, JSON.stringify(wynik), err => {
    //   if (err) console.log(err);
    // });
  });
}

module.exports = parseToJson;
