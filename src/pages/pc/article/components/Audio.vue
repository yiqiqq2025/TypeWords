<script setup lang="ts">
import {Article} from "@/types/types.ts";
import {watch, ref} from "vue";
import {LOCAL_FILE_KEY} from "@/utils/const.ts";
import {get} from "idb-keyval";

const props = defineProps<{
  article: Article
}>()

let file = $ref(null)
//这里不能用$ref，不然父组件获取不到
let el = ref()

watch(() => props.article.audioFileId, async () => {
  if (!props.article.audioSrc && props.article.audioFileId) {
    let list = await get(LOCAL_FILE_KEY)
    let rItem = list.find((file) => file.id === props.article.audioFileId)
    if (rItem) {
      file = URL.createObjectURL(rItem.file)
    }
  }
}, {immediate: true})

defineExpose({el})
</script>

<template>
  <div>
    <audio v-bind="$attrs" ref="el" v-if="props.article.audioSrc" :src="props.article.audioSrc" controls></audio>
    <audio ref="el" v-else-if="file" :src="file" controls></audio>
  </div>
</template>

<style scoped lang="scss">


</style>