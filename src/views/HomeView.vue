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
      />
    <!-- </GMapCluster> -->
  </GMapMap>
</template>

<script lang="ts">
import { defineComponent, ref, Ref } from 'vue';

export default defineComponent({
  name: 'HomeView',
  setup() {
    const sample_data: Ref<{
      fid: string,
      X2000: string,
      Y2000: string,
      v_m: string,
      ALD_m: string,
      Exx: string,
      Eyy: string,
      Yxy: string,
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
      sample_data
    }
  }
});
</script>
