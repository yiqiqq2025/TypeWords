<script setup lang="ts">

import BaseIcon from "@/components/BaseIcon.vue";
</script>

<template>
  <BaseIcon
      title="返回"
      @click="$router.back">
    <IconFormkitLeft/>
  </BaseIcon>
</template>

<style scoped lang="scss">

</style>
