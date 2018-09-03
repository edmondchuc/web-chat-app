# Web Chat App

## Current task
### List all users in _group_ page for all users
* Admins will have a button to remove users
* Admins will have an input field to add any user
* Adding a user to the group simply adds them to the immutable _general_ channel

### Issue
* When creating new groups/channels, also add them to users who are a group admin

### List all users in _channel_ page for all users
* Admins will have a button to remove users
* Admins will ahve an input field to add any user

## Desirables
* View all users in the system in dashboard if user is admin

## Modules
* `npm init`
* `npm install express`
* `npm install socket.io`
* `npm install body-parser`

## Socket.IO Bug
* In `polyfill.ts`, add:
```javascript
(window as any).global = window;
```