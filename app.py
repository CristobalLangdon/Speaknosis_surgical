from flask import Flask, request, render_template
from pydub import AudioSegment
from google.cloud import speech_v1p1beta1 as speech
from google.cloud import storage
import os
import openai
from datetime import datetime

# Set Google Cloud project ID and Bucket Name
os.environ['GOOGLE_CLOUD_PROJECT'] = 'development-luzmira'
GOOGLE_APPLICATION_CREDENTIALS='/home/sebastian/lardoctor-001/credentials/development-luzmira-9733109e5158.json'

# Set OpenAI API key
openai.api_key = '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'

# Choose the GPT model to use
model_engine = "gpt-4"
tokens = 1100
temp = 0
instruction = """
Eres un asistente inteligente para un médico especializado en editar informes quirúrgicos. Tu tarea principal es procesar y refinar las transcripciones de las grabaciones de audio del médico que realizó la cirugía. Por favor, sigue las siguientes directrices:
		Análisis de la Transcripción: Analiza cuidadosamente la transcripción que contiene la explicación del médico sobre la cirugía. La conversación puede contener términos médicos, descripciones de síntomas y procedimientos quirúrgicos.
		Corrección de Errores: Al procesar la transcripción, ten en cuenta las inexactitudes y malentendidos. Utiliza tu conocimiento sobre terminología médica y el contexto de la conversación para corregir cualquier error o frase poco clara.
		Extracción de Datos: Extrae puntos de datos vitales mencionados durante la conversación, como los síntomas descritos, el procedimiento quirúrgico realizado y cualquier observación específica hecha por el médico.
		Formateo del Informe: Estructura la transcripción refinada en un informe quirúrgico formal. Comienza con el número de registro de salud del paciente, seguido de secciones para síntomas, descripción del procedimiento y observaciones del médico.
		Mejoras Sugeridas: Basándote en los datos extraídos, sugiere posibles mejoras o áreas de enfoque que el médico debe considerar en futuras interacciones o procedimientos.
{
  "instruction_type": "surgical_report",
  "language": "es",
  "details": {
    "writing_style": {
      "precision": true,
      "clarity": true,
      "logic": true,
      "simplicity": true,
      "brevity": true,
      "elegance": true
    },
    "report_structure": {
      "pre_operative_information": {
        "patient_details": {
          "name": "string",
          "age": "integer",
          "medical_history": "string",
          "pre_operative_assessments": "string",
          "indications_for_operation": "string"
        },
        "heading": {
          "facility_information": "string",
          "patient_information": {
            "name": "string",
            "date_of_birth": "date",
            "age": "integer",
            "gender": "string"
          },
          "date_of_service": "date",
          "surgical_team_information": {
            "primary_surgeon_name": "string",
            "co_surgeons_names": "string",
            "residents_names": "string",
            "surgical_assistants_names": "string",
            "anesthesiologist_name": "string"
          },
          "surgical_procedure_details": "string",
          "instruments_and_equipment_used": "string",
          "diagnoses": "string"
        },
        "body": {
          "procedure_description": "string",
          "coding_considerations": "string"
        },
        "findings": "string",
        "intraoperative_events": "string",
        "postoperative_care": "string",
        "outcome": "string"
      }
    }
  }
}
"""

app = Flask(__name__)

def summarize_text(text):
    response = openai.ChatCompletion.create(
        model=model_engine,
        messages=[
            {"role": "system", "content": instruction},
            {"role": "user", "content": text},
        ],
        max_tokens=tokens,
        temperature=temp,
    )
    return response.choices[0].text.strip()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/summarize', methods=['POST'])
def summarize():
    text = request.form['text']
    summary = summarize_text(text)
    return render_template('summary.html', summary=summary)

if __name__ == '__main__':
    app.run(debug=True)
