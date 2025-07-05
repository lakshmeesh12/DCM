import os
from presidio_analyzer.nlp_engine import SpacyNlpEngine
from presidio_analyzer import AnalyzerEngine, Pattern, PatternRecognizer
from presidio_analyzer.nlp_engine import NlpEngineProvider
from presidio_analyzer.recognizer_registry import RecognizerRegistry
import warnings
import utils.logger_test as logger
from utils import common
from TemporaryStoringClasses import NeededInformation
from typing import List, Dict, Any
import spacy
import re
import traceback

warnings.filterwarnings("ignore")

needed_information = NeededInformation()

class ParsePii:
    # Define PII categories as class attributes
    CONFIDENTIAL = {
        'IN_AADHAR', 'IN_AADHAR_CARD_CUSTOM', 'IN_PASSPORT', 'IN_PASSPORT_CUSTOM',
        'IN_CREDIT_CARD', 'CREDIT_CARD', 'IN_BANK_ACCOUNT', 'MEDICAL_LICENSE',
        'MEDICAL_LICENSE_CUSTOM', 'CRYPTO', 'CRYPTO_CUSTOM'
    }
    
    PRIVATE = {
        'PERSON', 'EMAIL_ADDRESS', 'PHONE_NUMBER', 'IN_PHONE_NUMBER',
        'IN_PAN', 'IN_PAN_CUSTOM', 'IN_DRIVING_LICENSE', 'IN_UPI_ID',
        'DATE_TIME', 'LOCATION'
    }
    
    RESTRICTED = {
        'IN_GST_NUMBER', 'IN_IFSC_CODE', 'IN_VEHICLE_REGISTRATION',
        'IN_VEHICLE_REGISTRATION_CUSTOM', 'IN_VOTER', 'IN_VOTER_ID_CUSTOM',
        'IBAN_CODE', 'IBAN_CODE_CUSTOM', 'IP_ADDRESS', 'URL', 'NRP'
    }

    def __init__(self):
        print("ParsePii.__init__: Starting initialization")
        try:
            self.analyzer = self.main()
            if self.analyzer is None:
                print("ParsePii.__init__: Analyzer is None after main()")
            else:
                print("ParsePii.__init__: Analyzer initialized successfully")
        except Exception as e:
            print(f"ParsePii.__init__: Failed to initialize: {traceback.format_exc()}")
            self.analyzer = None

    def main(self):
        try:
            print("ParsePii.main: Configuring AnalyzerEngine")
            print("ParsePii.main: Available models:", spacy.util.get_installed_models())
            
            # Check if en_spacy_pii_distilbert is installed
            if "en_spacy_pii_distilbert" not in spacy.util.get_installed_models():
                print("ParsePii.main: en_spacy_pii_distilbert model not found, falling back to en_core_web_sm")
                configuration = {
                    "nlp_engine_name": "spacy",
                    "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}]
                }
            else:
                configuration = {
                    "nlp_engine_name": "spacy",
                    "models": [{"lang_code": "en", "model_name": "en_spacy_pii_distilbert"}]
                }
                print("ParsePii.main: Found en_spacy_pii_distilbert model")
            
            # Create NLP engine
            try:
                provider = NlpEngineProvider(nlp_configuration=configuration)
                nlp_engine = provider.create_engine()
                print(f"ParsePii.main: NLP engine created with configuration: {configuration}")
            except Exception as e:
                print(f"ParsePii.main: Failed to create NLP engine: {traceback.format_exc()}")
                raise

            # Updated GST recognizer with more flexible regex and better context
            in_gst_regex = r'[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[0-9A-Z]{1}[0-9A-Z]{1}'
            gst_state_codes = {
                '01': 'JK', '02': 'HP', '03': 'PB', '04': 'CH', '05': 'UK', '06': 'HR', '07': 'DL',
                '08': 'RJ', '09': 'UP', '10': 'BR', '11': 'SK', '12': 'AR', '13': 'NL', '14': 'MN',
                '15': 'MZ', '16': 'TR', '17': 'ML', '18': 'AS', '19': 'WB', '20': 'JH', '21': 'OD',
                '22': 'CG', '23': 'MP', '24': 'GJ', '26': 'DN', '27': 'MH', '29': 'KA', '30': 'GA',
                '31': 'LD', '32': 'KL', '33': 'TN', '34': 'PY', '35': 'AN', '36': 'TS', '37': 'AD',
                '38': 'LA', '97': 'OT'
            }
            
            # Create a custom GST recognizer class with improved validation
            class CustomGSTRecognizer(PatternRecognizer):
                def __init__(self):
                    # Updated regex to be more flexible
                    patterns = [Pattern(name="IN_GST_NUMBER", regex=r'[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[0-9A-Z]{1}[0-9A-Z]{1}', score=0.9)]
                    super().__init__(
                        supported_entity="IN_GST_NUMBER",
                        patterns=patterns,
                        context=["GST", "Registration", "Number", "REG", "GSTIN", "Tax", "Certificate", "Government", "India", "Form"]
                    )
                    self.gst_state_codes = gst_state_codes
                
                def validate_result(self, pattern_text):
                    """Custom validation for GST numbers"""
                    # Remove any whitespace
                    pattern_text = pattern_text.strip()
                    
                    if len(pattern_text) != 15:
                        print(f"ParsePii.main: GST validation failed: Length is {len(pattern_text)}, expected 15")
                        return False
                    
                    # Check state code
                    state_code = pattern_text[:2]
                    if state_code not in self.gst_state_codes:
                        print(f"ParsePii.main: GST validation failed: Invalid state code {state_code}")
                        return False
                    
                    # Check if characters 3-7 are alphabets (PAN first 5 chars)
                    if not pattern_text[2:7].isalpha():
                        print(f"ParsePii.main: GST validation failed: Characters 3-7 should be alphabets")
                        return False
                    
                    # Check if characters 8-11 are digits (PAN last 4 digits)
                    if not pattern_text[7:11].isdigit():
                        print(f"ParsePii.main: GST validation failed: Characters 8-11 should be digits")
                        return False
                    
                    # Check if 12th character is alphabet (PAN check digit)
                    if not pattern_text[11].isalpha():
                        print(f"ParsePii.main: GST validation failed: 12th character should be alphabet")
                        return False
                    
                    print(f"ParsePii.main: GST validation passed for {pattern_text}")
                    return True
                
                def analyze(self, text, entities=None, nlp_artifacts=None):
                    """Override analyze to include custom validation"""
                    results = super().analyze(text, entities, nlp_artifacts)
                    validated_results = []
                    for result in results:
                        pattern_text = text[result.start:result.end]
                        if self.validate_result(pattern_text):
                            validated_results.append(result)
                            print(f"ParsePii.main: Found valid GST: {pattern_text}")
                    return validated_results

            # Initialize registry and load recognizers
            registry = RecognizerRegistry()
            registry.load_predefined_recognizers()
            print("ParsePii.main: Loaded predefined recognizers")

            # Add custom recognizers
            in_phone_regex = common.regex_for_in_phone_number
            in_credit_card = common.regex_for_credit_card
            custom_in_aadhar = common.regex_for_custom_in_aadhar
            custom_in_passport = common.regex_for_custom_in_passport
            custom_in_vehicle_registration = common.regex_for_custom_in_vehicle_registration
            custom_in_voter_id = r'[A-Z]{3}\d{7}'
            custom_in_iban_code = common.regex_for_custom_in_iban_code
            custom_crypto = common.regex_for_custom_crypto
            custom_medical_license = common.regex_for_custom_medical_license
            custom_in_pan = common.regex_for_in_pan
            in_upi_regex = r'[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}'
            in_bank_account_regex = r'\d{12,18}'
            in_ifsc_regex = r'[A-Z]{4}0\d{6}'
            in_driving_license_regex = r'[A-Z]{2}-?\d{2}-?\d{4}-?\d{7}'

            upi_context_keywords = [
                'upi', 'pay', 'payment', 'sbi', 'icici', 'hdfc', 'ybl', 'okaxis', 'pockets',
                'ezeepay', 'eazypay', 'okicici', 'payzapp', 'okhdfcbank', 'rajgovhdfcbank',
                'mahb', 'kotak', 'kaypay', 'kmb', 'kmbl', 'yesbank', 'yesbankltd', 'ubi',
                'united', 'utbi', 'idbi', 'idbibank', 'hsbc', 'pnb', 'centralbank', 'cbin',
                'cboi', 'cnrb', 'barodampay'
            ]

            # Create recognizers
            recognizers = [
                PatternRecognizer(
                    supported_entity="IN_PHONE_NUMBER",
                    patterns=[
                        Pattern(name="IN_PHONE_WITH_COUNTRY", regex=r'\+91[\s\-]?[6-9]\d{9}\b', score=0.9),
                        Pattern(name="IN_PHONE_WITHOUT_COUNTRY", regex=r'(?<!\d)[6-9]\d{9}(?!\d)', score=0.8)
                    ],
                    context=["phone", "mobile", "number", "registered", "contact", "call"]
                ),
                PatternRecognizer(
                    supported_entity="IN_CREDIT_CARD", 
                    patterns=[Pattern(name="IN_CREDIT_CARD", regex=in_credit_card, score=0.7)]
                ),
                PatternRecognizer(
                    supported_entity="IN_AADHAR_CARD_CUSTOM",
                    patterns=[
                        Pattern(name="IN_AADHAR_SPACES", regex=r'\b\d{4}\s\d{4}\s\d{4}\b', score=0.9),
                        Pattern(name="IN_AADHAR_HYPHENS", regex=r'\b\d{4}-\d{4}-\d{4}\b', score=0.9),
                        Pattern(name="IN_AADHAR_CONTINUOUS", regex=r'\b\d{12}\b', score=0.8)
                    ],
                    context=["aadhar", "aadhaar", "uid", "unique", "identification", "number"]
                ),
                PatternRecognizer(
                    supported_entity="IN_PASSPORT_CUSTOM",
                    patterns=[Pattern(name="IN_PASSPORT", regex=r'\b[A-PR-WY][0-9]{7}\b', score=0.9)],
                    context=["passport", "number", "travel", "document", "international"]
                ),
                PatternRecognizer(
                    supported_entity="IN_VEHICLE_REGISTRATION_CUSTOM", 
                    patterns=[Pattern(name="IN_VEHICLE_REGISTRATION_CUSTOM", regex=custom_in_vehicle_registration, score=0.7)]
                ),
                PatternRecognizer(
                    supported_entity="IN_VOTER_ID_CUSTOM",
                    patterns=[Pattern(name="IN_VOTER_ID", regex=r'\b[A-Z]{3}\d{7}\b', score=0.9)],
                    context=["voter", "id", "election", "voting", "card"]
                ),
                PatternRecognizer(
                    supported_entity="IBAN_CODE_CUSTOM", 
                    patterns=[Pattern(name="IBAN_CODE_CUSTOM", regex=custom_in_iban_code, score=0.7)]
                ),
                PatternRecognizer(
                    supported_entity="CRYPTO_CUSTOM", 
                    patterns=[Pattern(name="CRYPTO_CUSTOM", regex=custom_crypto, score=0.7)]
                ),
                PatternRecognizer(
                    supported_entity="MEDICAL_LICENSE_CUSTOM", 
                    patterns=[Pattern(name="MEDICAL_LICENSE_CUSTOM", regex=custom_medical_license, score=0.7)]
                ),
                PatternRecognizer(
                    supported_entity="IN_PAN_CUSTOM",
                    patterns=[Pattern(name="IN_PAN", regex=r'\b[A-Z]{5}\d{4}[A-Z]\b', score=0.9)],
                    context=["pan", "permanent", "account", "number", "income", "tax", "company"]
                ),
                CustomGSTRecognizer(),  # Use the updated custom GST recognizer
                PatternRecognizer(
                    supported_entity="IN_UPI_ID",
                    patterns=[Pattern(name="IN_UPI_ID", regex=in_upi_regex, score=0.8)],
                    context=upi_context_keywords
                ),
                PatternRecognizer(
                    supported_entity="IN_BANK_ACCOUNT",
                    patterns=[
                        Pattern(name="IN_BANK_ACCOUNT_LONG", regex=r'(?<!\d)\d{15,18}(?!\d)', score=0.8),
                        Pattern(name="IN_BANK_ACCOUNT_SHORT", regex=r'(?<!\d)\d{12,15}(?!\d)', score=0.7)
                    ],
                    context=["account", "bank", "number", "savings", "current", "ifsc", "registered", "mobile"]
                ),
                PatternRecognizer(
                    supported_entity="IN_IFSC_CODE", 
                    patterns=[Pattern(name="IN_IFSC_CODE", regex=in_ifsc_regex, score=0.8)]
                ),
                PatternRecognizer(
                    supported_entity="IN_DRIVING_LICENSE",
                    patterns=[
                        Pattern(name="IN_DL_HYPHEN", regex=r'\b[A-Z]{2}-\d{2}-\d{4}-\d{7}\b', score=0.9),
                        Pattern(name="IN_DL_CONTINUOUS", regex=r'\b[A-Z]{2}\d{13}\b', score=0.8)
                    ],
                    context=["driving", "license", "licence", "dl", "vehicle", "transport"]
                ),
            ]

            for recognizer in recognizers:
                registry.add_recognizer(recognizer)
                supported_entities = getattr(recognizer, 'supported_entities', ['Unknown'])
                print(f"ParsePii.main: Added recognizer: {supported_entities}")

            print(f"ParsePii.main: About to create analyzer with {len(recognizers)} custom recognizers")
            try:
                analyzer = AnalyzerEngine(
                    registry=registry,
                    nlp_engine=nlp_engine,
                    supported_languages=["en"]
                )
                print("ParsePii.main: AnalyzerEngine created successfully")
            except Exception as e:
                print(f"ParsePii.main: Failed to create AnalyzerEngine: {traceback.format_exc()}")
                raise
            
            try:
                supported_entities = analyzer.get_supported_entities()
                print(f"ParsePii.main: Supported Entities: {supported_entities}")
            except Exception as e:
                print(f"ParsePii.main: Failed to get supported entities: {traceback.format_exc()}")
                
            logger.logging.info("AnalyzerEngine initialized with custom regular expressions")
            return analyzer
        except Exception as e:
            print(f"ParsePii.main: Error: {traceback.format_exc()}")
            logger.logging.error(str(e))
            return None

    def entity_counter(self, entity_list):
        try:
            freq = {}
            entity_list = sorted(entity_list)
            for items in entity_list:
                freq[items] = entity_list.count(items)
            counter = ""
            for key, value in freq.items():
                if key == entity_list[-1]:
                    counter += f"{key}:{value}"
                else:
                    counter += f"{key}:{value}, "
            print("Number of Entities...:", counter)
            logger.logging.info("Count of each entity from a file")
            return counter
        except Exception as exp:
            logger.logging.error(str(exp))

    def classify(self, text="", **kwargs):
        try:
            if self.analyzer is None:
                print("ParsePii.classify: Analyzer is None, cannot classify")
                return "no"
                
            entities = kwargs.get("entities", [])
            if "path" in kwargs and "fileName" in kwargs:
                with open(os.path.join(kwargs["path"], kwargs["fileName"])) as open_file:
                    text = open_file.read()
                    response = self.analyzer.analyze(correlation_id=0, text=text, entities=entities, language='en')
                    return "yes" if len(response) > 0 else "no"
            elif text:
                response = self.analyzer.analyze(correlation_id=0, text=text, entities=entities, language='en')
                return "yes" if len(response) > 0 else "no"
            else:
                logger.logging.info("Classify text from a file")
                raise Exception("Parameters missing. Pass some text or path & file name as parameters.")
        except Exception as exp:
            print(f"ParsePii.classify: Error: {traceback.format_exc()}")
            logger.logging.error(str(exp))
            return "no"
    def _manual_entity_extraction(self, text, entities):
        """Manual regex-based extraction for critical entities that might be missed"""
        manual_results = {}
        
        # Define manual patterns for critical entities
        manual_patterns = {
            'IN_AADHAR_CARD_CUSTOM': r'\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b',
            'IN_AADHAAR': r'\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b',
            'IN_VOTER_ID_CUSTOM': r'\b[A-Z]{3}\d{7}\b',
            'IN_PAN_CUSTOM': r'\b[A-Z]{5}\d{4}[A-Z]\b',
            'IN_PAN': r'\b[A-Z]{5}\d{4}[A-Z]\b',
            'IN_BANK_ACCOUNT': r'(?<!\d)\d{12,18}(?!\d)',
            'IN_PHONE_NUMBER': r'(?:\+91[\s\-]?)?(?:0)?[6-9]\d{9}\b',
            'IN_PASSPORT_CUSTOM': r'\b[A-PR-WY][0-9]{7}\b',
            'IN_VEHICLE_REGISTRATION_CUSTOM': r'\b[A-Z]{2}[ -]?\d{1,2}[ -]?[A-Z]{1,3}[ -]?\d{4}\b',
            'IN_DRIVING_LICENSE': r'\b[A-Z]{2}-?\d{2}-?\d{4}-?\d{7}\b'
        }
        
        # Only check for entities that are requested
        for entity_type, pattern in manual_patterns.items():
            if entity_type in entities:
                matches = re.findall(pattern, text)
                if matches:
                    # Validate and deduplicate matches
                    validated_matches = set()  # Use set to deduplicate
                    for match in matches:
                        if self._validate_entity(entity_type, match):
                            validated_matches.add(match.strip())
                    
                    if validated_matches:
                        manual_results[entity_type] = list(validated_matches)
        
        return manual_results

    def _validate_entity(self, entity_type, value):
        """Validate extracted entities"""
        try:
            value = value.strip()
            
            if entity_type in ['IN_AADHAR_CARD_CUSTOM', 'IN_AADHAAR']:
                # Remove spaces and hyphens for validation
                clean_value = re.sub(r'[\s\-]', '', value)
                return len(clean_value) == 12 and clean_value.isdigit()
                
            elif entity_type in ['IN_PAN_CUSTOM', 'IN_PAN']:
                return len(value) == 10 and value[:5].isalpha() and value[5:9].isdigit() and value[9].isalpha()
                
            elif entity_type == 'IN_VOTER_ID_CUSTOM':
                return len(value) == 10 and value[:3].isalpha() and value[3:].isdigit()
                
            elif entity_type == 'IN_BANK_ACCOUNT':
                return 9 <= len(value) <= 18 and value.isdigit()
                
            elif entity_type == 'IN_PHONE_NUMBER':
                # Remove non-digit characters except +
                clean_value = re.sub(r'[^\d+]', '', value)
                if clean_value.startswith('+91'):
                    clean_value = clean_value[3:]
                return len(clean_value) == 10 and clean_value[0] in '6789'
                
            elif entity_type == 'IN_PASSPORT_CUSTOM':
                return len(value) == 8 and value[0].isalpha() and value[1:].isdigit()
                
            elif entity_type == 'IN_DRIVING_LICENSE':
                # Remove hyphens and spaces
                clean_value = re.sub(r'[\s\-]', '', value)
                return len(clean_value) == 15 and clean_value[:2].isalpha() and clean_value[2:].isdigit()
                
            return True  # Default validation
            
        except Exception as e:
            print(f"ParsePii._validate_entity: Error validating {entity_type}: {e}")
            return False
    
    def extract(self, text="", **kwargs):
        try:
            if self.analyzer is None:
                print("ParsePii.extract: Analyzer is None, cannot extract")
                return "No PII found", {}
                
            entities = kwargs.get("entities", [])
            print(f"ParsePii.extract: Starting with full text:\n{text}")
            print(f"ParsePii.extract: Entities: {entities}")
            
            original_text = text
            
            if "path" in kwargs and "fileName" in kwargs:
                file_path = os.path.join(kwargs["path"], kwargs["fileName"])
                print(f"ParsePii.extract: Reading file: {file_path}")
                with open(file_path, 'r', encoding='utf-8') as open_file:
                    lines = open_file.readlines()
                    text = ' '.join(line.strip() for line in lines)
                    original_text = text
                    print(f"ParsePii.extract: File full text:\n{text}")
                    
            elif text:
                # Handle credit card processing
                if "IN_CREDIT_CARD" in entities or "CREDIT_CARD" in entities:
                    cc_regex = re.compile(common.regex_for_credit_card)
                    credit_cards = re.findall(cc_regex, text)
                    text = cc_regex.sub(lambda m: 'X' * len(m.group()), text)
                    print(f"ParsePii.extract: Credit cards found: {credit_cards}")
            else:
                raise Exception("Parameters missing. Pass some text or path & file name as parameters.")

            # Use a lower threshold for better detection
            response = self.analyzer.analyze(correlation_id=0, text=text, entities=entities, language='en')
            
            predicted_entities = []
            predicted_information = {}
            
            # Deduplicate entities from analyzer response
            seen_values = {}  # Track values per entity type to avoid duplicates
            for item in response:
                if item.score >= 0.2:
                    entity_text = original_text[item.start:item.end].strip()
                    entity_type = item.entity_type
                    
                    # Initialize set for entity type if not present
                    if entity_type not in seen_values:
                        seen_values[entity_type] = set()
                    
                    # Only add unique values
                    if entity_text not in seen_values[entity_type]:
                        seen_values[entity_type].add(entity_text)
                        predicted_entities.append(entity_type)
                        if entity_type in predicted_information:
                            predicted_information[entity_type].append(entity_text)
                        else:
                            predicted_information[entity_type] = [entity_text]
                        print(f"ParsePii.extract: Found {entity_type} with score {item.score}: {entity_text}")
            
            # Additional manual regex checks for critical entities
            manual_checks = self._manual_entity_extraction(original_text, entities)
            for entity_type, values in manual_checks.items():
                if values:
                    # Deduplicate manual checks
                    unique_values = list(set(values))  # Convert to set to remove duplicates
                    print(f"ParsePii.extract: Manual detection found {entity_type}: {unique_values}")
                    if entity_type in predicted_information:
                        # Only add values not already detected
                        for value in unique_values:
                            if entity_type not in seen_values:
                                seen_values[entity_type] = set()
                            if value not in seen_values[entity_type]:
                                seen_values[entity_type].add(value)
                                predicted_information[entity_type].append(value)
                    else:
                        predicted_information[entity_type] = unique_values
                        seen_values[entity_type] = set(unique_values)
            
            print(f"ParsePii.extract: Final detected entities: {list(predicted_information.keys())}")
            print(f"ParsePii.extract: Final detected information: {predicted_information}")
            
            if not predicted_information:
                print("ParsePii.extract: No PII detected")
                return "No PII found", predicted_information
                
            # Update entity counter to use detected information keys
            entity_list = []
            for entity_type, values in predicted_information.items():
                entity_list.extend([entity_type] * len(values))
                
            logger.logging.info("Extract PII data from text")
            return str(self.entity_counter(entity_list)), predicted_information
            
        except Exception as exp:
            print(f"ParsePii.extract: Error: {traceback.format_exc()}")
            logger.logging.error(str(exp))
            return "No PII found", {}

    def get_stored_information(self):
        try:
            return needed_information.get_needed_information()
        except Exception as exp:
            logger.logging.error(str(exp))

    def categorize_pii_fields(self, input_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        logger.logging.info("Categorizing PII fields...")
        output_list = []
        for item in input_list:
            try:
                file_name = item["File Name"]
                has_pii = item["Has PII ?"]
                extracted_fields = item["Extracted Fields"]
                logger.logging.info(f"Processing file: {file_name}")
                field_counts_str, field_values = extracted_fields
                confidential_entries = []
                private_entries = []
                restricted_entries = []
                other_entries = []
                for entity_type, values in field_values.items():
                    entity_data = {
                        "entity_type": entity_type,
                        "count": len(values),
                        "values": values
                    }
                    if entity_type in self.CONFIDENTIAL:
                        confidential_entries.append(entity_data)
                    elif entity_type in self.PRIVATE:
                        private_entries.append(entity_data)
                    elif entity_type in self.RESTRICTED:
                        restricted_entries.append(entity_data)
                    else:
                        other_entries.append(entity_data)
                        logger.logging.error(f"Unknown entity type '{entity_type}' found in file '{file_name}'.")
                categorized_item = {
                    "File Name": file_name,
                    "Has PII ?": has_pii,
                    "Extracted Fields": extracted_fields,
                    "Categories": {
                        "Confidential": confidential_entries,
                        "Private": private_entries,
                        "Restricted": restricted_entries,
                        "Other": other_entries
                    }
                }
                output_list.append(categorized_item)
                logger.logging.info(f"Completed processing for: {file_name}")
            except Exception as e:
                logger.logging.exception(f"Error processing file '{item.get('File Name', 'Unknown')}': {str(e)}")
        logger.logging.info("Categorization of PII fields completed.")
        return output_list
