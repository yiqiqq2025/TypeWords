<script setup lang="ts">
import {Article} from "@/types/types.ts";
import {watch} from "vue";
import {LOCAL_FILE_KEY} from "@/utils/const.ts";
import {get} from "idb-keyval";
import Audio from "@/components/base/Audio.vue";

const props = defineProps<{
  article: Article
  articleList?: Article[]
  currentIndex?: number
}>()

let file = $ref(null)
let instance = $ref<{ audioRef: HTMLAudioElement }>({audioRef: null})
let shouldAutoPlay = $ref(false) // 标记是否应该自动播放

const emit = defineEmits<{
  playNext: [nextArticle: Article]
}>()

// 处理音频播放结束，自动播放下一个
const handleAudioEnded = () => {
  if (props.articleList && props.currentIndex !== undefined) {
    const nextIndex = props.currentIndex + 1
    if (nextIndex < props.articleList.length) {
      const nextArticle = props.articleList[nextIndex]
      if (nextArticle.audioSrc || nextArticle.audioFileId) {
        shouldAutoPlay = true // 设置自动播放标记
        emit('playNext', nextArticle)
      }
    }
  }
}

// 当音频源改变时，如果需要自动播放则开始播放
const startAutoPlay = async () => {
  if (shouldAutoPlay && instance?.audioRef) {
    shouldAutoPlay = false // 重置标记
    try {
      // 等待一小段时间确保音频元素已经准备好
      await new Promise(resolve => setTimeout(resolve, 100))
      await instance.audioRef.play()
    } catch (error) {
      console.error('自动播放失败:', error)
    }
  }
}

watch(() => props.article.audioFileId, async () => {
  if (!props.article.audioSrc && props.article.audioFileId) {
    let list = await get(LOCAL_FILE_KEY)
    if (list) {
      let rItem = list.find((file) => file.id === props.article.audioFileId)
      if (rItem) {
        file = URL.createObjectURL(rItem.file)
        // 当文件加载完成后尝试自动播放
        await new Promise(resolve => setTimeout(resolve, 50))
        startAutoPlay()
      }
    }
  }else {
    file = null
  }
}, {immediate: true})

// 监听音频源变化，触发自动播放
watch(() => props.article.audioSrc, async (newSrc) => {
  if (newSrc) {
    // 当音频源改变后尝试自动播放
    await new Promise(resolve => setTimeout(resolve, 50))
    startAutoPlay()
  }
})

//转发一遍，这里Proxy的默认值不能为{}，可能是vue做了什么
defineExpose(new Proxy({
  currentTime: 0,
  played: false,
  src: '',
  volume: 0,
  playbackRate: 1,
  play: () => void 0,
  pause: () => void 0,
}, {
  get(target, key) {
    if (key === 'currentTime') return instance?.audioRef?.currentTime
    if (key === 'played') return instance?.audioRef?.played
    if (key === 'src') return instance?.audioRef?.src
    if (key === 'volume') return instance?.audioRef?.volume
    if (key === 'playbackRate') return instance?.audioRef?.playbackRate
    if (key === 'play') instance?.audioRef?.play()
    if (key === 'pause') instance?.audioRef?.pause()
    return target[key]
  },
  set(_, key, value) {
    if (key === 'currentTime') instance.audioRef.currentTime = value
    if (key === 'volume') return instance.audioRef.volume = value
    return true
  }
}))
</script>

<template>
  <Audio v-bind="$attrs" ref="instance"
         v-if="props.article.audioSrc"
         :src="props.article.audioSrc"
         @ended="handleAudioEnded"/>
  <Audio ref="instance" v-else-if="file"
         :src="file"
         @ended="handleAudioEnded"
  />
</template>
