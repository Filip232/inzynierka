<template>
  <form>
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
  <div :class="$style['map-wrapper']">
    <GMapMap
        :center="center"
        :zoom="15"
        map-type-id="terrain"
        style="width: 1000px; height: 800px"
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
            <span v-text="`Point fid: ${point.fid}`" />
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
  <div v-show="isPlotVisible" :class="$style['plot-wrapper']">
    <button type="button" :class="$style['close-btn']" @click="isPlotVisible = false"/>
    <div id="myDiv" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, onBeforeUnmount } from 'vue';
import Plotly from 'plotly.js-dist-min';

export default defineComponent({
  name: 'HomeView',
  setup() {
    const tensorData = ref({});
    const infoWindowOpened: Ref<string> = ref('')
    const isPlotVisible = ref(false);
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
        width: window.innerHeight,
        height: window.innerHeight - 100,
        xaxis: {range: [-max - max * 0.05, max + max * 0.05]},
        yaxis: {range: [-max - max * 0.05, max + max * 0.05]},
        showlegend: true,
      };

      const plotData = [];
      
      plotData.push(tensorPlus);
      plotData.push(tensorMinus);
      isPlotVisible.value = true;
      Plotly.newPlot('myDiv', plotData, layout);
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

    const closeOnEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        isPlotVisible.value = false;
      }
    };

    window.addEventListener('keyup', closeOnEsc);

    onBeforeUnmount(() => {
      window.removeEventListener('keyup', closeOnEsc);
    });

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
      isPlotVisible,
      infoWindowOpened,
      console
    }
  }
});
</script>

<style lang="scss" module>
.map-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 50px;
}

.plot-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-color: #fff;
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

.close-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  height: 30px;
  width: 30px;
  border: none;
  background-color: transparent;
  cursor: pointer;

  &::after {
    position: absolute;
    content: '';
    top: -2px;
    left: 12px;
    height: 30px;
    width: 3px;
    transform: rotate(45deg);
    background-color: #000;
  }

  &::before {
    position: absolute;
    content: '';
    top: -2px;
    left: 12px;
    height: 30px;
    width: 3px;
    transform: rotate(-45deg);
    background-color: #000;
  }
}
</style>
