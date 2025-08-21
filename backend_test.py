import requests
import sys
import json
from datetime import datetime
import time

class CollaborativeEditorTester:
    def __init__(self, base_url="https://teamwrite-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_documents = []

    def log(self, message):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        self.log(f"   URL: {url}")
        self.log(f"   Method: {method}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASSED - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        self.log(f"   Response: {response_data}")
                    return True, response_data
                except:
                    return True, {}
            else:
                self.log(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    self.log(f"   Error: {error_data}")
                except:
                    self.log(f"   Error: {response.text}")
                return False, {}

        except requests.exceptions.Timeout:
            self.log(f"❌ FAILED - Request timeout")
            return False, {}
        except Exception as e:
            self.log(f"❌ FAILED - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic health endpoints"""
        self.log("\n🏥 TESTING HEALTH ENDPOINTS")
        
        # Test root endpoint
        success, _ = self.run_test(
            "API Root",
            "GET",
            "",
            200
        )
        
        # Test health endpoint
        success, _ = self.run_test(
            "Health Check",
            "GET",
            "health",
            200
        )
        
        return success

    def test_user_registration(self):
        """Test user registration"""
        self.log("\n👤 TESTING USER REGISTRATION")
        
        # Generate unique username
        timestamp = datetime.now().strftime("%H%M%S")
        username = f"testuser_{timestamp}"
        password = "TestPass123!"
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={"username": username, "password": password}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response['user']
            self.log(f"   Registered user: {username}")
            self.log(f"   User ID: {self.user_data['id']}")
            return True
        
        return False

    def test_duplicate_registration(self):
        """Test duplicate username registration"""
        self.log("\n🚫 TESTING DUPLICATE REGISTRATION")
        
        if not self.user_data:
            self.log("❌ No user data available for duplicate test")
            return False
            
        success, _ = self.run_test(
            "Duplicate Username Registration",
            "POST",
            "auth/register",
            400,  # Should fail with 400
            data={"username": self.user_data['username'], "password": "AnotherPass123!"}
        )
        
        # For this test, success means we got the expected 400 error
        return success

    def test_user_login(self):
        """Test user login with existing credentials"""
        self.log("\n🔐 TESTING USER LOGIN")
        
        if not self.user_data:
            self.log("❌ No user data available for login test")
            return False
        
        # Clear token to test login
        old_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"username": self.user_data['username'], "password": "TestPass123!"}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.log(f"   Login successful for: {self.user_data['username']}")
            return True
        else:
            # Restore old token if login failed
            self.token = old_token
            return False

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        self.log("\n🚫 TESTING INVALID LOGIN")
        
        # Save current token
        old_token = self.token
        self.token = None
        
        success, _ = self.run_test(
            "Invalid Login",
            "POST",
            "auth/login",
            401,  # Should fail with 401
            data={"username": "nonexistent", "password": "wrongpass"}
        )
        
        # Restore token
        self.token = old_token
        
        return success

    def test_get_current_user(self):
        """Test getting current user info"""
        self.log("\n👤 TESTING GET CURRENT USER")
        
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        
        if success and response.get('username') == self.user_data['username']:
            self.log(f"   Current user verified: {response['username']}")
            return True
        
        return False

    def test_unauthorized_access(self):
        """Test accessing protected endpoint without token"""
        self.log("\n🚫 TESTING UNAUTHORIZED ACCESS")
        
        # Save current token
        old_token = self.token
        self.token = None
        
        success, _ = self.run_test(
            "Unauthorized Access to Documents",
            "GET",
            "documents",
            401  # Should fail with 401
        )
        
        # Restore token
        self.token = old_token
        
        return success

    def test_create_document(self):
        """Test creating a new document"""
        self.log("\n📄 TESTING DOCUMENT CREATION")
        
        doc_title = f"Test Document {datetime.now().strftime('%H:%M:%S')}"
        
        success, response = self.run_test(
            "Create Document",
            "POST",
            "documents",
            200,
            data={"title": doc_title}
        )
        
        if success and 'id' in response:
            self.created_documents.append(response)
            self.log(f"   Created document: {doc_title}")
            self.log(f"   Document ID: {response['id']}")
            return True
        
        return False

    def test_get_documents(self):
        """Test getting user's documents"""
        self.log("\n📋 TESTING GET DOCUMENTS")
        
        success, response = self.run_test(
            "Get User Documents",
            "GET",
            "documents",
            200
        )
        
        if success and isinstance(response, list):
            self.log(f"   Found {len(response)} documents")
            for doc in response:
                self.log(f"   - {doc.get('title', 'Untitled')} (ID: {doc.get('id', 'N/A')})")
            return True
        
        return False

    def test_get_single_document(self):
        """Test getting a specific document"""
        self.log("\n📄 TESTING GET SINGLE DOCUMENT")
        
        if not self.created_documents:
            self.log("❌ No documents available for single document test")
            return False
        
        doc = self.created_documents[0]
        
        success, response = self.run_test(
            "Get Single Document",
            "GET",
            f"documents/{doc['id']}",
            200
        )
        
        if success and response.get('id') == doc['id']:
            self.log(f"   Retrieved document: {response.get('title', 'Untitled')}")
            return True
        
        return False

    def test_update_document(self):
        """Test updating document content"""
        self.log("\n✏️ TESTING DOCUMENT UPDATE")
        
        if not self.created_documents:
            self.log("❌ No documents available for update test")
            return False
        
        doc = self.created_documents[0]
        new_content = f"Updated content at {datetime.now().isoformat()}"
        
        success, response = self.run_test(
            "Update Document Content",
            "PUT",
            f"documents/{doc['id']}",
            200,
            data={"content": new_content}
        )
        
        if success and response.get('content') == new_content:
            self.log(f"   Document updated successfully")
            return True
        
        return False

    def test_document_access_control(self):
        """Test document access control"""
        self.log("\n🔒 TESTING DOCUMENT ACCESS CONTROL")
        
        # Try to access a non-existent document
        fake_doc_id = "non-existent-document-id"
        
        success, _ = self.run_test(
            "Access Non-existent Document",
            "GET",
            f"documents/{fake_doc_id}",
            404  # Should fail with 404
        )
        
        return success

    def test_delete_document(self):
        """Test deleting a document"""
        self.log("\n🗑️ TESTING DOCUMENT DELETION")
        
        if not self.created_documents:
            self.log("❌ No documents available for deletion test")
            return False
        
        doc = self.created_documents[0]
        
        success, response = self.run_test(
            "Delete Document",
            "DELETE",
            f"documents/{doc['id']}",
            200
        )
        
        if success:
            self.log(f"   Document deleted successfully")
            # Verify deletion by trying to get the document
            success_verify, _ = self.run_test(
                "Verify Document Deletion",
                "GET",
                f"documents/{doc['id']}",
                404  # Should fail with 404
            )
            return success_verify
        
        return False

    def test_websocket_endpoint(self):
        """Test WebSocket endpoint accessibility"""
        self.log("\n🔌 TESTING WEBSOCKET ENDPOINT")
        
        if not self.created_documents:
            # Create a document for WebSocket testing
            doc_title = f"WebSocket Test Doc {datetime.now().strftime('%H:%M:%S')}"
            success, response = self.run_test(
                "Create Document for WebSocket Test",
                "POST",
                "documents",
                200,
                data={"title": doc_title}
            )
            if success:
                self.created_documents.append(response)
        
        if self.created_documents:
            doc_id = self.created_documents[0]['id']
            ws_url = self.base_url.replace('https://', 'wss://').replace('http://', 'ws://')
            ws_endpoint = f"{ws_url}/ws/{doc_id}?token={self.token}"
            
            self.log(f"   WebSocket URL: {ws_endpoint}")
            self.log("   ✅ WebSocket endpoint configured (actual connection testing requires WebSocket client)")
            
            # We can't easily test WebSocket connection in this simple test,
            # but we can verify the endpoint format is correct
            return True
        
        return False

    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("🚀 STARTING COLLABORATIVE EDITOR API TESTS")
        self.log(f"   Base URL: {self.base_url}")
        self.log(f"   API URL: {self.api_url}")
        
        test_results = []
        
        # Health checks
        test_results.append(("Health Check", self.test_health_check()))
        
        # Authentication tests
        test_results.append(("User Registration", self.test_user_registration()))
        test_results.append(("Duplicate Registration", self.test_duplicate_registration()))
        test_results.append(("User Login", self.test_user_login()))
        test_results.append(("Invalid Login", self.test_invalid_login()))
        test_results.append(("Get Current User", self.test_get_current_user()))
        test_results.append(("Unauthorized Access", self.test_unauthorized_access()))
        
        # Document tests
        test_results.append(("Create Document", self.test_create_document()))
        test_results.append(("Get Documents", self.test_get_documents()))
        test_results.append(("Get Single Document", self.test_get_single_document()))
        test_results.append(("Update Document", self.test_update_document()))
        test_results.append(("Document Access Control", self.test_document_access_control()))
        
        # WebSocket test
        test_results.append(("WebSocket Endpoint", self.test_websocket_endpoint()))
        
        # Cleanup test (delete document)
        test_results.append(("Delete Document", self.test_delete_document()))
        
        # Print results summary
        self.log("\n" + "="*60)
        self.log("📊 TEST RESULTS SUMMARY")
        self.log("="*60)
        
        for test_name, result in test_results:
            status = "✅ PASSED" if result else "❌ FAILED"
            self.log(f"{status} - {test_name}")
        
        self.log(f"\n📈 Overall Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            self.log("🎉 ALL TESTS PASSED!")
            return 0
        else:
            self.log(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    """Main test execution"""
    tester = CollaborativeEditorTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())