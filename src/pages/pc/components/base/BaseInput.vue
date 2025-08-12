<script setup lang="ts">
import {ref, computed, watch, defineProps, defineEmits, useAttrs, nextTick, PropType} from 'vue';

interface Autosize {
  minRows?: number;
  maxRows?: number;
}

const props = defineProps({
  modelValue: [String, Number],
  placeholder: String,
  disabled: Boolean,
  type: {
    type: String,
    default: 'text',
  },
  clearable: {
    type: Boolean,
    default: false,
  },
  textarea: {
    type: Boolean,
    default: false,
  },
  required: {
    type: Boolean,
    default: false,
  },
  maxLength: Number,
  autosize: {
    type: [Boolean, Object] as PropType<boolean | Autosize>,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'input', 'change', 'focus', 'blur', 'validation']);

const attrs = useAttrs();

const inputValue = ref(props.modelValue);
const errorMsg = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);

watch(() => props.modelValue, (val) => {
  inputValue.value = val;
  validate(val);
});

const validate = (val: string | number | null | undefined) => {
  let err = '';
  const strVal = val == null ? '' : String(val);
  if (props.required && !strVal.trim()) {
    err = '不能为空';
  } else if (props.maxLength && strVal.length > props.maxLength) {
    err = `长度不能超过 ${props.maxLength} 个字符`;
  }
  errorMsg.value = err;
  emit('validation', err === '', err);
  return err === '';
};

const onInput = (e: Event) => {
  const target = e.target as HTMLInputElement | HTMLTextAreaElement;
  inputValue.value = target.value;
  validate(target.value);
  emit('update:modelValue', target.value);
  emit('input', e);

  if (props.textarea && props.autosize) {
    nextTick(() => {
      calcTextareaHeight();
    });
  }
};

const onChange = (e: Event) => {
  emit('change', e);
};

const onFocus = (e: FocusEvent) => {
  emit('focus', e);
};

const onBlur = (e: FocusEvent) => {
  validate(inputValue.value);
  emit('blur', e);
};

const clearInput = () => {
  inputValue.value = '';
  validate('');
  emit('update:modelValue', '');
  if (props.textarea && props.autosize) {
    nextTick(() => {
      calcTextareaHeight();
    });
  }
};

// 计算并设置 textarea 高度，支持 autosize 功能
const calcTextareaHeight = () => {
  if (!textareaRef.value) return;
  const ta = textareaRef.value;

  ta.style.height = 'auto'; // 先重置高度

  const style = window.getComputedStyle(ta);
  const lineHeight = parseFloat(style.lineHeight);
  const paddingTop = parseFloat(style.paddingTop);
  const paddingBottom = parseFloat(style.paddingBottom);

  let height = ta.scrollHeight;

  let minRows = 1;
  let maxRows = Infinity;

  if (typeof props.autosize === 'object') {
    if (props.autosize.minRows) minRows = props.autosize.minRows;
    if (props.autosize.maxRows) maxRows = props.autosize.maxRows;
  } else if (props.autosize === true) {
    minRows = 1;
    maxRows = Infinity;
  }

  const minHeight = lineHeight * minRows + paddingTop + paddingBottom;
  const maxHeight = lineHeight * maxRows + paddingTop + paddingBottom;

  height = Math.min(Math.max(height, minHeight), maxHeight);

  ta.style.height = height + 'px';
};

// 组件初始化时，调整高度（针对多行）
if (props.textarea && props.autosize) {
  nextTick(() => {
    calcTextareaHeight();
  });
}
</script>

<template>
  <div class="custom-input" :class="{ 'is-disabled': disabled, 'has-error': errorMsg }">
    <template v-if="textarea">
      <textarea
          v-bind="attrs"
          ref="textareaRef"
          :placeholder="placeholder"
          :disabled="disabled"
          :value="inputValue"
          @input="onInput"
          @change="onChange"
          @focus="onFocus"
          @blur="onBlur"
          class="custom-input__textarea"
          :maxlength="maxLength"
          rows="1"
          :style="autosize ? {overflowY: 'hidden'} : {}"
      ></textarea>
      <button
          v-if="clearable && inputValue && !disabled"
          type="button"
          class="custom-input__clear"
          @click="clearInput"
          aria-label="Clear input"
      >×
      </button>
    </template>

    <template v-else>
      <input
          v-bind="attrs"
          :type="type"
          :placeholder="placeholder"
          :disabled="disabled"
          :value="inputValue"
          @input="onInput"
          @change="onChange"
          @focus="onFocus"
          @blur="onBlur"
          class="custom-input__inner"
          :maxlength="maxLength"
      />
      <button
          v-if="clearable && inputValue && !disabled"
          type="button"
          class="custom-input__clear"
          @click="clearInput"
          aria-label="Clear input"
      >×
      </button>
    </template>

    <div v-if="errorMsg" class="custom-input__error">{{ errorMsg }}</div>
  </div>
</template>

<style scoped lang="scss">
.custom-input {
  position: relative;
  display: inline-block;
  width: 100%;

  &.is-disabled {
    opacity: 0.6;
  }

  &.has-error {
    .custom-input__inner,
    .custom-input__textarea {
      border-color: #f56c6c;
    }

    .custom-input__error {
      color: #f56c6c;
      font-size: 0.85rem;
      margin-top: 0.25rem;
    }
  }

  &__inner,
  &__textarea {
    width: 100%;
    padding: 0.4rem 1.5rem 0.4rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box;
    resize: vertical;
    transition: all .3s;
    color: var(--color-input-color);
    background: var(--color-input-bg);

    &:focus {
      outline: none;
      border-color: #409eff;
      box-shadow: 0 0 3px #409eff;
    }

    &:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }
  }

  &__textarea {
    min-height: 5rem;
    overflow-y: auto;
  }

  &__clear {
    position: absolute;
    right: 0.4rem;
    top: 50%;
    transform: translateY(-50%);
    border: none;
    background: transparent;
    font-size: 1.2rem;
    line-height: 1;
    cursor: pointer;
    color: #999;
    padding: 0;
    user-select: none;

    &:hover {
      color: #666;
    }
  }

  &__error {
    padding-left: 0.5rem;
  }
}

.custom-input__textarea {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

</style>
