# PRD Tool - Testing Guide

## Application URLs
- **Frontend**: http://localhost:5173/
- **Backend API**: http://localhost:3001/
- **Backend Health**: http://localhost:3001/health

## Testing Steps

### 1. Initial Setup
1. Open http://localhost:5173/ in your browser
2. You should see the PRD Tool landing page
3. Click "View PRD Dashboard" button
4. You'll be logged in as John Doe (mock user)

### 2. Test PRD Dashboard
1. **View Stats**: Check the dashboard statistics (PRDs Created, Active Collaborators, etc.)
2. **Search**: Try searching for PRDs using the search box
3. **Filter**: Use the status dropdown to filter PRDs (Draft, Review, Approved, Archived)
4. **Create New**: Click the "Create New PRD" button (currently shows a placeholder)

### 3. Test PRD Editor
1. **Open a PRD**: Click on any PRD card to open it in the editor
2. **Edit Content**: The Monaco Editor will load with the PRD content
3. **Auto-save**: Make changes and wait 2 seconds - you'll see "Saving..." then a timestamp
4. **Manual Save**: Click the Save button to save immediately

### 4. Test Real-time Collaboration
1. **Open Same PRD in Multiple Tabs**: 
   - Open the same PRD in 2+ browser tabs/windows
   - You'll see the active user count increase
   - Connection indicator shows green dot when connected
2. **Cursor Tracking**: Move cursor in one tab (positions are tracked but not visualized yet)

### 5. Test AI Assistant (NEW!)
1. **Open AI Assistant**: 
   - Click the "AI Assistant" button in the editor header
   - A panel will slide in from the right

2. **Test Commands Without Selection**:
   - Type `@suggest` and press Enter
   - Type `@analyze` and press Enter
   - You'll get AI suggestions for the entire document

3. **Test Commands With Selection**:
   - Select some text in the editor
   - Open AI Assistant (selected text will be shown)
   - Try these commands:
     - `@update make this more technical`
     - `@expand with examples`
     - `@summarize in bullet points`
     - `@rewrite for executives`
     - `@analyze completeness`

4. **Apply Suggestions**:
   - Click "Apply" on any suggestion to insert it into the editor
   - For replacements, it will replace selected text
   - For additions, it will insert at cursor position

5. **Copy Suggestions**:
   - Click "Copy" to copy suggestion to clipboard
   - Button shows "Copied" confirmation

6. **Quick Commands**:
   - Use the command hint buttons for quick access
   - Commands autocomplete when you start typing @

### 6. Test WebSocket Connection
1. **Check Connection Status**: Look for the green/gray dot in the editor
2. **Disconnect/Reconnect**: 
   - Stop the backend server (`Ctrl+C` in terminal)
   - Connection indicator turns gray
   - Restart backend - it reconnects automatically

### 7. Mock Data PRDs
The following PRDs are available for testing:
- "AI-Powered Customer Support Chatbot" (DRAFT)
- "Mobile App Redesign" (REVIEW)
- "Payment Gateway Integration" (APPROVED)
- "Real-time Analytics Dashboard" (DRAFT)
- "User Authentication System" (APPROVED)

### Common Test Scenarios

#### Scenario 1: Content Improvement
1. Open "AI-Powered Customer Support Chatbot" PRD
2. Select the first paragraph
3. Use `@update add more technical details`
4. Apply the suggestion

#### Scenario 2: Document Analysis
1. Open any PRD
2. Use `@analyze` without selection
3. Review the completeness score and recommendations

#### Scenario 3: Multi-user Collaboration
1. Open same PRD in Chrome and Firefox
2. See both users in the active users list
3. Edit in one browser, save, and refresh the other

### Known Limitations (Mock Implementation)
- AI responses are simulated (not using real AI APIs)
- Database operations use in-memory mock data
- Email notifications are disabled
- File uploads are not implemented
- Real-time content sync requires manual refresh

### Troubleshooting
- **Backend not responding**: Check if backend is running on port 3001
- **WebSocket not connecting**: Check browser console for errors
- **AI commands not working**: Ensure backend is running and check network tab

## Next Steps for Production
1. Replace mock AI with real OpenAI/Anthropic integration
2. Set up PostgreSQL database
3. Implement authentication system
4. Add real-time operational transforms
5. Deploy to cloud infrastructure