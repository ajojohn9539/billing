import os
import sys
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from pathlib import Path
from contextlib import contextmanager

# Detect Database Mode
DATABASE_URL = os.getenv('DATABASE_URL') or os.getenv('POSTGRES_URL') or os.getenv('SUPABASE_DB_URL')
if DATABASE_URL and DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

IS_POSTGRES = bool(DATABASE_URL)

if IS_POSTGRES:
    import psycopg2
    from psycopg2.extras import RealDictCursor
else:
    import pymysql
    import pymysql.cursors

    MYSQL_CONFIG = {
        'host': os.getenv('DB_HOST', '127.0.0.1'),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', 'root123'),
        'database': os.getenv('DB_NAME', 'billing'),
        'port': int(os.getenv('DB_PORT', 3306)),
        'cursorclass': pymysql.cursors.DictCursor,
        'autocommit': False,
        'charset': 'utf8mb4'
    }

def clean_row(row: dict) -> dict:
    """Converts Decimal, Date, Time, and Timedelta types to JSON-serializable primitives."""
    if not row:
        return row
    cleaned = {}
    for k, v in dict(row).items():
        if isinstance(v, Decimal):
            cleaned[k] = float(v)
        elif isinstance(v, (date, datetime)):
            cleaned[k] = v.isoformat()
        elif isinstance(v, timedelta):
            total_sec = int(v.total_seconds())
            hours = total_sec // 3600
            minutes = (total_sec % 3600) // 60
            seconds = total_sec % 60
            cleaned[k] = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        elif isinstance(v, time):
            cleaned[k] = str(v)
        else:
            cleaned[k] = v
    return cleaned

class PostgresCursorWrapper:
    """Wraps psycopg2 cursor to provide MySQL/SQLite compatible lastrowid property."""
    def __init__(self, cursor):
        self._cursor = cursor
        self.lastrowid = None

    @property
    def rowcount(self):
        return self._cursor.rowcount

    def execute(self, query, params=None):
        converted_sql = query.replace('?', '%s')
        clean_sql = converted_sql.strip()
        
        # Intercept INSERT statements that don't have RETURNING to capture lastrowid
        if clean_sql.upper().startswith("INSERT") and "RETURNING" not in clean_sql.upper():
            sql_with_returning = f"{clean_sql.rstrip('; ')} RETURNING id;"
            self._cursor.execute(sql_with_returning, params or ())
            try:
                row = self._cursor.fetchone()
                if row:
                    self.lastrowid = row['id'] if isinstance(row, dict) else row[0]
            except Exception:
                pass
            return
        
        self._cursor.execute(converted_sql, params or ())

    def fetchone(self):
        return self._cursor.fetchone()

    def fetchall(self):
        return self._cursor.fetchall()

    def fetchmany(self, size=None):
        return self._cursor.fetchmany(size) if size else self._cursor.fetchmany()

    def close(self):
        return self._cursor.close()

    def __iter__(self):
        return iter(self._cursor)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def __getattr__(self, name):
        return getattr(self._cursor, name)

class PostgresConnectionWrapper:
    """Wraps psycopg2 connection to vend PostgresCursorWrapper cursors."""
    def __init__(self, conn):
        self._conn = conn

    def cursor(self, *args, **kwargs):
        cur = self._conn.cursor(cursor_factory=RealDictCursor)
        return PostgresCursorWrapper(cur)

    def commit(self):
        return self._conn.commit()

    def rollback(self):
        return self._conn.rollback()

    def close(self):
        return self._conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.rollback()
        else:
            self.commit()
        self.close()

    def __getattr__(self, name):
        return getattr(self._conn, name)

def get_connection():
    """Returns a connection to either PostgreSQL or MySQL depending on environment."""
    if IS_POSTGRES:
        conn = psycopg2.connect(DATABASE_URL)
        return PostgresConnectionWrapper(conn)
    else:
        conn = pymysql.connect(**MYSQL_CONFIG)
        return conn

@contextmanager
def get_db():
    """Context manager for database transactions with auto commit and rollback on error."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def query_all(sql: str, params: tuple = ()) -> list[dict]:
    """Execute SQL query and return all rows as list of dictionaries."""
    with get_db() as conn:
        with conn.cursor() as cursor:
            converted_sql = sql.replace('?', '%s')
            cursor.execute(converted_sql, params)
            rows = cursor.fetchall()
            return [clean_row(r) for r in rows]

def query_one(sql: str, params: tuple = ()) -> dict | None:
    """Execute SQL query and return single row or None."""
    with get_db() as conn:
        with conn.cursor() as cursor:
            converted_sql = sql.replace('?', '%s')
            cursor.execute(converted_sql, params)
            row = cursor.fetchone()
            return clean_row(row) if row else None

def execute_insert(sql: str, params: tuple = ()) -> int:
    """Execute SQL insert and return last insert ID."""
    with get_db() as conn:
        with conn.cursor() as cursor:
            converted_sql = sql.replace('?', '%s')
            cursor.execute(converted_sql, params)
            return cursor.lastrowid

def execute_update(sql: str, params: tuple = ()) -> int:
    """Execute SQL update or delete and return affected row count."""
    with get_db() as conn:
        with conn.cursor() as cursor:
            converted_sql = sql.replace('?', '%s')
            cursor.execute(converted_sql, params)
            return cursor.rowcount

def init_db():
    """Verifies database connection and auto-initializes tables if not present."""
    if IS_POSTGRES:
        print("[Database] Connecting to PostgreSQL (Supabase / Render mode)...")
        try:
            with get_db() as conn:
                with conn._conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("SELECT COUNT(*) AS total_tables FROM information_schema.tables WHERE table_schema = 'public';")
                    cnt = cur.fetchone()
                    total = cnt['total_tables']
                    print(f"[Database] PostgreSQL connected successfully! Found {total} tables in public schema.")
                    if total == 0:
                        schema_file = Path(__file__).resolve().parent / "supabase_schema.sql"
                        if schema_file.exists():
                            print(f"[Database] Initializing empty Supabase database from {schema_file.name}...")
                            with open(schema_file, "r", encoding="utf-8") as f:
                                schema_sql = f.read()
                            cur.execute(schema_sql)
                            conn._conn.commit()
                            print("[Database] Supabase schema and seeds initialized successfully!")
        except Exception as e:
            print(f"[Database] Error connecting to PostgreSQL: {e}")
            raise
    else:
        print("[Database] Connecting to MySQL database 'billing' (user: root)...")
        try:
            with get_db() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT COUNT(*) AS total_tables FROM information_schema.tables WHERE table_schema = 'billing';")
                    cnt = cursor.fetchone()
                    print(f"[Database] MySQL connected successfully! Found {cnt['total_tables']} tables in 'billing' database.")
        except Exception as e:
            print(f"[Database] Error connecting to MySQL: {e}")
            raise
