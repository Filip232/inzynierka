<template>
  <div :class="$styleUtils['flex']">
    <div :class="[$styleUtils['flex'], $styleUtils['f-col']]">
      <form ref="formElement" :class="$style['settings-panel']" @submit.prevent="sendData">
        <label>
          Choose file with points
          <input ref="fileInput" type="file" />
        </label>
        <label>
          Choose coordinate system
          <select v-model="form.coordinateSystem">
            <option value="2176">Strefa V - EPSG: 2176</option>
            <option value="2177">Strefa VI - EPSG: 2177</option>
            <option value="2178">Strefa VII - EPSG: 2178</option>
            <option value="2179">Strefa VIII - EPSG: 2179</option>
            <option value="4326">WGS 84 - EPSG: 4326</option>
          </select>
        </label>
        <button>Upload file</button>
      </form>
      <div :class="$style['plot-wrapper']">
        <span v-if="!firstPlotGenerated">Choose point and open plot to see result here</span>
        <div ref="plotDiv" />
      </div>
    </div>
    <div :class="$style['map-wrapper']">
      <div ref="myMap" style="width: 40vw; height: 90vh"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, onMounted } from 'vue';
import Plotly from 'plotly.js-dist-min';
import { Loader } from 'google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

import type { Layout, Root, PlotType } from 'plotly.js-dist-min';
import type { Marker, Map, InfoWindow } from 'google.maps';

