import pymysql
import pymysql.cursors
import os
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from pathlib import Path
from contextlib import contextmanager

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
    for k, v in row.items():
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

def get_connection():
    """Returns a connection to the MySQL database."""
    conn = pymysql.connect(**MYSQL_CONFIG)
    return conn

@contextmanager
def get_db():
    """Context manager for MySQL transactions with auto commit and rollback on error."""
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
    """Verifies MySQL connection to 'billing' database and ensures tables exist."""
    print("[Database] Connecting to MySQL database 'billing' (user: root)...")
    try:
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) AS total_tables FROM information_schema.tables WHERE table_schema = 'billing';")
                cnt = cursor.fetchone()
                print(f"[Database] Connected successfully! Found {cnt['total_tables']} tables in MySQL 'billing' database.")
    except Exception as e:
        print(f"[Database] Error connecting to MySQL: {e}")
        raise
