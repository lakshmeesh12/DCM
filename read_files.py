# import re
# import docx
# import PyPDF2
# import utils.logger_test as logger
# import pytesseract
# from paddleocr import PaddleOCR
# import pandas as pd
# from docx.api import Document
# import docx2txt
# import os
# from utils import common

# pytesseract.pytesseract.tesseract_cmd = common.pytesserct_path
# # currFolder = common.temp_folder

# output_path = os.getcwd()
# output_path += "\\images"
# ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)


# class ReadFiles:
#     """
#         This is a class detects and extract the text
#          from document ,pdf and image
#         """

#     def __init__(self):
#             # self.ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=True)
#             pass
 
#     def get_text_docx(self, filename):
#         """
#         This function extract the text from the document,extract the text from the table format
#         from the document and save the images from the document.

#         Parameters:
#         ---------
#                 filename:Input document path.
#                 Image: path where the detected images have to be stored.

#          Return:
#         ------
#                 allText: Extracted text is stored.
#                 data: Extracted text from table.
#                 Image: contains paths of extracted tables.
#         """
#         try:
#             print("file_name:", filename)
#             file_name = filename.split("/")[-1]
#             print("filename: ", file_name)
#             doc = docx.Document(filename)
#             fullText = []
#             for para in doc.paragraphs:
#                 fullText.append(para.text)
#             allText = '\n'.join(fullText)
#             print("Get text docx:", allText)

#             # extract tables
#             document = Document(filename)
#             table_count = len(document.tables)
#             print("Table count: ", table_count )
#             for i in range(table_count):
#                 data = []
#                 table = document.tables[i]
#                 keys = None
#                 for j, row in enumerate(table.rows):
#                     text = (cell.text for cell in row.cells)
#                     print("Cell Texts:", text)
#                     if j == 0:
#                         keys = tuple(text)
#                         continue
#                     print("Zipping...")
#                     row_data = dict(zip(keys, text))
#                     data.append(row_data)
#                     print("Data Added")
#                 df = pd.DataFrame(data)
#                 print("Dataframe: ", df)
#                 # df.to_csv(f"{path}/{file_name}_{tabletext}_{i}.csv")
#                 print(f'images/{file_name}_{i}.csv')
#                 df.to_csv(f'images/{file_name}_{i}.csv')
#             print("Data: ", data)
#             # text = docx2txt.process(filename)
#             # extract text and write images in Temporary Image directory
#             output_path = "images"
#             # docx2txt.process(filename, f'{path}/{output_path}')
#             docx2txt.process(filename, output_path)
#             return allText
#         except Exception as e:
#             print("Exception - ", str(e))
#             logger.logging.error(str(e))

#     def get_text_pdf(self, filename):

#         try:
#             j = 1
#             print("filename: ", filename)
#             with open(filename, 'rb') as pdfFile:
#                 # pdfFileObj = open(filename, 'rb')
#                 pdfReader = PyPDF2.PdfReader(pdfFile)
#                 text = ''
#                 for i in range(len(pdfReader.pages)):
#                     pageObj = pdfReader.pages[i]
#                     text += (pageObj.extract_text()).replace("\n", "").replace(" -", "-")
#                     print(text)
#                     print("Page Object: ",pageObj)
#                     try:
#                         for image in pageObj.images:
#                             text += self.get_text_image(image.data)
#                             print("Text from Image: ", text)
#                             with open(f"{output_path}\\page_{j}.jpg", "wb") as fp:
#                                 fp.write(image.data)
#                             j += 1
#                             print("image copied")
#                     except Exception as e:
#                         logger.logging.error(str(e))

#             return text
#         except Exception as e:
#             logger.logging.error(str(e))

#     def get_text_image(self, filename):
#         try:
#             # ocr = PaddleOCR(lang='en')

#             output = ocr.ocr(filename)
#             texts = [line[1][0] for line in output[0]]
#             # print(texts)
#             # print(" ".join(texts))
#             return " ".join(texts)
#         except Exception as e:
#             print(f"Exception Occurred while reading image file - {str(e)}")
#             logger.logging.error(str(e))

#     def file_reader(self, filename):
#         """
#                 This function extract the text from the text document,
#                 "jpeg", "jpg", "png", "jp2", "pbm", "ppm and save the Extracted text.

#                 Parameters:
#                 ---------
#                         filename:Input document path.

#                  Return:
#                 ------
#                         text: Extracted text is stored.

