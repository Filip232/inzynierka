<template>
  <div :class="$styleUtils['flex']">
    <div :class="[$styleUtils['flex'], $styleUtils['f-col']]">
      <form :class="$style['settings-panel']">
        <label v-text="'Choose file with points'"/>
        <input type="file" />
        <label v-text="'Choose coordinate system'"/>
        <select>
          <option>Strefa V - EPSG: 2176</option>
          <option>Strefa VI - EPSG: 2177</option>
          <option>Strefa VII - EPSG: 2178</option>
          <option>Strefa VIII - EPSG: 2179</option>
          <option>WGS 84 - EPSG: 4326</option>
        </select>
        <button>Upload file</button>
      </form>
      <div :class="$style['plot-wrapper']">
        <div id="myDiv" />
      </div>
    </div>
    <div :class="$style['map-wrapper']">
      <GMapMap
          :center="center"
          :zoom="14"
          map-type-id="terrain"
          style="width: 40vw; height: 90vh"
      >
        <!-- <GMapCluster> -->
          <GMapMarker
              :key="point.fid"
              v-for="point in sample_data"
              :position="point.coordinates"
              :clickable="true"
              @click="infoWindowOpened = point.fid"
          >
            <GMapInfoWindow
              :class="$style['point-info-window']"
              :opened="infoWindowOpened === point.fid"
            >
              <span v-text="`fid: ${point.fid}`" />
              <span v-text="`v: ${point.v_m}`" />
              <span v-text="`ALD: ${point.ALD_m}`" />
              <span v-text="`Exx: ${point.Exx}`" />
              <span v-text="`Eyy: ${point.Eyy}`" />
              <span v-text="`Yxy: ${point.Yxy}`" />
              <button type="button"
                :class="$style['open-plot-btn']"
                @click="getTensor(point.Exx, point.Eyy, point.Yxy)"
              >
                Open plot
              </button>
            </GMapInfoWindow>
          </GMapMarker>
        <!-- </GMapCluster> -->
      </GMapMap>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref } from 'vue';
import Plotly from 'plotly.js-dist-min';
import { Layout } from 'plotly.js';

export default defineComponent({
  name: 'HomeView',
  setup() {
    const tensorData = ref({});
    const infoWindowOpened: Ref<string> = ref('')
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

    const getSampledata = () => {
      fetch('http://localhost:3000')
        .then(response => response.json())
        .then(data => {sample_data.value = data; console.log(data)});;
    }

    const getTensor = (Exx: number, Eyy: number, Yxy: number) => {
      const tensorPlus: any = {
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

      const tensorMinus: any = {
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
          orientation: "h" as Layout['legend']['orientation']
        }
      };

      const plotData = [];
      
      plotData.push(tensorPlus);
      plotData.push(tensorMinus);
      Plotly.newPlot('myDiv', plotData, layout);
      infoWindowOpened.value = '';
    }

    const getMax = (arr: []) => {
      let max = 0;
      arr.forEach(el => {
        if (max - Math.abs(el) < 0) {
          max = Math.abs(el);
        }
      });
      return max;
    }

    getSampledata();

    return {
      center: {lat: 51.590579090167824, lng: 15.9855280937882},
      markers: [
        {
          position: {
            lat: 51.580579090167824, lng: 16.00515280937882
          },
        }
      ],
      sample_data,
      getTensor,
      tensorData,
      infoWindowOpened,
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

// .close-btn {
//   position: fixed;
//   top: 20px;
//   right: 20px;
//   height: 30px;
//   width: 30px;
//   border: none;
//   background-color: transparent;
//   cursor: pointer;

//   &::after {
//     position: absolute;
//     content: '';
//     top: -2px;
//     left: 12px;
//     height: 30px;
//     width: 3px;
//     transform: rotate(45deg);
//     background-color: #000;
//   }

//   &::before {
//     position: absolute;
//     content: '';
//     top: -2px;
//     left: 12px;
//     height: 30px;
//     width: 3px;
//     transform: rotate(-45deg);
//     background-color: #000;
//   }
// }

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
  height: 25vh;
  padding: 20px 30px;
  box-sizing: border-box;
  border-right: 2px black solid;
}
</style>
