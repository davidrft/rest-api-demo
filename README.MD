# REST API Demo

This repository showcases a sample RESTful API implemented in Node.js using MongoDB as its database.

The API's purpose is to serve posts and authenticate users to a frontend.

## Routes
| METHOD  | URL
|-------|------
| PUT   | /auth/signup
| POST  | /auth/login 
| GET   | /auth/status
| PUT   | /auth/status
| GET   | /feed/posts
| POST  | /feed/post
| GET   | /feed/post/:id
| PUT   | /feed/post/:id
| DELETE| /feed/post:id