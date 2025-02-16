import os
import re
import json
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

client = OpenAI(
    api_key=OPENAI_API_KEY
)

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

def ask_llm_about_dashboard(processed_data, candidate_chart, user_prompt):
    """
    Passes the processed sheet data and candidate chart configuration
    to the LLM and asks it to suggest the best chart configuration.
    """
    prompt = f"""
I have the following Google Sheet data:
{json.dumps(processed_data, indent=2)}

I have prepared the following chart configuration options:
{json.dumps(candidate_chart, indent=2)}

Based on the data, please suggest the three to eight most appropriate chart configurations from the candidate options. 
If none of the options are appropriate, return an empty array for "charts". Here is the prompt provied by the user: {user_prompt} \n

Please respond in JSON format only.
"""
    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": "You are a data visualization expert. Respond in JSON format only."},
                {"role": "user", "content": prompt}
            ]
        )

        llm_response_content = response.choices[0].message.content.strip()
        print("LLM Response:", llm_response_content)  # <-- Debug print
        return llm_response_content

    except Exception as e:
        error_msg = f'{{"charts": [], "error": "LLM API error: {str(e)}"}}'
        print("LLM Exception:", error_msg)  # <-- Debug print
        return error_msg

@app.route('/analyze-sheet', methods=['POST'])
def analyze_sheet():
    """
    Reads a Google Sheet, processes the data, constructs candidate chart configurations,
    asks the LLM to choose the best charts, and returns a JSON response that includes
    both the generated charts and the raw sheet data.
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

    # Store the raw data for later use in the final JSON response.
    raw_data = values

    # Assume the first row contains headers (e.g., ["Month", "Alice", "Bob", "Charlie"])
    header = values[0]
    data_rows = []
    for row in values[1:]:
        row_dict = {}
        for i, key in enumerate(header):
            row_dict[key] = row[i] if i < len(row) else None
        data_rows.append(row_dict)

    # Convert numeric values (except for the first column) to numbers where possible.
    for row in data_rows:
        for key in header[1:]:
            try:
                row[key] = float(row[key]) if row[key] is not None else None
            except (ValueError, TypeError):
                pass

    # Build candidate chart configurations dynamically based on the sheet data.
    candidate_charts = {"charts": []}

    # 1. Line Chart
    line_chart = {
        "title": "Student Scores Over Time",
        "type": "line",
        "xAxis": header[0],
        "data": data_rows,
        "series": [{"key": col} for col in header[1:]]
    }
    candidate_charts["charts"].append(line_chart)

    # 2. Bar Chart
    bar_chart = {
        "title": "Student Scores Over Time (Bar Chart)",
        "type": "bar",
        "xAxis": header[0],
        "data": data_rows,
        "series": [{"key": col} for col in header[1:]]
    }
    candidate_charts["charts"].append(bar_chart)

    # 3. Pie Chart – if there is at least one data row, create a pie chart based on the last row.
    if data_rows:
        last_row = data_rows[-1]
        # Build pie chart data: use the first column value from the last row to name the chart.
        pie_data = []
        for col in header[1:]:
            pie_data.append({
                "Student": col,
                "Score": last_row.get(col)
            })
        pie_chart = {
            "title": f"Student Scores Distribution (Pie Chart for {last_row.get(header[0], 'N/A')})",
            "type": "pie",
            "xAxis": "Student",
            "data": pie_data,
            "series": [{"key": "Score"}]
        }
        candidate_charts["charts"].append(pie_chart)

    # Ask the LLM to select/improve the best chart configurations
    print("user prompt", data.get('prompt'))
    llm_answer_str = ask_llm_about_dashboard(data_rows, candidate_charts, data.get('prompt'))
    if not llm_answer_str:
        return jsonify({
            "error": "LLM returned an empty response."
        }), 500

    llm_answer_str = llm_answer_str.lstrip()
    # If the response starts with "json", remove it.
    if llm_answer_str.startswith("json"):
        llm_answer_str = llm_answer_str[len("json"):].strip()
    llm_chart = json.loads(llm_answer_str)

    try:
        llm_chart = json.loads(llm_answer_str)
    except Exception as e:
        return jsonify({
            "error": f"Error parsing LLM response. Raw response: {llm_answer_str}. Exception: {str(e)}"
        }), 500

    # Combine the LLM's chart suggestions with the raw data.
    final_response = {
        "charts": llm_chart.get("charts", []),
        "raw_data": raw_data
    }

    return jsonify(final_response)

# TODO: modify later
@app.route('/resync', methods=['POST'])
def resync():
    # Parse JSON from the request body
    try:
        data = request.get_json()
        print("Received Data:", data)  # Debugging output

        # Example test response
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
        return jsonify(testParam), 200  # Returning a JSON response with a 200 status code

    except Exception as e:
        return jsonify({"error": str(e)}), 400  # Handle errors gracefully

if __name__ == '__main__':
    app.run(debug=True)
