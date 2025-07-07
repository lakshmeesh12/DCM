import os
from openai import OpenAI
from dotenv import load_dotenv
import json

# Load environment variables from .env file
load_dotenv()
OPEN_AI_KEY = os.getenv("OPEN_AI_KEY")

class LLMEntityDetector:
    """
    A class to detect and categorize entities in text using Open AI's API.
    """

    def __init__(self):
        if not OPEN_AI_KEY:
            raise ValueError("Open AI API key not found in .env file")
        self.client = OpenAI(api_key=OPEN_AI_KEY)

    def detect_entities(self, text, entities, category_mapping=None, file_name="unknown", user_prompt=None):
        """
        Detect specified entities and custom entities from user_prompt in the provided text.
        Categorize them based on category_mapping, defaulting to CONFIDENTIAL for custom entities.
        """
        try:
            print(f"Processing file: {file_name}")
            if not text:
                print(f"Warning: No text provided for file: {file_name}")
                return {"CONFIDENTIAL": {}, "PRIVATE": {}, "RESTRICTED": {}}

            # Initialize categorized results
            categorized_results = {"CONFIDENTIAL": {}, "PRIVATE": {}, "RESTRICTED": {}}
            default_category = "CONFIDENTIAL"

            # Handle predefined entities
            predefined_entities = entities if entities and isinstance(entities, list) else []
            entity_list = ", ".join(predefined_entities) if predefined_entities else "none"

            # Create a prompt for entity detection
            prompt = f"""
            You are an expert in entity detection for Indian financial and identity documents. Perform the following tasks:

            1. Extract the following predefined entities: {entity_list}.
               Predefined entity definitions:
               - CREDIT_CARD: 16-digit credit card numbers (e.g., 1234 5678 9012 3456).
               - IN_AADHAR: 12-digit Aadhaar numbers (e.g., 1234 5678 9012).
               - IN_PAN: 10-character PAN numbers (e.g., ABCDE1234F).
               - EMAIL_ADDRESS: Standard email addresses (e.g., user@domain.com). Do NOT classify UPI IDs (e.g., 1234567890@upi) as email addresses.
               - IN_UPI_ID: UPI IDs (e.g., 9731934127@ybl, 9876543210@oksbi).
               - DATE_TIME: Dates and times (e.g., 02/01/2025, 02 Jan'25 17:37Hrs).
               - LOCATION: Addresses or places (e.g., KOTA, RAJASTHAN).
               - PERSON: Names of individuals (e.g., John Doe).
               - PHONE_NUMBER: Phone numbers (e.g., +91 9876543210).
               - IN_PASSPORT: Indian passport numbers (e.g., A1234567).
               - GSTIN: Indian GSTIN numbers (e.g., 36AAACQ5437A1ZS).
               - COMPANY_NAME: Business names (e.g., ABC Corp).
               - URL: Website URLs (e.g., www.tataaig.com).
               - IN_VEHICLE_REGISTRATION: Vehicle registration numbers (e.g., RJ20).
               - IN_BANK_ACCOUNT: Bank account numbers (e.g., 3646101010863).
               - IN_IFSC_CODE: IFSC codes (e.g., SBIN0003646).

            2. If a user prompt is provided, extract additional entities based on the prompt: {user_prompt or 'none'}.
               - For specific entities mentioned in the prompt (e.g., "engine no", "policy no"), detect and name them as uppercase with underscores (e.g., ENGINE_NO, POLICY_NO).
               - For generic prompts (e.g., "find all vehicle related information", "find all PII", "business information"), infer relevant entities from the text content and assign custom entity names based on the context (e.g., VEHICLE_TYPE, INSURANCE_PROVIDER).
               - Ensure custom entity names are clear, uppercase with underscores, and relevant to the prompt and text content.

            Return a JSON object with entity types as keys and lists of detected entities as values. If no entities are found for a type, return an empty list. Do not return "NA" for empty entities.
            Text: {text}
            """

            # Call OpenAI API to detect entities
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an entity detection assistant."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )

            # Parse the response
            if not response.choices or not response.choices[0].message.content:
                print(f"No response from OpenAI API for file: {file_name}")
                return categorized_results

            try:
                entity_results = json.loads(response.choices[0].message.content)
                if not isinstance(entity_results, dict):
                    print(f"Invalid response format from OpenAI API for file: {file_name}")
                    return categorized_results
                print(f"Detected entities for {file_name}: {entity_results}")
            except json.JSONDecodeError:
                print(f"Error parsing OpenAI response for file: {file_name}")
                return categorized_results

            # Categorize entities
            detected_entities = set(entity_results.keys())
            for entity in detected_entities:
                # Categorize custom entities (not in predefined_entities) as CONFIDENTIAL
                category = (
                    category_mapping.get(entity, default_category)
                    if category_mapping and entity in predefined_entities
                    else default_category
                )
                # Skip empty lists
                if entity_results.get(entity):
                    categorized_results[category][entity] = entity_results[entity]

            return categorized_results

        except Exception as e:
            print(f"Error in LLM entity detection for file {file_name}: {str(e)}")
            return {"CONFIDENTIAL": {}, "PRIVATE": {}, "RESTRICTED": {}}