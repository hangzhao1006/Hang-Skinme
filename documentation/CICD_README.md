# CI/CD Pipeline

GitHub Actions CI pipeline for automated testing and quality checks.

## Overview

**Triggers**: Push/PR to `milestone3` branch
**Platform**: GitHub Actions
**Duration**: ~3-4 minutes

## Pipeline Jobs

| Job | Tests | Duration | Status |
|-----|-------|----------|--------|
| Build | Docker image | 1m55s | ✅ |
| Lint | Ruff checks | 57s | ✅ |
| Unit Tests | 75 tests | 1m34s | ✅ |
| Integration Tests | 21 tests | 1m9s | ✅ |
| System Tests | Full API | 1m16s | ✅ |
| E2E Tests | Workflows | 1m8s | ✅ |

**Total**: 96+ tests, **53% coverage** (exceeds 50% requirement)

## Test File Structure

```
tests/
├── conftest.py                                    # Shared pytest fixtures
├── unit/                                          # 75 unit tests
│   ├── test_utils.py                             # Utility function tests
│   ├── test_personalization_cache.py             # Cache mechanism tests
│   ├── test_personalization_context_retriever.py # Context retrieval tests
│   └── test_personalization_profile_manager.py   # Profile management tests
├── integration/                                   # 21 integration tests
│   └── test_api.py                               # API component integration
├── system/                                        # System tests
│   └── test_system_api.py                        # Full API server tests
└── e2e/                                          # End-to-end tests
    ├── __init__.py
    └── test_e2e_full_flow.py                     # Complete user workflows
```

## CI Jobs Details

### 1. Build Docker Image
Builds `skincare-api` image, saves as artifact for other jobs.

### 2. Lint & Format
```bash
ruff check .      # PEP 8 compliance
ruff format --check .  # Formatting
```

### 3. Unit Tests (75 tests)
Tests individual functions with mocked dependencies.

### 4. Integration Tests (21 tests)
Tests component interactions (API, agents, database).

### 5. System Tests
Full API server tests with real HTTP requests.

### 6. E2E Tests
Complete user workflows (image analysis, recommendations).

### 7. Coverage Report (53%)

Name                                                              Stmts   Miss  Cover
-------------------------------------------------------------------------------------
src/api-service/agent/__init__.py                                     0      0   100%
src/api-service/agent/analysis_agent.py                             111     57    49%
src/api-service/agent/image_analysis_agent.py                        64     45    30%
src/api-service/agent/personalization/__init__.py                     0      0   100%
src/api-service/agent/personalization/cache.py                       30      0   100%
src/api-service/agent/personalization/chat_logger.py                104     76    27%
src/api-service/agent/personalization/image_upload_handler.py        64     38    41%
src/api-service/agent/personalization/profile_extractor.py           96     74    23%
src/api-service/agent/personalization/user_context_retriever.py      67      3    96%
src/api-service/agent/personalization/user_profile_manager.py       123     11    91%
src/api-service/agent/recommendation_agent.py                        64     52    19%
src/api-service/agent/routing_agent.py                               47     32    32%
src/api-service/api-service/main.py                                  71      6    92%
src/api-service/api-service/runner.py                                94     48    49%
-------------------------------------------------------------------------------------
TOTAL                                                               935    442    53%

## Running Locally

### All tests:
```bash
cd src/api-service
docker-compose run --rm skincare-api pytest -v
```

### With coverage:
```bash
docker run --rm \
  -v $(pwd):/app:rw \
  -e COVERAGE_FILE=/tmp/.coverage \
  skincare-api:local \
  bash -c "pytest --cov=api-service --cov-report=html:/tmp/coverage && \
           cp -r /tmp/coverage /app/"
```

### Linting:
```bash
docker run --rm skincare-api:local ruff check .
docker run --rm skincare-api:local ruff format --check .
```

## CI Evidence

### Required Screenshots

1. ✅ **All jobs passing** - Green checkmarks for all 7 jobs
2. ✅ **Build successful** - Docker build completed
3. ✅ **Linting passed** - Ruff checks with no errors
4. ✅ **Tests passing** - 96+ tests all green
5. ✅ **Coverage 53%** - Exceeds 50% minimum requirement

**Screenshot location**: `.github/workflows/screenshots/`

### How to capture:
1. Go to Actions tab after successful run
2. Screenshot summary showing all jobs ✅
3. Screenshot coverage report artifact
4. Save in screenshots folder

## Troubleshooting

**Linting fails**:
```bash
docker run --rm -v $(pwd):/app skincare-api:local ruff format .
```

**Coverage < 50%**:
Add more unit tests to increase coverage.

**Build fails**:
```bash
docker build --no-cache -t skincare-api:debug -f Dockerfile .
```

## Environment Variables

```yaml
GOOGLE_GENAI_USE_VERTEXAI: "false"
GCP_PROJECT: "test-project"
BUCKET_NAME: "test-bucket"
COVERAGE_FILE: "/tmp/.coverage"
```

## Related Docs

- [Frontend README](FRONTEND_README.md)
- [Backend README](../src/api-service/README.md)
