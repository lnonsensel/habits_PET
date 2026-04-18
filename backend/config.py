from dataclasses import asdict, dataclass, field


# -- DOCUMENTATION --
@dataclass
class FastAPIDocsParams:
    docs_url: str | None = "/docs"
    redoc_url: str | None = "/redoc"
    openapi_url: str | None = "/openapi.json"


@dataclass
class SwaggerUIParams:
    deepLinking: bool = True  # включить глубокие ссылки на операции
    displayOperationId: bool = True  # показывать ID операций
    defaultModelsExpandDepth: int = 2  # глубина раскрытия моделей
    defaultModelExpandDepth: int = 2
    docExpansion: str = "none"  # "none", "list" или "full"
    filter: bool = True  # поле поиска по операциям
    syntaxHighlight: bool = True  # подсветка синтаксиса
    tryItOutEnabled: bool = True  # сразу включить режим "Try it out"
    persistAuthorization: bool = True  # сохранять авторизацию после обновления
    displayRequestDuration: bool = True  # показывать время выполнения запроса


@dataclass
class RedocUIParams:
    expandResponses: str = "all"  # раскрыть все ответы
    requiredPropsFirst: bool = True  # сначала обязательные поля
    sortPropsAlphabetically: bool = True


tags_metadata = [
    {
        "name": "users",
        "description": "Operations with users",
    },
    {
        "name": "auth",
        "description": "Authentication and registration",
    },
    {"name": "base", "description": "Base endpoints"},
]


@dataclass
class FastAPIBaseParams:
    title: str = "Habit Pet API"
    description: str = "API to track habits"
    version: str = "1.0.0"
    contact: dict[str, str] = field(
        default_factory=lambda: {"email": "support@habitpet.com"}
    )
    license_info: dict[str, str] = field(default_factory=lambda: {"name": "MIT"})
    openapi_tags: list[dict[str, str]] = field(
        default_factory=lambda: tags_metadata.copy()
    )


def collect_fastapi_params(
    base_params: FastAPIBaseParams = FastAPIBaseParams(),
    docs_params: FastAPIDocsParams = FastAPIDocsParams(),
    swagger_params: SwaggerUIParams = SwaggerUIParams(),
    redoc_params: RedocUIParams = RedocUIParams(),
):
    return (
        asdict(base_params)
        | asdict(docs_params)
        | asdict(swagger_params)
        | asdict(redoc_params)
    )
