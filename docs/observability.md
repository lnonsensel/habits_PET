# Observability

Три столпа наблюдаемости: **метрики** (Prometheus + Grafana), **логи** (Loki + Promtail), **трейсинг** (OpenTelemetry + Jaeger).

---

## Обзор технологий

### Prometheus

**Что это.** Time-series база данных и движок для сбора метрик. Работает по модели pull: сам периодически опрашивает (scrape) HTTP-эндпоинты сервисов и сохраняет числовые ряды вида `имя_метрики{лейблы} значение timestamp`.

**Для чего нужен.** Отвечает на вопросы типа «сколько запросов в секунду прямо сейчас», «какой P95 задержки за последние 5 минут», «сколько активных привычек». Поверх данных работают алерт-правила.

**В проекте.** Scrape раз в 15 секунд:
- `/metrics` на бэкенде — HTTP-метрики (instrumentator) + 3 кастомных бизнес-метрики
- `postgres-exporter:9187` — метрики PostgreSQL из `pg_stat_*`
- `redis-exporter:9121` — метрики Redis (память, hit rate, клиенты)

Данные хранятся 15 дней в volume `prometheus_data`.

---

### Grafana

**Что это.** Платформа для визуализации данных из произвольных источников. Сама ничего не собирает — только читает и рисует.

**Для чего нужна.** Единый UI для всех трёх сигналов: метрики из Prometheus, логи из Loki, трейсы из Jaeger — всё открывается в одном интерфейсе. Можно кликнуть на аномальный spike на графике, провалиться в логи за тот же период и затем в конкретный трейс.

**В проекте.** Два преднастроенных дашборда (provisioned автоматически):
- `api.json` — HTTP request rate, error rate, latency p50/p95/p99
- `business.json` — активные привычки, пользователи, CRUD-операции по таблицам

Datasources (Prometheus, Loki, Jaeger) также provisioned и не требуют ручной настройки. Доступна на `localhost:3001`.

**Связка с Prometheus.** Prometheus — хранилище, Grafana — витрина. Prometheus умеет показывать графики сам (`localhost:9090`), но его UI минималистичен и предназначен для отладки запросов, а не для постоянного наблюдения. Grafana берёт те же данные и даёт полноценные дашборды, аннотации, алерты с уведомлениями и корреляцию с логами.

---

### Loki

**Что это.** Хранилище логов от Grafana Labs, спроектированное по образцу Prometheus. Не индексирует содержимое строк — только лейблы (`service`, `container`, `stream`). Это делает его дешёвым по памяти и диску.

**Для чего нужен.** Агрегирует логи всех контейнеров в одном месте и позволяет искать по ним через язык запросов LogQL прямо из Grafana.

**В проекте.** Принимает логи от Promtail и отдаёт их Grafana. Хранит данные в volume `loki_data`. Не нужно логировать в файлы или настраивать syslog — бэкенд пишет в stdout, Promtail подхватывает.

**Связка с Grafana.** Loki — backend, Grafana — frontend. Запросы LogQL (например, `{service="backend"} |= "ERROR"`) исполняются в Loki, результаты рендерятся в Grafana. Grafana также умеет автоматически строить ссылки «перейти к логам» прямо с графика Prometheus (feature `traceToMetrics`).

---

### Promtail

**Что это.** Агент-коллектор логов для Loki. Читает источники (файлы, systemd journal, Docker) и пушит строки в Loki с нужными лейблами.

**Для чего нужен.** Мост между Docker и Loki. Без него логи контейнеров живут только в `docker logs` и недоступны для поиска.

**В проекте.** Подключается к Docker socket (`/var/run/docker.sock`), autodiscovery через `docker_sd_configs` — автоматически подхватывает все контейнеры compose-проекта и навешивает лейблы `container`, `service`, `project`, `stream`. Добавлять новый сервис — логи появятся в Grafana сами.

**Связка с Loki.** Promtail — агент доставки, Loki — приёмник. Вместе они заменяют классический стек ELK (Logstash + Elasticsearch), но значительно проще в эксплуатации и дешевле по ресурсам.

