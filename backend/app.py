from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import logging
from datetime import datetime
import json
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
import PyPDF2
import docx
import io
import hashlib
import time
import functools

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Security Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Simple Cache Implementation
class SimpleCache:
    def __init__(self):
        self._cache = {}
    
    def get(self, key):
        return self._cache.get(key)
    
    def set(self, key, value, timeout=None):
        self._cache[key] = value
    
    def clear(self):
        self._cache.clear()
    
    def get_stats(self):
        return {"size": len(self._cache)}

# Initialize cache
cache_manager = SimpleCache()

# Configure CORS - SIMPLIFIED FOR DEBUGGING
CORS(app)  # Allow all origins temporarily

# Configure logging for production
if __name__ != '__main__':
    gunicorn_logger = logging.getLogger('gunicorn.error')
    app.logger.handlers = gunicorn_logger.handlers
    app.logger.setLevel(gunicorn_logger.level)
else:
    logging.basicConfig(level=logging.INFO)

logger = app.logger

# Create uploads directory
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Performance monitoring decorator
def performance_monitor(func):
    """Decorator to monitor performance of functions"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        execution_time = end_time - start_time
        logger.info(f"Function {func.__name__} executed in {execution_time:.4f} seconds")
        return result
    return wrapper

# Initial knowledge base
INITIAL_KNOWLEDGE_BASE = """
TechCorp Customer Service Guidelines:

Business Hours: 
- Monday to Friday: 9:00 AM - 6:00 PM EST
- Saturday: 10:00 AM - 4:00 PM EST
- Sunday: Closed
- Holiday hours may vary

Contact Information:
- Customer Support: 1-800-TECH-CORP (1-800-832-4267)
- Email: support@techcorp.com
- Live Chat: Available on website during business hours

Password Reset Process:
1. Go to login page and click "Forgot Password"
2. Enter your registered email address
3. Check email for reset link (valid for 2 hours)
4. Create new password (minimum 8 characters, 1 uppercase, 1 number)
5. Login with new credentials

Order Tracking:
- Standard Shipping: 3-5 business days
- Express Shipping: 2 business days
- Overnight Shipping: Next business day
- Track your order: Login → Order History → View Tracking

Return Policy:
- 30-day return period from delivery date
- Items must be in original condition with tags
- Electronics must be factory reset
- Software and digital products are non-refundable

Shipping Costs:
- Free shipping on orders over $50
- Standard: $4.99
- Express: $9.99
- Overnight: $19.99

