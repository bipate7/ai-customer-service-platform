import re
import html
from urllib.parse import urlparse
import logging

logger = logging.getLogger(__name__)

class SecurityUtils:
    @staticmethod
    def sanitize_input(text):
        """Sanitize user input to prevent XSS and injection attacks"""
        if not text:
            return text
            
        # HTML escape
        sanitized = html.escape(text)
        
        # Remove potentially dangerous patterns
        dangerous_patterns = [
            r'<script.*?>.*?</script>',
            r'javascript:',
            r'vbscript:', 
            r'on\w+=\s*',
            r'expression\s*\(',
        ]
        
        for pattern in dangerous_patterns:
            sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE)
            
        return sanitized.strip()
    
    @staticmethod
    def validate_filename(filename):
        """Validate uploaded file names"""
        if not filename:
            return False
            
        # Check for path traversal attempts
        if '..' in filename or '/' in filename or '\\' in filename:
            return False
            
        # Check file extension
        allowed_extensions = {'.pdf', '.docx', '.txt', '.md'}
        file_ext = '.' + filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
        
        return file_ext in allowed_extensions
    
    @staticmethod
    def validate_url(url):
        """Validate URLs to prevent SSRF attacks"""
        try:
            result = urlparse(url)
            return all([result.scheme in ['http', 'https'], result.netloc])
        except Exception:
            return False
    
    @staticmethod
    def check_content_security(text):
        """Check content for potential security issues"""
        issues = []
        
        # Check for potential PII
        pii_patterns = {
            'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            'phone': r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
            'ssn': r'\b\d{3}-\d{2}-\d{4}\b'
        }
        
        for pii_type, pattern in pii_patterns.items():
            if re.search(pattern, text):
                issues.append(f"Potential {pii_type.upper()} detected")
                
        return issues