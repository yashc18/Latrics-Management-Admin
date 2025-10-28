# Android App Integration Guide

This guide explains how to integrate your Android app with the Latrics Admin Panel to ensure proper data synchronization.

## Firebase Project Configuration

Your Android app should connect to the same Firebase project:
- **Project ID:** `latrics-org-management`
- **Package Name:** `com.example.latricsmanagement`

## Collection Structure

### 1. Users Collection (`users`)

When a user registers in your Android app, create a document in the `users` collection:

**Collection:** `users`  
**Document ID:** Use the Firebase Auth UID  
**Fields:**
```kotlin
data class UserRegistration(
    val uid: String,              // Firebase Auth UID
    val email: String,
    val name: String,
    val phone: String,
    val companyName: String,
    val jobTitle: String,
    val licenseId: String,
    val status: String = "pending",  // Always "pending" for new registrations
    val isProjectManager: Boolean = false,
    val createdAt: Timestamp = Timestamp.now(),
    val permissions: Map<String, Boolean> = mapOf(
        "canApproveUsers" to false,
        "canCreateTemplates" to false,
        "canEditApprovedTemplates" to false,
        "canExportData" to false,
        "canManageJobRoles" to false,
        "canViewAllSubmissions" to false
    )
)
```

### 2. Templates Collection (`templates`)

Your current template structure is correct. Ensure `status` field is set to:
- "draft" for templates being created
- "pending" when submitted for approval
- Admin panel will update to "approved" or "rejected"

### 3. Form Submissions Collection (`formSubmissions`)

Your current submission structure is correct. Keep using the same format with:
- Collection name: `formSubmissions` (not `submissions`)
- All current fields are properly structured

## Android Code Implementation

### User Registration

```kotlin
fun registerUser(user: User, password: String) {
    FirebaseAuth.getInstance()
        .createUserWithEmailAndPassword(user.email, password)
        .addOnSuccessListener { authResult ->
            val uid = authResult.user?.uid ?: return@addOnSuccessListener
            
            val userDoc = hashMapOf(
                "uid" to uid,
                "email" to user.email,
                "name" to user.name,
                "phone" to user.phone,
                "companyName" to user.companyName,
                "jobTitle" to user.jobTitle,
                "licenseId" to user.licenseId,
                "status" to "pending",
                "isProjectManager" to false,
                "createdAt" to FieldValue.serverTimestamp(),
                "permissions" to mapOf(
                    "canApproveUsers" to false,
                    "canCreateTemplates" to false,
                    "canEditApprovedTemplates" to false,
                    "canExportData" to false,
                    "canManageJobRoles" to false,
                    "canViewAllSubmissions" to false
                )
            )
            
            FirebaseFirestore.getInstance()
                .collection("users")
                .document(uid)
                .set(userDoc)
                .addOnSuccessListener {
                    // Registration successful
                    showPendingApprovalDialog()
                }
                .addOnFailureListener { exception ->
                    // Handle error
                    Log.e("Registration", "Error creating user document", exception)
                }
        }
        .addOnFailureListener { exception ->
            // Handle authentication error
            Log.e("Registration", "Error creating user", exception)
        }
}
```

### Listen for User Approval

```kotlin
fun listenForApproval(uid: String) {
    FirebaseFirestore.getInstance()
        .collection("users")
        .document(uid)
        .addSnapshotListener { snapshot, error ->
            if (error != null) {
                Log.e("Approval", "Error listening for approval", error)
                return@addSnapshotListener
            }

            val status = snapshot?.getString("status")
            when (status) {
                "approved" -> {
                    // Grant app access
                    navigateToMainApp()
                }
                "rejected" -> {
                    val reason = snapshot?.getString("rejectionReason")
                    showRejectionDialog(reason)
                }
                "pending" -> {
                    // Still waiting for approval
                    showPendingApprovalDialog()
                }
            }
        }
}
```

### Template Status Monitoring

```kotlin
fun listenForTemplateApproval(templateId: String) {
    FirebaseFirestore.getInstance()
        .collection("templates")
        .document(templateId)
        .addSnapshotListener { snapshot, error ->
            if (error != null) {
                Log.e("Template", "Error listening for template status", error)
                return@addSnapshotListener
            }

            val status = snapshot?.getString("status")
            when (status) {
                "approved" -> {
                    // Template is approved, can be used
                    enableTemplateForUse(templateId)
                }
                "rejected" -> {
                    val reason = snapshot?.getString("rejectionReason")
                    showTemplateRejectionDialog(reason)
                }
                "pending", "draft" -> {
                    // Still under review or being edited
                    showTemplatePendingStatus()
                }
            }
        }
}
```

### Activity Logging

When users perform actions in your app, log them to the `activity` collection:

```kotlin
fun logActivity(
    type: String,
    description: String,
    userId: String,
    userName: String,
    metadata: Map<String, Any>? = null
) {
    val activityData = hashMapOf(
        "type" to type,
        "description" to description,
        "userId" to userId,
        "userName" to userName,
        "timestamp" to FieldValue.serverTimestamp(),
        "metadata" to (metadata ?: mapOf())
    )

    FirebaseFirestore.getInstance()
        .collection("activity")
        .add(activityData)
        .addOnFailureListener { exception ->
            Log.e("Activity", "Error logging activity", exception)
        }
}
```

## Testing Checklist

1. ✅ User registration from Android appears in admin User Requests page
2. ✅ Approving user in admin updates Firestore and Android app detects it
3. ✅ Templates with status "draft" or "pending" appear in admin Templates page
4. ✅ Approving template updates status and Android app can see approved templates
5. ✅ Form submissions appear in admin Submissions page
6. ✅ Submission details show all form data, attachments, and location
7. ✅ Activity logs track all admin actions

## Security Rules

Ensure your Firestore security rules allow:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own data and create their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read approved templates
    match /templates/{templateId} {
      allow read: if request.auth != null && resource.data.status == 'approved';
      allow create: if request.auth != null;
    }
    
    // Users can create submissions
    match /formSubmissions/{submissionId} {
      allow read, write: if request.auth != null;
    }
    
    // Activity logs are readable by authenticated users
    match /activity/{activityId} {
      allow read: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **User not appearing in admin panel**: Ensure the user document is created in the `users` collection with `status: "pending"`

2. **Templates not showing**: Check that templates have `status: "draft"` or `status: "pending"`

3. **Submissions not visible**: Verify collection name is `formSubmissions` (not `submissions`)

4. **Permission denied errors**: Check Firestore security rules and ensure user is authenticated

### Debug Tips

- Use Firebase Console to verify data structure
- Check browser console for JavaScript errors
- Use Android Logcat for mobile app debugging
- Verify Firebase project ID matches in both apps

## Support

If you encounter issues:
1. Check Firebase Console for data structure
2. Verify collection names match exactly
3. Ensure all required fields are present
4. Check security rules allow the operations

