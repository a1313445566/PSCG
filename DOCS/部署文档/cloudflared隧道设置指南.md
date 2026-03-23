# Cloudflare Tunnel 设置

## 启动 Cloudflare Tunnel
```bash
nohup cloudflared tunnel --url http://localhost:3001 > /var/log/cloudflared.log 2>&1 &
```

## 查看 Tunnel 地址
```bash
grep "trycloudflare.com" /var/log/cloudflared.log
```