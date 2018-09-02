# Web Chat App

## Current task
* Super admins and admins can see all the groups and channels.

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