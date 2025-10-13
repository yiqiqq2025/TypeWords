<script setup lang="ts">
import BaseInput from "@/components/base/BaseInput.vue";
import BaseButton from "@/components/BaseButton.vue";
import { APP_NAME } from "@/config/env.ts";

function sync() {

}
</script>

<template>
  <div class="center h-screen">
    <div class="center flex flex-col gap-6">
      <h1 class="mb-0">{{ APP_NAME }}</h1>
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

      <div class="w-full flex justify-end gap-4">
        <div>注册</div>
        <div>忘记密码</div>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">

</style>
