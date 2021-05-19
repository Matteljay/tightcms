<template>
  <span class="MenuButton">
    <v-btn v-if="getSubsForURL(bookLine.url).length === 0"
      class="ma-1 btnTransparent" text :color="getCalcSettings.menuColor_font"
      :to="bookLine.url"
    >
      {{ bookLine.page.title }}
    </v-btn>
    <v-menu v-else>
      <template v-slot:activator="{ on }">
        <v-btn v-on="on" class="ma-1 btnTransparent" text :color="getCalcSettings.menuColor_font">
          {{ bookLine.page.title }}
        </v-btn>
      </template>
      <v-list :color="getSettings.bgColor">
        <v-list-item :to="bookLine.url">
          <v-list-item-title :style="`color:${getCalcSettings.bgColor_font}`"><b>{{ bookLine.page.title }}</b></v-list-item-title>
        </v-list-item>
        <v-list-item v-for="(subBookLine, index) in getSubsForURL(bookLine.url)"
          :to="subBookLine.url" :key="index">
          <v-list-item-title :style="`color:${getCalcSettings.bgColor_font}`">{{ subBookLine.page.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </span>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  props: {
    bookLine: Object,
  },
  computed: {
    ...mapGetters(['getSubsForURL', 'getSettings', 'getCalcSettings'])
  },
}
</script>

<style scoped lang="scss">
.btnTransparent {
  background-color: #11111122;
}
</style>
