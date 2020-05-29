<template>
  <v-tooltip top>
    <template v-slot:activator="{ on }">
      <v-btn class="mb-1 mr-1" icon v-on="on"
        @mousedown.prevent="$emit('eb', {altKey: true, code: hotkey})"
        tabindex="-1"
      >
        <v-icon>{{ icon }}</v-icon>
      </v-btn>
    </template>
    <span>{{ `${tooltip} (Alt + ${hotkey.slice(-1)})` }}</span>
  </v-tooltip>
</template>

<script>
// used to show tooltips on the HTML Editor
export default {
  props: {
    icon: String,
    hotkey: String,
    tooltip: String,
  },
}
</script>
