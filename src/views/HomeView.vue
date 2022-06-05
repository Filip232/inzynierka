<template>
  <h1>My app</h1>
  <GMapMap
      :center="center"
      :zoom="7"
      map-type-id="terrain"
      style="width: 500px; height: 300px"
  >
    <GMapCluster>
      <GMapMarker
          :key="index"
          v-for="(m, index) in markers"
          :position="m.position"
          :clickable="true"
          :draggable="true"
          @click="center=m.position"
      />
    </GMapCluster>
  </GMapMap>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'HomeView',
  setup() {
    return {
      center: {lat: 51.093048, lng: 6.842120},
      markers: [
        {
          position: {
            lat: 51.093048, lng: 6.842120
          },
        }
      ]
    }
  }
});
</script>
