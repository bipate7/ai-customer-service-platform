import time
import functools
from flask import request
import logging

class OptimizationUtils:
    def __init__(self):
        pass
    
    @staticmethod
    def timing_decorator(func):
        """Decorator to measure and log execution time"""
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            result = func(*args, **kwargs)
            end_time = time.time()
            execution_time = end_time - start_time
            logging.info(f"{func.__name__} executed in {execution_time:.4f} seconds")
            return result
        return wrapper
    
    @staticmethod
    def optimize_response(response):
        # Add your optimization logic here
        return response

# Keep the performance_monitor function if you're using it elsewhere
def performance_monitor(func):
    """Alternative decorator for performance monitoring"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        execution_time = end_time - start_time
        logging.info(f"Function {func.__name__} executed in {execution_time:.4f} seconds")
        return result
    return wrapper