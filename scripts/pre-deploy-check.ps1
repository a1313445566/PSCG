# AItest 分支部署前检查脚本 (PowerShell)
# 用途：在本地自动检查部署前的准备工作

param(
    [string]$TargetBranch = "AItest",
    [string]$CurrentBranch = "master"
)

$ErrorActionPreference = "Continue"
$WarningPreference = "Continue"

# 颜色输出函数
function Write-LogSuccess { Write-Host "✅ $args" -ForegroundColor Green }
function Write-LogError { Write-Host "❌ $args" -ForegroundColor Red }
function Write-LogWarning { Write-Host "⚠️  $args" -ForegroundColor Yellow }
function Write-LogInfo { Write-Host "ℹ️  $args" -ForegroundColor Cyan }
function Write-LogStep { Write-Host "`n👉 $args" -ForegroundColor Magenta }

# 检查计数
$script:ChecksPassed = 0
$script:ChecksFailed = 0
$script:ChecksWarning = 0

function Test-Check {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [string]$SuccessMessage,
        [string]$FailureMessage,
        [string]$WarningMessage
    )
    
    Write-LogStep $Name
    try {
        $result = & $Test
        if ($result -eq $true) {
            Write-LogSuccess $SuccessMessage
            $script:ChecksPassed++
        } elseif ($result -eq "WARNING") {
            Write-LogWarning $WarningMessage
            $script:ChecksWarning++
        } else {
            Write-LogError $FailureMessage
            $script:ChecksFailed++
        }
    } catch {
        Write-LogError "检查失败: $_"
        $script:ChecksFailed++
    }
}

# ==================== 开始检查 ====================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "    AItest 分支部署前检查" -ForegroundColor Cyan
Write-Host "    检查时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# 1. 检查当前分支
Test-Check -Name "1. 检查当前 Git 分支" -Test {
    $branch = git branch --show-current
    if ($branch -eq $TargetBranch) {
        Write-LogInfo "当前分支: $branch"
        return $true
    } else {
        Write-LogWarning "当前分支: $branch (期望: $TargetBranch)"
        return "WARNING"
    }
} -SuccessMessage "当前在 $TargetBranch 分支" -WarningMessage "请切换到 $TargetBranch 分支: git checkout $TargetBranch"

# 2. 检查工作区状态
Test-Check -Name "2. 检查工作区状态" -Test {
    $status = git status --porcelain
    if ($status) {
        Write-LogInfo "未提交的文件:"
        $status | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
        return "WARNING"
    }
    return $true
} -SuccessMessage "工作区干净，无未提交的变更" -WarningMessage "有未提交的变更，建议提交后再部署" -FailureMessage "无法检查工作区状态"

# 3. 检查 Git 最新提交
Test-Check -Name "3. 检查 Git 最新提交" -Test {
    git fetch origin
    $local = git rev-parse HEAD
    $remote = git rev-parse origin/$TargetBranch
    Write-LogInfo "本地提交: $local"
    Write-LogInfo "远程提交: $remote"
    
    if ($local -eq $remote) {
        return $true
    } else {
        return "WARNING"
    }
} -SuccessMessage "本地与远程同步" -WarningMessage "本地与远程不同步，建议执行: git pull origin $TargetBranch"

# 4. 检查 package.json 变更
Test-Check -Name "4. 检查依赖变更" -Test {
    $diff = git diff $CurrentBranch..$TargetBranch -- package.json
    if ($diff) {
        Write-LogInfo "检测到 package.json 变更:"
        $diff | Select-String "^\+.*dependencies|^\+.*devDependencies" | ForEach-Object {
            Write-Host "  $_" -ForegroundColor Yellow
        }
        return "WARNING"
    }
    return $true
} -SuccessMessage "无依赖变更" -WarningMessage "有新增依赖，部署时需要执行 npm install" -FailureMessage "无法检查依赖变更"

