<template>
  <footer class="app-footer">
    <div class="footer-content">
      <div class="footer-section">
        <h3 class="footer-title">西关实验小学</h3>
        <p class="footer-description">让学习变得更有趣</p>
      </div>
      <div class="footer-section">
        <h4 class="footer-subtitle">快速链接</h4>
        <ul class="footer-links">
          <li><router-link to="/home">首页</router-link></li>
          <li><router-link to="/leaderboard">排行榜</router-link></li>
          <li><router-link to="/admin">后台管理</router-link></li>
        </ul>
      </div>
      <div class="footer-section">
        <h4 class="footer-subtitle">联系我们</h4>
        <p class="footer-contact">邮箱: xxxxxxxxxx</p>
        <p class="footer-contact">电话: xxxxxxxxxx</p>
      </div>
    </div>
    <div class="footer-bottom">
      <p class="footer-copyright">© 2026 西关实验小学. 保留所有权利.</p>
    </div>
  </footer>
</template>

<script setup>
// Footer组件
</script>

<style scoped>
.app-footer {
  background: linear-gradient(90deg, #7DD3F8 0%, #A8E6CF 50%, #FFD88B 100%);
  color: white;
  padding: 2rem 0;
  margin-top: 2rem;
  border-top: 3px solid var(--border-color);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.footer-section {
  text-align: center;
}

.footer-title {
  font-family: var(--game-font);
  font-size: 1.5rem;
  font-weight: 900;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.footer-description {
  font-size: 1rem;
  opacity: 0.9;
  margin-bottom: 1.5rem;
}

.footer-subtitle {
  font-family: var(--game-font);
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
}

.footer-links li {
  margin-bottom: 0.5rem;
}

.footer-links a {
  color: white;
  text-decoration: none;
  transition: all 0.3s ease;
  font-weight: 600;
}

.footer-links a:hover {
  color: var(--accent-color);
  text-shadow: 0 0 10px rgba(255, 209, 102, 0.5);
  transform: translateX(5px);
}

.footer-contact {
  margin-bottom: 0.5rem;
  font-weight: 600;
  opacity: 0.9;
}

.footer-bottom {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
}

.footer-copyright {
  font-size: 0.9rem;
  opacity: 0.8;
  font-weight: 600;
  letter-spacing: 1px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  .footer-title {
    font-size: 1.3rem;
  }

  .footer-subtitle {
    font-size: 1rem;
  }

  .footer-description,
  .footer-contact {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: 1.2rem;
  }

  .app-footer {
    padding: 1.5rem 0;
  }

  .footer-content {
    padding: 0 1rem;
  }

  .footer-title {
    font-size: 1.2rem;
  }

  .footer-subtitle {
    font-size: 0.9rem;
  }

  .footer-description,
  .footer-contact {
    font-size: 0.8rem;
  }

  .footer-bottom {
    margin-top: 1.5rem;
    padding-top: 1rem;
  }

  .footer-copyright {
    font-size: 0.8rem;
  }
}
</style>