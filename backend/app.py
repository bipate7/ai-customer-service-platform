from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import logging
from datetime import datetime
import requests
import json
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
import PyPDF2
import docx
import io
import hashlib

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure CORS for production
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:8080",
            "http://localhost:3000", 
            "https://your-frontend-app.onrender.com",  # Will update after deployment
            "*"  # For testing, restrict in production
        ]
    }
})

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
    
    def get_response(self, user_message, user_id, conversation_context=None):
        try:
            knowledge_results = self.rag_system.search_knowledge(user_message)
            
            if knowledge_results:
                return self._generate_response_from_knowledge(user_message, knowledge_results)
            else:
                return self._get_general_response(user_message)
            
        except Exception as e:
            logger.error(f"AI service error: {str(e)}")
            return self._get_fallback_response(user_message)
    
    def _generate_response_from_knowledge(self, user_message, knowledge_results):
        context = "\n\n".join([result['content'] for result in knowledge_results[:2]])
        return self._generate_smart_response(user_message, context)
    
    def _generate_smart_response(self, user_message, context):
        lower_msg = user_message.lower()
        
        response = "Based on our documentation: "
        
        if any(word in lower_msg for word in ['hour', 'time', 'open', 'close']):
            return response + "We're open Monday-Friday 9AM-6PM EST and Saturday 10AM-4PM EST. We're closed on Sundays. Holiday hours may vary."
        
        elif any(word in lower_msg for word in ['password', 'reset', 'forgot']):
            return response + "Go to the login page, click 'Forgot Password', enter your email, and check for a reset link (valid for 2 hours). You'll need to create a new password with at least 8 characters including 1 uppercase letter and 1 number."
        
        elif any(word in lower_msg for word in ['order', 'track', 'delivery', 'shipping']):
            return response + "You can track your order by logging into your account and visiting 'Order History'. We offer Standard (3-5 days), Express (2 days), and Overnight shipping. Free shipping is available on orders over $50."
        
        elif any(word in lower_msg for word in ['return', 'refund', 'exchange']):
            return response + "We have a 30-day return policy from delivery date. Items must be in original condition with tags. Electronics need to be factory reset. Software and digital products are non-refundable."
        
        elif any(word in lower_msg for word in ['contact', 'phone', 'email', 'call']):
            return response + "You can reach us at 1-800-TECH-CORP or support@techcorp.com during business hours. Live chat is also available on our website."
        
        else:
            return response + f"{context[:300]}... How can I help you further with this?"

# Initialize AI service
ai_service = AICustomerService()

@app.route('/')
def home():
    return jsonify({
        "message": "AI Customer Service Platform API", 
        "status": "running",
        "version": "production",
        "environment": os.getenv('ENVIRONMENT', 'development')
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({
                "error": "Missing message in request",
                "status": "error"
            }), 400
        
        user_message = data['message']
        user_id = data.get('userId', 'anonymous')
        conversation_context = data.get('conversationContext', [])
        
        if not user_message.strip():
            return jsonify({
                "error": "Message cannot be empty",
                "status": "error"
            }), 400
        
        ai_response = ai_service.get_response(
            user_message, 
            user_id, 
            conversation_context
        )
        
        response_data = {
            "response": ai_response,
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "system": "RAG Enhanced"
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "status": "error"
        }), 500

@app.route('/api/knowledge/search', methods=['POST'])
def search_knowledge():
    try:
        data = request.get_json()
        query = data.get('query', '')
        
        if not query.strip():
            return jsonify({"error": "Query cannot be empty"}), 400
        
        results = ai_service.rag_system.search_knowledge(query)
        
        return jsonify({
            "query": query,
            "results": results,
            "count": len(results)
        })
        
    except Exception as e:
        logger.error(f"Error in knowledge search: {str(e)}")
        return jsonify({"error": "Search failed"}), 500

@app.route('/api/upload', methods=['POST'])
def upload_document():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        filename = file.filename.lower()
        file_stream = io.BytesIO(file.read())
        
        text = None
        if filename.endswith('.pdf'):
            text = DocumentProcessor.extract_text_from_pdf(file_stream)
        elif filename.endswith('.docx'):
            text = DocumentProcessor.extract_text_from_docx(file_stream)
        elif filename.endswith('.txt'):
            text = DocumentProcessor.extract_text_from_txt(file_stream)
        else:
            return jsonify({"error": "Unsupported file type. Use PDF, DOCX, or TXT"}), 400
        
        if not text:
            return jsonify({"error": "Could not extract text from file"}), 400
        
        success = ai_service.rag_system.add_document(text, file.filename)
        
        if success:
            return jsonify({
                "message": f"File '{file.filename}' uploaded successfully",
                "chunks_added": ai_service.rag_system.get_stats()['total_chunks'],
                "status": "success"
            })
        else:
            return jsonify({"error": "Failed to process document"}), 500
            
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return jsonify({"error": "Upload failed"}), 500

@app.route('/api/knowledge/stats', methods=['GET'])
def get_knowledge_stats():
    stats = ai_service.rag_system.get_stats()
    return jsonify(stats)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy", 
        "timestamp": datetime.utcnow().isoformat(),
        "environment": os.getenv('ENVIRONMENT', 'development')
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)