# 5. 检查数据库结构变更
Test-Check -Name "5. 检查数据库结构变更" -Test {
    $diff = git diff $CurrentBranch..$TargetBranch -- services/database.js routes/*.js
    $hasDBChanges = $diff | Select-String "CREATE TABLE|ALTER TABLE|DROP TABLE"
    
    if ($hasDBChanges) {
        Write-LogWarning "检测到数据库结构变更:"
        $hasDBChanges | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
        return "WARNING"
    }
    return $true
} -SuccessMessage "无数据库结构变更" -WarningMessage "有数据库结构变更，需要准备数据库迁移脚本" -FailureMessage "无法检查数据库变更"

# 6. 检查环境变量变更
Test-Check -Name "6. 检查环境变量变更" -Test {
    $envExample = git diff $CurrentBranch..$TargetBranch -- .env.example
    if ($envExample) {
        Write-LogInfo "检测到 .env.example 变更:"
        $envExample | Select-String "^\+" | Where-Object { $_ -notmatch "^\+\+\+" } | ForEach-Object {
            Write-Host "  $_" -ForegroundColor Yellow
        }
        return "WARNING"
    }
    return $true
} -SuccessMessage "无环境变量变更" -WarningMessage "有新增环境变量，需要在服务器配置 .env 文件" -FailureMessage "无法检查环境变量变更"

# 7. 检查代码质量
Test-Check -Name "7. 检查代码质量 (ESLint)" -Test {
    try {
        npm run lint:check 2>&1 | Out-Null
        return $true
    } catch {
        Write-LogWarning "ESLint 检查有错误，建议执行: npm run lint"
        return "WARNING"
    }
} -SuccessMessage "代码质量检查通过" -WarningMessage "有 ESLint 警告或错误，建议修复后再部署" -FailureMessage "代码质量检查失败"

# 8. 检查构建
Test-Check -Name "8. 检查前端构建" -Test {
    Write-LogInfo "正在构建前端（可能需要 1-2 分钟）..."
    npm run build 2>&1 | Out-Null
    
    if (Test-Path "dist/index.html") {
        $distSize = (Get-ChildItem dist -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
        Write-LogInfo "构建产物大小: $([math]::Round($distSize, 2)) MB"
        return $true
    }
    return $false
} -SuccessMessage "前端构建成功" -FailureMessage "前端构建失败，请检查错误日志" -WarningMessage "构建检查跳过"

# 9. 检查关键文件
Test-Check -Name "9. 检查关键文件" -Test {
    $files = @("server.cjs", "package.json", "vite.config.js")
    $script:MissingFiles = @()
    
    foreach ($file in $files) {
        if (Test-Path $file) {
            Write-LogInfo "✓ $file"
        } else {
            Write-LogWarning "✗ $file (缺失)"
            $script:MissingFiles += $file
        }
    }
    
    return $script:MissingFiles.Count -eq 0
} -SuccessMessage "所有关键文件存在" -FailureMessage "缺少关键文件，请查看上方详细信息"

# 10. 检查敏感信息
Test-Check -Name "10. 检查敏感信息" -Test {
    $sensitiveFiles = @(".env", "config/prod.js", "*.key", "*.pem")
    $found = @()
    
    foreach ($pattern in $sensitiveFiles) {
        $files = Get-ChildItem -Path . -Filter $pattern -File -ErrorAction SilentlyContinue
        if ($files) {
            $found += $files.Name
        }
    }
    
    if ($found.Count -gt 0) {
        Write-LogWarning "发现敏感文件:"
        $found | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
        return "WARNING"
    }
    return $true
} -SuccessMessage "未发现敏感文件泄露风险" -WarningMessage "发现敏感文件，请确保已添加到 .gitignore"

# ==================== 总结报告 ====================

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "    检查报告" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

Write-Host "`n📊 检查结果统计:" -ForegroundColor White
Write-LogSuccess "通过检查: $script:ChecksPassed 项"
if ($script:ChecksWarning -gt 0) {
    Write-LogWarning "警告检查: $script:ChecksWarning 项"
}
if ($script:ChecksFailed -gt 0) {
    Write-LogError "失败检查: $script:ChecksFailed 项"
}

Write-Host "`n📋 部署建议:" -ForegroundColor White

if ($script:ChecksFailed -eq 0 -and $script:ChecksWarning -eq 0) {
    Write-LogSuccess "✅ 所有检查通过，可以安全部署！"
    Write-Host "`n建议执行以下部署命令:" -ForegroundColor Green
    Write-Host "  1. git push origin $TargetBranch" -ForegroundColor White
    Write-Host "  2. SSH 登录服务器" -ForegroundColor White
    Write-Host "  3. 执行部署流程（参考 DOCS/部署-AItest分支上线指南.md）" -ForegroundColor White
} elseif ($script:ChecksFailed -eq 0 -and $script:ChecksWarning -gt 0) {
    Write-LogWarning "⚠️  检查通过但有警告，建议处理警告后再部署"
    Write-Host "`n建议:" -ForegroundColor Yellow
    Write-Host "  1. 查看上方警告信息" -ForegroundColor White
    Write-Host "  2. 处理警告事项（如提交代码、更新依赖等）" -ForegroundColor White
    Write-Host "  3. 重新运行此检查脚本" -ForegroundColor White
} else {
    Write-LogError "❌ 存在检查失败项，请先修复问题"
    Write-Host "`n建议:" -ForegroundColor Red
    Write-Host "  1. 查看上方错误信息" -ForegroundColor White
    Write-Host "  2. 修复所有失败项" -ForegroundColor White
    Write-Host "  3. 重新运行此检查脚本" -ForegroundColor White
}

Write-Host "`n================================================`n" -ForegroundColor Cyan

# 返回退出码
if ($script:ChecksFailed -gt 0) {
    exit 1
} elseif ($script:ChecksWarning -gt 0) {
    exit 2
} else {
    exit 0
}