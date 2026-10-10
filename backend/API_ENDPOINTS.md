# Retentio — Backend API Endpoints
**Total Endpoints: 58**  
**Database: PostgreSQL (via Docker)**  
**Auth: JWT Bearer Token on all routes except /api/auth/***

---

## 🔐 AUTH MODULE

### 1. POST /api/auth/login
**Input:**
```json
{ "email": "darshan@retentio.in", "password": "Admin@1234" }
```
**Output:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_admin",
    "name": "Darshan Shah",
    "email": "darshan@retentio.in",
    "phone": "+91 98765 43210",
    "role": "admin",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Darshan",
    "designation": "Founder & CEO"
  }
}
```

---

### 2. POST /api/auth/signup
**Input:**
```json
{
  "fullName": "Darshan Shah",
  "email": "darshan@retentio.in",
  "password": "Admin@1234",
  "companyName": "Retentio Agency"
}
```
**Output:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "user_admin", "name": "Darshan Shah", "role": "admin", ... }
}
```

---

### 3. POST /api/auth/logout
**Input:** None (Bearer token in header)  
**Output:**
```json
{ "success": true }
```

---

### 4. POST /api/auth/forgot-password
**Input:**
```json
{ "email": "darshan@retentio.in" }
```
**Output:**
```json
{ "message": "Password reset link sent to darshan@retentio.in" }
```

---

## 👥 USERS / TEAM MODULE

### 5. GET /api/users
**Input:** Query: `?role=team&search=Arjun`  
**Output:**
```json
[
  {
    "id": "user_team1",
    "name": "Arjun Patel",
    "email": "arjun@retentio.in",
    "phone": "+91 99001 12345",
    "role": "team",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun",
    "designation": "Account Manager",
    "assignedBrandIds": ["brand_apex", "brand_nova"]
  }
]
```

---

### 6. GET /api/users/:id
**Input:** `GET /api/users/user_team1`  
**Output:** Single user object (same shape as above)

---

### 7. POST /api/users
*(Admin only — invite team member)*  
**Input:**
```json
{
  "name": "Sneha Joshi",
  "email": "sneha@retentio.in",
  "phone": "+91 98001 77665",
  "designation": "GST Analyst",
  "role": "team"
}
```
**Output:**
```json
{
  "id": "user_1749123456789",
  "name": "Sneha Joshi",
  "email": "sneha@retentio.in",
  "phone": "+91 98001 77665",
  "role": "team",
  "designation": "GST Analyst",
  "assignedBrandIds": [],
  "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha"
}
```

---

### 8. PATCH /api/users/:id
**Input:**
```json
{ "name": "Arjun R. Patel", "phone": "+91 99001 99999" }
```
**Output:** Updated user object

---

### 9. PATCH /api/users/:id/deactivate
*(Admin only)*  
**Input:** None (just the ID in URL)  
**Output:**
```json
{ "success": true, "userId": "user_team1" }
```

---

## 🏢 BRANDS / CLIENTS MODULE

### 10. GET /api/brands
**Input:** Query: `?status=Active&search=Apex`  
**Output:**
```json
[
  {
    "id": "brand_apex",
    "name": "Apex Media Pvt Ltd",
    "ownerName": "Vikram Seth",
    "mobile": "+91 99880 11223",
    "email": "accounts@apexmedia.com",
    "billingAddress": "402, Kailash Business Park, Vikhroli West",
    "state": "Maharashtra",
    "pincode": "400083",
    "gstNumber": "27AABCA1234F1Z8",
    "pan": "AABCA1234F",
    "serviceDetails": "Monthly GST Filing, TDS Returns, Audit",
    "monthlyFee": 15000,
    "billingCycleDay": 1,
    "onboardingDate": "2026-01-15",
    "notes": "Key account - priority client",
    "status": "Active",
    "assignedMemberIds": ["user_team1", "user_hr"],
    "lastActivityDate": "2026-10-01",
    "lastPaymentDate": "2026-10-01",
    "documents": []
  }
]
```

---

### 11. GET /api/brands/:id
**Input:** `GET /api/brands/brand_apex`  
**Output:** Single brand object (same shape as above)

---

### 12. POST /api/brands
*(Admin/HR only)*  
**Input:**
```json
{
  "name": "Zenith Exports Pvt Ltd",
  "ownerName": "Anita Rao",
  "mobile": "+91 98765 11100",
  "email": "anita@zenithexports.com",
  "billingAddress": "12, MIDC Industrial Area, Andheri East",
  "state": "Maharashtra",
  "pincode": "400093",
  "gstNumber": "27AACCE4321K1ZP",
  "pan": "AACCE4321K",
  "serviceDetails": "Monthly Retainer - Accounting & Compliance",
  "monthlyFee": 22000,
  "billingCycleDay": 5,
  "notes": "Referred by Apex Media"
}
```
**Output:**
```json
{
  "id": "brand_1749200000001",
  "name": "Zenith Exports Pvt Ltd",
  "ownerName": "Anita Rao",
  "status": "Active",
  "onboardingDate": "2026-10-05",
  "assignedMemberIds": [],
  "lastActivityDate": "2026-10-05",
  "lastPaymentDate": "2026-10-05",
  "documents": [],
  ...all other fields
}
```

---

### 13. PATCH /api/brands/:id
**Input:**
```json
{ "monthlyFee": 18000, "notes": "Rate revised Oct 2026", "status": "Paused" }
```
**Output:** Updated brand object

---

### 14. PATCH /api/brands/:id/assign-members
**Input:**
```json
{ "memberIds": ["user_team1", "user_hr"] }
```
**Output:**
```json
{
  "id": "brand_apex",
  "assignedMemberIds": ["user_team1", "user_hr"],
  ...rest of brand object
}
```

---

### 15. PATCH /api/brands/:id/log-activity
**Input:**
```json
{ "actionName": "Monthly review call completed" }
```
**Output:**
```json
{ "id": "brand_apex", "lastActivityDate": "2026-10-05", ...rest of brand }
```

---

### 16. PATCH /api/brands/:id/churn
**Input:** None  
**Output:**
```json
{ "id": "brand_apex", "status": "Churned", ...rest of brand }
```

---

### 17. PATCH /api/brands/:id/snooze-retention
**Input:** None  
**Output:**
```json
{ "id": "brand_apex", "lastActivityDate": "2026-10-12", ...rest of brand }
```
*(Adds 7 days to lastActivityDate)*

---

### 18. POST /api/brands/:id/documents
**Input:** `multipart/form-data` → `file` (binary) + `name: "GST Certificate"` + `type: "PDF"`  
**Output:**
```json
{
  "id": "doc_1749200000001",
  "name": "GST Certificate",
  "size": "245 KB",
  "uploadDate": "2026-10-05",
  "type": "PDF"
}
```

---

## 📁 PROJECTS MODULE

### 19. GET /api/projects
**Input:** Query: `?brandId=brand_apex`  
**Output:**
```json
[
  {
    "id": "proj_apex_q4",
    "brandId": "brand_apex",
    "name": "Q4 Statutory Audit & Compliance",
    "scope": "Full statutory audit including P&L, Balance Sheet verification",
    "startDate": "2026-10-01",
    "endDate": "2026-12-31",
    "status": "In progress",
    "assignedMemberIds": ["user_team1"],
    "billingAmount": 45000,
    "progress": 30
  }
]
```

---

### 20. POST /api/projects
**Input:**
```json
{
  "brandId": "brand_apex",
  "name": "Q4 Statutory Audit & Compliance",
  "scope": "Full statutory audit including P&L, Balance Sheet verification",
  "startDate": "2026-10-01",
  "endDate": "2026-12-31",
  "status": "Not started",
  "assignedMemberIds": ["user_team1"],
  "billingAmount": 45000
}
```
**Output:**
```json
{ "id": "proj_1749200000001", "progress": 0, ...all input fields }
```

---

### 21. PATCH /api/projects/:id
**Input:**
```json
{ "status": "Completed", "progress": 100 }
```
**Output:** Updated project object

---

## ✅ TASKS MODULE

### 22. GET /api/tasks
**Input:** Query: `?brandId=brand_apex&assigneeId=user_team1&status=In Progress`  
**Output:**
```json
[
  {
    "id": "task_001",
    "projectId": "proj_apex_q4",
    "brandId": "brand_apex",
    "title": "Verify GSTR-3B monthly return for September",
    "description": "Cross-check GSTR-2B auto-populated data with purchase register",
    "assigneeId": "user_team1",
    "dueDate": "2026-10-15",
    "priority": "High",
    "status": "In Progress"
  }
]
```

---

### 23. POST /api/tasks
**Input:**
```json
{
  "projectId": "proj_apex_q4",
  "brandId": "brand_apex",
  "title": "Verify GSTR-3B monthly return for September",
  "description": "Cross-check GSTR-2B auto-populated data with purchase register",
  "assigneeId": "user_team1",
  "dueDate": "2026-10-15",
  "priority": "High",
  "status": "To Do"
}
```
**Output:**
```json
{ "id": "task_1749200000001", ...all input fields }
```

---

### 24. PATCH /api/tasks/:id/status
**Input:**
```json
{ "status": "Completed" }
```
**Output:** Updated task object

---

### 25. PATCH /api/tasks/:id
**Input:**
```json
{ "dueDate": "2026-10-20", "priority": "Urgent" }
```
**Output:** Updated task object

---

## 🧾 INVOICES MODULE

### 26. GET /api/invoices
**Input:** Query: `?brandId=brand_apex&status=Sent&search=INV-2026`  
**Output:**
```json
[
  {
    "id": "inv_001",
    "invoiceNumber": "INV-2026-0042",
    "brandId": "brand_apex",
    "brandName": "Apex Media Pvt Ltd",
    "issueDate": "2026-10-01",
    "dueDate": "2026-10-15",
    "items": [
      {
        "id": "item_001",
        "description": "Monthly Retainer - GST Filing & Compliance",
        "hsnSac": "998231",
        "quantity": 1,
        "unitPrice": 15000,
        "amount": 15000
      }
    ],
    "subtotal": 15000,
    "hasGst": true,
    "gstType": "CGST_SGST",
    "cgstAmount": 1350,
    "sgstAmount": 1350,
    "igstAmount": 0,
    "totalAmount": 17700,
    "paidAmount": 0,
    "status": "Sent",
    "notes": "Due by 15th October 2026",
    "paymentDate": null,
    "paymentMode": null,
    "razorpayPaymentId": null
  }
]
```

---

### 27. GET /api/invoices/:id
**Input:** `GET /api/invoices/inv_001`  
**Output:** Single invoice object (same shape as above)

---

### 28. POST /api/invoices
**Input:**
```json
{
  "brandId": "brand_apex",
  "brandName": "Apex Media Pvt Ltd",
  "issueDate": "2026-10-01",
  "dueDate": "2026-10-15",
  "items": [
    {
      "description": "Monthly Retainer - GST Filing & Compliance",
      "hsnSac": "998231",
      "quantity": 1,
      "unitPrice": 15000,
      "amount": 15000
    }
  ],
  "subtotal": 15000,
  "hasGst": true,
  "gstType": "CGST_SGST",
  "cgstAmount": 1350,
  "sgstAmount": 1350,
  "igstAmount": 0,
  "totalAmount": 17700,
  "notes": "Due by 15th October 2026",
  "isRecurring": false
}
```
**Output:**
```json
{
  "id": "inv_1749200000001",
  "invoiceNumber": "INV-2026-0043",
  "paidAmount": 0,
  "status": "Sent",
  ...all input fields
}
```

---

### 29. PATCH /api/invoices/:id/status
**Input:**
```json
{ "status": "Cancelled" }
```
**Output:** Updated invoice object

---

### 30. GET /api/invoices/:id/pdf
**Input:** `GET /api/invoices/inv_001/pdf`  
**Output:** `Content-Type: application/pdf` — binary PDF stream

---

## 🔄 RECURRING INVOICES MODULE

### 31. GET /api/recurring-invoices
**Input:** None  
**Output:**
```json
[
  {
    "id": "rec_001",
    "invoiceId": "inv_001",
    "brandId": "brand_apex",
    "brandName": "Apex Media Pvt Ltd",
    "amount": 17700,
    "frequency": "Monthly",
    "nextDueDate": "2026-11-01",
    "status": "Active"
  }
]
```

---

### 32. POST /api/recurring-invoices
**Input:**
```json
{ "invoiceId": "inv_001", "frequency": "Monthly" }
```
**Output:**
```json
{
  "id": "rec_1749200000001",
  "invoiceId": "inv_001",
  "frequency": "Monthly",
  "nextDueDate": "2026-11-01",
  "status": "Active"
}
```

---

### 33. PATCH /api/recurring-invoices/:id
**Input:**
```json
{ "status": "Paused" }
```
**Output:** Updated recurring schedule object

---

### 34. DELETE /api/recurring-invoices/:id
**Input:** None  
**Output:**
```json
{ "success": true }
```

---

## 💰 PAYMENTS MODULE

### 35. GET /api/payments
**Input:** Query: `?brandId=brand_apex&invoiceId=inv_001`  
**Output:**
```json
[
  {
    "id": "pay_001",
    "invoiceId": "inv_001",
    "brandId": "brand_apex",
    "brandName": "Apex Media Pvt Ltd",
    "amount": 17700,
    "paymentDate": "2026-10-05",
    "mode": "Bank Transfer",
    "referenceNo": "UTR_AXIS_99812401",
    "status": "Success",
    "proofUrl": null
  }
]
```

---

### 36. POST /api/payments
*(Record manual/offline payment)*  
**Input:**
```json
{
  "invoiceId": "inv_001",
  "brandId": "brand_apex",
  "brandName": "Apex Media Pvt Ltd",
  "amount": 17700,
  "paymentDate": "2026-10-05",
  "mode": "Bank Transfer",
  "referenceNo": "UTR_AXIS_99812401"
}
```
**Output:**
```json
{
  "id": "pay_1749200000001",
  "status": "Success",
  "invoice": { "id": "inv_001", "paidAmount": 17700, "status": "Paid" },
  "brand": { "id": "brand_apex", "lastPaymentDate": "2026-10-05" },
  ...payment fields
}
```

---

### 37. POST /api/payments/razorpay-initiate
**Input:**
```json
{ "invoiceId": "inv_001" }
```
**Output:**
```json
{
  "razorpayOrderId": "order_OAwS9NnOHdl3KP",
  "amount": 1770000,
  "currency": "INR",
  "keyId": "rzp_live_xxxxxxxxxx"
}
```
*(amount is in paise — multiply by 100)*

---

### 38. POST /api/payments/razorpay-verify
**Input:**
```json
{
  "razorpayOrderId": "order_OAwS9NnOHdl3KP",
  "razorpayPaymentId": "pay_OAwSABCDEFGHIJ",
  "razorpaySignature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e57fa222",
  "invoiceId": "inv_001"
}
```
**Output:**
```json
{
  "id": "pay_1749200000002",
  "mode": "Razorpay UPI",
  "status": "Success",
  "razorpayPaymentId": "pay_OAwSABCDEFGHIJ",
  ...rest of payment object
}
```

---

## 📊 EXPENSES MODULE (Admin only)

### 39. GET /api/expenses
**Input:** Query: `?brandId=brand_apex&category=Salary`  
**Output:**
```json
[
  {
    "id": "exp_001",
    "category": "Salary",
    "amount": 45000,
    "date": "2026-10-01",
    "paymentMode": "Bank Transfer",
    "note": "October salary - Arjun Patel",
    "receiptUrl": null,
    "brandId": null,
    "isRecurring": true
  }
]
```

---

### 40. POST /api/expenses
*(Admin only)*  
**Input:**
```json
{
  "category": "Tools & Software",
  "amount": 2500,
  "date": "2026-10-05",
  "paymentMode": "Corporate Card",
  "note": "Notion workspace - October",
  "brandId": null,
  "isRecurring": true
}
```
**Output:**
```json
{ "id": "exp_1749200000001", ...all input fields }
```

---

## 📅 MEETINGS MODULE

### 41. GET /api/meetings
**Input:** Query: `?brandId=brand_apex`  
**Output:**
```json
[
  {
    "id": "meet_001",
    "title": "Monthly GST & Tax Audit Review",
    "brandId": "brand_apex",
    "leadId": null,
    "date": "2026-10-10",
    "time": "11:00 AM",
    "durationMinutes": 60,
    "linkOrLocation": "https://meet.google.com/abc-defg-hij",
    "attendeeIds": ["user_admin", "user_team1"],
    "notes": "Review Q3 GSTR filings and plan for Q4",
    "reminderSent": false
  }
]
```

---

### 42. POST /api/meetings
**Input:**
```json
{
  "title": "Monthly GST & Tax Audit Review",
  "brandId": "brand_apex",
  "leadId": null,
  "date": "2026-10-10",
  "time": "11:00 AM",
  "durationMinutes": 60,
  "linkOrLocation": "https://meet.google.com/abc-defg-hij",
  "attendeeIds": ["user_admin", "user_team1"],
  "notes": "Review Q3 GSTR filings and plan for Q4"
}
```
**Output:**
```json
{ "id": "meet_1749200000001", "reminderSent": false, ...all input fields }
```

---

### 43. PATCH /api/meetings/:id
**Input:**
```json
{ "time": "02:00 PM", "notes": "Rescheduled to afternoon" }
```
**Output:** Updated meeting object

---

### 44. DELETE /api/meetings/:id
**Output:**
```json
{ "success": true }
```

---

## 🎯 LEADS MODULE

### 45. GET /api/leads
**Input:** Query: `?stage=Proposal`  
**Output:**
```json
[
  {
    "id": "lead_001",
    "name": "Anand Mahindra",
    "company": "ZenTech Logistics",
    "contact": "Director",
    "email": "anand@zentech.in",
    "phone": "+91 98110 00000",
    "source": "Referral",
    "stage": "Proposal",
    "value": 18000,
    "followUpDate": "2026-10-12",
    "notes": "Interested in monthly GST + payroll package"
  }
]
```

---

### 46. POST /api/leads
**Input:**
```json
{
  "name": "Anand Mahindra",
  "company": "ZenTech Logistics",
  "contact": "Director",
  "email": "anand@zentech.in",
  "phone": "+91 98110 00000",
  "source": "Referral",
  "stage": "New",
  "value": 18000,
  "followUpDate": "2026-10-12",
  "notes": "Interested in monthly GST + payroll package"
}
```
**Output:**
```json
{ "id": "lead_1749200000001", ...all input fields }
```

---

### 47. PATCH /api/leads/:id/stage
**Input:**
```json
{ "stage": "Won" }
```
**Output:** Updated lead object

---

### 48. POST /api/leads/:id/convert
*(Convert Won lead → Brand)*  
**Input:** None  
**Output:**
```json
{
  "brand": {
    "id": "brand_1749200000002",
    "name": "ZenTech Logistics",
    "ownerName": "Anand Mahindra",
    "status": "Active",
    "onboardingDate": "2026-10-05",
    ...
  },
  "lead": {
    "id": "lead_001",
    "stage": "Won",
    ...
  }
}
```

---

## 🔔 NOTIFICATIONS MODULE

### 49. GET /api/notifications
**Input:** Query: `?unreadOnly=true`  
**Output:**
```json
[
  {
    "id": "notif_001",
    "type": "payment",
    "title": "💰 Payment Received: ₹17,700",
    "message": "Apex Media Pvt Ltd cleared payment via Bank Transfer.",
    "timestamp": "2026-10-05 10:30:00",
    "isRead": false,
    "linkModule": "invoices",
    "brandId": "brand_apex",
    "recipientRoles": ["admin", "hr"],
    "targetUserId": null
  }
]
```

---

### 50. PATCH /api/notifications/:id/read
**Input:** None  
**Output:**
```json
{ "id": "notif_001", "isRead": true, ...rest of notification }
```

---

### 51. PATCH /api/notifications/read-all
**Input:** None  
**Output:**
```json
{ "success": true, "count": 7 }
```

---

## 💬 CHAT MODULE

### 52. GET /api/conversations
**Input:** None (filtered by current user's role + assignments server-side)  
**Output:**
```json
[
  {
    "id": "conv_apex",
    "type": "brand",
    "title": "Apex Media Pvt Ltd",
    "brandId": "brand_apex",
    "participantIds": ["user_admin", "user_team1", "user_brand_apex"],
    "lastMessage": "Please find the updated GSTR-3B attached",
    "lastMessageTime": "2026-10-04 4:30 PM",
    "unreadCount": 2
  }
]
```

---

### 53. GET /api/conversations/:id/messages
**Input:** `GET /api/conversations/conv_apex/messages`  
**Output:**
```json
[
  {
    "id": "msg_001",
    "conversationId": "conv_apex",
    "senderId": "user_team1",
    "senderName": "Arjun Patel",
    "senderRole": "team",
    "text": "Please find the updated GSTR-3B attached",
    "timestamp": "2026-10-04 4:30 PM",
    "attachments": [
      { "name": "GSTR3B_Sep2026.pdf", "size": "1.2 MB", "url": "/files/gstr3b.pdf", "type": "pdf" }
    ],
    "readBy": ["user_team1", "user_admin"]
  }
]
```

---

### 54. POST /api/conversations/:id/messages
**Input (JSON):**
```json
{
  "text": "Thanks Arjun, reviewed and approved!",
  "attachments": []
}
```
**Output:**
```json
{
  "id": "msg_1749200000001",
  "conversationId": "conv_apex",
  "senderId": "user_admin",
  "senderName": "Darshan Shah",
  "senderRole": "admin",
  "text": "Thanks Arjun, reviewed and approved!",
  "timestamp": "2026-10-05 10:45 AM",
  "attachments": [],
  "readBy": ["user_admin"]
}
```

---

### 55. POST /api/conversations
**Input:**
```json
{
  "type": "direct",
  "title": "Darshan ↔ Arjun",
  "brandId": null,
  "participantIds": ["user_admin", "user_team1"]
}
```
**Output:**
```json
{ "id": "conv_1749200000001", "unreadCount": 0, ...all input fields }
```

---

## ⚙️ SETTINGS MODULE

### 56. GET /api/settings
**Input:** None  
**Output:**
```json
{
  "companyName": "Retentio Agency",
  "companyEmail": "hello@retentio.in",
  "companyPhone": "+91 98765 43210",
  "companyAddress": "1204, Lodha Supremus, Thane West, Maharashtra - 400601",
  "companyGst": "27AABCR1234F1Z5",
  "companyPan": "AABCR1234F",
  "companyState": "Maharashtra",
  "defaultGstRate": 18,
  "defaultHsnSac": "998231",
  "invoicePrefix": "INV-2026-",
  "bankAccountName": "Retentio Agency LLP",
  "bankAccountNumber": "000905012345678",
  "bankIfsc": "HDFC0001234",
  "bankBranch": "Thane West",
  "upiId": "retentio@hdfcbank",
  "razorpayKeyId": "rzp_live_xxxxxxxxxx",
  "razorpayConnected": true,
  "subscriptionPlan": {
    "name": "Agency Pro",
    "price": 2999,
    "billingCycle": "Monthly",
    "renewalDate": "2026-11-01",
    "status": "Active"
  },
  "retentionThresholdDays": 30,
  "whatsappClickToShareEnabled": true
}
```

---

### 57. PATCH /api/settings
*(Admin only)*  
**Input:**
```json
{
  "retentionThresholdDays": 15,
  "invoicePrefix": "INV-2026-",
  "whatsappClickToShareEnabled": true
}
```
**Output:** Updated full settings object

---

## 🗓️ HOLIDAYS MODULE

### 58. GET /api/holidays
**Output:**
```json
[
  { "id": "hol_001", "title": "Diwali", "date": "2026-10-20", "type": "National" },
  { "id": "hol_002", "title": "Dussehra", "date": "2026-10-02", "type": "National" },
  { "id": "hol_003", "title": "Agency Founders Day", "date": "2026-11-15", "type": "Agency Custom" }
]
```

---

### 59. POST /api/holidays
*(Admin only)*  
**Input:**
```json
{ "title": "Agency Founders Day", "date": "2026-11-15", "type": "Agency Custom" }
```
**Output:**
```json
{ "id": "hol_1749200000001", "title": "Agency Founders Day", "date": "2026-11-15", "type": "Agency Custom" }
```

---

### 60. DELETE /api/holidays/:id
**Output:**
```json
{ "success": true }
```

---

## 📋 AUDIT LOGS MODULE

### 61. GET /api/audit-logs
*(Admin only)*  
**Input:** Query: `?limit=20&offset=0`  
**Output:**
```json
[
  {
    "id": "aud_001",
    "timestamp": "2026-10-05 10:30:22",
    "actorName": "Darshan Shah",
    "actorRole": "ADMIN",
    "action": "Invoice Generated",
    "details": "Created INV-2026-0042 for Apex Media Pvt Ltd totaling ₹17,700",
    "ipAddress": "103.21.124.50"
  }
]
```

---

## 🗄️ DATABASE SETUP (PostgreSQL via Docker)

Add these to `docker-compose.yml`:

```yaml
db:
  image: postgres:16-alpine
  container_name: retentio-db
  ports:
    - "5432:5432"
  environment:
    POSTGRES_USER: retentio
    POSTGRES_PASSWORD: retentio123
    POSTGRES_DB: retentio_db
  volumes:
    - pgdata:/var/lib/postgresql/data
  restart: unless-stopped

volumes:
  pgdata:
```

**Connection string for backend:**
```
DATABASE_URL=postgresql://retentio:retentio123@db:5432/retentio_db
```

---

## 📊 ENDPOINTS SUMMARY

| Module | Endpoints | Count |
|---|---|---|
| Auth | login, signup, logout, forgot-password | 4 |
| Users / Team | list, get, create, update, deactivate | 5 |
| Brands / Clients | list, get, create, update, assign, log-activity, churn, snooze, upload-doc | 9 |
| Projects | list, create, update | 3 |
| Tasks | list, create, update-status, update | 4 |
| Invoices | list, get, create, update-status, pdf | 5 |
| Recurring Invoices | list, create, update, delete | 4 |
| Payments | list, record, razorpay-initiate, razorpay-verify | 4 |
| Expenses | list, create | 2 |
| Meetings | list, create, update, delete | 4 |
| Leads | list, create, update-stage, convert | 4 |
| Notifications | list, mark-read, mark-all-read | 3 |
| Chat | conversations, messages, send, create-conv | 4 |
| Settings | get, update | 2 |
| Holidays | list, create, delete | 3 |
| Audit Logs | list | 1 |
| **TOTAL** | | **61** |
