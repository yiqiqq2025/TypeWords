<script setup lang="ts">
import {Icon} from "@iconify/vue";
import Tooltip from "@/pages/pc/components/base/Tooltip.vue";

defineEmits(['click'])
defineProps<{
  title?: string
}>()
</script>

<template>
  <div class="close"
       @click="$emit('click')"
  >
    <Tooltip :title="title">
      <IconCarbonCloseOutline/>
    </Tooltip>
  </div>
</template>

<style scoped lang="scss">
.close {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}
</style>
