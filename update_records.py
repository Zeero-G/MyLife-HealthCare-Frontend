import re

with open('/home/malan/Desktop/ZeeroG/MyLife-HealthCare/services/medical-records-service/app/routers/records.py', 'r') as f:
    original = f.read()

new_route = """

# ── GET /records/family/{patient_id} ──────────────────────
@router.get("/family/{patient_id}", response_model=list[RecordResponse])
async def list_family_records(patient_id: str, current_user: dict = Depends(get_current_user)):
    # 1. Verify that current_user is linked as a family member to patient_id
    link_check = supabase.table("linked_accounts") \\
        .select("*") \\
        .eq("owner_id", current_user["sub"]) \\
        .eq("linked_user_id", patient_id) \\
        .execute()
    
    if not link_check.data:
        raise HTTPException(status_code=403, detail="Not authorized to view these records")

    # 2. Fetch records
    result = supabase.table("medical_records") \\
        .select("*") \\
        .eq("user_id", patient_id) \\
        .order("created_at", desc=True) \\
        .execute()
    return result.data
"""

if "# ── GET /records/family/{patient_id}" not in original:
    updated = original + new_route
    with open('/home/malan/Desktop/ZeeroG/MyLife-HealthCare/services/medical-records-service/app/routers/records.py', 'w') as f:
        f.write(updated)
    print("Added family records route")
else:
    print("Already added")
