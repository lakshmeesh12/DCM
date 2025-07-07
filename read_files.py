import re
import docx
import PyPDF2
import utils.logger_test as logger
import pytesseract
from paddleocr import PaddleOCR
import os
from concurrent.futures import ThreadPoolExecutor
from docx.oxml.ns import qn
from docx.opc.constants import RELATIONSHIP_TYPE as RT
from utils import common
import zipfile
import io
from PIL import Image

pytesseract.pytesseract.tesseract_cmd = common.pytesserct_path

class ReadFiles:
    """
    This class extracts text from .docx, .pdf, and image files, including text from tables and embedded images.
    """

    def __init__(self):
        pass

    def get_text_docx(self, filename):
        """
        Extract text from a .docx file, including text from paragraphs, tables, and embedded images.

        Parameters:
        ---------
        filename: Input document path.

        Return:
        ------
        allText: Extracted text from paragraphs, tables, and images.
        """
        try:
            print(f"Processing .docx: {filename}")
            if not os.path.exists(filename):
                raise FileNotFoundError(f"File not found: {filename}")

            # Initialize OCR for this thread
            ocr = None
            try:
                ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
            except Exception as e:
                print(f"Warning: PaddleOCR initialization failed: {e}")

            doc = docx.Document(filename)
            fullText = []

            # Extract text from paragraphs
            for para in doc.paragraphs:
                if para.text.strip():
                    fullText.append(para.text.strip())
            print(f"Text from paragraphs (first 200 chars): {''.join(fullText)[:200] if fullText else 'No text'}...")

            # Extract text from tables
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        cell_text = cell.text.strip()
                        if cell_text:
                            fullText.append(cell_text)
            print(f"Text from tables (first 200 chars): {''.join(fullText)[:200] if fullText else 'No text'}...")

            # Extract images from .docx (stored in the .docx zip archive)
            try:
                with zipfile.ZipFile(filename) as docx_zip:
                    for file_info in docx_zip.infolist():
                        if file_info.filename.startswith('word/media/'):
                            with docx_zip.open(file_info) as image_file:
                                image_data = image_file.read()
                                image_text = self.get_text_image(image_data, ocr)
                                if image_text:
                                    fullText.append(image_text)
                                    print(f"Text from embedded image: {image_text[:100] if image_text else 'No text'}...")
            except Exception as image_e:
                print(f"Error extracting images from .docx: {image_e}")
                logger.logging.error(f"get_text_docx image extraction error: {str(image_e)}")

            allText = '\n'.join(fullText)
            print(f"Total text from .docx (first 200 chars): {allText[:200] if allText else 'No text'}...")
            return allText

        except Exception as e:
            print(f"Exception in get_text_docx: {str(e)}")
            logger.logging.error(f"get_text_docx error: {str(e)}")
            return ""

    def get_text_pdf_page(self, page, page_num):
        """
        Extract text from a single PDF page, including text from embedded images.

        Parameters:
        ---------
        page: PyPDF2 page object.
        page_num: Page number for logging.

        Return:
        ------
        text: Extracted text from the page and its images.
        """
        try:
            text = ''
            page_text = page.extract_text()
            if page_text:
                page_text = page_text.replace("\n", "").replace(" -", "-")
                text += page_text
                print(f"Page {page_num+1} text length: {len(page_text)}")

            # Initialize OCR for this thread
            ocr = None
            try:
                ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
            except Exception as e:
                print(f"Warning: PaddleOCR initialization failed for page {page_num+1}: {e}")

            # Handle images in the page
            try:
                # Method 1: Try the images property
                if hasattr(page, 'images') and page.images:
                    print(f"Found {len(page.images)} images on page {page_num+1}")
                    for i, image in enumerate(page.images):
                        try:
                            image_data = image.data if hasattr(image, 'data') else image
                            image_text = self.get_text_image(image_data, ocr)
                            if image_text:
                                text += " " + image_text
                                print(f"Text from image {i+1} on page {page_num+1}: {image_text[:100] if image_text else 'No text'}...")
                        except Exception as img_e:
                            print(f"Error processing image {i+1} on page {page_num+1}: {img_e}")
                # Method 2: Try accessing through XObject resources
                elif '/XObject' in page.get('/Resources', {}):
                    xObject = page['/Resources']['/XObject'].get_object()
                    for obj in xObject:
                        try:
                            if xObject[obj]['/Subtype'] == '/Image':
                                data = xObject[obj].get_data()
                                if data:
                                    image_text = self.get_text_image(data, ocr)
                                    if image_text:
                                        text += " " + image_text
                                        print(f"Text from XObject image on page {page_num+1}: {image_text[:100] if image_text else 'No text'}...")
                        except Exception as xobj_e:
                            print(f"Error processing XObject on page {page_num+1}: {xobj_e}")
            except Exception as images_e:
                print(f"Error accessing images on page {page_num+1}: {images_e}")

            return text

        except Exception as page_e:
            print(f"Error processing page {page_num+1}: {page_e}")
            logger.logging.error(f"Page {page_num+1} processing error: {str(page_e)}")
            return ""

    def get_text_pdf(self, filename):
        """
        Extract text from a PDF file, processing pages in parallel.

        Parameters:
        ---------
        filename: Input PDF path.

        Return:
        ------
        text: Extracted text from all pages and embedded images.
        """
        try:
            print(f"Processing PDF: {filename}")
            if not os.path.exists(filename):
                raise FileNotFoundError(f"File not found: {filename}")

            text = ''
            with open(filename, 'rb') as pdfFile:
                pdfReader = PyPDF2.PdfReader(pdfFile)

                if pdfReader.is_encrypted:
                    print("Warning: PDF is encrypted, attempting to decrypt...")
                    try:
                        pdfReader.decrypt('')
                    except Exception as decrypt_e:
                        print(f"Could not decrypt PDF: {decrypt_e}")
                        return text

                total_pages = len(pdfReader.pages)
                print(f"Total pages: {total_pages}")

                # Process pages in parallel
                with ThreadPoolExecutor() as executor:
                    futures = [executor.submit(self.get_text_pdf_page, pdfReader.pages[i], i) for i in range(total_pages)]
                    page_texts = [future.result() for future in futures]
                    text = ' '.join([t for t in page_texts if t])

                print(f"Text from PDF (first 200 chars): {text[:200] if text else 'No text'}...")
                return text

        except Exception as e:
            print(f"Exception in get_text_pdf: {str(e)}")
            logger.logging.error(f"get_text_pdf error: {str(e)}")
            return ""

    def get_text_image(self, data, ocr_instance=None):
        """
        Extract text from an image using OCR.

        Parameters:
        ---------
        data: Image file path or bytes.
        ocr_instance: Thread-specific PaddleOCR instance (optional).

        Return:
        ------
        text: Extracted text.
        """
        try:
            if ocr_instance is None:
                print("OCR not provided, trying pytesseract...")
                try:
                    if isinstance(data, bytes):
                        import tempfile
                        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
                            tmp_file.write(data)
                            temp_path = tmp_file.name
                        text = pytesseract.image_to_string(temp_path)
                        os.unlink(temp_path)
                        return re.sub(r'\s+', ' ', text).strip()
                    else:
                        text = pytesseract.image_to_string(data)
                        return re.sub(r'\s+', ' ', text).strip()
                except Exception as tesseract_e:
                    print(f"Pytesseract failed: {tesseract_e}")
                    return ""

            # Use PaddleOCR
            output = ocr_instance.ocr(data)
            if output and output[0]:
                texts = [line[1][0] for line in output[0] if line and len(line) >= 2 and line[1] and len(line[1]) >= 1]
                result = " ".join(texts).strip()
                return result
            return ""

        except Exception as e:
            print(f"Exception in get_text_image: {str(e)}")
            logger.logging.error(f"get_text_image error: {str(e)}")
            return ""

    def file_reader(self, filename):
        """
        Extract text from a file based on its extension.

        Parameters:
        ---------
        filename: Input file path.

        Return:
        ------
        text: Extracted text.
        """
        print(f"Ready to read: {filename}")
        try:
            if not filename or not os.path.exists(filename):
                raise FileNotFoundError(f"File not found or invalid: {filename}")

            file_extension = filename.split(".")[-1].lower()
            print(f"Processing file type: {file_extension}")

            if file_extension == "txt":
                try:
                    encodings = ['utf-8', 'utf-16', 'latin-1', 'cp1252']
                    for encoding in encodings:
                        try:
                            with open(filename, 'r', encoding=encoding) as file_to_read:
                                text = file_to_read.read()
                                text = re.sub(r"\s+", " ", text).strip()
                                print(f"Text from txt (first 200 chars): {text[:200]}...")
                                return text
                        except UnicodeDecodeError:
                            continue
                    with open(filename, 'rb') as file_to_read:
                        raw_data = file_to_read.read()
                        text = raw_data.decode('utf-8', errors='ignore')
                        text = re.sub(r"\s+", " ", text).strip()
                        return text
                except Exception as txt_e:
                    print(f"Error reading txt file: {txt_e}")
                    return ""

            elif file_extension in ["docx", "doc"]:
                return self.get_text_docx(filename)

            elif file_extension == "pdf":
                return self.get_text_pdf(filename)

            elif file_extension in ["jpeg", "jpg", "png", "jp2", "pbm", "ppm", "tif", "tiff", "bmp", "gif"]:
                # Initialize OCR for this thread
                ocr = None
                try:
                    ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
                except Exception as e:
                    print(f"Warning: PaddleOCR initialization failed: {e}")
                return self.get_text_image(filename, ocr)

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