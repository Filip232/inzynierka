<template>
  <h1>My app</h1>
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
          @click="getTensor(point.Exx, point.Eyy, point.Yxy)"
      />
    <!-- </GMapCluster> -->
  </GMapMap>
  <div id="myDiv" />
</template>

<script lang="ts">
import { defineComponent, ref, Ref } from 'vue';
import Plotly from 'plotly.js-dist-min';

export default defineComponent({
  name: 'HomeView',
  setup() {
    const tensorData = ref({});
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
      const tensor: any = {
        x: [],
        y: [],
        type: 'scatter',
      };
      for(let i = 0; i < 360; ++i) {
        const rad = (i*2*Math.PI)/360
        tensor.x.push(Exx * (Math.cos(rad)*Math.cos(rad)) + 2*Yxy * Math.sin(rad)*Math.cos(rad) + Eyy * Math.sin(rad) * Math.sin(rad));
        tensor.y.push(Math.sin(rad));
      }
      console.log(tensor);
      tensorData.value = tensor;
      var layout = {
        width: 1000,
        height: 1000
      };
      const elo = [];
      elo.push(tensor)
      Plotly.newPlot('myDiv', elo, layout);
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
    }
  }
});
</script>
