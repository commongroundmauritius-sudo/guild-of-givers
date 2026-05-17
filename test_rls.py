import os
from supabase import create_client, Client

url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

def test_announcements_public():
    print("Testing public announcements access...")
    res = supabase.table("announcements").select("*").execute()
    print(f"Public announcements: {len(res.data)}")

if __name__ == "__main__":
    try:
        test_announcements_public()
    except Exception as e:
        print(f"Error: {e}")
