<script setup lang="ts">
import BaseInput from "@/components/base/BaseInput.vue";
import BaseButton from "@/components/BaseButton.vue";
import { APP_NAME } from "@/config/env.ts";
import { uploadImportData } from "@/apis";

function sync() {

}

function handleAudioChange(e) {
  let uploadFile = e.target?.files?.[0]
  if (!uploadFile) return
  let data = new FormData();
  data.append("file", uploadFile);
  uploadImportData(data)
  console.log(uploadFile)
}
</script>

<template>
  <div class="center h-screen">
    <div class="  flex flex-col gap-6 w-100">
      <h1 class="mb-0 text-align-center">{{ APP_NAME }}</h1>
      <div class="flex center">
        <span class="shrink-0">账户：</span>
        <BaseInput type="text"/>
      </div>
      <div class="flex center">
        <span class="shrink-0">密码：</span>
        <BaseInput type="password"/>
      </div>
      <BaseButton class="w-full">登录</BaseButton>
      <BaseButton class="w-full" @click="sync">同步</BaseButton>
      <div class="upload relative">
        <BaseButton>上传</BaseButton>
        <input type="file"
               accept=".zip,.json"
               @change="handleAudioChange"
               class="w-full h-full absolute left-0 top-0 opacity-0"/>
      </div>

      <div class="w-full flex justify-end gap-4">
        <div>注册</div>
        <div>忘记密码</div>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">

</style>
