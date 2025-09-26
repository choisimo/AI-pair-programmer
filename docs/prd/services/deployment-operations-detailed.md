# Deployment & Operations - 상세 제품 요구사항 문서

## 1. 개요

### 1.1 목적
Deployment & Operations 서비스는 애플리케이션의 배포, 운영, 모니터링을 자동화하고 안정적인 프로덕션 환경을 유지하기 위한 인프라와 도구를 제공합니다.

### 1.2 핵심 목표
- Zero-downtime 배포
- Infrastructure as Code (IaC)
- 자동화된 확장 및 복구
- 컨테이너 오케스트레이션

## 2. 배포 파이프라인

### 2.1 CI/CD 파이프라인

#### 2.1.1 빌드 파이프라인
```typescript
interface BuildPipeline {
  stages: BuildStage[];
  triggers: TriggerConfig[];
  artifacts: ArtifactConfig[];
  notifications: NotificationConfig[];
}

class CIPipeline {
  private stages: Map<string, Stage> = new Map();
  
  // 파이프라인 정의
  definePipeline(): PipelineConfig {
    return {
      name: 'ai-pair-programmer-ci',
      
      triggers: [
        { type: 'push', branches: ['main', 'develop'] },
        { type: 'pull_request', targetBranches: ['main'] },
        { type: 'schedule', cron: '0 2 * * *' } // 매일 2시
      ],
      
      stages: [
        {
          name: 'lint',
          jobs: [
            {
              name: 'eslint',
              image: 'node:18',
              commands: [
                'npm ci',
                'npm run lint'
              ],
              cache: {
                key: 'node-modules-{{ checksum "package-lock.json" }}',
                paths: ['node_modules']
              }
            },
            {
              name: 'type-check',
              image: 'node:18',
              commands: [
                'npm ci',
                'npm run type-check'
              ]
            }
          ],
          parallel: true
        },
        
        {
          name: 'test',
          jobs: [
            {
              name: 'unit-tests',
              image: 'node:18',
              commands: [
                'npm ci',
                'npm run test:unit -- --coverage'
              ],
              artifacts: {
                paths: ['coverage/'],
                reports: {
                  coverage: 'coverage/lcov.info'
                }
              }
            },
            {
              name: 'integration-tests',
              image: 'node:18',
              services: [
                { name: 'redis', image: 'redis:7' },
                { name: 'postgres', image: 'postgres:15' }
              ],
              commands: [
                'npm ci',
                'npm run test:integration'
              ]
            },
            {
              name: 'e2e-tests',
              image: 'mcr.microsoft.com/playwright:v1.40.0',
              commands: [
                'npm ci',
                'npm run build',
                'npm run test:e2e'
              ],
              artifacts: {
                paths: ['playwright-report/'],
                when: 'on_failure'
              }
            }
          ]
        },
        
        {
          name: 'security',
          jobs: [
            {
              name: 'dependency-scan',
              image: 'aquasec/trivy',
              commands: [
                'trivy fs --severity HIGH,CRITICAL .'
              ]
            },
            {
              name: 'sast',
              image: 'securego/gosec',
              commands: [
                'gosec ./...'
              ]
            },
            {
              name: 'license-check',
              commands: [
                'npm run license-check'
              ]
            }
          ]
        },
        
        {
          name: 'build',
          jobs: [
            {
              name: 'docker-build',
              image: 'docker:24',
              services: [
                { name: 'docker', image: 'docker:24-dind' }
              ],
              commands: [
                'docker build -t $IMAGE_NAME:$CI_COMMIT_SHA .',
                'docker tag $IMAGE_NAME:$CI_COMMIT_SHA $IMAGE_NAME:latest',
                'docker push $IMAGE_NAME:$CI_COMMIT_SHA',
                'docker push $IMAGE_NAME:latest'
              ]
            },
            {
              name: 'helm-package',
              image: 'alpine/helm:3.13',
              commands: [
                'helm package ./charts/ai-pair-programmer',
                'helm push ai-pair-programmer-*.tgz oci://$HELM_REGISTRY'
              ]
            }
          ]
        }
      ],
      
      notifications: {
        slack: {
          webhook: '$SLACK_WEBHOOK_URL',
          events: ['pipeline_failed', 'pipeline_fixed']
        },
        email: {
          recipients: ['team@example.com'],
          events: ['pipeline_failed']
        }
      }
    };
  }
}
```

