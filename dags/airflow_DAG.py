from airflow import DAG
from airflow.operators.python import PythonOperator
import openai
from supabase import create_client
import datetime

def analyze_sentiment():
    # Connect to Supabase, get records without sentiment_score
    # Send to OpenAI / LLM
    # Update table with sentiment + keywords
    pass  # Will build this once form ingestion is working

default_args = {"start_date": datetime.datetime(2024, 1, 1)}
dag = DAG("analyze_sentiment", schedule_interval="@hourly", default_args=default_args)

task = PythonOperator(task_id="run_sentiment", python_callable=analyze_sentiment, dag=dag)