import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from testcontainers.postgres import PostgresContainer

from models.db import Base, get_session
from main import app


@pytest.fixture(scope="session")
def postgres_container():
    with PostgresContainer("postgres:18") as container:
        yield container


@pytest.fixture(scope="session")
def db_engine(postgres_container):
    engine = create_engine(postgres_container.get_connection_url())

    Base.metadata.create_all(bind=engine)
    yield engine

    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    session = sessionmaker(autocommit=False, autoflush=False, bind=connection)()

    def override_get_session():
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_session] = override_get_session

    yield session

    transaction.rollback()
    connection.close()
    app.dependency_overrides.pop(get_session, None)


@pytest.fixture(scope="function")
def clean_tables(db_engine):
    with db_engine.connect() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())
        conn.commit()
