"""
Sample MCP schemas for testing and demonstration
"""

SAMPLE_MCPS = [
    {
        "id": "weather-mcp-001",
        "name": "weather.forecast",
        "description": "Real-time weather data and forecasting with global coverage",
        "schema": {
            "name": "weather.forecast",
            "version": "1.0.0",
            "description": "Weather forecasting tools",
            "tools": [
                {
                    "name": "get_current_weather",
                    "description": "Get current weather for a specific location",
                    "parameters": {
                        "location": "string",
                        "units": "string"
                    }
                },
                {
                    "name": "get_forecast",
                    "description": "Get weather forecast for next 7 days",
                    "parameters": {
                        "location": "string",
                        "days": "number",
                        "units": "string"
                    }
                }
            ]
        },
        "tags": ["weather", "api", "forecast"],
        "domain": "weather",
        "validated": True,
        "popularity": 95
    },
    {
        "id": "search-mcp-002", 
        "name": "web.search",
        "description": "Web search and content retrieval tools",
        "schema": {
            "name": "web.search",
            "version": "2.1.0",
            "description": "Web search capabilities",
            "tools": [
                {
                    "name": "search_web",
                    "description": "Search the web for information",
                    "parameters": {
                        "query": "string",
                        "limit": "number",
                        "safe_search": "boolean"
                    }
                },
                {
                    "name": "get_page_content",
                    "description": "Extract content from a web page",
                    "parameters": {
                        "url": "string",
                        "format": "string"
                    }
                }
            ]
        },
        "tags": ["search", "web", "content"],
        "domain": "search",
        "validated": True,
        "popularity": 88
    },
    {
        "id": "calc-mcp-003",
        "name": "math.calculator", 
        "description": "Mathematical calculations and formula evaluation",
        "schema": {
            "name": "math.calculator",
            "version": "1.5.0",
            "description": "Mathematical computation tools",
            "tools": [
                {
                    "name": "calculate",
                    "description": "Evaluate mathematical expressions",
                    "parameters": {
                        "expression": "string",
                        "precision": "number"
                    }
                },
                {
                    "name": "solve_equation",
                    "description": "Solve algebraic equations",
                    "parameters": {
                        "equation": "string",
                        "variable": "string"
                    }
                }
            ]
        },
        "tags": ["math", "calculator", "equations"],
        "domain": "math",
        "validated": True,
        "popularity": 76
    },
    {
        "id": "ecommerce-mcp-004",
        "name": "ecommerce.store",
        "description": "E-commerce functionality with product management and payments",
        "schema": {
            "name": "ecommerce.store",
            "version": "2.0.0",
            "description": "E-commerce platform tools",
            "tools": [
                {
                    "name": "search_products",
                    "description": "Search for products in the store",
                    "parameters": {
                        "query": "string",
                        "category": "string",
                        "price_range": "object"
                    }
                },
                {
                    "name": "add_to_cart",
                    "description": "Add product to shopping cart",
                    "parameters": {
                        "product_id": "string",
                        "quantity": "number"
                    }
                },
                {
                    "name": "process_payment",
                    "description": "Process payment for cart items",
                    "parameters": {
                        "payment_method": "string",
                        "amount": "number"
                    }
                }
            ]
        },
        "tags": ["ecommerce", "shopping", "payments"],
        "domain": "ecommerce",
        "validated": True,
        "popularity": 82
    },
    {
        "id": "calendar-mcp-005",
        "name": "calendar.events",
        "description": "Calendar management with Google Calendar integration",
        "schema": {
            "name": "calendar.events",
            "version": "1.3.0",
            "description": "Calendar and event management",
            "tools": [
                {
                    "name": "create_event",
                    "description": "Create a new calendar event",
                    "parameters": {
                        "title": "string",
                        "start_time": "datetime",
                        "end_time": "datetime",
                        "attendees": "array"
                    }
                },
                {
                    "name": "list_events",
                    "description": "List upcoming events",
                    "parameters": {
                        "start_date": "date",
                        "end_date": "date",
                        "calendar_id": "string"
                    }
                }
            ]
        },
        "tags": ["calendar", "events", "scheduling"],
        "domain": "productivity",
        "validated": True,
        "popularity": 71
    },
    {
        "id": "social-mcp-006",
        "name": "social.media",
        "description": "Social media posting and analytics tools",
        "schema": {
            "name": "social.media",
            "version": "1.0.0",
            "description": "Social media management",
            "tools": [
                {
                    "name": "post_content",
                    "description": "Post content to social media platforms",
                    "parameters": {
                        "platform": "string",
                        "content": "string",
                        "media_urls": "array"
                    }
                },
                {
                    "name": "get_analytics",
                    "description": "Get social media analytics",
                    "parameters": {
                        "platform": "string",
                        "date_range": "object"
                    }
                }
            ]
        },
        "tags": ["social", "media", "analytics"],
        "domain": "social",
        "validated": False,
        "popularity": 64
    }
]

def populate_sample_data():
    """Populate database with sample MCP data"""
    import sqlite3
    import json
    
    conn = sqlite3.connect("mcp_playground.db")
    cursor = conn.cursor()
    
    for mcp in SAMPLE_MCPS:
        cursor.execute('''
            INSERT OR REPLACE INTO mcps (id, name, description, schema_content, tags, domain, validated, popularity)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            mcp["id"],
            mcp["name"],
            mcp["description"],
            json.dumps(mcp["schema"]),
            json.dumps(mcp["tags"]),
            mcp["domain"],
            mcp["validated"],
            mcp["popularity"]
        ))
    
    conn.commit()
    conn.close()
    print(f"Populated {len(SAMPLE_MCPS)} sample MCPs")

if __name__ == "__main__":
    populate_sample_data()