#### 2.1.2 배포 파이프라인
```typescript
class CDPipeline {
  private environments: Map<string, Environment> = new Map();
  private strategies: Map<string, DeploymentStrategy> = new Map();
  
  // 배포 전략
  async deploy(config: DeployConfig): Promise<DeploymentResult> {
    const environment = this.environments.get(config.environment);
    const strategy = this.strategies.get(config.strategy || 'rolling');
    
    // 배포 전 검증
    await this.preDeploymentChecks(environment);
    
    // 배포 실행
    const result = await strategy.deploy({
      environment,
      version: config.version,
      config: config.config
    });
    
    // 배포 후 검증
    await this.postDeploymentChecks(environment, result);
    
    // 모니터링 시작
    await this.startMonitoring(environment, result);
    
    return result;
  }
  
  // Blue-Green 배포
  class BlueGreenStrategy implements DeploymentStrategy {
    async deploy(params: DeployParams): Promise<DeploymentResult> {
      // 1. Green 환경 준비
      const greenEnv = await this.prepareGreenEnvironment(params);
      
      // 2. Green 환경에 배포
      await this.deployToEnvironment(greenEnv, params.version);
      
      // 3. 헬스체크
      await this.healthCheck(greenEnv);
      
      // 4. 트래픽 전환
      await this.switchTraffic({
        from: 'blue',
        to: 'green',
        percentage: 100
      });
      
      // 5. Blue 환경 정리 (선택적)
      if (params.config.cleanupOldVersion) {
        await this.cleanupEnvironment('blue');
      }
      
      return {
        status: 'success',
        environment: greenEnv,
        version: params.version
      };
    }
  }
  
  // Canary 배포
  class CanaryStrategy implements DeploymentStrategy {
    async deploy(params: DeployParams): Promise<DeploymentResult> {
      const stages = [
        { percentage: 5, duration: '5m', checkpoints: ['error_rate', 'latency'] },
        { percentage: 25, duration: '10m', checkpoints: ['all'] },
        { percentage: 50, duration: '15m', checkpoints: ['all'] },
        { percentage: 100, duration: '0', checkpoints: [] }
      ];
      
      for (const stage of stages) {
        // 트래픽 라우팅
        await this.routeTraffic(params.version, stage.percentage);
        
        // 대기
        if (stage.duration !== '0') {
          await this.wait(stage.duration);
        }
        
        // 검증
        const metrics = await this.collectMetrics(stage.checkpoints);
        const analysis = await this.analyzeMetrics(metrics);
        
        if (!analysis.healthy) {
          // 롤백
          await this.rollback(params.environment);
          throw new DeploymentError('Canary analysis failed', analysis);
        }
      }
      
      return { status: 'success' };
    }
  }
}
```

### 2.2 인프라 관리

#### 2.2.1 Infrastructure as Code
```typescript
class InfrastructureManager {
  private providers: Map<string, CloudProvider> = new Map();
  
  // Terraform 래퍼
  class TerraformProvider {
    async provision(config: InfraConfig): Promise<InfrastructureResult> {
      const tfConfig = this.generateTerraformConfig(config);
      
      // Terraform 초기화
      await this.exec('terraform init');
      
      // 계획 생성
      const plan = await this.exec('terraform plan -out=tfplan');
      
      // 계획 검토
      const review = await this.reviewPlan(plan);
      if (!review.approved) {
        throw new Error('Terraform plan not approved');
      }
      
      // 적용
      const result = await this.exec('terraform apply tfplan');
      
      // 출력 수집
      const outputs = await this.exec('terraform output -json');
      
      return {
        resources: this.parseOutputs(outputs),
        state: await this.getState()
      };
    }
    
    private generateTerraformConfig(config: InfraConfig): string {
      return `
        terraform {
          required_version = ">= 1.5.0"
          
          backend "s3" {
            bucket = "${config.stateBucket}"
            key    = "${config.stateKey}"
            region = "${config.region}"
          }
          
          required_providers {
            aws = {
              source  = "hashicorp/aws"
              version = "~> 5.0"
            }
            kubernetes = {
              source  = "hashicorp/kubernetes"
              version = "~> 2.23"
            }
          }
        }
        
        module "eks" {
          source = "./modules/eks"
          
          cluster_name    = "${config.clusterName}"
          cluster_version = "${config.kubernetesVersion}"
          
          vpc_id     = module.vpc.vpc_id
          subnet_ids = module.vpc.private_subnets
          
          node_groups = {
            main = {
              desired_size = ${config.nodeGroups.main.desiredSize}
              min_size     = ${config.nodeGroups.main.minSize}
              max_size     = ${config.nodeGroups.main.maxSize}
              
              instance_types = ["${config.nodeGroups.main.instanceType}"]
              
              labels = {
                Environment = "${config.environment}"
                NodeGroup   = "main"
              }
            }
          }
        }
        
        module "rds" {
          source = "./modules/rds"
          
          engine         = "postgres"
          engine_version = "15.4"
          
          instance_class = "${config.database.instanceClass}"
          storage_size   = ${config.database.storageSize}
          
          multi_az               = ${config.database.multiAz}
          backup_retention_days  = ${config.database.backupRetention}
          
          vpc_id     = module.vpc.vpc_id
          subnet_ids = module.vpc.database_subnets
        }
      `;
    }
  }
}
```

