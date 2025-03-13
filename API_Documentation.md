# API Documentation

## API Endpoints

### Authentication
- **POST /api/auth/login**
  - **Description**: User login.
  - **Request Body**:
    ```json
    {
      "username": "user123",
      "password": "yourpassword"
    }
    ```
  - **Response**:
    ```json
    {
      "message": "Login successful",
      "token": "jwt_token_here"
    }
    ```

- **POST /api/auth/signup**
  - **Description**: User registration.
  - **Request Body**:
    ```json
    {
      "username": "newuser",
      "password": "yourpassword",
      "email": "user@example.com"
    }
    ```
  - **Response**:
    ```json
    {
      "message": "User created successfully"
    }
    ```

- **POST /api/auth/forgot-password**
  - **Description**: Request password reset.
  - **Request Body**:
    ```json
    {
      "email": "user@example.com"
    }
    ```
  - **Response**:
    ```json
    {
      "message": "Password reset link sent"
    }
    ```

- **POST /api/auth/reset-password**
  - **Description**: Reset user password.
  - **Request Body**:
    ```json
    {
      "token": "reset_token",
      "newPassword": "newpassword"
    }
    ```
  - **Response**:
    ```json
    {
      "message": "Password reset successful"
    }
    ```

- **POST /api/auth/logout**
  - **Description**: User logout.
  - **Response**:
    ```json
    {
      "message": "Logout successful"
    }
    ```

### User Management
- **GET /api/user/search**
  - **Description**: Search for users.
  - **Query Parameters**: `username`
  - **Response**:
    ```json
    [
      {
        "username": "user123",
        "email": "user@example.com"
      }
    ]
    ```

- **POST /api/user/friend-request**
  - **Description**: Send a friend request.
  - **Request Body**:
    ```json
    {
      "toUsername": "friendUser"
    }
    ```
  - **Response**:
    ```json
    {
      "message": "Friend request sent"
    }
    ```

- **POST /api/user/accept-request**
  - **Description**: Accept a friend request.
  - **Request Body**:
    ```json
    {
      "fromUsername": "friendUser"
    }
    ```
  - **Response**:
    ```json
    {
      "message": "Friend request accepted"
    }
    ```

- **POST /api/user/reject-request**
  - **Description**: Reject a friend request.
  - **Request Body**:
    ```json
    {
      "fromUsername": "friendUser"
    }
    ```
  - **Response**:
    ```json
    {
      "message": "Friend request rejected"
    }
    ```

- **GET /api/user/friends**
  - **Description**: List friends.
  - **Response**:
    ```json
    [
      {
        "username": "friendUser",
        "status": "accepted"
      }
    ]
    ```

### Messaging
- **POST /api/private-messages/send**
  - **Description**: Sends a private message.
  - **Request Body**:
    ```json
    {
      "fromUsername": "user123",
      "toUsername": "friendUser",
      "text": "Hello!",
      "image": "base64_image_string" // optional
    }
    ```
  - **Response**:
    ```json
    {
      "message": "Message sent",
      "data": {
        "_id": "message_id",
        "sender": "sender_id",
        "receiver": "receiver_id",
        "text": "Hello!",
        "imageUrl": null,
        "type": "text",
        "status": "sent"
      }
    }
    ```

- **GET /api/private-messages/:fromUsername/:toUsername**
  - **Description**: Retrieves messages between two users.
  - **Response**:
    ```json
    [
      {
        "_id": "message_id",
        "sender": "sender_id",
        "receiver": "receiver_id",
        "text": "Hello!",
        "imageUrl": null,
        "type": "text",
        "status": "seen",
        "createdAt": "timestamp"
      }
    ]
    ```

- **PUT /api/private-messages/seen/:messageId**
  - **Description**: Marks a message as seen.
  - **Request Body**:
    ```json
    {
      "userId": "receiver_id"
    }
    ```
  - **Response**:
    ```json
    {
      "message": "Message marked as seen",
      "messageId": "message_id",
      "status": "seen"
    }
    ```
- **POST /api/group-messages/create**
  - **Description**: Create a new group.
  - **Request Body**:
    ```json
    {
      "name": "Group Name",
      "members": ["user1", "user2"]
    }
    ```
  - **Response**:
    ```json
    {
      "message": "Group created",
      "groupId": "group_id"
    }
    ```

- **POST /api/group-messages/send**
  - **Description**: Send a message to a group.
  - **Request Body**:
    ```json
    {
      "groupId": "group_id",
      "senderId": "user_id",
      "text": "Hello Group!"
    }
    ```
  - **Response**:
    ```json
    {
      "message": "Group message sent"
    }
    ```

### Profile Management
- **GET /api/user/profile**
  - **Description**: Get user profile information.
  - **Response**:
    ```json
    {
      "username": "user123",
      "email": "user@example.com",
      "profileImage": "url_to_image"
    }
    ```

- **POST /api/user/profile/upload**
  - **Description**: Upload profile image.
  - **Request Body**: Form-data with image file.
  - **Response**:
    ```json
    {
      "message": "Profile image uploaded",
      "imageUrl": "url_to_image"
    }
    ```

## Socket API Functionality
- **User Online/Offline Notifications**
  - **Event**: `userOnline`
    - **Payload**: `{ "username": "user123" }`
  - **Event**: `userOffline`
    - **Payload**: `{ "username": "user123" }`
  
- **Private Messaging**
  - **Event**: `privateMessage`
    - **Payload**: 
    ```json
    {
      "senderUsername": "user123",
      "receiverUsername": "friendUser",
      "text": "Hello!"
    }
    ```

- **Call Handling** (if applicable)
  - (Include details if there are call-related socket events)