#         """
#         print("Ready to Read......")
#         try:
#             file = filename
#             if file.split(".")[-1].lower() == "txt":
#                 with open(file, 'r') as file_to_read:
#                     text = file_to_read.read()
#                     text = re.sub("\s+", " ", text)
#                     print("Text from txt File: ", text)
#                     return text

#             elif file.split(".")[-1].lower() in ["docx", "doc"]:
#                 doc_text = self.get_text_docx(file)
#                 print("Text from Docx: ", doc_text)
#                 return doc_text

#             elif file.split(".")[-1].lower() == "pdf":
#                 pdf_text = self.get_text_pdf(file)
#                 print("Text from PDF: ", pdf_text)
#                 return pdf_text

#             elif file.split(".")[-1].lower() in ["jpeg", "jpg", "png", "jp2", "pbm", "ppm", "tif"]:
#                 # print("file", file)
#                 # img = cv2.imread(file)
#                 # text = re.sub("\s+", " ", pytesseract.image_to_string(img))
#                 # print(text)
#                 # return text
#                 image_text = self.get_text_image(file)
#                 print("Text from Image:", image_text)
#                 return image_text
#             else:
#                 raise Exception()

#         except Exception as e:
#             logger.logging.error(str(e))



# ================================



import re
import docx
import PyPDF2
import utils.logger_test as logger
import pytesseract
from paddleocr import PaddleOCR
import pandas as pd
from docx.api import Document
import docx2txt
import os
from utils import common

pytesseract.pytesseract.tesseract_cmd = common.pytesserct_path
# currFolder = common.temp_folder

output_path = os.getcwd()
output_path += "\\images"

# Initialize OCR once at module level to avoid repeated initialization
try:
    ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
except Exception as e:
    print(f"Warning: PaddleOCR initialization failed: {e}")
    ocr = None