### 2.3 컨테이너 오케스트레이션

#### 2.3.1 Kubernetes 관리
```typescript
class KubernetesOrchestrator {
  private client: K8sClient;
  
  // 애플리케이션 배포
  async deployApplication(manifest: AppManifest): Promise<DeploymentResult> {
    // Deployment 생성
    const deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: manifest.name,
        namespace: manifest.namespace,
        labels: manifest.labels
      },
      spec: {
        replicas: manifest.replicas,
        selector: {
          matchLabels: manifest.labels
        },
        template: {
          metadata: {
            labels: manifest.labels,
            annotations: {
              'prometheus.io/scrape': 'true',
              'prometheus.io/port': '9090'
            }
          },
          spec: {
            containers: [{
              name: manifest.name,
              image: `${manifest.image}:${manifest.version}`,
              ports: manifest.ports.map(p => ({
                containerPort: p.port,
                protocol: p.protocol || 'TCP'
              })),
              env: this.buildEnvVars(manifest.env),
              resources: {
                requests: manifest.resources.requests,
                limits: manifest.resources.limits
              },
              livenessProbe: {
                httpGet: {
                  path: manifest.probes.liveness.path,
                  port: manifest.probes.liveness.port
                },
                initialDelaySeconds: 30,
                periodSeconds: 10
              },
              readinessProbe: {
                httpGet: {
                  path: manifest.probes.readiness.path,
                  port: manifest.probes.readiness.port
                },
                initialDelaySeconds: 5,
                periodSeconds: 5
              },
              volumeMounts: manifest.volumes?.map(v => ({
                name: v.name,
                mountPath: v.mountPath
              }))
            }],
            volumes: manifest.volumes?.map(v => ({
              name: v.name,
              configMap: v.configMap ? { name: v.configMap } : undefined,
              secret: v.secret ? { secretName: v.secret } : undefined,
              persistentVolumeClaim: v.pvc ? { claimName: v.pvc } : undefined
            }))
          }
        },
        strategy: {
          type: manifest.strategy || 'RollingUpdate',
          rollingUpdate: {
            maxSurge: '25%',
            maxUnavailable: '25%'
          }
        }
      }
    };
    
    // Service 생성
    const service = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: manifest.name,
        namespace: manifest.namespace
      },
      spec: {
        selector: manifest.labels,
        ports: manifest.ports.map(p => ({
          port: p.port,
          targetPort: p.port,
          protocol: p.protocol || 'TCP'
        })),
        type: manifest.serviceType || 'ClusterIP'
      }
    };
    
    // HPA 생성 (선택적)
    if (manifest.autoscaling) {
      const hpa = {
        apiVersion: 'autoscaling/v2',
        kind: 'HorizontalPodAutoscaler',
        metadata: {
          name: manifest.name,
          namespace: manifest.namespace
        },
        spec: {
          scaleTargetRef: {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            name: manifest.name
          },
          minReplicas: manifest.autoscaling.minReplicas,
          maxReplicas: manifest.autoscaling.maxReplicas,
          metrics: manifest.autoscaling.metrics
        }
      };
      
      await this.client.apply(hpa);
    }
    
    // 적용
    await this.client.apply(deployment);
    await this.client.apply(service);
    
    // 배포 대기
    await this.waitForRollout(manifest.name, manifest.namespace);
    
    return {
      status: 'success',
      resources: { deployment, service }
    };
  }
}
```

### 2.4 모니터링 및 알림

