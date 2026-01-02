Write-Host "🛑 Stopping old container..."
docker stop backend-runner 2>$null | Out-Null
docker rm backend-runner 2>$null | Out-Null

Write-Host "🧹 Removing old images (avoid cache poisoning)..."
docker rmi backend-runner:latest 2>$null | Out-Null
docker rmi python-runner:latest 2>$null | Out-Null

Write-Host "📦 Creating volume..."
docker volume create runner-temp 2>$null | Out-Null

Write-Host "🔨 Rebuilding runtime image (python-runner)..."
docker build --no-cache `
  -t python-runner:latest `
  -f Dockerfile `
  .

Write-Host "🔨 Rebuilding backend image (backend-runner)..."
docker build --no-cache `
  -t backend-runner:latest `
  -f Dockerfile.server `
  .

Write-Host "🚀 Starting backend-runner container..."
docker run -d `
  --name backend-runner `
  -p 8080:8080 `
  -v /var/run/docker.sock:/var/run/docker.sock `
  -v runner-temp:/tmp/runner `
  backend-runner:latest | Out-Null

Write-Host "⏳ Waiting for container to initialize..."
Start-Sleep -Seconds 3

Write-Host "`n✅ Container status:"
docker ps | Select-String backend-runner

Write-Host "`n📝 Logs:"
docker logs backend-runner