class ReadFiles:
    """
        This is a class detects and extract the text
         from document ,pdf and image
    """

    def __init__(self):
        # self.ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=True)
        pass
 
    def get_text_docx(self, filename):
        """
        This function extract the text from the document,extract the text from the table format
        from the document and save the images from the document.

        Parameters:
        ---------
                filename:Input document path.
                Image: path where the detected images have to be stored.

         Return:
        ------
                allText: Extracted text is stored.
                data: Extracted text from table.
                Image: contains paths of extracted tables.
        """
        try:
            print("file_name:", filename)
            
            # Validate file exists
            if not os.path.exists(filename):
                raise FileNotFoundError(f"File not found: {filename}")
            
            # Extract filename properly for both forward and backward slashes
            file_name = os.path.basename(filename).split('.')[0]
            print("filename: ", file_name)
            
            # Create images directory if it doesn't exist
            images_dir = "images"
            os.makedirs(images_dir, exist_ok=True)
            
            doc = docx.Document(filename)
            fullText = []
            for para in doc.paragraphs:
                if para.text.strip():  # Only add non-empty paragraphs
                    fullText.append(para.text)
            allText = '\n'.join(fullText)
            print("Get text docx:", allText) #[:200] + "..." if len(allText) > 200 else allText)

            # extract tables
            document = Document(filename)
            table_count = len(document.tables)
            print("Table count: ", table_count)
            
            data = []  # Initialize data outside the loop
            
            for i in range(table_count):
                try:
                    table_data = []
                    table = document.tables[i]
                    keys = None
                    
                    for j, row in enumerate(table.rows):
                        try:
                            text = [cell.text.strip() for cell in row.cells]
                            print("Cell Texts:", text)
                            
                            if j == 0 and any(text):  # Use first non-empty row as headers
                                keys = tuple(text)
                                continue
                            
                            if keys and any(text):  # Only process if we have keys and non-empty data
                                print("Zipping...")
                                # Ensure we don't have more data than keys
                                text = text[:len(keys)]
                                row_data = dict(zip(keys, text))
                                table_data.append(row_data)
                                print("Data Added")
                        except Exception as row_e:
                            print(f"Error processing row {j}: {row_e}")
                            continue
                    
                    if table_data:  # Only create CSV if we have data
                        df = pd.DataFrame(table_data)
                        print("Dataframe shape: ", df.shape)
                        csv_path = os.path.join(images_dir, f'{file_name}_table_{i}.csv')
                        df.to_csv(csv_path, index=False)
                        print(f'Saved table to: {csv_path}')
                        data.extend(table_data)  # Add to overall data
                        
                except Exception as table_e:
                    print(f"Error processing table {i}: {table_e}")
                    continue
            
            print("Total data entries: ", len(data))
            
            # Extract text and images using docx2txt
            try:
                docx2txt.process(filename, images_dir)
                print(f"Images extracted to: {images_dir}")
            except Exception as extract_e:
                print(f"Error extracting images: {extract_e}")
            
            return allText
            
        except Exception as e:
            print("Exception - ", str(e))
            logger.logging.error(f"get_text_docx error: {str(e)}")
            return ""  # Return empty string instead of None

    def get_text_pdf(self, filename):
        try:
            print("filename: ", filename)
            
            # Validate file exists
            if not os.path.exists(filename):
                raise FileNotFoundError(f"File not found: {filename}")
            
            # Create images directory if it doesn't exist
            os.makedirs(output_path, exist_ok=True)
            
            j = 1
            text = ''
            
            with open(filename, 'rb') as pdfFile:
                try:
                    pdfReader = PyPDF2.PdfReader(pdfFile)
                    
                    # Check if PDF is encrypted
                    if pdfReader.is_encrypted:
                        print("Warning: PDF is encrypted, attempting to decrypt...")
                        try:
                            pdfReader.decrypt('')  # Try empty password
                        except Exception as decrypt_e:
                            print(f"Could not decrypt PDF: {decrypt_e}")
                            return text
                    
                    total_pages = len(pdfReader.pages)
                    print(f"Total pages: {total_pages}")
                    
                    for i in range(total_pages):
                        try:
                            pageObj = pdfReader.pages[i]
                            page_text = pageObj.extract_text()
                            
                            if page_text:  # Only process if text was extracted
                                page_text = page_text.replace("\n", "").replace(" -", "-")
                                text += page_text
                                print(f"Page {i+1} text length: {len(page_text)}")
                            
                            print("Page Object: ", type(pageObj))
                            
                            # Handle images in PDF - Multiple approaches for different PyPDF2 versions
                            try:
                                # Method 1: Try the images property (newer versions)
                                if hasattr(pageObj, 'images') and pageObj.images:
                                    print(f"Found {len(pageObj.images)} images using .images property")
                                    for image in pageObj.images:
                                        try:
                                            if hasattr(image, 'data'):
                                                image_data = image.data
                                            else:
                                                # Some versions might have different structure
                                                image_data = image
                                            
                                            # Extract text from image
                                            image_text = self.get_text_image(image_data)
                                            if image_text:
                                                text += " " + image_text
                                                print("Text from Image: ", image_text[:100] + "..." if len(image_text) > 100 else image_text)
                                            
                                            # Save image
                                            image_path = os.path.join(output_path, f"page_{i+1}_img_{j}.jpg")
                                            with open(image_path, "wb") as fp:
                                                fp.write(image_data)
                                            j += 1
                                            print(f"Image saved: {image_path}")
                                            
                                        except Exception as img_e:
                                            print(f"Error processing image {j}: {img_e}")
                                            continue
                                
                                # Method 2: Try accessing through page resources (older approach)
                                elif '/XObject' in pageObj.get('/Resources', {}):
                                    print("Trying to extract images through XObject resources")
                                    xObject = pageObj['/Resources']['/XObject'].get_object()
                                    
                                    for obj in xObject:
                                        try:
                                            if xObject[obj]['/Subtype'] == '/Image':
                                                print(f"Found image object: {obj}")
                                                size = (xObject[obj]['/Width'], xObject[obj]['/Height'])
                                                data = xObject[obj].get_data()
                                                
                                                if data:
                                                    # Extract text from image
                                                    try:
                                                        image_text = self.get_text_image(data)
                                                        if image_text:
                                                            text += " " + image_text
                                                            print("Text from Image: ", image_text[:100] + "..." if len(image_text) > 100 else image_text)
                                                    except Exception as ocr_e:
                                                        print(f"OCR failed for image: {ocr_e}")
                                                    
                                                    # Save image
                                                    image_path = os.path.join(output_path, f"page_{i+1}_img_{j}.jpg")
                                                    try:
                                                        with open(image_path, "wb") as fp:
                                                            fp.write(data)
                                                        print(f"Image saved: {image_path}")
                                                        j += 1
                                                    except Exception as save_e:
                                                        print(f"Could not save image: {save_e}")
                                        except Exception as xobj_e:
                                            print(f"Error processing XObject {obj}: {xobj_e}")
                                            continue
                                else:
                                    print(f"No images found on page {i+1}")
                                    
                            except Exception as images_e:
                                print(f"Error accessing images on page {i+1}: {images_e}")
                                # Continue without images - don't break the entire process
                                
                        except Exception as page_e:
                            print(f"Error processing page {i+1}: {page_e}")
                            logger.logging.error(f"Page {i+1} processing error: {str(page_e)}")
                            continue
                            
                except Exception as pdf_e:
                    print(f"Error reading PDF: {pdf_e}")
                    logger.logging.error(f"PDF reading error: {str(pdf_e)}")

            return text
            
        except Exception as e:
            print(f"Exception in get_text_pdf: {str(e)}")
            logger.logging.error(f"get_text_pdf error: {str(e)}")
            return ""

    def get_text_image(self, filename):
        try:
            if ocr is None:
                print("OCR not available, trying pytesseract...")
                try:
                    if isinstance(filename, bytes):
                        # If filename is bytes (image data), save temporarily
                        import tempfile
                        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
                            tmp_file.write(filename)
                            temp_path = tmp_file.name
                        
                        text = pytesseract.image_to_string(temp_path)
                        os.unlink(temp_path)  # Clean up
                        return re.sub(r'\s+', ' ', text).strip()
                    else:
                        text = pytesseract.image_to_string(filename)
                        return re.sub(r'\s+', ' ', text).strip()
                except Exception as tesseract_e:
                    print(f"Pytesseract also failed: {tesseract_e}")
                    return ""

            # Use PaddleOCR
            output = ocr.ocr(filename)
            
            if output and output[0]:
                texts = []
                for line in output[0]:
                    if line and len(line) >= 2 and line[1] and len(line[1]) >= 1:
                        texts.append(line[1][0])
                
                result = " ".join(texts).strip()
                return result
            else:
                return ""
                
        except Exception as e:
            print(f"Exception Occurred while reading image file - {str(e)}")
            logger.logging.error(f"get_text_image error: {str(e)}")
            return ""

    def file_reader(self, filename):
        """
                This function extract the text from the text document,
                "jpeg", "jpg", "png", "jp2", "pbm", "ppm and save the Extracted text.

                Parameters:
                ---------
                        filename:Input document path.

                 Return:
                ------
                        text: Extracted text is stored.

        """
        print("Ready to Read......")
        try:
            if not filename or not os.path.exists(filename):
                raise FileNotFoundError(f"File not found or invalid: {filename}")
            
            file = filename
            file_extension = file.split(".")[-1].lower()
            print(f"Processing file type: {file_extension}")
            
            if file_extension == "txt":
                try:
                    # Try different encodings
                    encodings = ['utf-8', 'utf-16', 'latin-1', 'cp1252']
                    text = ""
                    
                    for encoding in encodings:
                        try:
                            with open(file, 'r', encoding=encoding) as file_to_read:
                                text = file_to_read.read()
                                text = re.sub(r"\s+", " ", text).strip()
                                print(f"Text from txt File (first 200 chars): {text[:200]}...")
                                return text
                        except UnicodeDecodeError:
                            continue
                    
                    # If all encodings fail, read as binary and try to decode
                    with open(file, 'rb') as file_to_read:
                        raw_data = file_to_read.read()
                        text = raw_data.decode('utf-8', errors='ignore')
                        text = re.sub(r"\s+", " ", text).strip()
                        return text
                        
                except Exception as txt_e:
                    print(f"Error reading txt file: {txt_e}")
                    return ""

            elif file_extension in ["docx", "doc"]:
                doc_text = self.get_text_docx(file)
                print(f"Text from Docx (first 200 chars): {doc_text[:200] if doc_text else 'No text'}...")
                return doc_text

            elif file_extension == "pdf":
                pdf_text = self.get_text_pdf(file)
                print(f"Text from PDF (first 200 chars): {pdf_text[:200] if pdf_text else 'No text'}...")
                return pdf_text

            elif file_extension in ["jpeg", "jpg", "png", "jp2", "pbm", "ppm", "tif", "tiff", "bmp", "gif"]:
                image_text = self.get_text_image(file)
                print(f"Text from Image: {image_text[:200] if image_text else 'No text'}...")
                return image_text
            else:
                error_msg = f"Unsupported file format: {file_extension}"
                print(error_msg)
                logger.logging.error(error_msg)
                return ""

        except Exception as e:
            error_msg = f"file_reader error: {str(e)}"
            print(error_msg)
            logger.logging.error(error_msg)
            return ""


            # •