---

### OpenTelemetry Collector

**Что это.** Вендор-нейтральный proxy для телеметрии (трейсы, метрики, логи). Принимает данные по протоколу OTLP, обрабатывает (батчинг, семплирование, обогащение) и пересылает в один или несколько бэкендов.

**Для чего нужен.** Развязывает приложение от конкретного бэкенда трейсинга. Бэкенд шлёт трейсы в Collector, а уже Collector решает, куда их отправить (Jaeger, Tempo, Zipkin, облако). При смене бэкенда менять код приложения не нужно.

**В проекте.** Принимает OTLP gRPC на порту `4317` и HTTP на `4318`. Pipeline: `otlp receiver → memory_limiter → batch → otlp/jaeger exporter`. Ограничение памяти 256 MiB, батч — 1024 спана или 1 секунда.

**Связка с Jaeger.** Collector — точка входа и маршрутизатор. Jaeger — финальное хранилище и UI. Бэкенд не знает о Jaeger напрямую.

---

### Jaeger

**Что это.** Система распределённой трассировки. Хранит трейсы — деревья spans, где каждый span описывает одну операцию (HTTP-запрос, SQL-запрос, вызов внешнего API) с временем начала, длительностью и метаданными.

**Для чего нужен.** Отвечает на вопрос «почему этот запрос занял 800ms»: видно полный путь запроса, на каком шаге была задержка, какой SQL выполнялся и сколько.

**В проекте.** Запускается в режиме `all-in-one` (collector + storage + UI в одном процессе). Получает трейсы от OTel Collector, UI доступен на `localhost:16686`. Инструментированы FastAPI (span на каждый HTTP-запрос) и SQLAlchemy (span на каждый SQL). Трейсинг **отключён по умолчанию**, включается через `OTEL_ENABLED=true`.

---

### Экспортеры (postgres-exporter, redis-exporter)

**Что это.** Sidecar-процессы, которые подключаются к сервису (Postgres, Redis), читают его внутренние метрики и переводят их в формат Prometheus.

**Для чего нужны.** Postgres и Redis не экспортируют метрики в формате Prometheus нативно. Экспортеры — адаптеры: Prometheus опрашивает экспортер, экспортер в реальном времени запрашивает `pg_stat_*` или Redis `INFO` и отдаёт ответ.

**В проекте.** `postgres-exporter:9187` и `redis-exporter:9121` оба scrape Prometheus каждые 15 секунд. Credentials берутся из `backend/.db.env` и `backend/.redis.env`.

---

## Архитектура

```
FastAPI backend
  │
  ├── GET /metrics ──────────────────────────► Prometheus (scrape каждые 15s)
  │    ├── HTTP-метрики (instrumentator)              │
  │    ├── CRUD-счётчики (CRUDBase)                  │
  │    └── Gauge-метрики (Celery, каждые 30s)         │
  │                                                   ▼
  ├── OTLP gRPC ──► OTel Collector ──────────► Jaeger UI :16686
  │         :4317         :4317
  │
  └── stdout/stderr ──► Promtail ─────────────► Loki :3100 ──► Grafana :3001
       (Docker logs)    (docker_sd_configs)

Exporters
  ├── postgres-exporter :9187  ──► Prometheus
  └── redis-exporter    :9121  ──► Prometheus

Kubernetes only
  └── kube-state-metrics :8080 ──► Prometheus
```

---

## Метрики

### HTTP-метрики (автоматические)

