# Development Log

## Next Steps

- System is incorrectly detecting RTL when the video is LTR sometimes. This messes up with both the static and flying start modes. Let's assume LTR to start with. Then when we place the

- Add a help button on the header that opens a modal where we'll link to a YouTube demo video. Will also provide a video download sample so users can test the platform without having their own sprint video. Can use modals to guide the user on what to do. Allow the user to turn off the modal for subsequent visits and store that in local storage but have the option to turn it back on so that it shows up every time they open the application.

- Embed a link to the demo video in the GitHub README.md and on the docs page.

- Create a separate branch for hosting and host the frontend and backend. Make sure all the settings and modifications are made so they can talk to each other. That would be cool. I'm thinking Firebase for the frontend and Fly or Render for the backend but open to suggestions. I want to use free tiers and have the frontend and backend running as seamlessly as possible without any interruptions.

- Play around with det_frequency = 1 in serverlessTest, then try it in a separate branch of the actual codebase and let's see how that affects performance and accuracy.

- Add link for frontend to Github repository.

## Future Work

- For hosting, can some automated hosting be done so that anytime that branch changes, both the frontend and backend redeploy? Github Actions and some function in the hosting platform.
- Take the codebase for your portfolio website, and turn it into something that reads the information from a database (like something from Firebase) so that we can modify information without having to re-deploy. Then add sprintlab to it. Or better yet, allow me to log in and update things with a rich-text editor. Or use VitePress with GitHub Actions?
- When done, consider create desktop version (Electron.js?) so that I don't have to upload anything. Find a way to run the application on the desktop and run the Python server on the laptop as well. Will have to figure out how to manage both seamlessly (web sockets)?
