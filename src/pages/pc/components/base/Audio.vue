<script setup lang="ts">
import {ref, computed, watch, useAttrs} from 'vue';

interface IProps {
  src?: string;
  autoplay?: boolean;
  loop?: boolean;
  volume?: number; // 0-1
  currentTime?: number;
  playbackRate?: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<IProps>(), {
  autoplay: false,
  loop: false,
  volume: 1,
  currentTime: 0,
  playbackRate: 1,
  disabled: false
});


const attrs = useAttrs();

// 音频元素引用
const audioRef = ref<HTMLAudioElement>();
const progressBarRef = ref<HTMLDivElement>();
const volumeBarRef = ref<HTMLDivElement>();

// 状态管理
const isPlaying = ref(false);
const isLoading = ref(false);
const duration = ref(0);
const currentTime = ref(0);
const volume = ref(props.volume);
const playbackRate = ref(props.playbackRate);
const isDragging = ref(false);
const isVolumeDragging = ref(false);
const isVolumeHovering = ref(false); // 添加音量控制hover状态变量
const error = ref('');

// 计算属性
const progress = computed(() => {
  return duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0;
});

const volumeProgress = computed(() => {
  return volume.value * 100;
});

const formatTime = (time: number) => {
  if (!isFinite(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// 播放控制
const togglePlay = async () => {
  if (!audioRef.value || props.disabled) return;

  try {
    if (isPlaying.value) {
      audioRef.value.pause();
    } else {
      await audioRef.value.play();
    }
  } catch (err) {
    console.error('播放失败:', err);
    error.value = '播放失败';
  }
};

const seekTo = (event: MouseEvent) => {
  if (!audioRef.value || !progressBarRef.value || props.disabled) return;

  const rect = progressBarRef.value.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, clickX / rect.width));
  const newTime = percentage * duration.value;

  audioRef.value.currentTime = newTime;
  currentTime.value = newTime;
};

const setVolume = (event: MouseEvent) => {
  if (!audioRef.value || !volumeBarRef.value || props.disabled) return;

  const rect = volumeBarRef.value.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, clickX / rect.width));

  volume.value = percentage;
  audioRef.value.volume = percentage;
};

const toggleMute = () => {
  if (!audioRef.value || props.disabled) return;

  if (volume.value > 0) {
    volume.value = 0;
    audioRef.value.volume = 0;
  } else {
    volume.value = 1;
    audioRef.value.volume = 1;
  }
};

const changePlaybackRate = () => {
  if (!audioRef.value || props.disabled) return;

  const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const currentIndex = rates.indexOf(playbackRate.value);
  const nextIndex = (currentIndex + 1) % rates.length;

  playbackRate.value = rates[nextIndex];
  audioRef.value.playbackRate = playbackRate.value;
};

// 事件处理
const handleLoadStart = () => {
  isLoading.value = true;
};

const handleLoadedData = () => {
  isLoading.value = false;
};

const handleLoadedMetadata = () => {
  duration.value = audioRef.value?.duration || 0;
};

const handleCanPlay = () => {
};

const handleCanPlayThrough = () => {
};

const handlePlay = () => {
  isPlaying.value = true;
};

const handlePause = () => {
  isPlaying.value = false;
};

const handleEnded = () => {
  isPlaying.value = false;
  currentTime.value = 0;
};

const handleError = () => {
  error.value = '音频加载失败';
  isLoading.value = false;
};

const handleTimeUpdate = () => {
  if (audioRef.value && !isDragging.value) {
    currentTime.value = audioRef.value.currentTime;
  }
};

const handleVolumeChange = () => {
  if (audioRef.value && !isVolumeDragging.value) {
    volume.value = audioRef.value.volume;
  }
};

const handleRateChange = () => {
  if (audioRef.value) {
    playbackRate.value = audioRef.value.playbackRate;
  }
};

