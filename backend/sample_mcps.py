"""
Enhanced sample MCP schemas for testing and demonstration
"""
import json
import sqlite3
from datetime import datetime

ENHANCED_SAMPLE_MCPS = [
    {
        "id": "weather-mcp-001",
        "name": "weather.forecast",
        "description": "Real-time weather data and forecasting with global coverage and severe weather alerts",
        "schema": {
            "name": "weather.forecast",
            "version": "2.1.0",
            "description": "Advanced weather forecasting tools with real-time alerts",
            "tools": [
                {
                    "name": "get_current_weather",
                    "description": "Get current weather conditions for a specific location with detailed metrics",
                    "parameters": {
                        "location": "string",
                        "units": "string",
                        "include_alerts": "boolean"
                    }
                },
                {
                    "name": "get_forecast",
                    "description": "Get weather forecast for next 14 days with hourly breakdown",
                    "parameters": {
                        "location": "string",
                        "days": "number",
                        "units": "string",
                        "hourly": "boolean"
                    }
                },
                {
                    "name": "get_severe_alerts",
                    "description": "Get active severe weather alerts for a region",
                    "parameters": {
                        "location": "string",
                        "alert_types": "array"
                    }
                },
                {
                    "name": "get_air_quality",
                    "description": "Get current air quality index and pollutant levels",
                    "parameters": {
                        "location": "string",
                        "pollutants": "array"
                    }
                }
            ]
        },
        "tags": ["weather", "api", "forecast", "alerts", "air-quality"],
        "domain": "weather",
        "validated": True,
        "popularity": 95,
        "source_platform": "github",
        "confidence_score": 0.95
    },
    {
        "id": "search-mcp-002", 
        "name": "web.search",
        "description": "Comprehensive web search and content retrieval with multiple search engines",
        "schema": {
            "name": "web.search",
            "version": "3.0.0",
            "description": "Multi-engine web search capabilities with content extraction",
            "tools": [
                {
                    "name": "search_web",
                    "description": "Search the web using multiple search engines with ranking",
                    "parameters": {
                        "query": "string",
                        "limit": "number",
                        "safe_search": "boolean",
                        "engines": "array",
                        "language": "string"
                    }
                },
                {
                    "name": "get_page_content",
                    "description": "Extract and parse content from web pages with metadata",
                    "parameters": {
                        "url": "string",
                        "format": "string",
                        "extract_images": "boolean",
                        "extract_links": "boolean"
                    }
                },
                {
                    "name": "search_images",
                    "description": "Search for images with advanced filtering options",
                    "parameters": {
                        "query": "string",
                        "size": "string",
                        "color": "string",
                        "license": "string"
                    }
                },
                {
                    "name": "search_news",
                    "description": "Search for recent news articles with source filtering",
                    "parameters": {
                        "query": "string",
                        "sources": "array",
                        "date_range": "string",
                        "language": "string"
                    }
                }
            ]
        },
        "tags": ["search", "web", "content", "news", "images"],
        "domain": "search",
        "validated": True,
        "popularity": 88,
        "source_platform": "github",
        "confidence_score": 0.92
    },
    {
        "id": "calc-mcp-003",
        "name": "math.calculator", 
        "description": "Advanced mathematical calculations, formula evaluation, and scientific computing",
        "schema": {
            "name": "math.calculator",
            "version": "2.5.0",
            "description": "Comprehensive mathematical computation tools with scientific functions",
            "tools": [
                {
                    "name": "calculate",
                    "description": "Evaluate mathematical expressions with support for complex operations",
                    "parameters": {
                        "expression": "string",
                        "precision": "number",
                        "angle_unit": "string"
                    }
                },
                {
                    "name": "solve_equation",
                    "description": "Solve algebraic and differential equations",
                    "parameters": {
                        "equation": "string",
                        "variable": "string",
                        "method": "string"
                    }
                },
                {
                    "name": "matrix_operations",
                    "description": "Perform matrix calculations and linear algebra operations",
                    "parameters": {
                        "operation": "string",
                        "matrices": "array",
                        "precision": "number"
                    }
                },
                {
                    "name": "statistical_analysis",
                    "description": "Perform statistical analysis on datasets",
                    "parameters": {
                        "data": "array",
                        "analysis_type": "string",
                        "confidence_level": "number"
                    }
                }
            ]
        },
        "tags": ["math", "calculator", "equations", "statistics", "linear-algebra"],
        "domain": "math",
        "validated": True,
        "popularity": 76,
        "source_platform": "github",
        "confidence_score": 0.89
    },
    {
        "id": "ecommerce-mcp-004",
        "name": "ecommerce.store",
        "description": "Complete e-commerce platform with inventory management, payments, and analytics",
        "schema": {
            "name": "ecommerce.store",
            "version": "3.2.0",
            "description": "Full-featured e-commerce platform tools with advanced analytics",
            "tools": [
                {
                    "name": "search_products",
                    "description": "Search products with advanced filtering and sorting options",
                    "parameters": {
                        "query": "string",
                        "category": "string",
                        "price_range": "object",
                        "brand": "string",
                        "rating_min": "number",
                        "sort_by": "string"
                    }
                },
                {
                    "name": "manage_inventory",
                    "description": "Manage product inventory with stock tracking",
                    "parameters": {
                        "product_id": "string",
                        "action": "string",
                        "quantity": "number",
                        "warehouse": "string"
                    }
                },
                {
                    "name": "process_payment",
                    "description": "Process payments with multiple payment methods and fraud detection",
                    "parameters": {
                        "payment_method": "string",
                        "amount": "number",
                        "currency": "string",
                        "customer_id": "string",
                        "fraud_check": "boolean"
                    }
                },
                {
                    "name": "generate_analytics",
                    "description": "Generate sales and customer analytics reports",
                    "parameters": {
                        "report_type": "string",
                        "date_range": "object",
                        "metrics": "array",
                        "format": "string"
                    }
                }
            ]
        },
        "tags": ["ecommerce", "shopping", "payments", "inventory", "analytics"],
        "domain": "ecommerce",
        "validated": True,
        "popularity": 82,
        "source_platform": "github",
        "confidence_score": 0.87
    },
    {
        "id": "calendar-mcp-005",
        "name": "calendar.events",
        "description": "Advanced calendar management with multiple provider integrations and smart scheduling",
        "schema": {
            "name": "calendar.events",
            "version": "2.8.0",
            "description": "Multi-platform calendar management with AI-powered scheduling",
            "tools": [
                {
                    "name": "create_event",
                    "description": "Create calendar events with smart conflict detection",
                    "parameters": {
                        "title": "string",
                        "start_time": "datetime",
                        "end_time": "datetime",
                        "attendees": "array",
                        "location": "string",
                        "description": "string",
                        "recurrence": "object"
                    }
                },
                {
                    "name": "find_meeting_slots",
                    "description": "Find optimal meeting times for multiple attendees",
                    "parameters": {
                        "attendees": "array",
                        "duration": "number",
                        "date_range": "object",
                        "preferences": "object"
                    }
                },
                {
                    "name": "sync_calendars",
                    "description": "Synchronize events across multiple calendar platforms",
                    "parameters": {
                        "source_calendar": "string",
                        "target_calendars": "array",
                        "sync_options": "object"
                    }
                },
                {
                    "name": "analyze_schedule",
                    "description": "Analyze calendar patterns and provide scheduling insights",
                    "parameters": {
                        "calendar_id": "string",
                        "analysis_period": "string",
                        "metrics": "array"
                    }
                }
            ]
        },
        "tags": ["calendar", "events", "scheduling", "sync", "analytics"],
        "domain": "productivity",
        "validated": True,
        "popularity": 71,
        "source_platform": "github",
        "confidence_score": 0.84
    },
    {
        "id": "social-mcp-006",
        "name": "social.media",
        "description": "Multi-platform social media management with content creation and analytics",
        "schema": {
            "name": "social.media",
            "version": "2.3.0",
            "description": "Comprehensive social media management across multiple platforms",
            "tools": [
                {
                    "name": "post_content",
                    "description": "Post content to multiple social media platforms simultaneously",
                    "parameters": {
                        "platforms": "array",
                        "content": "string",
                        "media_urls": "array",
                        "schedule_time": "datetime",
                        "hashtags": "array"
                    }
                },
                {
                    "name": "get_analytics",
                    "description": "Get comprehensive social media analytics and insights",
                    "parameters": {
                        "platforms": "array",
                        "date_range": "object",
                        "metrics": "array",
                        "comparison_period": "object"
                    }
                },
                {
                    "name": "monitor_mentions",
                    "description": "Monitor brand mentions and sentiment across platforms",
                    "parameters": {
                        "keywords": "array",
                        "platforms": "array",
                        "sentiment_analysis": "boolean",
                        "alert_threshold": "number"
                    }
                },
                {
                    "name": "generate_content",
                    "description": "AI-powered content generation for social media posts",
                    "parameters": {
                        "topic": "string",
                        "platform": "string",
                        "tone": "string",
                        "length": "string",
                        "include_hashtags": "boolean"
                    }
                }
            ]
        },
        "tags": ["social", "media", "analytics", "content", "monitoring"],
        "domain": "social",
        "validated": True,
        "popularity": 64,
        "source_platform": "github",
        "confidence_score": 0.78
    },
    {
        "id": "ai-mcp-007",
        "name": "ai.assistant",
        "description": "Advanced AI assistant with multiple model integrations and specialized capabilities",
        "schema": {
            "name": "ai.assistant",
            "version": "1.5.0",
            "description": "Multi-model AI assistant with specialized task capabilities",
            "tools": [
                {
                    "name": "generate_text",
                    "description": "Generate text using various AI models with customizable parameters",
                    "parameters": {
                        "prompt": "string",
                        "model": "string",
                        "max_tokens": "number",
                        "temperature": "number",
                        "style": "string"
                    }
                },
                {
                    "name": "analyze_image",
                    "description": "Analyze images using computer vision models",
                    "parameters": {
                        "image_url": "string",
                        "analysis_type": "string",
                        "detail_level": "string",
                        "extract_text": "boolean"
                    }
                },
                {
                    "name": "translate_text",
                    "description": "Translate text between multiple languages with context awareness",
                    "parameters": {
                        "text": "string",
                        "source_language": "string",
                        "target_language": "string",
                        "preserve_formatting": "boolean"
                    }
                },
                {
                    "name": "summarize_content",
                    "description": "Summarize long-form content with customizable length and style",
                    "parameters": {
                        "content": "string",
                        "summary_length": "string",
                        "style": "string",
                        "key_points": "number"
                    }
                }
            ]
        },
        "tags": ["ai", "assistant", "nlp", "computer-vision", "translation"],
        "domain": "ai",
        "validated": True,
        "popularity": 93,
        "source_platform": "huggingface",
        "confidence_score": 0.96
    },
    {
        "id": "dev-mcp-008",
        "name": "development.tools",
        "description": "Comprehensive development tools for code analysis, deployment, and project management",
        "schema": {
            "name": "development.tools",
            "version": "3.1.0",
            "description": "Full-stack development tools with CI/CD integration",
            "tools": [
                {
                    "name": "analyze_code",
                    "description": "Analyze code quality, security, and performance issues",
                    "parameters": {
                        "repository_url": "string",
                        "language": "string",
                        "analysis_type": "array",
                        "severity_threshold": "string"
                    }
                },
                {
                    "name": "deploy_application",
                    "description": "Deploy applications to various cloud platforms",
                    "parameters": {
                        "platform": "string",
                        "repository_url": "string",
                        "environment": "string",
                        "config": "object"
                    }
                },
                {
                    "name": "manage_dependencies",
                    "description": "Manage project dependencies and security vulnerabilities",
                    "parameters": {
                        "project_path": "string",
                        "package_manager": "string",
                        "update_strategy": "string",
                        "security_scan": "boolean"
                    }
                },
                {
                    "name": "generate_documentation",
                    "description": "Auto-generate project documentation from code",
                    "parameters": {
                        "project_path": "string",
                        "doc_format": "string",
                        "include_examples": "boolean",
                        "api_docs": "boolean"
                    }
                }
            ]
        },
        "tags": ["development", "code-analysis", "deployment", "documentation", "ci-cd"],
        "domain": "development",
        "validated": True,
        "popularity": 79,
        "source_platform": "github",
        "confidence_score": 0.91
    }
]

def populate_enhanced_sample_data():
    """Populate database with enhanced sample MCP data"""
    conn = sqlite3.connect("mcp_playground.db")
    cursor = conn.cursor()
    
    for mcp in ENHANCED_SAMPLE_MCPS:
        cursor.execute('''
            INSERT OR REPLACE INTO mcps (id, name, description, schema_content, tags, domain, validated, popularity, source_platform, confidence_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            mcp["id"],
            mcp["name"],
            mcp["description"],
            json.dumps(mcp["schema"]),
            json.dumps(mcp["tags"]),
            mcp["domain"],
            mcp["validated"],
            mcp["popularity"],
            mcp["source_platform"],
            mcp["confidence_score"]
        ))
    
    conn.commit()
    conn.close()
    print(f"Populated {len(ENHANCED_SAMPLE_MCPS)} enhanced sample MCPs")

if __name__ == "__main__":
    populate_enhanced_sample_data()