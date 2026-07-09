# Role-Based Access Control (RBAC) Specification

StudySphere implements a custom Role-Based Access Control (RBAC) architecture to segregate actions among organization administrators, channel moderators, and general students or teachers.

---

## 1. User Roles

The platform recognizes three operational roles:

1. **Organization Creator (Org Admin):** The user who initializes the organization. Has global moderation controls across all child channels and modules within that organization.
2. **Channel Creator (Channel Admin):** A user who establishes a specific channel inside the organization. Has full control over channel configuration and quiz publication within that specific channel.
3. **Member (Student/User):** A user who enters the organization using an invite code. Can join channels, participate in chats, join video meets, and attempt quizzes.

---

## 2. Permission Matrix

| Feature Module | Action Operation | Org Creator | Channel Creator | Member |
| :--- | :--- | :---: | :---: | :---: |
| **Organizations** | Create new Organization | ✔ | ✔ | ✔ |
| | Join via Org Code | ✘ | ✘ | ✔ |
| | Leave Organization | ✘ | ✔ | ✔ |
| **Channels** | Create Channel in Organization | ✔ | ✔ | ✔ |
| | Join Channel | ✔ | ✔ | ✔ |
| | Rename Channel | ✔ | ✔ (Own channel only) | ✘ |
| | Leave Channel | ✔ | ✔ | ✔ |
| | Fetch Channel Members | ✔ | ✔ | ✔ |
| **Quizzes** | Create/Publish Quiz (AI/Manual) | ✔ | ✔ (Own channel only) | ✘ |
| | Stop/Close Active Quiz | ✔ | ✔ (Own channel only) | ✘ |
| | View Quizzes List | ✔ | ✔ | ✔ |
| | View Quiz Submissions & Grades | ✔ | ✔ | ✔ |
| | Attempt/Submit Quiz | ✘ (Restricted) | ✘ (Restricted if creator) | ✔ |
| **Real-time Chats** | View message history | ✔ | ✔ | ✔ |
| | Send Message / Share Document | ✔ | ✔ | ✔ |
| | Delete Message | ✔ (Own chat only) | ✔ (Own chat only) | ✔ (Own messages only) |
| **Video Meetings** | Join room / lobby | ✔ | ✔ | ✔ |
| | Toggle video/audio streams | ✔ | ✔ | ✔ |
| | Share screen | ✔ | ✔ | ✔ |
| **Analytics & LB** | View leaderboard rankings | ✔ | ✔ | ✔ |
| | View progress reports & charts | ✔ | ✔ | ✔ |

---

## 3. Strict Rules & Constraints (Source Code Logic)

StudySphere enforces critical rules in the service layer to prevent academic grading conflicts:

### A. Quiz Creation Guard
* **Rule:** A user can only write a quiz for a channel if they are the Organization Creator or the Channel Admin who created that specific channel.
* **Service check (`backend/services/quizService.js`):**
  ```javascript
  const isOrgCreator = org.admin_id.toString() === req.user._id.toString();
  const isChannelCreator = channel.admin_id.toString() === req.user._id.toString();
  if (!isOrgCreator && !isChannelCreator) {
    return "unauthorized";
  }
  ```

### B. Assessment Attempt Restrictions
* **Rule 1 (Org Creator Restriction):** Organization creators cannot attempt quizzes/assessments within their own organization.
* **Rule 2 (Quiz Creator Restriction):** Users cannot attempt a quiz that they created or published.
* **Service check (`backend/services/quizService.js`):**
  ```javascript
  // Org Creators cannot attempt quizzes inside their organization
  if (org.admin_id.toString() === req.user._id.toString()) {
    return "org_creator_restriction";
  }
  // Quiz Creators cannot attempt their own quiz
  if (quizDoc.createdBy && quizDoc.createdBy.toString() === req.user._id.toString()) {
    return "quiz_creator_restriction";
  }
  // Channel Admin cannot attempt if they are the quiz creator
  if (channel.admin_id.toString() === req.user._id.toString() && quizDoc.createdBy?.toString() === req.user._id.toString()) {
    return "quiz_creator_restriction";
  }
  ```

### C. Attempt Limit Guard
* **Rule:** Users cannot exceed the quiz's `maxAttempts` configuration.
* **Service check (`backend/services/quizService.js`):**
  ```javascript
  const userSubmittedQuizzes = await QuizUserMap.find({
    user_id: req.user._id,
    quiz_id,
  });
  const maxAttempts = quizDoc.maxAttempts || 1;
  if (userSubmittedQuizzes.length >= maxAttempts) {
    return "exists";
  }
  ```
