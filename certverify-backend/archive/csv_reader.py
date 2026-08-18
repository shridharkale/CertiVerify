import pandas as pd


def read_csv(file):
    """
    Reads an uploaded CSV file, separates clean participants
    from duplicate name+email combinations.

    Args:
        file: A file-like object (e.g. from Flask's request.files)

    Returns:
        participants (list): Unique, clean participant records
        duplicates   (list): Entries that were found more than once
    """

    # --- Step 1: Load the CSV into a DataFrame ---
    # pd.read_csv() can read directly from a file object
    df = pd.read_csv(file)

    # --- Step 2: Normalize text to avoid case-sensitivity issues ---
    # Strip extra spaces and lowercase name & email so
    # "Alice" and "alice " are treated as the same person
    df["name"]  = df["name"].str.strip().str.lower()
    df["email"] = df["email"].str.strip().str.lower()
    df["role"]  = df["role"].str.strip()

    # --- Step 3: Find which rows are duplicates ---
    # keep=False marks ALL copies of a duplicate as True
    # (not just the second occurrence)
    is_duplicate = df.duplicated(subset=["name", "email"], keep=False)

    # --- Step 4: Split into two groups ---
    # Rows where is_duplicate is False  → clean participants
    clean_df = df[~is_duplicate]

    # Rows where is_duplicate is True   → duplicates
    duplicate_df = df[is_duplicate]

    # --- Step 5: Convert DataFrames to plain Python lists of dicts ---
    # This makes them easy to return as JSON from a Flask route
    participants = clean_df.to_dict(orient="records")
    duplicates   = duplicate_df.to_dict(orient="records")

    return participants, duplicates
