import json

import sys

import argparse

from pathlib import Path



REPO_ROOT = Path(__file__).resolve().parent.parent

CERTIFICATES_FILE = REPO_ROOT / "data" / "certificates.json"

PROFILE_FILE = REPO_ROOT / "data" / "profile.json"

PROJECTS_FILE = REPO_ROOT / "data" / "projects.json"



def validate_certificates(repo_root=REPO_ROOT):

    print("Validating certificates.json...")

    errors = []

    cert_file_path_obj = repo_root / "data" / "certificates.json"



    if not cert_file_path_obj.exists():

        errors.append(f"File not found: {cert_file_path_obj}")

        return errors



    try:

        with open(cert_file_path_obj, 'r', encoding='utf-8') as f:

            data = json.load(f)

    except json.JSONDecodeError as e:

        errors.append(f"JSON syntax error: {e}")

        return errors



    if not isinstance(data, list):

        errors.append("Root element should be a list.")

        return errors



    ids = set()

    valid_categories = {"cloud", "ai", "programming", "tools", "academic"}

    required_keys = {"id", "title", "issuer", "category", "thumbnail", "certificateFile"}



    for i, cert in enumerate(data):

        if not isinstance(cert, dict):

            errors.append(f"Entry {i}: Must be an object")

            continue



        missing = required_keys - set(cert.keys())

        if missing:

            errors.append(f"Entry {i}: Missing required keys: {', '.join(missing)}")



        cert_id = cert.get("id")

        if cert_id:

            if cert_id in ids:

                errors.append(f"Entry {i}: Duplicate certificate ID: {cert_id}")

            ids.add(cert_id)



        category = cert.get("category")

        if category and category not in valid_categories:

            errors.append(f"Entry {i}: Invalid category '{category}'. Must be one of: {', '.join(valid_categories)}")



        thumbnail = cert.get("thumbnail")

        if thumbnail:

            if thumbnail.startswith('/'):

                thumbnail = thumbnail[1:]

            thumb_path = repo_root / Path(thumbnail)

            if not thumb_path.exists():

                errors.append(f"Entry {i} (ID: {cert_id}): Thumbnail file not found: {thumb_path}")



        cert_file = cert.get("certificateFile")

        if cert_file:

            if cert_file.startswith('/'):

                cert_file = cert_file[1:]

            c_path = repo_root / Path(cert_file)

            if not c_path.exists():

                errors.append(f"Entry {i} (ID: {cert_id}): Certificate file not found: {c_path}")



    return errors



def check_urls_recursive(obj, errors, path="root"):

    if isinstance(obj, dict):

        for k, v in obj.items():

            check_urls_recursive(v, errors, f"{path}.{k}")

    elif isinstance(obj, list):

        for i, item in enumerate(obj):

            check_urls_recursive(item, errors, f"{path}[{i}]")

    elif isinstance(obj, str):

        if obj.startswith("http:") or obj.startswith("www."):

            errors.append(f"Invalid URL formatting at {path}: '{obj}' (must start with https://)")

        elif path.endswith(".github") or path.endswith(".linkedin"):

            if not obj.startswith("https://") and obj != "":

                errors.append(f"Invalid URL formatting at {path}: '{obj}' (must start with https://)")



def validate_profile(repo_root=REPO_ROOT):

    print("Validating profile.json...")

    errors = []

    profile_path_obj = repo_root / "data" / "profile.json"



    if not profile_path_obj.exists():

        errors.append(f"File not found: {profile_path_obj}")

        return errors



    try:

        with open(profile_path_obj, 'r', encoding='utf-8') as f:

            data = json.load(f)

    except json.JSONDecodeError as e:

        errors.append(f"JSON syntax error: {e}")

        return errors



    if not isinstance(data, dict):

        errors.append("Root element should be an object.")

        return errors



    required_keys = {"name", "title", "email", "github", "linkedin", "education", "experience", "skills"}

    missing = required_keys - set(data.keys())

    if missing:

        errors.append(f"Missing required keys: {', '.join(missing)}")



    check_urls_recursive(data, errors)



    return errors



def validate_projects(repo_root=REPO_ROOT):

    print("Validating projects.json...")

    errors = []

    projects_file_obj = repo_root / "data" / "projects.json"

    if not projects_file_obj.exists():

        errors.append(f"File not found: {projects_file_obj}")

        return errors



    try:

        with open(projects_file_obj, 'r', encoding='utf-8') as f:

            data = json.load(f)

    except json.JSONDecodeError as e:

        errors.append(f"JSON syntax error in projects.json: {e}")

        return errors



    if not isinstance(data, list):

        errors.append("projects.json root should be a list.")

        return errors



    required_keys = {"id", "title", "summary", "problem", "solution", "techStack", "github", "liveDemo"}

    for i, proj in enumerate(data):

        missing = required_keys - set(proj.keys())

        if missing:

            errors.append(f"Project {i}: Missing required keys: {', '.join(missing)}")

        check_urls_recursive(proj, errors, f"projects[{i}]")



    return errors



def main():

    parser = argparse.ArgumentParser(description="Validate JSON data files in the portfolio repository.")

    parser.add_argument("--repo-root", type=Path, default=REPO_ROOT, help="Path to repository root directory")

    args = parser.parse_args()



    repo_root = args.repo_root.resolve()

    cert_errors = validate_certificates(repo_root)

    profile_errors = validate_profile(repo_root)

    project_errors = validate_projects(repo_root)



    all_errors = cert_errors + profile_errors + project_errors



    if not all_errors:

        print("\nPASS: All data validated successfully.")

        sys.exit(0)

    else:

        print("\nFAIL: Validation errors found:")

        for err in all_errors:

            print(f" - {err}")

        sys.exit(1)



if __name__ == "__main__":

    main()
