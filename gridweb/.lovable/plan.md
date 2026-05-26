## Plan

### 1. Update Data Models
- Add `isInviteOnly`, `customQuestions` (array of {label, type}) to Event type
- Add `genderCategory` ('male'|'female'|'other') and gender-specific quotas to TicketTier
- Create `EventApplication` type for storing registration applications

### 2. Admin: Event Form Updates
- Add "Invite Only" toggle in Event Settings tab
- Add dynamic custom questions builder (add/remove questions with label + type)
- Add gender category + gender quota fields to ticket tier form

### 3. Client: Application Flow
- On EventDetails, if `isInviteOnly`, show "Apply to Join" instead of ticket selection
- Application form: name, gender, age, phone (prepopulated), custom question answers, "why do you want to join"
- Store applications in `events/{eventId}/applications` subcollection

### 4. Admin: Applications Review Page
- New page listing all applications for an event with filtering
- Show applicant details, gender counts, custom answers
- Approve/reject buttons; approved sends in-app notification with event link

### 5. Invitation Flow
- Approved users get notification: "Congratulations - you're on the Grid for [event]"
- Notification links to event page where they can now purchase/confirm
- EventDetails checks if user has approved application before allowing checkout
- After successful payment, confirmation notification sent

### 6. Firestore Rules
- Applications: authenticated users can create for themselves, admins can read/update
