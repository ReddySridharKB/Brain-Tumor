import os
import sys
import io

# Add the backend folder to sys.path
backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
sys.path.append(backend_path)

from app.database.database import SessionLocal, Base, engine
from app.models.models import Patient, MRIScan
from app.services import scan_service
from app.services import patient_service
from app.schemas.schemas import PatientCreate
from app.reports import pdf_generator
from fastapi import UploadFile

def main():
    print("=" * 60)
    print("  Brain Tumor Detection - Real MRI Integration Test")
    print("  GPT-4o -> [if risk>=30%] GPT-image-2 -> Gemini")
    print("=" * 60)

    print("\nInitializing Database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Create or get test patient
        patient = db.query(Patient).filter(Patient.name == "Test MRI Patient").first()
        if not patient:
            print("Creating Test Patient...")
            p_create = PatientCreate(
                name="Test MRI Patient",
                age=35,
                sex="Male",
                dob="1989-01-01",
                blood_group="A+"
            )
            patient = patient_service.create_patient(db, p_create)
        else:
            print("Test Patient already exists.")

        print(f"Patient ID: {patient.id} | UID: {patient.patient_uid}")

        # 2. Setup MRI files to test both
        mri_files = ["Brain MRI Scan 2.png"]
        
        for idx, filename in enumerate(mri_files):
            print(f"\n{'='*60}\n  TESTING SCAN {idx+1}: {filename}\n{'='*60}")
            mri_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "MRI Samples", filename)
            if not os.path.exists(mri_path):
                print(f"ERROR: MRI sample not found at {mri_path}")
                continue

            print(f"MRI Image: {mri_path}")

            with open(mri_path, "rb") as f:
                file_bytes = f.read()

            content_type = "image/png" if filename.endswith(".png") else "image/jpeg"
            class MockUploadFile:
                def __init__(self, filename, content, ctype):
                    self.filename = filename
                    self.file = io.BytesIO(content)
                    self.content_type = ctype

            upload_file = MockUploadFile(filename, file_bytes, content_type)

            # 3. Run the gated pipeline
            print("\nRunning gated pipeline...")
            print("  Step 1: GPT-4o classification (cheap)")
            print("  Step 2: If risk >= 30% -> GPT-image-2 highlighting")
            print("  Step 3: Gemini full analysis")

            scan = scan_service.upload_and_analyze_scan(db=db, patient_id=patient.id, file=upload_file)

            if not scan:
                print("ERROR: Scan analysis returned None.")
                continue

            print("\n" + "=" * 60)
            print("  ANALYSIS RESULTS")
            print("=" * 60)
            print(f"  Scan ID        : {scan.id}")
            print(f"  Tumor Type     : {scan.tumor_type}")
            print(f"  Tumor Location : {scan.tumor_location}")
            print(f"  Tumor Risk     : {scan.tumor_risk}")
            print(f"  Probability    : {scan.probability}")
            print(f"  Severity       : {scan.severity}")
            print("-" * 60)
            print(f"  AI Summary:\n  {scan.ai_summary}")
            print("=" * 60)

            # 4. Show image paths
            print("\n--- OUTPUT FILES ---")
            print(f"  Original MRI      : {os.path.abspath(scan.original_image_path)}")
            if scan.highlighted_image_path:
                print(f"  Highlighted Image  : {os.path.abspath(scan.highlighted_image_path)}")
            else:
                print("  Highlighted Image  : [SKIPPED - low risk]")

            # 5. Generate PDF Report
            print("\n--- GENERATING PDF REPORT ---")
            pdf_path = pdf_generator.generate_pdf_report(scan, patient)
            abs_pdf_path = os.path.abspath(pdf_path)
            print(f"  PDF Location: {abs_pdf_path}")

        print("\n[OK] Test completed successfully!")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"\n[FAIL] Error during analysis: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
