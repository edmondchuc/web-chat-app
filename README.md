# Web Chat App

## Current task
* Creating a JSON data and saving it to disk
* Check if the file of a user exists already
* If it exists and we're updating something, retrieve the data, and only change the property we're interested in and save it back to disk

## Installation
* `npm init`
* `npm install express`
* `npm install socket.io`

## Socket.IO Bug
* In `polyfill.ts`, add:
```javascript
(window as any).global = window;
```