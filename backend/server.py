import os
import re
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import openai

# Load API keys from environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not OPENAI_API_KEY:
    raise ValueError("OpenAI API key is missing. Set OPENAI_API_KEY in environment variables.")
if not GOOGLE_API_KEY:
    raise ValueError("Google API key is missing. Set GOOGLE_API_KEY in environment variables.")

openai.api_key = OPENAI_API_KEY

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def extract_sheet_id(sheet_url):
    """Extracts the spreadsheet ID from a Google Sheets URL."""
    match = re.search(r'/d/([a-zA-Z0-9-_]+)', sheet_url)
    return match.group(1) if match else None

def fetch_sheet_data(sheet_id, sheet_range="A1:Z1000"):
    """Fetches data from a Google Sheet using the Sheets API."""
    api_url = f"https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}/values/{sheet_range}?key={GOOGLE_API_KEY}"
    response = requests.get(api_url)
    if response.status_code != 200:
        raise Exception(f"Error fetching sheet data: {response.text}")
    return response.json()


def ask_llm_about_dashboard(processed_data, candidate_chart):
    """
    Passes the processed sheet data and candidate chart configuration
    to the LLM and asks it to suggest the best chart.
    """
    prompt = f"""
    I have the following Google Sheet data:
    {json.dumps(processed_data, indent=2)}

    I have prepared the following chart configuration:
    {json.dumps(candidate_chart, indent=2)}

    Based on the data, please suggest the most appropriate chart configuration from the candidate options.
    If none of the options are appropriate, return an empty array for "charts".

    Please respond in JSON format only.
    """

    json_schema = {
        "type": "object",
        "properties": {
            "charts": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "type": {"type": "string"},
                        "xAxis": {"type": "string"},
                        "data": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "Month": {"type": "string"},
                                    "Alice": {"type": "number"},
                                    "Bob": {"type": "number"},
                                    "Charlie": {"type": "number"}
                                }
                            }
                        },
                        "series": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "key": {"type": "string"}
                                }
                            }
                        }
                    },
                    "required": ["title", "type", "xAxis", "data", "series"]
                }
            }
        },
        "required": ["charts"]
    }


    try:
        client = openai.OpenAI(api_key=OPENAI_API_KEY)  # Instantiate the client
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": "You are a data visualization expert. Respond in JSON format only."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},  # Corrected
            functions=[
                {
                    "name": "generate_chart",
                    "description": "Generate the best chart configuration based on given data.",
                    "parameters": json_schema
                }
            ]
        )
        
        # Extract structured JSON output
        answer = response.choices[0].message.function_call.arguments
        return answer  # This is guaranteed to be valid JSON
    
    except Exception as e:
        return f"LLM API error: {str(e)}"




@app.route('/analyze-sheet', methods=['POST'])
def analyze_sheet():
    """
    Reads a Google Sheet, processes the data, constructs a candidate chart configuration,
    asks the LLM to choose the best chart, and returns the JSON response.
    """
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

    values = sheet_data.get("values")
    if not values or len(values) < 2:
        return jsonify({"error": "Sheet data is insufficient for analysis"}), 400

    # Assume the first row contains headers (e.g., ["Month", "Alice", "Bob", "Charlie"])
    header = values[0]
    data_rows = []
    for row in values[1:]:
        row_dict = {}
        for i, key in enumerate(header):
            row_dict[key] = row[i] if i < len(row) else None
        data_rows.append(row_dict)

    # Convert values (except the first column) to numbers where possible.
    for row in data_rows:
        for key in header[1:]:
            try:
                row[key] = float(row[key]) if row[key] is not None else None
            except (ValueError, TypeError):
                pass

    # Prepare the candidate chart configuration JSON
    candidate_chart = {
        "charts": [
            {
                "title": "Student Scores Over Time",
                "type": "line",
                "xAxis": header[0],
                "data": data_rows,
                "series": [{"key": col} for col in header[1:]]
            }
        ]
    }

    # Ask the LLM to choose the best chart based on the data and candidate configuration.
    llm_answer_str = ask_llm_about_dashboard(data_rows, candidate_chart)

    try:
        # Parse the LLM response as JSON
        llm_chart = json.loads(llm_answer_str)
    except Exception as e:
        return jsonify({
            "error": f"Error parsing LLM response. Raw response: {llm_answer_str}. Exception: {str(e)}"
        }), 500

    return jsonify(llm_chart)

# TODO: modify later
@app.route('/resync', methods=['GET'])
def resync():
    testParam = {
        "charts": [
            {
                "data": [
                    {"": "1", "jack": 10, "jill": 12},
                    {"": "2", "jack": 15, "jill": 30}
                ],
                "series": [{"key": "jack"}, {"key": "jill"}],
                "title": "Student Scores Over Time",
                "type": "line",
                "xAxis": ""
            }
        ]
    }
    return jsonify(testParam)

if __name__ == '__main__':
    app.run(debug=True)