// 进度条处理
const handleProgressMouseDown = (event: MouseEvent) => {
  if (!audioRef.value || !progressBarRef.value || props.disabled) return;

  event.preventDefault();
  event.stopPropagation();

  const rect = progressBarRef.value.getBoundingClientRect();
  const startX = event.clientX;
  const startY = event.clientY;
  let hasMoved = false;
  let lastPosition = 0; // 记录最后的位置
  const moveThreshold = 3; // 移动阈值，超过这个距离才认为是拖拽

  // 获取DOM元素引用
  const progressFill = progressBarRef.value.querySelector('.progress-fill') as HTMLElement;
  const progressThumb = progressBarRef.value.querySelector('.progress-thumb') as HTMLElement;

  // 立即跳转到点击位置
  const clickX = event.clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, clickX / rect.width));
  const newTime = percentage * duration.value;

  // 直接更新DOM样式
  if (progressFill && progressThumb) {
    progressFill.style.width = `${percentage * 100}%`;
    progressThumb.style.left = `${percentage * 100}%`;
  }

  audioRef.value.currentTime = newTime;
  currentTime.value = newTime;
  lastPosition = newTime;
  isDragging.value = true;

  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = Math.abs(e.clientX - startX);
    const deltaY = Math.abs(e.clientY - startY);

    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      hasMoved = true;
    }

    if (!hasMoved) return;

    // 禁用过渡动画
    if (progressFill && progressThumb) {
      progressFill.style.transition = 'none';
      progressThumb.style.transition = 'none';
    }

    const rect = progressBarRef.value!.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration.value;

    // 直接更新DOM样式，不使用响应式变量
    if (progressFill && progressThumb) {
      progressFill.style.width = `${percentage * 100}%`;
      progressThumb.style.left = `${percentage * 100}%`;
    }

    // 只更新响应式变量用于时间显示，不用于样式
    currentTime.value = newTime;
    lastPosition = newTime;
  };

  const handleMouseUp = () => {
    isDragging.value = false;

    // 恢复过渡动画
    if (progressFill && progressThumb) {
      progressFill.style.transition = '';
      progressThumb.style.transition = '';
    }

    // 如果是拖拽，在结束时更新audio元素到最终位置
    if (hasMoved && audioRef.value) {
      audioRef.value.currentTime = lastPosition;
    }

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

// 音量控制处理
const handleVolumeMouseDown = (event: MouseEvent) => {
  if (!audioRef.value || !volumeBarRef.value || props.disabled) return;

  event.preventDefault();
  event.stopPropagation();

  const rect = volumeBarRef.value.getBoundingClientRect();
  const startX = event.clientX;
  const startY = event.clientY;
  let hasMoved = false;
  let lastVolume = 0; // 记录最后的音量
  const moveThreshold = 3; // 移动阈值，超过这个距离才认为是拖拽

  // 获取DOM元素引用
  const volumeFill = volumeBarRef.value.querySelector('.volume-fill') as HTMLElement;
  const volumeThumb = volumeBarRef.value.querySelector('.volume-thumb') as HTMLElement;


  // 立即跳转到点击位置
  const clickY = event.clientY - rect.top;
  // 反转百分比，因为我们希望底部是0%，顶部是100%
  const percentage = Math.max(0, Math.min(1, 1 - (clickY / rect.height)));

  // 直接更新DOM样式
  if (volumeFill && volumeThumb) {
    volumeFill.style.height = `${percentage * 100}%`;
    // 设置bottom而不是left
    volumeThumb.style.bottom = `${percentage * 100}%`;
    // 重置left样式
    volumeThumb.style.left = '50%';
  }

  volume.value = percentage;
  audioRef.value.volume = percentage;
  lastVolume = percentage;
  isVolumeDragging.value = true;

  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = Math.abs(e.clientX - startX);
    const deltaY = Math.abs(e.clientY - startY);

    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      hasMoved = true;
    }

    if (!hasMoved) return;
    // 禁用过渡动画
    if (volumeFill && volumeThumb) {
      volumeFill.style.transition = 'none';
      volumeThumb.style.transition = 'none';
    }

    const rect = volumeBarRef.value!.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    // 反转百分比，因为我们希望底部是0%，顶部是100%
    const percentage = Math.max(0, Math.min(1, 1 - (clickY / rect.height)));

    // 直接更新DOM样式，不使用响应式变量
    if (volumeFill && volumeThumb) {
      volumeFill.style.height = `${percentage * 100}%`;
      // 设置bottom而不是left
      volumeThumb.style.bottom = `${percentage * 100}%`;
    }

    // 更新响应式变量和音频音量
    volume.value = percentage;
    lastVolume = percentage;
    // 实时更新音频音量
    if (audioRef.value) {
      audioRef.value.volume = percentage;
    }
  };

  const handleMouseUp = () => {
    isVolumeDragging.value = false;

    // 恢复过渡动画
    if (volumeFill && volumeThumb) {
      volumeFill.style.transition = '';
      volumeThumb.style.transition = '';
    }

    // 如果是拖拽，在结束时更新audio元素到最终音量
    if (hasMoved && audioRef.value) {
      audioRef.value.volume = lastVolume;
    }

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

const endVolumeDrag = () => {
  isVolumeDragging.value = false;
};

// 监听属性变化
watch(() => props.src, (newSrc) => {
  if (audioRef.value) {
    // 重置所有状态
    isPlaying.value = false;
    isLoading.value = false;
    currentTime.value = 0;
    duration.value = 0;
    error.value = '';

    if (newSrc) {
      audioRef.value.src = newSrc;
      audioRef.value.load();
    } else {
      // 如果src为空，清空音频源
      audioRef.value.src = '';
      audioRef.value.load();
    }
  }
});

watch(() => props.volume, (newVolume) => {
  volume.value = newVolume;
  if (audioRef.value) {
    audioRef.value.volume = newVolume;
  }
});

watch(() => props.currentTime, (newTime) => {
  if (audioRef.value && !isDragging.value) {
    audioRef.value.currentTime = newTime;
    currentTime.value = newTime;
  }
});

watch(() => props.playbackRate, (newRate) => {
  playbackRate.value = newRate;
  if (audioRef.value) {
    audioRef.value.playbackRate = newRate;
  }
});

</script>

<template>
  <div
      class="custom-audio"
      :class="{ 'disabled': disabled, 'has-error': error }"
      v-bind="attrs"
  >
    <!-- 隐藏的原生audio元素 -->
    <audio
        ref="audioRef"
        :src="src"
        preload="auto"
        :autoplay="autoplay"
        :loop="loop"
        :controls="false"
        @loadstart="handleLoadStart"
        @loadeddata="handleLoadedData"
        @loadedmetadata="handleLoadedMetadata"
        @canplay="handleCanPlay"
        @canplaythrough="handleCanPlayThrough"
        @play="handlePlay"
        @pause="handlePause"
        @ended="handleEnded"
        @error="handleError"
        @timeupdate="handleTimeUpdate"
        @volumechange="handleVolumeChange"
        @ratechange="handleRateChange"
    />

    <!-- 自定义控制界面 -->
    <div class="audio-container">
      <!-- 播放/暂停按钮 -->
      <button
          class="play-button"
          :class="{ 'playing': isPlaying, 'loading': isLoading }"
          @click="togglePlay"
          :disabled="disabled"
          :aria-label="isPlaying ? '暂停' : '播放'"
      >
        <div v-if="isLoading" class="loading-spinner"></div>
        <svg v-else-if="isPlaying" class="icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
        </svg>
        <svg v-else class="icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>

      <!-- 进度条区域 -->
      <div class="progress-section">
        <!-- 时间显示 -->
        <span class="time-display">{{ formatTime(currentTime) }}</span>

        <!-- 进度条 -->
        <div
            class="progress-container"
            @mousedown="handleProgressMouseDown"
            ref="progressBarRef"
        >
          <div class="progress-track">
            <div
                class="progress-fill"
                :style="{ width: progress + '%' }"
            ></div>
            <div
                class="progress-thumb"
                :style="{ left: progress + '%' }"
            ></div>
          </div>
        </div>

        <!-- 总时长 -->
        <span class="time-display">{{ formatTime(duration) }}</span>
      </div>

      <!-- 音量控制 -->
      <div
          class="volume-section"
          @mouseenter="isVolumeHovering = true"
          @mouseleave="isVolumeHovering = false"
      >
        <button
            class="volume-button"
            @click="toggleMute"
            :disabled="disabled"
            :aria-label="volume > 0 ? '静音' : '取消静音'"
        >
          <svg v-if="volume === 0" class="icon" viewBox="0 0 24 24" fill="currentColor">
            <path
                d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 = 13.5 21 = 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 = 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
          <svg v-else-if="volume < 0.5" class="icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
          </svg>
          <svg v-else class="icon" viewBox="0 0 24 24" fill="currentColor">
            <path
                d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        </button>

        <!-- 音量下拉控制条 -->
        <div class="volume-dropdown" :class="{ 'active': isVolumeHovering || isVolumeDragging }">
          <div
              class="volume-container"
              @mousedown="handleVolumeMouseDown"
              ref="volumeBarRef"
          >
            <div class="volume-track">
              <div
                  class="volume-fill"
                  :style="{ height: volumeProgress + '%' }"
              ></div>
              <div
                  class="volume-thumb"
                  :style="{ bottom: volumeProgress + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 播放速度控制 -->
      <button
          class="speed-button"
          @click="changePlaybackRate"
          :disabled="disabled"
          :aria-label="`播放速度: ${playbackRate}x`"
      >
        {{ playbackRate }}x
      </button>
    </div>

    <!-- 错误信息 -->
    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<style scoped lang="scss">
.custom-audio {
  // CSS变量定义，可以通过外部覆盖来自定义样式
  --audio-bg: #fff;
  --audio-border-radius: 8px;
  --audio-box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --audio-container-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --audio-text-color: white;
  --audio-button-bg: rgba(255, 255, 255, 0.2);
  --audio-button-hover-bg: rgba(255, 255, 255, 0.3);
  --audio-button-playing-bg: rgba(255, 255, 255, 0.3);
  --audio-progress-bg: rgba(255, 255, 255, 0.3);
  --audio-progress-fill: rgba(255, 255, 255, 0.8);
  --audio-thumb-bg: white;
  --audio-thumb-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  --audio-volume-thumb-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  --audio-speed-button-bg: rgba(255, 255, 255, 0.1);
  --audio-speed-button-border: rgba(255, 255, 255, 0.3);
  --audio-speed-button-hover-bg: rgba(255, 255, 255, 0.2);
  --audio-speed-button-hover-border: rgba(255, 255, 255, 0.5);
  --audio-error-bg: #f56c6c;
  --audio-error-color: white;
  --gap: 8px;

  display: inline-block;
  width: 100%;
  max-width: 600px;
  background: var(--color-primary);
  border-radius: var(--audio-border-radius);
  box-shadow: var(--audio-box-shadow);
  color: black;
  //overflow: hidden;
  transition: all 0.3s ease;
  font-family: var(--font-family);

  &.disabled {
    opacity: 0.6;
    pointer-events: none;
  }

  &.has-error {
    border: 1px solid var(--audio-error-bg);
  }
}

.audio-container {
  display: flex;
  align-items: center;
  gap: var(--gap);
}

.play-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: var(--color-second);
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: var(--audio-button-hover-bg);
    transform: scale(1.05);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &.playing {
    background: var(--audio-button-playing-bg);
  }

  &.loading {
    background: var(--audio-button-bg);
  }

  .icon {
    width: 20px;
    height: 20px;
  }

  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

.progress-section {
  display: flex;
  align-items: center;
  gap: var(--gap);
  flex: 1;
  min-width: 0;
}

.time-display {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.8;
  white-space: nowrap;
  text-align: center;
}

.progress-container {
  flex: 1;
  height: 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 0;
}

.progress-track {
  position: relative;
  width: 100%;
  height: 6px;
  background: var(--color-second);
  //background: white;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-fourth);
  border-radius: 2px;
  transition: width 0.1s ease;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: var(--color-fourth);
  border-radius: 50%;
  box-shadow: var(--audio-thumb-shadow);
  cursor: grab;
  opacity: 1;
  transition: all 0.2s ease;

  &:active {
    cursor: grabbing;
  }
}

.volume-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  position: relative;
}