export default defineComponent({
  name: 'Home',
  setup() {
    const tensorData = ref({});
    const infoWindowOpened: Ref<string> = ref('');
    const firstPlotGenerated = ref(false);
    const sample_data: Ref<{
      fid: string,
      X2000: string,
      Y2000: string,
      v_m: string,
      ALD_m: string,
      Exx: number,
      Eyy: number,
      Yxy: number,
      coordinates: {
        lat: number,
        lng: number
      }
    }[] | []> = ref([]);
    const form: Ref<{ file: File | undefined, coordinateSystem: string }> = ref({
      file: undefined,
      coordinateSystem: '2176'
    });
    const fileInput: Ref<undefined | HTMLInputElement> = ref(undefined);
    const myMap: Ref<Element | null> = ref(null);
    const plotDiv: Ref<Root | null> = ref(null);
    const formElement: Ref<HTMLFormElement | null> = ref(null);
    let map: Map | undefined = undefined;
    let infoWindow: InfoWindow | undefined = undefined;
    let markerClusterer: MarkerClusterer | undefined = undefined;

    const getMax = (arr: number[]) => {
      let max = 0;
      arr.forEach(el => {
        if (max - Math.abs(el) < 0) {
          max = Math.abs(el);
        }
      });
      return max;
    }

    const getTensor = (Exx: number, Eyy: number, Yxy: number) => {
      const tensorPlus: {
        x: number[],
        y: number[],
        text: string[],
        hoverTemplate: string,
        type: PlotType,
        line: { color: string },
        name: string
      } = {
        x: [],
        y: [],
        text: [],
        hoverTemplate: `<p>$%{text}</p>`,
        type: 'scatter',
        line: {
          color: 'orange'
        },
        name: 'tensor value >= 0'
      };

      const tensorMinus: {
        x: number[],
        y: number[],
        text: string[],
        hoverTemplate: string,
        type: PlotType,
        line: { color: string },
        name: string
      } = {
        x: [],
        y: [],
        text: [],
        hoverTemplate: `<p>$%{text}</p>`,
        type: 'scatter',
        line: {
          color: 'blue'
        },
        name: 'tensor value < 0'
      };

      for(let i = 0; i < 360; ++i) {
        const rad = (i*2*Math.PI)/360;
        const tens = Exx * (Math.cos(rad)*Math.cos(rad)) + 2*Yxy * Math.sin(rad)*Math.cos(rad) + Eyy * Math.sin(rad) * Math.sin(rad);
        if (tens >= 0) {
          tensorPlus.x.push(tens * Math.cos(rad));
          tensorPlus.y.push(tens * Math.sin(rad));
          tensorPlus.text.push(`Tensor value: ${tens.toFixed(2)}<br>
          Angle: ${i}°`);
        } else {
          tensorMinus.x.push(tens * Math.cos(rad));
          tensorMinus.y.push(tens * Math.sin(rad));
          tensorMinus.text.push(`Tensor value: ${tens.toFixed(2)}<br>
          Angle: ${i}°`);
        }
      }
      tensorData.value = tensorPlus;

      let max = 0;

      max = getMax(tensorPlus.x);
      if (getMax(tensorPlus.y) > max) {
        max = getMax(tensorPlus.y);
      }
      if (getMax(tensorMinus.x) > max) {
        max = getMax(tensorMinus.x);
      }
      if (getMax(tensorMinus.y) > max) {
        max = getMax(tensorMinus.y);
      }

      const layout = {
        title: 'Tensor plot',
        width: window.innerWidth * 0.35,
        height: window.innerWidth * 0.35,
        xaxis: {range: [-max - max * 0.05, max + max * 0.05]},
        yaxis: {range: [-max - max * 0.05, max + max * 0.05]},
        showlegend: true,
        legend: {
          orientation: 'h' as Layout['legend']['orientation']
        }
      };

      const plotData = [];
      
      firstPlotGenerated.value = true;

      plotData.push(tensorPlus);
      plotData.push(tensorMinus);
      if(!plotDiv.value) return;
      Plotly.newPlot(plotDiv.value, plotData, layout);
      infoWindowOpened.value = '';
    }

    const sendData = async () => {
      if (fileInput.value?.files === null || !fileInput.value?.files.length) return;

      const data = new FormData()
      for (const file of fileInput.value.files) {
        data.append('files',file,file.name)
      }
      data.append('coordinateSystem',form.value.coordinateSystem);
      fetch('http://localhost:3000', {
        method: 'POST',
        body: data
      })
      .then(response => response.json())
      .then(data => sample_data.value = data)
      .then(() => {
        const markers: Marker[] = [];
        sample_data.value.forEach(el => {
          const marker = new google.maps.Marker({
            position: el.coordinates,
          })
          marker.addListener('click', () => {
            infoWindow.setContent(`
              <span>fid: ${el.fid}</span><br>
              <span>v: ${el.v_m}</span><br>
              <span>ALD: ${el.ALD_m}</span><br>
              <span>Exx: ${el.Exx}</span><br>
              <span>Eyy: ${el.Eyy}</span><br>
              <span>Yxy: ${el.Yxy}</span><br>
            `);
            infoWindow.open(map, marker);
            getTensor(el.Exx, el.Eyy, el.Yxy);
          });
          markers.push(marker);
        });
        markerClusterer?.addMarkers(markers);
      })
      .then(() => {
        formElement.value?.reset();
      })
    }

    onMounted(async () => {
      const loader = new Loader('AIzaSyBrxUBoh0RlB9g6JxTbSRrrLhFMxAm2g3U', {});
      const google = await loader.load();
      if(!myMap.value) return;
      map = new google.maps.Map(myMap.value, {
        center: { lat: 51.590579090167824, lng: 15.9855280937882 },
        zoom: 1,
        mapTypeId: 'satellite'
      });
      infoWindow = new google.maps.InfoWindow({
        content: '',
        disableAutoPan: true,
      });
      markerClusterer = new MarkerClusterer({ map });
    });

    return {
      sample_data,
      getTensor,
      tensorData,
      infoWindowOpened,
      firstPlotGenerated,
      form,
      sendData,
      fileInput,
      myMap,
      plotDiv,
      formElement,
    }
  }
});
</script>

<style src="@/assets/styles/utils.module.scss" lang="scss" module="$styleUtils"></style>

<style lang="scss" module>
.map-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 50%;
}

.point-info-window {
  display: flex;
  flex-flow: column;
  padding: 5px;
}

.open-plot-btn {
  display: block;
  padding: 3px 6px;
  margin-top: 8px;
  border: none;
  background-color: #ddd;
  cursor: pointer;
}

.plot-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 70vh;
  border: 2px black solid;
  border-bottom: none;
  border-left: none;
}

.settings-panel {
  display: flex;
  flex-flow: column;
  justify-content: space-between;
  align-items: center;
  height: 25vh;
  width: 45vw;
  padding: 20px 30px;
  box-sizing: border-box;
  border-right: 2px black solid;
}
</style>
