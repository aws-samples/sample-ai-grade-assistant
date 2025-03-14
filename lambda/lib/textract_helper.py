import io
import time
import boto3
from botocore.exceptions import ClientError

from textractor.parsers.response_parser import parse
from textractor.data.constants import (
    LAYOUT_FIGURE, LAYOUT_SECTION_HEADER, LAYOUT_TABLE, LAYOUT_KEY_VALUE, LAYOUT_TEXT, LAYOUT_TITLE, LAYOUT_LIST
)
from PIL import Image
from pdf2image import convert_from_bytes
import concurrent.futures

textract = boto3.client('textract')

def pdf_to_images(pdf_bytes):
    """
    Converts a PDF document (in bytes) to a list of PIL Image objects, where each
    Image object represents a page of the PDF.
    """
    pages = convert_from_bytes(pdf_bytes)
    return pages

def image_to_byte_array(image: Image):
    """
    Converts a PIL Image object to a byte array.
    """
    imgByteArr = io.BytesIO()
    image.save(imgByteArr, format="PNG")
    imgByteArr = imgByteArr.getvalue()
    return imgByteArr

finished_tasks_count = 0

def analyse_document_page(grader, page_number, file_source):
    global finished_tasks_count
    try:
        # Call Textract to detect the layout of the page
        response = textract.analyze_document(
            Document={
                'Bytes': image_to_byte_array(file_source)
            },
            FeatureTypes=[
                'LAYOUT',
            ]
        )

        doc = parse(response)
        finished_tasks_count +=1
        return page_number, doc
    except (textract.exceptions.LimitExceededException, textract.exceptions.ProvisionedThroughputExceededException, textract.exceptions.ServiceQuotaExceededException, textract.exceptions.ThrottlingException) as error:

        grader.updateStatus(f"Analysing document##API call limit exceeded; backing off and retrying...")
        delay = 1
        max_retries = 5
        retries = 0
        while retries < max_retries:
            try:
                grader.updateStatus(f"Analysing document##API call limit exceeded; Retrying in {delay} seconds...")
                time.sleep(delay)
                return analyse_document_page(grader, page_number, file_source)
            except (textract.exceptions.LimitExceededException, textract.exceptions.ProvisionedThroughputExceededException, textract.exceptions.ServiceQuotaExceededException, textract.exceptions.ThrottlingException) as retry_error:
                #if retry_error.response['Error']['Code'] in ['LimitExceededException', 'ProvisionedThroughputExceededException']:
                grader.updateStatus(f"Analysing document##API call limit exceeded; Retrying in {delay} seconds...")
                delay *= 2
                retries += 1
            except Exception as retry_error:
                raise retry_error
        raise error
        # else:
        #     raise error
    except Exception as exception:
        print(exception)
        return exception



def update_status_task(task, grader, total_page_count):
    global finished_tasks_count
    grader.updateStatus(f"Analysing document##{finished_tasks_count}/{total_page_count} page(s) completed")


def extract_visuals_from_pdf(grader, pages_as_images, additional_margin=0):
    #global current_task_count
    print("**extract_visuals_from_pdf**: File read and saved")
    # Initialize the Textractor extractor
   
    responses_docs = [None] * len(pages_as_images)
    with concurrent.futures.ThreadPoolExecutor() as executor:
        futures = []
    
        for page_num, page_image in enumerate(pages_as_images, start=1):
            grader.updateStatus(f"Analysing document##Starting analysing page {page_num}/{len(pages_as_images)}")
            futures.append(executor.submit(analyse_document_page, grader=grader, page_number=page_num, file_source=page_image))
            
            futures[-1].add_done_callback(lambda result: update_status_task(result, grader, len(pages_as_images)))

        for future in concurrent.futures.as_completed(futures):
            page_numner, tmp_doc = future.result()
            responses_docs[page_numner-1] = tmp_doc
            
            #assignment_grade[criteria] = grade

    print(f"TOTAL PAGES ==> {len(responses_docs)}")
    # for doc in responses_docs:
    #     print(doc)
    #     for layout in doc.layouts:
    #         print(layout)

    sections = []
    allowed_layout_types = [LAYOUT_TITLE, LAYOUT_SECTION_HEADER, LAYOUT_TABLE, LAYOUT_KEY_VALUE, LAYOUT_TEXT, LAYOUT_LIST]

    for idx, document in enumerate(responses_docs):
        current_section_text = ""
        grader.updateStatus(f"Analysing document##{len(responses_docs)} total page(s) to analyse")
        
        current_page = idx + 1
        print("**extract_visuals_from_pdf**: Looking at page "+str(current_page))
        for page_idx, layout in enumerate(document.layouts):
            #print(layout.layout_type)
            if layout.layout_type == LAYOUT_FIGURE:
                # If we detect an image, then we save the current text content in the sections
                # before creating a new section for image. With this, we keep the order of elements
                if current_section_text != "": 
                    sections.append({
                        "type":"text",
                        "content":current_section_text
                    })
                    current_section_text = ""

                print("**extract_visuals_from_pdf**: Figure found in page "+str(current_page))

                bbox = layout.bbox
                
                left = bbox.x * pages_as_images[idx].width - additional_margin
                top = bbox.y * pages_as_images[idx].height - additional_margin
                right = bbox.x * pages_as_images[idx].width + bbox.width* pages_as_images[idx].width + additional_margin
                bottom = bbox.y * pages_as_images[idx].height + bbox.height* pages_as_images[idx].height+ additional_margin

                im1 = pages_as_images[idx].crop((left, top, right, bottom))
                
                sections.append({
                    "type":"image",
                    "content": image_to_byte_array(im1)
                })
            elif layout.layout_type in allowed_layout_types:
                #print(layout.text)
                current_section_text += layout.text
                if layout.layout_type == LAYOUT_SECTION_HEADER or layout.layout_type == LAYOUT_TITLE :
                    current_section_text += "\r"
        
        #Adding last bit of text if it has not been set already
        if current_section_text != "" and (len(sections) == 0 or (sections[-1]["content"] != current_section_text)):
            sections.append({
                "type":"text",
                "content":current_section_text
            })
            
    print(f"**extract_visuals_from_pdf**: Returning {len(sections)} elements")

    return sections


def image_to_byte_array(image:Image):
    
  imgByteArr = io.BytesIO()
  image.save(imgByteArr, format="PNG")
  imgByteArr = imgByteArr.getvalue()
  return imgByteArr