Warranty Information:
- Electronics: 1-year limited warranty
- Accessories: 90-day warranty
- Software: Lifetime updates
"""

class DocumentProcessor:
    @staticmethod
    @performance_monitor
    def extract_text_from_pdf(file_stream):
        try:
            pdf_reader = PyPDF2.PdfReader(file_stream)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"PDF extraction error: {str(e)}")
            return None

    @staticmethod
    @performance_monitor
    def extract_text_from_docx(file_stream):
        try:
            doc = docx.Document(file_stream)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"DOCX extraction error: {str(e)}")
            return None

    @staticmethod
    @performance_monitor
    def extract_text_from_txt(file_stream):
        try:
            return file_stream.read().decode('utf-8')
        except Exception as e:
            logger.error(f"TXT extraction error: {str(e)}")
            return None

class RAGSystem:
    def __init__(self):
        self.knowledge_base = self._prepare_initial_knowledge()
        self.vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
        self.vectors = self._vectorize_knowledge()
        self.document_metadata = {}
    
    def _prepare_initial_knowledge(self):
        sections = re.split(r'\n\s*\n', INITIAL_KNOWLEDGE_BASE)
        return [section.strip() for section in sections if section.strip()]
    
    def _vectorize_knowledge(self):
        if not self.knowledge_base:
            return None
        return self.vectorizer.fit_transform(self.knowledge_base)
    
    @performance_monitor
    def add_document(self, text, filename):
        try:
            chunks = self._split_into_chunks(text)
            
            for chunk in chunks:
                if chunk.strip() and len(chunk.strip()) > 50:
                    self.knowledge_base.append(chunk.strip())
            
            doc_hash = hashlib.md5(text.encode()).hexdigest()
            self.document_metadata[doc_hash] = {
                'filename': filename,
                'chunks': len(chunks),
                'added_date': datetime.utcnow().isoformat()
            }
            
            if self.knowledge_base:
                self.vectors = self.vectorizer.fit_transform(self.knowledge_base)
            
            # Clear cache when new documents are added
            cache_manager.clear()
            
            logger.info(f"Added document '{filename}' with {len(chunks)} chunks")
            return True
            
        except Exception as e:
            logger.error(f"Error adding document: {str(e)}")
            return False
    
    def _split_into_chunks(self, text, chunk_size=500):
        sentences = re.split(r'[.!?]+', text)
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            if len(current_chunk) + len(sentence) <= chunk_size:
                current_chunk += sentence + ". "
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence + ". "
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    @performance_monitor
    def search_knowledge(self, query, top_k=3):
        try:
            if not self.knowledge_base:
                return []
            
            query_vec = self.vectorizer.transform([query])
            similarities = cosine_similarity(query_vec, self.vectors).flatten()
            top_indices = similarities.argsort()[-top_k:][::-1]
            
            results = []
            for idx in top_indices:
                if similarities[idx] > 0.1:
                    results.append({
                        'content': self.knowledge_base[idx],
                        'similarity': float(similarities[idx]),
                        'source': 'uploaded_document' if idx >= len(INITIAL_KNOWLEDGE_BASE.split('\n\n')) else 'base_knowledge'
                    })
            
            return results
            
        except Exception as e:
            logger.error(f"Error in knowledge search: {str(e)}")
            return []
    
    def get_stats(self):
        return {
            'total_chunks': len(self.knowledge_base),
            'uploaded_documents': len(self.document_metadata),
            'base_knowledge_chunks': len(INITIAL_KNOWLEDGE_BASE.split('\n\n'))
        }

class AICustomerService:
    def __init__(self):
        self.rag_system = RAGSystem()
    
    @performance_monitor
    def get_response(self, user_message, user_id, conversation_context=None):
        try:
            print(f"🔍 Searching knowledge for: {user_message}")
            knowledge_results = self.rag_system.search_knowledge(user_message)
            print(f"📚 Found {len(knowledge_results)} knowledge results")
            
            if knowledge_results:
                response = self._generate_response_from_knowledge(user_message, knowledge_results)
            else:
                response = self._get_general_response(user_message)
            
            print(f"🤖 Generated response: {response}")
            return response
            
        except Exception as e:
            print(f"❌ AI service error: {str(e)}")
            logger.error(f"AI service error: {str(e)}")
            return self._get_fallback_response(user_message)
    
    def _generate_response_from_knowledge(self, user_message, knowledge_results):
        context = "\n\n".join([result['content'] for result in knowledge_results[:2]])
        return self._generate_smart_response(user_message, context)
    
    def _generate_smart_response(self, user_message, context):
        lower_msg = user_message.lower()
        
        # Simple keyword-based responses for testing
        if any(word in lower_msg for word in ['hour', 'time', 'open', 'close']):
            return "Our business hours are Monday to Friday 9:00 AM - 6:00 PM EST and Saturday 10:00 AM - 4:00 PM EST. We're closed on Sundays."
        
        elif any(word in lower_msg for word in ['contact', 'phone', 'email', 'call', 'reach']):
            return "You can contact us at 1-800-TECH-CORP or support@techcorp.com. Live chat is available on our website during business hours."
        
        elif any(word in lower_msg for word in ['password', 'reset', 'forgot']):
            return "To reset your password, go to the login page and click 'Forgot Password'. Enter your email and follow the instructions in the reset link (valid for 2 hours)."
        
        elif any(word in lower_msg for word in ['order', 'track', 'shipping', 'delivery']):
            return "You can track your order by logging into your account and visiting 'Order History'. We offer Standard (3-5 days), Express (2 days), and Overnight shipping."
        
        elif any(word in lower_msg for word in ['return', 'refund']):
            return "We have a 30-day return policy. Items must be in original condition. Electronics need factory reset. Software products are non-refundable."
        
        else:
            return f"I understand you're asking about: '{user_message}'. Based on our documentation: {context[:200]}... How can I assist you further?"

    def _get_general_response(self, user_message):
        lower_msg = user_message.lower()
        
        if any(word in lower_msg for word in ['hello', 'hi', 'hey']):
            return "Hello! Welcome to TechCorp Customer Service. How can I assist you today?"
        elif any(word in lower_msg for word in ['thank', 'thanks']):
            return "You're welcome! Is there anything else I can help you with?"
        elif any(word in lower_msg for word in ['bye', 'goodbye']):
            return "Thank you for contacting TechCorp Customer Service. Have a great day!"
        else:
            return f"Thank you for your question about '{user_message}'. I'm here to help with business hours, orders, returns, technical support, and more. Could you provide more specific details?"

    def _get_fallback_response(self, user_message):
        return "I apologize, but I'm having trouble processing your request right now. Please try again in a moment."

# Initialize AI service
ai_service = AICustomerService()

@app.route('/')
def home():
    return jsonify({
        "message": "AI Customer Service Platform API", 
        "status": "running",
        "version": "1.0",
        "timestamp": datetime.utcnow().isoformat()
    })

@app.route('/chat', methods=['POST', 'OPTIONS'])
def chat():
    try:
        # Handle preflight requests
        if request.method == 'OPTIONS':
            response = jsonify({'status': 'ok'})
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
            response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
            return response
            
        print("=== CHAT ENDPOINT CALLED ===")
        data = request.get_json()
        print(f"Request data: {data}")
        
        if not data:
            return jsonify({"error": "No JSON data received"}), 400
            
        user_message = data.get('message', '').strip()
        user_id = data.get('user_id', 'anonymous')
        
        if not user_message:
            return jsonify({"error": "Message cannot be empty"}), 400
        
        print(f"📩 Message from {user_id}: {user_message}")
        
        # Get response from AI service
        response = ai_service.get_response(user_message, user_id)
        
        print(f"📤 Sending response: {response}")
        
        return jsonify({
            "response": response,
            "message_id": hashlib.md5(f"{user_id}{datetime.utcnow().isoformat()}".encode()).hexdigest(),
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        print(f"💥 ERROR in chat endpoint: {str(e)}")
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({
            "error": "I apologize, but I'm having trouble processing your request right now. Please try again in a moment."
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "AI Customer Service Backend",
        "environment": os.getenv('ENVIRONMENT', 'production')
    })

@app.route('/stats', methods=['GET'])
def get_stats():
    try:
        stats = ai_service.rag_system.get_stats()
        cache_stats = cache_manager.get_stats()
        
        return jsonify({
            "knowledge_base_stats": stats,
            "cache_stats": cache_stats,
            "system_status": "operational"
        })
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        return jsonify({"error": "Unable to retrieve statistics"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 Starting server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)