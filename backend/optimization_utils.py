import time
import functools
from flask import request
import logging

def performance_monitor(func):
    """Decorator to monitor performance of functions"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        execution_time = end_time - start_time
        logging.info(f"Function {func.__name__} executed in {execution_time:.4f} seconds")
        return result
    return wrapper

# If you need the OptimizationUtils class as well, add:
class OptimizationUtils:
    def __init__(self):
        pass
    
    @staticmethod
    def optimize_response(response):
        # Add your optimization logic here
        return response