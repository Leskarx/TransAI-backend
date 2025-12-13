from flask import Flask, request, jsonify
from flask_cors import CORS  # ✅ Import this
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # ✅ Enable CORS for all routes

print("⏳ Loading model... This may take a minute...")
model_name = "facebook/nllb-200-distilled-600M"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
print("✅ Model loaded successfully!")

@app.route("/", methods=["GET"])
def home():
    return "✅ NLLB Translator is running! Use /translate endpoint."

@app.route("/translate", methods=["POST"])
def translate():
    data = request.get_json()
    text = data.get("text", "")
    source_lang = data.get("source_lang", "eng_Latn")
    target_lang = data.get("target_lang", "asm_Beng")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    inputs = tokenizer(text, return_tensors="pt")
    forced_bos_token_id = tokenizer.convert_tokens_to_ids(target_lang)

    translated_tokens = model.generate(
        **inputs,
        forced_bos_token_id=forced_bos_token_id
    )
    translated_text = tokenizer.decode(translated_tokens[0], skip_special_tokens=True)

    return jsonify({"translated_text": translated_text})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
