<template>
  <div class="login-view">
    <AppHeader />
    <LoginForm />
  </div>
</template>

<script setup>
import AppHeader from '../components/common/AppHeader.vue'
import LoginForm from '../components/common/LoginForm.vue'
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%);
}
</style>
