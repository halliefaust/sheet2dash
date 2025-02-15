import os
import re
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI

# Load API keys from environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not OPENAI_API_KEY:
    raise ValueError("OpenAI API key is missing. Set OPENAI_API_KEY in environment variables.")

if not GOOGLE_API_KEY:
    raise ValueError("Google API key is missing. Set GOOGLE_API_KEY in environment variables.")

# Initialize OpenAI client
client = OpenAI()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def extract_sheet_id(sheet_url):
    """Extracts the spreadsheet ID from a Google Sheets URL."""
    match = re.search(r'/d/([a-zA-Z0-9-_]+)', sheet_url)
    return match.group(1) if match else None

def fetch_sheet_data(sheet_id, sheet_range="Sheet1!A1:Z1000"):
    """Fetches data from a Google Sheet using the Sheets API."""
    api_url = f"https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}/values/{sheet_range}?key={GOOGLE_API_KEY}"
    response = requests.get(api_url)
    if response.status_code != 200:
        raise Exception(f"Error fetching sheet data: {response.text}")
    return response.json()

def ask_llm_about_dashboard(sheet_data):
    """Asks OpenAI LLM what graphs would be useful for a dashboard."""
    prompt = (
        "I have the following Google Sheet data:\n"
        f"{sheet_data}\n\n"
        "Based on this data, what graphs would be helpful to include in a dashboard? "
        "Please provide suggestions and reasoning."
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"LLM API error: {str(e)}"

@app.route('/analyze-sheet', methods=['POST'])
def analyze_sheet():
    """Analyzes a Google Sheet and suggests dashboard graphs."""
    data = request.get_json()
    sheet_url = data.get('sheet_url')

    if not sheet_url:
        return jsonify({"error": "No sheet_url provided"}), 400

    sheet_id = extract_sheet_id(sheet_url)
    if not sheet_id:
        return jsonify({"error": "Invalid Google Sheets URL"}), 400

    try:
        sheet_data = fetch_sheet_data(sheet_id)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    try:
        llm_answer = ask_llm_about_dashboard(sheet_data)
    except Exception as e:
        return jsonify({"error": f"LLM API call failed: {str(e)}"}), 500

    return jsonify({
        "sheet_data": sheet_data,
        "dashboard_suggestions": llm_answer
    })

if __name__ == '__main__':
    app.run(debug=True)