.volume-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  background: var(--color-second);
  color: inherit;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: var(--audio-button-hover-bg);
  }

  .icon {
    width: 16px;
    height: 16px;
  }
}

.volume-dropdown {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-primary);
  border-radius: 4px;
  padding: 8px;
  margin-top: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
  z-index: 10;

  &.active {
    opacity: 1;
    visibility: visible;
  }

  &:before {
    content: '';
    position: absolute;
    top: -4px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    width: 8px;
    height: 8px;
    background: var(--audio-container-bg);
  }
}

.volume-container {
  width: 24px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 8px 0;
}

.volume-track {
  position: relative;
  width: 4px;
  height: 100%;
  background: var(--audio-progress-bg);
  border-radius: 2px;
  overflow: hidden;
}

.volume-fill {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: var(--fill-height);
  background: var(--audio-progress-fill);
  border-radius: 2px;
}

.volume-thumb {
  position: absolute;
  left: 50%;
  bottom: var(--thumb-bottom);
  transform: translate(-50%, 50%);
  width: 10px;
  height: 10px;
  background: var(--audio-thumb-bg);
  border-radius: 50%;
  box-shadow: var(--audio-volume-thumb-shadow);
  cursor: grab;
  opacity: 1;
  transition: all 0.2s ease;

  &:active {
    cursor: grabbing;
  }
}

.speed-button {
  padding: 6px 12px;
  border: 1px solid var(--audio-speed-button-border);
  border-radius: 4px;
  background: var(--color-second);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: var(--audio-speed-button-hover-bg);
    border-color: var(--audio-speed-button-hover-border);
  }
}

.error-message {
  padding: 8px 16px;
  background: var(--audio-error-bg);
  color: var(--audio-error-color);
  font-size: 12px;
  text-align: center;
}

// 动画
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

// 响应式设计
@media (max-width: 480px) {
  .custom-audio {
    max-width: 100%;
  }

  .audio-container {
    padding: 8px 12px;
    gap: 8px;
    min-height: 50px;
  }

  .play-button {
    width: 36px;
    height: 36px;

    .icon {
      width: 18px;
      height: 18px;
    }
  }

  .progress-section {
    gap: 8px;
  }

  .time-display {
    font-size: 11px;
    min-width: 35px;
  }

  .volume-section {
    gap: 6px;
  }

  .volume-button {
    width: 28px;
    height: 28px;

    .icon {
      width: 14px;
      height: 14px;
    }
  }

  .volume-container {
    width: 50px;
  }

  .speed-button {
    padding: 4px 8px;
    font-size: 11px;
  }
}

</style>
