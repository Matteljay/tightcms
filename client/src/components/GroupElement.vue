<template>
    <div class="GroupElement">
    <table>
    <tr>
      <td width="100%">
        <h3>{{ page.title }}</h3>
      </td>
      <td class="text-right text-no-wrap">
        <v-btn v-if="!page.isAddBar && showMoveDrop === 'mover'"
          text icon class="my-1"
          @click="$emit('pressed-icon', 'moveFrom')"
        >
          <v-icon>fa-arrows-alt-v</v-icon>
        </v-btn>
        <v-btn v-if="showMoveDrop !== 'mover'"
          :disabled="showMoveDrop === 'dropper_grey'"
          text icon class="my-1"
          @click="$emit('pressed-icon', 'moveTo')"
        >
          <v-icon>fa-arrow-up</v-icon>
        </v-btn>
        <v-btn v-if="page.isAddBar" text icon class="my-1" @click="$emit('pressed-icon', 'add')">
          <v-icon>fa-plus</v-icon>
        </v-btn>
        <v-btn v-if="!page.isAddBar" text icon class="my-1" @click="$emit('pressed-icon', 'edit')">
          <v-icon>fa-edit</v-icon>
        </v-btn>
        <v-btn v-if="!page.isAddBar" text icon class="my-1" @click="$emit('pressed-icon', 'remove')">
          <v-icon>fa-trash-alt</v-icon>
        </v-btn>
      </td>
    </tr>
    </table>
    </div>
</template>

<script>
export default {
  props: {
    page: Object,
    showMoveDrop: String,
  },
}
</script>