#### 2.4.1 헬스체크 시스템
```typescript
class HealthCheckSystem {
  private checks: Map<string, HealthCheck> = new Map();
  
  // 헬스체크 정의
  registerHealthCheck(config: HealthCheckConfig): void {
    const check = {
      name: config.name,
      type: config.type,
      target: config.target,
      interval: config.interval || 30000,
      timeout: config.timeout || 5000,
      retries: config.retries || 3,
      successThreshold: config.successThreshold || 1,
      failureThreshold: config.failureThreshold || 3
    };
    
    this.checks.set(config.name, check);
    this.scheduleCheck(check);
  }
  
  // HTTP 헬스체크
  async performHTTPCheck(check: HealthCheck): Promise<HealthStatus> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), check.timeout);
    
    try {
      const response = await fetch(check.target, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      return {
        healthy: response.ok,
        statusCode: response.status,
        responseTime: Date.now() - startTime,
        message: response.ok ? 'OK' : `HTTP ${response.status}`
      };
    } catch (error) {
      clearTimeout(timeout);
      
      return {
        healthy: false,
        error: error.message,
        message: 'Connection failed'
      };
    }
  }
  
  // TCP 헬스체크
  async performTCPCheck(check: HealthCheck): Promise<HealthStatus> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const startTime = Date.now();
      
      socket.setTimeout(check.timeout);
      
      socket.connect(check.port, check.host, () => {
        socket.destroy();
        resolve({
          healthy: true,
          responseTime: Date.now() - startTime,
          message: 'TCP connection successful'
        });
      });
      
      socket.on('error', (error) => {
        resolve({
          healthy: false,
          error: error.message,
          message: 'TCP connection failed'
        });
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          healthy: false,
          message: 'TCP connection timeout'
        });
      });
    });
  }
}
```

## 3. 자동 스케일링

### 3.1 수평 스케일링
```typescript
class AutoScaler {
  private metrics: MetricsProvider;
  private scaler: Scaler;
  
  // 스케일링 결정
  async evaluateScaling(): Promise<ScalingDecision> {
    const currentMetrics = await this.metrics.getCurrentMetrics();
    const predictions = await this.predictFutureLoad();
    
    // CPU 기반 스케일링
    if (currentMetrics.cpu > 70) {
      return { action: 'scale_up', factor: Math.ceil(currentMetrics.cpu / 70) };
    }
    
    // 메모리 기반 스케일링
    if (currentMetrics.memory > 80) {
      return { action: 'scale_up', factor: 1.5 };
    }
    
    // 큐 길이 기반 스케일링
    if (currentMetrics.queueLength > 100) {
      return { action: 'scale_up', factor: 2 };
    }
    
    // 예측 기반 스케일링
    if (predictions.expectedLoad > currentMetrics.capacity * 0.8) {
      return { 
        action: 'scale_up', 
        factor: predictions.expectedLoad / currentMetrics.capacity 
      };
    }
    
    // 스케일 다운 조건
    if (currentMetrics.cpu < 30 && currentMetrics.memory < 40) {
      return { action: 'scale_down', factor: 0.5 };
    }
    
    return { action: 'maintain' };
  }
}
```

## 4. 백업 및 복구

### 4.1 백업 시스템
```typescript
class BackupSystem {
  // 자동 백업
  async scheduleBackups(): Promise<void> {
    // 데이터베이스 백업
    cron.schedule('0 2 * * *', async () => {
      await this.backupDatabase();
    });
    
    // 파일 시스템 백업
    cron.schedule('0 3 * * *', async () => {
      await this.backupFileSystem();
    });
    
    // 설정 백업
    cron.schedule('0 4 * * 0', async () => {
      await this.backupConfiguration();
    });
  }
  
  // 복구 프로세스
  async restore(backupId: string): Promise<RestoreResult> {
    const backup = await this.getBackup(backupId);
    
    // 1. 서비스 중지
    await this.stopServices();
    
    // 2. 데이터 복원
    await this.restoreData(backup);
    
    // 3. 설정 복원
    await this.restoreConfiguration(backup);
    
    // 4. 무결성 검증
    await this.verifyIntegrity();
    
    // 5. 서비스 재시작
    await this.startServices();
    
    return { status: 'success', restoredAt: Date.now() };
  }
}
```

## 5. 성능 요구사항

### 5.1 배포 메트릭
- 배포 시간: < 5분
- 롤백 시간: < 2분
- 가용성: 99.9% (연간 8.76시간 다운타임)
- RTO: < 1시간
- RPO: < 15분
