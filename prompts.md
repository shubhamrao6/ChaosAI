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

# 2) Backend Endpoints

Now that we have the initial UI of the application, I want to create a REST API based backend for this application. Looking at all the current screens - Landing, Signup, Login, Dashboard, list out all the potential endpoints, their details, sample request and responses.