Собираются через [`prometheus-fastapi-instrumentator`](https://github.com/trallnag/prometheus-fastapi-instrumentator).
Исключены из инструментации: `/metrics`, `/health`, `/docs`, `/openapi.json`.

| Метрика | Тип | Лейблы | Описание |
|---|---|---|---|
| `http_requests_total` | Counter | `method`, `handler`, `status_code` | Всего HTTP-запросов |
| `http_request_duration_highr_seconds` | Histogram | `method`, `handler`, `status_code` | Задержка запросов (высокое разрешение) |
| `http_request_duration_seconds` | Histogram | `method`, `handler`, `status_code` | Задержка запросов |

**Эндпоинт:** `GET /metrics` (в OpenAPI не отображается).

### Бизнес-метрики (кастомные)

**Файл:** `backend/app/core/metrics.py`

| Метрика | Тип | Лейблы | Описание | Источник обновления |
|---|---|---|---|---|
| `habitpet_crud_ops_total` | Counter | `table`, `operation` | CRUD-операции по таблицам | `CRUDBase` (каждая операция) |
| `habitpet_habits_active_total` | Gauge | — | Активных (не архивных) привычек | Celery beat, каждые 30с |
| `habitpet_users_total` | Gauge | — | Всего зарегистрированных пользователей | Celery beat, каждые 30с |

Счётчик `habitpet_crud_ops_total` инкрементируется в `CRUDBase.create / update / delete` — автоматически для всех моделей.

**Полезные PromQL-запросы:**

```promql
# Скорость создания записей привычек
rate(habitpet_crud_ops_total{table="habit_records", operation="create"}[5m])

# Новые пользователи за последний час
increase(habitpet_crud_ops_total{table="users", operation="create"}[1h])

# Доля ошибок 5xx
sum(rate(http_requests_total{status_code=~"5.."}[5m]))
  / sum(rate(http_requests_total[5m])) * 100

# P95 задержки по эндпоинту
histogram_quantile(0.95,
  sum(rate(http_request_duration_highr_seconds_bucket[5m])) by (le, handler)
)
```

### postgres-exporter

Собирает метрики из `pg_stat_*` PostgreSQL.

| Метрика | Описание |
|---|---|
| `pg_up` | Доступность БД (1/0) |
| `pg_stat_database_xact_commit_total` | Коммиты транзакций |
| `pg_stat_database_blks_hit_total` | Попадания в кеш страниц |
| `pg_stat_database_deadlocks_total` | Дедлоки |
| `pg_locks_count` | Активные блокировки по типу |
| `pg_stat_bgwriter_buffers_written` | Записи буферов на диск |

### redis-exporter

| Метрика | Описание |
|---|---|
| `redis_up` | Доступность Redis (1/0) |
| `redis_connected_clients` | Активных соединений |
| `redis_memory_used_bytes` | Использование памяти |
| `redis_keyspace_hits_total` | Попадания в кеш |
| `redis_keyspace_misses_total` | Промахи кеша |
| `redis_commands_processed_total` | Обработано команд |

**Cache hit rate:**
```promql
rate(redis_keyspace_hits_total[5m])
  / (rate(redis_keyspace_hits_total[5m]) + rate(redis_keyspace_misses_total[5m]))
  * 100
```

### kube-state-metrics (только Kubernetes)

| Метрика | Описание |
|---|---|
| `kube_deployment_status_replicas_available` | Доступных подов в деплойменте |
| `kube_pod_status_phase` | Фаза жизненного цикла пода |
| `kube_pod_container_resource_requests` | Запрошенные ресурсы |
| `kube_persistentvolumeclaim_status_phase` | Статус PVC |

---

## Дашборды Grafana

**URL:** `http://localhost:3001` · **Логин:** `admin` / `admin` (сменить через `GF_SECURITY_ADMIN_PASSWORD`)

Дашборды provisioned автоматически из `monitoring/grafana/dashboards/`.

### HabitPet — API (`api.json`)

| Панель | Запрос |
|---|---|
| Request Rate | `sum(rate(http_requests_total[5m])) by (handler, method)` |
| 5xx Error Rate | `100 * sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))` |
| Latency p50 / p95 / p99 | `histogram_quantile(0.95, sum(rate(http_request_duration_highr_seconds_bucket[5m])) by (le))` |
| Latency по эндпоинту (p95) | `... by (le, handler)` |
| Uptime | `up{job="habitpet-backend"}` |

### HabitPet — Business (`business.json`)

| Панель | Запрос |
|---|---|
| Active Habits | `habitpet_habits_active_total` |
| Total Users | `habitpet_users_total` |
| Habit Records Created (24h) | `sum(increase(habitpet_crud_ops_total{table="habit_records",operation="create"}[24h]))` |
| CRUD ops by table | `sum(rate(habitpet_crud_ops_total[5m])) by (table, operation)` |
| User Growth | `habitpet_users_total` |

---

## Admin Panel — встроенные метрики

Метрики доступны в UI панели администратора (`/admin`) и через API без внешнего Prometheus.

### `GET /api/admin/metrics-summary`

Читает текущие значения из Python Prometheus registry (данные накапливаются с момента последнего запуска процесса).

**Ответ `200`:**
```json
{
  "http_total": 1523,
  "http_by_status": {
    "2xx": 1490,
    "3xx": 8,
    "4xx": 23,
    "5xx": 2
  },
  "avg_latency_ms": 34.7,
  "crud_ops": {
    "habits":       { "create": 18, "update": 5,  "delete": 2 },
    "habit_records":{ "create": 310,"update": 0,  "delete": 12 },
    "users":        { "create": 8,  "update": 1,  "delete": 0 }
  },
  "habits_active": 42,
  "users_total": 10,
  "top_endpoints": [
    { "handler": "/api/habits/", "count": 540 },
    { "handler": "/api/habit-records/", "count": 312 },
    { "handler": "/auth/login/", "count": 89 }
  ]
}
```

**Dashboard-секция «Метрики процесса»** показывает:
- HTTP-карточки: всего запросов, 2xx / 4xx / 5xx, средняя задержка
- Таблицу топ-8 эндпоинтов по количеству запросов
- Таблицу CRUD-операций по таблицам (create / update / delete)
- Gauge-карточки: активных привычек и пользователей (обновляются Celery каждые 30с)

---

## Логи (Loki + Promtail)

Promtail собирает логи Docker-контейнеров через Docker socket (`docker_sd_configs`) и шлёт в Loki.

**Лейблы на каждый лог-стрим:**

| Лейбл | Значение |
|---|---|
| `container` | Имя контейнера (`/habits_backend`) |
| `service` | Имя Compose-сервиса (`backend`) |
| `project` | Имя Compose-проекта |
| `stream` | `stdout` / `stderr` |

**Формат логов backend:**
```
2026-05-19 10:23:45 | INFO     | habitpet | GET /habits/ → 200  (12.3 ms)
2026-05-19 10:23:46 | ERROR    | habitpet.crud | create users IntegrityError: ...
```

**Полезные LogQL-запросы:**

```logql
# Все ERROR из backend
{service="backend"} |= "ERROR"

# Медленные запросы (> 500ms)
{service="backend"} | logfmt | duration > 500ms

# 4xx/5xx по HTTP
{service="backend"} |~ " → [45][0-9]{2} "

# Ошибки Celery worker
{service="celery_worker"} |= "failed"

# Стрик-потери
{service="celery_worker"} |= "STREAK_LOST"

# Все логи за контейнером
{container="/habits_backend"}
```

---

## Трейсинг (OpenTelemetry + Jaeger)

Трейсинг **отключён по умолчанию** — включается переменной окружения.

### Включение

Добавить в `.db.env` (или env-секцию backend-сервиса):

```env
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=otel-collector:4317
```

### Что инструментируется автоматически

| Инструментация | Что создаёт |
|---|---|
| `opentelemetry-instrumentation-fastapi` | Span на каждый HTTP-запрос: метод, путь, статус, длительность |
| `opentelemetry-instrumentation-sqlalchemy` | Span на каждый SQL-запрос: оператор, таблица, длительность |

### Маршрут трейса

```
Backend → OTLP gRPC → OTel Collector → Jaeger
    :3000      :4317         :4317       :16686
```

**Jaeger UI:** `http://localhost:16686` → сервис `habitpet-backend`.

### OTel Collector

**Конфиг:** `monitoring/otel-collector/config.yml`

```yaml
receivers:   otlp (gRPC :4317, HTTP :4318)
processors:  memory_limiter → batch
exporters:   otlp/jaeger
```

---

## Алерты

**Файл:** `monitoring/prometheus/rules/alerts.yml`

| Алерт | Условие | Задержка | Severity |
|---|---|---|---|
| `HighErrorRate` | 5xx > 5% за 5 минут | 2m | warning |
| `HighLatencyP95` | p95 > 1s за 5 минут | 5m | warning |
| `BackendDown` | `up{job="habitpet-backend"} == 0` | 1m | critical |
| `PostgresDown` | `up{job="postgres"} == 0` | 1m | critical |
| `RedisDown` | `up{job="redis"} == 0` | 1m | critical |

Для роутинга алертов в Slack / email — добавить `alertmanagers` в `prometheus.yml` и настроить Alertmanager.

---

## Быстрый старт (Docker Compose)

```bash
# 1. Поднять основной стек
make docker-up

# 2. Поднять мониторинг поверх
make monitoring-up

# Проверить статус
make monitoring-ps
```

| Сервис | URL |
|---|---|
| Grafana | http://localhost:3001 |
| Prometheus | http://localhost:9090 |
| Jaeger UI | http://localhost:16686 |
| Loki API | http://localhost:3100 |
| Backend /metrics | http://localhost:3000/metrics |
| postgres-exporter | http://localhost:9187/metrics |
| redis-exporter | http://localhost:9121/metrics |

## Быстрый старт (Kubernetes)

```bash
# Применить все манифесты включая мониторинг
kubectl apply -k k8s/base/

# Или только мониторинг
kubectl apply -f k8s/base/monitoring/

# Port-forward
kubectl port-forward svc/grafana 3001:3000 -n habitpet
kubectl port-forward svc/jaeger 16686:16686 -n habitpet
kubectl port-forward svc/prometheus 9090:9090 -n habitpet
```

---

## Добавление своих метрик

### Counter (событие произошло)

```python
from prometheus_client import Counter

my_counter = Counter(
    "habitpet_my_event_total",
    "Описание",
    ["label1", "label2"],
)

# В коде:
my_counter.labels(label1="val", label2="val").inc()
```

### Gauge (текущее состояние)

```python
from prometheus_client import Gauge

queue_size = Gauge("habitpet_queue_size", "Размер очереди")
queue_size.set(42)
```

### Histogram (измерение длительности)

```python
from prometheus_client import Histogram

call_duration = Histogram(
    "habitpet_external_call_seconds",
    "Время вызова внешнего API",
    buckets=[0.01, 0.05, 0.1, 0.5, 1, 5],
)

with call_duration.time():
    result = call_external_api()
```

---

## Структура файлов

```
monitoring/
├── prometheus/
│   ├── prometheus.yml              # Scrape-конфиг + alertmanager
│   └── rules/
│       └── alerts.yml              # Правила алертов
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/            # Prometheus, Loki, Jaeger (auto-provisioned)
│   │   └── dashboards/             # Провайдер дашбордов
│   └── dashboards/
│       ├── api.json                # API latency / error rate
│       └── business.json           # Бизнес-метрики
├── loki/
│   └── loki-config.yml             # Хранилище, схема (tsdb v13)
├── promtail/
│   └── promtail-config.yml         # Docker log collection
└── otel-collector/
    └── config.yml                  # OTLP receiver → Jaeger

k8s/base/monitoring/
├── kube-state-metrics.yaml         # RBAC + Deployment + Service
├── prometheus.yaml                 # ConfigMap + Deployment + Service
├── grafana.yaml                    # ConfigMap + Deployment + Service + Secret
├── loki.yaml                       # ConfigMap + Deployment + Service
└── jaeger.yaml                     # Jaeger + OTel Collector

backend/app/core/
├── metrics.py                      # Настройка instrumentator + определения метрик
└── tracing.py                      # OTel setup (lazy, при OTEL_ENABLED=true)
```
