import requests

BASE_URL = "http://127.0.0.1:5000/api"

def run_test():
    # 1. TEST REGISTRATION
    print("--- Testing Registration ---")
    reg_data = {
        "email": "tester@example.com",
        "username": "TestBot",
        "password": "password123"
    }
    r = requests.post(f"{BASE_URL}/register", json=reg_data)
    print(f"Status: {r.status_code}, Response: {r.json()}")

    # 2. TEST LOGIN
    print("\n--- Testing Login ---")
    login_data = {"email": "tester@example.com", "password": "password123"}
    r = requests.post(f"{BASE_URL}/login", json=login_data)
    
    if r.status_code == 200:
        token = r.json().get("token")
        print(f"Login Success! Token received: {token[:10]}...")
    else:
        print(f"Login Failed: {r.json()}")
        return

    # 3. TEST PROFILE UPDATE (Requires the Token)
    print("\n--- Testing Profile Update ---")
    headers = {"Authorization": f"Bearer {token}"}
    update_data = {"name": "TestBot_Updated"}
    r = requests.post(f"{BASE_URL}/update-profile", json=update_data, headers=headers)
    print(f"Status: {r.status_code}, Response: {r.json()}")

if __name__ == "__main__":
    run_test()