const fs = require('fs');
const proj4 = require('proj4');

fs.readFile('./assets/PSInSAR_Epsilon_1tys.txt', 'utf8', (err, data) => {
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
        const cords = proj4('+proj=tmerc +lat_0=0 +lon_0=15 +k=0.999923 +x_0=5500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs','EPSG:4326',[parseFloat(el.X2000), parseFloat(el.Y2000)]);
        el.coordinates = { lat: cords[1], lng: cords[0] }
    });

    fs.writeFile('./assets/sample_data_small.json', JSON.stringify(wynik), err => {
        if (err) console.log(err);
    });
});
