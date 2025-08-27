# 1) Frontend - Initial

## Context
I want to create an agentic penetration testing web application that helps profeccionals do penetration testing with the help of LLMs.
The LLM will have access to a Kali Linux machine and the UI will have terminal looking section on one side and a chat window on the other side.
The LLM will take queries from the user and then decide what commands to execute on the Kali machine.
The commands and the output on the terminal section should be visible and streamed just like as it would on a Kali or any other linux machine.

## What to build
The want only the frontend part of the application for now that will include the following:
- A Landing page
- A signup and login page with minimal form fields
- A sample dashboard with fake inputs and outputs functionality

## Note:
- The UI should look modern and dark like a hacking environment
- Use whatever necessary frameworks like angular to achieve what we want
- Make fake functionalities and functions to simulate backend
- Code should be modular and have good readibility with comments
- The Name of the app for now is ChaosAI

# 2) New Chat
Chect the Readme.md file to understand what this application is
Check other files that seem necessary to understand how application is built and more context

# 3) API Integration
The API Testing_Guide has few backend endpoints that I want to integrate. Fow now I want the following five auth endpoints to be integrated with the application:

- Health Check (/health) -> Landing Page
- User registration (/auth/signup) -> Signup page
- User login (/auth/login) -> Signin page
- Refresh Token (/auth/refresh) -> Dashboard
- Logout (/auth/logout) -> Dashboard

Keep in mind the following notes:
- Make the code reusable, modular and with proper comments
- Save the user login response i.e. the tokens for further use
- No need to integrate any other endpoints for now
